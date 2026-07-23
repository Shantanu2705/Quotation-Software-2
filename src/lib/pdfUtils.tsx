import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { GlobalSettings } from "@/contexts/SettingsContext";

export interface PdfData {
  title: string;
  id: string; // QTN-YYYY-XXXX or INV-XXXXXX
  customerName: string;
  customerPhone: string;
  type: string;
  details: Record<string, any>;
  tableHeaders: string[];
  tableRows: any[][];
  subtotal: number;
  tax: number;
  total: number;
  advanceAmount?: number;
  balance?: number;
  chartImage?: string;
}

const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
};

const getImageDimensions = (base64: string): Promise<{w: number, h: number}> => {
  return new Promise(resolve => {
    if (!base64) return resolve({ w: 0, h: 0 });
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.src = base64;
  });
};

export const generateAndDownloadPdf = async (data: PdfData, settings: GlobalSettings, filename: string) => {
  const doc = new jsPDF("p", "pt", "a4");
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  
  const brandColor = settings.brandColor || "#000000";
  const [r, g, b] = hexToRgb(brandColor);

  let logoDims = { w: 0, h: 0 };
  if (settings.companyLogo) {
    logoDims = await getImageDimensions(settings.companyLogo);
  }

  // Helper to draw watermark and border on EVERY page
  const drawPageDecorations = () => {
    // 1. Draw Border
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(4);
    doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));

    // 2. Draw Watermark
    if (settings.companyLogo && logoDims.w > 0) {
      doc.setGState(new (doc as any).GState({ opacity: 0.15 })); // Darker watermark
      
      const targetWidth = 350;
      const targetHeight = (logoDims.h / logoDims.w) * targetWidth;
      const x = (pageWidth - targetWidth) / 2;
      const y = (pageHeight - targetHeight) / 2;
      
      const imgType = settings.companyLogo.includes("png") ? "PNG" : "JPEG";
      doc.addImage(settings.companyLogo, imgType, x, y, targetWidth, targetHeight);
      doc.setGState(new (doc as any).GState({ opacity: 1.0 }));
    }
  };

  // Draw initial page decorations
  drawPageDecorations();

  let startY = margin + 20;

  const checkPageBreak = (requiredHeight: number) => {
    if (startY + requiredHeight > pageHeight - margin - 20) {
      doc.addPage();
      drawPageDecorations();
      startY = margin + 30;
    }
  };

  // --- HEADER ---
  if (settings.companyLogo && logoDims.w > 0) {
    const targetHeight = 80;
    const targetWidth = (logoDims.w / logoDims.h) * targetHeight;
    const imgType = settings.companyLogo.includes("png") ? "PNG" : "JPEG";
    doc.addImage(settings.companyLogo, imgType, margin + 10, startY, targetWidth, targetHeight);
    
    // Company contact details below logo
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0); // Black text
    let contactY = startY + targetHeight + 20;
    if (settings.supportEmail) {
      doc.text(`Email: ${settings.supportEmail}`, margin + 10, contactY);
      contactY += 15;
    }
    if (settings.whatsappNumber) {
      doc.text(`Phone: ${settings.whatsappNumber}`, margin + 10, contactY);
    }
  } else {
    doc.setFontSize(26);
    doc.setTextColor(r, g, b); // Heading color = logo color
    doc.setFont("helvetica", "bold");
    doc.text(settings.companyName, margin + 10, startY + 25);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    let contactY = startY + 50;
    if (settings.supportEmail) {
      doc.text(`Email: ${settings.supportEmail}`, margin + 10, contactY);
      contactY += 15;
    }
    if (settings.whatsappNumber) {
      doc.text(`Phone: ${settings.whatsappNumber}`, margin + 10, contactY);
    }
  }

  // --- DOCUMENT INFO (RIGHT SIDE) ---
  const docInfoY = margin + 40;
  doc.setFontSize(26);
  doc.setTextColor(r, g, b); // Heading color
  doc.setFont("helvetica", "bold");
  doc.text(data.title.toUpperCase(), pageWidth - margin - 10, docInfoY, { align: "right" });

  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text(`Ref No: ${data.id}`, pageWidth - margin - 10, docInfoY + 25, { align: "right" });
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  doc.text(`Date: ${dateStr}`, pageWidth - margin - 10, docInfoY + 45, { align: "right" });

  startY = Math.max(startY + (logoDims.h ? 130 : 100), docInfoY + 80);

  // Divider Line
  doc.setDrawColor(r, g, b);
  doc.setLineWidth(1);
  doc.line(margin + 10, startY, pageWidth - margin - 10, startY);
  startY += 35;

  if (data.type === 'Report' && data.chartImage) {
    const chartDims = await getImageDimensions(data.chartImage);
    if (chartDims.w > 0) {
      checkPageBreak(250);
      const chartWidth = pageWidth - (margin * 2) - 20;
      const chartHeight = (chartDims.h / chartDims.w) * chartWidth;
      doc.addImage(data.chartImage, "PNG", margin + 10, startY, chartWidth, chartHeight);
      startY += chartHeight + 40;
    }
  }

  if (data.type !== 'Report') {
    // --- CUSTOMER ---
  checkPageBreak(80);
  doc.setFontSize(16);
  doc.setTextColor(r, g, b); // Heading color
  doc.setFont("helvetica", "bold");
  doc.text("BILLED TO:", margin + 10, startY);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black text
  doc.text(data.customerName, margin + 10, startY + 22);
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text(`Phone: ${data.customerPhone}`, margin + 10, startY + 42);

  startY += 70;

  // --- DETAILS ---
  if (Object.keys(data.details).length > 0) {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setTextColor(r, g, b); // Heading color
    doc.setFont("helvetica", "bold");
    doc.text("DETAILS:", margin + 10, startY);
    startY += 25;
    
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0); // Black text
    Object.entries(data.details).forEach(([key, value]) => {
      checkPageBreak(25);
      doc.setFont("helvetica", "bold");
      doc.text(`${key}:`, margin + 10, startY);
      doc.setFont("helvetica", "normal");
      doc.text(`${value}`, margin + 120, startY);
      startY += 20;
    });
    startY += 20;
    startY += 20;
  }
  } // END if (data.type !== 'Report')

  // --- SUMMARY HEADER FOR REPORT ---
  if (data.type === 'Report') {
    checkPageBreak(40);
    doc.setFontSize(16);
    doc.setTextColor(r, g, b);
    doc.setFont("helvetica", "bold");
    doc.text("SUMMARY DATA:", margin + 10, startY);
    startY += 25;
  }

  // --- AUTO TABLE ---
  autoTable(doc, {
    startY: startY,
    head: [data.tableHeaders],
    body: data.tableRows,
    theme: 'grid',
    styles: {
      fontSize: 14, // Larger standard font
      cellPadding: 8,
    },
    headStyles: {
      fillColor: [r, g, b],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'left',
      fontSize: 14,
    },
    bodyStyles: {
      textColor: 0,
      halign: 'left',
      fontSize: 14,
    },
    columnStyles: {
      1: { halign: 'right' } // Assuming amount is always second column
    },
    margin: { left: margin + 10, right: margin + 10, bottom: margin + 20 },
    didDrawPage: function (data: any) {
      if (data.pageNumber > 1) {
        drawPageDecorations();
      }
    }
  });

  startY = (doc as any).lastAutoTable.finalY + 40;

  if (data.type !== 'Report') {
    // --- TOTALS ---
  checkPageBreak(150); // Make sure totals fit
  const totalsX = pageWidth - margin - 200;
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  
  doc.text("Subtotal:", totalsX, startY);
  doc.text(`Rs. ${data.subtotal.toLocaleString("en-IN")}`, pageWidth - margin - 10, startY, { align: "right" });
  
  if (data.tax > 0) {
    startY += 25;
    doc.text("GST / Tax:", totalsX, startY);
    doc.text(`Rs. ${data.tax.toLocaleString("en-IN")}`, pageWidth - margin - 10, startY, { align: "right" });
  }
  
  startY += 30;
  doc.setFontSize(16);
  doc.setTextColor(r, g, b); // Brand color for total
  doc.setFont("helvetica", "bold");
  doc.text("GRAND TOTAL:", totalsX, startY);
  doc.text(`Rs. ${data.total.toLocaleString("en-IN")}`, pageWidth - margin - 10, startY, { align: "right" });
  
  if (data.advanceAmount !== undefined) {
    startY += 30;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("Advance Received:", totalsX, startY);
    doc.text(`-Rs. ${data.advanceAmount.toLocaleString("en-IN")}`, pageWidth - margin - 10, startY, { align: "right" });
  }

  if (data.balance !== undefined) {
    startY += 30;
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); // Black text for balance
    doc.setFont("helvetica", "bold");
    doc.text("BALANCE DUE:", totalsX, startY);
    doc.text(`Rs. ${data.balance.toLocaleString("en-IN")}`, pageWidth - margin - 10, startY, { align: "right" });
  }

  startY += 50;

  // --- BANK DETAILS & TERMS ---
  if (data.type.includes("Quotation") || data.type.includes("Invoice")) {
    
    // Bank Details
    if (settings.bankName) {
      checkPageBreak(130);
      doc.setFontSize(16);
      doc.setTextColor(r, g, b); // Heading color
      doc.setFont("helvetica", "bold");
      doc.text("BANK DETAILS", margin + 10, startY);
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(`Bank: ${settings.bankName}`, margin + 10, startY + 22);
      doc.text(`Account Name: ${settings.accountHolderName}`, margin + 10, startY + 42);
      doc.text(`A/C No: ${settings.accountNumber}`, margin + 10, startY + 62);
      doc.text(`IFSC: ${settings.ifsc}`, margin + 10, startY + 82);
      doc.text(`UPI: ${settings.upiId}`, margin + 10, startY + 102);
      
      startY += 130;
    }
    
    // Terms (Wrap Text)
    if (settings.termsAndConditions) {
      checkPageBreak(40);
      doc.setFontSize(16);
      doc.setTextColor(r, g, b);
      doc.setFont("helvetica", "bold");
      doc.text("TERMS & CONDITIONS", margin + 10, startY);
      startY += 25;
      
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      
      const splitTerms = doc.splitTextToSize(settings.termsAndConditions, pageWidth - (margin * 2) - 20);
      for (let i = 0; i < splitTerms.length; i++) {
        checkPageBreak(25);
        doc.text(splitTerms[i], margin + 10, startY);
        startY += 20;
      }
      startY += 20;
    }
  }

  // --- SIGNATURES ---
  startY += 40;
  checkPageBreak(80);

  // Auth Signatory
  const authX = pageWidth - margin - 220;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(authX, startY, authX + 190, startY);
  
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Authorized Signatory", authX + 25, startY + 20);
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text("(Stamp & Date)", authX + 50, startY - 10);
  } // END if (data.type !== 'Report')

  // Save the PDF
  doc.save(`${filename}.pdf`);
};
