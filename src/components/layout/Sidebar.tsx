"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  FileSignature,
  CreditCard,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/SettingsContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: FileText, label: "Enquiry", href: "/enquiry" },
  { icon: FileSignature, label: "Quotation", href: "/quotation" },
  { icon: CreditCard, label: "Billing", href: "/billing" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { settings } = useSettings();

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative z-20 flex h-screen flex-col border-r bg-sidebar text-sidebar-foreground shadow-xl dark:border-sidebar-border"
    >
      <div className="flex w-full items-center justify-center px-4 pt-8 pb-6 min-h-[140px]">
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="logo-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center gap-2 overflow-hidden py-2"
            >
              <div className="flex w-full shrink-0 items-center justify-center rounded-lg bg-transparent overflow-hidden">
                <Image src={settings.companyLogo || "/watermark.png"} alt={`${settings.companyName} Logo`} width={160} height={100} className="object-contain" />
              </div>
              <span className="font-heading font-extrabold text-xl md:text-2xl text-center tracking-tighter text-primary max-w-full text-balance mt-2">
                {settings.companyName}
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="logo-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-transparent overflow-hidden mx-auto"
            >
              <Image src={settings.companyLogo || "/watermark.png"} alt="Logo" width={64} height={64} className="object-contain" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:bg-accent hover:text-accent-foreground z-50 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div className="flex-1 overflow-y-auto py-8 px-3 scrollbar-hide">
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground premium-shadow"
                    : "text-white/80 hover:bg-sidebar-accent hover:text-white"
                )}
              >
                <item.icon
                  size={20}
                  className={cn("shrink-0", isActive ? "text-primary-foreground" : "text-white/80 group-hover:text-white")}
                />
                <AnimatePresence mode="wait">
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <button className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
          <LogOut size={20} className="shrink-0 text-destructive" />
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.aside>
  );
}
