#!/bin/bash
set -e

echo "Backing up dynamic routes..."
mv app/hotel app/hotel_bak
mv app/promo app/promo_bak
mv app/api app/api_bak
mv app/admin app/admin_bak

echo "Removing dynamic from page.tsx..."
sed -i '' "s/export const dynamic = 'force-dynamic'//g" app/page.tsx
sed -i '' "s/export const revalidate = 0//g" app/page.tsx
sed -i '' "s/export const fetchCache = 'force-no-store'//g" app/page.tsx

echo "Updating next.config.mjs to export..."
sed -i '' "s/output: 'standalone'/output: 'export'/g" next.config.mjs

echo "Building static export..."
npx next build

echo "Zipping the output..."
cd out
zip -r ../explyft_static.zip .
cd ..

echo "Restoring everything..."
mv app/hotel_bak app/hotel
mv app/promo_bak app/promo
mv app/api_bak app/api
mv app/admin_bak app/admin

git checkout app/page.tsx
git checkout next.config.mjs

echo "Done! The zip file is explyft_static.zip"
