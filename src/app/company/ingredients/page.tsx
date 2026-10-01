export const dynamic = 'force-dynamic';

import { getCompanyIngredients } from '../actions';
import CompanyIngredientsClient from './CompanyIngredientsClient';

export default async function CompanyIngredientsPage() {
    const data = await getCompanyIngredients();
    
    return <CompanyIngredientsClient initialData={data} />;
}
