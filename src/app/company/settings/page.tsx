import { getCompanyAppConfig, getGlobalSettings, getCompanyFormFields, getActiveMasterMealTypes } from '../actions';
import AppSettingsClient from './AppSettingsClient';

export default async function CompanySettingsPage() {
    const [configResult, globalResult, fieldsResult, activeMasterMealTypes] = await Promise.all([
        getCompanyAppConfig(),
        getGlobalSettings(),
        getCompanyFormFields(),
        getActiveMasterMealTypes()
    ]);
    
    return <AppSettingsClient 
        initialData={configResult} 
        globalSettings={globalResult.success ? globalResult.settings : null} 
        formFieldsData={{
            globalFields: (fieldsResult.success ? fieldsResult.globalFields : []) ?? [],
            companyFields: (fieldsResult.success ? fieldsResult.companyFields : []) ?? []
        }}
        activeMasterMealTypes={activeMasterMealTypes}
    />;
}
