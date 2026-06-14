'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { sendEmail } from '@/lib/brevo';
import { headers } from 'next/headers';
import crypto from 'crypto';

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export async function checkSlugAvailability(name: string) {
    const supabase = createAdminClient();
    const slug = slugify(name);
    const { data } = await supabase
        .from('tour_companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
    return { available: !data, slug };
}

export async function registerCompany(formData: any) {
    const supabase = createAdminClient();
    const headersList = await headers();
    const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '127.0.0.1';

    const {
        name,
        email,
        phone,
        paymentMethod,
        password,
        signatureData,
        signerName,
        signerEmail,
        signerTitle
    } = formData;

    if (!name || !email || !paymentMethod || !password) {
        return { success: false, error: 'Required fields are missing.' };
    }

    const slug = slugify(name);

    // 1. Verify uniqueness
    const { data: existingSlug } = await supabase
        .from('tour_companies')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

    if (existingSlug) {
        return { success: false, error: 'A company with a similar name is already registered.' };
    }

    const { data: existingEmail } = await supabase
        .from('tour_companies')
        .select('id')
        .eq('email', email)
        .maybeSingle();

    if (existingEmail) {
        return { success: false, error: 'This email is already registered.' };
    }

    const companyId = crypto.randomUUID();
    const defaultSlug = slugify(name);
    const genericSlug = 'lunches-' + companyId.substring(0, 4);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 2. Insert Tour Company (Pending Approval)
    const company = {
        id: companyId,
        name,
        slug: defaultSlug,
        default_slug: defaultSlug,
        generic_slug: genericSlug,
        order_link: `${baseUrl}/${defaultSlug}`,
        email,
        phone: phone || null,
        payment_method: paymentMethod,
        representative_name: signerName || null,
        representative_title: signerTitle || null,
        status: 'pending_approval' as const,
        is_active: false,
        needs_password_change: false, // Since they set it themselves
    };

    const { data: newCompany, error: dbError } = await supabase
        .from('tour_companies')
        .insert(company)
        .select()
        .single();

    if (dbError) {
        return { success: false, error: dbError.message };
    }

    // 3. Onboarding Initialization
    try {
        // A. Menu selections (Default to ALL active meals)
        const { data: allMeals } = await supabase
            .from('meals')
            .select('id, sort_order')
            .eq('is_active', true);

        if (allMeals && allMeals.length > 0) {
            const selections = allMeals.map((meal: { id: string; sort_order: number }) => ({
                company_id: newCompany.id,
                meal_id: meal.id,
                is_selected: true,
                sort_order: meal.sort_order
            }));
            await supabase.from('company_menu_selections').insert(selections);
        }

        // B. Global app settings sync
        const { data: globalSettings } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

        if (globalSettings) {
            await supabase.from('company_app_config').update({
                meal_page_options: {
                    breads: globalSettings.bread_options || [],
                    cookies: globalSettings.cookie_options || []
                },
                show_prices: paymentMethod === 'direct_pay',
                show_stripe_checkout: paymentMethod === 'direct_pay',
            }).eq('company_id', newCompany.id);
        }

        // C. Initialize core or auto-add form fields for the company
        const { data: eligibleFields } = await supabase
            .from('form_field_definitions')
            .select('id, sort_order')
            .eq('is_active', true)
            .or('is_system_core.eq.true,auto_add.eq.true');

        if (eligibleFields && eligibleFields.length > 0) {
            const companyFields = eligibleFields.map((field: { id: string; sort_order: number }) => ({
                company_id: newCompany.id,
                field_id: field.id,
                is_enabled: true,
                sort_order: field.sort_order || 0
            }));
            await supabase.from('company_form_fields').insert(companyFields);
        }

    } catch (onboardingErr: any) {
        console.error('Self-registration onboarding error:', onboardingErr);
    }

    // 4. Invoicing Contract Setup
    if (paymentMethod === 'monthly_invoice' && signatureData) {
        try {
            const { error: contractErr } = await supabase
                .from('contracts')
                .insert({
                    company_id: newCompany.id,
                    status: 'signed',
                    signed_at: new Date().toISOString(),
                    signer_name: signerName || name,
                    signer_email: signerEmail || email,
                    signer_ip: ipAddress,
                    signature_data: signatureData,
                    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 10).toISOString() // 10 years expiry
                });

            if (!contractErr) {
                await supabase
                    .from('tour_companies')
                    .update({ contract_signed_at: new Date().toISOString() })
                    .eq('id', newCompany.id);
            } else {
                console.error('Contract db save error:', contractErr);
            }
        } catch (contractErr) {
            console.error('Contract setup exception:', contractErr);
        }
    }

    // 5. Auth User Creation
    try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                role: 'company',
                company_id: newCompany.id,
                company_name: name,
                company_slug: slug
            }
        });

        if (authError) {
            console.error('Auth creation error in self-registration:', authError.message);
            
            // Check if user already exists
            if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
                console.log(`User already exists in auth, finding and updating user metadata & password: ${email}`);
                
                const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
                if (!listError && listData?.users) {
                    const existingUser = listData.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
                    if (existingUser) {
                        console.log(`Found existing user ID ${existingUser.id}. Updating password and metadata...`);
                        const { error: updateError } = await supabase.auth.admin.updateUserById(
                            existingUser.id,
                            { 
                                password,
                                user_metadata: {
                                    role: 'company',
                                    company_id: newCompany.id,
                                    company_name: name,
                                    company_slug: slug
                                }
                            }
                        );
                        if (updateError) {
                            console.error('Failed to update existing user in self-registration:', updateError.message);
                        } else {
                            console.log('Existing auth user successfully updated and linked.');
                        }
                    }
                }
            }
        }
    } catch (authErr: any) {
        console.error('Auth exception in self-registration:', authErr);
    }

    // 6. Logging activity
    await logActivity({
        userRole: 'system',
        action: 'company_registered',
        entityType: 'company',
        entityId: newCompany.id,
        details: { name, payment_method: paymentMethod }
    });

    // 7. Send confirmation email to company and admin notification
    try {
        // Email A: Registering Company Confirmation
        const companyHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
                <div style="background-color: #7c3aed; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">Registration Received!</h1>
                </div>
                <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                    <p style="font-size: 16px; line-height: 24px;">Hello <strong>${name}</strong>,</p>
                    <p style="font-size: 16px; line-height: 24px;">Thank you for registering your tour company with Mountain Mama's Café! Your application has been successfully submitted and is currently <strong>Pending Approval</strong>.</p>
                    
                    <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Application Profile</p>
                        <p style="margin: 0; font-size: 15px;"><strong>Company:</strong> ${name}</p>
                        <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Password:</strong> ${password}</p>
                        <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Billing Profile:</strong> ${paymentMethod === 'direct_pay' ? 'Direct Pay (Guests Pay Online)' : 'Monthly Corporate Invoicing'}</p>
                    </div>
                    
                    <p style="font-size: 15px; line-height: 24px; color: #4b5563;">Our kitchen administration team will review your account details shortly. Once approved, you will receive a confirmation email and be able to immediately access your dashboard and publish your custom ordering link to guests.</p>
                    
                    <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        If you have any questions, please reply to this email or contact Kim at mountainmamascafe@gmail.com
                    </p>
                </div>
            </div>
        `;

        await sendEmail({
            to: [{ email, name }],
            subject: "We've Received Your Partner Application! — Mountain Mama's Café",
            htmlContent: companyHtml
        });

        // Email B: Admin notification
        const adminEmail = process.env.ADMIN_EMAIL || 'mountainmamascafe@gmail.com';
        const adminHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
                <div style="background-color: #111827; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">New Partner Registration</h1>
                </div>
                <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                    <p style="font-size: 16px; line-height: 24px;">Hello Admin,</p>
                    <p style="font-size: 16px; line-height: 24px;">A new tour company partner has self-registered on the platform and is awaiting administrative approval.</p>
                    
                    <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 15px;"><strong>Company Name:</strong> ${name}</p>
                        <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
                        <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Phone:</strong> ${phone || 'Not provided'}</p>
                        <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Payment Setup:</strong> ${paymentMethod === 'direct_pay' ? 'Direct Pay' : 'Monthly Invoice'}</p>
                        ${paymentMethod === 'monthly_invoice' ? `<p style="margin: 6px 0 0 0; font-size: 15px; color: #059669; font-weight: bold;">✓ E-Contract Signed & Recorded</p>` : ''}
                    </div>
                    
                    <a href="${baseUrl}/admin/companies" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Admin Panel to Approve</a>
                </div>
            </div>
        `;

        await sendEmail({
            to: [{ email: adminEmail, name: "Mountain Mama's Cafe Admin" }],
            subject: `New Partner Application: ${name} is awaiting approval`,
            htmlContent: adminHtml
        });
    } catch (mailErr) {
        console.error('Mail notification exception in self-registration:', mailErr);
    }

    return { success: true };
}
