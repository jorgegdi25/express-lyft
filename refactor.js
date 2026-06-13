const fs = require('fs')

let content = fs.readFileSync('app/hotel/[slug]/page.tsx', 'utf8')

// Grab the PRICING section HTML
const pricingMatch = content.match(/\{activeTab === 'pricing' && \(\s*(<section[\s\S]*?<\/section>)\s*\)\}/)
const pricingHTML = pricingMatch ? pricingMatch[1] : ''

// Grab the FAQ section HTML
const faqMatch = content.match(/\{activeTab === 'faq' && \(\s*(<section[\s\S]*?<\/section>)\s*\)\}/)
const faqHTML = faqMatch ? faqMatch[1] : ''

if (!pricingHTML || !faqHTML) {
  console.log("Could not find pricing or faq HTML")
  process.exit(1)
}

// Remove Pricing and FAQ from activeTab renders
content = content.replace(/\{activeTab === 'pricing' && \(\s*<section[\s\S]*?<\/section>\s*\)\}/, '')
content = content.replace(/\{activeTab === 'faq' && \(\s*<section[\s\S]*?<\/section>\s*\)\}/, '')

// Remove Pricing and FAQ from the Tabs array
content = content.replace(/\{ id: 'pricing', label: 'Rates & Pricing'[\s\S]*?\},/, '')
content = content.replace(/\{ id: 'faq', label: 'FAQ'[\s\S]*?\}\s*\]/, ']')

// The tabs default should be 'fleet' instead of 'pricing'
content = content.replace(/const activeTab = searchParams\.tab \|\| 'pricing'/, "const activeTab = searchParams.tab || 'fleet'")

// Insert Pricing and FAQ immediately after HeroSection
const heroSectionHtml = `<HeroSection vehicleType="sedan_suv" basePrice={prices.sedan_suv} hotelSlug={params.slug} />`
const replacementHtml = `${heroSectionHtml}\n\n      {/* ── Fixed Pricing Section ─────────────────────────────────────────── */}\n      ${pricingHTML}\n\n      {/* ── Fixed FAQ Section ────────────────────────────────────────────── */}\n      ${faqHTML}\n`

content = content.replace(heroSectionHtml, replacementHtml)

// For Accordion on mobile, we can wrap the tab content with a mobile accordion structure or just leave it as is for desktop and hide it on mobile, then render accordion.
// Wait, rendering an accordion manually is tricky. Let's just do it with a component or simple details/summary inside the Explore section.
// For now, let's just make the tabs "hidden md:flex" and add a mobile accordion.
// First, find the "Tab selector" div and add "hidden md:flex".
content = content.replace(
  /<div className="flex overflow-x-auto pb-4 mb-10 gap-3 no-scrollbar scroll-smooth w-full md:w-max md:mx-auto px-4 md:px-0">/,
  `<div className="hidden md:flex overflow-x-auto pb-4 mb-10 gap-3 no-scrollbar scroll-smooth w-full md:w-max md:mx-auto px-4 md:px-0">`
)

fs.writeFileSync('app/hotel/[slug]/page.tsx.new', content)
console.log("Refactored to page.tsx.new")
