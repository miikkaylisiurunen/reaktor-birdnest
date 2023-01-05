import { z } from 'zod';

export const Drone = z.object({
  serialNumber: z.string(),
  model: z.string(),
  manufacturer: z.string(),
  mac: z.string(),
  ipv4: z.string(),
  ipv6: z.string(),
  firmware: z.string().or(z.number()),
  positionY: z.number(),
  positionX: z.number(),
  altitude: z.number(),
});
export type Drone = z.infer<typeof Drone>;

export const DronePayload = z.object({
  report: z.object({
    deviceInformation: z.object({
      listenRange: z.number(),
      deviceStarted: z.string(),
      uptimeSeconds: z.number(),
      updateIntervalMs: z.number(),
    }),
    capture: z.object({
      drone: z.array(Drone),
      '@_snapshotTimestamp': z.string(),
    }),
  }),
});
export type DronePayload = z.infer<typeof DronePayload>;

export const Pilot = z.object({
  createdAt: z.instanceof(Date),
  email: z.string(),
  firstName: z.string(),
  id: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
});
export type Pilot = z.infer<typeof Pilot>;

export const PilotPayload = z.object({
  createdDt: z.string(),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  pilotId: z.string(),
});
export type PilotPayload = z.infer<typeof PilotPayload>;

export type DronesWithTimestamp = {
  drones: Drone[];
  timestamp: Date;
};

export interface Client {
  getDrones(): Promise<DronesWithTimestamp>;
  getPilot(serialNumber: string): Promise<Pilot | null>;
}
