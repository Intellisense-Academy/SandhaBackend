// prisma.config.ts (or prisma.config.js)
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: env("DATABASE_URL"),   // "postgresql://postgres:0000@localhost:5432/sql?schema=public"
  },
});
