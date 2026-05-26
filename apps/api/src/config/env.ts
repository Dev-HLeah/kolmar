import { resolve } from 'node:path';
import { z } from 'zod';

export const envSchema = z.object({
  APP_ENV: z.enum(['dev', 'prd', 'test']).default('dev'),
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  API_PORT: z.coerce.number().default(3000),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  AI_PROVIDER: z.enum(['openai', 'gemini', 'mock']).default('mock'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}

export function getEnvFilePaths() {
  const appEnv =
    process.env.APP_ENV ??
    (process.env.NODE_ENV === 'production' ? 'prd' : 'dev');
  const envFileName = `.env.${appEnv}`;

  return [
    resolve(process.cwd(), envFileName),
    resolve(process.cwd(), '../../', envFileName),
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ];
}
