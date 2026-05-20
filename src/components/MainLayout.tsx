import { useApp } from '../store/AppContext';
import { LayoutDashboard, Calendar, GitCompare, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';
import { FileUploader } from './FileUploader';
import { VisaoExecutiva } from '../pages/VisaoExecutiva';
import { AnaliseTemporal } from '../pages/AnaliseTemporal';
import { PrevistoRealizado } from '../pages/PrevistoRealizado';
import { Operacional } from '../pages/Operacional';

export function MainLayout() {
  const { data, rawData, filters, setFilters, activeView, setActiveView } = useApp();

  const navItems = [
    { id: 'executiva', label: 'Visão Executiva', icon: LayoutDashboard },
    { id: 'temporal', label: 'Análise Temporal', icon: Calendar },
    { id: 'prev_real', label: 'Previsto vs Realizado', icon: GitCompare },
    { id: 'operacional', label: 'Operacional & Pgtos', icon: CreditCard },
  ];

  if (!data || !rawData) {
    return <FileUploader />;
  }

  // Get distinct Companies
  const empresas = Array.from(new Set([
    ...rawData.previsto.map(p => p.empresa),
    ...rawData.realizado.map(r => r.empresa)
  ])).filter(Boolean).sort();

  return (
    <div className="flex h-screen bg-primary-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-primary-200 flex flex-col items-center">
        <div className="p-6 w-full border-b border-primary-100 mb-4">
          <h1 className="text-lg font-semibold tracking-tight text-primary-900">Mkt/Com Dashboard</h1>
          <p className="text-xs text-primary-500 mt-1">Controle Orçamentário</p>
        </div>
        
        <nav className="flex-1 w-full px-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary-900 text-white" 
                    : "text-primary-600 hover:bg-primary-100 hover:text-primary-900"
                )}
              >
                <Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-primary-400")} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-primary-200 flex items-center px-8 justify-between">
          <h2 className="text-xl font-medium tracking-tight text-primary-900">
            {navItems.find(i => i.id === activeView)?.label}
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-primary-500">Unidade/Empresa:</span>
            <select
              className="bg-primary-50 border border-primary-200 text-primary-900 text-sm rounded-md focus:ring-primary-500 focus:border-primary-500 block p-2"
              value={filters.empresa}
              onChange={(e) => setFilters({ empresa: e.target.value })}
            >
              <option value="Todos">Visão Consolidada (Todas)</option>
              {empresas.map(emp => (
                <option key={emp} value={emp}>{emp}</option>
              ))}
            </select>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {activeView === 'executiva' && <VisaoExecutiva />}
            {activeView === 'temporal' && <AnaliseTemporal />}
            {activeView === 'prev_real' && <PrevistoRealizado />}
            {activeView === 'operacional' && <Operacional />}
          </div>
        </div>
      </main>
    </div>
  );
}
