import knex from 'knex';
import pg from 'pg';

// This fixes a common issue with how PostgreSQL timestamps are parsed
pg.types.setTypeParser(1114, (stringValue) => {
  return new Date(stringValue + 'Z');
});

const db = knex({
  client: 'pg',
  // --- THIS IS THE FIX ---
  // Use the DATABASE_URL string directly
  connection: process.env.DATABASE_URL,
  // --- END FIX ---
  pool: { min: 2, max: 10 },
});

export default db;