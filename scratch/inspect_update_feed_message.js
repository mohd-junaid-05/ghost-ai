const { Liveblocks } = require('@liveblocks/node');
const client = new Liveblocks({ secret: 'sk_test_mock' });
console.log("updateFeedMessage params:");
console.log(client.updateFeedMessage.toString());
