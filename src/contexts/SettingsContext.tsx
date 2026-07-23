"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase/client";

export interface GlobalSettings {
  companyName: string;
  supportEmail: string;
  whatsappNumber: string;
  gstPercent: number;
  companyLogo: string;
  brandColor: string;
  headerLogo: string;
  footerLogo: string;
  termsAndConditions: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
  upiId: string;
  paymentQr: string;
  // Login credentials purposefully excluded from context payload for basic security
}

const defaultSettings: GlobalSettings = {
  companyName: "Digital Dictionary", // Fallback to original
  supportEmail: "",
  whatsappNumber: "",
  gstPercent: 5,
  companyLogo: "",
  brandColor: "#000000",
  headerLogo: "",
  footerLogo: "",
  termsAndConditions: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifsc: "",
  branch: "",
  upiId: "",
  paymentQr: "",
};

interface SettingsContextProps {
  settings: GlobalSettings;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextProps>({
  settings: defaultSettings,
  loading: true,
});

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "general"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings((prev) => ({ ...prev, ...docSnap.data() }));
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching settings:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
