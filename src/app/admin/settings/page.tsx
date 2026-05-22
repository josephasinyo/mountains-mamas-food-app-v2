import { getGlobalSettings, getFormFieldDefinitions } from './actions';
import AppSettingsClient from './AppSettingsClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'App Settings | Admin Dashboard',
  description: 'Manage global application settings and options.',
};

export default async function AppSettingsPage() {
  const [settingsResult, fieldsResult] = await Promise.all([
    getGlobalSettings(),
    getFormFieldDefinitions()
  ]);
  
  if (!settingsResult.success) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
          <p className="font-bold">Error loading settings</p>
          <p className="text-sm">{settingsResult.error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8">
      <AppSettingsClient 
        initialSettings={settingsResult.settings} 
        initialFields={fieldsResult.success ? fieldsResult.fields : []}
      />
    </div>
  );
}
