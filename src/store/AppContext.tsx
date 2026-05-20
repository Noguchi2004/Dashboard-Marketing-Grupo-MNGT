import { createContext, useContext, useState, ReactNode } from 'react';
import { DashboardData, FilterState } from '../lib/types';
import { processExcelFile } from '../lib/data-processor';

interface AppContextType {
  rawData: DashboardData | null;
  data: DashboardData | null;
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  loadData: (file: File) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  activeView: string;
  setActiveView: (view: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [rawData, setRawData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>('executiva');
  const [filters, setFiltersState] = useState<FilterState>({
    ano: 2026,
    mes: 'Todos',
    empresa: 'Todos',
    centro_custo_area: 'Todos',
    fornecedor: 'Todos',
  });

  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };

  const loadData = async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const processed = await processExcelFile(file);
      setRawData(processed);
    } catch (err: any) {
      setError(err.message || 'Erro ao processar o arquivo');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const data = rawData ? {
    previsto: rawData.previsto.filter(p => filters.empresa === 'Todos' || p.empresa === filters.empresa),
    realizado: rawData.realizado.filter(r => filters.empresa === 'Todos' || r.empresa === filters.empresa)
  } : null;

  return (
    <AppContext.Provider value={{ rawData, data, filters, setFilters, loadData, isLoading, error, activeView, setActiveView }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
