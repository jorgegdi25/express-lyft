ALTER TABLE pricing ADD COLUMN IF NOT EXISTS price_per_mile NUMERIC(10, 2) DEFAULT 0.00;

UPDATE pricing SET price_per_mile = 3.50 WHERE vehicle_type = 'sedan_suv';
UPDATE pricing SET price_per_mile = 5.00 WHERE vehicle_type = 'suburban';
UPDATE pricing SET price_per_mile = 6.00 WHERE vehicle_type = 'sprinter';
UPDATE pricing SET price_per_mile = 8.00 WHERE vehicle_type = 'minibus';
UPDATE pricing SET price_per_mile = 10.00 WHERE vehicle_type = 'coachbus';
