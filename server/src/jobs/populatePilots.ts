import { CronJob } from 'cron';
import { Client } from '../client';
import { Queries } from '../queries';
import { runSafely } from './util';

export function makePopulatePilotsJob(queries: Queries, client: Client) {
  return async () => {
    // get drones without pilots from the database
    const dronesWithoutPilot = await queries.listDronesWithoutPilot();

    // fetch and populate the pilots for every drone
    for (const drone of dronesWithoutPilot) {
      const pilot = await client.getPilot(drone.drone_serial_number);

      if (pilot) {
        await queries.insertPilot(drone.drone_id, {
          pilot_email_address: pilot.email,
          pilot_first_name: pilot.firstName,
          pilot_last_name: pilot.lastName,
          pilot_phone_number: pilot.phoneNumber,
        });
      }
    }
  };
}

export function initPopulatePilotsJob(queries: Queries, client: Client) {
  const job = new CronJob({
    cronTime: '*/5 * * * * *',
    runOnInit: true,
    onTick: runSafely(makePopulatePilotsJob(queries, client)),
  });

  job.start();
}
