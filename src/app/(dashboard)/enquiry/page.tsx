import { Metadata } from "next";
import { EnquiryTable } from "@/components/enquiry/EnquiryTable";

export const metadata: Metadata = {
  title: "Enquiries | Digital Dictionary",
  description: "Manage your enquiries efficiently.",
};

export default function EnquiryPage() {
  return (
    <div className="flex flex-col w-full h-full">
      <EnquiryTable />
    </div>
  );
}
