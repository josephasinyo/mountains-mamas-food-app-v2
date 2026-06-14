import { getCompanyBySlug, getCompanyMeals } from '@/lib/supabase/public-actions';
import FoodSearchWrapper from '@/components/food/FoodSearchWrapper';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface CompanyOrderPageProps {
    params: Promise<{ slug: string }>;
}

export default async function CompanyOrderPage({ params }: CompanyOrderPageProps) {
    const { slug } = await params;
    
    // Fetch company details
    const companyResult = await getCompanyBySlug(slug);
    
    if (!companyResult.success || !companyResult.company) {
        return notFound();
    }

    const company = companyResult.company;
    
    // Extract app config
    const rawConfig = company?.company_app_config;
    const config = Array.isArray(rawConfig) ? rawConfig[0] : rawConfig;

    // Fetch company selected meals
    const mealsResult = await getCompanyMeals(company.id);
    const meals = mealsResult.success ? mealsResult.meals || [] : [];
    
    return (
        <div className="container mx-auto px-4 py-8">
            {config?.custom_welcome_message && (
                <div className="mb-8 p-6 text-center max-w-3xl mx-auto space-y-2">
                    <div className="inline-flex items-center justify-center size-14 rounded-full bg-violet-50 text-violet-600 text-3xl mb-1 select-none">
                        👋
                    </div>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed max-w-xl mx-auto">
                        {config.custom_welcome_message}
                    </p>
                </div>
            )}
            <FoodSearchWrapper initialItems={meals} />
        </div>
    );
}
