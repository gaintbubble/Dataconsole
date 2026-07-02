import { defineConfig } from "@prisma/config";
import "dotenv/config";

const directUrl = process.env.DIRECT_URL;

if (!directUrl) {
  throw new Error(
    "❌ DIRECT_URL not found. Please check your .env file."
  );
}

export default defineConfig({
  datasource: {
    url: directUrl,
  },
});