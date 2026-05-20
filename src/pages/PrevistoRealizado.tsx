import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

export function PrevistoRealizado() {
  const { data } = useApp();
  if (!data) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // Aggregate by Macro Account
  const macroAccMap: Record<string, { p: number, r: number }> = {};
  
  data.previsto.forEach(x => {
    if (!macroAccMap[x.conta_macro]) macroAccMap[x.conta_macro] = { p: 0, r: 0 };
    macroAccMap[x.conta_macro].p += x.valor_previsto;
  });
  
  data.realizado.forEach(x => {
    if (!macroAccMap[x.conta_macro]) macroAccMap[x.conta_macro] = { p: 0, r: 0 };
    macroAccMap[x.conta_macro].r += x.valor_realizado;
  });

  const tableData = Object.entries(macroAccMap).map(([conta, vals]) => {
    const desvio = vals.r - vals.p;
    return {
      conta,
      previsto: vals.p,
      realizado: vals.r,
      desvio,
      desvioPct: vals.p > 0 ? (desvio / vals.p) * 100 : 0
    };
  }).sort((a,b) => b.realizado - a.realizado);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Análise Consolidada - Previsto vs Realizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-primary-200">
                  <th className="pb-3 font-semibold text-primary-500">Conta Macro</th>
                  <th className="pb-3 font-semibold text-primary-500 text-right">Previsto</th>
                  <th className="pb-3 font-semibold text-primary-500 text-right">Realizado</th>
                  <th className="pb-3 font-semibold text-primary-500 text-right">Desvio (R$)</th>
                  <th className="pb-3 font-semibold text-primary-500 text-right">Desvio (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-100">
                {tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-primary-50 transition-colors">
                    <td className="py-3 font-medium text-primary-900">{row.conta}</td>
                    <td className="py-3 text-right text-primary-600">{formatCurrency(row.previsto)}</td>
                    <td className="py-3 text-right text-primary-600">{formatCurrency(row.realizado)}</td>
                    <td className="py-3 text-right">
                      <span className={row.desvio > 0 ? "text-primary-900 font-medium" : "text-primary-500"}>
                        {row.desvio > 0 ? '+' : ''}{formatCurrency(row.desvio)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium bg-primary-100 text-primary-700">
                        {row.desvioPct > 0 ? '+' : ''}{row.desvioPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
