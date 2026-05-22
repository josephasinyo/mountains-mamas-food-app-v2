import { listStaffMembers } from './actions';
import { StaffClient } from './StaffClient';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default async function AdminStaffPage() {
    const result = await listStaffMembers();

    if (!result.success || !result.data) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 mt-1">Manage admin portal access for your team members.</p>
                </div>
                <Card className="p-8 text-center border-red-200 bg-red-50 text-red-700 rounded-2xl">
                    <Shield className="size-8 text-red-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold mb-1">Failed to load staff</h3>
                    <p>{result.error}</p>
                </Card>
            </div>
        );
    }

    return <StaffClient initialStaff={result.data} />;
}
