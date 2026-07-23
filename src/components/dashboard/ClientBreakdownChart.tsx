"use client";

import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Corporate Clients", value: 0, color: "#C69214" },
  { name: "Tourist Clients", value: 0, color: "#1B1B1B" },
  { name: "Event Management", value: 0, color: "#B3B1A9" },
  { name: "VIP Transfers", value: 0, color: "#F1C40F" },
];

export function ClientBreakdownChart() {
  return (
    <Card className="col-span-1 border-none premium-shadow bg-card flex flex-col hover-lift">
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Client Distribution</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)" }}
                itemStyle={{ color: "#1B1B1B", fontWeight: "bold" }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
