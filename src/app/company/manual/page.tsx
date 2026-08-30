import ManualViewer from '@/components/manual/ManualViewer';
import { COMPANY_MANUAL_DATA } from '@/lib/manuals-data';

export const dynamic = 'force-dynamic';

export default function CompanyManualPage() {
    return <ManualViewer data={COMPANY_MANUAL_DATA} />;
}
