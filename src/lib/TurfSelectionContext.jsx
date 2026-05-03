import React, { createContext, useContext, useState } from 'react';

const TurfSelectionContext = createContext();

export function TurfSelectionProvider({ children }) {
  const [selectedTurfId, setSelectedTurfId] = useState(null);

  const value = {
    selectedTurfId,
    setSelectedTurfId,
  };

  return (
    <TurfSelectionContext.Provider value={value}>
      {children}
    </TurfSelectionContext.Provider>
  );
}

export function useTurfSelection() {
  const context = useContext(TurfSelectionContext);
  if (!context) {
    throw new Error('useTurfSelection must be used within TurfSelectionProvider');
  }
  return context;
}