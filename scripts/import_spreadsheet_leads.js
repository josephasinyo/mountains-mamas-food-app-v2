require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importLeads() {
    const tsvPath = path.join(__dirname, 'new_leads_data.tsv');
    if (!fs.existsSync(tsvPath)) {
        console.error(`Error: TSV file not found at ${tsvPath}`);
        return;
    }

    console.log('Reading TSV file...');
    const content = fs.readFileSync(tsvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
        console.error('Error: TSV must contain headers and at least one data row.');
        return;
    }

    const rawHeaders = lines[0].split('\t');
    const headers = rawHeaders.map(h => h.trim());
    console.log(`Parsed ${headers.length} headers:`, headers);

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split('\t');
        const lead = {};
        
        headers.forEach((header, idx) => {
            lead[header] = row[idx] ? row[idx].trim() : '';
        });

        // Skip rows without company name
        if (!lead['Company']) {
            console.log(`[Line ${i + 1}] Skipping: Missing Company Name`);
            skippedCount++;
            continue;
        }

        // Determine target email: Direct Email first, General Email second
        const directEmail = lead['Direct Email'] || '';
        const generalEmail = lead['General Email'] || '';
        const targetEmail = directEmail || generalEmail;

        if (!targetEmail) {
            console.log(`[Line ${i + 1}] Skipping company "${lead['Company']}": No email found`);
            skippedCount++;
            continue;
        }

        const normalizedEmail = targetEmail.toLowerCase();

        // Check for existing lead by email to prevent duplicates
        const { data: existing, error: fetchError } = await supabase
            .from('outreach_leads')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (fetchError) {
            console.error(`[Line ${i + 1}] Error checking duplicate for "${lead['Company']}":`, fetchError.message);
            errorCount++;
            continue;
        }

        if (existing) {
            console.log(`[Line ${i + 1}] Skipping "${lead['Company']}": Duplicate email "${normalizedEmail}" already exists`);
            skippedCount++;
            continue;
        }

        // Consolidate columns that are NOT added as table columns into the notes field
        const notesParts = [];
        if (lead['Notes']) {
            notesParts.push(lead['Notes']);
        }

        const metaParts = [];
        if (lead['Research Batch']) metaParts.push(`Research Batch: ${lead['Research Batch']}`);
        if (directEmail && directEmail.toLowerCase() !== normalizedEmail) metaParts.push(`Direct Email: ${directEmail}`);
        if (generalEmail && generalEmail.toLowerCase() !== normalizedEmail) metaParts.push(`General Email: ${generalEmail}`);
        if (lead['Verification Status']) metaParts.push(`Verification Status: ${lead['Verification Status']}`);
        if (lead['Next Step']) metaParts.push(`Next Step: ${lead['Next Step']}`);
        if (lead['Source URL']) metaParts.push(`Source URL: ${lead['Source URL']}`);

        if (metaParts.length > 0) {
            notesParts.push(`---\n` + metaParts.join('\n'));
        }
        const consolidatedNotes = notesParts.join('\n\n');

        // Prepare insert payload
        const payload = {
            company_name: lead['Company'],
            email: normalizedEmail,
            phone: lead['Phone'] || null,
            website: lead['Website'] || null,
            home_base: lead['City'] || null,
            state: lead['State'] || null,
            tour_type: lead['Tour Category'] || null,
            notes: consolidatedNotes || null,
            outreach_tier: lead['Outreach Tier'] || null,
            priority: lead['Priority'] || null,
            contact_name: lead['Contact Name'] || null,
            title: lead['Title'] || null,
            average_group_size: lead['Average Group Size'] ? parseInt(lead['Average Group Size'], 10) : null,
            estimated_annual_yellowstone_guests: lead['Estimated Annual Yellowstone Guests'] ? parseInt(lead['Estimated Annual Yellowstone Guests'], 10) : null,
            status: 'not_contacted',
        };

        const { error: insertError } = await supabase
            .from('outreach_leads')
            .insert(payload);

        if (insertError) {
            console.error(`[Line ${i + 1}] Error inserting "${lead['Company']}":`, insertError.message);
            errorCount++;
        } else {
            console.log(`[Line ${i + 1}] Successfully imported: "${lead['Company']}" (${normalizedEmail})`);
            importedCount++;
        }
    }

    console.log('\n--- Import Summary ---');
    console.log(`Successfully imported: ${importedCount}`);
    console.log(`Skipped (duplicates/empty): ${skippedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
}

importLeads().catch(console.error);
