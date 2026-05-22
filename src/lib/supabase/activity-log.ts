import { createAdminClient, createClient } from './server';

type EntityType = 'order' | 'meal' | 'company' | 'invoice' | 'contract' | 'auth' | 'config';

interface LogOptions {
    userId?: string | null;
    userEmail?: string | null;
    userRole?: 'admin' | 'company' | 'staff' | 'system';
    action: string;
    entityType?: EntityType;
    entityId?: string;
    details?: Record<string, any>;
}

/**
 * Log an activity to the activity_log table.
 * Uses admin client to bypass RLS.
 * 
 * Auto-detects current user if not provided (server-side only).
 */
export async function logActivity(options: LogOptions): Promise<void> {
    try {
        let { userEmail, userId, userRole } = options;

        // Try to auto-detect user if missing
        if (!userEmail) {
            try {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                    userEmail = user.email;
                    userId = user.id;
                    if (!userRole) {
                        userRole = user.user_metadata?.role === 'staff' ? 'staff' : 'admin';
                    }
                }
            } catch (e) {
                // Ignore errors during auto-detection
            }
        }

        const adminClient = createAdminClient();
        const { error: insertError } = await adminClient.from('activity_log').insert({
            user_id: userId || null,
            user_email: userEmail || null,
            user_role: userRole || 'system',
            action: options.action,
            entity_type: options.entityType || null,
            entity_id: options.entityId || null,
            details: options.details || {},
        });

        if (insertError) {
            console.error('[ActivityLog] Database insert error:', insertError);
        }
    } catch (error) {
        // Don't throw — logging should never break the main flow
        console.error('[ActivityLog] Critical failure in logging:', error);
    }
}
