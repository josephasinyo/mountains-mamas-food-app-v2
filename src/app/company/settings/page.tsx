export const dynamic = 'force-dynamic';

import { getCompanyAppConfig, getCompanyFormFields, getActiveMasterMealTypes } from '../actions';
import AppSettingsClient from './AppSettingsClient';

export default async function CompanySettingsPage() {
    const [configResult, fieldsResult, activeMasterMealTypes] = await Promise.all([
        getCompanyAppConfig(),
        getCompanyFormFields(),
        getActiveMasterMealTypes()
    ]);
    
    return <AppSettingsClient 
        initialData={configResult} 
        globalSettings={null} 
        formFieldsData={{
            globalFields: (fieldsResult.success ? fieldsResult.globalFields : []) ?? [],
            companyFields: (fieldsResult.success ? fieldsResult.companyFields : []) ?? []
        }}
        activeMasterMealTypes={activeMasterMealTypes}
    />;
}
