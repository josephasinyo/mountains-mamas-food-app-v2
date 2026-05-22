"use client";

import Link from 'next/link';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

interface ContractHeaderProps {
    companyName: string;
    contractStatus: string;
}

export function ContractHeader({ companyName, contractStatus }: ContractHeaderProps) {
    return (
        <header className="no-print sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-gray-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <Link 
                    href="/admin/companies" 
                    className="inline-flex items-center justify-center size-9 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-gray-500 hover:text-gray-900 transition-all"
                    title="Back to Dashboard"
                >
                    <ArrowLeft className="size-4" />
                </Link>
                <div>
                    <h1 className="text-sm font-black text-gray-900 leading-none">Catering Contract</h1>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{companyName}</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <ShieldCheck className="size-3.5 text-emerald-500" /> Digitally Signed
                </span>
                <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-200 transition-all cursor-pointer"
                >
                    <Printer className="size-3.5" /> Print / Save as PDF
                </button>
            </div>
        </header>
    );
}
