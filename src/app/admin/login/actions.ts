'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/brevo';

export async function sendAdminPasswordReset(email: string, origin: string) {
    const adminClient = createAdminClient();

    // 1. Check if the user exists
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers({
        perPage: 1000
    });

    if (listError) {
        return { success: false, error: 'Failed to search for user.' };
    }

    const matchedUser = users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    if (!matchedUser) {
        // Return success: true to prevent email harvesting
        return { success: true };
    }

    const role = matchedUser.user_metadata?.role;
    if (role !== 'admin' && role !== 'staff') {
        return { success: false, error: 'Access denied.' };
    }

    // 2. Generate the recovery link
    const { data, error: linkError } = await adminClient.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
            redirectTo: `${origin}/admin/reset-password?recovery=true`
        }
    });

    if (linkError || !data?.properties?.action_link) {
        return { success: false, error: linkError?.message || 'Failed to generate reset link.' };
    }

    const actionLink = `${origin}/admin/reset-password?token=${data.properties.email_otp}&email=${encodeURIComponent(email)}`;
    const name = matchedUser.user_metadata?.name || 'Admin/Staff Member';

    // 3. Send the recovery link via Brevo
    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <div style="background-color: #7c3aed; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Mountain Mama's Café Admin</h1>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="font-size: 16px; line-height: 24px;">Hello <strong>${name}</strong>,</p>
                <p style="font-size: 16px; line-height: 24px;">We received a request to reset the password for your Mountain Mama's Café Admin account.</p>
                
                <p style="font-size: 16px; line-height: 24px; margin-bottom: 24px;">Click the button below to reset your password. This link is valid for a limited time.</p>
                
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${actionLink}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Reset Your Password</a>
                </div>
                
                <p style="font-size: 14px; color: #6b7280; margin-top: 24px;">
                    If the button doesn't work, copy and paste this link into your browser: <br/>
                    <a href="${actionLink}" style="color: #7c3aed; word-break: break-all;">${actionLink}</a>
                </p>

                <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    If you did not request a password reset, you can safely ignore this email.
                </p>
            </div>
        </div>
    `;

    const emailResult = await sendEmail({
        to: [{ email, name }],
        subject: "Reset Password - Mountain Mama's Café Admin",
        htmlContent
    });

    if (!emailResult.success) {
        return { success: false, error: 'Failed to send password reset email.' };
    }

    return { success: true };
}
