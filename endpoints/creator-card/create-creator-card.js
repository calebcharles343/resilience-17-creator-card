const { createHandler } = require('@app-core/server');
const createCreatorCardService = require('@app/services/creator-card/create-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards',
  method: 'post',
  async handler(rc, helpers) {
    const payload = rc.body;

    const responseData = await createCreatorCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_CREATED,
      data: responseData,
    };
  },
});
