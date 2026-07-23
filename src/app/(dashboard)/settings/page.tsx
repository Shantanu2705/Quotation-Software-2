"use client";

import { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { Save, UploadCloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: "Himalayan Vintage Holidays",
    supportEmail: "bookings@himalayantaxi.com",
    whatsappNumber: "919800011111",
    gstPercent: 5,
    companyLogo: "",
    brandColor: "#000000",
    headerLogo: "",
    footerLogo: "",
    termsAndConditions: 
      "For late Arrival / Unscheduled extensions please must be reported in advance for necessary arrangement and action.\n" +
      "If by Strikes, Political Closures, War, Civil Disturbance, Natural calamity, Landslide, Non-permit, Flight / Train Cancellations, Accident, Breakdown, Weather, Sickness or any other unforeseen calamities car will go by different route, guest will be bare extra money for long route.\n" +
      "If Management/Agency/Authority/we are unable to provide the taxi service for any Strikes, Political Closures, War, Civil Disturbance, Natural calamity or any unforeseen calamities, that time we will refund only after deducting the expenditure of the travels.\n" +
      "In case of breakdown, we will be arranging swayable vehicle.\n" +
      "The Himalayan Taxi reserves the right to forfeit the package amount, in case of any cancellations from client side during the tour.\n" +
      "In case the client requiring any changes in the pre-booked service, such changes would be considered as new service. The cost for the new service is payable separately and adjustment with the cost of original service is not admissible. Such extension or alteration of the original.\n" +
      "Service is subject to both Himalayan Taxi and the guests agreeing on the same. In case of any disagreement Himalayan Taxi commitment is limited to the service already booked.\n" +
      "The Management/Agency/Authority/we will not undertake liability towards any damage or loss of life or any property of the tourist due to an accident, theft, robbery, any illegal or immoral activity, any penalty by caused of activities against civic rule, natural calamities during the tour.\n" +
      "Vehicle for transfers & sightseeing. Vehicle will be available to guest as per itinerary only (Point to Point basis).\n" +
      "Our vehicle doesn't go to bed and narrow road. Driver decision should be final.\n" +
      "Guests are requested to carry original copy of any Photo ID proof (Except Pan Card) i.e. Passport / Driving License / Voter ID / along with 4 copy passport size photographs.\n" +
      "Children (above 5 years) / Students are requested to carry original copy of school / College Photo Identity card / Aadhar card along with 4 copy passport size photographs.\n" +
      "For Infants (below 5 years) carry 4 copy passport size photographs. Also carry the original birth certificate / Aadhar card.\n" +
      "Additional sightseeing or extra usage of vehicle, other than mentioned in the itinerary, will need extra cost and directly payable on the spot.\n" +
      "The guest should always keep cool with the drivers as they are not tourism educated and come from different remote villages.\n" +
      "As there is shortage of space for car parking in the entire Sikkim & Darjeeling region — guest will have to wait at the Lobby in time for the vehicle to start their sightseeing / transfers. Once our vehicle will leave the hotel area without picking up the guests & come back at parking stand then guest must have to arrange their own to reach at the parking stand.\n" +
      "In Sikkim & Darjeeling region the same vehicles will not be providing for the entire tour, it will be changed sector-wise.\n" +
      "If any tourist spot does not complete which falls on closing day & if they want to do the same on next day then they have to pay the extra cost for the vehicle.\n" +
      "If guests want any changes in their sightseeing schedule they should be informed to our executive previous day before 16:00 hrs, after that no changes are allowed. If the guest informs after 16:00 hrs it will be considered as a cancellation with no refund or guest will pay extra cost for reschedule the sightseeing.\n" +
      "The guests are request to travel with minimum baggage (one baggage per person). In case of excess baggage, the guest will have to opt for an extra vehicle for carrying the excess baggage. The cost for this extra vehicle will be pay by guest directly.\n" +
      "Vehicle subject to availability and should be providing category wise availability not model wise.\n" +
      "All vehicle rates are subject to change for the increasing of fuel cost.\n" +
      "Rates are valid for Indian nationals only.\n" +
      "All dispute will subject to Siliguri jurisdiction only.",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    ifsc: "",
    branch: "",
    upiId: "",
    paymentQr: "",
    fullName: "",
    loginEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "general");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(prev => ({ ...prev, ...docSnap.data() }));
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "settings", "general");
      await setDoc(docRef, settings, { merge: true });
      alert("Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Compress to JPEG with 0.7 quality to guarantee it's under 1MB
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          handleChange(field, compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const FileUploadField = ({ label, field, placeholder }: { label: string, field: string, placeholder?: string }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    return (
      <div className="space-y-1.5 flex flex-col">
        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">{label}</label>
        <div className="flex items-center gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={(e) => handleImageUpload(e, field)} 
          />
          <Button 
            type="button"
            variant="outline" 
            onClick={() => fileInputRef.current?.click()}
            className="h-10 border-dashed text-slate-500 hover:text-primary hover:border-primary/50 text-[13px] flex-1 justify-start font-normal bg-slate-50 dark:bg-card"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            {placeholder || "Upload image"}
          </Button>
          {settings[field as keyof typeof settings] && (
            <Button 
              type="button"
              variant="ghost" 
              onClick={() => handleChange(field, "")} 
              className="h-10 w-10 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
        {settings[field as keyof typeof settings] && (
          <div className="mt-2 w-full flex items-center justify-start">
            <img src={settings[field as keyof typeof settings] as string} alt="Preview" className="h-24 w-auto rounded-lg border border-slate-200 dark:border-border object-contain" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto min-h-screen pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
            Manage company details, invoicing, and preferences.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="bg-[#f0a500] hover:bg-[#d99400] text-white rounded-full h-10 px-8 premium-shadow font-bold flex-1 md:flex-none">
          <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Company Profile */}
        <section className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-6 md:p-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-border pb-4">Company profile</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Company name</label>
              <Input value={settings.companyName} onChange={e => handleChange("companyName", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Support email</label>
              <Input type="email" value={settings.supportEmail} onChange={e => handleChange("supportEmail", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">WhatsApp number</label>
              <Input value={settings.whatsappNumber} onChange={e => handleChange("whatsappNumber", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">GST %</label>
              <Input type="number" value={settings.gstPercent} onChange={e => handleChange("gstPercent", parseFloat(e.target.value))} className="rounded-xl h-10 text-[13px]" />
            </div>
            <FileUploadField label="Company logo" field="companyLogo" placeholder="Upload logo" />
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Brand color (PDF theme)</label>
              <div className="flex gap-2">
                <Input type="color" value={settings.brandColor || "#000000"} onChange={e => handleChange("brandColor", e.target.value)} className="w-12 h-10 p-1 cursor-pointer rounded-xl" />
                <Input type="text" value={settings.brandColor || "#000000"} onChange={e => handleChange("brandColor", e.target.value)} className="rounded-xl h-10 text-[13px] flex-1 font-mono uppercase" />
              </div>
            </div>
          </div>
        </section>

        {/* PDF Logos */}
        <section className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-6 md:p-8">
          <div className="mb-6 border-b border-slate-100 dark:border-border pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">PDF logos</h2>
            <p className="text-[12px] text-slate-500">Header logo appears at the top of every quotation & invoice. Footer logo appears at the bottom. Leave blank to use the default Himalayan logos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileUploadField label="Header logo (top of PDF)" field="headerLogo" placeholder="Upload" />
            <FileUploadField label="Footer logo (bottom of PDF)" field="footerLogo" placeholder="Upload" />
          </div>
        </section>

        {/* Terms & conditions */}
        <section className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-6 md:p-8">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 border-b border-slate-100 dark:border-border pb-4">Terms & conditions</h2>
          <div className="space-y-1.5">
            <Textarea 
              value={settings.termsAndConditions} 
              onChange={e => handleChange("termsAndConditions", e.target.value)}
              className="min-h-[300px] text-[13px] rounded-xl leading-relaxed p-4 bg-slate-50/50 dark:bg-background"
            />
          </div>
        </section>

        {/* Bank details & payment QR */}
        <section className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-6 md:p-8">
          <div className="mb-6 border-b border-slate-100 dark:border-border pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Bank details & payment QR</h2>
            <p className="text-[12px] text-slate-500">Shown on every quotation PDF to help customers pay quickly.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Bank name</label>
              <Input value={settings.bankName} onChange={e => handleChange("bankName", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Account holder name</label>
              <Input value={settings.accountHolderName} onChange={e => handleChange("accountHolderName", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Account number</label>
              <Input value={settings.accountNumber} onChange={e => handleChange("accountNumber", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">IFSC</label>
              <Input value={settings.ifsc} onChange={e => handleChange("ifsc", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Branch</label>
              <Input value={settings.branch} onChange={e => handleChange("branch", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">UPI ID</label>
              <Input value={settings.upiId} onChange={e => handleChange("upiId", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <FileUploadField label="Payment QR code" field="paymentQr" placeholder="Upload QR image" />
          </div>
        </section>

        {/* Login credentials */}
        <section className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-100 dark:border-border p-6 md:p-8">
          <div className="mb-6 border-b border-slate-100 dark:border-border pb-4">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Login credentials</h2>
            <p className="text-[12px] text-slate-500">Update your sign-in email and password. Leave password fields blank to keep the current password.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Full name</label>
              <Input value={settings.fullName} onChange={e => handleChange("fullName", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Login email</label>
              <Input type="email" value={settings.loginEmail} onChange={e => handleChange("loginEmail", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5 md:col-span-2 mt-2">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Current password</label>
              <Input type="password" value={settings.currentPassword} onChange={e => handleChange("currentPassword", e.target.value)} className="rounded-xl h-10 text-[13px] max-w-md" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">New password</label>
              <Input type="password" value={settings.newPassword} onChange={e => handleChange("newPassword", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Confirm new password</label>
              <Input type="password" value={settings.confirmNewPassword} onChange={e => handleChange("confirmNewPassword", e.target.value)} className="rounded-xl h-10 text-[13px]" />
            </div>
            <div className="md:col-span-2 mt-2">
              <Button variant="outline" className="h-10 text-[13px] font-semibold">Update login details</Button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
