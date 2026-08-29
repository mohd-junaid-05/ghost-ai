const { Liveblocks } = require('@liveblocks/node');
const client = new Liveblocks({ secret: 'sk_test_mock' });
console.log("Liveblocks methods:");
Object.getOwnPropertyNames(Object.getPrototypeOf(client)).forEach(m => {
  if (m.includes('Feed') || m.includes('Message') || m.includes('Comment') || m.includes('Notification')) {
    console.log(`- ${m}`);
  }
});
