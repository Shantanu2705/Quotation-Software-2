import fs from 'fs';

const content = `"use client";

import { useState, useEffect } from "react";
import { Search, ChevronDown, Plus, Pencil, Trash2, X, Info } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { db } from "@/firebase/client";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";

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
  const searchParams = useSearchParams();
  const enquiryIdFromQuery = searchParams.get("enquiryId");

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isNewQuotation, setIsNewQuotation] = useState(false);

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

  useEffect(() => {
    if (enquiryIdFromQuery) {
      const fetchEnquiry = async () => {
        try {
          const docRef = doc(db, "enquiries", enquiryIdFromQuery);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const eq = docSnap.data();
            
            const year = new Date().getFullYear();
            const lastQuote = quotations.find(q => q.id.startsWith(\`QTN-\${year}\`));
            let nextNum = 1;
            if (lastQuote) {
              const lastNum = parseInt(lastQuote.id.split("-")[2], 10);
              if (!isNaN(lastNum)) nextNum = lastNum + 1;
            }
            const newId = \`QTN-\${year}-\${nextNum.toString().padStart(4, "0")}\`;

            setEditingQuotation({
              id: newId,
              enquiryId: eq.id,
              customerName: eq.customerName || "",
              mobile: eq.customerPhone || eq.mobile || "",
              destination: eq.destination || eq.tripRoute || "",
              pax: eq.pax || 2,
              clientType: eq.clientType || "B2C",
              type: eq.type || "Tour Package Enquiry",
              status: "Draft",
              
              travelStartDate: eq.startDate || "",
              travelEndDate: eq.endDate || "",
              packageDuration: eq.days ? \`\${eq.days-1}N / \${eq.days}D\` : "1N / 2D",
              pickupLocation: eq.pickup || "NJP / IXB / Siliguri",
              dropLocation: eq.drop || "NJP / IXB / Siliguri",
              
              itinerary: [],
              vehicles: [],
              routes: [],
              inclusions: [],
              exclusions: [],
              permits: [],
              sightseeing: [],
              
              rateCard: {
                perDay: 0, packagePrice: 0, permits: 0, toll: 0, 
                parking: 0, extraVehicle: 0, gstPercent: 0, additionalCharges: 0
              },
              
              advancePercent: 30,
              subtotal: 0,
              grandTotal: 0,
              advanceAmount: 0,
              balance: 0,
              
              pickupTiming: "",
              dropTiming: "",
              driverInstructions: "",
              vehicleNotes: "",
              remarks: eq.customerRemarks || ""
            });
            setIsNewQuotation(true);
            router.replace("/quotation");
          }
        } catch (error) {
          console.error("Error fetching enquiry:", error);
        }
      };
      if (quotations.length > 0 || quotations.length === 0) { 
          fetchEnquiry();
      }
    }
  }, [enquiryIdFromQuery, router, quotations.length]);

  const filters = [
    { defaultLabel: "Type", value: typeFilter, setter: setTypeFilter, options: ["Type", "Tour Package Enquiry", "Transport Enquiry"] },
    { defaultLabel: "Status", value: statusFilter, setter: setStatusFilter, options: ["Status", "Draft", "Sent", "Accepted", "Rejected"] },
  ];

  const filteredQuotations = quotations.filter((q) => {
    const matchesSearch = 
      q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.enquiryId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
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

  const handleNewQuotation = () => {
    const year = new Date().getFullYear();
    const lastQuote = quotations.find(q => q.id.startsWith(\`QTN-\${year}\`));
    let nextNum = 1;
    if (lastQuote) {
      const lastNum = parseInt(lastQuote.id.split("-")[2], 10);
      if (!isNaN(lastNum)) nextNum = lastNum + 1;
    }
    const newId = \`QTN-\${year}-\${nextNum.toString().padStart(4, "0")}\`;

    setEditingQuotation({
      id: newId,
      enquiryId: "",
      customerName: "",
      mobile: "",
      destination: "",
      pax: 2,
      clientType: "B2C",
      type: "Tour Package Enquiry",
      status: "Draft",
      travelStartDate: "",
      travelEndDate: "",
      packageDuration: "1N / 2D",
      pickupLocation: "NJP / IXB / Siliguri",
      dropLocation: "NJP / IXB / Siliguri",
      itinerary: [],
      vehicles: [],
      routes: [],
      inclusions: [],
      exclusions: [],
      permits: [],
      sightseeing: [],
      rateCard: {
        perDay: 0, packagePrice: 0, permits: 0, toll: 0, 
        parking: 0, extraVehicle: 0, gstPercent: 0, additionalCharges: 0
      },
      advancePercent: 30,
      subtotal: 0,
      grandTotal: 0,
      advanceAmount: 0,
      balance: 0,
      pickupTiming: "",
      dropTiming: "",
      driverInstructions: "",
      vehicleNotes: "",
      remarks: ""
    });
    setIsNewQuotation(true);
  };

  // Auto Calculations Derived from Editing State
  let baseFare = 0;
  let derivedSubtotal = 0;
  let derivedGrandTotal = 0;
  let derivedAdvance = 0;
  let derivedBalance = 0;
  
  if (editingQuotation) {
    const hasVehicleRates = editingQuotation.vehicles.some(v => v.rate > 0);
    if (hasVehicleRates) {
      baseFare = editingQuotation.vehicles.reduce((acc, v) => acc + (v.qty * v.days * v.rate), 0);
    } else {
      baseFare = editingQuotation.rateCard.packagePrice || 0;
    }

    const permits = editingQuotation.rateCard.permits || 0;
    const toll = editingQuotation.rateCard.toll || 0;
    const parking = editingQuotation.rateCard.parking || 0;
    const extraVeh = editingQuotation.rateCard.extraVehicle || 0;
    const additional = editingQuotation.rateCard.additionalCharges || 0;
    
    derivedSubtotal = baseFare + permits + toll + parking + extraVeh + additional;
    const gstAmt = (derivedSubtotal * (editingQuotation.rateCard.gstPercent || 0)) / 100;
    derivedGrandTotal = derivedSubtotal + gstAmt;
    derivedAdvance = (derivedGrandTotal * (editingQuotation.advancePercent || 0)) / 100;
    derivedBalance = derivedGrandTotal - derivedAdvance;
  }

  const handleSaveForm = async () => {
    if (!editingQuotation) return;
    
    // Inject latest derived totals before saving
    const toSave = {
      ...editingQuotation,
      subtotal: derivedSubtotal,
      grandTotal: derivedGrandTotal,
      advanceAmount: derivedAdvance,
      balance: derivedBalance
    };

    try {
      await setDoc(doc(db, "quotations", toSave.id), toSave);
    } catch (error) {
      console.error("Error saving quotation:", error);
    }
    setEditingQuotation(null);
    setIsNewQuotation(false);
  };

  const handleDelete = async () => {
    if (!editingQuotation) return;
    try {
      await deleteDoc(doc(db, "quotations", editingQuotation.id));
    } catch (error) {
      console.error("Error deleting quotation:", error);
    }
    setEditingQuotation(null);
    setIsNewQuotation(false);
  };

  const updateStatus = async (id: string, newStatus: QuotationStatus) => {
    try {
      await setDoc(doc(db, "quotations", id), { status: newStatus }, { merge: true });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const setEditField = (field: keyof Quotation, value: any) => {
    setEditingQuotation(prev => prev ? { ...prev, [field]: value } : null);
  };
  const setRateCardField = (field: keyof Quotation['rateCard'], value: number) => {
    setEditingQuotation(prev => prev ? { ...prev, rateCard: { ...prev.rateCard, [field]: value } } : null);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4fbfa] dark:bg-background -mx-6 md:-mx-8 -mt-6 md:-mt-8 p-2 md:p-4 min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Quotations</h1>
          <p className="text-sm text-slate-500 font-medium">{filteredQuotations.length} of {quotations.length} shown</p>
        </div>
        <Button onClick={handleNewQuotation} className="bg-[#f0a500] hover:bg-[#d99400] text-white rounded-full px-6 premium-shadow font-semibold">
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
                      <Button variant="ghost" size="sm" className="h-7 px-2.5 text-[11px] text-slate-600 hover:text-primary font-semibold" onClick={() => setEditingQuotation(q)}>
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

      {/* Edit/New Sheet (Slide-over) */}
      <Sheet open={!!editingQuotation} onOpenChange={(open) => {
        if (!open) {
          setEditingQuotation(null);
          setIsNewQuotation(false);
        }
      }}>
        <SheetContent className="sm:max-w-[800px] w-full sm:w-[90vw] flex flex-col p-0 border-l-0">
          <SheetHeader className="px-6 py-4 border-b border-slate-100 dark:border-border">
            <div className="flex items-center justify-between">
              <div>
                <SheetTitle className="text-xl">{isNewQuotation ? "New quotation" : "Edit quotation"}</SheetTitle>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-primary font-mono text-xs bg-primary/10 px-2 py-1 rounded-md">ID: {editingQuotation?.id}</span>
                  <span className="text-muted-foreground text-xs">{editingQuotation?.type}</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <span className={\`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold \${getStatusColor(editingQuotation?.status || "Draft")}\`}>
                  {editingQuotation?.status}
                </span>
              </div>
            </div>
          </SheetHeader>
          
          {editingQuotation && (
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-slate-50/30 dark:bg-background">
              <Accordion type="multiple" defaultValue={["customer", "pricing"]} className="space-y-4">
                
                {/* 1. Customer & Travel */}
                <AccordionItem value="customer" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Customer & Travel Info
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Customer Name</label>
                        <Input 
                          value={editingQuotation.customerName}
                          onChange={(e) => setEditField("customerName", e.target.value)}
                          className="rounded-xl h-9 text-[13px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Mobile</label>
                        <Input 
                          value={editingQuotation.mobile}
                          onChange={(e) => setEditField("mobile", e.target.value)}
                          className="rounded-xl h-9 text-[13px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Destination</label>
                        <Input 
                          value={editingQuotation.destination}
                          onChange={(e) => setEditField("destination", e.target.value)}
                          className="rounded-xl h-9 text-[13px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Persons</label>
                          <Input type="number" value={editingQuotation.pax} onChange={(e) => setEditField("pax", parseInt(e.target.value) || 0)} className="rounded-xl h-9 text-[13px]" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Client Type</label>
                          <select value={editingQuotation.clientType} onChange={(e) => setEditField("clientType", e.target.value)} className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-[13px] shadow-sm">
                            <option value="B2C">B2C</option><option value="B2B">B2B</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="col-span-2 mt-2 pt-2 border-t border-slate-100 dark:border-border">
                        <h4 className="text-[12px] font-bold text-slate-500 uppercase mb-3">Travel Information</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Start Date</label>
                            <Input type="date" value={editingQuotation.travelStartDate} onChange={(e) => setEditField("travelStartDate", e.target.value)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">End Date</label>
                            <Input type="date" value={editingQuotation.travelEndDate} onChange={(e) => setEditField("travelEndDate", e.target.value)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Duration</label>
                            <Input value={editingQuotation.packageDuration} onChange={(e) => setEditField("packageDuration", e.target.value)} className="h-8 text-[12px]" placeholder="1N / 2D" />
                          </div>
                          <div className="space-y-1.5 col-span-3 md:col-span-1">
                            <label className="text-[11px] font-semibold text-slate-500">Pickup</label>
                            <Input value={editingQuotation.pickupLocation} onChange={(e) => setEditField("pickupLocation", e.target.value)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5 col-span-3 md:col-span-2">
                            <label className="text-[11px] font-semibold text-slate-500">Drop</label>
                            <Input value={editingQuotation.dropLocation} onChange={(e) => setEditField("dropLocation", e.target.value)} className="h-8 text-[12px]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 2. Itinerary */}
                <AccordionItem value="itinerary" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Day-wise Itinerary
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3">
                      {editingQuotation.itinerary.map((day, idx) => (
                        <div key={idx} className="p-3 border border-slate-100 dark:border-border rounded-lg bg-slate-50/50 dark:bg-muted/20 relative">
                          <button onClick={() => {
                            const updated = [...editingQuotation.itinerary];
                            updated.splice(idx, 1);
                            setEditField("itinerary", updated);
                          }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500"><X size={14}/></button>
                          
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[12px] shrink-0">
                              {idx + 1}
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input 
                                placeholder="Title (e.g. Arrival at NJP)" 
                                value={day.title}
                                onChange={(e) => {
                                  const updated = [...editingQuotation.itinerary];
                                  updated[idx].title = e.target.value;
                                  setEditField("itinerary", updated);
                                }}
                                className="h-8 text-[12px] bg-white dark:bg-background"
                              />
                              <Input 
                                placeholder="Description (e.g. Pickup and hotel check-in)" 
                                value={day.description}
                                onChange={(e) => {
                                  const updated = [...editingQuotation.itinerary];
                                  updated[idx].description = e.target.value;
                                  setEditField("itinerary", updated);
                                }}
                                className="h-8 text-[12px] bg-white dark:bg-background"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditField("itinerary", [...editingQuotation.itinerary, { day: editingQuotation.itinerary.length + 1, title: "", description: "" }]);
                      }} className="w-full border-dashed">
                        <Plus size={14} className="mr-2" /> Add day
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 3. Vehicles */}
                <AccordionItem value="vehicles" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Vehicles
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-4">
                      {editingQuotation.vehicles.map((v, idx) => (
                        <div key={idx} className="p-3 border border-slate-100 dark:border-border rounded-lg bg-slate-50/50 dark:bg-muted/20 relative">
                          <button onClick={() => {
                            const updated = [...editingQuotation.vehicles];
                            updated.splice(idx, 1);
                            setEditField("vehicles", updated);
                          }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 z-10"><X size={14}/></button>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="space-y-1 col-span-2 md:col-span-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Vehicle Type</label>
                              <Input value={v.vehicleType} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].vehicleType = e.target.value; setEditField("vehicles", u); }} className="h-8 text-[12px] bg-white dark:bg-background" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Qty</label>
                              <Input type="number" value={v.qty} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].qty = parseInt(e.target.value)||0; setEditField("vehicles", u); }} className="h-8 text-[12px] bg-white dark:bg-background" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Days</label>
                              <Input type="number" value={v.days} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].days = parseInt(e.target.value)||0; setEditField("vehicles", u); }} className="h-8 text-[12px] bg-white dark:bg-background" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Rate (₹)</label>
                              <Input type="number" value={v.rate} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].rate = parseFloat(e.target.value)||0; setEditField("vehicles", u); }} className="h-8 text-[12px] bg-white dark:bg-background" />
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 mt-2 border-t border-slate-100 pt-2">
                            <div className="space-y-1"><Input placeholder="Number (e.g. WB74...)" value={v.vehicleNumber} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].vehicleNumber = e.target.value; setEditField("vehicles", u); }} className="h-7 text-[11px]" /></div>
                            <div className="space-y-1"><Input placeholder="Driver Name" value={v.driverName} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].driverName = e.target.value; setEditField("vehicles", u); }} className="h-7 text-[11px]" /></div>
                            <div className="space-y-1"><Input placeholder="Driver Phone" value={v.driverPhone} onChange={e => { const u = [...editingQuotation.vehicles]; u[idx].driverPhone = e.target.value; setEditField("vehicles", u); }} className="h-7 text-[11px]" /></div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditField("vehicles", [...editingQuotation.vehicles, { vehicleType: "Innova Crysta", qty: 1, days: 2, rate: 0, vehicleNumber: "", driverName: "", driverPhone: "" }]);
                      }} className="w-full border-dashed">
                        <Plus size={14} className="mr-2" /> Add vehicle
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 4. Routes */}
                <AccordionItem value="routes" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Routes
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="space-y-3">
                      {editingQuotation.routes.map((r, idx) => (
                        <div key={idx} className="p-3 border border-slate-100 dark:border-border rounded-lg bg-slate-50/50 dark:bg-muted/20 relative">
                          <button onClick={() => {
                            const updated = [...editingQuotation.routes];
                            updated.splice(idx, 1);
                            setEditField("routes", updated);
                          }} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 z-10"><X size={14}/></button>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div className="space-y-1 col-span-2 md:col-span-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Route Name</label>
                              <Input value={r.routeName} onChange={e => { const u = [...editingQuotation.routes]; u[idx].routeName = e.target.value; setEditField("routes", u); }} className="h-8 text-[12px] bg-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">To</label>
                              <Input value={r.to} onChange={e => { const u = [...editingQuotation.routes]; u[idx].to = e.target.value; setEditField("routes", u); }} className="h-8 text-[12px] bg-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Est Time</label>
                              <Input value={r.estTime} onChange={e => { const u = [...editingQuotation.routes]; u[idx].estTime = e.target.value; setEditField("routes", u); }} className="h-8 text-[12px] bg-white" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Vehicle</label>
                              <Input value={r.vehicleType} onChange={e => { const u = [...editingQuotation.routes]; u[idx].vehicleType = e.target.value; setEditField("routes", u); }} className="h-8 text-[12px] bg-white" />
                            </div>
                            <div className="space-y-1 col-span-2 md:col-span-4 mt-1">
                              <label className="text-[10px] uppercase font-bold text-slate-400">Via / Stops</label>
                              <Input value={r.via} onChange={e => { const u = [...editingQuotation.routes]; u[idx].via = e.target.value; setEditField("routes", u); }} className="h-8 text-[12px] bg-white" placeholder="comma separated" />
                            </div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditField("routes", [...editingQuotation.routes, { routeName: "", to: "", estTime: "", vehicleType: "", via: "" }]);
                      }} className="w-full border-dashed">
                        <Plus size={14} className="mr-2" /> Add route
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* 5. Pricing & Summary (Calculations) */}
                <AccordionItem value="pricing" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Rate Card & Auto-Summary
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="flex flex-col md:flex-row gap-6">
                      
                      {/* Rate Card Inputs */}
                      <div className="flex-1 space-y-4">
                        <h4 className="text-[12px] font-bold text-slate-500 uppercase">Rate Card (B2C/B2B)</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Per Day</label>
                            <Input type="number" value={editingQuotation.rateCard.perDay} onChange={e => setRateCardField("perDay", parseFloat(e.target.value)||0)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Package Price</label>
                            <Input type="number" value={editingQuotation.rateCard.packagePrice} onChange={e => setRateCardField("packagePrice", parseFloat(e.target.value)||0)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Permits</label>
                            <Input type="number" value={editingQuotation.rateCard.permits} onChange={e => setRateCardField("permits", parseFloat(e.target.value)||0)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Toll / Parking</label>
                            <Input type="number" value={editingQuotation.rateCard.toll} onChange={e => { setRateCardField("toll", parseFloat(e.target.value)||0); setRateCardField("parking", parseFloat(e.target.value)||0); }} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">Additional Charges</label>
                            <Input type="number" value={editingQuotation.rateCard.additionalCharges} onChange={e => setRateCardField("additionalCharges", parseFloat(e.target.value)||0)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-semibold text-slate-500">GST %</label>
                            <Input type="number" value={editingQuotation.rateCard.gstPercent} onChange={e => setRateCardField("gstPercent", parseFloat(e.target.value)||0)} className="h-8 text-[12px]" />
                          </div>
                          <div className="space-y-1.5 col-span-2 border-t pt-2 mt-1">
                            <label className="text-[11px] font-semibold text-slate-500">Advance %</label>
                            <Input type="number" value={editingQuotation.advancePercent} onChange={e => setEditField("advancePercent", parseFloat(e.target.value)||0)} className="h-8 text-[12px]" />
                          </div>
                        </div>
                      </div>

                      {/* Auto-Calculated Summary (Read Only) */}
                      <div className="flex-1 bg-slate-50 dark:bg-muted/20 p-4 rounded-xl border border-slate-100 dark:border-border">
                        <h4 className="text-[12px] font-bold text-slate-500 uppercase flex items-center mb-3">
                          <Info size={14} className="mr-1 text-primary"/> Auto-Calculated Summary
                        </h4>
                        
                        <div className="space-y-2 text-[12px]">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Base fare (Vehicles or Package)</span>
                            <span className="font-medium">₹{baseFare}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Permits & Toll/Parking</span>
                            <span className="font-medium">₹{(editingQuotation.rateCard.permits || 0) + (editingQuotation.rateCard.toll || 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Additional</span>
                            <span className="font-medium">₹{editingQuotation.rateCard.additionalCharges || 0}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2">
                            <span className="font-bold">Subtotal</span>
                            <span className="font-bold">₹{derivedSubtotal}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>GST @ {editingQuotation.rateCard.gstPercent}%</span>
                            <span>₹{derivedGrandTotal - derivedSubtotal}</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2 mt-2 text-[15px]">
                            <span className="font-black text-slate-900 dark:text-white">Grand total</span>
                            <span className="font-black text-primary">₹{derivedGrandTotal}</span>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex gap-4">
                          <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/50">
                            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-500">Advance ({editingQuotation.advancePercent}%)</div>
                            <div className="text-[14px] font-black text-emerald-700 dark:text-emerald-400">₹{derivedAdvance}</div>
                          </div>
                          <div className="flex-1 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                            <div className="text-[10px] uppercase font-bold text-red-600 dark:text-red-500">Balance</div>
                            <div className="text-[14px] font-black text-red-700 dark:text-red-400">₹{derivedBalance}</div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
          
          {editingQuotation && (
            <SheetFooter className="p-4 border-t border-slate-100 dark:border-border bg-slate-50/50 dark:bg-muted/20 mt-auto flex-row items-center justify-between sm:justify-between">
              {!isNewQuotation ? (
                <Button 
                  variant="outline" 
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl h-10 font-semibold"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
              ) : <div></div>}
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditingQuotation(null)} className="rounded-xl h-10 font-semibold border-slate-200 dark:border-border">
                  Cancel
                </Button>
                <Button onClick={handleSaveForm} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-10 px-6 premium-shadow font-semibold">
                  Save Quotation
                </Button>
              </div>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
`;

fs.writeFileSync('src/components/quotation/QuotationTable.tsx', content);
