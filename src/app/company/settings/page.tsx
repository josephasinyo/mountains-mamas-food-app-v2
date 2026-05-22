import { getCompanyAppConfig, getGlobalSettings, getCompanyFormFields } from '../actions';
import AppSettingsClient from './AppSettingsClient';

export default async function CompanySettingsPage() {
    const [configResult, globalResult, fieldsResult] = await Promise.all([
        getCompanyAppConfig(),
        getGlobalSettings(),
        getCompanyFormFields()
    ]);
    
    return <AppSettingsClient 
        initialData={configResult} 
        globalSettings={globalResult.success ? globalResult.settings : null} 
        formFieldsData={{
            globalFields: (fieldsResult.success ? fieldsResult.globalFields : []) ?? [],
            companyFields: (fieldsResult.success ? fieldsResult.companyFields : []) ?? []
        }}
    />;
}
