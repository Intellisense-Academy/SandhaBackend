// prisma.config.ts (or prisma.config.js)
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './schema.prisma',
  datasource: {
    url: "postgresql://postgres:0000@localhost:5432/sql?schema=public",
  },
});
