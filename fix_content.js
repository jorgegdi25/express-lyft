const fs = require('fs');
let content = fs.readFileSync('app/hotel/[slug]/page.tsx', 'utf8');

// Replace Phone Numbers
content = content.replace(/8889300064/g, '8889737896');
content = content.replace(/888\)\ 930\-0064/g, '888) 973-7896');
content = content.replace(/3057994420/g, '9546236207');
content = content.replace(/305\-799\-4420/g, '954-623-6207');

// Replace Miami with Florida in those specific strings
content = content.replace(/Miami&apos;s most trusted/g, 'Florida&apos;s most trusted');
content = content.replace(/Miami&apos;s most discerning/g, 'Florida&apos;s most discerning');

// Replace Stats
content = content.replace(/{ stat: '4', label: 'Pickup Destinations' }/, "{ stat: '37', label: 'Pickup Destinations' }");
content = content.replace(/{ stat: '55', label: 'Max Passengers' }/, "{ stat: '100+', label: 'Max Passengers' }");

// Replace Disclaimer (Make it bold and bigger)
content = content.replace(
  /<p className="text-xs leading-relaxed" style={{ color: '#555555' }}>\n\s*ExpLyft is an independent transportation service and is not affiliated with Lyft, Inc.\n\s*<\/p>/,
  `<p className="text-sm font-bold leading-relaxed" style={{ color: '#888888' }}>
                ExpLyft is an independent transportation service and is not affiliated with Lyft, Inc.
              </p>`
);

fs.writeFileSync('app/hotel/[slug]/page.tsx', content);

// Also do Privacy Policy and Emails for phone numbers
let privacy = fs.readFileSync('app/privacy/page.tsx', 'utf8');
privacy = privacy.replace(/8889300064/g, '8889737896');
privacy = privacy.replace(/888\)\ 930\-0064/g, '888) 973-7896');
fs.writeFileSync('app/privacy/page.tsx', privacy);

let email = fs.readFileSync('emails/ConfirmationEmail.tsx', 'utf8');
email = email.replace(/8889300064/g, '8889737896');
email = email.replace(/888\)\ 930\-0064/g, '888) 973-7896');
email = email.replace(/3057994420/g, '9546236207');
email = email.replace(/305\-799\-4420/g, '954-623-6207');
fs.writeFileSync('emails/ConfirmationEmail.tsx', email);

console.log("Done");
