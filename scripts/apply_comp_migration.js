// Run this script to add the is_comped column to order_items in Supabase
// Usage: SUPABASE_ACCESS_TOKEN=your_token node scripts/apply_comp_migration.js

const https = require('https');

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_ID = 'annrpkzwsghiwwkxqdxv';

const queries = [
    'ALTER TABLE order_items ADD COLUMN IF NOT EXISTS is_comped BOOLEAN NOT NULL DEFAULT false;'
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
    console.log('Running comp migration...\n');
    for (const q of queries) {
        await runQuery(q);
    }
    console.log('\nDone! The is_comped column has been added to order_items.');
})();
