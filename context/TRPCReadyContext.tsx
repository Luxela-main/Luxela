"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

interface TRPCReadyContextType {
  isReady: boolean;
}

const TRPCReadyContext = createContext<TRPCReadyContextType | undefined>(undefined);

export function TRPCReadyProvider({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  // Mark tRPC as ready on mount in the browser
  useEffect(() => {
    setIsReady(true);
  }, []);

  return (
    <TRPCReadyContext.Provider value={{ isReady }}>
      {children}
    </TRPCReadyContext.Provider>
  );
}

export function useTRPCReady() {
  const context = useContext(TRPCReadyContext);
  
  if (context === undefined) {
    throw new Error("useTRPCReady must be used within a TRPCReadyProvider");
  }
  
  return context;
}