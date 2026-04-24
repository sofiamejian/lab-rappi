-- 1. Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Fix the status column: Convert to TEXT to avoid ENUM restrictions as per reqs.html
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'status') THEN
        -- Convert existing column to TEXT
        ALTER TABLE orders ALTER COLUMN status TYPE TEXT USING status::text;
        ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'Creado';
    ELSE
        -- Create column if it doesn't exist
        ALTER TABLE orders ADD COLUMN status TEXT NOT NULL DEFAULT 'Creado';
    END IF;
END $$;

-- 3. Add PostGIS columns
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_position GEOGRAPHY(POINT, 4326);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS destination GEOGRAPHY(POINT, 4326);

-- 4. Ensure delivery_id column exists
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_id UUID REFERENCES users(id);

-- 5. Create/Update RPC for updating position and checking arrival
CREATE OR REPLACE FUNCTION check_arrival_and_update_position(
  p_order_id UUID,
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_threshold DOUBLE PRECISION DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_arrived BOOLEAN;
  v_order RECORD;
BEGIN
  -- Update the position
  UPDATE orders
  SET delivery_position = ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)
  WHERE id = p_order_id;

  -- Check if arrived (distance between delivery_position and destination < threshold)
  SELECT 
    ST_DWithin(delivery_position, destination, p_threshold) as arrived
  INTO v_arrived
  FROM orders
  WHERE id = p_order_id;

  -- If arrived, update status to 'Entregado'
  IF v_arrived THEN
    UPDATE orders
    SET status = 'Entregado'
    WHERE id = p_order_id;
  END IF;

  -- Get updated order
  SELECT * INTO v_order FROM orders WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'arrived', COALESCE(v_arrived, FALSE),
    'order', row_to_json(v_order)
  );
END;
$$;
