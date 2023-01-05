import { Pool } from 'pg';

let _pool: Pool | null = null;

export function getPool(databaseUrl: string) {
  if (_pool === null) {
    _pool = new Pool({ connectionString: databaseUrl });
  }
  return _pool;
}
