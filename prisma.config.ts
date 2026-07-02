import { defineConfig } from "@prisma/config";
import "dotenv/config";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "❌ DATABASE_URL not found. Please check your .env file."
  );
}

export default defineConfig({
  datasource: {
    url: databaseUrl,
  },
});