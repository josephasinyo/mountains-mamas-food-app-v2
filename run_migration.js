// Run this script to apply the discount migration to Supabase
// Usage: node run_migration.js

const https = require('https');

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_ID = 'annrpkzwsghiwwkxqdxv';

const queries = [
    'ALTER TABLE tour_companies ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) NOT NULL DEFAULT 0',
    'ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0',
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
                console.log(`[${res.statusCode}] ${sql.substring(0, 60)}...`);
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
    console.log('Running discount migration...\n');
    for (const q of queries) {
        await runQuery(q);
    }
    console.log('\nDone! You can delete this file.');
})();
