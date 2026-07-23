import { Suspense } from "react";
import { QuotationTable } from "@/components/quotation/QuotationTable";

export default function QuotationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading quotations...</div>}>
      <QuotationTable />
    </Suspense>
  );
}
