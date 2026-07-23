import fs from 'fs';

const filePath = 'src/components/quotation/QuotationTable.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const additionalAccordions = `

                {/* 5. Inclusions, Exclusions, Permits */}
                <AccordionItem value="inclusions" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Inclusions, Exclusions & Permits
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Inclusions */}
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase">✓ Inclusions</label>
                        <div className="space-y-2">
                          {editingQuotation.inclusions.map((inc, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input value={inc} onChange={e => { const u = [...editingQuotation.inclusions]; u[idx] = e.target.value; setEditField("inclusions", u); }} className="h-8 text-[12px] bg-slate-50 dark:bg-muted/50" />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={() => { const u = [...editingQuotation.inclusions]; u.splice(idx, 1); setEditField("inclusions", u); }}><X size={14}/></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setEditField("inclusions", [...editingQuotation.inclusions, ""])} className="w-full border-dashed h-8">
                            <Plus size={14} className="mr-2" /> Add Inclusion
                          </Button>
                        </div>
                      </div>

                      {/* Exclusions */}
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase">✗ Exclusions</label>
                        <div className="space-y-2">
                          {editingQuotation.exclusions.map((exc, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input value={exc} onChange={e => { const u = [...editingQuotation.exclusions]; u[idx] = e.target.value; setEditField("exclusions", u); }} className="h-8 text-[12px] bg-slate-50 dark:bg-muted/50" />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={() => { const u = [...editingQuotation.exclusions]; u.splice(idx, 1); setEditField("exclusions", u); }}><X size={14}/></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setEditField("exclusions", [...editingQuotation.exclusions, ""])} className="w-full border-dashed h-8">
                            <Plus size={14} className="mr-2" /> Add Exclusion
                          </Button>
                        </div>
                      </div>

                      {/* Permits */}
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase">Permits</label>
                        <div className="space-y-2">
                          {editingQuotation.permits.map((p, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input value={p} onChange={e => { const u = [...editingQuotation.permits]; u[idx] = e.target.value; setEditField("permits", u); }} className="h-8 text-[12px] bg-slate-50 dark:bg-muted/50" />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={() => { const u = [...editingQuotation.permits]; u.splice(idx, 1); setEditField("permits", u); }}><X size={14}/></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setEditField("permits", [...editingQuotation.permits, ""])} className="w-full border-dashed h-8">
                            <Plus size={14} className="mr-2" /> Add Permit
                          </Button>
                        </div>
                      </div>

                      {/* Sightseeing */}
                      <div className="space-y-2">
                        <label className="text-[12px] font-bold text-slate-500 uppercase">Extra Sightseeing</label>
                        <div className="space-y-2">
                          {editingQuotation.sightseeing.map((s, idx) => (
                            <div key={idx} className="flex gap-2">
                              <Input value={s} onChange={e => { const u = [...editingQuotation.sightseeing]; u[idx] = e.target.value; setEditField("sightseeing", u); }} className="h-8 text-[12px] bg-slate-50 dark:bg-muted/50" />
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 shrink-0" onClick={() => { const u = [...editingQuotation.sightseeing]; u.splice(idx, 1); setEditField("sightseeing", u); }}><X size={14}/></Button>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" onClick={() => setEditField("sightseeing", [...editingQuotation.sightseeing, ""])} className="w-full border-dashed h-8">
                            <Plus size={14} className="mr-2" /> Add Sightseeing
                          </Button>
                        </div>
                      </div>

                    </div>
                  </AccordionContent>
                </AccordionItem>
`;

const detailsAccordion = `

                {/* 7. Additional Details */}
                <AccordionItem value="details" className="border border-slate-200 dark:border-border rounded-xl px-4 bg-white dark:bg-card">
                  <AccordionTrigger className="hover:no-underline py-4 text-[14px] font-bold">
                    Additional Details
                  </AccordionTrigger>
                  <AccordionContent className="pb-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Pickup Timing</label>
                        <Input value={editingQuotation.pickupTiming} onChange={e => setEditField("pickupTiming", e.target.value)} className="h-9 text-[13px] bg-slate-50 dark:bg-muted/50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Drop Timing</label>
                        <Input value={editingQuotation.dropTiming} onChange={e => setEditField("dropTiming", e.target.value)} className="h-9 text-[13px] bg-slate-50 dark:bg-muted/50" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Driver Instructions</label>
                        <Input value={editingQuotation.driverInstructions} onChange={e => setEditField("driverInstructions", e.target.value)} className="h-9 text-[13px] bg-slate-50 dark:bg-muted/50" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">Vehicle Notes</label>
                        <Input value={editingQuotation.vehicleNotes} onChange={e => setEditField("vehicleNotes", e.target.value)} className="h-9 text-[13px] bg-slate-50 dark:bg-muted/50" />
                      </div>
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[12px] font-semibold text-slate-600 dark:text-slate-300">General Remarks</label>
                        <Input value={editingQuotation.remarks} onChange={e => setEditField("remarks", e.target.value)} className="h-9 text-[13px] bg-slate-50 dark:bg-muted/50" />
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
`;

content = content.replace('{/* 5. Pricing & Summary (Calculations) */}', additionalAccordions + '\\n                {/* 6. Pricing & Summary (Calculations) */}');
content = content.replace('</Accordion>', detailsAccordion + '\\n              </Accordion>');

fs.writeFileSync(filePath, content);
