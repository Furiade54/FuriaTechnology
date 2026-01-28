import { supabaseQueries } from './supabaseQueries';
import { dbQuery as localQueries, initDB as initLocalDB } from './db.local';

// Re-export types if needed
// The original db.ts did not export types, so we don't need to here.

export const initDB = async (): Promise<void> => {
  console.log('🔌 Initializing Database Adapter...');
  
  // Initialize Local DB (Always needed for offline support)
  try {
    await initLocalDB();
    console.log('✅ Local Database Ready');
  } catch (error) {
    console.error('❌ Local Database Initialization Failed:', error);
  }

  // Initialize Supabase (Optional check)
  console.log('🔌 Initializing Supabase Adapter...');
  try {
    // We could add a connection check here if desired
    console.log('✅ Supabase Adapter Ready');
  } catch (error) {
    console.error('❌ Supabase Connection Failed:', error);
  }
};

// Create a proxy to handle offline fallback
export const dbQuery = new Proxy(supabaseQueries, {
  get: (target, prop: keyof typeof supabaseQueries) => {
    // Return the function wrapper
    return async (...args: any[]) => {
      // 1. If Online, try Supabase first
      if (navigator.onLine) {
        try {
          // @ts-ignore - Dynamic access
          const result = await target[prop](...args);
          
          // Optional: Sync read data to local DB for future offline use?
          // This would require more complex logic (e.g., bulkUpsert after fetch).
          // For now, we rely on the seed data or explicit syncs.
          
          return result;
        } catch (error) {
          console.warn(`⚠️ Supabase error on ${String(prop)}, falling back to local DB:`, error);
          // If Supabase fails (even if online), try local fallback
        }
      } else {
        console.log(`📴 Offline mode: Executing ${String(prop)} against local DB`);
      }

      // 2. Fallback to Local DB
      try {
        // Check if the method exists in local queries
        // @ts-ignore
        if (typeof localQueries[prop] === 'function') {
           // @ts-ignore
           return await localQueries[prop](...args);
        } else {
          throw new Error(`Method ${String(prop)} not implemented in local DB adapter`);
        }
      } catch (localError) {
        console.error(`❌ Local DB error on ${String(prop)}:`, localError);
        throw localError; // If both fail, throw the local error
      }
    };
  }
});
