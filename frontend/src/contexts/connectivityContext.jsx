import React, { createContext, useContext, useRef, useState } from 'react';
import { connectivity } from './connectivitySingleton';

const ConnectivityContext = createContext(null);

export function ConnectivityProvider({ children }) {
  const [isOffline, setIsOffline] = useState(false);
  const wasOfflineRef = useRef(false);

  function goOffline() {
    if (!wasOfflineRef.current) {
      wasOfflineRef.current = true;
      setIsOffline(true);

      alert("You're offline. Edits are disabled.");
    }
  }

  function goOnline() {
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      setIsOffline(false);

      alert("You're back online.");
    }
  }

  connectivity.goOffline = goOffline;
  connectivity.goOnline = goOnline;

  return (
    <ConnectivityContext.Provider value={{ isOffline }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
