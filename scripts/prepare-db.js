const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

if (process.env.VERCEL === '1') {
  console.log('Detected Vercel environment. Configuring Prisma for PostgreSQL...');
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}`
  );
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('Successfully switched to PostgreSQL schema configuration.');
} else {
  console.log('Detected local environment. Keeping/restoring SQLite configuration...');
  schema = schema.replace(
    /datasource db \{[\s\S]*?\}/,
    `datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}`
  );
  fs.writeFileSync(schemaPath, schema, 'utf8');
  console.log('Successfully verified SQLite schema configuration.');
}
