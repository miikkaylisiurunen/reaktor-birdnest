import { XMLParser } from 'fast-xml-parser';
import { DronePayload, DronesWithTimestamp, Pilot, PilotPayload } from './types';

export function parseDrones(payload: string): DronesWithTimestamp {
  const parser = new XMLParser({
    ignoreAttributes: false,
  });
  const data = DronePayload.safeParse(parser.parse(payload));

  if (!data.success) {
    throw new Error('Unexpected Birdnest API response');
  }

  const drones = data.data.report.capture.drone.map((d) => ({
    altitude: d.altitude,
    firmware: d.firmware.toString(),
    ipv4: d.ipv4,
    ipv6: d.ipv6,
    mac: d.mac,
    manufacturer: d.manufacturer,
    model: d.model,
    positionX: d.positionX,
    positionY: d.positionY,
    serialNumber: d.serialNumber,
  }));

  return {
    drones,
    timestamp: new Date(data.data.report.capture['@_snapshotTimestamp']),
  };
}

export function parsePilot(payload: any): Pilot {
  const pilot = PilotPayload.safeParse(payload);

  if (!pilot.success) {
    throw new Error('Unexpected Birdnest API response');
  }

  return {
    createdAt: new Date(pilot.data.createdDt),
    email: pilot.data.email,
    firstName: pilot.data.firstName,
    id: pilot.data.pilotId,
    lastName: pilot.data.lastName,
    phoneNumber: pilot.data.phoneNumber,
  };
}
