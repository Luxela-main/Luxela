import { useState, useEffect, useCallback } from 'react';

interface UseFormPersistenceOptions<T> {
  storageKey: string;
  initialData: T;
  onRestore?: (restoredData: T) => void;
  showRestoreNotification?: boolean;
}

/**
 * Custom hook for persisting form data to localStorage
 * 
 * Features:
 * - Safely saves form data to localStorage on every change
 * - Restores data on component mount
 * - Prevents hydration mismatches
 * - Type-safe data restoration with fallbacks
 * - Error handling for storage quota exceeded
 * 
 * @example
 * const { data, setData, isHydrated } = useFormPersistence({
 *   storageKey: 'myForm',
 *   initialData: defaultFormState,
 *   showRestoreNotification: true
 * });
 */
export function useFormPersistence<T>({
  storageKey,
  initialData,
  onRestore,
  showRestoreNotification = false,
}: UseFormPersistenceOptions<T>) {
  const [data, setData] = useState<T>(initialData);
  const [isHydrated, setIsHydrated] = useState(false);

  // Restore data from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined' || isHydrated) return;

    try {
      const savedData = localStorage.getItem(storageKey);
      if (savedData) {
        const parsedData = JSON.parse(savedData) as T;
        setData(parsedData);
        
        if (onRestore) {
          onRestore(parsedData);
        }

        if (showRestoreNotification) {
          console.log(`Form data restored from localStorage (${storageKey})`);
        }
      }
    } catch (error) {
      console.error(`Failed to restore form data from localStorage (${storageKey}):`, error);
    } finally {
      setIsHydrated(true);
    }
  }, [storageKey, isHydrated, onRestore, showRestoreNotification]);

  // Save data to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (!isHydrated || typeof window === 'undefined') return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'QuotaExceededError') {
          console.warn(`localStorage quota exceeded for key "${storageKey}". Cannot save form data.`);
        } else {
          console.warn(`Failed to save form data to localStorage (${storageKey}):`, error);
        }
      }
    }
  }, [data, storageKey, isHydrated]);

  // Utility function to clear saved data
  const clearSavedData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to clear form data from localStorage (${storageKey}):`, error);
    }
  }, [storageKey]);

  // Utility function to manually save data (useful for explicit save triggers)
  const saveData = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    data,
    setData,
    isHydrated,
    clearSavedData,
    saveData,
  };
}