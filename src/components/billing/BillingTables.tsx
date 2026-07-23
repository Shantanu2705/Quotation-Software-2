import { useState, useEffect } from "react";
import { Quotation } from "@/components/quotation/QuotationTable";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { format } from "date-fns";
import { Receipt, FileText, ChevronDown, Trash2, Download } from "lucide-react";
import { useContext } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { generateAndDownloadPdf } from "@/lib/pdfUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (amount: number) => {
  return `Rs. ${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const PaymentBadge = ({ quotation }: { quotation: Quotation }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const status = quotation.paymentStatus || "In Progress";

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === status) return;
    setIsUpdating(true);
    try {
      const docRef = doc(db, "quotations", quotation.id);
      await updateDoc(docRef, { paymentStatus: newStatus });
    } catch (error) {
      console.error("Error updating payment status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const badgeStyles = {
    "In Progress": "bg-yellow-50 text-yellow-700 border border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-500 dark:border-yellow-900/50",
    "Received": "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-500 dark:border-emerald-900/50",
    "Refunded": "bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-500 dark:border-blue-900/50",
    "Cancelled": "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700",
  }[status] || "bg-slate-100 text-slate-600 border border-slate-200";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={isUpdating} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-sm ${badgeStyles} hover:opacity-80`}>
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'In Progress' ? 'bg-yellow-500' : status === 'Received' ? 'bg-emerald-500' : status === 'Refunded' ? 'bg-blue-500' : 'bg-slate-400'}`} />
        {isUpdating ? "Updating..." : status}
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40 rounded-xl">
        <DropdownMenuItem onClick={() => handleStatusChange("In Progress")} className="text-xs font-semibold text-yellow-600 cursor-pointer">
          In Progress
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Received")} className="text-xs font-semibold text-emerald-600 cursor-pointer">
          Received
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Refunded")} className="text-xs font-semibold text-blue-600 cursor-pointer">
          Refunded
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleStatusChange("Cancelled")} className="text-xs font-semibold text-slate-600 cursor-pointer">
          Cancelled
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export function BillingTables({ 
  tourPackages, 
  transportBookings,
  enquiries = []
}: { 
  tourPackages: Quotation[];
  transportBookings: Quotation[];
  enquiries?: any[];
}) {
  const { settings } = useSettings();
  
  const handleDownloadAdvance = async (q: Quotation, eq: any) => {
    const data = {
      title: "Advance Receipt",
      id: q.invoiceId || q.id,
      customerName: q.customerName,
      customerPhone: q.mobile || "",
      type: "Advance Receipt",
      details: {
        "Trip": eq?.tripRoute || q.destination,
        "Travel Dates": eq?.dates || q.travelStartDate,
        "Package Duration": q.packageDuration
      },
      tableHeaders: ["Description", "Amount"],
      tableRows: [
        ["Advance Payment for Tour", formatCurrency((q.grandTotal || 0) * (q.advancePercent || 0) / 100)]
      ],
      subtotal: (q.grandTotal || 0) * (q.advancePercent || 0) / 100,
      tax: 0,
      total: (q.grandTotal || 0) * (q.advancePercent || 0) / 100
    };
    await generateAndDownloadPdf(data, settings, `Advance_Receipt_${q.invoiceId || q.id}`);
  };

  const handleDownloadPayment = async (q: Quotation, eq: any) => {
    const data = {
      title: "Payment Invoice",
      id: q.invoiceId || q.id,
      customerName: q.customerName,
      customerPhone: q.mobile || "",
      type: "Payment Invoice",
      details: {
        "Trip": eq?.tripRoute || q.destination,
        "Travel Dates": eq?.dates || q.travelStartDate,
        "Package Duration": q.packageDuration
      },
      tableHeaders: ["Description", "Amount"],
      tableRows: [
        ["Full Payment for Tour", formatCurrency(q.grandTotal || 0)]
      ],
      subtotal: q.subtotal || 0,
      tax: (q.grandTotal || 0) - (q.subtotal || 0),
      total: q.grandTotal || 0,
      advanceAmount: (q.grandTotal || 0) * (q.advancePercent || 0) / 100,
      balance: 0
    };
    await generateAndDownloadPdf(data, settings, `Payment_Invoice_${q.invoiceId || q.id}`);
  };

  const handleDownloadGST = async (q: Quotation, eq: any) => {
    const data = {
      title: "GST Invoice",
      id: q.invoiceId || q.id,
      customerName: q.customerName,
      customerPhone: q.mobile || "",
      type: "GST Invoice",
      details: {
        "Trip": eq?.tripRoute || q.destination,
        "Travel Dates": eq?.dates || q.travelStartDate,
        "Package Duration": q.packageDuration
      },
      tableHeaders: ["Description", "Amount"],
      tableRows: [
        ["Tour Package Booking", formatCurrency(q.subtotal || 0)]
      ],
      subtotal: q.subtotal || 0,
      tax: (q.grandTotal || 0) - (q.subtotal || 0),
      total: q.grandTotal || 0
    };
    await generateAndDownloadPdf(data, settings, `GST_Invoice_${q.invoiceId || q.id}`);
  };
  useEffect(() => {
    const allQuotations = [...tourPackages, ...transportBookings];
    allQuotations.forEach(q => {
      if (!q.invoiceId) {
        const newInvoiceId = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        updateDoc(doc(db, "quotations", q.id), { invoiceId: newInvoiceId }).catch(console.error);
      }
    });
  }, [tourPackages, transportBookings]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this billing record?")) {
      try {
        await deleteDoc(doc(db, "quotations", id));
      } catch (error) {
        console.error("Error deleting quotation:", error);
      }
    }
  };

  return (
    <div className="flex flex-col gap-10">
      
      {/* CONFIRMED QUOTATIONS TABLE */}
      {tourPackages.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4 pl-1">Tour Packages</h2>
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-border">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50/50 dark:bg-card border-b border-slate-200 dark:border-border">
                <tr>
                  <th className="px-5 py-4 font-bold">Invoice ID</th>
                  <th className="px-5 py-4 font-bold">Customer</th>
                  <th className="px-5 py-4 font-bold">Destination</th>
                  <th className="px-5 py-4 font-bold">Travel</th>
                  <th className="px-5 py-4 font-bold">Payment</th>
                  <th className="px-5 py-4 font-bold">Amount</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/50">
                {tourPackages.map((q) => {
                  const eq = enquiries.find(e => e.id === q.enquiryId);
                  const eqDates = eq?.dates;
                  const travelStart = eq?.startDate || q.travelStartDate;
                  const travelEnd = eq?.endDate || q.travelEndDate;
                  
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                        {q.invoiceId || "Generating..."}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {q.customerName}
                          {q.clientType === "B2B" && <span className="text-[10px] text-slate-400 font-semibold">(Corp)</span>}
                        </div>
                        <div className="text-[12px] text-slate-500 font-medium">{q.mobile}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">
                        {q.destination}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                        {eqDates ? eqDates : (
                          <>{travelStart ? format(new Date(travelStart), "d MMM") : "TBD"} {travelEnd ? `- ${format(new Date(travelEnd), "d MMM yyyy")}` : ""}</>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <PaymentBadge quotation={q} />
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(q.grandTotal || 0)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDownloadAdvance(q, eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 transition-colors text-[11px] font-bold">
                            <Receipt className="w-3.5 h-3.5" />
                            Advance ({formatCurrency((q.grandTotal || 0) * (q.advancePercent || 0) / 100)})
                          </button>
                          <button 
                            disabled={q.paymentStatus !== "Received"}
                            onClick={() => handleDownloadPayment(q, eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 transition-colors text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            <Download className="w-3.5 h-3.5" />
                            Payment Invoice
                          </button>
                          <button 
                            disabled={q.paymentStatus !== "Received"}
                            onClick={() => handleDownloadGST(q, eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-500 dark:border-yellow-700/50 transition-colors text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            <FileText className="w-3.5 h-3.5" />
                            GST Invoice
                          </button>
                          <button onClick={() => handleDelete(q.id)} title="Delete Record" className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* CONFIRMED BOOKINGS TABLE */}
      {transportBookings.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-slate-500 tracking-widest uppercase mb-4 pl-1">Transport Bookings</h2>
          <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-border">
            <table className="w-full text-sm text-left">
              <thead className="text-[11px] font-bold text-slate-500 uppercase bg-slate-50/50 dark:bg-card border-b border-slate-200 dark:border-border">
                <tr>
                  <th className="px-5 py-4 font-bold">Invoice ID</th>
                  <th className="px-5 py-4 font-bold">Client</th>
                  <th className="px-5 py-4 font-bold">Dates</th>
                  <th className="px-5 py-4 font-bold">Payment</th>
                  <th className="px-5 py-4 font-bold">Amount</th>
                  <th className="px-5 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-border/50">
                {transportBookings.map((q) => {
                  const eq = enquiries.find(e => e.id === q.enquiryId);
                  const eqDates = eq?.dates;
                  const travelStart = eq?.startDate || q.travelStartDate;
                  const travelEnd = eq?.endDate || q.travelEndDate;
                  
                  return (
                    <tr key={q.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-300">
                        {q.invoiceId || "Generating..."}
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {q.customerName}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-slate-500 font-medium whitespace-nowrap">
                        {eqDates ? eqDates : (
                          <>{travelStart ? format(new Date(travelStart), "d MMM") : "TBD"} {travelEnd ? `- ${format(new Date(travelEnd), "d MMM yyyy")}` : ""}</>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <PaymentBadge quotation={q} />
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(q.grandTotal || 0)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleDownloadAdvance(q, eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50 transition-colors text-[11px] font-bold">
                            <Receipt className="w-3.5 h-3.5" />
                            Advance ({formatCurrency((q.grandTotal || 0) * (q.advancePercent || 0) / 100)})
                          </button>
                          <button 
                            disabled={q.paymentStatus !== "Received"}
                            onClick={() => handleDownloadPayment(q, eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50 transition-colors text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            <Download className="w-3.5 h-3.5" />
                            Payment Invoice
                          </button>
                          <button 
                            disabled={q.paymentStatus !== "Received"}
                            onClick={() => handleDownloadGST(q, eq)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-500 dark:border-yellow-700/50 transition-colors text-[11px] font-bold disabled:opacity-50 disabled:cursor-not-allowed">
                            <FileText className="w-3.5 h-3.5" />
                            GST Invoice
                          </button>
                          <button onClick={() => handleDelete(q.id)} title="Delete Record" className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tourPackages.length === 0 && transportBookings.length === 0 && (
        <div className="text-center text-slate-400 font-medium py-12">
          No confirmed quotations or bookings found.
        </div>
      )}
    </div>
  );
}
