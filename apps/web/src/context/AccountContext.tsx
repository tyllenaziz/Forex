'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AccountMode = 'DEMO' | 'REAL';

interface AccountContextType {
  mode: AccountMode;
  setMode: (mode: AccountMode) => void;
}

const AccountContext = createContext<AccountContextType | undefined>(undefined);

export function AccountProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AccountMode>('DEMO');

  // Load saved mode on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('accountMode') as AccountMode;
    if (savedMode === 'REAL' || savedMode === 'DEMO') {
      setModeState(savedMode);
    }
  }, []);

  // Custom setter that saves to localStorage
  const setMode = (newMode: AccountMode) => {
    setModeState(newMode);
    localStorage.setItem('accountMode', newMode);
  };

  return (
    <AccountContext.Provider value={{ mode, setMode }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error('useAccount must be used within AccountProvider');
  return context;
}