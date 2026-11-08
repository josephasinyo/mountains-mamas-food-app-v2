const https = require('https');
const { createClient } = require('@supabase/supabase-js');
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
const DEFAULT_INSTRUCTIONS = "Wrap lunches individually in brown paper bags. Group all vegan orders in a separate cooler box. Add extra napkins.";

async function runSqlQuery(sql) {
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
                console.log(`[HTTP ${res.statusCode}] SQL Query: ${sql.substring(0, 80)}...`);
                if (res.statusCode >= 400) {
                    console.error('Response error:', data);
                    resolve({ success: false, status: res.statusCode, error: data });
                } else {
                    resolve({ success: true, status: res.statusCode, data });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('--- Setting Database Column Default ---');
    const alterQuery = `ALTER TABLE tour_companies ALTER COLUMN prep_instructions SET DEFAULT '${DEFAULT_INSTRUCTIONS.replace(/'/g, "''")}';`;
    const alterRes = await runSqlQuery(alterQuery);
    console.log('Alter Column Result:', alterRes.success ? 'SUCCESS' : 'FAILED');

    console.log('\n--- Updating Existing Companies via Supabase Client ---');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: companies, error: fetchErr } = await supabase
        .from('tour_companies')
        .select('id, name, prep_instructions');

    if (fetchErr) {
        console.error('Fetch error:', fetchErr);
        return;
    }

    console.log(`Found ${companies.length} total companies.`);
    let updatedCount = 0;
    for (const c of companies) {
        if (!c.prep_instructions || c.prep_instructions.trim() === '') {
            console.log(`Updating "${c.name}" (${c.id}) with default prep instructions...`);
            const { error: updateErr } = await supabase
                .from('tour_companies')
                .update({ prep_instructions: DEFAULT_INSTRUCTIONS })
                .eq('id', c.id);
            if (updateErr) {
                console.error(`Error updating "${c.name}":`, updateErr);
            } else {
                updatedCount++;
            }
        } else {
            console.log(`Skipping "${c.name}" - already has custom prep instructions: "${c.prep_instructions.substring(0, 40)}..."`);
        }
    }

    console.log(`\nFinished! Updated ${updatedCount} companies.`);
}

main().catch(console.error);

