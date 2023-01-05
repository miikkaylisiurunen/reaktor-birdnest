import migrate from 'node-pg-migrate';
import path from 'path';

export async function applyMigrations(databaseUrl: string, disableLogging = false) {
  await migrate({
    count: Number.POSITIVE_INFINITY,
    databaseUrl: databaseUrl,
    dir: path.resolve(__dirname, '../../migrations'),
    direction: 'up',
    log: disableLogging ? () => {} : undefined,
    migrationsTable: 'migrations',
    verbose: false,
  });
}
