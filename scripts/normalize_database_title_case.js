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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key in environment.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function formatTitleCase(str) {
    if (!str) return str;
    
    const UPPERCASE_TOKENS = new Set([
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
        'DC', 'US', 'USA', 'PO', 'P.O.', 'NW', 'NE', 'SW', 'SE', 'LLC', 'INC', 'LTD'
    ]);

    return str
        .split('\n')
        .map(line => {
            return line
                .split(' ')
                .map(word => {
                    if (!word) return '';
                    const cleanWord = word.replace(/^[^\w]+|[^\w]+$/g, '').toUpperCase();
                    if (UPPERCASE_TOKENS.has(cleanWord)) {
                        return word.replace(new RegExp(cleanWord, 'i'), cleanWord);
                    }
                    if (word.includes('-')) {
                        return word
                            .split('-')
                            .map(part => part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : '')
                            .join('-');
                    }
                    const firstCharIdx = word.search(/[a-zA-Z]/);
                    if (firstCharIdx === -1) return word;
                    const prefix = word.slice(0, firstCharIdx);
                    const letter = word.charAt(firstCharIdx).toUpperCase();
                    const remainder = word.slice(firstCharIdx + 1).toLowerCase();
                    return prefix + letter + remainder;
                })
                .join(' ');
        })
        .join('\n');
}

async function run() {
    console.log('Fetching outreach_leads...');
    const { data: leads, error: leadsErr } = await supabase.from('outreach_leads').select('*');
    if (leadsErr) {
        console.error('Error fetching leads:', leadsErr);
    } else {
        console.log(`Processing ${leads.length} leads...`);
        let updatedLeads = 0;
        for (const lead of leads) {
            const updates = {};
            if (lead.company_name) {
                const formatted = formatTitleCase(lead.company_name);
                if (formatted !== lead.company_name) updates.company_name = formatted;
            }
            if (lead.home_base) {
                const formatted = formatTitleCase(lead.home_base);
                if (formatted !== lead.home_base) updates.home_base = formatted;
            }
            if (lead.state && lead.state.length === 2 && lead.state !== lead.state.toUpperCase()) {
                updates.state = lead.state.toUpperCase();
            }
            if (lead.mailing_address) {
                const formatted = formatTitleCase(lead.mailing_address);
                if (formatted !== lead.mailing_address) updates.mailing_address = formatted;
            }
            if (lead.contact_name) {
                const formatted = formatTitleCase(lead.contact_name);
                if (formatted !== lead.contact_name) updates.contact_name = formatted;
            }

            if (Object.keys(updates).length > 0) {
                const { error: updErr } = await supabase.from('outreach_leads').update(updates).eq('id', lead.id);
                if (updErr) {
                    console.error(`Failed to update lead ${lead.id}:`, updErr.message);
                } else {
                    updatedLeads++;
                }
            }
        }
        console.log(`Updated ${updatedLeads} leads.`);
    }

    console.log('Fetching tour_companies...');
    const { data: companies, error: compErr } = await supabase.from('tour_companies').select('*');
    if (compErr) {
        console.error('Error fetching companies:', compErr);
    } else {
        console.log(`Processing ${companies.length} companies...`);
        let updatedComp = 0;
        for (const comp of companies) {
            const updates = {};
            if (comp.name) {
                const formatted = formatTitleCase(comp.name);
                if (formatted !== comp.name) updates.name = formatted;
            }
            if (comp.representative_name) {
                const formatted = formatTitleCase(comp.representative_name);
                if (formatted !== comp.representative_name) updates.representative_name = formatted;
            }
            if (comp.mailing_address) {
                const formatted = formatTitleCase(comp.mailing_address);
                if (formatted !== comp.mailing_address) updates.mailing_address = formatted;
            }

            if (Object.keys(updates).length > 0) {
                const { error: updErr } = await supabase.from('tour_companies').update(updates).eq('id', comp.id);
                if (updErr) {
                    console.error(`Failed to update company ${comp.id}:`, updErr.message);
                } else {
                    updatedComp++;
                }
            }
        }
        console.log(`Updated ${updatedComp} companies.`);
    }

    console.log('Title Case normalization complete!');
}

run().catch(console.error);
