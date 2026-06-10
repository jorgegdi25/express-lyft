const fs = require('fs');
const file = '/Users/jorgegonzalezmejia/Desktop/express lyft/express-lyft/app/admin/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Rename the state type
code = code.replace(
  'const [editRoutePrices, setEditRoutePrices] = useState<Record<string, { sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }>>({})',
  'const [editRouteData, setEditRouteData] = useState<Record<string, { pickup: string; destination: string; hotel_slug: string; sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }>>({})'
);

// 2. Add text fields to the mapped states (3 occurrences)
code = code.replace(
  /\{ sedan_suv: r\.sedan_suv_price, suburban: r\.suburban_price, sprinter: r\.sprinter_price, minibus: r\.minibus_price, coachbus: r\.coachbus_price \},/g,
  '{ pickup: r.pickup, destination: r.destination, hotel_slug: r.hotel_slug, sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },'
);

// 3. Update the saveRoute call payload
const saveRouteTarget = `saveRoute({
                                    ...rp,
                                    sedan_suv_price: editRoutePrices[rp.id]?.sedan_suv ?? rp.sedan_suv_price,
                                    suburban_price: editRoutePrices[rp.id]?.suburban ?? rp.suburban_price,
                                    sprinter_price: editRoutePrices[rp.id]?.sprinter ?? rp.sprinter_price,
                                    minibus_price: editRoutePrices[rp.id]?.minibus ?? rp.minibus_price,
                                    coachbus_price: editRoutePrices[rp.id]?.coachbus ?? rp.coachbus_price,
                                  })`;
const saveRouteReplacement = `saveRoute({
                                    ...rp,
                                    pickup: editRouteData[rp.id]?.pickup ?? rp.pickup,
                                    destination: editRouteData[rp.id]?.destination ?? rp.destination,
                                    hotel_slug: editRouteData[rp.id]?.hotel_slug ?? rp.hotel_slug,
                                    sedan_suv_price: editRouteData[rp.id]?.sedan_suv ?? rp.sedan_suv_price,
                                    suburban_price: editRouteData[rp.id]?.suburban ?? rp.suburban_price,
                                    sprinter_price: editRouteData[rp.id]?.sprinter ?? rp.sprinter_price,
                                    minibus_price: editRouteData[rp.id]?.minibus ?? rp.minibus_price,
                                    coachbus_price: editRouteData[rp.id]?.coachbus ?? rp.coachbus_price,
                                  })`;
code = code.replace(saveRouteTarget, saveRouteReplacement);

// 4. Update the UI for the route name rendering
const uiTarget = `<td className="py-4 pr-4">
                          <p className="text-white font-bold">{rp.pickup} → {rp.destination}</p>
                          <p className="text-xs uppercase tracking-widest text-[#888]">{rp.hotel_slug}</p>
                        </td>`;
const uiReplacement = `<td className="py-4 pr-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-1 text-white font-bold">
                              <input type="text" value={editRouteData[rp.id]?.pickup ?? rp.pickup} onChange={(e) => setEditRouteData(prev => ({ ...prev, [rp.id]: { ...prev[rp.id], pickup: e.target.value } }))} className="w-24 bg-[#0a0a0a] border border-[#1e1e1e] rounded p-1 text-xs outline-none focus:border-[#B8960C]" />
                              <span className="text-[#888] mx-0.5">→</span>
                              <input type="text" value={editRouteData[rp.id]?.destination ?? rp.destination} onChange={(e) => setEditRouteData(prev => ({ ...prev, [rp.id]: { ...prev[rp.id], destination: e.target.value } }))} className="w-24 bg-[#0a0a0a] border border-[#1e1e1e] rounded p-1 text-xs outline-none focus:border-[#B8960C]" />
                            </div>
                            <input type="text" value={editRouteData[rp.id]?.hotel_slug ?? rp.hotel_slug} onChange={(e) => setEditRouteData(prev => ({ ...prev, [rp.id]: { ...prev[rp.id], hotel_slug: e.target.value } }))} className="w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded p-1 text-[10px] text-[#888] uppercase tracking-widest outline-none focus:border-[#B8960C]" placeholder="Hotel Slug" />
                          </div>
                        </td>`;
code = code.replace(uiTarget, uiReplacement);

// 5. Replace all remaining editRoutePrices -> editRouteData
code = code.replace(/setEditRoutePrices/g, 'setEditRouteData');
code = code.replace(/editRoutePrices/g, 'editRouteData');

fs.writeFileSync(file, code);
console.log('Patch applied.');
