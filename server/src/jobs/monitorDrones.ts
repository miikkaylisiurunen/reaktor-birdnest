import { CronJob } from 'cron';
import { Client, Drone } from '../client';
import { Queries } from '../queries';
import { runSafely } from './util';

function distanceFromOrigin(origin: [number, number], position: [number, number]): number {
  const dx = position[0] - origin[0];
  const dy = position[1] - origin[1];
  const d = Math.sqrt(dx ** 2 + dy ** 2);
  return d / 1000;
}

function isViolating(origin: [number, number], radiusInMeters: number) {
  return (drone: Drone): boolean => {
    return distanceFromOrigin(origin, [drone.positionX, drone.positionY]) <= radiusInMeters;
  };
}

export function makeMonitorDronesJob(queries: Queries, client: Client) {
  return async () => {
    // fetch and filter the violating drones from the Birdnest API
    const dronesFromAPI = await client.getDrones();
    const violatingDrones = dronesFromAPI.drones.filter(isViolating([250000, 250000], 100));

    // upsert the violating drones with its pilot to the database (in parallel)
    const tasks: Promise<void>[] = [];
    for (const drone of violatingDrones) {
      tasks.push(
        (async (drone) => {
          const { drone_id } = await queries.upsertDrone({
            drone_serial_number: drone.serialNumber,
            drone_last_seen_at: dronesFromAPI.timestamp,
            drone_distance: distanceFromOrigin(
              [250000, 250000],
              [drone.positionX, drone.positionY]
            ).toString(),
          });

          const pilotFromDatabase = await queries.findPilotByDroneId(drone_id);

          if (pilotFromDatabase !== null) {
            // according to the assignment problem statement, the pilot information never changes
            //   -> there is no need to query the pilot information more than once from the API
            return;
          }

          const pilotFromAPI = await client.getPilot(drone.serialNumber);

          if (pilotFromAPI) {
            await queries.insertPilot(drone_id, {
              pilot_email_address: pilotFromAPI.email,
              pilot_first_name: pilotFromAPI.firstName,
              pilot_last_name: pilotFromAPI.lastName,
              pilot_phone_number: pilotFromAPI.phoneNumber,
            });
          }
        })(drone)
      );
    }

    await Promise.all(
      tasks.map((task) => {
        return task.catch((error) => {
          console.log(error);
        });
      })
    );
  };
}

export function initMonitorDronesJob(queries: Queries, client: Client) {
  const job = new CronJob({
    cronTime: '*/2 * * * * *',
    runOnInit: true,
    onTick: runSafely(makeMonitorDronesJob(queries, client)),
  });

  job.start();
}
