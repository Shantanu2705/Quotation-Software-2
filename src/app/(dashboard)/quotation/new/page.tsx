"use client";

import { Suspense, useEffect, useState } from "react";
import { QuotationForm } from "@/components/quotation/QuotationForm";
import { useSearchParams } from "next/navigation";
import { Quotation } from "@/components/quotation/QuotationTable";
import { db } from "@/firebase/client";
import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { useSettings } from "@/contexts/SettingsContext";

function NewQuotationContent() {
  const searchParams = useSearchParams();
  const enquiryIdFromQuery = searchParams.get("enquiryId");
  const [initialData, setInitialData] = useState<Quotation | null>(null);
  const { settings, loading } = useSettings();

  useEffect(() => {
    const initData = async () => {
      // Generate a new ID
      const year = new Date().getFullYear();
      let nextNum = 1;
      try {
        const qSnap = await getDocs(query(collection(db, "quotations"), orderBy("id", "desc"), limit(1)));
        if (!qSnap.empty) {
          const lastId = qSnap.docs[0].id;
          if (lastId.startsWith(`QTN-${year}`)) {
            const lastNum = parseInt(lastId.split("-")[2], 10);
            if (!isNaN(lastNum)) nextNum = lastNum + 1;
          }
        }
      } catch (e) {
        console.error("Error fetching last id:", e);
      }
      const newId = `QTN-${year}-${nextNum.toString().padStart(4, "0")}`;

      let baseData: Quotation = {
        id: newId,
        enquiryId: "",
        customerName: "",
        mobile: "",
        destination: "",
        pax: 2,
        clientType: "B2C",
        type: "Tour Package Enquiry",
        status: "Draft",
        paymentStatus: "In Progress",
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
          perDay: 0, packagePrice: 0, driverAllowance: 0, extras: 0, permits: 0, toll: 0, 
          parking: 0, extraVehicle: 0, gstPercent: settings.gstPercent || 5, additionalCharges: 0
        },
        advancePercent: 30,
        subtotal: 0,
        grandTotal: 0,
        advanceAmount: 0,
        balance: 0,
        createdAt: new Date().toISOString(),
        pickupTiming: "",
        dropTiming: "",
        driverInstructions: "",
        vehicleNotes: "",
        remarks: ""
      };

      if (enquiryIdFromQuery) {
        try {
          const enqDoc = await getDoc(doc(db, "enquiries", enquiryIdFromQuery));
          if (enqDoc.exists()) {
            const eq = enqDoc.data();
            baseData = {
              ...baseData,
              enquiryId: eq.id || enquiryIdFromQuery,
              customerName: eq.customerName || "",
              mobile: eq.mobile || "",
              destination: eq.destination || "",
              pax: eq.pax || 2,
              clientType: eq.clientType || "B2C",
              type: eq.type || "Tour Package Enquiry",
              travelStartDate: eq.startDate || "",
              travelEndDate: eq.endDate || "",
              packageDuration: eq.duration || "1N / 2D",
              remarks: eq.customerRemarks || ""
            };
          }
        } catch (error) {
          console.error("Error fetching enquiry:", error);
        }
      }

      setInitialData(baseData);
    };

    initData();
  }, [enquiryIdFromQuery, settings, loading]);

  if (loading || !initialData) {
    return <div className="p-8 text-center text-slate-500">Preparing quotation form...</div>;
  }

  return <QuotationForm initialData={initialData} isNew={true} />;
}

export default function NewQuotationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
      <NewQuotationContent />
    </Suspense>
  );
}
