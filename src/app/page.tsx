import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, UtensilsCrossed, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Home({ searchParams }: PageProps) {
    const supabase = await createClient();
    
    // Fetch all active meals
    const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#fafafc] via-[#f5f3ff]/40 to-[#fafafc] flex flex-col font-sans antialiased text-gray-900">
            {/* Header branding & CTA */}
            <header className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100/80 shadow-sm shadow-purple-50/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2 select-none">
                        <span className="font-bebas text-xl sm:text-2xl tracking-[3px] uppercase bg-gray-900 text-white px-3 py-1 rounded skew-x-[-6deg] leading-none" style={{ fontFamily: 'var(--font-bebas), sans-serif' }}>MOUNTAIN</span>
                        <span className="font-pacifico text-2xl sm:text-3xl text-violet-600 leading-none -ml-1" style={{ fontFamily: 'var(--font-pacifico), cursive', textShadow: '2px 2px 0 rgba(255, 255, 255, 1), 3px 3px 0 rgba(0, 0, 0, 0.15)' }}>Mama&apos;s</span>
                    </div>

                    <Link href="/company/register">
                        <button className="px-4 py-2 sm:px-6 sm:py-2.5 rounded-full border border-violet-200 hover:border-violet-300 text-violet-700 bg-violet-50/40 hover:bg-violet-50 hover:shadow-md hover:shadow-violet-100/50 font-bold text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 shrink-0">
                            Partner with us
                        </button>
                    </Link>
                </div>
            </header>

            {/* Main Hero & Meal Grid */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
                
                {/* Hero section */}
                <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-bold tracking-wide uppercase shadow-sm">
                        <Sparkles className="size-3.5 fill-violet-600" />
                        Partner Lunch Menu
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                        Gourmet Box Lunches <br/>
                        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">Crafted For The Best Tours</span>
                    </h1>
                    <p className="text-gray-500 font-medium text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                        We collaborate with premium tour companies to deliver beautifully curated, fresh box lunches. Explore our selections below.
                    </p>
                </div>

                {/* Meals Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                    {meals && meals.length > 0 ? (
                        meals.map((meal) => (
                            <Link key={meal.id} href={`/public-meal/${meal.id}`} className="group block h-full">
                                <Card className="h-full border-none rounded-[32px] overflow-hidden bg-white hover:shadow-[0_32px_64px_-16px_rgba(109,40,217,0.12)] transition-all duration-500 hover:-translate-y-1 relative shadow-lg shadow-purple-100/20">
                                    
                                    {/* Meal Image */}
                                    <div className="aspect-[4/3] w-full overflow-hidden bg-purple-50/50 relative">
                                        {meal.image_url ? (
                                            <img 
                                                src={meal.image_url} 
                                                alt={meal.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-violet-400 gap-2">
                                                <UtensilsCrossed className="size-12 stroke-[1.5]" />
                                                <span className="text-xs font-bold uppercase tracking-widest text-violet-400/80">Fresh Selection</span>
                                            </div>
                                        )}
                                        {/* Category Badge */}
                                        <div className="absolute top-4 left-4">
                                            <span className="px-3 py-1 rounded-lg bg-white/95 backdrop-blur-md shadow-sm text-[10px] font-black uppercase tracking-wider text-violet-600 border border-violet-100/10">
                                                {meal.category}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <CardContent className="p-6 sm:p-8 flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-violet-600 transition-colors duration-300">
                                                {meal.name}
                                            </h3>
                                            <p className="text-sm font-medium text-gray-500 leading-relaxed line-clamp-3">
                                                {meal.description || 'Delicately prepared box lunch containing fresh ingredients, local bread, and signature treats.'}
                                            </p>
                                        </div>

                                        <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                                            
                                            <span className="text-gray-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all duration-300 flex items-center gap-1">
                                                View Details <ArrowRight className="size-3.5" />
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-16 text-center text-gray-400 font-medium bg-white rounded-3xl shadow-sm border border-gray-50">
                            No menu items are currently published. Please check back later.
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="w-full bg-white border-t border-gray-100 py-8 text-center text-xs text-gray-400 font-semibold tracking-wide">
                © 2026 Mountain Mama&apos;s Café · Partner Network
            </footer>
        </div>
    );
}
