export type DroneWithPilot = {
  drone_id: string;
  drone_serial_number: string;
  drone_last_seen_at: Date;
  drone_distance: string;
  pilot_id?: string;
  pilot_first_name?: string;
  pilot_last_name?: string;
  pilot_phone_number?: string;
  pilot_email_address?: string;
};
