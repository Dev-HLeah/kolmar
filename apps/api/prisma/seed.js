"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const adapter_pg_1 = require("@prisma/adapter-pg");
const client_1 = require("@prisma/client");
const dotenv_1 = require("dotenv");
const seed_data_1 = require("./data/seed-data");
const appEnv = process.env['APP_ENV'] ??
    (process.env['NODE_ENV'] === 'production' ? 'prd' : 'dev');
const envFileName = `.env.${appEnv}`;
(0, dotenv_1.config)({ path: `../../${envFileName}` });
(0, dotenv_1.config)({ path: '../../.env' });
(0, dotenv_1.config)({ path: envFileName, override: true });
(0, dotenv_1.config)({ path: '.env', override: true });
const connectionString = process.env['DATABASE_URL'] || process.env['DIRECT_URL'];
if (!connectionString) {
    throw new Error(`DATABASE_URL 또는 DIRECT_URL이 필요합니다. 루트 ${envFileName} 값을 확인하세요.`);
}
const prisma = new client_1.PrismaClient({
    adapter: new adapter_pg_1.PrismaPg({ connectionString }),
});
async function main() {
    const summary = await (0, seed_data_1.seedDatabase)(prisma);
    console.log('Seed completed:', summary);
}
void main()
    .catch((error) => {
    console.error(error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map