import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ArrowDownRight, ArrowUpRight, DollarSign, List, Briefcase, FileText } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar, Line, Cell } from 'recharts';

export function VisaoExecutiva() {
  const { data } = useApp();
  
  if (!data) return null;

  const totalPrevisto = data.previsto.reduce((acc, curr) => acc + curr.valor_previsto, 0);
  const totalRealizado = data.realizado.reduce((acc, curr) => acc + curr.valor_realizado, 0);
  const desvio = totalRealizado - totalPrevisto;
  const desvioPercentual = totalPrevisto > 0 ? (desvio / totalPrevisto) * 100 : 0;

  const numFornecedores = new Set(data.realizado.map(r => r.fornecedor_padronizado)).size;
  const numLancamentos = data.realizado.length;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Evolução Mensal Previsto vs Realizado
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dataChart = meses.map((m, idx) => {
    const p = data.previsto.filter(x => x.mes_num === idx + 1).reduce((acc, curr) => acc + curr.valor_previsto, 0);
    const r = data.realizado.filter(x => x.mes_num === idx + 1).reduce((acc, curr) => acc + curr.valor_realizado, 0);
    return { mes: m, Previsto: p, Realizado: r };
  });

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary-500">Total Previsto (Ano)</p>
                <h3 className="text-2xl font-semibold text-primary-900 mt-1">{formatCurrency(totalPrevisto)}</h3>
              </div>
              <div className="p-2 bg-primary-50 rounded-md">
                <FileText className="w-4 h-4 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary-500">Total Realizado (YTD)</p>
                <h3 className="text-2xl font-semibold text-primary-900 mt-1">{formatCurrency(totalRealizado)}</h3>
              </div>
              <div className="p-2 bg-primary-50 rounded-md">
                <DollarSign className="w-4 h-4 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary-500">Desvio Absoluto</p>
                <h3 className="text-2xl font-semibold text-primary-900 mt-1">{formatCurrency(desvio)}</h3>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {desvio > 0 ? <ArrowUpRight className="w-4 h-4 text-primary-900" /> : <ArrowDownRight className="w-4 h-4 text-primary-500" />}
                <span className="text-sm font-medium">{Math.abs(desvioPercentual).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-primary-500">Fornecedores / Lançamentos</p>
                <h3 className="text-2xl font-semibold text-primary-900 mt-1">{numFornecedores}</h3>
              </div>
              <div className="p-2 bg-primary-50 rounded-md">
                <Briefcase className="w-4 h-4 text-primary-600" />
              </div>
            </div>
            <p className="text-sm text-primary-500 mt-2">{numLancamentos} despesas lançadas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Previsto vs Realizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dataChart} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(val: number) => formatCurrency(val)} 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }} 
                  />
                  <Bar dataKey="Realizado" fill="#111827" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line type="monotone" dataKey="Previsto" stroke="#9ca3af" strokeWidth={2} dot={{ r: 4, fill: '#9ca3af', strokeWidth: 0 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Small insights or Top Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Top Contas Executadas</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Compute top 5 macro accounts */}
            {(() => {
              const macroMap = data.realizado.reduce((acc, r) => {
                acc[r.conta_macro] = (acc[r.conta_macro] || 0) + r.valor_realizado;
                return acc;
              }, {} as Record<string, number>);
              
              const sorted = Object.entries(macroMap).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5);
              
              return (
                <div className="space-y-4">
                  {sorted.map(([name, val]) => (
                    <div key={name} className="flex justify-between items-center text-sm">
                      <span className="text-primary-600 font-medium truncate pr-2">{name}</span>
                      <span className="text-primary-900 font-semibold">{formatCurrency(val as number)}</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
