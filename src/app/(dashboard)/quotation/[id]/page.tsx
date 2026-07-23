"use client";

import { useEffect, useState } from "react";
import { QuotationForm } from "@/components/quotation/QuotationForm";
import { Quotation } from "@/components/quotation/QuotationTable";
import { db } from "@/firebase/client";
import { doc, getDoc } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function EditQuotationPage() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState<Quotation | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const docRef = doc(db, "quotations", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInitialData(docSnap.data() as Quotation);
        } else {
          setError("Quotation not found.");
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    fetchData();
  }, [id]);

  if (error) {
    return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;
  }

  if (!initialData) {
    return <div className="p-8 text-center text-slate-500">Loading quotation...</div>;
  }

  return <QuotationForm initialData={initialData} isNew={false} />;
}
