'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { sendStaffInviteEmail } from '@/lib/brevo';

export async function listStaffMembers() {
    const adminClient = createAdminClient();
    
    // We fetch users and filter them because Supabase doesn't have a direct way 
    // to query users by metadata via the Admin API without iterating.
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({
        perPage: 1000 // A cafe won't have 1000 staff members, this is sufficient.
    });

    if (error) {
        return { success: false, error: error.message };
    }

    const staff = users.filter((u: any) => u.user_metadata?.role === 'staff').map((u: any) => ({
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
}

export async function createStaffMember(data: { name: string; email: string; accessible_pages: string[] }) {
    const adminClient = createAdminClient();
    
    // Generate a secure random password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8) + "!";

    const { data: userData, error } = await adminClient.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
            role: 'staff',
            name: data.name,
            accessible_pages: data.accessible_pages,
            needs_password_change: true,
            suspended: false
        }
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Send the email invite
    const emailResult = await sendStaffInviteEmail(data.email, data.name, tempPassword);
    
    if (!emailResult.success) {
        // We still successfully created the user, but the email failed.
        // Returning a soft error so the admin knows they might need to resend manually.
        return { success: true, warning: 'User created but failed to send invite email.' };
    }

    return { success: true };
}

export async function updateStaffPermissions(id: string, accessible_pages: string[]) {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(id, {
        user_metadata: { accessible_pages }
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function toggleStaffSuspension(id: string, suspend: boolean) {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.updateUserById(id, {
        user_metadata: { suspended: suspend }
    });

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deleteStaffMember(id: string) {
    const adminClient = createAdminClient();

    const { error } = await adminClient.auth.admin.deleteUser(id);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}
