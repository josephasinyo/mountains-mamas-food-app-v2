export interface EmailRecipient {
    email: string;
    name?: string;
}

export interface SendEmailOptions {
    to: EmailRecipient[];
    bcc?: EmailRecipient[];
    subject: string;
    htmlContent: string;
    sender?: EmailRecipient;
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_SENDER: EmailRecipient = {
    email: process.env.EMAIL_FROM_ADDRESS || 'mountainmamascafe@gmail.com',
    name: process.env.EMAIL_FROM_NAME || "Mountain Mama's Café"
};

import fs from 'fs';
import path from 'path';

export async function sendEmail(options: SendEmailOptions) {
    const apiKey = process.env.BREVO_API_KEY;
    const logFile = path.join(process.cwd(), 'email-debug.log');

    const log = (msg: string) => {
        const timestamp = new Date().toISOString();
        try {
            fs.appendFileSync(logFile, `[${timestamp}] [Brevo] ${msg}\n`);
        } catch (e) { }
    };

    if (!apiKey) {
        log('Error: BREVO_API_KEY is missing');
        return { success: false, error: 'API key missing' };
    }

    log(`Attempting to send email to: ${options.to.map(r => r.email).join(', ')}`);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        const bccList = options.bcc ? [...options.bcc] : [];
        if (process.env.BCC_EMAIL && !bccList.some(r => r.email === process.env.BCC_EMAIL)) {
            bccList.push({ email: process.env.BCC_EMAIL });
        }

        const requestBody = {
            sender: options.sender || DEFAULT_SENDER,
            to: options.to,
            bcc: bccList.length > 0 ? bccList : undefined,
            subject: options.subject,
            htmlContent: options.htmlContent,
        };

        log(`Sending POST request to Brevo with payload: ${JSON.stringify({ ...requestBody, htmlContent: '...' })}`);
        const response = await fetch(BREVO_API_URL, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': apiKey,
                'content-type': 'application/json',
            },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        log(`Response received (Status: ${response.status})`);

        const responseData = await response.json();

        if (!response.ok) {
            log(`Error Response: ${JSON.stringify(responseData)}`);
            throw new Error(responseData.message || 'Failed to send email');
        }

        log(`Success! MessageId: ${responseData.messageId}`);
        return { success: true, messageId: responseData.messageId };
    } catch (error: any) {
        log(`Unexpected Error: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * Sends an invitation email to a newly created tour company.
 */
export async function sendInvitationEmail(companyEmail: string, companyName: string, tempPassword: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/company/login`;
    const adminEmail = process.env.ADMIN_EMAIL || 'mountainmamascafe@gmail.com';

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <div style="background-color: #7c3aed; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Mountain Mama's Café</h1>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="font-size: 16px; line-height: 24px;">Hello <strong>${companyName}</strong>,</p>
                <p style="font-size: 16px; line-height: 24px;">Your tour company account has been created. You can now access your dashboard to manage your menu, view orders, and more.</p>
                
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Temporary Login Credentials</p>
                    <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${companyEmail}</p>
                    <p style="margin: 8px 0 0 0; font-size: 16px;"><strong>Password:</strong> ${tempPassword}</p>
                </div>
                
                <a href="${loginUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Login to Dashboard</a>
                
                <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; pt-24px; padding-top: 24px;">
                    If you have any questions, please contact Kim at mountainmamascafe@gmail.com
                </p>
            </div>
        </div>
    `;

    return sendEmail({
        to: [{ email: companyEmail, name: companyName }],
        bcc: [{ email: adminEmail, name: "Mountain Mama's Café Admin" }],
        subject: "Invitation: Your Mountain Mama's Café Dashboard",
        htmlContent
    });
}

/**
 * Sends an activation confirmation email to a newly approved tour company.
 */
export async function sendActivationEmail(companyEmail: string, companyName: string, companySlug?: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://mountainmamascafe.app'}/company/login`;
    const orderUrl = companySlug 
        ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://mountainmamascafe.app'}/${companySlug}`
        : null;

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <div style="background-color: #10b981; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Account Activated!</h1>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="font-size: 16px; line-height: 24px;">Hello <strong>${companyName}</strong>,</p>
                <p style="font-size: 16px; line-height: 24px;">Great news! Your partner account at <strong>Mountain Mama's Café</strong> has been successfully reviewed and is now <strong>Active</strong>.</p>
                
                <p style="font-size: 16px; line-height: 24px;">You can now log in to your dashboard to manage your menu offerings, configure your order settings, and track guest order tickets in real-time.</p>
                
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Login Profile</p>
                    <p style="margin: 0; font-size: 15px;"><strong>Email:</strong> ${companyEmail}</p>
                    <p style="margin: 6px 0 0 0; font-size: 15px;"><strong>Password:</strong> [Use the password you entered during registration]</p>
                    ${orderUrl ? `
                    <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #e5e7eb;">
                        <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Your Guest Ordering Link</p>
                        <p style="margin: 0 0 8px 0; font-size: 14px; color: #4b5563;">Share this dedicated link with your guests so they can place their custom lunch orders:</p>
                        <p style="margin: 0; font-size: 15px;"><a href="${orderUrl}" style="color: #10b981; font-weight: bold; text-decoration: underline;">${orderUrl}</a></p>
                    </div>
                    ` : ''}
                </div>

                <div style="margin: 32px 0; text-align: center;">
                    <a href="${loginUrl}" style="display: inline-block; background-color: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Go to Company Dashboard</a>
                </div>
                
                <p style="font-size: 15px; line-height: 24px; color: #4b5563;">Please use the email and password you provided during registration to sign in.</p>
                
                <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    If you have any questions or need help setting up, please reply to this email or contact us at mountainmamascafe@gmail.com
                </p>
            </div>
        </div>
    `;

    return sendEmail({
        to: [{ email: companyEmail, name: companyName }],
        subject: "Your Account Has Been Activated! — Mountain Mama's Café",
        htmlContent
    });
}

import { formatFieldName, STANDARD_ITEM_KEYS } from './format-field-name';

function formatBoxType(box: string | null | undefined): string {
    if (!box) return '';
    if (box.toLowerCase().startsWith('this is a')) return box;
    return box
        .replace(/junior box lunch/i, 'Junior Box')
        .replace(/junior bag lunch/i, 'Junior Bag')
        .replace(/box lunch/i, 'Box Lunch')
        .replace(/bag lunch/i, 'Bag Lunch')
        .replace(/junior box/i, 'Junior Box')
        .replace(/standard box/i, 'Box Lunch')
        .replace(/sandwich only/i, 'Sandwich only');
}

/**
 * Sends a notification email to the company when a new order is placed.
 */
export async function sendOrderNotificationEmail(companyEmail: string, companyName: string, order: any, items: any[]) {
    const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/company/orders`;

    const paymentMethod = order.paymentMethod || order.payment_method || 'monthly_invoice';
    const isDirectPay = paymentMethod === 'stripe' || paymentMethod === 'direct_pay';

    const itemsHtml = items.map(item => {
        const details: string[] = [];

        const rawBoxType = item.box_type || item.selectedOption;
        if (rawBoxType) {
            const formatted = formatBoxType(rawBoxType);
            if (formatted) {
                details.push(`<strong>Type:</strong> ${formatted}`);
            }
        }

        if (item.bread_type) {
            details.push(`<strong>Bread Options:</strong> ${item.bread_type}`);
        }
        if (item.cookie_choice) {
            details.push(`<strong>Cookie Options:</strong> ${item.cookie_choice}`);
        }

        // Render any extra dynamic fields/custom choices (sandwich options, dressing, etc.)
        if (item.dynamic_fields && typeof item.dynamic_fields === 'object') {
            Object.entries(item.dynamic_fields).forEach(([key, val]) => {
                if (val && !STANDARD_ITEM_KEYS.includes(key)) {
                    details.push(`<strong>${formatFieldName(key)}:</strong> ${val}`);
                }
            });
        }

        if (item.guest_name) {
            details.push(`<strong style="color: #7c3aed;">Guest Name:</strong> <span style="color: #7c3aed;">${item.guest_name}</span>`);
        }
        if (item.customizations) {
            details.push(`<strong style="color: #dc2626; font-style: italic;">Allergy Alert:</strong> <span style="color: #dc2626; font-style: italic;">${item.customizations}</span>`);
        }

        const detailsHtml = details.length > 0
            ? `<div style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.6; border-left: 2px solid #e5e7eb; padding-left: 10px;">
                 ${details.join('<br />')}
               </div>`
            : '';

        return `
            <tr style="border-bottom: 1px solid #f3f4f6;">
                <td style="padding: 16px 0; vertical-align: top;">
                    <p style="margin: 0; font-weight: bold; font-size: 18px; color: #111827;">${item.quantity}x ${item.name}</p>
                    ${detailsHtml}
                </td>
                ${isDirectPay ? `
                <td style="padding: 16px 0; text-align: right; vertical-align: top;">
                    <p style="margin: 0; font-weight: bold; font-size: 18px; color: #111827;">$${(item.unitPrice * item.quantity).toFixed(2)}</p>
                </td>
                ` : ''}
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <div style="background-color: #10b981; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">New Order Received!</h1>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="font-size: 16px; line-height: 24px;">Hello <strong>${companyName}</strong>,</p>
                <p style="font-size: 16px; line-height: 24px;">A new order has been placed for your tour on <strong>${order.tourDate}</strong>.</p>
                
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <div style="margin-bottom: 16px;">
                        <span style="display: block; font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Customer</span>
                        <span style="font-size: 16px; font-weight: bold; color: #111827;">${order.fullName}</span>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <span style="display: block; font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Tour Date</span>
                        <span style="font-size: 16px; font-weight: bold; color: #111827;">${order.tourDate}</span>
                    </div>
                    <div style="margin-bottom: 16px;">
                        <span style="display: block; font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Guide Name</span>
                        <span style="font-size: 16px; font-weight: bold; color: #111827;">${order.guideName || 'N/A'}</span>
                    </div>
                    <div>
                        <span style="display: block; font-size: 12px; color: #6b7280; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px;">Pick-up Time</span>
                        <span style="font-size: 16px; font-weight: bold; color: #111827;">${order.pickUpTime || 'N/A'}</span>
                    </div>
                </div>

                <h3 style="font-size: 16px; font-weight: bold; margin: 24px 0 12px 0; border-bottom: 2px solid #f3f4f6; padding-bottom: 8px;">Order Summary</h3>
                <table style="width: 100%; border-collapse: collapse;">
                    ${itemsHtml}
                </table>

                ${order.notes ? `
                    <div style="margin-top: 24px; padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
                        <p style="margin: 0 0 4px 0; font-size: 12px; color: #92400e; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">Additional Notes</p>
                        <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;">${order.notes}</p>
                    </div>
                ` : ''}
                
                <div style="margin-top: 32px; text-align: center;">
                    <a href="${dashboardUrl}" style="display: inline-block; background-color: #111827; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">View in Dashboard</a>
                </div>
            </div>
        </div>
    `;

    const recipients: EmailRecipient[] = [{ email: companyEmail, name: companyName }];
    if (process.env.ADMIN_EMAIL) {
        recipients.push({ email: process.env.ADMIN_EMAIL, name: "Mountain Mama's Café Admin" });
    }

    return sendEmail({
        to: recipients,
        subject: `🧺 New Order — ${companyName} | ${order.tourDate}`,
        htmlContent
    });
}

/**
 * Sends an invitation email to a newly created staff member.
 */
export async function sendStaffInviteEmail(staffEmail: string, staffName: string, tempPassword: string) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/login`;

    const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
            <div style="background-color: #7c3aed; padding: 32px; text-align: center; border-radius: 16px 16px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Welcome to Mountain Mama's Café Admin</h1>
            </div>
            <div style="padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 16px 16px;">
                <p style="font-size: 16px; line-height: 24px;">Hello <strong>${staffName}</strong>,</p>
                <p style="font-size: 16px; line-height: 24px;">Kim has invited you to join the admin portal for Mountain Mama's Café. You now have access to the staff dashboard to help manage operations.</p>
                
                <div style="background-color: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280; font-weight: bold; text-transform: uppercase;">Temporary Login Credentials</p>
                    <p style="margin: 0; font-size: 16px;"><strong>Email:</strong> ${staffEmail}</p>
                    <p style="margin: 8px 0 0 0; font-size: 16px;"><strong>Password:</strong> ${tempPassword}</p>
                </div>
                
                <p style="font-size: 15px; color: #dc2626; font-weight: bold;">Note: You will be prompted to change this temporary password the first time you log in.</p>

                <a href="${loginUrl}" style="display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin-top: 16px;">Login to Admin Portal</a>
                
                <p style="margin-top: 32px; font-size: 14px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 24px;">
                    If you have any questions, please contact Kim at mountainmamascafe@gmail.com
                </p>
            </div>
        </div>
    `;

    return sendEmail({
        to: [{ email: staffEmail, name: staffName }],
        subject: "Invitation: Staff Access to Mountain Mama's Café",
        htmlContent
    });
}
