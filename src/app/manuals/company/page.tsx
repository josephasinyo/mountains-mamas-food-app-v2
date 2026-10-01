import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, LogIn, Utensils } from 'lucide-react';
import ManualViewer from '@/components/manual/ManualViewer';
import { COMPANY_MANUAL_DATA } from '@/lib/manuals-data';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Tour Company & Staff User Manual — Mountain Mama's Café",
    description: "Complete operational guide and instructions for tour operators, dispatchers, and field guides.",
};

export default function PublicCompanyManualPage() {
    return (
        <div className="min-h-screen bg-slate-50/70 text-gray-900 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-8 py-3.5 transition-all print:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-md shadow-violet-200">
                            <Utensils className="size-5" />
                        </div>
                        <div>
                            <div className="font-black text-sm text-gray-900 tracking-tight leading-none">
                                Mountain Mama&apos;s Café
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                                Partner Network &bull; Company Manual
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/company/login">
                            <Button
                                size="sm"
                                className="rounded-xl font-bold text-xs bg-violet-600 hover:bg-violet-700 text-white shadow-sm gap-1.5 h-9"
                            >
                                <LogIn className="size-3.5" />
                                <span>Partner Login</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8">
                <ManualViewer data={COMPANY_MANUAL_DATA} />
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-500 font-medium print:hidden">
                &copy; {new Date().getFullYear()} Mountain Mama&apos;s Café. All rights reserved.
            </footer>
        </div>
    );
}
