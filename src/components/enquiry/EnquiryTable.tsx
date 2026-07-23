"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, setDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { 
  Search, Plus, Sparkles, ChevronDown, MoreHorizontal
} from "lucide-react";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

export type EnquiryStatus = "New" | "Follow Up" | "Quotation Sent" | "Confirmed" | "Cancelled";

export interface Enquiry {
  id: string;
  customerName: string;
  customerPhone: string;
  whatsapp?: string;
  email?: string;
  type: string;
  clientType: "B2B" | "B2C";
  tripRoute: string;
  pickup?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  pax: number;
  days: number;
  vehicle: string;
  dates: string;
  ticket: boolean;
  hotelConfirmed?: boolean;
  hotelType?: string;
  interestedPlaces?: string;
  specialRequirements?: string;
  customerRemarks?: string;
  status: EnquiryStatus;
}

const generateMockData = (): Enquiry[] => [
  { 
    id: "PKG-2026-0001", 
    customerName: "Tanya Khan (Corp)", 
    customerPhone: "9892153903", 
    whatsapp: "9841037514",
    email: "tanya.khan@example.com",
    type: "Tour package enquiry", 
    clientType: "B2B", 
    tripRoute: "Siliguri → Pelling", 
    pickup: "Siliguri",
    destination: "Pelling",
    startDate: "2026-08-30",
    endDate: "2026-09-03",
    pax: 15, 
    days: 4, 
    vehicle: "Sedan", 
    dates: "Aug 30 - Sep 3", 
    ticket: true, 
    hotelConfirmed: true,
    hotelType: "Without hotel",
    interestedPlaces: "Tsomgo Lake, Baba Mandir, MG Marg",
    specialRequirements: "Vegetarian meals",
    customerRemarks: "Customer remarks",
    status: "Quotation Sent" 
  },
  { id: "PKG-2026-0002", customerName: "Pooja Rao", customerPhone: "9838252215", type: "Package", clientType: "B2C", tripRoute: "Gangtok → Darjeeling", pax: 14, days: 4, vehicle: "SUV", dates: "Aug 20 - Aug 24", ticket: true, status: "Follow Up" },
  { id: "PKG-2026-0003", customerName: "Kavya Patel", customerPhone: "9874849860", type: "Package", clientType: "B2C", tripRoute: "NJP Station → Gangtok", pax: 10, days: 4, vehicle: "Innova Crysta", dates: "Aug 7 - Aug 11", ticket: true, status: "Quotation Sent" },
  { id: "PKG-2026-0004", customerName: "Rahul Chatterjee (Corp)", customerPhone: "9883575178", type: "Package", clientType: "B2B", tripRoute: "Bagdogra Airport → Zuluk", pax: 17, days: 3, vehicle: "Tempo Traveller", dates: "Jul 27 - Jul 30", ticket: true, status: "Confirmed" },
];

const getStatusColor = (status: EnquiryStatus) => {
  switch (status) {
    case "New": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "Follow Up": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    case "Quotation Sent": return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
    case "Confirmed": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Cancelled": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default: return "bg-gray-100 text-gray-700";
  }
};

export function EnquiryTable() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "enquiries"), (snapshot) => {
      const data: Enquiry[] = [];
      snapshot.forEach((doc) => {
        data.push(doc.data() as Enquiry);
      });
      setEnquiries(data.sort((a, b) => b.id.localeCompare(a.id))); // sort descending by id
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching enquiries:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [isNewEnquiry, setIsNewEnquiry] = useState(false);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [typeFilter, setTypeFilter] = useState("All enquiries");
  const [clientFilter, setClientFilter] = useState("All clients");
  const [vehicleFilter, setVehicleFilter] = useState("All vehicles");

  const [dateError, setDateError] = useState<string | null>(null);
  const todayDateString = new Date().toISOString().split('T')[0];

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = new Date(e.target.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setDateError("Past dates are not allowed. Please select a valid date.");
    } else {
      setDateError(null);
    }
  };

  const filteredEnquiries = enquiries.filter(enq => {
    const matchesSearch = enq.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          enq.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          enq.customerPhone.includes(searchTerm);
    const matchesStatus = statusFilter === "All Status" || enq.status === statusFilter;
    // Map "Tour Packages" to "Package" since the mock data uses "Package"
    const matchesType = typeFilter === "All enquiries" || enq.type === (typeFilter === "Tour Packages" ? "Package" : typeFilter);
    const matchesClient = clientFilter === "All clients" || enq.clientType === clientFilter;
    const matchesVehicle = vehicleFilter === "All vehicles" || enq.vehicle === vehicleFilter;
    return matchesSearch && matchesStatus && matchesType && matchesClient && matchesVehicle;
  });

  const filters = [
    { value: statusFilter, setter: setStatusFilter, defaultLabel: "All Status", options: ["All Status", "New", "Follow Up", "Quotation Sent", "Confirmed", "Cancelled"] },
    { value: typeFilter, setter: setTypeFilter, defaultLabel: "All enquiries", options: ["All enquiries", "Transport", "Tour Packages"] },
    { value: clientFilter, setter: setClientFilter, defaultLabel: "All clients", options: ["All clients", "B2B", "B2C"] },
    { value: vehicleFilter, setter: setVehicleFilter, defaultLabel: "All vehicles", options: ["All vehicles", "Sedan", "SUV", "Innova Crysta", "Tempo Traveller", "22 seater bus", "27 seater bus", "Premium Coach"] },
  ];

  const updateStatus = async (id: string, newStatus: EnquiryStatus) => {
    try {
      await updateDoc(doc(db, "enquiries", id), { status: newStatus });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleNewEnquiry = () => {
    const randomId = `PKG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newEnq: Enquiry = {
      id: randomId,
      customerName: "",
      customerPhone: "",
      type: "Tour Package Enquiry",
      clientType: "B2C",
      tripRoute: "",
      pax: 2,
      days: 3,
      vehicle: "Sedan",
      dates: "TBD",
      ticket: false,
      status: "New"
    };
    setEditingEnquiry(newEnq);
    setIsNewEnquiry(true);
  };

  const handleSaveForm = async () => {
    if (!editingEnquiry) return;
    try {
      await setDoc(doc(db, "enquiries", editingEnquiry.id), editingEnquiry);
    } catch (error) {
      console.error("Error saving enquiry:", error);
    }
    setEditingEnquiry(null);
    setDateError(null);
    setIsNewEnquiry(false);
  };

  const handleDelete = async () => {
    if (!editingEnquiry) return;
    try {
      await deleteDoc(doc(db, "enquiries", editingEnquiry.id));
    } catch (error) {
      console.error("Error deleting enquiry:", error);
    }
    setEditingEnquiry(null);
    setDateError(null);
    setIsNewEnquiry(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#f4fbfa] dark:bg-background -mx-6 md:-mx-8 -mt-6 md:-mt-8 p-2 md:p-4 min-h-[calc(100vh-4rem)]">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Enquiries</h1>
          <p className="text-sm text-slate-500 font-medium">{filteredEnquiries.length} of {enquiries.length} shown</p>
        </div>
        <Button onClick={handleNewEnquiry} className="bg-[#f0a500] hover:bg-[#d99400] text-white rounded-full px-6 premium-shadow font-semibold">
          <Plus className="w-4 h-4 mr-2" /> New enquiry
        </Button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border overflow-hidden flex-1">
        
        {/* Filters Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-border flex flex-col xl:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search customer, destination, mobile, serial..." 
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
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 py-2 text-center">ID</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Customer</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Type</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Client</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Trip</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Vehicle</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Dates</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Tkt</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase px-1 text-center">Status</TableHead>
                <TableHead className="text-[10px] font-bold text-slate-500 uppercase text-center px-1">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnquiries.map((enq) => (
                <TableRow key={enq.id} className="border-slate-100 dark:border-border group">
                  <TableCell className="font-mono text-[11px] text-slate-500 whitespace-nowrap px-1 py-2 text-center">{enq.id}</TableCell>
                  <TableCell className="px-1 min-w-[120px] text-center">
                    <div className="font-semibold text-slate-900 dark:text-white text-[12px] truncate">{enq.customerName}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{enq.customerPhone}</div>
                  </TableCell>
                  <TableCell className="px-1 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 text-slate-700 bg-white dark:bg-muted dark:border-border dark:text-slate-300">
                      {enq.type}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 text-center">
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium border border-slate-200 text-slate-700 bg-white dark:bg-muted dark:border-border dark:text-slate-300">
                      {enq.clientType}
                    </span>
                  </TableCell>
                  <TableCell className="px-1 max-w-[140px] truncate text-center">
                    <div className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">{enq.tripRoute}</div>
                    <div className="text-slate-500 text-[10px] mt-0.5">{enq.pax} pax · {enq.days} days</div>
                  </TableCell>
                  <TableCell className="text-[11px] text-slate-700 dark:text-slate-300 font-medium px-1 max-w-[100px] truncate text-center">{enq.vehicle}</TableCell>
                  <TableCell className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-nowrap px-1 text-center">{enq.dates}</TableCell>
                  <TableCell className="px-1 text-center">
                    {enq.ticket && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/50 dark:bg-emerald-500/10 dark:border-emerald-500/20">
                        Yes
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-1 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusColor(enq.status)} transition-colors whitespace-nowrap mx-auto`}>
                        {enq.status} <ChevronDown className="ml-1 h-3 w-3 opacity-70" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 rounded-xl">
                        {(["New", "Follow Up", "Quotation Sent", "Confirmed", "Cancelled"] as EnquiryStatus[]).map((status) => (
                          <DropdownMenuItem key={status} onClick={() => updateStatus(enq.id, status)} className="text-[12px] font-medium cursor-pointer">
                            {status}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                  <TableCell className="text-center whitespace-nowrap px-1">
                    <div className="flex items-center justify-center gap-1.5 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px] text-slate-600 hover:text-primary font-semibold" onClick={() => setEditingEnquiry(enq)}>
                        Edit
                      </Button>
                      <Button size="sm" onClick={() => router.push(`/quotation/new?enquiryId=${enq.id}`)} className="h-6 px-2.5 rounded-full text-[11px] bg-[#f0a500] hover:bg-[#d99400] text-white premium-shadow font-semibold">
                        <Sparkles className="w-3 h-3 mr-1" /> Quote
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEnquiries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center text-slate-500 font-medium">
                    No enquiries found matching "{searchTerm}"
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit/New Sheet (Slide-over) */}
      <Sheet open={!!editingEnquiry} onOpenChange={(open) => {
        if (!open) {
          setEditingEnquiry(null);
          setDateError(null);
          setIsNewEnquiry(false);
        }
      }}>
        <SheetContent className="sm:max-w-[500px] flex flex-col p-0 border-l-0">
          <SheetHeader className="px-6 py-4 border-b border-slate-100 dark:border-border">
            <SheetTitle className="text-xl">{isNewEnquiry ? "New enquiry" : "Edit enquiry"}</SheetTitle>
            <SheetDescription className="text-primary font-mono text-xs mt-1 bg-primary/10 px-2 py-1 rounded-md inline-block w-fit">
              Serial: {editingEnquiry?.id}
            </SheetDescription>
          </SheetHeader>
          
          {editingEnquiry && (
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="space-y-8">
                
                {/* Enquiry Section */}
                <section>
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Enquiry</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Type</label>
                      <select 
                        value={editingEnquiry.type} 
                        onChange={(e) => {
                          const newType = e.target.value;
                          const updates: Partial<Enquiry> = { type: newType };
                          if (isNewEnquiry) {
                            const prefix = newType === "Tour Package Enquiry" ? "PKG" : "TRN";
                            updates.id = editingEnquiry.id.replace(/^[A-Z]+-/, `${prefix}-`);
                          }
                          setEditingEnquiry({ ...editingEnquiry, ...updates });
                        }}
                        className="flex h-9 w-full rounded-xl border border-input bg-slate-50/50 dark:bg-muted/50 px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                      >
                        <option value="Tour Package Enquiry">Tour Package Enquiry</option>
                        <option value="Transport Enquiry">Transport Enquiry</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Client type</label>
                      <select defaultValue={editingEnquiry.clientType} className="flex h-9 w-full rounded-xl border border-input bg-slate-50/50 dark:bg-muted/50 px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                        <option value="B2B">B2B</option>
                        <option value="B2C">B2C</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Customer Section */}
                <section>
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Customer</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Customer name</label>
                      <Input defaultValue={editingEnquiry.customerName} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Mobile</label>
                        <Input defaultValue={editingEnquiry.customerPhone} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">WhatsApp</label>
                        <Input defaultValue={editingEnquiry.whatsapp} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Email</label>
                      <Input defaultValue={editingEnquiry.email} type="email" className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                  </div>
                </section>

                {/* Travel Section */}
                <section>
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Travel</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Pickup</label>
                      <Input defaultValue={editingEnquiry.pickup} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Destination</label>
                      <Input defaultValue={editingEnquiry.destination} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Start date</label>
                      <Input type="date" defaultValue={editingEnquiry.startDate} onChange={handleDateChange} min={todayDateString} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">End date</label>
                      <Input type="date" defaultValue={editingEnquiry.endDate} onChange={handleDateChange} min={todayDateString} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    {dateError && (
                      <div className="col-span-2 text-red-500 text-xs font-medium bg-red-50 p-2 rounded-md border border-red-100">
                        {dateError}
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Passengers</label>
                      <Input defaultValue={editingEnquiry.pax} type="number" className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Vehicle</label>
                      <select defaultValue={editingEnquiry.vehicle} className="flex h-9 w-full rounded-xl border border-input bg-slate-50/50 dark:bg-muted/50 px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                        <option value="Sedan">Sedan</option>
                        <option value="SUV">SUV</option>
                        <option value="Innova Crysta">Innova Crysta</option>
                        <option value="Tempo Traveller">Tempo Traveller</option>
                        <option value="22 seater bus">22 seater bus</option>
                        <option value="27 seater bus">27 seater bus</option>
                        <option value="Premium Coach">Premium Coach</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Services Section */}
                <section>
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Services</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Ticket Confirmed</label>
                      <div className="flex bg-slate-100 dark:bg-muted p-1 rounded-lg">
                        <Button 
                          variant="ghost" 
                          onClick={() => setEditingEnquiry({ ...editingEnquiry, ticket: true })}
                          className={`flex-1 h-7 text-xs rounded-md ${editingEnquiry.ticket ? 'bg-white shadow-sm dark:bg-background text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >yes</Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setEditingEnquiry({ ...editingEnquiry, ticket: false })}
                          className={`flex-1 h-7 text-xs rounded-md ${!editingEnquiry.ticket ? 'bg-white shadow-sm dark:bg-background text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >no</Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Hotel Confirmed</label>
                      <div className="flex bg-slate-100 dark:bg-muted p-1 rounded-lg">
                        <Button 
                          variant="ghost" 
                          onClick={() => setEditingEnquiry({ ...editingEnquiry, hotelConfirmed: true })}
                          className={`flex-1 h-7 text-xs rounded-md ${editingEnquiry.hotelConfirmed ? 'bg-white shadow-sm dark:bg-background text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                        >yes</Button>
                        <Button 
                          variant="ghost" 
                          onClick={() => setEditingEnquiry({ ...editingEnquiry, hotelConfirmed: false })}
                          className={`flex-1 h-7 text-xs rounded-md ${!editingEnquiry.hotelConfirmed ? 'bg-white shadow-sm dark:bg-background text-red-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >no</Button>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1.5 mt-2">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Hotel type</label>
                      <select defaultValue={editingEnquiry.hotelType} className="flex h-9 w-full rounded-xl border border-input bg-slate-50/50 dark:bg-muted/50 px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary">
                        <option value="With Hotel">With Hotel</option>
                        <option value="Without Hotel">Without Hotel</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Additional details */}
                <section>
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Additional details</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Interested places</label>
                      <Input defaultValue={editingEnquiry.interestedPlaces} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Special requirements</label>
                      <Input defaultValue={editingEnquiry.specialRequirements} className="h-9 text-[13px] bg-slate-50/50 dark:bg-muted/50" />
                    </div>
                  </div>
                </section>

                {/* Internal notes */}
                <section>
                  <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider mb-4">Internal notes</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Customer remarks</label>
                      <textarea 
                        defaultValue={editingEnquiry.customerRemarks}
                        className="flex w-full rounded-xl border border-input bg-slate-50/50 dark:bg-muted/50 px-3 py-2 text-[13px] ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Status</label>
                      <select defaultValue={editingEnquiry.status} className="flex h-9 w-full rounded-xl border border-input bg-slate-50/50 dark:bg-muted/50 px-3 py-1 text-[13px] shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary font-bold text-primary">
                        <option value="New">New</option>
                        <option value="Follow Up">Follow Up</option>
                        <option value="Quotation Sent">Quotation Sent</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </section>
                
              </div>
            </div>
          )}
          
          <div className="px-6 py-4 border-t border-slate-100 dark:border-border flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-muted/30 backdrop-blur-sm">
            <div className="flex-1">
              {!isNewEnquiry && (
                <Button variant="ghost" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 h-9 font-semibold">Delete Enquiry</Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-full px-5 h-10 font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300" onClick={() => { setEditingEnquiry(null); setDateError(null); setIsNewEnquiry(false); }}>Cancel</Button>
              <Button className="rounded-full px-6 h-10 font-bold bg-[#f0a500] hover:bg-[#d99400] text-white premium-shadow" onClick={handleSaveForm}>
                {isNewEnquiry ? "Create Enquiry" : "Save Changes"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
