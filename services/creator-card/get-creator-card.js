const validator = require('@app-core/validator');
const { throwAppError, ERROR_CODE } = require('@app-core/errors');
const CreatorCard = require('@app/repository/creator-card');
const { CreatorCardMessages } = require('@app/messages');

const spec = `root {
  slug string<trim|minLength:1|maxLength:50>
  access_code? string
}`;

const parsedSpec = validator.parse(spec);

async function getPublicCreatorCard(serviceData, options = {}) {
  const data = validator.validate(serviceData, parsedSpec);
  const { slug } = data;
  const accessCode = data.access_code ? data.access_code.trim() : null;

  const card = await CreatorCard.findOne({
    query: { slug },
    options: { session: options.session },
  });

  // 1. Order of Checks: Check existence first (NF01)
  if (!card) {
    throwAppError(CreatorCardMessages.CARD_NOT_FOUND, ERROR_CODE.NF01);
  }

  // 2. Draft evaluation (NF02)
  if (card.status === 'draft') {
    throwAppError(CreatorCardMessages.CARD_IS_DRAFT, ERROR_CODE.NF02);
  }

  // 3. Access Code Access Boundary (AC03 & AC04)
  if (card.access_type === 'private') {
    if (!accessCode) {
      throwAppError(CreatorCardMessages.PRIVATE_CARD_ACCESS_DENIED, ERROR_CODE.AC03);
    }
    if (card.access_code !== accessCode) {
      throwAppError(CreatorCardMessages.INVALID_ACCESS_CODE, ERROR_CODE.AC04);
    }
  }

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
    created: card.created,
    updated: card.updated,
    deleted: null,
  };
}

module.exports = getPublicCreatorCard;
