'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { sendEmail, sendInvitationEmail } from '@/lib/brevo';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// ---- Types ----
interface OutreachLead {
    id?: string;
    company_name: string;
    phone?: string;
    email: string;
    website?: string;
    home_base?: string;
    state?: string;
    primary_gate?: string;
    tour_type?: string;
    season?: string;
    status?: string;
    notes?: string;
    partnership_notes?: string;
    outreach_tier?: string;
    priority?: string;
    contact_name?: string;
    title?: string;
    average_group_size?: number;
    estimated_annual_yellowstone_guests?: number;
}

// ---- Helpers ----
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

const logFile = path.join(process.cwd(), 'email-debug.log');
function log(msg: string) {
    const timestamp = new Date().toISOString();
    try {
        fs.appendFileSync(logFile, `[${timestamp}] [Outreach] ${msg}\n`);
    } catch (e) {}
}

// ---- Column Mapping for CSV Import ----
const COLUMN_MAP: Record<string, string> = {
    // company_name
    'company name': 'company_name',
    'company': 'company_name',
    'name': 'company_name',
    'business name': 'company_name',
    'tour company': 'company_name',
    // phone
    'phone': 'phone',
    'phone number': 'phone',
    'telephone': 'phone',
    // email
    'email': 'email',
    'email address': 'email',
    'e-mail': 'email',
    // website
    'website': 'website',
    'url': 'website',
    'web': 'website',
    'site': 'website',
    // home_base
    'home base': 'home_base',
    'homebase': 'home_base',
    'location': 'home_base',
    'city': 'home_base',
    'base': 'home_base',
    // state
    'state': 'state',
    'st': 'state',
    // primary_gate
    'primary gate': 'primary_gate',
    'gate': 'primary_gate',
    // tour_type
    'tour type': 'tour_type',
    'type': 'tour_type',
    'tour category': 'tour_type',
    'category': 'tour_type',
    // season
    'season': 'season',
    // partnership_notes
    'partnership notes': 'partnership_notes',
    'notes': 'partnership_notes',
    'partner notes': 'partnership_notes',
    // outreach_tier
    'outreach tier': 'outreach_tier',
    'tier': 'outreach_tier',
    // priority
    'priority': 'priority',
    // contact_name
    'contact name': 'contact_name',
    'contact': 'contact_name',
    // title
    'title': 'title',
    'contact title': 'title',
    // average_group_size
    'average group size': 'average_group_size',
    'group size': 'average_group_size',
    'avg group size': 'average_group_size',
    // estimated_annual_yellowstone_guests
    'estimated annual yellowstone guests': 'estimated_annual_yellowstone_guests',
    'annual guests': 'estimated_annual_yellowstone_guests',
    'estimated guests': 'estimated_annual_yellowstone_guests',

    // Temporary mappings for columns that are NOT added to the database table
    'direct email': 'temp_direct_email',
    'general email': 'temp_general_email',
    'research batch': 'temp_research_batch',
    'source url': 'temp_source_url',
    'verification status': 'temp_verification_status',
    'next step': 'temp_next_step',
};

function mapHeaders(rawHeaders: string[]): Record<string, string> {
    const mapping: Record<string, string> = {};
    for (const header of rawHeaders) {
        const normalized = header.toLowerCase().trim();
        if (COLUMN_MAP[normalized]) {
            mapping[header] = COLUMN_MAP[normalized];
        }
    }
    return mapping;
}

// ============================================================
// ACTION: Fetch all outreach leads
// ============================================================
export async function fetchOutreachLeads() {
    const supabase = createAdminClient();
    const { data, error } = await supabase
        .from('outreach_leads')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        return { success: false, error: error.message, data: [] };
    }
    return { success: true, data: data || [] };
}

// ============================================================
// ACTION: Import leads from parsed CSV rows
// ============================================================
export async function importLeadsFromCSV(headers: string[], rows: string[][]) {
    const supabase = createAdminClient();
    const headerMap = mapHeaders(headers);

    log(`CSV Import: ${rows.length} rows, headers mapped: ${JSON.stringify(headerMap)}`);

    // Validate that we have at minimum company_name and either email, temp_direct_email or temp_general_email mapped
    const mappedFields = Object.values(headerMap);
    const hasEmail = mappedFields.includes('email') || mappedFields.includes('temp_direct_email') || mappedFields.includes('temp_general_email');
    if (!mappedFields.includes('company_name') || !hasEmail) {
        return {
            success: false,
            error: 'CSV must contain at least "Company Name" and an "Email" column.',
            imported: 0,
            skipped: 0,
        };
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
        const lead: Record<string, string> = {};
        headers.forEach((header, idx) => {
            const field = headerMap[header];
            if (field && row[idx]) {
                lead[field] = row[idx].trim();
            }
        });

        const directEmail = lead.temp_direct_email || '';
        const generalEmail = lead.temp_general_email || '';
        const emailVal = lead.email || directEmail || generalEmail;

        if (!lead.company_name || !emailVal) {
            skipped++;
            continue;
        }

        const normalizedEmail = emailVal.toLowerCase().trim();

        // Check for duplicate by email address
        const { data: existing } = await supabase
            .from('outreach_leads')
            .select('id')
            .eq('email', normalizedEmail)
            .maybeSingle();

        if (existing) {
            skipped++;
            continue;
        }

        // Construct notes from notes + temporary fields
        let notesParts: string[] = [];
        if (lead.notes) notesParts.push(lead.notes);
        if (lead.partnership_notes) notesParts.push(lead.partnership_notes);

        let metaParts: string[] = [];
        if (lead.temp_research_batch) metaParts.push(`Research Batch: ${lead.temp_research_batch}`);
        if (directEmail && directEmail.toLowerCase().trim() !== normalizedEmail) metaParts.push(`Direct Email: ${directEmail}`);
        if (generalEmail && generalEmail.toLowerCase().trim() !== normalizedEmail) metaParts.push(`General Email: ${generalEmail}`);
        if (lead.temp_verification_status) metaParts.push(`Verification Status: ${lead.temp_verification_status}`);
        if (lead.temp_next_step) metaParts.push(`Next Step: ${lead.temp_next_step}`);
        if (lead.temp_source_url) metaParts.push(`Source URL: ${lead.temp_source_url}`);

        if (metaParts.length > 0) {
            notesParts.push(`---\n` + metaParts.join('\n'));
        }
        const finalNotes = notesParts.join('\n\n');

        const { error } = await supabase.from('outreach_leads').insert({
            company_name: lead.company_name,
            phone: lead.phone || null,
            email: normalizedEmail,
            website: lead.website || null,
            home_base: lead.home_base || null,
            state: lead.state || null,
            primary_gate: lead.primary_gate || null,
            tour_type: lead.tour_type || null,
            season: lead.season || null,
            notes: finalNotes || null,
            partnership_notes: lead.partnership_notes || null,
            outreach_tier: lead.outreach_tier || null,
            priority: lead.priority || null,
            contact_name: lead.contact_name || null,
            title: lead.title || null,
            average_group_size: lead.average_group_size ? parseInt(lead.average_group_size, 10) : null,
            estimated_annual_yellowstone_guests: lead.estimated_annual_yellowstone_guests ? parseInt(lead.estimated_annual_yellowstone_guests, 10) : null,
            status: 'not_contacted',
        });

        if (error) {
            errors.push(`${lead.company_name}: ${error.message}`);
            skipped++;
        } else {
            imported++;
        }
    }

    log(`CSV Import complete: ${imported} imported, ${skipped} skipped`);

    await logActivity({
        userRole: 'admin',
        action: 'outreach_csv_imported',
        entityType: 'company',
        details: { imported, skipped, total_rows: rows.length },
    });

    return {
        success: true,
        imported,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
    };
}

// ============================================================
// ACTION: Create a single lead manually
// ============================================================
export async function createOutreachLead(leadData: {
    company_name: string;
    email: string;
    phone?: string;
    website?: string;
    home_base?: string;
    state?: string;
    primary_gate?: string;
    tour_type?: string;
    season?: string;
    notes?: string;
    partnership_notes?: string;
    outreach_tier?: string;
    priority?: string;
    contact_name?: string;
    title?: string;
    average_group_size?: number;
    estimated_annual_yellowstone_guests?: number;
}) {
    const supabase = createAdminClient();

    if (!leadData.company_name || !leadData.email) {
        return { success: false, error: 'Company name and email are required.' };
    }

    const normalizedEmail = leadData.email.toLowerCase().trim();

    // Check for duplicate by email address
    const { data: existing } = await supabase
        .from('outreach_leads')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

    if (existing) {
        return { success: false, error: 'A lead with this email address already exists.' };
    }

    const { data, error } = await supabase
        .from('outreach_leads')
        .insert({
            company_name: leadData.company_name,
            email: normalizedEmail,
            phone: leadData.phone || null,
            website: leadData.website || null,
            home_base: leadData.home_base || null,
            state: leadData.state || null,
            primary_gate: leadData.primary_gate || null,
            tour_type: leadData.tour_type || null,
            season: leadData.season || null,
            notes: leadData.notes || null,
            partnership_notes: leadData.partnership_notes || null,
            outreach_tier: leadData.outreach_tier || null,
            priority: leadData.priority || null,
            contact_name: leadData.contact_name || null,
            title: leadData.title || null,
            average_group_size: leadData.average_group_size || null,
            estimated_annual_yellowstone_guests: leadData.estimated_annual_yellowstone_guests || null,
            status: 'not_contacted',
        })
        .select('*')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    log(`Lead created manually: ${leadData.company_name} (${leadData.email})`);

    await logActivity({
        userRole: 'admin',
        action: 'outreach_lead_created',
        entityType: 'company',
        details: { name: leadData.company_name, email: leadData.email },
    });

    return { success: true, data };
}

// ============================================================
// ACTION: Update a lead's full details
// ============================================================
export async function updateOutreachLead(leadId: string, leadData: {
    company_name?: string;
    email?: string;
    phone?: string;
    website?: string;
    home_base?: string;
    state?: string;
    primary_gate?: string;
    tour_type?: string;
    season?: string;
    notes?: string;
    partnership_notes?: string;
    outreach_tier?: string;
    priority?: string;
    contact_name?: string;
    title?: string;
    average_group_size?: number;
    estimated_annual_yellowstone_guests?: number;
}) {
    const supabase = createAdminClient();

    // Build update object, only including non-undefined fields
    const updates: Record<string, any> = {};
    if (leadData.company_name !== undefined) updates.company_name = leadData.company_name;
    if (leadData.email !== undefined) updates.email = leadData.email;
    if (leadData.phone !== undefined) updates.phone = leadData.phone || null;
    if (leadData.website !== undefined) updates.website = leadData.website || null;
    if (leadData.home_base !== undefined) updates.home_base = leadData.home_base || null;
    if (leadData.state !== undefined) updates.state = leadData.state || null;
    if (leadData.primary_gate !== undefined) updates.primary_gate = leadData.primary_gate || null;
    if (leadData.tour_type !== undefined) updates.tour_type = leadData.tour_type || null;
    if (leadData.season !== undefined) updates.season = leadData.season || null;
    if (leadData.notes !== undefined) updates.notes = leadData.notes || null;
    if (leadData.partnership_notes !== undefined) updates.partnership_notes = leadData.partnership_notes || null;
    if (leadData.outreach_tier !== undefined) updates.outreach_tier = leadData.outreach_tier || null;
    if (leadData.priority !== undefined) updates.priority = leadData.priority || null;
    if (leadData.contact_name !== undefined) updates.contact_name = leadData.contact_name || null;
    if (leadData.title !== undefined) updates.title = leadData.title || null;
    if (leadData.average_group_size !== undefined) updates.average_group_size = leadData.average_group_size || null;
    if (leadData.estimated_annual_yellowstone_guests !== undefined) updates.estimated_annual_yellowstone_guests = leadData.estimated_annual_yellowstone_guests || null;

    if (Object.keys(updates).length === 0) {
        return { success: false, error: 'No fields to update.' };
    }

    const { data, error } = await supabase
        .from('outreach_leads')
        .update(updates)
        .eq('id', leadId)
        .select('*')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    log(`Lead updated: ${data.company_name} (${data.email})`);

    return { success: true, data };
}

// ============================================================
// ACTION: Delete a single lead
// ============================================================
export async function deleteOutreachLead(leadId: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('outreach_leads')
        .delete()
        .eq('id', leadId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ============================================================
// ACTION: Delete multiple leads
// ============================================================
export async function deleteMultipleLeads(leadIds: string[]) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('outreach_leads')
        .delete()
        .in('id', leadIds);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ============================================================
// ACTION: Update lead notes
// ============================================================
export async function updateLeadNotes(leadId: string, notes: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('outreach_leads')
        .update({ notes })
        .eq('id', leadId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ============================================================
// ACTION: Update lead status
// ============================================================
export async function updateLeadStatus(leadId: string, status: string) {
    const supabase = createAdminClient();
    const { error } = await supabase
        .from('outreach_leads')
        .update({ status })
        .eq('id', leadId);

    if (error) return { success: false, error: error.message };
    return { success: true };
}

// ============================================================
// ACTION: Send campaign email to a single lead
// ============================================================
// Helper to remove trailing number labels like "#1", "# 2" etc from company names
function cleanCompanyName(name: string): string {
    if (!name) return '';
    return name.replace(/\s*#\s*\d+\s*$/, '').trim();
}

export async function sendCampaignEmailToLead(leadId: string, templateId: string = 'short_intro') {
    const supabase = createAdminClient();

    // 1. Get lead
    const { data: lead, error: fetchError } = await supabase
        .from('outreach_leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (fetchError || !lead) {
        return { success: false, error: 'Lead not found' };
    }

    const cleanedCompany = cleanCompanyName(lead.company_name);

    log(`Sending campaign email to: ${lead.email} (${cleanedCompany}) using template: ${templateId}`);

    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.mountainmamascoffee.app'}/company/register`;

    const htmlContent = buildCampaignEmailHtml(registrationUrl, cleanedCompany, templateId);

    // Get subject line based on template
    let subject = `Quick question about ${cleanedCompany}'s Yellowstone tour lunches`;
    if (templateId === 'social_proof') {
        subject = `How Yellowstone tour companies are solving the lunch problem`;
    } else if (templateId === 'seasonal_urgency') {
        subject = `⛰️ 2026 Yellowstone season is here - secure your lunch partner spot`;
    } else if (templateId === 'menu_showcase') {
        subject = `🥪 See what ${cleanedCompany}'s guests could be eating on their Yellowstone tour`;
    }

    // Build bcc list including BCC_EMAIL and ADMIN_EMAIL
    const bccList: { email: string; name?: string }[] = [];
    if (process.env.BCC_EMAIL) {
        bccList.push({ email: process.env.BCC_EMAIL });
    }
    if (process.env.ADMIN_EMAIL) {
        bccList.push({ email: process.env.ADMIN_EMAIL, name: "Mountain Mama's Café Admin" });
    }

    // 2. Send via Brevo
    const result = await sendEmail({
        to: [{ email: lead.email, name: cleanedCompany }],
        bcc: bccList.length > 0 ? bccList : undefined,
        subject,
        htmlContent,
    });

    if (!result.success) {
        log(`Campaign email FAILED for ${lead.email}: ${result.error}`);
        return { success: false, error: result.error };
    }

    // 3. Update lead status
    await supabase
        .from('outreach_leads')
        .update({
            status: 'emailed',
            last_contacted_at: new Date().toISOString(),
        })
        .eq('id', leadId);

    log(`Campaign email SUCCESS for ${lead.email} (messageId: ${result.messageId})`);

    return { success: true };
}

// ============================================================
// ACTION: Get Campaign Email Preview HTML
// ============================================================
export async function getCampaignPreviewHtml(companyName: string, templateId: string) {
    const registrationUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.mountainmamascoffee.app'}/company/register`;
    const html = buildCampaignEmailHtml(registrationUrl, companyName, templateId);
    return { success: true, html };
}

// ============================================================
// HTML Email Template switcher
// ============================================================
function buildCampaignEmailHtml(registrationUrl: string, companyName: string = 'your tour group', templateId: string = 'short_intro'): string {
    const cleanCompany = cleanCompanyName(companyName) || 'your tour group';
    
    // The logistics and premium templates have been removed.

    // ---- Template: menu_showcase (Sandwich Showcase) ----
    if (templateId === 'menu_showcase') {
        const appUrl = registrationUrl.replace('/company/register', '');
        const mealsPageUrl = `${appUrl.replace('http://localhost:3000', 'https://mountainmamascafe.app')}`;
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Our Sandwich Selection - Mountain Mama's</title>
    <style>
        @media only screen and (max-width: 480px) {
            .email-container { width: 100% !important; max-width: 100% !important; }
            .mobile-col { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; box-sizing: border-box; }
            .mobile-card { margin-bottom: 16px !important; }
            .mobile-btn { display: block !important; width: 100% !important; text-align: center !important; box-sizing: border-box !important; margin-bottom: 10px !important; }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #faf5ff; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #faf5ff;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #6d28d9, #7c3aed, #a855f7); padding: 36px 28px; text-align: center;">
                            <p style="margin: 0 0 8px 0; color: #e9d5ff; font-size: 12px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">Fresh From Our Kitchen</p>
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 26px; font-weight: 900; line-height: 1.2;">A Taste of What We Offer</h1>
                            <p style="margin: 0; color: #ddd6fe; font-size: 14px; font-weight: 600;">Handcrafted sandwiches your tour guests will love</p>
                        </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                        <td style="padding: 28px 28px 16px 28px;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #111827;">Hi ${cleanCompany} Team,</p>
                            <p style="margin: 0; font-size: 15px; color: #374151; line-height: 1.65;">I'm Kim from <strong>Mountain Mama's Coffeehouse &amp; Bakery</strong> in West Yellowstone. We know finding the right lunch partner matters. Instead of just telling you how great our food is, we'd rather <strong>show you</strong>. Here are a few of our most popular sandwiches - all made fresh daily with homemade bread, from our kitchen in West Yellowstone:</p>
                        </td>
                    </tr>

                    <!-- Social Proof Stats -->
                    <tr>
                        <td style="padding: 0 28px 16px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="50%" style="padding: 0 4px 0 0;">
                                        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 14px 16px; text-align: center;">
                                            <p style="margin: 0 0 2px 0; font-size: 22px; font-weight: 900; color: #16a34a;">10+</p>
                                            <p style="margin: 0; font-size: 11px; color: #15803d; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Tour Companies Partnered</p>
                                        </div>
                                    </td>
                                    <td width="50%" style="padding: 0 0 0 4px;">
                                        <div style="background-color: #fefce8; border: 1px solid #fde68a; border-radius: 10px; padding: 14px 16px; text-align: center;">
                                            <p style="margin: 0 0 2px 0; font-size: 22px; font-weight: 900; color: #ca8a04;">3,000+</p>
                                            <p style="margin: 0; font-size: 11px; color: #a16207; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Lunches Served in 2026</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Sandwich Grid: Row 1 -->
                    <tr>
                        <td style="padding: 8px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 6px 12px 0;">
                                        <a href="https://mountainmamascafe.app/" style="text-decoration: none; color: inherit; display: block;">
                                        <div class="mobile-card" style="border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background-color: #fafafa;">
                                            <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/meal-images/main-77b434c1-c36b-469c-97de-00f731e91d18.jpg" width="260" style="width: 100%; max-width: 260px; height: 160px; object-fit: cover; display: block;" alt="The Madison Sandwich" />
                                            <div style="padding: 14px 16px;">
                                                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 900; color: #111827;">The Madison</p>
                                                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Herby Focaccia, pesto, Turkey, Bacon, Provolone, avocado &amp; Bell Pepper</p>
                                            </div>
                                        </div>
                                        </a>
                                    </td>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 0 12px 6px;">
                                        <a href="https://mountainmamascafe.app/" style="text-decoration: none; color: inherit; display: block;">
                                        <div class="mobile-card" style="border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background-color: #fafafa;">
                                            <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/meal-images/main-467ac862-19e3-4738-930b-01824ba4706c.jpg" width="260" style="width: 100%; max-width: 260px; height: 160px; object-fit: cover; display: block;" alt="The Grizzly Bear Sandwich" />
                                            <div style="padding: 14px 16px;">
                                                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 900; color: #111827;">The Grizzly Bear</p>
                                                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Herby Focaccia, Chipotle BBQ sauce, Roast Beef &amp; Cheddar Cheese</p>
                                            </div>
                                        </div>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Sandwich Grid: Row 2 -->
                    <tr>
                        <td style="padding: 0 28px 16px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 6px 12px 0;">
                                        <a href="https://mountainmamascafe.app/" style="text-decoration: none; color: inherit; display: block;">
                                        <div class="mobile-card" style="border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background-color: #fafafa;">
                                            <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/meal-images/main-06a32bb1-17d5-4a36-a42a-124cc940cbdd.jpg" width="260" style="width: 100%; max-width: 260px; height: 160px; object-fit: cover; display: block;" alt="Chicken Salad Sandwich" />
                                            <div style="padding: 14px 16px;">
                                                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 900; color: #111827;">Chicken Salad Sandwich</p>
                                                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Fresh Croissant, Homemade Chicken Salad &amp; Lettuce</p>
                                            </div>
                                        </div>
                                        </a>
                                    </td>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 0 12px 6px;">
                                        <a href="https://mountainmamascafe.app/" style="text-decoration: none; color: inherit; display: block;">
                                        <div class="mobile-card" style="border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; background-color: #fafafa;">
                                            <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/meal-images/main-28c55056-6096-4ee3-80d9-f8fc784c73e3.jpg" width="260" style="width: 100%; max-width: 260px; height: 160px; object-fit: cover; display: block;" alt="Caprice Sandwich" />
                                            <div style="padding: 14px 16px;">
                                                <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 900; color: #111827;">Caprice Sandwich</p>
                                                <p style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Savory Focaccia, Fresh Mozzarella, Tomatoes, Basil &amp; Arugula</p>
                                            </div>
                                        </div>
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- "And more" + Custom menu note -->
                    <tr>
                        <td style="padding: 0 28px 24px 28px;">
                            <div style="background-color: #f5f3ff; border: 1px solid #e9d5ff; border-radius: 12px; padding: 18px 20px; text-align: center;">
                                <p style="margin: 0 0 6px 0; font-size: 14px; font-weight: bold; color: #6d28d9;">&#x1F4CB; These are just 4 of 15+ sandwich options</p>
                                <p style="margin: 0; font-size: 13px; color: #7c3aed; line-height: 1.6;">Plus salads, kids' meals &amp; more. As a partner, you can <strong>request customized meals with the exact ingredients you want</strong> - build your own menu tailored to your tour guests' preferences.</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Dual CTA Buttons -->
                    <tr>
                        <td align="center" style="padding: 0 28px 32px 28px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                                <tr>
                                    <td align="center" style="padding-right: 8px;">
                                        <a class="mobile-btn" href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; box-shadow: 0 4px 14px rgba(109,40,217,0.3);">Register as a Partner &rarr;</a>
                                    </td>
                                    <td align="center" style="padding-left: 8px;">
                                        <a class="mobile-btn" href="${mealsPageUrl}" style="display: inline-block; background-color: #ffffff; color: #6d28d9; padding: 13px 28px; border-radius: 10px; text-decoration: none; font-weight: bold; font-size: 14px; border: 2px solid #c4b5fd;">See All Meals &#x1F50D;</a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #4c1d95; padding: 24px 28px; text-align: center; color: #ddd6fe; font-size: 13px; line-height: 1.6;">
                            <p style="margin: 0 0 4px 0; color: #ffffff; font-weight: bold; font-size: 14px;">Kimberly Howell &bull; Mountain Mama's Cafe &amp; Bakery</p>
                            <p style="margin: 0 0 8px 0;">17 Madison Avenue (Westgate Entrance), West Yellowstone, Montana</p>
                            <p style="margin: 0;">Phone: 406-461-1024 | <a href="mailto:mountainmamascafe@gmail.com" style="color: #c4b5fd; text-decoration: underline;">mountainmamascafe@gmail.com</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // ---- Template: social_proof (Trust Builder) ----
    if (templateId === 'social_proof') {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trusted by Yellowstone Tour Companies</title>
    <style>
        @media only screen and (max-width: 480px) {
            .email-container {
                width: 100% !important;
                max-width: 100% !important;
            }
            .mobile-col {
                display: block !important;
                width: 100% !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                box-sizing: border-box;
            }
            .mobile-card {
                margin-bottom: 16px !important;
            }
            .mobile-title {
                font-size: 16px !important;
            }
            .mobile-desc {
                font-size: 14px !important;
            }
            .mobile-attr {
                font-size: 14px !important;
            }
            .mobile-greeting {
                font-size: 18px !important;
            }
            .mobile-body-text {
                font-size: 16px !important;
                line-height: 1.6 !important;
            }
            .mobile-footer-title {
                font-size: 14px !important;
            }
            .mobile-footer-text {
                font-size: 13px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f0fdf4; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table class="email-container" role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">

                    <!-- Header with stat -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #065f46, #047857); padding: 36px 28px; text-align: center;">
                            <p style="margin: 0 0 12px 0; color: #a7f3d0; font-size: 12px; font-weight: bold; letter-spacing: 0.15em; text-transform: uppercase;">Trusted by Yellowstone Tour Operators</p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="50%" align="center" style="border-right: 1px solid rgba(255,255,255,0.2); padding: 0 12px;">
                                        <h1 style="margin: 0 0 4px 0; color: #ffffff; font-size: 42px; font-weight: 900; line-height: 1;">3,000+</h1>
                                        <p style="margin: 0; color: #6ee7b7; font-size: 13px; font-weight: bold;">Lunches Served in 2026</p>
                                    </td>
                                    <td width="50%" align="center" style="padding: 0 12px;">
                                        <h1 style="margin: 0 0 4px 0; color: #ffffff; font-size: 42px; font-weight: 900; line-height: 1;">10+</h1>
                                        <p style="margin: 0; color: #6ee7b7; font-size: 13px; font-weight: bold;">Tour Company Partners</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Social proof quote -->
                    <tr>
                        <td style="padding: 28px 28px 24px 28px;">
                            <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 0 12px 12px 0; padding: 20px 24px;">
                                <p class="mobile-body-text" style="margin: 0 0 10px 0; font-size: 15px; font-style: italic; color: #374151; line-height: 1.6;">
                                    &ldquo;Mountain Mama's makes tour lunch logistics so easy. Our guides just grab lunches from the cooler and go - no waiting, no stress. The food is fresh and our guests love it.&rdquo;
                                </p>
                                <p class="mobile-attr" style="margin: 0; font-size: 13px; font-weight: bold; color: #065f46;"> - Yellowstone Tour Partner</p>
                            </div>
                        </td>
                    </tr>

                    <!-- Greeting and pitch -->
                    <tr>
                        <td style="padding: 0 28px 24px 28px;">
                            <p class="mobile-greeting" style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #111827;">
                                Hi ${cleanCompany} Team,
                            </p>
                            <p class="mobile-body-text" style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.65;">
                                I'm Kim from <strong>Mountain Mama's Coffeehouse &amp; Bakery</strong> in West Yellowstone. Tour companies across the Yellowstone region trust Mountain Mama's for one reason: <strong>we take the lunch problem off their plate</strong> - literally. Here's what our partners get:
                            </p>

                            <!-- Benefits grid -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 24px;">
                                <tr>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 8px 12px 0;">
                                        <div class="mobile-card" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                                            <p style="margin: 0 0 4px 0; font-size: 20px;">&#x1F950;</p>
                                            <p class="mobile-title" style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #111827;">Fresh From Scratch</p>
                                            <p class="mobile-desc" style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">All breads, croissants &amp; cookies baked daily in-house</p>
                                        </div>
                                    </td>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 0 12px 8px;">
                                        <div class="mobile-card" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                                            <p style="margin: 0 0 4px 0; font-size: 20px;">&#x1F9CA;</p>
                                            <p class="mobile-title" style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #111827;">24/7 Cooler Access</p>
                                            <p class="mobile-desc" style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Grab lunches anytime from our outdoor walk-in cooler</p>
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 8px 0 0;">
                                        <div class="mobile-card" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                                            <p style="margin: 0 0 4px 0; font-size: 20px;">&#x1F4F1;</p>
                                            <p class="mobile-title" style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #111827;">Easy App Ordering</p>
                                            <p class="mobile-desc" style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Guides order from their phone in under a minute</p>
                                        </div>
                                    </td>
                                    <td class="mobile-col" width="50%" valign="top" style="padding: 0 0 0 8px;">
                                        <div class="mobile-card" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px;">
                                            <p style="margin: 0 0 4px 0; font-size: 20px;">&#x1F4B3;</p>
                                            <p class="mobile-title" style="margin: 0 0 4px 0; font-size: 13px; font-weight: bold; color: #111827;">Flexible Billing</p>
                                            <p class="mobile-desc" style="margin: 0; font-size: 12px; color: #6b7280; line-height: 1.5;">Pay-as-you-go or monthly invoicing options</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Hero image -->
                    <tr>
                        <td align="center" style="padding: 0 28px 28px 28px;">
                            <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/campaign-images/media__1781276704649.jpg" width="544" style="width: 100%; max-width: 544px; border-radius: 12px; display: block; border: 1px solid #e5e7eb;" alt="Fresh Chicken Salad Croissant Box Lunch made from scratch daily" />
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td align="center" style="padding: 0 28px 32px 28px;">
                            <p class="mobile-body-text" style="margin: 0 0 14px 0; font-size: 15px; font-weight: bold; color: #10b981;">Join 10+ tour companies - over 3,000 lunches served this season:</p>
                            <a href="${registrationUrl}" style="display: inline-block; background-color: #059669; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Register as a Partner &rarr;</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #065f46; padding: 24px 28px; text-align: center; color: #a7f3d0; font-size: 13px; line-height: 1.6;">
                            <p class="mobile-footer-title" style="margin: 0 0 4px 0; color: #ffffff; font-weight: bold; font-size: 14px;">Kimberly Howell &bull; Mountain Mama's Cafe &amp; Bakery</p>
                            <p class="mobile-footer-text" style="margin: 0 0 8px 0;">17 Madison Avenue (Westgate Entrance), West Yellowstone, Montana</p>
                            <p class="mobile-footer-text" style="margin: 0;">Phone: 406-461-1024 | <a href="mailto:mountainmamascafe@gmail.com" style="color: #6ee7b7; text-decoration: underline;">mountainmamascafe@gmail.com</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // ---- Template: seasonal_urgency (Season Opener) ----
    if (templateId === 'seasonal_urgency') {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2026 Season - Mountain Mama's Lunch Partnership</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fefce8; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fefce8;">
        <tr>
            <td align="center" style="padding: 30px 10px;">
                <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

                    <!-- Urgency Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #b45309, #d97706, #f59e0b); padding: 32px 28px; text-align: center;">
                            <p style="margin: 0 0 6px 0; color: #fef3c7; font-size: 12px; font-weight: bold; letter-spacing: 0.2em; text-transform: uppercase;">&#x26f0;&#xfe0f; 2026 Yellowstone Season</p>
                            <h1 style="margin: 0 0 6px 0; color: #ffffff; font-size: 24px; font-weight: 900;">Tour Season Is Underway</h1>
                            <p style="margin: 0; color: #fde68a; font-size: 15px; font-weight: bold;">Don't leave lunch logistics to chance.</p>
                        </td>
                    </tr>

                    <!-- Urgency banner -->
                    <tr>
                        <td style="padding: 24px 28px 20px 28px;">
                            <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 16px; text-align: center;">
                                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #92400e;">
                                    &#x1F525; We're onboarding new tour partners now for the 2026 summer season - spots fill up as kitchen capacity is reached.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 0 28px 24px 28px;">
                            <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #111827;">Hi ${cleanCompany} Team,</p>
                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.65;">
                                I'm Kim from <strong>Mountain Mama's Coffeehouse &amp; Bakery</strong> in West Yellowstone. As tours ramp up this summer, getting reliable, high-quality box lunches shouldn't be another thing on your to-do list. At <strong>Mountain Mama's Café</strong> in West Yellowstone, we've already served <strong style="color: #b45309;">3,000+ lunches</strong> to 10+ tour companies this season - and we've streamlined everything so your guides can focus on the tour, not the food.
                            </p>

                            <!-- Quick pitch points -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td width="36" valign="top" style="font-size: 18px; padding-top: 2px;">&#x1F950;</td>
                                                <td style="font-size: 15px; color: #374151; line-height: 1.5;">
                                                    <strong style="color: #111827;">Signature Box Lunch ($19)</strong> - Chicken Salad on fresh croissant, chips, apple, scratch cookie &amp; water
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td width="36" valign="top" style="font-size: 18px; padding-top: 2px;">&#x1F96A;</td>
                                                <td style="font-size: 15px; color: #374151; line-height: 1.5;">
                                                    <strong style="color: #111827;">Junior Box Lunch ($17.50)</strong> - BLT on herby focaccia, chips, apple, scratch cookie &amp; water
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px 0;">
                                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td width="36" valign="top" style="font-size: 18px; padding-top: 2px;">&#x1F9CA;</td>
                                                <td style="font-size: 15px; color: #374151; line-height: 1.5;">
                                                    <strong style="color: #111827;">24/7 grab-and-go</strong> - Orders in our outdoor cooler by 6 PM night before or 5 AM morning of
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Images -->
                    <tr>
                        <td style="padding: 0 28px 24px 28px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td width="50%" align="center" style="padding-right: 8px;">
                                        <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/campaign-images/media__1781276704649.jpg" width="260" style="width: 100%; max-width: 260px; border-radius: 10px; display: block; border: 1px solid #e5e7eb;" alt="Signature Croissant Box Lunch fresh baked every morning" />
                                    </td>
                                    <td width="50%" align="center" style="padding-left: 8px;">
                                        <img src="https://annrpkzwsghiwwkxqdxv.supabase.co/storage/v1/object/public/campaign-images/media__1781276704853.jpg" width="260" style="width: 100%; max-width: 260px; border-radius: 10px; display: block; border: 1px solid #e5e7eb;" alt="Guides pick up pre-sorted lunches from our 24/7 outdoor cooler" />
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- CTA -->
                    <tr>
                        <td align="center" style="padding: 8px 28px 32px 28px;">
                            <p style="margin: 0 0 14px 0; font-size: 15px; font-weight: bold; color: #b45309;">Get set up before peak season - it only takes 2 minutes:</p>
                            <a href="${registrationUrl}" style="display: inline-block; background: linear-gradient(135deg, #d97706, #f59e0b); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px; box-shadow: 0 4px 12px rgba(217,119,6,0.3);">Secure Your Partner Spot &rarr;</a>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #78350f; padding: 24px 28px; text-align: center; color: #fde68a; font-size: 13px; line-height: 1.6;">
                            <p style="margin: 0 0 4px 0; color: #ffffff; font-weight: bold; font-size: 14px;">Kimberly Howell &bull; Mountain Mama's Cafe &amp; Bakery</p>
                            <p style="margin: 0 0 8px 0;">17 Madison Avenue (Westgate Entrance), West Yellowstone, Montana</p>
                            <p style="margin: 0;">Phone: 406-461-1024 | <a href="mailto:mountainmamascafe@gmail.com" style="color: #fde68a; text-decoration: underline;">mountainmamascafe@gmail.com</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
    }

    // Default Template: short_intro (Friendly First Touch)
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mountain Mama's - Tour Lunch Partnership</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f9fafb;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <table role="presentation" width="560" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
                    <!-- Simple top accent -->
                    <tr><td height="4" style="background: linear-gradient(90deg, #ec4899, #8b5cf6); line-height:4px; font-size:4px;">&nbsp;</td></tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <p style="margin: 0 0 20px 0; font-size: 16px; color: #111827; line-height: 1.7;">
                                Hi ${cleanCompany} Team,
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.7;">
                                I'm Kim from <strong>Mountain Mama's Coffeehouse &amp; Bakery</strong> in West Yellowstone. I wanted to reach out because we've built a box lunch program specifically for Yellowstone tour operators - and I think it could save your guides a lot of morning hassle.
                            </p>
                            <p style="margin: 0 0 20px 0; font-size: 15px; color: #374151; line-height: 1.7;">
                                Here's the gist:
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 24px 0;">
                                <tr>
                                    <td style="padding: 8px 0; font-size: 15px; color: #374151; line-height: 1.6;">
                                        &#x1F950; &nbsp;<strong>Fresh-baked daily</strong> - croissants, focaccia, cookies, all from scratch
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 15px; color: #374151; line-height: 1.6;">
                                        &#x1F4F1; &nbsp;<strong>1-minute app ordering</strong> - guides order lunches right from their phone
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 15px; color: #374151; line-height: 1.6;">
                                        &#x1F9CA; &nbsp;<strong>24/7 cooler pickup</strong> - orders ready by 6 PM the night before, grab &amp; go
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 8px 0; font-size: 15px; color: #374151; line-height: 1.6;">
                                        &#x1F4B3; &nbsp;<strong>Simple billing</strong> - pay-as-you-go or monthly invoicing
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 0 0 28px 0; font-size: 15px; color: #374151; line-height: 1.7;">
                                We're already working with 10+ tour companies this season - <strong>over 3,000 lunches served and counting</strong>. I'd love to set up ${cleanCompany} as well. Takes about 2 minutes to get started:
                            </p>

                            <!-- CTA -->
                            <div style="text-align: center; margin: 0 0 28px 0;">
                                <a href="${registrationUrl}" style="display: inline-block; background-color: #7c3aed; color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Set Up Your Partner Account &rarr;</a>
                            </div>

                            <p style="margin: 0 0 6px 0; font-size: 15px; color: #374151; line-height: 1.7;">
                                Happy to answer any questions - just hit reply or call me directly.
                            </p>

                            <!-- Signature -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top: 28px; border-top: 1px solid #e5e7eb;">
                                <tr>
                                    <td style="padding-top: 20px;">
                                        <p style="margin: 0 0 2px 0; font-size: 15px; font-weight: bold; color: #111827;">Kimberly Howell</p>
                                        <p style="margin: 0 0 2px 0; font-size: 14px; color: #ec4899; font-weight: 600;">Mountain Mama's Coffeehouse &amp; Bakery</p>
                                        <p style="margin: 0 0 2px 0; font-size: 13px; color: #6b7280;">17 Madison Avenue (Westgate Entrance), West Yellowstone, MT</p>
                                        <p style="margin: 0; font-size: 13px; color: #6b7280;">Phone: 406-461-1024 &middot; <a href="mailto:mountainmamascafe@gmail.com" style="color: #7c3aed; text-decoration: underline;">mountainmamascafe@gmail.com</a></p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

// ============================================================
// ACTION: Convert lead to active tour company partner
// ============================================================
export async function convertLeadToPartner(leadId: string) {
    const supabase = createAdminClient();

    // 1. Get lead
    const { data: lead, error: fetchError } = await supabase
        .from('outreach_leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (fetchError || !lead) {
        return { success: false, error: 'Lead not found' };
    }

    log(`Converting lead to partner: ${lead.company_name} (${lead.email})`);

    // 2. Check if company already exists
    const { data: existing } = await supabase
        .from('tour_companies')
        .select('id')
        .eq('email', lead.email)
        .maybeSingle();

    if (existing) {
        return { success: false, error: 'A tour company with this email already exists.' };
    }

    // 3. Create the company record
    const companyId = crypto.randomUUID();
    const defaultSlug = slugify(lead.company_name);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const company = {
        id: companyId,
        name: lead.company_name,
        slug: defaultSlug,
        default_slug: defaultSlug,
        generic_slug: 'lunches-' + companyId.substring(0, 4),
        order_link: `${baseUrl}/${defaultSlug}`,
        email: lead.email,
        phone: lead.phone || null,
        payment_method: 'monthly_invoice',
        status: 'active' as const,
        is_active: true,
    };

    const { data: companyData, error: insertError } = await supabase
        .from('tour_companies')
        .insert(company)
        .select('*')
        .single();

    if (insertError) {
        log(`Company creation failed: ${insertError.message}`);
        return { success: false, error: insertError.message };
    }

    // 4. Initialize menu selections
    try {
        const { data: allMeals } = await supabase
            .from('meals')
            .select('id, sort_order')
            .eq('is_active', true);

        if (allMeals && allMeals.length > 0) {
            const selections = allMeals.map((meal: { id: string; sort_order: number }) => ({
                company_id: companyData.id,
                meal_id: meal.id,
                is_selected: true,
                sort_order: meal.sort_order,
            }));
            await supabase.from('company_menu_selections').insert(selections);
        }

        // Initialize app config with global defaults
        const { data: globalSettings } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

        await supabase.from('company_app_config').update({
            meal_page_options: {
                breads: globalSettings?.bread_options || [],
                cookies: globalSettings?.cookie_options || [],
            },
        }).eq('company_id', companyData.id);

        // Initialize form fields
        const { data: eligibleFields } = await supabase
            .from('form_field_definitions')
            .select('id, sort_order')
            .eq('is_active', true)
            .or('is_system_core.eq.true,auto_add.eq.true');

        if (eligibleFields && eligibleFields.length > 0) {
            const companyFields = eligibleFields.map((field: { id: string; sort_order: number }) => ({
                company_id: companyData.id,
                field_id: field.id,
                is_enabled: true,
                sort_order: field.sort_order || 0,
            }));
            await supabase.from('company_form_fields').insert(companyFields);
        }
    } catch (onboardErr: any) {
        log(`Onboarding partial error: ${onboardErr.message}`);
    }

    // 5. Create auth user and send invitation
    const tempPassword = `${lead.company_name.replace(/\s+/g, '')}2026!`;

    try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: lead.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                role: 'company',
                company_id: companyData.id,
                company_name: lead.company_name,
                company_slug: companyData.slug,
            },
        });

        if (authError) {
            if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
                const { data: { users } } = await supabase.auth.admin.listUsers();
                const existingUser = users.find(
                    (u: any) => u.email?.toLowerCase() === lead.email.toLowerCase()
                );

                if (existingUser) {
                    await supabase.auth.admin.updateUserById(existingUser.id, {
                        password: tempPassword,
                        user_metadata: {
                            role: 'company',
                            company_id: companyData.id,
                            company_name: lead.company_name,
                            company_slug: companyData.slug,
                        },
                    });
                }
            } else {
                throw new Error(authError.message);
            }
        }

        await sendInvitationEmail(lead.email, lead.company_name, tempPassword);
        log(`Invitation sent to converted partner: ${lead.email}`);
    } catch (err: any) {
        log(`Auth/Email error during conversion: ${err.message}`);
    }

    // 6. Update lead status to 'converted'
    await supabase
        .from('outreach_leads')
        .update({ status: 'converted' })
        .eq('id', leadId);

    await logActivity({
        userRole: 'admin',
        action: 'outreach_lead_converted',
        entityType: 'company',
        entityId: companyData.id,
        details: { lead_name: lead.company_name, lead_email: lead.email },
    });

    log(`Lead converted successfully: ${lead.company_name} → Company ID: ${companyData.id}`);

    return { success: true, companyId: companyData.id };
}
