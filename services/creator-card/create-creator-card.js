/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
const validator = require('@app-core/validator');
const { ulid } = require('@app-core/randomness');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

function transformDocument(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
}

function isLetter(code) {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isNumber(code) {
  return code >= 48 && code <= 57;
}

function isHyphen(ch) {
  return ch === '-';
}

function isUnderscore(ch) {
  return ch === '_';
}

// ─── NEW: Check if character is alphanumeric ───
function isAlphanumeric(code) {
  return isLetter(code) || isNumber(code);
}

function isValidSlug(value) {
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    const code = ch.charCodeAt(0);
    if (!isLetter(code) && !isNumber(code) && !isHyphen(ch) && !isUnderscore(ch)) {
      return false;
    }
  }
  return true;
}

// ─── NEW: Check if access_code is alphanumeric ───
function isValidAccessCode(value) {
  if (value.length !== 6) {
    return false;
  }
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (!isAlphanumeric(code)) {
      return false;
    }
  }
  return true;
}

function randomSuffix(length) {
  const validChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i += 1) {
    const index = Math.floor(Math.random() * validChars.length);
    result += validChars[index];
  }
  return result;
}

function generateSlug(input) {
  const chars = String(input).toLowerCase();
  let slug = '';
  let previousWasHyphen = false;

  for (let i = 0; i < chars.length; i += 1) {
    const ch = chars[i];
    const code = ch.charCodeAt(0);
    const isWhitespace = ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';

    if (isLetter(code) || isNumber(code) || isUnderscore(ch)) {
      slug += ch;
      previousWasHyphen = false;
    } else if (isHyphen(ch) || isWhitespace) {
      if (!previousWasHyphen) {
        slug += '-';
        previousWasHyphen = true;
      }
    }
  }

  while (slug.startsWith('-')) {
    slug = slug.slice(1);
  }
  while (slug.endsWith('-')) {
    slug = slug.slice(0, -1);
  }

  return slug;
}

const spec = `root {
  title string<trim|lengthBetween:3,100>
  description? string<trim|maxLength:500>
  slug? string<trim|lowercase|lengthBetween:5,50>
  creator_reference string<trim|length:20>
  links[]? {
    title string<trim|lengthBetween:1,100>
    url string<trim|maxLength:200>
  }
  service_rates? {
    currency string<trim>
    rates[] {
      name string<trim|lengthBetween:3,100>
      description? string<trim|maxLength:250>
      amount number<min:1>
    }
  }
  status string(draft|published)
  access_type? string(public|private)
  access_code? string<trim|length:6>
}`;

const parsedSpec = validator.parse(spec);

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;

  try {
    // ─── MANUAL VALIDATION: Currency (uppercase + enum) ───
    if (data.service_rates && data.service_rates.currency) {
      data.service_rates.currency = data.service_rates.currency.toUpperCase();
      const validCurrencies = ['NGN', 'USD', 'GBP', 'GHS'];
      if (!validCurrencies.includes(data.service_rates.currency)) {
        throwAppError(
          `Currency must be one of ${validCurrencies.join(', ')}`,
          ERROR_CODE.VALIDATIONERR
        );
      }
    }

    // ─── MANUAL VALIDATION: Rate amounts must be integers ───
    if (data.service_rates && data.service_rates.rates) {
      for (let i = 0; i < data.service_rates.rates.length; i += 1) {
        const rate = data.service_rates.rates[i];
        if (!Number.isInteger(rate.amount)) {
          throwAppError(
            `Rate amount must be an integer, got ${rate.amount}`,
            ERROR_CODE.VALIDATIONERR
          );
        }
      }
    }

    // ─── MANUAL VALIDATION: Access code must be alphanumeric (NO REGEX) ───
    if (data.access_code && !isValidAccessCode(data.access_code)) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
    }

    // ─── Validate links ───
    if (data.links && data.links.length > 0) {
      for (let i = 0; i < data.links.length; i += 1) {
        const link = data.links[i];
        if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
          throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
        }
      }
    }

    // ─── Validate access rules ───
    const { access_type: accessType, access_code: accessCode } = data;

    if (accessType === 'private' && !accessCode) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.AC01);
    }

    if (accessType === 'public' && accessCode) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.AC05);
    }

    // ─── Slug Generation with proper collision handling ───
    let finalSlug;

    if (data.slug) {
      // Client-provided slug - validate and check for collisions
      if (!isValidSlug(data.slug)) {
        throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
      }

      finalSlug = data.slug;
      const existingCard = await CreatorCard.findOne({
        query: { slug: finalSlug },
        options: { session: options.session },
      });

      if (existingCard) {
        throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.SL02);
      }
    } else {
      // Auto-generated slug with proper loop
      const baseSlug = generateSlug(data.title);
      let currentSlug = baseSlug;

      // If base slug is too short (less than 5 chars), immediately add suffix
      if (currentSlug.length < 5) {
        const suffix = randomSuffix(6);
        currentSlug = `${currentSlug}-${suffix}`;
      }

      // Check if slug is taken and generate unique one if needed
      let existingCard = await CreatorCard.findOne({
        query: { slug: currentSlug },
        options: { session: options.session },
      });

      let attemptCount = 0;
      while (existingCard) {
        attemptCount += 1;
        if (attemptCount > 10) {
          throwAppError('Unable to generate unique slug', ERROR_CODE.APPERR);
        }

        const suffix = randomSuffix(6);
        const maxBaseLength = 50 - suffix.length - 1;
        const truncatedBase = currentSlug.slice(0, maxBaseLength);
        const cleanBase = truncatedBase.endsWith('-') ? truncatedBase.slice(0, -1) : truncatedBase;

        currentSlug = `${cleanBase}-${suffix}`;

        if (currentSlug.length > 50) {
          currentSlug = currentSlug.slice(0, 50);
        }

        existingCard = await CreatorCard.findOne({
          query: { slug: currentSlug },
          options: { session: options.session },
        });
      }

      finalSlug = currentSlug;
      data.slug = finalSlug;
    }

    // ─── Create card ───
    const card = await CreatorCard.create({
      ...data,
      _id: ulid(),
      status: data.status || 'draft',
      access_type: data.access_type || 'public',
      links: data.links || [],
      service_rates: data.service_rates || { currency: 'USD', rates: [] },
    });

    result = transformDocument(card);
  } catch (error) {
    appLogger.errorX(error, 'create-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = createCreatorCard;
