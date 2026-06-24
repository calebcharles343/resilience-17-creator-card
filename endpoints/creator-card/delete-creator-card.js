const { createHandler } = require('@app-core/server');
const deleteCreatorCardService = require('@app/services/creator-card/delete-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'delete',
  async handler(rc, helpers) {
    const payload = {
      slug: rc.params.slug,
      creator_reference: rc.body.creator_reference,
    };

    const responseData = await deleteCreatorCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_DELETED,
      data: responseData,
    };
  },
});
