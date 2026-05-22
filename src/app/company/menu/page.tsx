import { getCompanyMenuSelections } from '../actions';
import MenuManagementClient from './MenuManagementClient';

export default async function CompanyMenuPage() {
    const data = await getCompanyMenuSelections();
    
    return <MenuManagementClient initialData={data} />;
}
