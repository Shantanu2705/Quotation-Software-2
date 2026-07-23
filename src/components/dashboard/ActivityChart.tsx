"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const data = [
  { name: "Mon", enquiries: 0, bookings: 0 },
  { name: "Tue", enquiries: 0, bookings: 0 },
  { name: "Wed", enquiries: 0, bookings: 0 },
  { name: "Thu", enquiries: 0, bookings: 0 },
  { name: "Fri", enquiries: 0, bookings: 0 },
  { name: "Sat", enquiries: 0, bookings: 0 },
  { name: "Sun", enquiries: 0, bookings: 0 },
];

export function ActivityChart() {
  return (
    <Card className="col-span-1 lg:col-span-3 border-none premium-shadow bg-card flex flex-col hover-lift">
      <CardHeader>
        <CardTitle className="text-lg font-bold tracking-tight">Enquiries vs Bookings</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-4">
        <div className="h-[250px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEnquiries" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C69214" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C69214" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4D4D4D" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4D4D4D" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              />
              <Tooltip 
                contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)" }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="enquiries" 
                name="Enquiries"
                stroke="#C69214" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEnquiries)" 
              />
              <Area 
                type="monotone" 
                dataKey="bookings" 
                name="Confirmed Bookings"
                stroke="#4D4D4D" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBookings)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
