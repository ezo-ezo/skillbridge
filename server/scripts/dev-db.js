// Starts a real PostgreSQL server locally (no install needed) for development.
const path = require('path');
const fs = require('fs');
const EmbeddedPostgres = require('embedded-postgres').default;

const dir = path.join(__dirname, '..', '.pgdata');
const pg = new EmbeddedPostgres({
  databaseDir: dir,
  user: 'postgres',
  password: 'postgres',
  port: 5433,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
});

(async () => {
  const fresh = !fs.existsSync(path.join(dir, 'PG_VERSION'));
  if (fresh) await pg.initialise();
  await pg.start();
  if (fresh) await pg.createDatabase('skillbridge');
  console.log('PostgreSQL ready on postgresql://postgres:postgres@localhost:5433/skillbridge');
  const stop = async () => { await pg.stop(); process.exit(0); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
})().catch((e) => { console.error(e); process.exit(1); });
