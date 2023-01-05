import { DroneWithPilot } from '../../types';

type Props = {
  drones: DroneWithPilot[];
};

const Table = ({ drones }: Props) => {
  if (drones.length === 0) {
    return <span>Loading...</span>;
  }

  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>Drone serial number</th>
            <th>Pilot name</th>
            <th>Email</th>
            <th>Phone number</th>
            <th>Closest distance</th>
            <th>Last seen</th>
          </tr>
        </thead>
        <tbody>
          {drones.map((drone) => {
            return (
              <tr key={drone.drone_serial_number}>
                <td>{drone.drone_serial_number}</td>
                <td>
                  {drone.pilot_first_name} {drone.pilot_last_name}
                </td>
                <td>{drone.pilot_email_address}</td>
                <td>{drone.pilot_phone_number}</td>
                <td>{parseFloat(drone.drone_distance).toFixed(1)} m</td>
                <td>{new Date(drone.drone_last_seen_at).toLocaleString('fi-FI')}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
