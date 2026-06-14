require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const c = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function migrate() {
    // Migration 1: Add discount_percentage to tour_companies
    const r1 = await c.rpc('exec_sql', {
        query: "ALTER TABLE tour_companies ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0"
    });
    console.log('tour_companies migration:', JSON.stringify(r1));

    // Migration 2: Add discount columns to invoices
    const r2 = await c.rpc('exec_sql', {
        query: "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0"
    });
    console.log('invoices discount_percentage:', JSON.stringify(r2));

    const r3 = await c.rpc('exec_sql', {
        query: "ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0"
    });
    console.log('invoices discount_amount:', JSON.stringify(r3));
}

migrate().catch(console.error);
