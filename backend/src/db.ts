import knex from 'knex';
import pg from 'pg';

// This fixes a common issue with how PostgreSQL timestamps are parsed
pg.types.setTypeParser(1114, (stringValue) => {
  return new Date(stringValue + 'Z');
});

const connectionConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('render.com')
        ? { rejectUnauthorized: false }
        : false,
    }
  : undefined;

const db = knex({
  client: 'pg',
  connection: connectionConfig,
  pool: { min: 2, max: 10 },
});

export default db;