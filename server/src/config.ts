import * as dotenv from 'dotenv';
import { z } from 'zod';

function readFromEnv(name: string, prefix?: string): string | undefined {
  return process.env[`${prefix ?? ''}${name}`];
}

export const Config = z.object({
  databaseUrl: z.string(),
  corsOrigin: z.string(),
  port: z.number().positive(),
});
export type Config = z.infer<typeof Config>;

let _config: Config | null = null;

export function getConfig(prefix?: string, force?: boolean): Config {
  if (_config === null || force) {
    dotenv.config();

    _config = Config.parse({
      databaseUrl: readFromEnv('DATABASE_URL', prefix),
      corsOrigin: readFromEnv('CORS_ORIGIN', prefix),
      port: readFromEnv('PORT', prefix) ? parseInt(readFromEnv('PORT', prefix)!, 10) : -1,
    });
  }

  return _config;
}
