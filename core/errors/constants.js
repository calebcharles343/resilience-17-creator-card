/**
 * @readonly
 * @enum
 */
const ERROR_CODE = {
  // General errors
  AUTHERR: 'AUTHORIZATION_ERROR',
  NOAUTHERR: 'MISSING_AUTHORIZATION',
  INVLDAUTHTOKEN: 'INVALID_AUTH_TOKEN',
  INACTIVEACCT: 'INACTIVE_ACCOUNT',
  EXPIREDTOKEN: 'EXPIRED_TOKEN',
  INVLDREQ: 'INVALID_REQUEST',
  PERMERR: 'PERMISSION_ERROR',
  LIMITERR: 'LIMIT_ERROR',
  FEEERR: 'FEE_ERROR',
  NOTFOUND: 'RESOURCE_NOT_FOUND',
  APPERR: 'APPLICATION_ERROR',
  HTTPREQERR: 'INTERNAL_REQ_ERROR',
  DUPLRCRD: 'DUPLICATE_RECORD',
  VALIDATIONERR: 'VALIDATION_ERROR',
  INVLDDATA: 'INVALID_REQUEST_DATA',
  RTLIMERR: 'RATE_LIMIT_ERROR',

  // Creator Card custom error codes (must match assessment)
  SL02: 'SL02', // Slug already taken (explicit slug only)
  AC01: 'AC01', // Missing access_code on private card
  AC05: 'AC05', // access_code provided on public card
  NF01: 'NF01', // Card not found (or deleted)
  NF02: 'NF02', // Card exists but is a draft
  AC03: 'AC03', // Private card, no pin provided
  AC04: 'AC04', // Private card, wrong pin
};

const ERROR_STATUS_CODE_MAPPING = {
  // General
  AUTHORIZATION_ERROR: 401,
  MISSING_AUTHORIZATION: 401,
  INVALID_AUTH_TOKEN: 401,
  INACTIVE_ACCOUNT: 401,
  EXPIRED_TOKEN: 401,
  PERMISSION_ERROR: 401,
  INVALID_REQUEST: 403,
  LIMIT_ERROR: 403,
  FEE_ERROR: 403,
  RESOURCE_NOT_FOUND: 404,
  DUPLICATE_RECORD: 409,
  APPLICATION_ERROR: 500,
  RATE_LIMIT_ERROR: 429,
  VALIDATION_ERROR: 400,
  INVALID_REQUEST_DATA: 400,

  // Creator Card precise routing response updates
  SL02: 400, // Bad Request
  AC01: 400, // Bad Request
  AC05: 400, // Bad Request
  NF01: 404, // Not Found
  NF02: 404, // Not Found
  AC03: 403, // Forbidden
  AC04: 403, // Forbidden
};

module.exports = { ERROR_CODE, ERROR_STATUS_CODE_MAPPING };
