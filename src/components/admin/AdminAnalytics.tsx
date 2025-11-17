import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useAdminStatistics, useAdminAnalytics } from '@/hooks/useAdmin';
import { Calendar } from 'lucide-react';

const monthLabels = ['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'];
const COLORS = ['#4f46e5', '#22c55e', '#06b6d4', '#f59e0b'];

export default function AdminAnalytics() {
  const { statistics } = useAdminStatistics();
  const { data, loading, refetch } = useAdminAnalytics();

  useEffect(() => {
    const id = setInterval(() => refetch(), 30000);
    return () => clearInterval(id);
  }, [refetch]);

  const k = data?.kpis || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">Analytics</h2>
          <p className="text-muted-foreground">Resumo do painel administrativo</p>
        </div>
        <Button variant="outline" size="sm"><Calendar className="h-4 w-4 mr-2" />01.01.{new Date().getFullYear()} - 31.12.{new Date().getFullYear()}</Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Orders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? '...' : k.orders?.toLocaleString()}</div><p className="text-xs text-muted-foreground">Atualizado</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Approved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? '...' : k.approved?.toLocaleString()}</div><p className="text-xs text-muted-foreground">Pedidos entregues</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? '...' : (statistics?.users.total || 0).toLocaleString()}</div><p className="text-xs text-muted-foreground">Ativos: {statistics?.users.active}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Subscriptions</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? '...' : k.subscriptions?.toLocaleString()}</div><p className="text-xs text-muted-foreground">Contas verificadas</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Month total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? '...' : k.monthTotal?.toLocaleString()}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{loading ? '...' : `Kz ${Number(k.revenue || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}</div></CardContent></Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Users breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-40">
              <PieChart>
                <Pie data={data?.charts?.pies?.users || []} dataKey="value" nameKey="name" outerRadius={70}>
                  {(data?.charts?.pies?.users || []).map((_, idx) => (<Cell key={idx} fill={COLORS[idx % COLORS.length]} />))}
                </Pie>
              </PieChart>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Payments</CardTitle></CardHeader>
          <CardContent>
            <div className="h-40">
              <PieChart>
                <Pie data={data?.charts?.pies?.subscriptions || []} dataKey="value" nameKey="name" outerRadius={70}>
                  {(data?.charts?.pies?.subscriptions || []).map((_, idx) => (<Cell key={idx} fill={COLORS[(idx+1) % COLORS.length]} />))}
                </Pie>
              </PieChart>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Sales dynamics</CardTitle><CardDescription>{new Date().getFullYear()}</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={{ orders: { label: 'Pedidos', color: 'hsl(var(--primary))' } }}>
              <BarChart data={data?.charts?.salesDynamics || monthLabels.map((m)=>({name:m,orders:0}))}>
                <XAxis dataKey="name" /><YAxis /><Bar dataKey="orders" fill="var(--color-orders)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Overall User Activity</CardTitle><CardDescription>{new Date().getFullYear()}</CardDescription></CardHeader>
          <CardContent>
            <ChartContainer config={{ activity: { label: 'Atividade', color: 'hsl(var(--accent))' } }}>
              <LineChart data={data?.charts?.userActivityMonthly || monthLabels.map((m)=>({name:m,activity:0}))}>
                <XAxis dataKey="name" /><YAxis /><Line type="monotone" dataKey="activity" stroke="var(--color-activity)" strokeWidth={2} dot={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Finance cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Paid invoices</CardTitle><CardDescription>Current Fiscal Year</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? '...' : `Kz ${Number(data?.finances?.paidInvoices || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Funds received</CardTitle><CardDescription>Current Fiscal Year</CardDescription></CardHeader>
          <CardContent><div className="text-3xl font-bold">{loading ? '...' : `Kz ${Number(data?.finances?.fundsReceived || 0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}</div></CardContent>
        </Card>
      </div>

      {/* Customer order table */}
      <Card>
        <CardHeader><CardTitle>Customer order</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">Profile</th>
                  <th className="p-2 text-left">Address</th>
                  <th className="p-2 text-left">Date</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-right">Price</th>
                </tr>
              </thead>
              <tbody>
                {(data?.table?.customerOrders || []).map((r: any, idx: number) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2">{r.profile}</td>
                    <td className="p-2">{r.address}</td>
                    <td className="p-2">{r.date}</td>
                    <td className="p-2">{r.status}</td>
                    <td className="p-2 text-right">{`Kz ${Number(r.price||0).toLocaleString('pt-BR',{minimumFractionDigits:2})}`}</td>
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