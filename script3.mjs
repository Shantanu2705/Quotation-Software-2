import fs from 'fs';

const content = `"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Plus, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/firebase/client";
import { collection, onSnapshot, doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected";

export interface ItineraryDay {
  day: number;
  title: string;
  description: string;
}

export interface QuotationVehicle {
  vehicleType: string;
  qty: number;
  days: number;
  rate: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
}

export interface QuotationRoute {
  routeName: string;
  to: string;
  estTime: string;
  vehicleType: string;
  via: string;
}

export interface Quotation {
  id: string;
  enquiryId: string;
  customerName: string;
  mobile: string;
  destination: string;
  pax: number;
  clientType: "B2B" | "B2C";
  type: string;
  status: QuotationStatus;
  
  travelStartDate: string;
  travelEndDate: string;
  packageDuration: string;
  pickupLocation: string;
  dropLocation: string;

  itinerary: ItineraryDay[];
  vehicles: QuotationVehicle[];
  routes: QuotationRoute[];
  inclusions: string[];
  exclusions: string[];
  permits: string[];
  sightseeing: string[];

  rateCard: {
    perDay: number;
    packagePrice: number;
    permits: number;
    toll: number;
    parking: number;
    extraVehicle: number;
    gstPercent: number;
    additionalCharges: number;
  };
  
  advancePercent: number;
  subtotal: number;
  grandTotal: number;
  advanceAmount: number;
  balance: number;

  pickupTiming: string;
  dropTiming: string;
  driverInstructions: string;
  vehicleNotes: string;
  remarks: string;
}

export function QuotationTable() {
  const router = useRouter();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [typeFilter, setTypeFilter] = useState<string>("Type");
  const [statusFilter, setStatusFilter] = useState<string>("Status");

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "quotations"), (snapshot) => {
      const data: Quotation[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Quotation);
      });
      setQuotations(data.sort((a, b) => b.id.localeCompare(a.id)));
    });
    return () => unsubscribe();
  }, []);

  const filters = [
    { defaultLabel: "Type", value: typeFilter, setter: setTypeFilter, options: ["Type", "Tour Package Enquiry", "Transport Enquiry"] },
    { defaultLabel: "Status", value: statusFilter, setter: setStatusFilter, options: ["Status", "Draft", "Sent", "Accepted", "Rejected"] },
  ];

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch = 
      (q.customerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.enquiryId || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.destination || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "Type" || q.type === typeFilter;
    const matchesStatus = statusFilter === "Status" || q.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: QuotationStatus) => {
    switch (status) {
      case "Draft": return "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "Sent": return "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Accepted": return "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "Rejected": return "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  const updateStatus = async (id: string, newStatus: QuotationStatus) => {
    try {
      await setDoc(doc(db, "quotations", id), { status: newStatus }, { merge: true });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f4fbfa] dark:bg-background -mx-6 md:-mx-8 -mt-6 md:-mt-8 p-2 md:p-4 min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quotations</h1>
          <p className="text-sm text-slate-500 font-medium">{filteredQuotations.length} of {quotations.length} shown</p>
        </div>
        <Button onClick={() => router.push("/quotation/new")} className="bg-[#f0a500] hover:bg-[#d99400] text-white rounded-full px-6 premium-shadow font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New quotation
        </Button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border overflow-hidden flex-1">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-border flex flex-col xl:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search customer, destination, quotation id..." 
              className="pl-10 w-full bg-slate-50/50 dark:bg-muted/50 border-slate-200 dark:border-border rounded-xl h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 hide-scrollbar">
            {filters.map((filter) => (
              <DropdownMenu key={filter.defaultLabel}>
                <DropdownMenuTrigger className={buttonVariants({ variant: "outline", className: "rounded-full text-slate-600 dark:text-slate-300 font-medium whitespace-nowrap bg-white dark:bg-card border-slate-200 dark:border-border h-10 px-4 cursor-pointer" })}>
                  {filter.value} <ChevronDown className="ml-2 h-4 w-4 text-slate-400" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl">
                  {filter.options.map(opt => (
                    <DropdownMenuItem key={opt} onClick={() => filter.setter(opt)} className="cursor-pointer">
                      {opt}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-muted/30">
              <TableRow className="border-slate-100 dark:border-border hover:bg-transparent">
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4 py-2">Quotation ID</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4">Customer</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4">Destination</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4">Travel</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4">Type</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4">Total</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredQuotations.map((q) => (
                <TableRow key={q.id} className="border-slate-100 dark:border-border group">
                  <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap px-4 py-3">
                    <div className="font-semibold text-slate-900 dark:text-white text-[12px]">{q.id}</div>
                    {q.enquiryId && <div className="text-[10px] text-slate-400 mt-0.5">Ref: {q.enquiryId}</div>}
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="font-semibold text-slate-900 dark:text-white text-[12px]">{q.customerName}</div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="text-[12px] font-medium text-slate-700 dark:text-slate-300">{q.destination}</div>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="text-[12px] text-slate-600 dark:text-slate-400">
                      {q.travelStartDate ? \`\${q.travelStartDate} to \${q.travelEndDate}\` : q.packageDuration}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium border border-slate-200 text-slate-700 bg-white dark:bg-muted dark:border-border dark:text-slate-300">
                      {q.type}
                    </span>
                  </TableCell>
                  <TableCell className="px-4">
                    <div className="text-[13px] font-bold text-slate-900 dark:text-white">
                      {q.grandTotal ? \`₹\${q.grandTotal}\` : "-"}
                    </div>
                  </TableCell>
                  <TableCell className="px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold \${getStatusColor(q.status)} transition-colors whitespace-nowrap\`}>
                        {q.status} <ChevronDown className="ml-1.5 h-3 w-3 opacity-70" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 rounded-xl">
                        {(["Draft", "Sent", "Accepted", "Rejected"] as QuotationStatus[]).map((status) => (
                          <DropdownMenuItem key={status} onClick={() => updateStatus(q.id, status)} className="text-[12px] font-medium cursor-pointer">
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap px-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] text-slate-600 hover:text-primary font-semibold" onClick={() => router.push(\`/quotation/\${q.id}\`)}>
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredQuotations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-slate-500 font-medium">
                    No quotations found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/quotation/QuotationTable.tsx', content);
