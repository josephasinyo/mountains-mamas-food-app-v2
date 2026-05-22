import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Sparkles, UtensilsCrossed, ShieldCheck, Compass, HelpCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function PublicMealDetail({ params }: PageProps) {
    const { id } = await params;
    const supabase = await createClient();

    // Fetch meal details by ID
    const { data: meal, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !meal) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#fafafc] via-[#f5f3ff]/40 to-[#fafafc] flex flex-col font-sans antialiased text-gray-900">
            {/* Header branding & CTA */}
            <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100/80 shadow-sm shadow-purple-50/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 select-none">
                        <span className="font-bebas text-xl sm:text-2xl tracking-[3px] uppercase bg-gray-900 text-white px-3 py-1 rounded skew-x-[-6deg] leading-none" style={{ fontFamily: 'var(--font-bebas), sans-serif' }}>MOUNTAIN</span>
                        <span className="font-pacifico text-2xl sm:text-3xl text-violet-600 leading-none -ml-1" style={{ fontFamily: 'var(--font-pacifico), cursive', textShadow: '2px 2px 0 rgba(255, 255, 255, 1), 3px 3px 0 rgba(0, 0, 0, 0.15)' }}>Mama&apos;s</span>
                    </Link>

                    <Link href="/company/register">
                        <button className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full border border-violet-200 hover:border-violet-300 text-violet-700 bg-violet-50/40 hover:bg-violet-50 hover:shadow-md hover:shadow-violet-100/50 font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 shrink-0">
                            Partner with us
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-grow max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                {/* Back button */}
                <div className="mb-6">
                    <Link href="/" className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-violet-600 transition-colors gap-1.5 group select-none">
                        <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to menu
                    </Link>
                </div>

                {/* Meal Detail Section */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
                    
                    {/* Meal Image */}
                    <div className="md:col-span-5 aspect-[4/3] md:aspect-square w-full rounded-[32px] overflow-hidden bg-purple-50 shadow-md border border-gray-100 relative">
                        {meal.image_url ? (
                            <img 
                                src={meal.image_url} 
                                alt={meal.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-violet-400 gap-2">
                                <UtensilsCrossed className="size-16 stroke-[1.5]" />
                                <span className="text-xs font-bold uppercase tracking-widest text-violet-400/80">Fresh Selection</span>
                            </div>
                        )}
                        <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 rounded-lg bg-white/95 backdrop-blur-md shadow-sm text-[10px] font-black uppercase tracking-wider text-violet-600 border border-violet-100/10">
                                {meal.category}
                            </span>
                        </div>
                    </div>

                    {/* Meal Meta info */}
                    <div className="md:col-span-7 space-y-6">
                        <div className="space-y-3">
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-bold uppercase tracking-wider border border-violet-100">
                                <Sparkles className="size-3 fill-violet-500 text-violet-500" />
                                Custom Options Available
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                                {meal.name}
                            </h2>
                        </div>

                        <div className="space-y-4 text-gray-600">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Description & Ingredients</h4>
                            <p className="leading-relaxed font-medium text-gray-600 text-base">
                                {meal.description || 'Our signature box lunch is freshly prepared on the day of your tour using high-quality local ingredients. Tour guides can configure dynamic choices (e.g. customized artisan bread and bakery-fresh cookies) matching individual guest tastes.'}
                            </p>
                        </div>

                        {meal.box_includes && (
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">Box Lunch Includes</h4>
                                <div className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                    <p className="text-sm font-semibold text-gray-600 leading-relaxed whitespace-pre-line">
                                        {meal.box_includes}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Call-to-Action Split Panel */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                    
                    {/* Panel 1: For Tour Companies */}
                    <Card className="border-none rounded-[32px] overflow-hidden bg-white shadow-xl shadow-purple-100/10 relative p-6 sm:p-8 flex flex-col justify-between">
                        {/* Decorative subtle gradient */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-gradient-to-br from-violet-200/20 to-purple-200/20 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="space-y-4">
                            <div className="size-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center shadow-inner">
                                <Compass className="size-6 stroke-[2]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-extrabold text-gray-900">Partner With Us</h3>
                                <p className="text-xs font-bold text-violet-500 uppercase tracking-widest">For Tour Companies & Guides</p>
                            </div>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                Join our partner network of elite tour operators. Streamline your tour lunch coordination with custom pricing, direct monthly invoicing, custom bread & cookie defaults, and real-time guide scheduling.
                            </p>
                        </div>

                        <div className="mt-8">
                            <Link href="/company/register" className="block w-full">
                                <button className="w-full py-3.5 sm:py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-xs tracking-wider uppercase transition-all duration-300 shadow-lg shadow-violet-200/80 hover:shadow-xl hover:shadow-violet-200 hover:-translate-y-0.5">
                                    Register Tour Company
                                </button>
                            </Link>
                        </div>
                    </Card>

                    {/* Panel 2: For Individual Guests */}
                    <Card className="border-none rounded-[32px] overflow-hidden bg-white shadow-xl shadow-purple-100/10 relative p-6 sm:p-8 flex flex-col justify-between">
                        {/* Decorative subtle gradient */}
                        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-gradient-to-br from-amber-200/10 to-orange-200/20 rounded-full blur-2xl pointer-events-none" />
                        
                        <div className="space-y-4">
                            <div className="size-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                                <HelpCircle className="size-6 stroke-[2]" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-extrabold text-gray-900">Individual Guest Ordering</h3>
                                <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">For Tour Guests & Travelers</p>
                            </div>
                            <p className="text-sm font-medium text-gray-500 leading-relaxed">
                                Are you a guest traveling with one of our registered tour partners? All guest ordering and dietary selections are kept private and secure. Please contact your guide or tour representative to obtain your private link to place your order.
                              </p>
                        </div>

                        <div className="mt-8 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-3">
                            <ShieldCheck className="size-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-amber-800">Private Tour Link Required</p>
                                <p className="text-[11px] font-medium text-amber-700/90 mt-0.5">Guest orders are mapped directly to corresponding tours for flawless delivery.</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400 font-semibold tracking-wide mt-12">
                © 2026 Mountain Mama&apos;s Café · Partner Network
            </footer>
        </div>
    );
}
