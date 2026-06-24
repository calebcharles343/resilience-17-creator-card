const { createHandler } = require('@app-core/server');
const getPublicCreatorCardService = require('@app/services/creator-card/get-public-creator-card');
const { CreatorCardMessages } = require('@app/messages');

module.exports = createHandler({
  path: '/creator-cards/:slug',
  method: 'get',
  async handler(rc, helpers) {
    const payload = {
      slug: rc.params.slug,
      access_code: rc.query.access_code,
    };

    const responseData = await getPublicCreatorCardService(payload);

    return {
      status: helpers.http_statuses.HTTP_200_OK,
      message: CreatorCardMessages.CREATOR_CARD_RETRIEVED,
      data: responseData,
    };
  },
});
