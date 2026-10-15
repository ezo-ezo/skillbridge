// Seeds the demo data only when the database has no users, so redeploys never wipe real data.
const { execFileSync } = require('child_process');
const path = require('path');
const prisma = require('../src/utils/prisma');

(async () => {
  const users = await prisma.user.count();
  await prisma.$disconnect();
  if (users > 0) return console.log(`seed-if-empty: ${users} users present, skipping seed`);
  console.log('seed-if-empty: empty database, seeding demo data');
  execFileSync(process.execPath, [path.join(__dirname, '..', 'prisma', 'seed.js')], { stdio: 'inherit' });
})().catch((e) => { console.error(e); process.exit(1); });
