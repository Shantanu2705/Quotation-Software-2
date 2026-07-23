import { motion } from "framer-motion";
import { Calendar as CalendarIcon, MapPin, Car, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const mockTrips: any[] = [];

export function UpcomingTrips() {
  return (
    <Card className="hover-lift border-none premium-shadow bg-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold tracking-tight">Upcoming Trips</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-medium">
          Open calendar <CalendarIcon className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {mockTrips.length > 0 ? (
          <div className="space-y-4 mt-2">
            {mockTrips.map((trip) => (
              <div key={trip.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Car size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{trip.client}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/50">
                        {trip.vehicle}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {trip.route}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {trip.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-md ${trip.status === 'Assigned' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary'}`}>
                    {trip.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">{trip.id}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Car className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No upcoming trips</p>
            <p className="text-sm text-muted-foreground mt-1">Scheduled trips will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
