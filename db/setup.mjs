import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

// Runs one SQL command at a time — the Neon query() transport
// refuses multiple commands bundled into a single call.
async function runFile(db, filePath) {
  const commands = readFileSync(filePath, 'utf8')
    .split(';')
    .map(c => c.trim())
    .filter(c => c.length > 0);

  for (const command of commands) {
    await db.query(command);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is missing. Check that .env.local exists in the project root.');
    process.exit(1);
  }

  const db = neon(process.env.DATABASE_URL);

  console.log('Resetting tables…');
  await db.query('DROP TABLE IF EXISTS reviews;');
  await db.query('DROP TABLE IF EXISTS restaurants;');

  console.log('Applying db/schema.sql…');
  await runFile(db, 'db/schema.sql');

  console.log('Applying db/seed.sql…');
  await runFile(db, 'db/seed.sql');

  const restaurants = await db.query('SELECT * FROM restaurants ORDER BY id;');
  const reviews = await db.query('SELECT * FROM reviews ORDER BY id;');

  console.log('\nRestaurants:');
  console.table(restaurants);
  console.log('Reviews:');
  console.table(reviews.map(r => ({ ...r, created_at: r.created_at.toISOString() })));
}

main();
