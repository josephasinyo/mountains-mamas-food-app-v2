-- Alter order_change_requests type check constraint to include 'cancel'
ALTER TABLE order_change_requests DROP CONSTRAINT IF EXISTS order_change_requests_type_check;
ALTER TABLE order_change_requests ADD CONSTRAINT order_change_requests_type_check CHECK (type IN ('update', 'delete', 'cancel'));
