import { afterAll, beforeAll, beforeEach, describe, expect, it } from '@jest/globals';
import { Client, Drone } from '../client';
import { getConfig } from '../config';
import { applyMigrations, getPool, makeQueries } from '../queries';
import { makeMonitorDronesJob } from './monitorDrones';

describe('monitor drones job', () => {
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

  it('upserts found violating drones into the database', async () => {
    const drones: Drone[] = [
      { ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 10000 },
      { ...makeDrone('TEST-xyz_123_cr0945'), positionY: 250000 - 10000 },
    ];

    const queries = await makeQueries(config.databaseUrl);
    const client = makeTestClient(drones);
    const job = makeMonitorDronesJob(queries, client);

    // make sure there are no drones
    const dronesBefore = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesBefore).toHaveLength(0);

    // run the job
    await job();

    // make sure there are two drones
    const dronesAfter = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter).toHaveLength(2);
  });

  it("does not upsert drone if it's far away from the origin", async () => {
    const drones: Drone[] = [{ ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 110000 }];
    const queries = await makeQueries(config.databaseUrl);
    const client = makeTestClient(drones);
    const job = makeMonitorDronesJob(queries, client);

    // make sure there are no drones
    const dronesBefore = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesBefore).toHaveLength(0);

    // run the job
    await job();

    // make sure there are no drones
    const dronesAfter = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter).toHaveLength(0);
  });

  it("updates the drone's distance to the lowest", async () => {
    const drones: Drone[] = [{ ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 50000 }];
    const queries = await makeQueries(config.databaseUrl);
    const client = makeTestClient(drones);

    // make sure there are no drones
    const dronesBefore = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesBefore).toHaveLength(0);

    // run the job
    await makeMonitorDronesJob(queries, client)();

    // make sure there is one drone
    const dronesAfter = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter).toHaveLength(1);
    expect(dronesAfter[0].drone_distance).toEqual('50');

    // change the drone's distance to a further value
    const dronesFurther: Drone[] = [
      { ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 55000 },
    ];
    const clientFurther = makeTestClient(dronesFurther);

    // run the job again
    await makeMonitorDronesJob(queries, clientFurther)();

    // make sure there is one drone
    const dronesAfterFurther = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfterFurther).toHaveLength(1);
    expect(dronesAfterFurther[0].drone_distance).toEqual('50');

    // change the drone to closer
    const dronesCloser: Drone[] = [
      { ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 20000 },
    ];
    const clientCloser = makeTestClient(dronesCloser);

    // run the job again
    await makeMonitorDronesJob(queries, clientCloser)();

    // make sure there is one drone
    const dronesAfterCloser = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfterCloser).toHaveLength(1);
    expect(dronesAfterCloser[0].drone_distance).toEqual('20');
  });

  it('keeps track of the last seen time even if moving further', async () => {
    const queries = await makeQueries(config.databaseUrl);

    // make sure there are zero drones
    const dronesBefore1 = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesBefore1).toHaveLength(0);

    // drone is violating -> upsert a new one
    const drones1: Drone[] = [{ ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 10000 }];
    const client1 = makeTestClient(drones1);

    // run the job
    await makeMonitorDronesJob(queries, client1)();

    // make sure there is one drone
    const dronesAfter1 = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter1).toHaveLength(1);

    // drone is violating but moved further -> update the last seen time but not the distance
    const drones2: Drone[] = [{ ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 15000 }];
    const client2 = makeTestClient(drones2);

    // run the job
    await makeMonitorDronesJob(queries, client2)();

    // make sure the last seen date updated
    const dronesAfter2 = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter2).toHaveLength(1);
    expect(dronesAfter2[0].drone_distance).toEqual(dronesAfter1[0].drone_distance);
    expect(dronesAfter2[0].drone_last_seen_at.getTime()).toBeGreaterThan(
      dronesAfter1[0].drone_last_seen_at.getTime()
    );

    // drone is violating and moved closer -> update the last seen time and the distance
    const drones3: Drone[] = [{ ...makeDrone('TEST-xyz_123_t490u3m'), positionX: 250000 - 5000 }];
    const client3 = makeTestClient(drones3);

    // run the job
    await makeMonitorDronesJob(queries, client3)();

    // make sure the last seen date updated
    const dronesAfter3 = await queries.listDronesWithPilotsLastSeenAfter(60);
    expect(dronesAfter3).toHaveLength(1);
    expect(dronesAfter3[0].drone_distance).toEqual('5');
    expect(dronesAfter3[0].drone_last_seen_at.getTime()).toBeGreaterThan(
      dronesAfter2[0].drone_last_seen_at.getTime()
    );
  });
});

const makeDrone = (serialNumber: string): Drone => ({
  altitude: 1,
  firmware: '1',
  ipv4: '1.1.1.1',
  ipv6: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  mac: 'X',
  manufacturer: 'X',
  model: '1',
  positionX: 250000,
  positionY: 250000,
  serialNumber: serialNumber,
});

const makeTestClient = (drones: Drone[]): Client => {
  return {
    getDrones: async () => {
      return {
        drones,
        timestamp: new Date(),
      };
    },
    getPilot: async () => {
      return null;
    },
  };
};
