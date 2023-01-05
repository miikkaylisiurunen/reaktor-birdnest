import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { getConfig } from '../config';
import { applyMigrations, getPool, makeQueries } from '../queries';
import { makePruneDronesJob } from './pruneDrones';

describe('prune drones job', () => {
  const config = getConfig('TEST_', true);

  beforeAll(async () => {
    await applyMigrations(config.databaseUrl, true);
  });

  beforeEach(async () => {
    const pool = getPool(config.databaseUrl);
    await pool.query(`DELETE FROM drones`);
  });

  afterAll(async () => {
    await getPool(config.databaseUrl).end();
  });

  it('prunes all drones if last seen over 10 minutes ago', async () => {
    const queries = await makeQueries(config.databaseUrl);
    const job = makePruneDronesJob(queries);
    const minute = 60 * 1000;

    // insert the test drones
    await queries.upsertDrone({
      drone_distance: '10',
      drone_last_seen_at: new Date(Date.now() - 15 * minute),
      drone_serial_number: 'TEST-xyz_123_t490u3m',
    });

    await queries.upsertDrone({
      drone_distance: '10',
      drone_last_seen_at: new Date(Date.now() - 12 * minute),
      drone_serial_number: 'TEST-xyz_123_cr0945',
    });

    // make sure there are three drones
    const dronesBefore = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesBefore).toHaveLength(2);

    // run the job
    await job();

    // make sure there are no drones
    const dronesAfter = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter).toHaveLength(0);
  });

  it('prunes only old drones last seen over 10 minutes ago', async () => {
    const queries = await makeQueries(config.databaseUrl);
    const job = makePruneDronesJob(queries);
    const minute = 60 * 1000;

    // insert the test drones
    await queries.upsertDrone({
      drone_distance: '10',
      drone_last_seen_at: new Date(Date.now() - 2 * minute),
      drone_serial_number: 'TEST-xyz_123_t490u3m',
    });

    await queries.upsertDrone({
      drone_distance: '10',
      drone_last_seen_at: new Date(Date.now() - 12 * minute),
      drone_serial_number: 'TEST-xyz_123_cr0945',
    });

    // make sure there are two drones
    const dronesBefore = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesBefore).toHaveLength(2);

    // run the job
    await job();

    // make sure there are no drones
    const dronesAfter = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter).toHaveLength(1);
    expect(dronesAfter[0].drone_serial_number).toEqual('TEST-xyz_123_t490u3m');
  });
});
