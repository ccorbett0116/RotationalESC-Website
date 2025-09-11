import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '@/services/api';

interface MaintenanceContextType {
  isMaintenanceMode: boolean;
  checkBackendHealth: () => Promise<void>;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const useMaintenanceMode = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenanceMode must be used within a MaintenanceProvider');
  }
  return context;
};

interface MaintenanceProviderProps {
  children: ReactNode;
}

export const MaintenanceProvider = ({ children }: MaintenanceProviderProps) => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);

  const checkBackendHealth = async () => {
    try {
      await apiService.getCategories();
      setIsMaintenanceMode(false);
    } catch (error: any) {
      if (error.code === 'NETWORK_ERROR' || 
          error.code === 'ERR_NETWORK' ||
          error.message?.includes('Network Error') ||
          !error.response) {
        setIsMaintenanceMode(true);
      } else if (error.response?.status >= 500) {
        setIsMaintenanceMode(true);
      }
    }
  };

  useEffect(() => {
    checkBackendHealth();
    
    const interval = setInterval(checkBackendHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <MaintenanceContext.Provider value={{ isMaintenanceMode, checkBackendHealth }}>
      {children}
    </MaintenanceContext.Provider>
  );
};