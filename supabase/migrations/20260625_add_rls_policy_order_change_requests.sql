-- Add SELECT policy for order_change_requests table
DROP POLICY IF EXISTS "Companies can view their own order change requests" ON order_change_requests;
CREATE POLICY "Companies can view their own order change requests" ON order_change_requests
    FOR SELECT USING (
        (company_id = (((auth.jwt() -> 'user_metadata'::text) ->> 'company_id'::text))::uuid)
        OR (((auth.jwt() -> 'user_metadata'::text) ->> 'role'::text) = 'admin'::text)
    );
