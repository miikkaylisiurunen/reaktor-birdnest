import { getConfig } from './config';
import { makeClient } from './client';
import {
  initMonitorDronesJob,
  initPopulatePilotsJob,
  initPruneDronesJob,
  initSendDataJob,
} from './jobs';
import { applyMigrations, makeQueries } from './queries';

async function main() {
  const config = getConfig();

  // apply the database migrations
  await applyMigrations(config.databaseUrl);

  // construct the Birdnest API client and the database query client
  const queries = await makeQueries(config.databaseUrl);
  const client = makeClient();

  // initialise the jobs
  initMonitorDronesJob(queries, client);
  initPopulatePilotsJob(queries, client);
  initPruneDronesJob(queries);
  initSendDataJob(config.port, config.corsOrigin, queries);
}

main().catch((error) => {
  console.log(error);
});
