import { createContext, useContext, useEffect, useState } from 'react';
import { connectSocket, disconnectSocket, getSocket } from '../socket/socketClient';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('accessToken');
    const s = connectSocket(token);

    s.on('connect', () => {
      setConnected(true);
      setSocket(s);
    });

    s.on('disconnect', () => setConnected(false));
    s.on('connect_error', (err) => console.error('Socket error:', err.message));

    return () => disconnectSocket();
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);