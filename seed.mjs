import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const env = fs.readFileSync('.env.local', 'utf-8');
const getEnv = (key) => {
  const match = env.match(new RegExp(`^${key}="(.*?)"$`, 'm'));
  if (match) {
    return match[1].replace(/\\n/g, '\n');
  }
  return undefined;
};

initializeApp({
  credential: cert({
    projectId: getEnv('FIREBASE_PROJECT_ID'),
    clientEmail: getEnv('FIREBASE_CLIENT_EMAIL'),
    privateKey: getEnv('FIREBASE_PRIVATE_KEY'),
  })
});

const db = getFirestore();

const enquiries = [
  { 
    id: "PKG-2026-0001", 
    customerName: "Tanya Khan (Corp)", 
    customerPhone: "9892153903", 
    whatsapp: "9841037514",
    email: "tanya.khan@example.com",
    type: "Tour Package Enquiry", 
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
  { 
    id: "PKG-2026-0002", 
    customerName: "Pooja Rao", 
    customerPhone: "9838252215", 
    type: "Tour Package Enquiry", 
    clientType: "B2C", 
    tripRoute: "Gangtok → Darjeeling", 
    pax: 14, 
    days: 4, 
    vehicle: "SUV", 
    dates: "Aug 20 - Aug 24", 
    ticket: true, 
    status: "Follow Up" 
  },
  { 
    id: "TRN-2026-0003", 
    customerName: "Kavya Patel", 
    customerPhone: "9874849860", 
    type: "Transport Enquiry", 
    clientType: "B2C", 
    tripRoute: "NJP Station → Gangtok", 
    pax: 10, 
    days: 4, 
    vehicle: "Innova Crysta", 
    dates: "Aug 7 - Aug 11", 
    ticket: true, 
    status: "New" 
  }
];

async function seed() {
  try {
    for (const enq of enquiries) {
      await db.collection('enquiries').doc(enq.id).set(enq);
      console.log(`Created ${enq.id}`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}
seed();
