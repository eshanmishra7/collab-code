import { createContext, useContext, useState } from 'react';

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);

  return (
    <RoomContext.Provider value={{ currentRoom, setCurrentRoom }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
