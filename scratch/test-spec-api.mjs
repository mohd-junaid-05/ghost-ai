// Test script to diagnose the 500 error on /api/ai/spec
// Run with: node scratch/test-spec-api.mjs

import { config } from 'dotenv';
config({ path: '.env.local' });

console.log('=== Environment Check ===');
console.log('TRIGGER_SECRET_KEY:', process.env.TRIGGER_SECRET_KEY ? `set (${process.env.TRIGGER_SECRET_KEY.slice(0, 15)}...)` : 'MISSING');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'MISSING');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? 'set' : 'MISSING');
console.log('BLOB_READ_WRITE_TOKEN:', process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'MISSING');

// Test Trigger.dev task trigger
console.log('\n=== Test: tasks.trigger ===');
try {
  const { tasks } = await import('@trigger.dev/sdk');
  const handle = await tasks.trigger('generate-spec', {
    projectId: 'test-project-diag',
    roomId: 'test-room-diag',
    chatHistory: [],
    nodes: [],
    edges: [],
  });
  console.log('✅ tasks.trigger OK, handle.id:', handle.id);
  
  // Test token creation
  console.log('\n=== Test: auth.createPublicToken ===');
  const { auth } = await import('@trigger.dev/sdk');
  const token = await auth.createPublicToken({
    scopes: { read: { runs: [handle.id] } },
    expirationTime: '1h',
  });
  console.log('✅ auth.createPublicToken OK, token starts:', token.slice(0, 30));
} catch(e) {
  console.error('❌ Trigger.dev error:', e.message);
  if (e.code) console.error('   code:', e.code);
  if (e.stack) console.error('   stack:', e.stack.split('\n').slice(0, 4).join('\n'));
}

// Test Prisma connection
console.log('\n=== Test: Prisma Database ===');
try {
  const { PrismaClient } = await import('./app/generated/prisma/client.js');
  const { PrismaPg } = await import('@prisma/adapter-pg');
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });
  const runs = await prisma.taskRun.count();
  console.log('✅ taskRun count:', runs);
  const specs = await prisma.projectSpec.count();
  console.log('✅ projectSpec count:', specs);
  await prisma.$disconnect();
} catch(e) {
  console.error('❌ Prisma error:', e.message);
}
