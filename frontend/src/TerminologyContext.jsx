import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import TERMINOLOGY from './terminology.js';

/**
 * FR-200: TerminologyContext — provides a global t() function that
 * returns the correct label text based on the Admin-configured mode.
 *
 * Usage in any component:
 *   import { useTerminology } from '../TerminologyContext.jsx';
 *   const { t, mode, setMode } = useTerminology();
 *   <Typography>{t('lbl_folder_id')}</Typography>
 */

// FR-200: Create the context with a default noop
const TerminologyContext = createContext({
  t: (key) => key,
  mode: 'canonical',
  setMode: () => {}
});

// FR-200: Custom hook for easy access in components
export function useTerminology() {
  return useContext(TerminologyContext);
}

// FR-200: Provider component wraps the entire app
export function TerminologyProvider({ children }) {
  const [mode, setModeState] = useState('canonical');

  // FR-200: On mount, fetch the Admin's chosen terminology mode from backend
  useEffect(() => {
    const fetchMode = async () => {
      try {
        const res = await axios.get('/api/admin/settings');
        const saved = res.data?.terminology_mode;
        if (saved === 'legacy' || saved === 'canonical') {
          setModeState(saved);
        }
      } catch (err) {
        // If settings fetch fails (e.g. not logged in yet), keep default
      }
    };
    fetchMode();
  }, []);

  // FR-200: Translation function — looks up the key in the active dictionary
  const t = (key) => {
    const dict = TERMINOLOGY[mode] || TERMINOLOGY.canonical;
    return dict[key] || key;
  };

  // FR-200: When Admin changes the mode, persist it to the backend
  const setMode = async (newMode) => {
    setModeState(newMode);
    try {
      // Read current settings, merge in the new mode, and save
      const res = await axios.get('/api/admin/settings');
      const current = res.data || {};
      await axios.put('/api/admin/settings', {
        iodms_root_path: current.iodms_root_path || '',
        iodms_lan_share_path: current.iodms_lan_share_path || '',
        cutover_override_date: current.cutover_override_date || null,
        terminology_mode: newMode
      });
    } catch (err) {
      console.error('Failed to save terminology mode:', err);
    }
  };

  return (
    <TerminologyContext.Provider value={{ t, mode, setMode }}>
      {children}
    </TerminologyContext.Provider>
  );
}
