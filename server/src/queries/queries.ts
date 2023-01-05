import { Pool, QueryResult } from 'pg';
import { getPool } from './pool';
import { DatabaseDrone, DatabaseDroneWithPilot, DatabasePilot, Queries } from './types';

async function query<Result extends Record<string, any> = any, Params extends any[] = any[]>(
  pool: Pool,
  query: string,
  params?: Params
): Promise<QueryResult<Result>> {
  return await pool.query(query, params);
}

export const makeQueries = async (databaseUrl: string): Promise<Queries> => {
  const pool = getPool(databaseUrl);
  return {
    deleteDronesLastSeenBefore: async (seenBefore) => {
      await query<never, [number]>(
        pool,
        `
        DELETE FROM drones
        WHERE drone_last_seen_at < NOW() - $1 * INTERVAL '1 minute'
        `,
        [seenBefore]
      );
    },
    listDronesWithPilotsLastSeenAfter: async (minutes) => {
      const { rows } = await query<DatabaseDroneWithPilot, [number]>(
        pool,
        `
        SELECT *
        FROM drones d
        LEFT JOIN pilots p
        USING(drone_id)
        WHERE drone_last_seen_at > NOW() - $1 * INTERVAL '1 minute'
        ORDER BY
          drone_last_seen_at DESC,
          drone_distance ASC
        `,
        [minutes]
      );
      return rows;
    },
    listDronesWithoutPilot: async () => {
      const { rows } = await query<DatabaseDrone>(
        pool,
        `
        SELECT
          drone_id,
          drone_serial_number,
          drone_last_seen_at,
          drone_distance
        FROM drones AS parent
        WHERE NOT EXISTS (SELECT pilot_id FROM pilots WHERE drone_id = parent.drone_id)
        `
      );
      return rows;
    },
    upsertDrone: async (drone) => {
      const { rows, rowCount } = await query<
        Pick<DatabaseDrone, 'drone_id'>,
        [string, Date, string]
      >(
        pool,
        `
        INSERT INTO drones (drone_serial_number, drone_last_seen_at, drone_distance)
        VALUES ($1, $2, $3)
        ON CONFLICT (drone_serial_number) DO UPDATE SET
          drone_last_seen_at = $2,
          drone_distance = least($3::DECIMAL, drones.drone_distance)
        RETURNING drone_id
        `,
        [drone.drone_serial_number, drone.drone_last_seen_at, drone.drone_distance]
      );
      if (rowCount !== 1) {
        throw new Error('Expected the query to affect exactly 1 row');
      }
      return rows[0];
    },
    findPilotByDroneId: async (droneId) => {
      const { rows } = await query<DatabasePilot, [string]>(
        pool,
        `
        SELECT
          pilot_id,
          pilot_first_name,
          pilot_last_name,
          pilot_phone_number,
          pilot_email_address
        FROM pilots
        WHERE drone_id = $1
        `,
        [droneId]
      );
      return rows.length > 0 ? rows[0] : null;
    },
    insertPilot: async (droneId, pilot) => {
      const { rows, rowCount } = await query<
        Pick<DatabasePilot, 'pilot_id'>,
        [string, string, string, string, string]
      >(
        pool,
        `
        INSERT INTO pilots (drone_id, pilot_first_name, pilot_last_name, pilot_phone_number, pilot_email_address)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (drone_id) DO NOTHING
        RETURNING pilot_id
        `,
        [
          droneId,
          pilot.pilot_first_name,
          pilot.pilot_last_name,
          pilot.pilot_phone_number,
          pilot.pilot_email_address,
        ]
      );
      if (rowCount === 0) {
        return null;
      } else if (rowCount > 1) {
        throw new Error('Expected the query to affect exactly 0 or 1 row');
      }
      return rows[0];
    },
  };
};
