import fetch from 'node-fetch';
import { Client } from './types';
import { parseDrones, parsePilot } from './util';

export const makeClient = (): Client => {
  return {
    getDrones: async () => {
      const res = await fetch('https://assignments.reaktor.com/birdnest/drones');
      const data = await res.text();
      const drones = parseDrones(data);
      return drones;
    },
    getPilot: async (serialNumber) => {
      const resp = await fetch(`https://assignments.reaktor.com/birdnest/pilots/${serialNumber}`);

      if (resp.status === 404) {
        return null;
      }

      const json = await resp.json();
      const pilot = parsePilot(json);
      return pilot;
    },
  };
};
