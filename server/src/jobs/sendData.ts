import { Server } from 'socket.io';
import { CronJob } from 'cron';
import { runSafely } from './util';
import { Queries } from '../queries';

function makeSendDataJob(io: Server, queries: Queries) {
  return async () => {
    const clientAmount = (await io.fetchSockets()).length;
    if (clientAmount === 0) {
      return;
    }
    const drones = await queries.listDronesWithPilotsLastSeenAfter(10);
    io.emit('drones', drones);
  };
}

export function initSendDataJob(port: number, corsOrigin: string, queries: Queries) {
  const io = new Server(port, {
    cors: {
      origin: corsOrigin,
    },
  });

  io.on('connection', async (socket) => {
    await runSafely(async () => {
      const drones = await queries.listDronesWithPilotsLastSeenAfter(10);
      socket.emit('drones', drones);
    })();
  });

  const job = new CronJob({
    cronTime: '*/2 * * * * *',
    runOnInit: true,
    onTick: runSafely(makeSendDataJob(io, queries)),
  });

  job.start();
}
