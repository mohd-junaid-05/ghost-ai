// Test Prisma client property access
import { config } from 'dotenv';
config({ path: '.env.local' });

const { PrismaClient } = await import('../app/generated/prisma/client.js');
const { PrismaPg } = await import('@prisma/adapter-pg');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const p = new PrismaClient({ adapter });

console.log("'projectSpec' in p:", 'projectSpec' in p);
console.log('typeof p.projectSpec:', typeof p.projectSpec);
console.log('p.projectSpec getter exists (via Object.getOwnPropertyDescriptor):', 
  Object.getOwnPropertyDescriptor(p, 'projectSpec') !== undefined);

// Check prototype chain
let proto = Object.getPrototypeOf(p);
while (proto) {
  const desc = Object.getOwnPropertyDescriptor(proto, 'projectSpec');
  if (desc) {
    console.log('Found projectSpec on prototype:', proto.constructor?.name);
    break;
  }
  proto = Object.getPrototypeOf(proto);
}

try {
  const count = await p.projectSpec.count();
  console.log('projectSpec.count():', count);
} catch(e) {
  console.error('Error calling projectSpec.count():', e.message);
}

await p.$disconnect();
