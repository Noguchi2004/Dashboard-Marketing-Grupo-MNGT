import { useState, useRef, useEffect } from 'react';
import { ChevronDown, CheckSquare, Square } from 'lucide-react';
import { useApp } from '../store/AppContext';

const MESES = [
  { num: 1, label: 'Janeiro' },
  { num: 2, label: 'Fevereiro' },
  { num: 3, label: 'Março' },
  { num: 4, label: 'Abril' },
  { num: 5, label: 'Maio' },
  { num: 6, label: 'Junho' },
  { num: 7, label: 'Julho' },
  { num: 8, label: 'Agosto' },
  { num: 9, label: 'Setembro' },
  { num: 10, label: 'Outubro' },
  { num: 11, label: 'Novembro' },
  { num: 12, label: 'Dezembro' },
];

export function MonthFilter() {
  const { filters, setFilters } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = filters.meses.length === 0 || filters.meses.length === 12;

  const toggleMonth = (num: number) => {
    let newMeses = isAllSelected ? [] : [...filters.meses];
    
    if (isAllSelected) {
      // Se todos estavam selecionados, desmarcamos todos e selecionamos o clicado
      newMeses = [num];
    } else {
      if (newMeses.includes(num)) {
        newMeses = newMeses.filter(m => m !== num);
      } else {
        newMeses.push(num);
      }
    }
    
    if (newMeses.length === 12 || newMeses.length === 0) newMeses = [];
    setFilters({ meses: newMeses });
  };

  const selectAll = () => {
    setFilters({ meses: [] });
  };

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between gap-2 w-48 bg-primary-50 border border-primary-200 text-primary-900 text-sm rounded-md px-3 py-2 hover:bg-primary-100 transition-colors"
      >
        <span className="truncate font-medium">
          {isAllSelected ? "Todos os Meses" : `${filters.meses.length} mês(es)`}
        </span>
        <ChevronDown className="w-4 h-4 text-primary-500" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-primary-200 rounded-md shadow-lg z-50 p-2">
          <div className="flex justify-between items-center px-2 pb-2 mb-2 border-b border-primary-100">
            <span className="text-xs font-semibold text-primary-900">Período</span>
            <button onClick={selectAll} className="text-xs text-primary-600 hover:text-primary-900 font-semibold transition-colors">
              Marcar Todos
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto flex flex-col gap-1">
            {MESES.map(m => {
              const selected = isAllSelected || filters.meses.includes(m.num);
              return (
                <button
                  key={m.num}
                  onClick={(e) => {
                     e.preventDefault(); 
                     toggleMonth(m.num);
                  }}
                  className="flex items-center justify-start gap-3 px-2 py-1.5 hover:bg-primary-50 rounded-md transition-colors w-full"
                >
                  <div className="flex-shrink-0 text-primary-900">
                    {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-primary-300" />}
                  </div>
                  <span className="text-sm font-medium text-primary-700">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
