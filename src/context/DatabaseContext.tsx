import React, { createContext, useContext, useEffect, useState } from 'react';
import { initDB, dbQuery } from '../services/db';

interface DatabaseContextType {
  isReady: boolean;
  queries: typeof dbQuery;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  queries: dbQuery
});

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadDB = async () => {
      try {
        await initDB();
        setIsReady(true);
      } catch (error) {
        console.error("Failed to load DB", error);
      }
    };
    loadDB();
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-zinc-950">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={{ isReady, queries: dbQuery }}>
      {children}
    </DatabaseContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDatabase = () => useContext(DatabaseContext);
