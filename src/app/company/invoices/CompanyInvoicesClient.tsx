'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
    FileText, CreditCard, CheckCircle2, Clock, 
    ArrowUpRight, Download, Search, Printer, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatDateUS, formatCurrency } from '@/lib/utils';

interface CompanyInvoicesClientProps {
    initialData: {
        success: boolean;
        company?: any;
        invoices: any[];
        stats: {
            totalInvoices: number;
            paidCount: number;
            unpaidCount: number;
            totalPaidAmount: number;
            totalUnpaidAmount: number;
        };
        error?: string;
    };
}

export default function CompanyInvoicesClient({ initialData }: CompanyInvoicesClientProps) {
    const { invoices = [], stats, company } = initialData;
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'paid'>('all');

    const filteredInvoices = invoices.filter(inv => {
        // Status filter
        if (statusFilter === 'unpaid' && (inv.status === 'paid' || inv.status === 'draft')) return false;
        if (statusFilter === 'paid' && inv.status !== 'paid') return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const refId = inv.id.toLowerCase();
        const periodStr = `${inv.period_start} ${inv.period_end}`.toLowerCase();
        const amountStr = inv.total_amount.toString();

        return refId.includes(q) || periodStr.includes(q) || amountStr.includes(q);
    });

    const statCards = [
        {
            title: 'Total Paid',
            value: formatCurrency(stats?.totalPaidAmount || 0),
            subtext: `${stats?.paidCount || 0} invoices settled`,
            icon: CheckCircle2,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
        },
        {
            title: 'Outstanding Balance',
            value: formatCurrency(stats?.totalUnpaidAmount || 0),
            subtext: `${stats?.unpaidCount || 0} unpaid invoices`,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
        },
        {
            title: 'Total Invoices',
            value: stats?.totalInvoices || 0,
            subtext: 'All time invoices',
            icon: FileText,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
        },
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    function getPaymentMethodLabel(inv: any) {
        if (inv.status !== 'paid') return '—';
        const pmDetails = inv.payment_method_details;
        const pmType = inv.payment_method_type;

        if (pmDetails?.display) return pmDetails.display;
        if (pmType === 'card') return 'Credit / Debit Card';
        if (pmType === 'ach') return 'Bank Account (ACH)';
        if (pmType === 'check') return 'Paid via Check';
        return 'Online Payment';
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Invoices & Receipts</h1>
                <p className="text-gray-500 font-medium mt-1">
                    View, download, and pay billing statements for {company?.name || 'your company'}.
                </p>
            </div>

            {/* Stats Overview */}
            <motion.div 
                variants={container}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
                {statCards.map((card, i) => (
                    <motion.div key={i} variants={item}>
                        <Card className="border-none shadow-sm shadow-gray-200/50 rounded-[24px] overflow-hidden hover:shadow-md transition-all group">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className={`size-12 rounded-2xl ${card.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                                        <card.icon className={`size-6 ${card.color}`} />
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-gray-900 tracking-tighter">{card.value}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{card.title}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400">{card.subtext}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            {/* Invoices List Card */}
            <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[32px] overflow-hidden bg-white">
                <CardHeader className="p-8 border-b border-gray-50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-xl font-bold text-gray-900">Invoice History</CardTitle>
                        <CardDescription className="font-medium">All historical invoices are permanently stored here for your recordkeeping.</CardDescription>
                    </div>

                    {/* Filter & Search Controls */}
                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                        <div className="relative flex-1 md:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                            <Input
                                placeholder="Search by ID or amount..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-xl border-gray-200 text-xs font-medium focus:ring-violet-500 focus:border-violet-500"
                            />
                        </div>

                        <div className="flex rounded-xl bg-gray-100 p-1 border border-gray-200/60 text-xs font-bold">
                            <button
                                onClick={() => setStatusFilter('all')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                All ({invoices.length})
                            </button>
                            <button
                                onClick={() => setStatusFilter('unpaid')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'unpaid' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Unpaid ({stats?.unpaidCount || 0})
                            </button>
                            <button
                                onClick={() => setStatusFilter('paid')}
                                className={`px-3 py-1.5 rounded-lg transition-all ${statusFilter === 'paid' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                Paid ({stats?.paidCount || 0})
                            </button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Invoice Ref / Period</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Amount</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                    <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Payment Method</th>
                                    <th className="px-8 py-4 text-right text-[11px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredInvoices.length > 0 ? (
                                    filteredInvoices.map((inv) => {
                                        const isPaid = inv.status === 'paid';
                                        const isSent = inv.status === 'sent';
                                        const isOverdue = inv.status === 'overdue';
                                        const payUrl = `/invoice/${inv.id}/pay`;

                                        return (
                                            <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                                                <td className="px-8 py-5">
                                                    <div>
                                                        <p className="font-bold text-sm text-gray-900">
                                                            Invoice #{inv.id.slice(0, 8).toUpperCase()}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {formatDateUS(inv.period_start)} — {formatDateUS(inv.period_end)}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-8 py-5">
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">
                                                            {formatCurrency(inv.total_amount)}
                                                        </p>
                                                        {inv.tip_amount > 0 && (
                                                            <p className="text-[10px] font-bold text-emerald-600">
                                                                + {formatCurrency(inv.tip_amount)} tip
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                <td className="px-8 py-5">
                                                    <Badge 
                                                        variant="outline" 
                                                        className={`rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider border-transparent shadow-none ${
                                                            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                            isSent ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            isOverdue ? 'bg-rose-50 text-rose-700 border-rose-200' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}
                                                    >
                                                        {inv.status.toUpperCase()}
                                                    </Badge>
                                                    {isPaid && inv.paid_at && (
                                                        <p className="text-[10px] font-medium text-gray-400 mt-1">
                                                            Paid {formatDateUS(inv.paid_at)}
                                                        </p>
                                                    )}
                                                </td>

                                                <td className="px-8 py-5">
                                                    <p className="text-xs font-semibold text-gray-700">
                                                        {getPaymentMethodLabel(inv)}
                                                    </p>
                                                </td>

                                                <td className="px-8 py-5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {isPaid ? (
                                                            <Link href={payUrl} target="_blank">
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm" 
                                                                    className="rounded-xl text-xs font-bold border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 gap-1.5"
                                                                >
                                                                    <Printer className="size-3.5" />
                                                                    View Receipt
                                                                </Button>
                                                            </Link>
                                                        ) : (
                                                            <Link href={payUrl} target="_blank">
                                                                <Button 
                                                                    size="sm" 
                                                                    className="rounded-xl text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shadow-sm shadow-violet-200"
                                                                >
                                                                    <CreditCard className="size-3.5" />
                                                                    Pay Online
                                                                </Button>
                                                            </Link>
                                                        )}

                                                        <a 
                                                            href={inv.pdf_url || payUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                        >
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="rounded-xl size-8 text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                                                title="Download / Print Invoice"
                                                            >
                                                                <Download className="size-4" />
                                                            </Button>
                                                        </a>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center">
                                            <div className="size-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
                                                <FileText className="size-6" />
                                            </div>
                                            <p className="text-base font-bold text-gray-900">No invoices found</p>
                                            <p className="text-xs font-medium text-gray-500 mt-1">
                                                {searchQuery ? 'Try adjusting your search query or filters.' : 'Invoices will appear here once prepared by Mountain Mama\'s Café.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
