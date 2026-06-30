'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/supabase/activity-log';
import { sendInvitationEmail, sendActivationEmail } from '@/lib/brevo';
import fs from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import crypto from 'crypto';


function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

export async function createCompany(formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get('name') as string;
    const company_email_val = formData.get('email') as string;
    const paymentMethod = formData.get('payment_method') as string;
    const representativeName = formData.get('representative_name') as string || null;
    const representativeTitle = formData.get('representative_title') as string || null;
    const prepInstructions = formData.get('prep_instructions') as string || null;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const useMountainMamasBranding = formData.get('use_mountain_mamas_branding') === 'true';
    
    const companyId = crypto.randomUUID();
    const defaultSlug = slugify(name);
    const genericSlug = 'lunches-' + companyId.substring(0, 4);
    const activeSlug = useMountainMamasBranding ? genericSlug : defaultSlug;

    const company = {
        id: companyId,
        name,
        slug: activeSlug,
        default_slug: defaultSlug,
        generic_slug: genericSlug,
        order_link: `${baseUrl}/${activeSlug}`,
        email: company_email_val,
        phone: (formData.get('phone') as string) || null,
        payment_method: paymentMethod,
        representative_name: representativeName,
        representative_title: representativeTitle,
        discount_percentage: parseFloat(formData.get('discount_percentage') as string) || 0,
        prep_instructions: prepInstructions,
        status: 'active' as const,
        is_active: true,
    };

    const logFile = path.join(process.cwd(), 'email-debug.log');
    const log = (msg: string) => {
        try {
            fs.appendFileSync(logFile, `[${new Date().toISOString()}] [Actions] ${msg}\n`);
        } catch (e) {}
    };

    log(`Creating company: ${name} (${company_email_val})`);

    const { data, error } = await supabase
        .from('tour_companies')
        .insert(company)
        .select('*, company_app_config(*)')
        .single();

    if (error) {
        log(`Database Error: ${error.message}`);
        return { success: false, error: error.message };
    }

    log(`Company created in DB: ${data.id}`);

    // --- Onboarding Initialization ---
    try {
        // 1. Initialize Menu Selections (Default to ALL active meals)
        const { data: allMeals } = await supabase
            .from('meals')
            .select('id, sort_order')
            .eq('is_active', true);
            
        if (allMeals && allMeals.length > 0) {
            const selections = allMeals.map((meal: { id: string; sort_order: number }) => ({
                company_id: data.id,
                meal_id: meal.id,
                is_selected: true,
                sort_order: meal.sort_order
            }));
            await supabase.from('company_menu_selections').insert(selections);
            log(`Initialized menu selections for ${allMeals.length} meals.`);
        }

        // 2. Initialize App Config with Global Defaults (Bread & Cookies) and Branding Settings
        const { data: globalSettings } = await supabase
            .from('app_settings')
            .select('*')
            .eq('id', '00000000-0000-0000-0000-000000000001')
            .single();

        const useMountainMamasBranding = formData.get('use_mountain_mamas_branding') === 'true';
        const customWelcomeMessage = formData.get('custom_welcome_message') as string || null;

        await supabase.from('company_app_config').update({
            use_mountain_mamas_branding: useMountainMamasBranding,
            custom_welcome_message: customWelcomeMessage,
            meal_page_options: {
                breads: globalSettings?.bread_options || [],
                cookies: globalSettings?.cookie_options || []
            }
        }).eq('company_id', data.id);
        log(`Synced global defaults and custom branding to company config.`);

        // 3. Initialize core or auto-add form fields for the company
        const { data: eligibleFields } = await supabase
            .from('form_field_definitions')
            .select('id, sort_order')
            .eq('is_active', true)
            .or('is_system_core.eq.true,auto_add.eq.true');

        if (eligibleFields && eligibleFields.length > 0) {
            const companyFields = eligibleFields.map((field: { id: string; sort_order: number }) => ({
                company_id: data.id,
                field_id: field.id,
                is_enabled: true,
                sort_order: field.sort_order || 0
            }));
            await supabase.from('company_form_fields').insert(companyFields);
            log(`Initialized ${companyFields.length} default form fields for the company.`);
        }
    } catch (onboardingErr: any) {
        log(`Onboarding Warning: ${onboardingErr.message}`);
        // We continue because the company was created, but we log the issue
    }

    // Create Supabase Auth account for this company
    const tempPassword = `${name.replace(/\s+/g, '')}2026!`;
    log(`Temporary password generated: ${tempPassword}`);

    try {
        // Attempt to create auth user via admin client
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: company_email_val,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                role: 'company',
                company_id: data.id,
                company_name: name,
                company_slug: data.slug
            }
        });

        if (authError) {
            log(`Auth Creation Error: ${authError.message} (Status: ${authError.status})`);
            
            // Check if user already exists
            if (authError.message.toLowerCase().includes('already registered') || authError.status === 422) {
                log(`User already exists, attempting to find and update user: ${company_email_val}`);
                
                // Fetch all users to find the one with this email (Supabase doesn't have a direct "getByEmail" admin method that is reliably exported in all versions, listUsers is the safest fallback)
                const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
                
                if (listError) {
                    log(`List Users Error: ${listError.message}`);
                    throw new Error(`Failed to list users: ${listError.message}`);
                }

                const existingUser = users.find((u: any) => u.email?.toLowerCase() === company_email_val.toLowerCase());
                
                if (existingUser) {
                    log(`Found existing user ID: ${existingUser.id}. Updating metadata and password...`);
                    const { error: updateError } = await supabase.auth.admin.updateUserById(
                        existingUser.id,
                        { 
                            password: tempPassword,
                            user_metadata: {
                                role: 'company',
                                company_id: data.id,
                                company_name: name,
                                company_slug: data.slug
                            }
                        }
                    );

                    if (updateError) {
                        log(`Update User Error: ${updateError.message}`);
                        throw new Error(`Failed to update existing user: ${updateError.message}`);
                    }

                    log(`Existing user updated successfully. Sending invitation email...`);
                    await sendInvitationEmail(company_email_val, name, tempPassword);
                    log(`Invitation email sent to existing user.`);
                } else {
                    log(`CRITICAL: User supposedly exists but was not found in the users list.`);
                    // Fallback: Try to send email anyway if we can't find them but they exist
                    // (This shouldn't happen but we want to be safe)
                }
            } else {
                // Some other auth error
                throw new Error(`Auth creation failed: ${authError.message}`);
            }
        } else {
            log(`Auth user created successfully (ID: ${authData.user?.id}). Sending invitation email...`);
            await sendInvitationEmail(company_email_val, name, tempPassword);
            log(`Invitation email sent to new user.`);
        }
    } catch (err: any) {
        log(`CRITICAL EXCEPTION in Auth/Email flow: ${err.message}`);
        // We don't throw here to avoid failing the whole company creation if only the email/auth fails
        // but we've logged it for debugging.
    }

    await logActivity({
        userRole: 'admin',
        action: 'company_created',
        entityType: 'company',
        entityId: data.id,
        details: { name, payment_method: paymentMethod },
    });

    return { success: true, data };
}

export async function updateCompany(id: string, formData: FormData) {
    const supabase = createAdminClient();

    const name = formData.get('name') as string;
    const useMountainMamasBranding = formData.get('use_mountain_mamas_branding') === 'true';
    
    const defaultSlug = slugify(name);
    const genericSlug = 'lunches-' + id.substring(0, 4);
    const activeSlug = useMountainMamasBranding ? genericSlug : defaultSlug;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const updates = {
        name,
        slug: activeSlug,
        default_slug: defaultSlug,
        generic_slug: genericSlug,
        order_link: `${baseUrl}/${activeSlug}`,
        email: formData.get('email') as string,
        phone: (formData.get('phone') as string) || null,
        payment_method: formData.get('payment_method') as string,
        representative_name: formData.get('representative_name') as string || null,
        representative_title: formData.get('representative_title') as string || null,
        discount_percentage: parseFloat(formData.get('discount_percentage') as string) || 0,
        prep_instructions: formData.get('prep_instructions') as string || null,
    };

    const { data, error } = await supabase
        .from('tour_companies')
        .update(updates)
        .eq('id', id)
        .select('*, company_app_config(*)')
        .single();

    if (error) {
        return { success: false, error: error.message };
    }

    // Update app config based on payment method and custom branding settings
    const showPrices = updates.payment_method === 'direct_pay';
    const customWelcomeMessage = formData.get('custom_welcome_message') as string || null;

    await supabase
        .from('company_app_config')
        .update({
            show_prices: showPrices,
            show_stripe_checkout: showPrices,
            use_mountain_mamas_branding: useMountainMamasBranding,
            custom_welcome_message: customWelcomeMessage,
        })
        .eq('company_id', id);

    await logActivity({
        userRole: 'admin',
        action: 'company_updated',
        entityType: 'company',
        entityId: id,
        details: { name: updates.name },
    });

    return { success: true, data };
}

export async function updateCompanyStatus(id: string, status: string) {
    const supabase = createAdminClient();

    // 1. Fetch current details to get company name, email, previous status, and slug
    const { data: company, error: fetchError } = await supabase
        .from('tour_companies')
        .select('name, email, status, slug')
        .eq('id', id)
        .single();

    if (fetchError || !company) {
        return { success: false, error: fetchError?.message || 'Company not found' };
    }

    const isActive = status === 'active';
    const { error } = await supabase
        .from('tour_companies')
        .update({ status, is_active: isActive })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    // 2. If transitioning to active (and was previously not active), send the activation email!
    if (status === 'active' && company.status !== 'active') {
        try {
            await sendActivationEmail(company.email, company.name, company.slug);
        } catch (mailErr) {
            console.error('Failed to send activation email:', mailErr);
        }
    }

    await logActivity({
        userRole: 'admin',
        action: `company_${status}`,
        entityType: 'company',
        entityId: id,
    });

    return { success: true };
}

export async function deleteCompany(id: string) {
    const supabase = createAdminClient();

    // 1. Get the email of the company before deleting it
    const { data: company } = await supabase
        .from('tour_companies')
        .select('email')
        .eq('id', id)
        .single();

    // 2. Perform the database deletion
    const { error } = await supabase
        .from('tour_companies')
        .delete()
        .eq('id', id);

    if (error) {
        if (error.code === '23503' || error.message?.includes('violates foreign key constraint')) {
            return {
                success: false,
                error: 'This company cannot be deleted because it is linked to existing orders, invoices, or contracts. To disable this company without deleting history, change its status to "Suspended".'
            };
        }
        return { success: false, error: error.message };
    }

    // 3. Delete the corresponding Supabase Auth user if the company had an email
    if (company?.email) {
        try {
            const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
            if (!listError && listData?.users) {
                const authUser = listData.users.find(
                    (u: any) => u.email?.toLowerCase() === company.email.toLowerCase()
                );
                if (authUser) {
                    await supabase.auth.admin.deleteUser(authUser.id);
                }
            }
        } catch (authErr) {
            console.error('Failed to delete auth user during company deletion:', authErr);
        }
    }

    await logActivity({
        userRole: 'admin',
        action: 'company_deleted',
        entityType: 'company',
        entityId: id,
    });

    return { success: true };
}

export async function resendInvitation(companyId: string) {
    const supabase = createAdminClient();
    
    // 1. Get company details
    const { data: company, error: fetchError } = await supabase
        .from('tour_companies')
        .select('*')
        .eq('id', companyId)
        .single();
        
    if (fetchError || !company) {
        return { success: false, error: 'Company not found' };
    }
    
    // 2. Generate new temp password
    const tempPassword = `${company.name.replace(/\s+/g, '')}2026!`;
    
    // 3. Find and update Auth user
    const { data, error: listError } = await supabase.auth.admin.listUsers();
    if (listError || !data) return { success: false, error: listError?.message || 'Failed to fetch users' };
    
    const users = data.users;
    const existingUser = users.find((u: any) => u.email?.toLowerCase() === company.email.toLowerCase());
    
    if (!existingUser) {
        return { success: false, error: 'No user account found for this company email' };
    }
    
    const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        { 
            password: tempPassword,
            user_metadata: {
                role: 'company',
                company_id: company.id,
                company_name: company.name,
                company_slug: company.slug
            }
        }
    );
    
    if (updateError) return { success: false, error: updateError.message };
    
    // 4. Send email
    try {
        await sendInvitationEmail(company.email, company.name, tempPassword);
        
        await logActivity({
            userRole: 'admin',
            action: 'invitation_resent',
            entityType: 'company',
            entityId: companyId,
            details: { email: company.email }
        });
        
        return { success: true };
    } catch (err: any) {
        return { success: false, error: err.message };
    }
}

export async function deleteInvoice(invoiceId: string) {
    try {
        const supabase = createAdminClient();

        // 1. Fetch the invoice to get some details and confirm existence
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (fetchError || !invoice) {
            return { success: false, error: 'Invoice not found' };
        }

        if (invoice.status === 'paid') {
            return { success: false, error: 'Paid invoices cannot be deleted.' };
        }

        // 2. Revert payment status of all orders linked to this invoice
        const { error: updateError } = await supabase
            .from('orders')
            .update({ 
                payment_status: 'unpaid',
                invoice_id: null 
            })
            .eq('invoice_id', invoiceId);

        if (updateError) {
            console.error('[deleteInvoice] Failed to update orders:', updateError);
            return { success: false, error: 'Failed to revert associated orders: ' + updateError.message };
        }

        // 3. Delete from public.invoices
        const { error: deleteError } = await supabase
            .from('invoices')
            .delete()
            .eq('id', invoiceId);

        if (deleteError) {
            console.error('[deleteInvoice] Failed to delete invoice:', deleteError);
            return { success: false, error: 'Failed to delete invoice record: ' + deleteError.message };
        }

        // 4. Try to void/delete the invoice in Stripe if we have a stripe_invoice_id
        if (invoice.stripe_invoice_id) {
            try {
                const { stripe } = await import('@/lib/stripe');
                // Void the invoice in Stripe so the customer cannot pay it anymore
                await stripe.invoices.voidInvoice(invoice.stripe_invoice_id);
            } catch (stripeErr) {
                console.warn('[deleteInvoice] Stripe void failed, attempting delete:', stripeErr);
                try {
                    const { stripe } = await import('@/lib/stripe');
                    // If it is in draft status, we delete the Stripe invoice instead of voiding it
                    await stripe.invoices.del(invoice.stripe_invoice_id);
                } catch (delErr) {
                    console.warn('[deleteInvoice] Stripe delete failed:', delErr);
                }
            }
        }

        await logActivity({
            userRole: 'admin',
            action: 'invoice_deleted',
            entityType: 'invoice',
            entityId: invoiceId,
            details: { company_id: invoice.company_id, total_amount: invoice.total_amount }
        });

        return { success: true };
    } catch (e: any) {
        console.error('[deleteInvoice] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}

export async function impersonateCompany(companyId: string) {
    try {
        const supabase = await createClient();
        
        // 1. Get current authenticated user to verify they are admin
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) throw new Error('Not authenticated');
        
        const isAdmin = user.user_metadata?.role?.toLowerCase() === 'admin' || user.email?.toLowerCase() === 'mountainmamascafe@gmail.com';
        if (!isAdmin) throw new Error('Unauthorized');
        
        // 2. Set impersonate cookie
        const cookieStore = await cookies();
        cookieStore.set('impersonate_company_id', companyId, {
            path: '/',
            maxAge: 60 * 60 * 2, // 2 hours
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
        });
        
        return { success: true };
    } catch (e: any) {
        console.error('[impersonateCompany] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}

export async function stopImpersonating() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('impersonate_company_id');
        return { success: true };
    } catch (e: any) {
        console.error('[stopImpersonating] Error:', e);
        return { success: false, error: e.message || String(e) };
    }
}



