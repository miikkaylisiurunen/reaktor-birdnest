import { CronJob } from 'cron';
import { Queries } from '../queries';
import { runSafely } from './util';

export function makePruneDronesJob(queries: Queries) {
  return async () => {
    await queries.deleteDronesLastSeenBefore(10);
  };
}

export function initPruneDronesJob(queries: Queries) {
  const job = new CronJob({
    cronTime: '*/15 * * * * *',
    runOnInit: true,
    onTick: runSafely(makePruneDronesJob(queries)),
  });

  job.start();
}
