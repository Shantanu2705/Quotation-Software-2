"use client";

import { useState, useEffect } from "react";
import { FileSpreadsheet, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/client";
import { Quotation } from "@/components/quotation/QuotationTable";
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { useSettings } from '@/contexts/SettingsContext';
import { generateAndDownloadPdf } from '@/lib/pdfUtils';

const tabs = ["Revenue", "Bookings", "Vehicle Utilization", "Drivers", "Corporate vs Tourist"];

export default function ReportsPage() {
  const { settings } = useSettings();
  const [activeTab, setActiveTab] = useState("Revenue");
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Fetch real-time data from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "quotations"), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Quotation);
      setQuotations(data);
    });
    return () => unsub();
  }, []);

  // Filter to only Confirmed bookings
  const bookings = quotations.filter(q => q.status === "Confirmed");

  // Calculate Metrics (Daily, Weekly, Monthly)
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfWeekStr = startOfWeek.toISOString().split("T")[0];
  
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOfMonthStr = startOfMonth.toISOString().split("T")[0];

  let dailyBookings = 0;
  let dailyRevenue = 0;
  let weeklyBookings = 0;
  let weeklyRevenue = 0;
  let monthlyBookings = 0;
  let monthlyRevenue = 0;

  bookings.forEach(b => {
    // Use createdAt if available, fallback to travelStartDate
    let dateStr = b.createdAt ? b.createdAt.split("T")[0] : b.travelStartDate;
    if (!dateStr) return;

    if (dateStr === todayStr) {
      dailyBookings++;
      dailyRevenue += (b.grandTotal || 0);
    }
    
    if (dateStr >= startOfWeekStr) {
      weeklyBookings++;
      weeklyRevenue += (b.grandTotal || 0);
    }
    
    if (dateStr >= startOfMonthStr) {
      monthlyBookings++;
      monthlyRevenue += (b.grandTotal || 0);
    }
  });

  // Dynamic Chart Data Processing
  let chartData: any[] = [];
  let formatYAxis = (value: number) => {
    if (value === 0) return "0k";
    return `${Math.round(value / 1000)}k`;
  };

  let CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-card p-3 border border-slate-200 dark:border-border shadow-lg rounded-xl">
          <p className="font-bold text-[13px] text-slate-700 dark:text-slate-300 mb-1">{label}</p>
          <p className="text-[13px] font-semibold text-[#f0a500]">
            Value: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (activeTab === "Revenue") {
    const revMap: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.vehicles && b.vehicles.length > 0) {
        b.vehicles.forEach(v => {
          if (v.vehicleType) {
            const vRev = Number(v.qty || 1) * Number(v.days || 1) * Number(v.rate || 0);
            revMap[v.vehicleType] = (revMap[v.vehicleType] || 0) + vRev;
          }
        });
      }
    });
    chartData = Object.keys(revMap).map(k => ({ name: k, value: revMap[k] }));
    if (chartData.length === 0) chartData = [{ name: "No Data", value: 0 }];
    
    CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-card p-3 border border-slate-200 dark:border-border shadow-lg rounded-xl">
            <p className="font-bold text-[13px] text-slate-700 dark:text-slate-300 mb-1">{label}</p>
            <p className="text-[13px] font-semibold text-[#f0a500]">
              Revenue: ₹{payload[0].value.toLocaleString('en-IN')}
            </p>
          </div>
        );
      }
      return null;
    };
  } else if (activeTab === "Bookings") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap: Record<string, number> = {};
    bookings.forEach(b => {
      const dateStr = b.createdAt ? b.createdAt : b.travelStartDate;
      if (dateStr) {
        const d = new Date(dateStr);
        const m = months[d.getMonth()];
        monthMap[m] = (monthMap[m] || 0) + 1;
      }
    });
    chartData = months.map(m => ({ name: m, value: monthMap[m] || 0 })).filter(d => d.value > 0 || months.indexOf(d.name) <= today.getMonth());
    if (chartData.length === 0) chartData = [{ name: "No Data", value: 0 }];
    
    formatYAxis = (v: number) => v.toString();
    CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-card p-3 border border-slate-200 dark:border-border shadow-lg rounded-xl">
            <p className="font-bold text-[13px] text-slate-700 dark:text-slate-300 mb-1">{label}</p>
            <p className="text-[13px] font-semibold text-[#f0a500]">Bookings: {payload[0].value}</p>
          </div>
        );
      }
      return null;
    };
  } else if (activeTab === "Vehicle Utilization") {
    const utilMap: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.vehicles && b.vehicles.length > 0) {
        b.vehicles.forEach(v => {
          if (v.vehicleType) {
            const days = Number(v.qty || 1) * Number(v.days || 0);
            utilMap[v.vehicleType] = (utilMap[v.vehicleType] || 0) + days;
          }
        });
      }
    });
    chartData = Object.keys(utilMap).map(k => ({ name: k, value: utilMap[k] }));
    if (chartData.length === 0) chartData = [{ name: "No Data", value: 0 }];
    
    formatYAxis = (v: number) => v.toString() + "d";
    CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-card p-3 border border-slate-200 dark:border-border shadow-lg rounded-xl">
            <p className="font-bold text-[13px] text-slate-700 dark:text-slate-300 mb-1">{label}</p>
            <p className="text-[13px] font-semibold text-[#f0a500]">Days Booked: {payload[0].value}</p>
          </div>
        );
      }
      return null;
    };
  } else if (activeTab === "Drivers") {
    const driverMap: Record<string, number> = {};
    bookings.forEach(b => {
      if (b.vehicles && b.vehicles.length > 0) {
        b.vehicles.forEach(v => {
          if (v.driverName && v.driverName.trim() !== "") {
            driverMap[v.driverName] = (driverMap[v.driverName] || 0) + 1;
          }
        });
      }
    });
    chartData = Object.keys(driverMap).map(k => ({ name: k, value: driverMap[k] }));
    if (chartData.length === 0) chartData = [{ name: "No Drivers Assigned", value: 0 }];
    
    formatYAxis = (v: number) => v.toString();
    CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-card p-3 border border-slate-200 dark:border-border shadow-lg rounded-xl">
            <p className="font-bold text-[13px] text-slate-700 dark:text-slate-300 mb-1">{label}</p>
            <p className="text-[13px] font-semibold text-[#f0a500]">Trips: {payload[0].value}</p>
          </div>
        );
      }
      return null;
    };
  } else if (activeTab === "Corporate vs Tourist") {
    const clientMap: Record<string, number> = { "B2B (Corporate)": 0, "B2C (Tourist)": 0 };
    bookings.forEach(b => {
      if (b.clientType === "B2B") clientMap["B2B (Corporate)"]++;
      else clientMap["B2C (Tourist)"]++;
    });
    chartData = Object.keys(clientMap).map(k => ({ name: k, value: clientMap[k] }));
    if (chartData.length === 0) chartData = [{ name: "No Data", value: 0 }];
    
    formatYAxis = (v: number) => v.toString();
    CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="bg-white dark:bg-card p-3 border border-slate-200 dark:border-border shadow-lg rounded-xl">
            <p className="font-bold text-[13px] text-slate-700 dark:text-slate-300 mb-1">{label}</p>
            <p className="text-[13px] font-semibold text-[#f0a500]">Clients: {payload[0].value}</p>
          </div>
        );
      }
      return null;
    };
  }

  const exportCSV = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Value"].concat(chartData.map(e => `${e.name},${e.value}`)).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Report_${activeTab.replace(/ /g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(chartData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `Report_${activeTab.replace(/ /g, "_")}.xlsx`);
  };

  const exportPDF = async () => {
    let chartImage = undefined;
    const chartElement = document.getElementById("report-chart-container");
    if (chartElement) {
      const canvas = await html2canvas(chartElement, { scale: 2 });
      chartImage = canvas.toDataURL("image/png");
    }

    const data = {
      title: `${activeTab} Report`,
      id: `REP-${Math.floor(Math.random()*10000)}`,
      customerName: "Internal Report",
      customerPhone: "-",
      type: "Report",
      details: {},
      chartImage: chartImage,
      tableHeaders: ["Metric", "Value"],
      tableRows: chartData.map(d => [d.name, d.value.toString()]),
      subtotal: 0,
      tax: 0,
      total: 0
    };
    await generateAndDownloadPdf(data, settings, `Report_${activeTab.replace(/ /g, "_")}`);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto min-h-[calc(100vh-6rem)]">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 text-[13px] font-medium">
          Operational insights across your fleet.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-border">
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Daily Bookings</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{dailyBookings}</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[13px]">bookings</span>
          </div>
          <p className="text-[#f0a500] font-bold text-lg">₹{dailyRevenue.toLocaleString('en-IN')}</p>
        </div>
        
        {/* Weekly */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-border">
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Weekly Bookings</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{weeklyBookings}</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[13px]">bookings</span>
          </div>
          <p className="text-[#f0a500] font-bold text-lg">₹{weeklyRevenue.toLocaleString('en-IN')}</p>
        </div>

        {/* Monthly */}
        <div className="bg-white dark:bg-card rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-border">
          <h3 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Monthly Bookings</h3>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-bold text-slate-800 dark:text-white">{monthlyBookings}</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium text-[13px]">bookings</span>
          </div>
          <p className="text-[#f0a500] font-bold text-lg">₹{monthlyRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Report Explorer Main Area */}
      <div className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-6 md:p-8 flex-1 mb-8">
        
        {/* Explorer Header & Export Actions */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Report explorer</h2>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" size="sm" className="h-9 px-4 rounded-full bg-slate-50 dark:bg-muted text-[13px] font-semibold border-slate-200 dark:border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="w-4 h-4 mr-2 text-slate-500" /> CSV
            </Button>
            <Button onClick={exportExcel} variant="outline" size="sm" className="h-9 px-4 rounded-full bg-slate-50 dark:bg-muted text-[13px] font-semibold border-slate-200 dark:border-border hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
              <Download className="w-4 h-4 mr-2 text-slate-500" /> Excel
            </Button>
            <Button onClick={exportPDF} size="sm" className="h-9 px-4 rounded-full bg-[#f0a500] hover:bg-[#d99400] text-white text-[13px] font-bold premium-shadow border-0">
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button>
          </div>
        </div>

        {/* Segmented Control / Tabs */}
        <div className="w-full bg-[#e8f6f3] dark:bg-teal-900/20 rounded-full p-1.5 flex items-center mb-10 overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 min-w-[120px] whitespace-nowrap text-[13px] font-bold py-2.5 px-4 rounded-full transition-all duration-200 ${
                activeTab === tab
                  ? "bg-white dark:bg-teal-800 text-slate-800 dark:text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Chart Area */}
        <div id="report-chart-container" className="w-full h-[400px] bg-white dark:bg-card">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: -10, bottom: 20 }}
              barSize={activeTab === "Bookings" || activeTab === "Corporate vs Tourist" ? 80 : 120}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="name" 
                axisLine={true}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                dy={15}
              />
              <YAxis 
                tickFormatter={formatYAxis} 
                axisLine={true}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                dx={-10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <Bar 
                dataKey="value" 
                fill="#f0a500" 
                radius={[6, 6, 0, 0]}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
