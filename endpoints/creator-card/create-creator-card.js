/* eslint-disable no-restricted-syntax */
const validator = require('@app-core/validator');
const { ulid } = require('@app-core/randomness');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

// Utility to transform document (from Chris's approach)
function transformDocument(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
}

// Slug utilities (from Chris's approach - handles underscores)
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

  // Clean up hyphens
  while (slug.startsWith('-')) {
    slug = slug.slice(1);
  }
  while (slug.endsWith('-')) {
    slug = slug.slice(0, -1);
  }

  // Generate random alphanumeric suffix (from Chris's approach)
  function randomSuffix(length) {
    const validChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i += 1) {
      const index = Math.floor(Math.random() * validChars.length);
      result += validChars[index];
    }
    return result;
  }

  // Ensure minimum length of 5 (from Chris's approach)
  if (slug.length < 5) {
    slug += `-${randomSuffix(6)}`;
  }

  // Ensure maximum length of 50
  if (slug.length > 50) {
    slug = slug.slice(0, 50);
    while (slug.endsWith('-')) {
      slug = slug.slice(0, -1);
    }
  }

  return slug;
}

// Improved validation spec (from Chris's approach)
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
    currency string(NGN|USD|GBP|GHS)
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
    // Validate links (from Chris's approach)
    if (data.links && data.links.length > 0) {
      for (let i = 0; i < data.links.length; i += 1) {
        const link = data.links[i];
        if (!link.url.startsWith('http://') && !link.url.startsWith('https://')) {
          throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
        }
      }
    }

    // Validate access rules (using your error codes)
    const { access_type: accessType, access_code: accessCode } = data;

    if (accessType === 'private' && !accessCode) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.AC01);
    }

    if (accessType === 'public' && accessCode) {
      throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.AC05);
    }

    // Handle slug (from Chris's approach)
    if (data.slug) {
      if (!isValidSlug(data.slug)) {
        throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
      }
    } else {
      data.slug = generateSlug(data.title);
    }

    // Check for duplicate slug (using your error code)
    const existingCard = await CreatorCard.findOne({
      query: { slug: data.slug },
      options: { session: options.session },
    });

    if (existingCard) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.SL02);
    }

    // Create card
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
