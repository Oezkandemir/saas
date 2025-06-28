-- Check if the notification_type enum exists
DO $$
BEGIN
    -- Check if the column exists and is of type enum
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'user_notifications'
        AND column_name = 'type'
        AND data_type = 'USER-DEFINED'
    ) THEN
        -- Add NEWSLETTER type if it doesn't exist in the enum
        IF NOT EXISTS (
            SELECT 1
            FROM pg_type t
            JOIN pg_enum e ON t.oid = e.enumtypid
            WHERE t.typname = 'notification_type'
            AND e.enumlabel = 'NEWSLETTER'
        ) THEN
            ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'NEWSLETTER';
        END IF;
    END IF;
END
$$; 