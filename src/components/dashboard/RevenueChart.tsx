"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Jan", revenue: 0, expenses: 0 },
  { name: "Feb", revenue: 0, expenses: 0 },
  { name: "Mar", revenue: 0, expenses: 0 },
  { name: "Apr", revenue: 0, expenses: 0 },
  { name: "May", revenue: 0, expenses: 0 },
  { name: "Jun", revenue: 0, expenses: 0 },
];

export function RevenueChart() {
  return (
    <Card className="col-span-1 lg:col-span-2 border-none premium-shadow bg-card flex flex-col hover-lift">
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Revenue vs Expenses</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-[250px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              />
              <Tooltip 
                cursor={{ fill: "hsl(var(--muted))", opacity: 0.2 }}
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)" }}
                formatter={(value: number) => [`₹${value.toLocaleString()}`, "Amount"]}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Bar dataKey="revenue" name="Revenue" fill="#C69214" radius={[4, 4, 0, 0]} barSize={30} />
              <Bar dataKey="expenses" name="Expenses" fill="#1B1B1B" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
