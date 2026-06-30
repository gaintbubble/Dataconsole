import { defineConfig } from '@prisma/config';
import 'dotenv/config'; // <-- This magic line forces it to load your .env file

const databaseUrl = process.env.DATABASE_URL;

// This will throw a clear error if it still can't find the URL
if (!databaseUrl) {
  throw new Error("🚨 Cannot find DATABASE_URL! Make sure you have a .env file with your database URL in it.");
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});