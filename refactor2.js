const fs = require('fs')

let content = fs.readFileSync('app/hotel/[slug]/page.tsx', 'utf8')

// Grab the FLEET, SERVICES, WHY sections
const fleetMatch = content.match(/\{activeTab === 'fleet' && \(\s*(<section[\s\S]*?<\/section>)\s*\)\}/)
const servicesMatch = content.match(/\{activeTab === 'services' && \(\s*(<section[\s\S]*?<\/section>)\s*\)\}/)
const whyMatch = content.match(/\{activeTab === 'why' && \(\s*(<div className="flex flex-col gap-12"[\s\S]*?<\/div>)\s*\)\}/)

const fleetHTML = fleetMatch ? fleetMatch[1] : ''
const servicesHTML = servicesMatch ? servicesMatch[1] : ''
const whyHTML = whyMatch ? whyMatch[1] : ''

// Create Mobile Accordion Version
const mobileAccordionHTML = `
          {/* Mobile Accordion */}
          <div className="flex flex-col gap-4 md:hidden px-4">
            <details name="explore-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  Our Fleet
                </div>
                <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-4 pb-6 border-t border-[#1f1f1f] pt-4">
                ${fleetHTML}
              </div>
            </details>

            <details name="explore-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  Our Services
                </div>
                <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-4 pb-6 border-t border-[#1f1f1f] pt-4">
                ${servicesHTML}
              </div>
            </details>

            <details name="explore-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Why Choose Us
                </div>
                <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-4 pb-6 border-t border-[#1f1f1f] pt-4">
                ${whyHTML}
              </div>
            </details>
          </div>
`

// Wrap Desktop Content
content = content.replace(/\{\/\* Tab content \*\/\}/, mobileAccordionHTML + "\n\n          {/* Tab content */}")
content = content.replace(/<div className="transition-all duration-300">/, `<div className="transition-all duration-300 hidden md:block">`)

fs.writeFileSync('app/hotel/[slug]/page.tsx.new2', content)
console.log("Refactored to page.tsx.new2")
