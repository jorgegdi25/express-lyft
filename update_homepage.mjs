import fs from 'fs';

const filePath = 'app/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove BookingForm import
content = content.replace("import BookingForm from '@/components/BookingForm'\n", '');

// 2. Remove PageProps with slug, make it a normal page
content = content.replace("export default async function HotelPage({ params, searchParams }: PageProps) {", "export default async function HomePage({ searchParams }: { searchParams: { success?: string; tab?: string } }) {");
content = content.replace("const data = await getHotelData(params.slug)", "const data = await getHotelData('demo')");
content = content.replace("const { hotel, prices, startingPrices } = data", "const { prices, startingPrices } = data");

// 3. Remove BookingForm component from JSX
content = content.replace(/<div id="booking-form"[^>]*>[\s\S]*?<\/BookingForm>\s*<\/div>\s*<\/div>\s*<\/section>/, '');

// 4. Remove Official Partner Banner
content = content.replace(/{\(params\.slug === 'bocean-resort' \|\| params\.slug === 'demo'\) && \([\s\S]*?<\/section>\s*\)}/, '');

// 5. Change "Reserve Online" in header to contact links
content = content.replace(
  /<a\s*href="#booking-form"\s*className="px-3\.5 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"\s*style={{ background: 'linear-gradient\(135deg, #B8960C, #D4AF37\)', color: '#0a0a0a' }}\s*>\s*Reserve Online\s*<\/a>/g,
  `<a href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer" className="px-3.5 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>WhatsApp Us</a>`
);

// 6. Change CTA button in HeroSection - wait HeroSection is a separate component. Let's just pass a prop to HeroSection or leave it. We need to modify HeroSection.tsx to accept an optional prop for CTA link.
// Instead of modifying HeroSection.tsx right here, I'll do it separately.
// For the fleet pricing "Book Now" buttons, change href to tel: or wa.me
content = content.replace(/href="#booking-form"/g, 'href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"');
content = content.replace(/>\s*Book Now\s*<\/a>/g, '>Contact Us</a>');
content = content.replace(/>\s*Request Quote\s*<\/a>/g, '>Contact Us</a>');

fs.writeFileSync(filePath, content);
console.log('Homepage updated');
