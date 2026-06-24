/* eslint-disable no-await-in-loop */
const validator = require('@app-core/validator');
const { ulid } = require('@app-core/randomness');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

function randomAlphanumeric(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  return result;
}

function isValidUrl(string) {
  if (typeof string !== 'string') return false;
  return string.startsWith('http://') || string.startsWith('https://');
}

const spec = `root {
  title string<trim|minLength:1|maxLength:100>
  description? string<trim>
  slug? string<trim|maxLength:50>
  creator_reference string<trim|length:20>
  links? array {
    title string<trim>
    url string<trim>
  }
  service_rates? object {
    currency string<trim>
    rates array {
      name string<trim>
      description? string<trim>
      amount number
    }
  }
  status string<trim>
  access_type string<trim>
  access_code? string<trim>
}`;

const parsedSpec = validator.parse(spec);

async function createCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);

  // --- Strict Status & Access Type Enums ---
  if (!['published', 'draft'].includes(data.status)) {
    throwAppError(
      `Expected status's value: ${data.status} to be one of published,draft`,
      ERROR_CODE.VALIDATIONERR
    );
  }
  if (!['public', 'private'].includes(data.access_type)) {
    throwAppError(
      `Expected access_type's value: ${data.access_type} to be one of public,private`,
      ERROR_CODE.VALIDATIONERR
    );
  }

  // --- Title trim minLength 3 verification ---
  if (data.title.length < 3) {
    throwAppError('Passed title length must be at least 3', ERROR_CODE.VALIDATIONERR);
  }

  const accessType = data.access_type;
  const accessCode = data.access_code ? data.access_code.trim() : null;

  // --- Creation Business Rule Error Codes (AC01 / AC05) ---
  if (accessType === 'private' && !accessCode) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_REQUIRED, ERROR_CODE.AC01);
  }
  if (
    accessType === 'public' &&
    Object.prototype.hasOwnProperty.call(data, 'access_code') &&
    data.access_code !== null
  ) {
    throwAppError(CreatorCardMessages.ACCESS_CODE_NOT_ALLOWED, ERROR_CODE.AC05);
  }

  // --- access_code Format Rules ---
  if (accessType === 'private' && accessCode) {
    if (accessCode.length !== 6 || !/^[A-Za-z0-9]+$/.test(accessCode)) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE_FORMAT, ERROR_CODE.VALIDATIONERR);
    }
  }

  // --- Slug Construction or Validation ---
  const { slug: explicitSlug } = data;
  let slug = explicitSlug;
  if (slug) {
    // Explicit slug validation: allow lower, numbers, hyphens, and underscores
    if (!/^[a-z0-9-_]+$/.test(slug)) {
      throwAppError(CreatorCardMessages.INVALID_SLUG_FORMAT, ERROR_CODE.VALIDATIONERR);
    }
    if (slug.length < 5) {
      throwAppError('Explicit slug must be at least 5 characters long', ERROR_CODE.VALIDATIONERR);
    }

    const existingCard = await CreatorCard.findOne({ query: { slug } });
    if (existingCard) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.SL02);
    }
  } else {
    // Auto-generate clean base slug from title
    const processedSlug = data.title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');

    // Check collision or short length requirement
    const needsSuffix =
      processedSlug.length < 5 || (await CreatorCard.findOne({ query: { slug: processedSlug } }));

    if (needsSuffix) {
      slug = `${processedSlug}-${randomAlphanumeric(6)}`;
    } else {
      slug = processedSlug;
    }

    // Secondary collision safeguard
    const finalCollisionCheck = await CreatorCard.findOne({ query: { slug } });
    if (finalCollisionCheck) {
      throwAppError(CreatorCardMessages.SLUG_ALREADY_TAKEN, ERROR_CODE.SL02);
    }
  }

  // --- Service Rates Structure Validations ---
  const serviceRates = data.service_rates || { currency: 'USD', rates: [] };
  if (data.service_rates) {
    if (
      !Object.prototype.hasOwnProperty.call(serviceRates, 'rates') ||
      !Array.isArray(serviceRates.rates)
    ) {
      throwAppError('service_rates.rates is required!', ERROR_CODE.VALIDATIONERR);
    }
    serviceRates.currency = serviceRates.currency.toUpperCase();
    if (!['NGN', 'USD', 'GBP', 'GHS'].includes(serviceRates.currency)) {
      throwAppError(CreatorCardMessages.INVALID_CURRENCY, ERROR_CODE.VALIDATIONERR);
    }

    serviceRates.rates.forEach((rate) => {
      if (!rate.name || rate.name.length < 3) {
        throwAppError('Rate name must be at least 3 characters', ERROR_CODE.VALIDATIONERR);
      }
      if (rate.description && rate.description.length > 250) {
        throwAppError('Rate description cannot exceed 250 characters', ERROR_CODE.VALIDATIONERR);
      }
      if (!Number.isInteger(rate.amount) || rate.amount < 1) {
        throwAppError(CreatorCardMessages.INVALID_RATE_AMOUNT, ERROR_CODE.VALIDATIONERR);
      }
    });
  }

  // --- Link URL validations ---
  const links = data.links || [];
  links.forEach((link) => {
    if (!isValidUrl(link.url)) {
      throwAppError(CreatorCardMessages.INVALID_LINK_URL, ERROR_CODE.VALIDATIONERR);
    }
  });

  const cardData = {
    ...data,
    slug,
    _id: ulid(),
    access_type: accessType,
    links,
    service_rates: serviceRates,
    access_code: accessCode,
  };

  const card = await CreatorCard.create(cardData, options.session);

  return {
    id: card._id,
    title: card.title,
    description: card.description || null,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links,
    service_rates: card.service_rates,
    status: card.status,
    access_type: card.access_type,
    access_code: card.access_type === 'private' ? card.access_code : undefined,
    created: card.created,
    updated: card.updated,
  };
}

module.exports = createCreatorCard;
