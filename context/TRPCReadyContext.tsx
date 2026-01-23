"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

interface TRPCReadyContextType {
  isReady: boolean;
  setReady: (ready: boolean) => void;
}

const TRPCReadyContext = createContext<TRPCReadyContextType | undefined>(
  undefined
);

export function useTRPCReady() {
  const context = useContext(TRPCReadyContext);
  if (!context) {
    throw new Error("useTRPCReady must be used within TRPCReadyProvider");
  }
  return context;
}

interface TRPCReadyProviderProps {
  children: ReactNode;
}

export function TRPCReadyProvider({ children }: TRPCReadyProviderProps) {
  const [isReady, setReady] = useState(true);

  useEffect(() => {
    // Ensure isReady is true on client mount
    setReady(true);
  }, []);

  return (
    <TRPCReadyContext.Provider value={{ isReady, setReady }}>
      {children}
    </TRPCReadyContext.Provider>
  );
}