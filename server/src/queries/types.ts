export type DatabaseDrone = {
  drone_id: string;
  drone_serial_number: string;
  drone_last_seen_at: Date;
  drone_distance: string;
};

export type DatabasePilot = {
  pilot_id: string;
  pilot_first_name: string;
  pilot_last_name: string;
  pilot_phone_number: string;
  pilot_email_address: string;
};

export type DatabaseDroneWithPilot = DatabaseDrone & Partial<DatabasePilot>;

export interface Queries {
  // drones
  deleteDronesLastSeenBefore(before: number): Promise<void>;
  listDronesWithPilotsLastSeenAfter(after: number): Promise<DatabaseDroneWithPilot[]>;
  listDronesWithoutPilot(): Promise<DatabaseDrone[]>;
  upsertDrone(drone: Omit<DatabaseDrone, 'drone_id'>): Promise<Pick<DatabaseDrone, 'drone_id'>>;

  // pilots
  findPilotByDroneId(droneId: string): Promise<DatabasePilot | null>;
  insertPilot(
    droneId: string,
    pilot: Omit<DatabasePilot, 'pilot_id'>
  ): Promise<Pick<DatabasePilot, 'pilot_id'> | null>;
}
