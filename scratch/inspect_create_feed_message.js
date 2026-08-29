const { Liveblocks } = require('@liveblocks/node');
const client = new Liveblocks({ secret: 'sk_test_mock' });
console.log("createFeedMessage params & body:");
console.log(client.createFeedMessage.toString());
