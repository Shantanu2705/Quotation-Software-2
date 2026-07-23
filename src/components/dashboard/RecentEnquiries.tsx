import { motion } from "framer-motion";
import { ArrowRight, User, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Enquiry } from "@/components/enquiry/EnquiryTable";

export function RecentEnquiries({ data }: { data?: Enquiry[] }) {
  const enquiries = data || [];
  return (
    <Card className="hover-lift border-none premium-shadow bg-card h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold tracking-tight">Recent Enquiries</CardTitle>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-medium">
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {enquiries.length > 0 ? (
          <div className="space-y-4 mt-2">
            {enquiries.map((enquiry) => (
              <div key={enquiry.id} className="flex items-start justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{enquiry.customerName}</p>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary-foreground">
                        {enquiry.type}
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground mt-1 gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin size={12} /> {enquiry.tripRoute}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarIcon size={12} /> {enquiry.dates}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-1 rounded-md bg-accent text-accent-foreground">
                    {enquiry.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1">{enquiry.id}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No recent enquiries</p>
            <p className="text-sm text-muted-foreground mt-1">New enquiries will appear here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
