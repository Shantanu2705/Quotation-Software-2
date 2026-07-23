"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/client";
import { Enquiry } from "@/components/enquiry/EnquiryTable";
import { 
  FileText, 
  Calendar,
  FileSignature,
  CheckCircle,
  Clock,
  Building,
  Luggage,
  Car,
  Users,
  IndianRupee,
  Activity,
  Plus
} from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RecentEnquiries } from "@/components/dashboard/RecentEnquiries";
import { UpcomingTrips } from "@/components/dashboard/UpcomingTrips";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { ClientBreakdownChart } from "@/components/dashboard/ClientBreakdownChart";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "enquiries"), (snapshot) => {
      const data: Enquiry[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Enquiry);
      });
      // Sort descending (latest first, assuming IDs like PKG-2026-0001)
      setEnquiries(data.sort((a, b) => b.id.localeCompare(a.id)));
    });

    return () => unsubscribe();
  }, []);

  const totalEnquiries = enquiries.length;
  const totalQuotations = enquiries.filter(e => e.status === "Quotation Sent").length;
  const confirmedBookings = enquiries.filter(e => e.status === "Confirmed").length;
  const pendingBookings = enquiries.filter(e => e.status === "Follow Up" || e.status === "New").length;
  const corporateClients = enquiries.filter(e => e.clientType === "B2B").length;
  const touristClients = enquiries.filter(e => e.clientType === "B2C").length;

  const dashboardStats = [
    { title: "Total Enquiries", value: totalEnquiries.toString(), icon: FileText, trend: `${totalEnquiries > 0 ? "Up to date" : "Waiting for entries"}` },
    { title: "Today's Enquiries", value: "0", icon: Calendar },
    { title: "Total Quotations", value: totalQuotations.toString(), icon: FileSignature },
    { title: "Confirmed Bookings", value: confirmedBookings.toString(), icon: CheckCircle },
    { title: "Pending Bookings", value: pendingBookings.toString(), icon: Clock },
    { title: "Corporate Clients", value: corporateClients.toString(), icon: Building },
    { title: "Tourist Clients", value: touristClients.toString(), icon: Luggage },
    { title: "Active Vehicles", value: "0", icon: Car },
    { title: "Total Drivers", value: "0", icon: Users },
    { title: "Monthly Revenue", value: "₹0", icon: IndianRupee },
    { title: "Annual Revenue", value: "₹0", icon: IndianRupee },
    { title: "Fleet Utilization", value: "0%", icon: Activity },
  ];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2 font-medium">
            Here's what's happening across your fleet today.
          </p>
        </motion.div>
      </div>

      {/* Dynamic Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {dashboardStats.map((stat, index) => (
          <StatsCard 
            key={stat.title} 
            title={stat.title} 
            value={stat.value} 
            icon={stat.icon} 
            trend={stat.trend} 
            delay={0.05 * index} 
          />
        ))}
      </div>

      {/* Dynamic Charts Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3 mt-4">
        <ClientBreakdownChart />
        <RevenueChart />
        <ActivityChart />
      </div>

      {/* Recent Activity Sections */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mt-2">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <RecentEnquiries data={enquiries.slice(0, 5)} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <UpcomingTrips />
        </motion.div>
      </div>
    </div>
  );
}
