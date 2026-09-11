import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface EmergencyCorridor {
  corridorId: string;
  name: string;
  status: 'SAFE' | 'BLOCKED' | 'RISKY';
  primaryLifeline: string;
  recommendedBypass: string;
  affectedDistricts: string[];
  riskIndex: number;
}

interface EmergencyContextType {
  isEmergencyMode: boolean;
  toggleEmergencyMode: () => void;
  setEmergencyMode: (active: boolean) => void;
  safeCorridors: EmergencyCorridor[];
  emergencyCargoCategories: string[];
}

const EMERGENCY_STORAGE_KEY = 'neuroute_emergency_mode';

const DEFAULT_SAFE_CORRIDORS: EmergencyCorridor[] = [
  {
    corridorId: 'CORR-UMRANGSO',
    name: 'Guwahati → Umrangso Relief Lifeline → Silchar',
    status: 'SAFE',
    primaryLifeline: 'Umrangso Valley Bypass (SH-19)',
    recommendedBypass: 'Bypasses Sonapur Landslide Chokepoint on NH-06',
    affectedDistricts: ['Kamrup Metro', 'Dima Hasao', 'Cachar'],
    riskIndex: 18,
  },
  {
    corridorId: 'CORR-NORTH-BANK',
    name: 'Guwahati → Tezpur → North Lakhimpur → Dibrugarh',
    status: 'SAFE',
    primaryLifeline: 'NH-15 Brahmaputra North Bank Lifeline',
    recommendedBypass: 'Bypasses Kaziranga Flood Inundations on NH-715',
    affectedDistricts: ['Sonitpur', 'Biswanath', 'Lakhimpur', 'Dhemaji'],
    riskIndex: 15,
  },
  {
    corridorId: 'CORR-NH06-SONAPUR',
    name: 'NH-06 Meghalaya Main Lifeline (Sonapur Tunnel)',
    status: 'BLOCKED',
    primaryLifeline: 'NH-06 East Jaintia Hills Segment',
    recommendedBypass: 'Divert to Umrangso Bypass immediately',
    affectedDistricts: ['East Jaintia Hills', 'Cachar', 'Karimganj'],
    riskIndex: 92,
  },
  {
    corridorId: 'CORR-NH29-KOHIMA',
    name: 'NH-29 Dimapur → Kohima → Imphal',
    status: 'RISKY',
    primaryLifeline: 'NH-29 Phesama Sector',
    recommendedBypass: 'Single lane restricted convoys only',
    affectedDistricts: ['Dimapur', 'Kohima', 'Senapati', 'Imphal West'],
    riskIndex: 74,
  },
];

const EMERGENCY_CARGO_CATEGORIES = [
  'Medical Supplies',
  'Vaccines & Insulin',
  'Emergency Rations',
  'Diesel & Fuel Lifeline',
  'Disaster Relief Equipment',
  'Infant Nutrition & Blood Units',
];

const DEFAULT_CONTEXT: EmergencyContextType = {
  isEmergencyMode: false,
  toggleEmergencyMode: () => {},
  setEmergencyMode: () => {},
  safeCorridors: DEFAULT_SAFE_CORRIDORS,
  emergencyCargoCategories: EMERGENCY_CARGO_CATEGORIES,
};

const EmergencyContext = createContext<EmergencyContextType>(DEFAULT_CONTEXT);

export const EmergencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEmergencyMode, setIsEmergencyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(EMERGENCY_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleEmergencyMode = useCallback(() => {
    setIsEmergencyMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EMERGENCY_STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setEmergencyMode = useCallback((active: boolean) => {
    setIsEmergencyMode(active);
    try {
      localStorage.setItem(EMERGENCY_STORAGE_KEY, String(active));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({
      isEmergencyMode,
      toggleEmergencyMode,
      setEmergencyMode,
      safeCorridors: DEFAULT_SAFE_CORRIDORS,
      emergencyCargoCategories: EMERGENCY_CARGO_CATEGORIES,
    }),
    [isEmergencyMode, toggleEmergencyMode, setEmergencyMode]
  );

  return (
    <EmergencyContext.Provider value={value}>
      {children}
    </EmergencyContext.Provider>
  );
};

export const useEmergencyMode = (): EmergencyContextType => {
  const context = useContext(EmergencyContext) as EmergencyContextType;
  if (!context) {
    throw new Error('useEmergencyMode must be used within an EmergencyProvider');
  }
  return context;
};

export default EmergencyContext;
