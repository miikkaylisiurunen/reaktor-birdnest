import { useEffect, useState } from 'react';
import io from 'socket.io-client';
import './App.css';
import Table from './components/Table';
import { DroneWithPilot } from './types';

const socket = io(process.env.REACT_APP_SERVER_URL ?? '');

const App = () => {
  const [drones, setDrones] = useState<DroneWithPilot[]>([]);
  const [isError, setIsError] = useState<boolean>(false);

  useEffect(() => {
    socket.on('drones', (drones: DroneWithPilot[]) => {
      setDrones(drones);
    });

    socket.on('connect', () => {
      setIsError(false);
    });

    socket.on('connect_error', () => {
      setIsError(true);
    });

    return () => {
      socket.off('drones');
      socket.off('connect');
      socket.off('connect_error');
    };
  }, []);

  return (
    <div className="App">
      <h1>BIRDNEST</h1>
      <h2>Miikka Ylisiurunen</h2>
      {isError ? <span>Error connecting to server</span> : <Table drones={drones} />}
    </div>
  );
};

export default App;
