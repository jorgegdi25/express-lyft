import fs from 'fs';
const content = fs.readFileSync('app/page.tsx', 'utf8');
if (content.includes('BookingForm')) {
  console.log("BookingForm still present");
} else {
  console.log("BookingForm removed");
}
