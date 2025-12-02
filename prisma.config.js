// // prisma.config.js
// require('dotenv').config();
// const { defineConfig, env } = require('prisma/config');

// module.exports = defineConfig({
//   schema: 'prisma/schema.prisma',

//   // Required: datasource must be present for migrate dev
//   datasource: {
//     provider: 'postgresql',
//     url: env('DATABASE_URL'), // reads from .env
//   },

//   migrations: {
//     path: 'prisma/migrations',
//   },
// });
