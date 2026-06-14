// Run this script to create the outreach_leads table in Supabase
// Usage: node scripts/apply_outreach_migration.js

const https = require('https');

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_ID = 'annrpkzwsghiwwkxqdxv';

const queries = [
    `CREATE TABLE IF NOT EXISTS outreach_leads (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        company_name TEXT NOT NULL,
        phone TEXT,
        email TEXT NOT NULL,
        website TEXT,
        home_base TEXT,
        state TEXT,
        primary_gate TEXT,
        tour_type TEXT,
        season TEXT,
        status TEXT NOT NULL DEFAULT 'not_contacted'
            CHECK (status IN ('not_contacted', 'emailed', 'responded', 'converted', 'rejected')),
        last_contacted_at TIMESTAMPTZ,
        follow_up_date DATE,
        notes TEXT,
        partnership_notes TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_outreach_leads_status ON outreach_leads(status)`,
    `CREATE INDEX IF NOT EXISTS idx_outreach_leads_email ON outreach_leads(email)`,
    `DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_outreach_leads_updated_at') THEN
            CREATE TRIGGER update_outreach_leads_updated_at
                BEFORE UPDATE ON outreach_leads
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        END IF;
    END $$`,
    `ALTER TABLE outreach_leads ENABLE ROW LEVEL SECURITY`,
];

async function runQuery(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_ID}/database/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const preview = sql.replace(/\s+/g, ' ').substring(0, 70);
                console.log(`[${res.statusCode}] ${preview}...`);
                if (res.statusCode >= 400) console.log('  Response:', data);
                resolve(res.statusCode);
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

(async () => {
    console.log('Running outreach_leads migration...\n');
    for (const q of queries) {
        await runQuery(q);
    }
    console.log('\nDone! The outreach_leads table has been created.');
})();
