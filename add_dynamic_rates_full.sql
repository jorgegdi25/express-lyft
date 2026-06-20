ALTER TABLE pricing 
ADD COLUMN IF NOT EXISTS price_per_minute NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS min_price NUMERIC(10, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS max_price NUMERIC(10, 2) DEFAULT 9999.00,
ADD COLUMN IF NOT EXISTS multiplier NUMERIC(5, 2) DEFAULT 1.00;

UPDATE pricing SET 
  price_per_minute = 0.30, min_price = 15.00, max_price = 120.00 
WHERE vehicle_type = 'sedan_suv';

UPDATE pricing SET 
  price_per_minute = 0.40, min_price = 25.00, max_price = 150.00 
WHERE vehicle_type = 'suburban';

UPDATE pricing SET 
  price_per_minute = 0.50, min_price = 50.00, max_price = 260.00 
WHERE vehicle_type = 'sprinter';

UPDATE pricing SET 
  price_per_minute = 0.70, min_price = 100.00, max_price = 450.00 
WHERE vehicle_type = 'minibus';

UPDATE pricing SET 
  price_per_minute = 1.00, min_price = 200.00, max_price = 800.00 
WHERE vehicle_type = 'coachbus';
