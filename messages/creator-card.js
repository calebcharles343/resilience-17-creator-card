module.exports = {
  // Success messages
  CREATOR_CARD_CREATED: 'Creator Card Created Successfully.',
  CREATOR_CARD_RETRIEVED: 'Creator Card Retrieved Successfully.',
  CREATOR_CARD_DELETED: 'Creator Card Deleted Successfully.',

  // Assessment error messages (with exact codes)
  SLUG_ALREADY_TAKEN: 'Slug is already taken',
  ACCESS_CODE_REQUIRED: 'access_code is required when access_type is private',
  ACCESS_CODE_NOT_ALLOWED: 'access_code can only be set on private cards',
  CARD_NOT_FOUND: 'Creator card not found',
  CARD_IS_DRAFT: 'Creator card not found',
  PRIVATE_CARD_ACCESS_DENIED: 'This card is private. An access code is required',
  INVALID_ACCESS_CODE: 'Invalid access code',

  // Validation messages
  INVALID_SLUG_FORMAT: 'Slug may only contain lowercase letters, numbers, hyphens, and underscores',
  INVALID_ACCESS_CODE_FORMAT: 'access_code must be exactly 6 alphanumeric characters',
  INVALID_LINK_URL: 'Link URL must start with http:// or https://',
  INVALID_CURRENCY: 'Currency must be one of NGN, USD, GBP, GHS',
  INVALID_RATE_AMOUNT: 'Rate amount must be a positive integer',
  RATES_REQUIRED: 'rates[] must be a non-empty array when service_rates is present',
};
