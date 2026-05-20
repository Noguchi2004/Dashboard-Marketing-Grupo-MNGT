import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function Operacional() {
  const { data } = useApp();
  if (!data) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const topFornecedores = Object.entries(data.realizado.reduce((acc, curr) => {
    acc[curr.fornecedor_padronizado] = (acc[curr.fornecedor_padronizado] || 0) + curr.valor_realizado;
    return acc;
  }, {} as Record<string, number>)).sort((a: any, b: any) => b[1] - a[1]).slice(0, 10);

  const pagamentos = data.realizado.reduce((acc, curr) => {
    const k = curr.forma_pagamento || 'Não Informado';
    acc[k] = (acc[k] || 0) + curr.valor_realizado;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Fornecedores (Valor em R$)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topFornecedores.map(([name, val], i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-primary-400 font-mono text-xs w-4">{i + 1}.</span>
                    <span className="text-primary-900 font-medium truncate">{name}</span>
                  </div>
                  <span className="text-primary-600 pl-4 whitespace-nowrap">{formatCurrency(val as number)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formas de Pagamento Utilizadas</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {Object.entries(pagamentos).sort((a: any, b: any) => b[1] - a[1]).map(([name, val], i) => (
                <div key={i} className="flex justify-between items-center text-sm p-3 bg-primary-50 rounded-md">
                  <span className="text-primary-900 font-medium">{name}</span>
                  <span className="text-primary-600">{formatCurrency(val as number)}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-8 border-t border-primary-100 pt-6">
              <h4 className="text-sm font-semibold mb-4 text-primary-900">Status dos Lançamentos</h4>
              <div className="grid grid-cols-3 gap-2">
                 {['Pago', 'Aberto', 'Cancelado'].map(status => {
                   const total = data.realizado.filter(x => x.status_macro === status).reduce((acc,curr) => acc + curr.valor_realizado, 0);
                   return (
                     <div key={status} className="p-3 border border-primary-200 rounded-md text-center">
                        <p className="text-xs text-primary-500 mb-1">{status}</p>
                        <p className="text-sm font-semibold text-primary-900">{formatCurrency(total)}</p>
                     </div>
                   );
                 })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
