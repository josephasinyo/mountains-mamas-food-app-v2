import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LogIn, ShieldAlert } from 'lucide-react';
import ManualViewer from '@/components/manual/ManualViewer';
import { ADMIN_MANUAL_DATA } from '@/lib/manuals-data';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Admin & Staff User Manual — Mountain Mama's Café",
    description: "Operational manual and administrative platform guide.",
};

export default function PublicAdminManualPage() {
    return (
        <div className="min-h-screen bg-slate-50/70 text-gray-900 flex flex-col">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/80 px-4 md:px-8 py-3.5 transition-all print:hidden">
                <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md shadow-purple-200">
                            <ShieldAlert className="size-5" />
                        </div>
                        <div>
                            <div className="font-black text-sm text-gray-900 tracking-tight leading-none">
                                Mountain Mama&apos;s Café
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">
                                Catering Administration &bull; Operations Manual
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link href="/admin/login">
                            <Button
                                size="sm"
                                className="rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-sm gap-1.5 h-9"
                            >
                                <LogIn className="size-3.5" />
                                <span>Admin Login</span>
                            </Button>
                        </Link>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8">
                <ManualViewer data={ADMIN_MANUAL_DATA} />
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-200 bg-white py-6 px-4 text-center text-xs text-gray-500 font-medium print:hidden">
                &copy; {new Date().getFullYear()} Mountain Mama&apos;s Café. All rights reserved.
            </footer>
        </div>
    );
}
