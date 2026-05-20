import { useApp } from '../store/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, Bar } from 'recharts';

export function AnaliseTemporal() {
  const { data } = useApp();
  if (!data) return null;

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val);

  // Group by quarter
  const quarters = [1, 2, 3, 4];
  const qData = quarters.map(q => {
    const p = data.previsto.filter(x => Math.ceil(x.mes_num / 3) === q).reduce((a, b) => a + b.valor_previsto, 0);
    const r = data.realizado.filter(x => x.trimestre === q).reduce((a, b) => a + b.valor_realizado, 0);
    return { name: `Q${q}`, Previsto: p, Realizado: r };
  });

  // Accumulate YTD
  let pYTD = 0;
  let rYTD = 0;
  const ytdData = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((m, i) => {
    pYTD += data.previsto.filter(x => x.mes_num === i + 1).reduce((a, b) => a + b.valor_previsto, 0);
    rYTD += data.realizado.filter(x => x.mes_num === i + 1).reduce((a, b) => a + b.valor_realizado, 0);
    return { mes: m, PrevistoYTD: pYTD, RealizadoYTD: rYTD };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comparativo por Trimestre</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={qData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="Previsto" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Realizado" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acumulado (Período)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ytdData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `R$${(val/1000).toFixed(0)}k`} />
                <Tooltip formatter={(val: number) => formatCurrency(val)} cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="PrevistoYTD" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                <Bar dataKey="RealizadoYTD" fill="#111827" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
