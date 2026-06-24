const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const { appLogger } = require('@app-core/logger');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

function transformDocument(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: _id, ...rest };
}

const spec = `root {
  slug string<trim|lowercase|lengthBetween:5,50>
  creator_reference string<trim|length:20>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  let result;

  try {
    const { slug, creator_reference: creatorReference } = data;

    const card = await CreatorCard.findOne({
      query: { slug, creator_reference: creatorReference },
      options: { session: options.session },
    });

    if (!card) {
      throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NF01);
    }

    await CreatorCard.deleteOne({
      query: { _id: card._id },
      options: { session: options.session },
    });

    result = {
      ...transformDocument(card),
      deleted: Date.now(),
    };
  } catch (error) {
    appLogger.errorX(error, 'delete-creator-card-error');
    throw error;
  }

  return result;
}

module.exports = deleteCreatorCard;
