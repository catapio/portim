CREATE OR REPLACE FUNCTION generate_hex_object_id()
RETURNS TEXT AS $$
DECLARE
    -- Timestamp in seconds since Unix epoch
    timestamp_part TEXT;
    
    -- 5-byte random value
    random_part TEXT;
    
    -- 3-byte incrementing counter
    counter_part TEXT;
    
    -- Persistent counter variable
    counter_value BIGINT;
BEGIN
    -- Generate timestamp (4 bytes, 8 hex characters)
    timestamp_part := LPAD(TO_HEX(EXTRACT(EPOCH FROM clock_timestamp())::BIGINT), 8, '0');

    -- Generate a 5-byte (10 hex characters) random value
    random_part := LPAD(
        TO_HEX((random() * 256 * 256 * 256 * 256 * 256)::BIGINT), 
        10, 
        '0'
    );

    -- Use a persistent counter sequence for the 3-byte incrementing counter
    PERFORM pg_try_advisory_lock(1); -- Ensure thread-safe initialization
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'object_id_counter') THEN
        -- Create sequence with default start
        EXECUTE 'CREATE SEQUENCE object_id_counter MINVALUE 0 MAXVALUE 16777215';

        -- Restart sequence with a random value
        EXECUTE 'ALTER SEQUENCE object_id_counter RESTART WITH ' || ((random() * 16777216)::BIGINT);
    END IF;
    PERFORM pg_advisory_unlock(1);

    -- Fetch the next value from the sequence and wrap around after 3 bytes (24 bits)
    counter_value := NEXTVAL('object_id_counter');
    IF counter_value >= 16777216 THEN -- If maximum is reached, reset the sequence
        PERFORM pg_try_advisory_lock(1); -- Lock to avoid race conditions
        EXECUTE 'ALTER SEQUENCE object_id_counter RESTART WITH ' || ((random() * 16777216)::BIGINT);
        counter_value := NEXTVAL('object_id_counter');
        PERFORM pg_advisory_unlock(1);
    END IF;
    counter_part := LPAD(TO_HEX(counter_value), 6, '0');

    -- Combine all parts into a single hexadecimal string
    RETURN timestamp_part || random_part || counter_part;
END;
$$ LANGUAGE plpgsql;

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL DEFAULT generate_hex_object_id(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "owner_id" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);
