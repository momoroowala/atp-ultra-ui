import { createContext, useContext, ReactNode } from 'react';
import { StatisticsData, useStatisticsData } from '@/hooks/useStatisticsData';

const StatisticsContext = createContext<StatisticsData | null>(null);

export const StatisticsProvider = ({ children }: { children: ReactNode }) => {
  const data = useStatisticsData();
  
  return (
    <StatisticsContext.Provider value={data}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = (): StatisticsData => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be used within a StatisticsProvider');
  }
  return context;
};
