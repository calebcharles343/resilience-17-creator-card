const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

const spec = `root {
  slug string<trim|minLength:1|maxLength:50>
  creator_reference string<trim>
}`;

const parsedSpec = validator.parse(spec);

async function deleteCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);

  if (data.creator_reference.length !== 20) {
    throwAppError(
      `Passed creator_reference length ${data.creator_reference.length} should be 20`,
      ERROR_CODE.VALIDATIONERR
    );
  }

  const card = await CreatorCard.findOne({
    query: { slug: data.slug },
    options: { session: options.session },
  });

  // If card doesn't exist, or ownership verification fails, match NF01
  if (!card || card.creator_reference !== data.creator_reference) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NF01);
  }

  const deletedTime = new Date().getTime();

  await CreatorCard.deleteOne({
    query: { _id: card._id },
    options: { session: options.session },
  });

  return {
    id: card._id,
    title: card.title,
    description: card.description || null,
    slug: card.slug,
    creator_reference: card.creator_reference,
    links: card.links,
    service_rates: card.service_rates || null,
    status: card.status,
    access_type: card.access_type,
    access_code: null,
    created: card.created,
    updated: card.updated,
    deleted: deletedTime,
  };
}

module.exports = deleteCreatorCard;
