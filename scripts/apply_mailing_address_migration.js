// Run this script to add the mailing_address column to outreach_leads in Supabase
// Usage: SUPABASE_ACCESS_TOKEN=your_token node scripts/apply_mailing_address_migration.js

const https = require('https');

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_ID = 'annrpkzwsghiwwkxqdxv';

const queries = [
    'ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS mailing_address TEXT;'
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
    if (!TOKEN) {
        console.error('Error: SUPABASE_ACCESS_TOKEN is required to run this script directly.');
        console.log('Alternatively, you can run the SQL query in the Supabase SQL Editor:');
        console.log('ALTER TABLE outreach_leads ADD COLUMN IF NOT EXISTS mailing_address TEXT;');
        process.exit(1);
    }
    console.log('Running mailing_address migration...\n');
    for (const q of queries) {
        await runQuery(q);
    }
    console.log('\nDone! The mailing_address column has been added to outreach_leads.');
})();
