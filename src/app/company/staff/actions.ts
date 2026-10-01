'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { sendCompanyStaffInviteEmail } from '@/lib/brevo';
import { getCompanyId } from '@/app/company/actions';
import { logActivity } from '@/lib/supabase/activity-log';
import { revalidatePath } from 'next/cache';

export async function listCompanyStaffMembers() {
    try {
        const companyId = await getCompanyId();
        const adminClient = createAdminClient();

        const { data: { users }, error } = await adminClient.auth.admin.listUsers({
            perPage: 1000
        });

        if (error) {
            return { success: false, error: error.message };
        }

        const staff = users
            .filter((u: any) => {
                const meta = u.user_metadata || {};
                return meta.company_id === companyId && (meta.role === 'company_staff' || meta.role === 'staff');
            })
            .map((u: any) => ({
                id: u.id,
                email: u.email,
                name: u.user_metadata?.name || 'Unknown',
                accessible_pages: u.user_metadata?.accessible_pages || [],
                needs_password_change: u.user_metadata?.needs_password_change || false,
                suspended: u.user_metadata?.suspended || false,
                created_at: u.created_at,
                last_sign_in_at: u.last_sign_in_at,
            }));

        return { success: true, data: staff };
    } catch (error: any) {
        console.error('Error listing company staff:', error);
        return { success: false, error: error.message };
    }
}

export async function createCompanyStaffMember(data: { name: string; email: string; accessible_pages: string[] }) {
    try {
        const companyId = await getCompanyId();
        const adminClient = createAdminClient();

        // Fetch company name for email & logs
        const { data: company } = await adminClient
            .from('tour_companies')
            .select('name')
            .eq('id', companyId)
            .single();

        const companyName = company?.name || 'Your Company';

        // Generate a secure random password
        const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";

        const { data: userData, error } = await adminClient.auth.admin.createUser({
            email: data.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
                role: 'company_staff',
                company_id: companyId,
                name: data.name,
                accessible_pages: data.accessible_pages,
                needs_password_change: true,
                suspended: false
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        // Send the company email invite
        const emailResult = await sendCompanyStaffInviteEmail(data.email, data.name, companyName, tempPassword);

        await logActivity({
            action: 'create',
            entityType: 'auth',
            entityId: userData.user.id,
            details: { name: data.name, email: data.email, company_id: companyId }
        });

        revalidatePath('/company/staff');

        if (!emailResult.success) {
            return { success: true, warning: 'Staff member created, but invitation email could not be sent. Please share login details manually.' };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Error creating company staff member:', error);
        return { success: false, error: error.message };
    }
}

export async function updateCompanyStaffPermissions(id: string, accessible_pages: string[]) {
    try {
        const companyId = await getCompanyId();
        const adminClient = createAdminClient();

        // Verify user belongs to this company
        const { data: { user }, error: fetchError } = await adminClient.auth.admin.getUserById(id);
        if (fetchError || !user) throw new Error('User not found');
        if (user.user_metadata?.company_id !== companyId) {
            throw new Error('Unauthorized to modify this user');
        }

        const { error } = await adminClient.auth.admin.updateUserById(id, {
            user_metadata: {
                ...user.user_metadata,
                accessible_pages
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        await logActivity({
            action: 'update',
            entityType: 'auth',
            entityId: id,
            details: { accessible_pages, company_id: companyId }
        });

        revalidatePath('/company/staff');
        return { success: true };
    } catch (error: any) {
        console.error('Error updating company staff permissions:', error);
        return { success: false, error: error.message };
    }
}

export async function toggleCompanyStaffSuspension(id: string, suspend: boolean) {
    try {
        const companyId = await getCompanyId();
        const adminClient = createAdminClient();

        // Verify user belongs to this company
        const { data: { user }, error: fetchError } = await adminClient.auth.admin.getUserById(id);
        if (fetchError || !user) throw new Error('User not found');
        if (user.user_metadata?.company_id !== companyId) {
            throw new Error('Unauthorized to modify this user');
        }

        const { error } = await adminClient.auth.admin.updateUserById(id, {
            user_metadata: {
                ...user.user_metadata,
                suspended: suspend
            }
        });

        if (error) {
            return { success: false, error: error.message };
        }

        await logActivity({
            action: suspend ? 'suspend' : 'unsuspend',
            entityType: 'auth',
            entityId: id,
            details: { suspended: suspend, company_id: companyId }
        });

        revalidatePath('/company/staff');
        return { success: true };
    } catch (error: any) {
        console.error('Error toggling company staff suspension:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteCompanyStaffMember(id: string) {
    try {
        const companyId = await getCompanyId();
        const adminClient = createAdminClient();

        // Verify user belongs to this company
        const { data: { user }, error: fetchError } = await adminClient.auth.admin.getUserById(id);
        if (fetchError || !user) throw new Error('User not found');
        if (user.user_metadata?.company_id !== companyId) {
            throw new Error('Unauthorized to delete this user');
        }

        const { error } = await adminClient.auth.admin.deleteUser(id);

        if (error) {
            return { success: false, error: error.message };
        }

        await logActivity({
            action: 'delete',
            entityType: 'auth',
            entityId: id,
            details: { name: user.user_metadata?.name, email: user.email, company_id: companyId }
        });

        revalidatePath('/company/staff');
        return { success: true };
    } catch (error: any) {
        console.error('Error deleting company staff member:', error);
        return { success: false, error: error.message };
    }
}
