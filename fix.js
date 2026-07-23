const fs = require('fs');
let code = fs.readFileSync('src/components/quotation/QuotationTable.tsx', 'utf8');

// Fix input values that read from rateCard
code = code.replace(/editingQuotation\.rateCard\.perDay/g, '(editingQuotation.rateCard?.perDay || 0)');
code = code.replace(/editingQuotation\.rateCard\.packagePrice/g, '(editingQuotation.rateCard?.packagePrice || 0)');
code = code.replace(/editingQuotation\.rateCard\.permits/g, '(editingQuotation.rateCard?.permits || 0)');
code = code.replace(/editingQuotation\.rateCard\.toll/g, '(editingQuotation.rateCard?.toll || 0)');
code = code.replace(/editingQuotation\.rateCard\.parking/g, '(editingQuotation.rateCard?.parking || 0)');
code = code.replace(/editingQuotation\.rateCard\.extraVehicle/g, '(editingQuotation.rateCard?.extraVehicle || 0)');
code = code.replace(/editingQuotation\.rateCard\.additionalCharges/g, '(editingQuotation.rateCard?.additionalCharges || 0)');
code = code.replace(/editingQuotation\.rateCard\.gstPercent/g, '(editingQuotation.rateCard?.gstPercent || 0)');

// Also fix some non-array fields that might be undefined (string inputs)
code = code.replace(/value={editingQuotation\.customerName}/g, 'value={editingQuotation.customerName || ""}');
code = code.replace(/value={editingQuotation\.mobile}/g, 'value={editingQuotation.mobile || ""}');
code = code.replace(/value={editingQuotation\.destination}/g, 'value={editingQuotation.destination || ""}');
code = code.replace(/value={editingQuotation\.travelStartDate}/g, 'value={editingQuotation.travelStartDate || ""}');
code = code.replace(/value={editingQuotation\.travelEndDate}/g, 'value={editingQuotation.travelEndDate || ""}');
code = code.replace(/value={editingQuotation\.packageDuration}/g, 'value={editingQuotation.packageDuration || ""}');
code = code.replace(/value={editingQuotation\.pickupLocation}/g, 'value={editingQuotation.pickupLocation || ""}');
code = code.replace(/value={editingQuotation\.dropLocation}/g, 'value={editingQuotation.dropLocation || ""}');
code = code.replace(/value={editingQuotation\.pickupTiming}/g, 'value={editingQuotation.pickupTiming || ""}');
code = code.replace(/value={editingQuotation\.dropTiming}/g, 'value={editingQuotation.dropTiming || ""}');
code = code.replace(/value={editingQuotation\.driverInstructions}/g, 'value={editingQuotation.driverInstructions || ""}');
code = code.replace(/value={editingQuotation\.vehicleNotes}/g, 'value={editingQuotation.vehicleNotes || ""}');
code = code.replace(/value={editingQuotation\.remarks}/g, 'value={editingQuotation.remarks || ""}');
code = code.replace(/value={editingQuotation\.pax}/g, 'value={editingQuotation.pax || 2}');
code = code.replace(/value={editingQuotation\.advancePercent}/g, 'value={editingQuotation.advancePercent || 0}');
code = code.replace(/value={editingQuotation\.clientType}/g, 'value={editingQuotation.clientType || "B2C"}');

fs.writeFileSync('src/components/quotation/QuotationTable.tsx', code);
