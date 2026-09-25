const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Read .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (!process.env[key]) process.env[key] = val;
        }
    }
}

const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';
const PROJECT_ID = 'annrpkzwsghiwwkxqdxv';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in environment.');
    process.exit(1);
}

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
                resolve({ status: res.statusCode, body: data });
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('Deactivating non-lunch meals in company_menu_selections...');
    const query = `
        UPDATE company_menu_selections
        SET is_selected = false
        WHERE meal_id IN (
            SELECT id FROM meals WHERE meal_type IS NOT NULL AND meal_type != 'lunch'
        );
    `;
    const res = await runQuery(query);
    console.log('Query finished with status:', res.status);
}

main().catch(console.error);
