"use client";

import { useState, useEffect } from "react";
import { Plus, X, Info, ArrowLeft, Save, Trash2, CheckCircle2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { db } from "@/firebase/client";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Quotation, QuotationStatus } from "./QuotationTable";

const masterInclusions = [
  "Accommodation",
  "Breakfast & Dinner",
  "Private Vehicle",
  "Driver Allowance",
  "Toll Tax",
  "Parking Charges",
  "Fuel Charges",
  "Airport / Railway Station Pickup & Drop",
  "Sightseeing as per itinerary"
];

const masterExclusions = [
  "Airfare / Train Tickets",
  "Personal Expenses",
  "Entry Fees",
  "Camera Charges",
  "Lunch",
  "Travel Insurance",
  "GST (if applicable)",
  "Extra Sightseeing",
  "Anything not mentioned in the inclusions"
];

const masterPermits = [
  "Nathula Permit - ₹3,500",
  "North Sikkim Permit - ₹2,500",
  "Bhutan Permit - ₹4,500",
  "Sikkim Entry Permit - ₹500"
];

const masterSightseeing = [
  "Changu Lake - ₹1,800",
  "Baba Mandir - ₹800",
  "Yumthang Valley - ₹3,500",
  "Zero Point - ₹2,500"
];

interface QuotationFormProps {
  initialData: Quotation;
  isNew: boolean;
}

export function QuotationForm({ initialData, isNew }: QuotationFormProps) {
  const router = useRouter();
  const [editingQuotation, setEditingQuotation] = useState<Quotation>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  // Auto Calculations
  let baseFare = 0;
  let derivedSubtotal = 0;
  let derivedGrandTotal = 0;
  let derivedAdvance = 0;
  let derivedBalance = 0;
  
  if (editingQuotation) {
    const hasVehicleRates = (editingQuotation.vehicles || []).some(v => v.rate > 0);
    if (hasVehicleRates) {
      baseFare = (editingQuotation.vehicles || []).reduce((acc, v) => acc + ((v.qty || 0) * (v.days || 0) * (v.rate || 0)), 0);
    } else {
      baseFare = editingQuotation.rateCard?.packagePrice || 0;
    }

    const driverAllowance = editingQuotation.rateCard?.driverAllowance || 0;
    const extras = editingQuotation.rateCard?.extras || 0;
    const permits = editingQuotation.rateCard?.permits || 0;
    const toll = editingQuotation.rateCard?.toll || 0;
    const parking = editingQuotation.rateCard?.parking || 0;
    const extraVeh = editingQuotation.rateCard?.extraVehicle || 0;
    const additional = editingQuotation.rateCard?.additionalCharges || 0;
    
    derivedSubtotal = baseFare + driverAllowance + extras + permits + toll + parking + extraVeh + additional;
    const gstAmt = (derivedSubtotal * (editingQuotation.rateCard?.gstPercent || 0)) / 100;
    derivedGrandTotal = derivedSubtotal + gstAmt;
    derivedAdvance = (derivedGrandTotal * (editingQuotation.advancePercent || 0)) / 100;
    derivedBalance = derivedGrandTotal - derivedAdvance;
  }

  const tzoffset = (new Date()).getTimezoneOffset() * 60000;
  const todayStr = (new Date(Date.now() - tzoffset)).toISOString().split('T')[0];

  const isStartDateInvalid = !!(editingQuotation.travelStartDate && editingQuotation.travelStartDate < todayStr);
  const isEndDateInvalid = !!(editingQuotation.travelEndDate && editingQuotation.travelEndDate < todayStr);

  const isPhoneInvalid = (phone?: string) => {
    if (!phone) return false;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return false;
    if (digits.length === 12 && digits.startsWith('91')) return false;
    return true;
  };

  const handleSaveForm = async () => {
    if (editingQuotation.pax === 0) {
      alert("Persons cannot be 0. Please fix the error before saving.");
      return;
    }
    const hasZeroQtyVehicles = (editingQuotation.vehicles || []).some(v => v.qty === 0);
    if (hasZeroQtyVehicles) {
      alert("Vehicle quantity cannot be 0. Please fix the error before saving.");
      return;
    }
    const hasInvalidPhone = (editingQuotation.vehicles || []).some(v => isPhoneInvalid(v.driverPhone));
    if (hasInvalidPhone) {
      alert("One or more driver phone numbers are invalid. Please provide a valid 10-digit number.");
      return;
    }
    if (isStartDateInvalid || isEndDateInvalid) {
      alert("Travel start and end dates cannot be in the past. Please fix the errors before saving.");
      return;
    }

    setIsSaving(true);
    const toSave = {
      ...editingQuotation,
      subtotal: derivedSubtotal,
      grandTotal: derivedGrandTotal,
      advanceAmount: derivedAdvance,
      balance: derivedBalance
    };

    try {
      await setDoc(doc(db, "quotations", toSave.id), toSave);
      router.push("/quotation");
    } catch (error) {
      console.error("Error saving quotation:", error);
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("Are you sure you want to delete this quotation?")) {
      try {
        await deleteDoc(doc(db, "quotations", editingQuotation.id));
        router.push("/quotation");
      } catch (error) {
        console.error("Error deleting quotation:", error);
      }
    }
  };

  const setEditField = (field: string, value: any) => {
    setEditingQuotation(prev => ({ ...prev, [field]: value }));
  };
  
  const setRateCardField = (field: string, value: number) => {
    setEditingQuotation(prev => ({ ...prev, rateCard: { ...(prev.rateCard || {}), [field]: value } }));
  };

    const getStatusColor = (status: QuotationStatus | string) => {
    switch (status) {
      case "Draft": return "bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
      case "Sent": return "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
      case "Confirmed": return "bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800";
      case "Cancelled": return "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      default: return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="flex flex-col bg-[#f4fbfa] dark:bg-background -mx-6 md:-mx-8 -mt-6 md:-mt-8 p-2 md:p-8 min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push("/quotation")} className="rounded-full shadow-sm bg-white dark:bg-card border-slate-200 dark:border-border">
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
              {isNew ? "New Quotation" : "Edit Quotation"}
              <DropdownMenu>
                <DropdownMenuTrigger className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(editingQuotation.status || "Draft")}`}>
                  {editingQuotation.status || "Draft"} <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {["Draft", "Sent", "Confirmed", "Cancelled"].map(s => (
                    <DropdownMenuItem key={s} onClick={() => setEditField("status", s)} className="text-[13px] font-medium cursor-pointer">
                      {s}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-primary font-mono text-xs font-semibold bg-primary/10 px-2 py-1 rounded-md">ID: {editingQuotation.id}</span>
              <span className="text-slate-500 font-medium text-sm">{editingQuotation.type || "Transport"}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {!isNew && (
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-full h-10 px-6 font-semibold flex-1 md:flex-none transition-colors">
              <Trash2 className="w-4 h-4 mr-2" /> Delete Quotation
            </Button>
          )}
          <Button onClick={handleSaveForm} disabled={isSaving} className="bg-[#f0a500] hover:bg-[#d99400] text-white rounded-full h-10 px-8 premium-shadow font-bold flex-1 md:flex-none">
            <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-4 md:p-6 mb-8">
        <Accordion multiple defaultValue={["customer", "pricing"]} className="space-y-6">
          
          {/* 1. Customer & Travel */}
          <AccordionItem value="customer" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Customer & tour
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Customer name</label>
                  <Input value={editingQuotation.customerName || ""} onChange={(e) => setEditField("customerName", e.target.value)} className="rounded-xl h-10 text-[13px] bg-white dark:bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Mobile</label>
                  <Input value={editingQuotation.mobile || ""} onChange={(e) => setEditField("mobile", e.target.value)} className="rounded-xl h-10 text-[13px] bg-white dark:bg-background" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Destination</label>
                  <Input value={editingQuotation.destination || ""} onChange={(e) => setEditField("destination", e.target.value)} className="rounded-xl h-10 text-[13px] bg-white dark:bg-background" placeholder="Type or pick" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Persons</label>
                    <Input 
                      type="number" 
                      value={editingQuotation.pax !== undefined ? editingQuotation.pax : 2} 
                      onChange={(e) => setEditField("pax", e.target.value === '' ? '' : parseInt(e.target.value) || 0)} 
                      className={`rounded-xl h-10 text-[13px] bg-white dark:bg-background ${editingQuotation.pax === 0 ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                    />
                    {editingQuotation.pax === 0 && (
                      <p className="text-[11px] text-red-500 font-semibold mt-1">Persons cannot be 0</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Client type</label>
                    <select value={editingQuotation.clientType || "B2C"} onChange={(e) => setEditField("clientType", e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-white dark:bg-background px-3 py-1 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                      <option value="B2C">B2C</option><option value="B2B">B2B</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Type</label>
                    <select value={editingQuotation.type || "Transport Enquiry"} onChange={(e) => setEditField("type", e.target.value)} className="flex h-10 w-full rounded-xl border border-input bg-white dark:bg-background px-3 py-1 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                      <option value="Transport Enquiry">Transport Enquiry</option>
                      <option value="Tour Package Enquiry">Tour Package Enquiry</option>
                    </select>
                  </div>
                </div>
                
                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-border">
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase mb-4 tracking-wider">Travel information</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500">Travel start date</label>
                      <Input 
                        type="date" 
                        min={todayStr}
                        value={editingQuotation.travelStartDate || ""} 
                        onChange={(e) => setEditField("travelStartDate", e.target.value)} 
                        className={`h-10 text-[13px] bg-white dark:bg-background ${isStartDateInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                      />
                      {isStartDateInvalid && <p className="text-[11px] text-red-500 font-semibold mt-1">Past dates not allowed</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500">Travel end date</label>
                      <Input 
                        type="date" 
                        min={todayStr}
                        value={editingQuotation.travelEndDate || ""} 
                        onChange={(e) => setEditField("travelEndDate", e.target.value)} 
                        className={`h-10 text-[13px] bg-white dark:bg-background ${isEndDateInvalid ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                      />
                      {isEndDateInvalid && <p className="text-[11px] text-red-500 font-semibold mt-1">Past dates not allowed</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500">Package duration</label>
                      <Input value={editingQuotation.packageDuration || ""} onChange={(e) => setEditField("packageDuration", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" placeholder="1N / 2D" />
                    </div>
                    <div className="space-y-1.5"></div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500">Pickup location</label>
                      <Input value={editingQuotation.pickupLocation || ""} onChange={(e) => setEditField("pickupLocation", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500">Drop location</label>
                      <Input value={editingQuotation.dropLocation || ""} onChange={(e) => setEditField("dropLocation", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 2. Itinerary */}
          <AccordionItem value="itinerary" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Day-wise itinerary
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-[12px] text-slate-500 mb-4">First day auto-suggests arrival; last day departure. All editable.</p>
              <div className="space-y-4">
                {(editingQuotation.itinerary || []).map((day, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 dark:border-border rounded-xl bg-white dark:bg-card relative group shadow-sm">
                    <button onClick={() => {
                      const updated = [...(editingQuotation.itinerary || [])];
                      updated.splice(idx, 1);
                      setEditField("itinerary", updated);
                    }} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 transition-colors bg-white dark:bg-card rounded-full p-1"><X size={16}/></button>
                    
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-[14px] shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-3">
                        <Input 
                          placeholder="Title (e.g. Arrival at NJP / IXB / Siliguri)" 
                          value={day.title || ""}
                          onChange={(e) => {
                            const updated = [...(editingQuotation.itinerary || [])];
                            updated[idx].title = e.target.value;
                            setEditField("itinerary", updated);
                          }}
                          className="h-10 text-[13px] font-medium"
                        />
                        <Input 
                          placeholder="Description (e.g. Pickup and hotel check-in.)" 
                          value={day.description || ""}
                          onChange={(e) => {
                            const updated = [...(editingQuotation.itinerary || [])];
                            updated[idx].description = e.target.value;
                            setEditField("itinerary", updated);
                          }}
                          className="h-10 text-[13px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => {
                  setEditField("itinerary", [...(editingQuotation.itinerary || []), { day: (editingQuotation.itinerary || []).length + 1, title: "", description: "" }]);
                }} className="w-full border-dashed h-12 text-slate-500 hover:text-primary hover:border-primary/50">
                  <Plus size={16} className="mr-2" /> Add day
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 3. Vehicles */}
          <AccordionItem value="vehicles" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Vehicles
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="space-y-4">
                {(editingQuotation.vehicles || []).map((v, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 dark:border-border rounded-xl bg-white dark:bg-card relative shadow-sm">
                    <button onClick={() => {
                      const updated = [...(editingQuotation.vehicles || [])];
                      updated.splice(idx, 1);
                      setEditField("vehicles", updated);
                    }} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 z-10 bg-white dark:bg-card rounded-full p-1"><X size={16}/></button>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Vehicle</label>
                        <select 
                          value={v.vehicleType || "Innova Crysta"} 
                          onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].vehicleType = e.target.value; setEditField("vehicles", u); }} 
                          className="flex h-10 w-full rounded-xl border border-input bg-white dark:bg-background px-3 py-1 text-[13px] shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                        >
                          <option value="Sedan">Sedan</option>
                          <option value="SUV">SUV</option>
                          <option value="Innova Crysta">Innova Crysta</option>
                          <option value="Tempo Traveller">Tempo Traveller</option>
                          <option value="22 seater bus">22 seater bus</option>
                          <option value="27 seater bus">27 seater bus</option>
                          <option value="Premium Coach">Premium Coach</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Qty</label>
                        <Input 
                          type="number" 
                          value={v.qty !== undefined ? v.qty : 1} 
                          onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].qty = e.target.value === '' ? '' : parseInt(e.target.value) || 0; setEditField("vehicles", u); }} 
                          className={`h-10 text-[13px] ${v.qty === 0 ? 'border-red-500 focus-visible:ring-red-500' : ''}`} 
                        />
                        {v.qty === 0 && <p className="text-[10px] text-red-500 font-bold absolute -bottom-4">Qty cannot be 0</p>}
                      </div>
                      <div className="space-y-1.5 relative">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Days</label>
                        <Input 
                          type="number" 
                          value={v.days !== undefined ? v.days : 1} 
                          onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].days = e.target.value === '' ? '' : parseInt(e.target.value) || 0; setEditField("vehicles", u); }} 
                          className="h-10 text-[13px]" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider text-primary">Rate (₹)</label>
                        <Input type="number" value={v.rate || 0} onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].rate = parseFloat(e.target.value)||0; setEditField("vehicles", u); }} className="h-10 text-[13px] border-primary/30 bg-primary/5 font-semibold" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 border-t border-slate-100 dark:border-border pt-4">
                      <div className="space-y-1.5"><Input placeholder="Vehicle number (e.g. WB 74 AB 1234)" value={v.vehicleNumber || ""} onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].vehicleNumber = e.target.value; setEditField("vehicles", u); }} className="h-9 text-[12px]" /></div>
                      <div className="space-y-1.5"><Input placeholder="Driver name" value={v.driverName || ""} onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].driverName = e.target.value; setEditField("vehicles", u); }} className="h-9 text-[12px]" /></div>
                      <div className="space-y-1.5 relative">
                        <Input placeholder="Driver phone (+91 9876543210)" value={v.driverPhone || ""} onChange={e => { const u = [...(editingQuotation.vehicles || [])]; u[idx].driverPhone = e.target.value; setEditField("vehicles", u); }} className={`h-9 text-[12px] ${isPhoneInvalid(v.driverPhone) ? 'border-red-500 focus-visible:ring-red-500' : ''}`} />
                        {isPhoneInvalid(v.driverPhone) && <p className="text-[10px] text-red-500 font-bold absolute -bottom-4">Invalid phone number</p>}
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => {
                  setEditField("vehicles", [...(editingQuotation.vehicles || []), { vehicleType: "Innova Crysta", qty: 1, days: 2, rate: 0, vehicleNumber: "", driverName: "", driverPhone: "" }]);
                }} className="w-full border-dashed h-12 text-slate-500 hover:text-primary hover:border-primary/50">
                  <Plus size={16} className="mr-2" /> Add vehicle
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Routes */}
          <AccordionItem value="routes" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Routes
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-[12px] text-slate-500 mb-4">Transport section — route name, distance, time, vehicle & cost.</p>
              <div className="space-y-4">
                {(editingQuotation.routes || []).map((r, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 dark:border-border rounded-xl bg-white dark:bg-card relative shadow-sm">
                    <button onClick={() => {
                      const updated = [...(editingQuotation.routes || [])];
                      updated.splice(idx, 1);
                      setEditField("routes", updated);
                    }} className="absolute top-3 right-3 text-slate-300 hover:text-red-500 z-10 bg-white dark:bg-card rounded-full p-1"><X size={16}/></button>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1.5 col-span-2 md:col-span-1">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Route name</label>
                        <Input value={r.routeName || ""} onChange={e => { const u = [...(editingQuotation.routes || [])]; u[idx].routeName = e.target.value; setEditField("routes", u); }} className="h-10 text-[13px]" placeholder="NJP / IXB / Siliguri" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">To</label>
                        <Input value={r.to || ""} onChange={e => { const u = [...(editingQuotation.routes || [])]; u[idx].to = e.target.value; setEditField("routes", u); }} className="h-10 text-[13px]" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Est. time</label>
                        <Input value={r.estTime || ""} onChange={e => { const u = [...(editingQuotation.routes || [])]; u[idx].estTime = e.target.value; setEditField("routes", u); }} className="h-10 text-[13px]" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Vehicle type</label>
                        <Input value={r.vehicleType || ""} onChange={e => { const u = [...(editingQuotation.routes || [])]; u[idx].vehicleType = e.target.value; setEditField("routes", u); }} className="h-10 text-[13px]" />
                      </div>
                      <div className="space-y-1.5 col-span-2 md:col-span-4 mt-2">
                        <label className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Via / intermediate stops (comma separated)</label>
                        <Input value={r.via || ""} onChange={e => { const u = [...(editingQuotation.routes || [])]; u[idx].via = e.target.value; setEditField("routes", u); }} className="h-10 text-[13px]" placeholder="e.g. Stop 1, Stop 2" />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={() => {
                  setEditField("routes", [...(editingQuotation.routes || []), { routeName: "", to: "", estTime: "", vehicleType: "", via: "" }]);
                }} className="w-full border-dashed h-12 text-slate-500 hover:text-primary hover:border-primary/50">
                  <Plus size={16} className="mr-2" /> Add route
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. Inclusions, Exclusions, Permits */}
          <AccordionItem value="inclusions" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Inclusions & exclusions
            </AccordionTrigger>
            <AccordionContent className="pb-4 space-y-6">
              <p className="text-[12px] text-slate-500">Everything covered — and everything not covered — in this quotation.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Inclusions */}
                <div className="space-y-3 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
                      <span className="text-emerald-500 mr-2">✓</span> Inclusions
                    </label>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 text-[11px]">From master...</Button>} />
                        <DropdownMenuContent align="end" className="w-56">
                          {masterInclusions.map((item) => (
                            <DropdownMenuItem 
                              key={item} 
                              onClick={() => setEditField("inclusions", [...(editingQuotation.inclusions || []), item])}
                              className="text-[12px] cursor-pointer"
                            >
                              {item}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] bg-slate-50" onClick={() => setEditField("inclusions", [...(editingQuotation.inclusions || []), ""])}>Add</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(!editingQuotation.inclusions || editingQuotation.inclusions.length === 0) && (
                      <p className="text-[12px] text-slate-400 italic">No inclusions added.</p>
                    )}
                    {(editingQuotation.inclusions || []).map((inc, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={inc} onChange={e => { const u = [...(editingQuotation.inclusions || [])]; u[idx] = e.target.value; setEditField("inclusions", u); }} className="h-9 text-[13px] bg-slate-50/50 dark:bg-background" />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0 bg-white dark:bg-card border border-slate-200 dark:border-border" onClick={() => { const u = [...(editingQuotation.inclusions || [])]; u.splice(idx, 1); setEditField("inclusions", u); }}><X size={16}/></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Exclusions */}
                <div className="space-y-3 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center">
                      <span className="text-red-500 mr-2">✗</span> Exclusions
                    </label>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 text-[11px]">From master...</Button>} />
                        <DropdownMenuContent align="end" className="w-56">
                          {masterExclusions.map((item) => (
                            <DropdownMenuItem 
                              key={item} 
                              onClick={() => setEditField("exclusions", [...(editingQuotation.exclusions || []), item])}
                              className="text-[12px] cursor-pointer"
                            >
                              {item}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] bg-slate-50" onClick={() => setEditField("exclusions", [...(editingQuotation.exclusions || []), ""])}>Add</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(!editingQuotation.exclusions || editingQuotation.exclusions.length === 0) && (
                      <p className="text-[12px] text-slate-400 italic">No exclusions added.</p>
                    )}
                    {(editingQuotation.exclusions || []).map((exc, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={exc} onChange={e => { const u = [...(editingQuotation.exclusions || [])]; u[idx] = e.target.value; setEditField("exclusions", u); }} className="h-9 text-[13px] bg-slate-50/50 dark:bg-background" />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0 bg-white dark:bg-card border border-slate-200 dark:border-border" onClick={() => { const u = [...(editingQuotation.exclusions || [])]; u.splice(idx, 1); setEditField("exclusions", u); }}><X size={16}/></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Permits */}
                <div className="space-y-3 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Permits</label>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 text-[11px]">Add from master...</Button>} />
                        <DropdownMenuContent align="end" className="w-56">
                          {masterPermits.map((item) => (
                            <DropdownMenuItem 
                              key={item} 
                              onClick={() => setEditField("permits", [...(editingQuotation.permits || []), item])}
                              className="text-[12px] cursor-pointer"
                            >
                              {item}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] bg-slate-50" onClick={() => setEditField("permits", [...(editingQuotation.permits || []), ""])}>Custom</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(!editingQuotation.permits || editingQuotation.permits.length === 0) && (
                      <p className="text-[12px] text-slate-400 italic">No permits added.</p>
                    )}
                    {(editingQuotation.permits || []).map((p, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={p} onChange={e => { const u = [...(editingQuotation.permits || [])]; u[idx] = e.target.value; setEditField("permits", u); }} className="h-9 text-[13px] bg-slate-50/50 dark:bg-background" />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0 bg-white dark:bg-card border border-slate-200 dark:border-border" onClick={() => { const u = [...(editingQuotation.permits || [])]; u.splice(idx, 1); setEditField("permits", u); }}><X size={16}/></Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sightseeing */}
                <div className="space-y-3 bg-white dark:bg-card p-4 rounded-xl border border-slate-100 dark:border-border shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Extra sightseeing</label>
                    <div className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="h-7 text-[11px]">Add from master...</Button>} />
                        <DropdownMenuContent align="end" className="w-56">
                          {masterSightseeing.map((item) => (
                            <DropdownMenuItem 
                              key={item} 
                              onClick={() => setEditField("sightseeing", [...(editingQuotation.sightseeing || []), item])}
                              className="text-[12px] cursor-pointer"
                            >
                              {item}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="outline" size="sm" className="h-7 text-[11px] bg-slate-50" onClick={() => setEditField("sightseeing", [...(editingQuotation.sightseeing || []), ""])}>Custom</Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(!editingQuotation.sightseeing || editingQuotation.sightseeing.length === 0) && (
                      <p className="text-[12px] text-slate-400 italic">No sightseeing added.</p>
                    )}
                    {(editingQuotation.sightseeing || []).map((s, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input value={s} onChange={e => { const u = [...(editingQuotation.sightseeing || [])]; u[idx] = e.target.value; setEditField("sightseeing", u); }} className="h-9 text-[13px] bg-slate-50/50 dark:bg-background" />
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-400 hover:text-red-500 shrink-0 bg-white dark:bg-card border border-slate-200 dark:border-border" onClick={() => { const u = [...(editingQuotation.sightseeing || [])]; u.splice(idx, 1); setEditField("sightseeing", u); }}><X size={16}/></Button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 6. Pricing & Summary (Calculations) */}
          <AccordionItem value="pricing" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Rate card ({editingQuotation.clientType || "B2C"})
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <p className="text-[12px] text-slate-500 mb-6">Used when vehicle rates are not set. Otherwise the summary uses qty × days × rate above.</p>
              
              <div className="flex flex-col lg:flex-row gap-8">
                
                {/* Rate Card Inputs */}
                <div className="flex-[3] space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Per Day</label>
                      <Input type="number" value={editingQuotation.rateCard?.perDay || 0} onChange={e => setRateCardField("perDay", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Package Price</label>
                      <Input type="number" value={editingQuotation.rateCard?.packagePrice || 0} onChange={e => setRateCardField("packagePrice", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Driver allowance</label>
                      <Input type="number" value={editingQuotation.rateCard?.driverAllowance || 0} onChange={e => setRateCardField("driverAllowance", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Extras</label>
                      <Input type="number" value={editingQuotation.rateCard?.extras || 0} onChange={e => setRateCardField("extras", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Permits</label>
                      <Input type="number" value={editingQuotation.rateCard?.permits || 0} onChange={e => setRateCardField("permits", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Toll</label>
                      <Input type="number" value={editingQuotation.rateCard?.toll || 0} onChange={e => { setRateCardField("toll", parseFloat(e.target.value)||0); }} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Parking</label>
                      <Input type="number" value={editingQuotation.rateCard?.parking || 0} onChange={e => { setRateCardField("parking", parseFloat(e.target.value)||0); }} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Extra Vehicle</label>
                      <Input type="number" value={editingQuotation.rateCard?.extraVehicle || 0} onChange={e => setRateCardField("extraVehicle", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Additional charges</label>
                      <Input type="number" value={editingQuotation.rateCard?.additionalCharges || 0} onChange={e => setRateCardField("additionalCharges", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background shadow-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">GST %</label>
                      <Input type="number" value={editingQuotation.rateCard?.gstPercent || 0} onChange={e => setRateCardField("gstPercent", parseFloat(e.target.value)||0)} className="h-10 text-[13px] bg-white dark:bg-background border-primary/30 shadow-sm" />
                    </div>
                  </div>
                </div>

                {/* Auto-Calculated Summary (Read Only) */}
                <div className="flex-[2] bg-slate-800 text-white dark:bg-muted p-6 rounded-2xl shadow-inner border border-slate-700">
                  <h4 className="text-[13px] font-bold text-slate-300 uppercase flex items-center mb-6 tracking-wider">
                    <Info size={16} className="mr-2 text-primary"/> Auto-calculated summary
                  </h4>
                  
                  <div className="space-y-3 text-[14px]">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Base fare <span className="text-[11px]">({(editingQuotation.vehicles||[]).length > 0 ? `${(editingQuotation.vehicles||[]).reduce((a, v) => a + (v.days || 0), 0)} days · ${(editingQuotation.vehicles||[]).length} veh` : 'Package'})</span></span>
                      <span className="font-semibold text-slate-200">₹{baseFare.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Driver allowance</span>
                      <span className="font-semibold text-slate-200">₹{(editingQuotation.rateCard?.driverAllowance || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Extras</span>
                      <span className="font-semibold text-slate-200">₹{(editingQuotation.rateCard?.extras || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Permits</span>
                      <span className="font-semibold text-slate-200">₹{(editingQuotation.rateCard?.permits || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Toll</span>
                      <span className="font-semibold text-slate-200">₹{(editingQuotation.rateCard?.toll || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Parking</span>
                      <span className="font-semibold text-slate-200">₹{(editingQuotation.rateCard?.parking || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Additional</span>
                      <span className="font-semibold text-slate-200">₹{((editingQuotation.rateCard?.additionalCharges || 0) + (editingQuotation.rateCard?.extraVehicle || 0)).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-600 dark:border-slate-700 pt-3 mt-3">
                      <span className="font-bold text-slate-300">Subtotal</span>
                      <span className="font-bold text-slate-100">₹{derivedSubtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-400">
                      <span>GST @ {editingQuotation.rateCard?.gstPercent || 0}%</span>
                      <span>₹{(derivedGrandTotal - derivedSubtotal).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-slate-500 pt-4 mt-4 text-[18px]">
                      <span className="font-black text-white">Grand total</span>
                      <span className="font-black text-primary">₹{derivedGrandTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Advance Payment Section (New) */}
          <AccordionItem value="advance" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Advance payment
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 items-end bg-white dark:bg-card p-6 rounded-xl border border-slate-100 dark:border-border shadow-sm">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-primary">Advance %</label>
                  <Input type="number" value={editingQuotation.advancePercent || 0} onChange={e => setEditField("advancePercent", parseFloat(e.target.value)||0)} className="h-10 text-[15px] font-semibold bg-primary/5 border-primary/30" />
                </div>
                <div className="space-y-1.5 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Grand total</label>
                  <div className="text-[18px] font-semibold text-slate-700 dark:text-slate-200">₹{derivedGrandTotal.toLocaleString('en-IN')}</div>
                </div>
                <div className="space-y-1.5 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider">Advance amount</label>
                  <div className="text-[18px] font-bold text-emerald-500">₹{derivedAdvance.toLocaleString('en-IN')}</div>
                </div>
                <div className="space-y-1.5 pl-4 border-l border-slate-200 dark:border-slate-700">
                  <label className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider">Balance</label>
                  <div className="text-[18px] font-bold text-rose-500">₹{derivedBalance.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 7. Additional Details */}
          <AccordionItem value="details" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-slate-50/30 dark:bg-muted/10">
            <AccordionTrigger className="hover:no-underline py-4 text-[15px] font-bold">
              Additional details
            </AccordionTrigger>
            <AccordionContent className="pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Transport details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Pickup timing</label>
                      <Input value={editingQuotation.pickupTiming || ""} onChange={e => setEditField("pickupTiming", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Drop timing</label>
                      <Input value={editingQuotation.dropTiming || ""} onChange={e => setEditField("dropTiming", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Driver instructions</label>
                    <Input value={editingQuotation.driverInstructions || ""} onChange={e => setEditField("driverInstructions", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Vehicle notes</label>
                    <Input value={editingQuotation.vehicleNotes || ""} onChange={e => setEditField("vehicleNotes", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-slate-200 dark:border-border space-y-4">
                  <h4 className="text-[13px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">General extra information</h4>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Additional notes</label>
                    <Input className="h-10 text-[13px] bg-white dark:bg-background" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Remarks</label>
                    <Input value={editingQuotation.remarks || ""} onChange={e => setEditField("remarks", e.target.value)} className="h-10 text-[13px] bg-white dark:bg-background" />
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
