import ManualViewer from '@/components/manual/ManualViewer';
import { ADMIN_MANUAL_DATA } from '@/lib/manuals-data';

export const dynamic = 'force-dynamic';

export default function AdminManualPage() {
    return <ManualViewer data={ADMIN_MANUAL_DATA} />;
}
