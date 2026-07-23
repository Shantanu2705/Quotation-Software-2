"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/client";
import { Quotation } from "@/components/quotation/QuotationTable";
import { BillingTables } from "@/components/billing/BillingTables";
import { motion, AnimatePresence } from "framer-motion";

type Tab = "quotations" | "bookings";

export default function BillingPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("quotations");

  useEffect(() => {
    const q = query(collection(db, "quotations"), where("status", "==", "Confirmed"));
    
    const unsubscribeQuotations = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Quotation[];
      
      setQuotations(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching confirmed quotations:", error);
      setLoading(false);
    });

    const unsubscribeEnquiries = onSnapshot(collection(db, "enquiries"), (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEnquiries(data);
    });

    return () => {
      unsubscribeQuotations();
      unsubscribeEnquiries();
    };
  }, []);

  const pendingQuotations = quotations.filter(q => q.paymentStatus !== "Received");
  const pendingTourPackages = pendingQuotations.filter(q => q.type === "Tour Package Enquiry");
  const pendingTransportBookings = pendingQuotations.filter(q => q.type === "Transport Enquiry");

  const paidQuotations = quotations.filter(q => q.paymentStatus === "Received");
  const paidTourPackages = paidQuotations.filter(q => q.type === "Tour Package Enquiry");
  const paidTransportBookings = paidQuotations.filter(q => q.type === "Transport Enquiry");

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto min-h-screen pb-12">
      {/* Header */}
      <div className="flex justify-between items-start pt-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Billing & GST Invoices</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            {pendingQuotations.length} awaiting payment • {paidQuotations.length} confirmed bookings
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("quotations")}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === "quotations" 
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Confirmed Quotations ({pendingQuotations.length})
        </button>
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
            activeTab === "bookings" 
              ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-sm"
              : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Confirmed Bookings ({paidQuotations.length})
        </button>
      </div>

      {/* Content */}
      <div className="w-full bg-white dark:bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm min-h-[500px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 font-medium animate-pulse">
            Loading financial data...
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "quotations" && (
              <motion.div
                key="quotations"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-10"
              >
                <BillingTables tourPackages={pendingTourPackages} transportBookings={pendingTransportBookings} enquiries={enquiries} />
              </motion.div>
            )}
            
            {activeTab === "bookings" && (
              <motion.div
                key="bookings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-10"
              >
                <BillingTables tourPackages={paidTourPackages} transportBookings={paidTransportBookings} enquiries={enquiries} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
