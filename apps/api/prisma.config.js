"use strict";
const dotenv_1 = require("dotenv");
const config_1 = require("prisma/config");
const appEnv = process.env['APP_ENV'] ??
    (process.env['NODE_ENV'] === 'production' ? 'prd' : 'dev');
const envFileName = `.env.${appEnv}`;
(0, dotenv_1.config)({ path: envFileName });
(0, dotenv_1.config)({ path: '.env', override: false });
const datasourceUrl = process.env['DIRECT_URL'] || process.env['DATABASE_URL'] || undefined;
module.exports = (0, config_1.defineConfig)({
    schema: 'prisma/schema.prisma',
    migrations: {
        path: 'prisma/migrations',
    },
    datasource: {
        url: datasourceUrl,
    },
});
