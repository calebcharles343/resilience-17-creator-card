const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

function transformDocument(doc) {
  // eslint-disable-next-line camelcase
  const { _id, __v, access_code, ...rest } = doc;
  return { id: _id, ...rest };
}

const spec = `root {
  slug string<trim|lowercase|lengthBetween:5,50>
  access_code? string<trim|length:6>
}`;

const parsedSpec = validator.parse(spec);

async function getCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;

  try {
    const { slug, access_code: accessCode } = data;

    const card = await CreatorCard.findOne({
      query: { slug },
      options: { session: options.session },
    });

    // Order matters: Check existence first
    if (!card) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    // Draft check (distinct code NF02)
    if (card.status === 'draft') {
      throwAppError(CreatorCardMessages.CARD_IS_DRAFT, ERROR_CODE.NF02);
    }

    // Private card access checks
    if (card.access_type === 'private') {
      if (!accessCode) {
        throwAppError(CreatorCardMessages.PRIVATE_CARD_ACCESS_DENIED, ERROR_CODE.AC03);
      }

      if (accessCode !== card.access_code) {
        throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.AC04);
      }
    }

    // Transform document (automatically removes access_code)
    result = transformDocument(card);
  } catch (error) {
    appLogger.errorX(error, 'get-public-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = getCreatorCard;
