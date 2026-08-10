'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Building2, Calendar, ClipboardList, CreditCard, ExternalLink, 
    FileText, Loader2, RefreshCw, ScrollText, CheckCircle2, ChevronRight, ChevronDown, Trash2, Search, Mail, Copy
} from 'lucide-react';
import { cn, formatDateUS, formatCurrency, formatNumber } from '@/lib/utils';
import { fetchOrdersForInvoicing, fetchInvoicesHistory, sendInvoiceToCompany, fetchInvoiceOrders, payInvoiceManually } from './actions';
import { generateCompanyInvoice } from '../orders/actions';
import { deleteInvoice } from '../companies/actions';

interface InvoicesClientProps {
    companies: any[];
    initialInvoices: any[];
}

function getDateRange(preset: string): { start: string; end: string } {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();

    let start = new Date();
    let end = new Date();

    switch (preset) {
        case 'this_week': {
            const dayOfWeek = today.getDay(); // Sunday is 0, Monday is 1...
            const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            start = new Date(y, m, d + diffToMonday);
            end = new Date(y, m, d + diffToMonday + 6);
            break;
        }
        case 'this_month': {
            start = new Date(y, m, 1);
            end = new Date(y, m + 1, 0);
            break;
        }
        case 'last_month': {
            start = new Date(y, m - 1, 1);
            end = new Date(y, m, 0);
            break;
        }
        case 'last_3_months': {
            start = new Date(y, m - 3, d);
            end = today;
            break;
        }
        case 'last_6_months': {
            start = new Date(y, m - 6, d);
            end = today;
            break;
        }
        case 'this_year': {
            start = new Date(y, 0, 1);
            end = new Date(y, 11, 31);
            break;
        }
        case 'last_year': {
            start = new Date(y - 1, 0, 1);
            end = new Date(y - 1, 11, 31);
            break;
        }
        case 'all_time': {
            start = new Date(2000, 0, 1);
            end = new Date(y + 10, 11, 31);
            break;
        }
        default:
            break;
    }

    const formatDateStr = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    return {
        start: formatDateStr(start),
        end: formatDateStr(end)
    };
}

export function InvoicesClient({ companies, initialInvoices }: InvoicesClientProps) {
    const initialRange = getDateRange('this_month');
    
    // Tab State
    const [activeTab, setActiveTab] = useState<'builder' | 'history'>('builder');
    
    // Draft Filter State
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
    const [periodPreset, setPeriodPreset] = useState<string>('this_month');
    const [startDate, setStartDate] = useState<string>(initialRange.start);
    const [endDate, setEndDate] = useState<string>(initialRange.end);
    
    // Active Search State (Syncs on Search)
    const [activeCompanyId, setActiveCompanyId] = useState<string>('all');
    const [activeStartDate, setActiveStartDate] = useState<string>(initialRange.start);
    const [activeEndDate, setActiveEndDate] = useState<string>(initialRange.end);
    
    // Core Orders State
    const [orders, setOrders] = useState<any[]>([]);
    const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
    
    // Invoices Ledger State
    const [invoices, setInvoices] = useState<any[]>(initialInvoices);
    const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; amount: number; companyId: string } | null>(null);
    const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<Set<string>>(new Set());
    const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
    const [expandedInvoiceOrders, setExpandedInvoiceOrders] = useState<Record<string, any[]>>({});
    const [loadingExpandedId, setLoadingExpandedId] = useState<string | null>(null);

    const toggleExpandedInvoice = async (invoiceId: string) => {
        if (expandedInvoiceId === invoiceId) {
            setExpandedInvoiceId(null);
            return;
        }
        setExpandedInvoiceId(invoiceId);
        // Lazy-load orders if not already fetched
        if (!expandedInvoiceOrders[invoiceId]) {
            setLoadingExpandedId(invoiceId);
            try {
                const res = await fetchInvoiceOrders(invoiceId);
                if (res.success) {
                    setExpandedInvoiceOrders(prev => ({ ...prev, [invoiceId]: res.orders }));
                }
            } finally {
                setLoadingExpandedId(null);
            }
        }
    };
    
    // UI Loading States
    const [fetching, setFetching] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    const [deletingInvoice, setDeletingInvoice] = useState<boolean>(false);
    const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
    const [bulkSending, setBulkSending] = useState<boolean>(false);
    const [invoiceToMarkPaid, setInvoiceToMarkPaid] = useState<{ id: string; amount: number } | null>(null);
    const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);

    // Per-Lunch Discount State
    const [applyPerLunchDiscount, setApplyPerLunchDiscount] = useState<boolean>(false);
    const [perLunchDiscountRate, setPerLunchDiscountRate] = useState<string>('0');
    const [perLunchDiscountCount, setPerLunchDiscountCount] = useState<string>('0');

    // Consolidated Invoicing State
    const [invoiceStyle, setInvoiceStyle] = useState<'detailed' | 'consolidated'>('detailed');
    const [customDescription, setCustomDescription] = useState<string>('');
    const [customLunchCount, setCustomLunchCount] = useState<string>('');
    const [customLunchPrice, setCustomLunchPrice] = useState<string>('');

    // Calculate total non-comped lunches from selected orders
    const totalLunches = orders
        .filter(order => selectedOrderIds.has(order.id))
        .reduce((sum, order) => {
            return sum + order.order_items.reduce((itemSum: number, item: any) => itemSum + (item.is_comped ? 0 : item.quantity), 0);
        }, 0);

    // Auto-clamp discount count when totalLunches changes and exceeds the limit
    useEffect(() => {
        const countVal = parseInt(perLunchDiscountCount) || 0;
        if (countVal > totalLunches) {
            setPerLunchDiscountCount(totalLunches.toString());
        }
    }, [totalLunches, perLunchDiscountCount]);

    // Sync presets to date strings in draft state
    useEffect(() => {
        if (periodPreset !== 'custom') {
            const range = getDateRange(periodPreset);
            setStartDate(range.start);
            setEndDate(range.end);
        }
    }, [periodPreset]);

    // Handle fetching orders ONLY when active query state changes
    useEffect(() => {
        setSelectedInvoiceIds(new Set());
        if (activeCompanyId && activeStartDate && activeEndDate) {
            loadEligibleOrders(activeCompanyId, activeStartDate, activeEndDate);
        } else {
            setOrders([]);
            setSelectedOrderIds(new Set());
        }
    }, [activeCompanyId, activeStartDate, activeEndDate]);

    // Sync default consolidated description with selected period
    useEffect(() => {
        if (activeStartDate && activeEndDate) {
            setCustomDescription(`Consolidated Lunch Catering for ${formatDateUS(activeStartDate)} — ${formatDateUS(activeEndDate)}`);
        }
    }, [activeStartDate, activeEndDate]);

    const handleSearch = () => {
        setActiveCompanyId(selectedCompanyId);
        setActiveStartDate(startDate);
        setActiveEndDate(endDate);
    };

    const loadEligibleOrders = async (companyId: string, start: string, end: string) => {
        if (!companyId || companyId === 'all' || !start || !end) {
            setOrders([]);
            setSelectedOrderIds(new Set());
            return;
        }
        setFetching(true);
        try {
            const res = await fetchOrdersForInvoicing(companyId, start, end);
            if (res.success) {
                setOrders(res.orders);
                // Pre-check all orders by default
                setSelectedOrderIds(new Set(res.orders.map((o: any) => o.id)));
            } else {
                toast.error(res.error || 'Failed to fetch orders');
            }
        } catch (err: any) {
            toast.error('An unexpected error occurred while loading orders.');
        } finally {
            setFetching(false);
        }
    };

    // Checklist togglers
    const toggleOrder = (orderId: string) => {
        const next = new Set(selectedOrderIds);
        if (next.has(orderId)) {
            next.delete(orderId);
        } else {
            next.add(orderId);
        }
        setSelectedOrderIds(next);
    };

    const toggleAllOrders = () => {
        if (selectedOrderIds.size === orders.length) {
            setSelectedOrderIds(new Set());
        } else {
            setSelectedOrderIds(new Set(orders.map((o: any) => o.id)));
        }
    };

    // Calculate aggregated meals for review
    const getAggregatedMeals = () => {
        const aggregations: Record<string, { meal_name: string; box_type: string; quantity: number; total_price: number; is_comped: boolean }> = {};
        
        orders.forEach(order => {
            if (!selectedOrderIds.has(order.id)) return;
            
            order.order_items.forEach((item: any) => {
                const isComped = item.is_comped === true;
                const key = `${item.meal_name}-${item.box_type || 'Box Lunch'}-${isComped ? 'comp' : 'regular'}`;
                if (!aggregations[key]) {
                    aggregations[key] = {
                        meal_name: isComped ? `${item.meal_name} (Comped)` : item.meal_name,
                        box_type: item.box_type || 'Box Lunch',
                        quantity: 0,
                        total_price: 0,
                        is_comped: isComped
                    };
                }
                aggregations[key].quantity += item.quantity;
                aggregations[key].total_price += item.quantity * (isComped ? 0 : item.unit_price);
            });
        });

        return Object.values(aggregations);
    };

    const getEstimatedTotal = () => {
        let subtotal = 0;
        if (invoiceStyle === 'detailed') {
            orders.forEach(order => {
                if (!selectedOrderIds.has(order.id)) return;
                order.order_items.forEach((item: any) => {
                    const price = item.is_comped ? 0 : item.unit_price;
                    subtotal += item.quantity * price;
                });
            });
        } else {
            const count = parseInt(customLunchCount) || 0;
            const price = parseFloat(customLunchPrice) || 0;
            subtotal = count * price;
        }
        
        const discountPct = selectedCompany?.discount_percentage ?? 0;
        const discountAmount = subtotal * (discountPct / 100);
        const discountedSubtotalPercentage = subtotal - discountAmount;

        let perLunchDiscount = 0;
        if (invoiceStyle === 'detailed' && applyPerLunchDiscount) {
            const rate = parseFloat(perLunchDiscountRate) || 0;
            const count = parseInt(perLunchDiscountCount) || 0;
            perLunchDiscount = rate * count;
        }

        const discountedSubtotal = discountedSubtotalPercentage - perLunchDiscount;
        const resortTax = discountedSubtotal * 0.04;
        const processingFee = (discountedSubtotal + resortTax) * 0.029 + 0.30;
        const total = discountedSubtotal + resortTax;
        
        return { subtotal, discountPct, discountAmount, perLunchDiscount, discountedSubtotal, resortTax, processingFee, total };
    };

    const handleCreateInvoice = async () => {
        if (invoiceStyle === 'detailed') {
            if (!activeCompanyId || activeCompanyId === 'all' || selectedOrderIds.size === 0) {
                toast.error('Please select at least one order to invoice.');
                return;
            }
        } else {
            const count = parseInt(customLunchCount) || 0;
            const price = parseFloat(customLunchPrice) || 0;
            if (!activeCompanyId || activeCompanyId === 'all') {
                toast.error('Please select a tour company.');
                return;
            }
            if (!customDescription.trim()) {
                toast.error('Please enter a line item description.');
                return;
            }
            if (count <= 0) {
                toast.error('Please enter a valid number of lunches.');
                return;
            }
            if (price <= 0) {
                toast.error('Please enter a valid price per lunch.');
                return;
            }
        }

        setGenerating(true);
        const toastId = toast.loading('Generating invoice draft on Stripe...');

        try {
            const discountRateNum = invoiceStyle === 'detailed' && applyPerLunchDiscount ? (parseFloat(perLunchDiscountRate) || 0) : 0;
            const discountCountNum = invoiceStyle === 'detailed' && applyPerLunchDiscount ? (parseInt(perLunchDiscountCount) || 0) : 0;

            const res = await generateCompanyInvoice(
                selectedOrderIds.size > 0 ? Array.from(selectedOrderIds) : [],
                discountRateNum,
                discountCountNum,
                {
                    hideDetails: invoiceStyle === 'consolidated',
                    customDescription: customDescription.trim(),
                    customLunchCount: parseInt(customLunchCount) || 0,
                    customLunchPrice: parseFloat(customLunchPrice) || 0,
                    companyId: activeCompanyId,
                    startDate: activeStartDate,
                    endDate: activeEndDate
                }
            );
            if (res.success) {
                toast.success('Invoice draft created! Send it to the company using the Send button in the ledger.', { id: toastId });
                
                // Refresh local history & reload orders
                const historyRes = await fetchInvoicesHistory();
                if (historyRes.success) {
                    setInvoices(historyRes.invoices);
                }
                // Switch to history tab to view draft
                setActiveTab('history');
                // Reset state
                setApplyPerLunchDiscount(false);
                setPerLunchDiscountRate('0');
                setPerLunchDiscountCount('0');
                setCustomLunchCount('');
                setCustomLunchPrice('');
                setCustomDescription(`Consolidated Lunch Catering for ${formatDateUS(activeStartDate)} — ${formatDateUS(activeEndDate)}`);
                loadEligibleOrders(activeCompanyId, activeStartDate, activeEndDate);
            } else {
                toast.error(res.error || 'Failed to generate invoice', { id: toastId });
            }
        } catch (err: any) {
            toast.error('Invoice creation crashed. Check Stripe credentials.', { id: toastId });
        } finally {
            setGenerating(false);
        }
    };

    const handleSendInvoice = async (invoiceId: string) => {
        setSendingInvoiceId(invoiceId);
        const toastId = toast.loading('Finalizing Stripe invoice and sending email...');
        try {
            const res = await sendInvoiceToCompany(invoiceId);
            if (res.success) {
                toast.success('Invoice sent to company email successfully!', { id: toastId });
                const historyRes = await fetchInvoicesHistory();
                if (historyRes.success) {
                    setInvoices(historyRes.invoices);
                }
            } else {
                toast.error(res.error || 'Failed to send invoice.', { id: toastId });
            }
        } catch (err: any) {
            toast.error('An unexpected error occurred while sending invoice.', { id: toastId });
        } finally {
            setSendingInvoiceId(null);
        }
    };

    const executeMarkAsPaid = async () => {
        if (!invoiceToMarkPaid) return;
        const targetId = invoiceToMarkPaid.id;
        setMarkingPaidId(targetId);
        const toastId = toast.loading('Marking invoice as paid...');
        try {
            const res = await payInvoiceManually(targetId, 'check');
            if (res.success) {
                toast.success('Invoice marked as paid successfully!', { id: toastId });
                const historyRes = await fetchInvoicesHistory();
                if (historyRes.success) {
                    setInvoices(historyRes.invoices);
                }
                setInvoiceToMarkPaid(null);
            } else {
                toast.error(res.error || 'Failed to mark invoice as paid.', { id: toastId });
            }
        } catch (err: any) {
            toast.error('An unexpected error occurred.', { id: toastId });
        } finally {
            setMarkingPaidId(null);
        }
    };

    const toggleInvoice = (invoiceId: string) => {
        setSelectedInvoiceIds(prev => {
            const next = new Set(prev);
            if (next.has(invoiceId)) {
                next.delete(invoiceId);
            } else {
                next.add(invoiceId);
            }
            return next;
        });
    };

    const toggleAllUnpaidInvoices = () => {
        const unpaidIds = filteredInvoices.filter((inv: any) => inv.status !== 'paid').map((inv: any) => inv.id);
        const allSelected = unpaidIds.length > 0 && unpaidIds.every(id => selectedInvoiceIds.has(id));
        
        setSelectedInvoiceIds(prev => {
            const next = new Set(prev);
            if (allSelected) {
                unpaidIds.forEach(id => next.delete(id));
            } else {
                unpaidIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    const handleBulkSendInvoices = async () => {
        if (selectedInvoiceIds.size === 0) return;
        setBulkSending(true);
        const toastId = toast.loading(`Finalizing and sending ${selectedInvoiceIds.size} invoice(s)...`);
        try {
            const invoiceIds = Array.from(selectedInvoiceIds);
            let successCount = 0;
            let failureCount = 0;

            for (const invoiceId of invoiceIds) {
                const res = await sendInvoiceToCompany(invoiceId);
                if (res.success) {
                    successCount++;
                } else {
                    failureCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully sent ${successCount} invoice(s).` + (failureCount > 0 ? ` Failed to send ${failureCount} invoice(s).` : ''), { id: toastId });
                const historyRes = await fetchInvoicesHistory();
                if (historyRes.success) {
                    setInvoices(historyRes.invoices);
                }
                setSelectedInvoiceIds(new Set());
            } else {
                toast.error('Failed to send selected invoice(s).', { id: toastId });
            }
        } catch (err: any) {
            toast.error('An unexpected error occurred while sending invoices.', { id: toastId });
        } finally {
            setBulkSending(false);
        }
    };

    const handleCopyPaymentLink = (invoice: any) => {
        const link = invoice.status === 'draft'
            ? invoice.stripe_payment_link
            : `${window.location.origin}/invoice/${invoice.id}/pay`;
        
        if (link) {
            navigator.clipboard.writeText(link);
            toast.success(invoice.status === 'draft' ? 'Stripe draft link copied!' : 'Payment link copied to clipboard!');
        }
    };

    const executeInvoiceDelete = async () => {
        if (!invoiceToDelete) return;
        setDeletingInvoice(true);
        const toastId = toast.loading('Deleting invoice and reverting orders...');

        try {
            const res = await deleteInvoice(invoiceToDelete.id);
            if (res.success) {
                toast.success('Invoice deleted successfully! Tours reverted to unpaid.', { id: toastId });
                
                setInvoices(invoices.filter(i => i.id !== invoiceToDelete.id));

                // Also reload eligible orders if the deleted invoice was for the currently selected company
                if (invoiceToDelete.companyId === activeCompanyId) {
                    loadEligibleOrders(activeCompanyId, activeStartDate, activeEndDate);
                }
            } else {
                toast.error(res.error || 'Failed to delete invoice', { id: toastId });
            }
        } catch (err: any) {
            toast.error('Invoice deletion failed.', { id: toastId });
        } finally {
            setDeletingInvoice(false);
            setInvoiceToDelete(null);
        }
    };

    const selectedCompany = companies.find(c => c.id === activeCompanyId);
    const aggregatedMeals = getAggregatedMeals();
    const pricing = getEstimatedTotal();

    // Filter invoices in the history ledger
    const filteredInvoices = (activeCompanyId && activeCompanyId !== 'all')
        ? invoices.filter(inv => inv.company_id === activeCompanyId)
        : invoices;

    // Check if an unpaid invoice covers the selected range and company
    const unpaidInvoicesInRange = (activeCompanyId && activeCompanyId !== 'all')
        ? invoices.filter(inv => {
            if (inv.company_id !== activeCompanyId) return false;
            if (inv.status === 'paid') return false;
            
            // Check range overlap or intersection
            return (
                (inv.period_start >= activeStartDate && inv.period_start <= activeEndDate) ||
                (inv.period_end >= activeStartDate && inv.period_end <= activeEndDate) ||
                (inv.period_start <= activeStartDate && inv.period_end >= activeEndDate)
            );
        })
        : [];

    return (
        <div className="space-y-6">
            {/* Tabs Selector */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-px mb-6 no-print">
                <button
                    onClick={() => setActiveTab('builder')}
                    className={cn(
                        "pb-3 px-4 text-sm font-bold border-b-2 transition-all relative outline-none flex items-center gap-1.5",
                        activeTab === 'builder'
                            ? "border-violet-600 text-violet-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    Generate Invoice
                    {activeCompanyId !== 'all' && orders.length > 0 && (
                        <Badge className="bg-amber-50 text-amber-700 border border-amber-100/50 text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold">
                            {orders.length}
                        </Badge>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={cn(
                        "pb-3 px-4 text-sm font-bold border-b-2 transition-all relative flex items-center gap-1.5 outline-none",
                        activeTab === 'history'
                            ? "border-violet-600 text-violet-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    Invoice History Ledger
                    {filteredInvoices.length > 0 && (
                        <Badge className="bg-violet-50 text-violet-700 border border-violet-100/50 text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold">
                            {filteredInvoices.length}
                        </Badge>
                    )}
                </button>
            </div>

            {activeTab === 'builder' ? (
                <>
                    {/* Filters Section */}
            <Card className="shadow-sm border-gray-100 bg-white/70 backdrop-blur-md">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Company Selector */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Building2 className="size-3.5 text-violet-500" /> Select Tour Company
                            </Label>
                            <Select value={selectedCompanyId} onValueChange={(val) => setSelectedCompanyId(val || 'all')}>
                                <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 !rounded-xl !h-11 font-bold text-gray-900 shadow-sm w-full transition-all duration-200 hover:border-gray-300">
                                    <SelectValue placeholder="Choose a company...">
                                        {selectedCompanyId === 'all' ? 'All Companies' : (companies.find(c => c.id === selectedCompanyId)?.name || 'Choose a company...')}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl w-full">
                                    <SelectItem value="all" className="font-bold text-violet-600">
                                        All Companies
                                    </SelectItem>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id} className="font-semibold text-gray-800">
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Period Presets */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-blue-500" /> Billing Period Preset
                            </Label>
                            <Select value={periodPreset} onValueChange={(val) => setPeriodPreset(val || '')}>
                                <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 !rounded-xl !h-11 font-bold text-gray-900 shadow-sm w-full transition-all duration-200 hover:border-gray-300">
                                    <SelectValue>
                                        {periodPreset === 'this_week' && 'This Week'}
                                        {periodPreset === 'this_month' && 'This Month'}
                                        {periodPreset === 'last_month' && 'Last Month'}
                                        {periodPreset === 'last_3_months' && 'Last 3 Months'}
                                        {periodPreset === 'last_6_months' && 'Last 6 Months'}
                                        {periodPreset === 'this_year' && 'This Year'}
                                        {periodPreset === 'last_year' && 'Last Year'}
                                        {periodPreset === 'all_time' && 'All Time'}
                                        {periodPreset === 'custom' && 'Custom Date Range'}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-gray-100 shadow-xl font-semibold w-full">
                                    <SelectItem value="this_week">This Week</SelectItem>
                                    <SelectItem value="this_month">This Month</SelectItem>
                                    <SelectItem value="last_month">Last Month</SelectItem>
                                    <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                                    <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                                    <SelectItem value="this_year">This Year</SelectItem>
                                    <SelectItem value="last_year">Last Year</SelectItem>
                                    <SelectItem value="all_time">All Time</SelectItem>
                                    <SelectItem value="custom">Custom Date Range</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Custom Date Pickers - Start Date */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-emerald-500" /> Start Date
                            </Label>
                            <Input
                                type="date"
                                value={startDate}
                                onChange={(e) => {
                                    setStartDate(e.target.value);
                                    setPeriodPreset('custom');
                                }}
                                className="bg-white border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 rounded-xl h-11 font-bold text-gray-900 shadow-sm w-full transition-all duration-200 hover:border-gray-300"
                            />
                        </div>

                        {/* Custom Date Pickers - End Date */}
                        <div className="space-y-2">
                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                <Calendar className="size-3.5 text-rose-500" /> End Date
                            </Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    setPeriodPreset('custom');
                                }}
                                className="bg-white border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 rounded-xl h-11 font-bold text-gray-900 shadow-sm w-full transition-all duration-200 hover:border-gray-300"
                            />
                        </div>
                    </div>

                    {/* Invoice Style Selector */}
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText className="size-3.5 text-violet-500" /> Invoice Line Items Style
                        </Label>
                        <div className="flex flex-col sm:flex-row gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-150">
                            <label className={cn(
                                "flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white",
                                invoiceStyle === 'detailed' 
                                    ? "border-violet-600 bg-violet-50/10 shadow-sm" 
                                    : "border-transparent hover:border-gray-200"
                            )}>
                                <input
                                    type="radio"
                                    name="invoice-style"
                                    checked={invoiceStyle === 'detailed'}
                                    onChange={() => setInvoiceStyle('detailed')}
                                    className="text-violet-600 focus:ring-violet-500 size-4 cursor-pointer"
                                />
                                <div className="text-left">
                                    <p className="text-xs font-black text-gray-900">Detailed Invoice</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">Itemize every selected lunch separately on the invoice</p>
                                </div>
                            </label>
                            <label className={cn(
                                "flex-1 flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all bg-white",
                                invoiceStyle === 'consolidated' 
                                    ? "border-violet-600 bg-violet-50/10 shadow-sm" 
                                    : "border-transparent hover:border-gray-200"
                            )}>
                                <input
                                    type="radio"
                                    name="invoice-style"
                                    checked={invoiceStyle === 'consolidated'}
                                    onChange={() => setInvoiceStyle('consolidated')}
                                    className="text-violet-600 focus:ring-violet-500 size-4 cursor-pointer"
                                />
                                <div className="text-left">
                                    <p className="text-xs font-black text-gray-900">Consolidated Invoice</p>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5 tracking-wider">Hide lunch details and specify a custom lunch quantity and price</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end pt-5 border-t border-gray-100 mt-5">
                        <Button
                            onClick={handleSearch}
                            className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 px-6 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer group"
                        >
                            <Search className="size-4 group-hover:scale-110 transition-transform duration-300" />
                            Search & Filter Invoices
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Content Split */}
            {activeCompanyId && activeCompanyId !== 'all' ? (
                fetching ? (
                    <div className="flex flex-col items-center justify-center py-24 bg-white/50 rounded-3xl border border-gray-100 border-dashed">
                        <Loader2 className="size-8 animate-spin text-violet-600 mb-4" />
                        <p className="text-sm font-bold text-gray-600">Retrieving eligible unpaid orders...</p>
                    </div>
                ) : (orders.length > 0 || invoiceStyle === 'consolidated') ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* List & Selection */}
                        <div className="lg:col-span-2 space-y-6">
                            {orders.length > 0 ? (
                                <Card className="shadow-sm border-gray-100 bg-white overflow-hidden">
                                    <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="font-black text-gray-900 text-base">Select Orders to Invoice</h3>
                                            <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                                                {selectedOrderIds.size} of {orders.length} tours selected for billing
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {invoiceStyle === 'consolidated' && (
                                                <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50 border border-violet-100/50 text-[10px] font-bold px-2 py-1 rounded-lg">
                                                    Consolidated Mode
                                                </Badge>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={toggleAllOrders}
                                                className="h-8 text-xs font-bold border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
                                            >
                                                {selectedOrderIds.size === orders.length ? 'Deselect All' : 'Select All'}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-gray-50/50">
                                                <TableRow>
                                                    <TableHead className="w-12 text-center"></TableHead>
                                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Tour Date</TableHead>
                                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Lead Name / Guide</TableHead>
                                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Box Summary</TableHead>
                                                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500 text-right">Price</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {orders.map((order) => {
                                                    const orderTotal = order.order_items.reduce((sum: number, i: any) => sum + (i.quantity * i.unit_price), 0);
                                                    const itemsSummary = order.order_items.map((i: any) => `${i.quantity}x ${i.meal_name}`).join(', ');

                                                    return (
                                                        <TableRow 
                                                            key={order.id}
                                                            className={cn(
                                                                "hover:bg-gray-50/50 cursor-pointer transition-colors",
                                                                selectedOrderIds.has(order.id) && "bg-violet-50/20"
                                                            )}
                                                            onClick={() => toggleOrder(order.id)}
                                                        >
                                                            <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedOrderIds.has(order.id)}
                                                                    onChange={() => toggleOrder(order.id)}
                                                                    className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 size-4 cursor-pointer"
                                                                />
                                                            </TableCell>
                                                            <TableCell className="font-bold text-gray-800 text-xs whitespace-nowrap">
                                                                {formatDateUS(order.tour_date)}
                                                            </TableCell>
                                                            <TableCell className="font-black text-gray-900 text-xs">
                                                                {order.customer_name}
                                                            </TableCell>
                                                            <TableCell className="text-xs text-gray-500 max-w-[200px] truncate font-medium">
                                                                {itemsSummary}
                                                            </TableCell>
                                                            <TableCell className="font-black text-gray-900 text-xs text-right">
                                                                {formatCurrency(orderTotal)}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="shadow-sm border-gray-100 bg-white/50 border-dashed py-16 flex flex-col items-center justify-center text-center p-6">
                                    <div className="size-16 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
                                        <ClipboardList className="size-8 animate-pulse" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900">No Unpaid Orders Found</h3>
                                    <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">Standalone Billing Mode</p>
                                    <p className="text-xs text-gray-500 font-medium max-w-sm mt-2 px-6">
                                        Since there are no unpaid fulfilled orders in this period, you can create a custom standalone invoice. Fill out the lunch count and unit price in the sidebar.
                                    </p>
                                </Card>
                            )}
                        </div>
 
                        {/* Invoice Builder / Aggregations Sidebar */}
                        <div className="space-y-6">
                            {/* Aggregated Preview Card or Consolidated Inputs */}
                            {invoiceStyle === 'detailed' ? (
                                <Card className="shadow-sm border-gray-100 bg-white">
                                    <div className="p-5 border-b border-gray-100">
                                        <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                                            <ClipboardList className="size-4.5 text-violet-500" /> Meal Box Aggregations
                                        </h3>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                                            Aggregated quantity for Stripe invoice lines
                                        </p>
                                    </div>
                                    <CardContent className="p-5 space-y-4">
                                        {aggregatedMeals.length > 0 ? (
                                            <div className="divide-y divide-gray-100">
                                                {aggregatedMeals.map((agg, idx) => (
                                                    <div key={idx} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                                                        <div>
                                                            <p className="text-xs font-black text-gray-900">{agg.meal_name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{agg.box_type}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs font-bold text-gray-900">{formatNumber(agg.quantity)} lunches</p>
                                                            <p className="text-[10px] text-violet-600 font-black">{formatCurrency(agg.total_price)}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="py-6 text-center text-xs text-gray-400 font-medium">
                                                No lunches to aggregate. Select orders to see counts.
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card className="shadow-sm border-gray-100 bg-white">
                                    <div className="p-5 border-b border-gray-100">
                                        <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                                            <FileText className="size-4.5 text-violet-500" /> Consolidated Billing Line
                                        </h3>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                                            Define the single billing line item details
                                        </p>
                                    </div>
                                    <CardContent className="p-5 space-y-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="custom-description" className="text-xs font-bold text-gray-700">
                                                Line Item Description
                                            </Label>
                                            <Input
                                                id="custom-description"
                                                type="text"
                                                value={customDescription}
                                                onChange={(e) => setCustomDescription(e.target.value)}
                                                className="bg-white border-gray-200 focus:ring-violet-500 focus:border-violet-500 rounded-xl h-10 font-medium text-gray-950 shadow-sm w-full"
                                                placeholder="e.g. Box Lunches"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="custom-lunch-count" className="text-xs font-bold text-gray-700">
                                                    Lunches Count
                                                </Label>
                                                <Input
                                                    id="custom-lunch-count"
                                                    type="number"
                                                    min="1"
                                                    step="1"
                                                    value={customLunchCount}
                                                    onChange={(e) => setCustomLunchCount(e.target.value)}
                                                    className="bg-white border-gray-200 focus:ring-violet-500 focus:border-violet-500 rounded-xl h-10 font-black text-gray-950 shadow-sm w-full"
                                                    placeholder="e.g. 50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="custom-lunch-price" className="text-xs font-bold text-gray-700">
                                                    Price per Lunch ($)
                                                </Label>
                                                <Input
                                                    id="custom-lunch-price"
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={customLunchPrice}
                                                    onChange={(e) => setCustomLunchPrice(e.target.value)}
                                                    className="bg-white border-gray-200 focus:ring-violet-500 focus:border-violet-500 rounded-xl h-10 font-black text-gray-950 shadow-sm w-full"
                                                    placeholder="e.g. 12.50"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
 
                             {/* Summary Card and Generate Action */}
                             <Card className="shadow-lg border border-violet-100 bg-violet-50/30 overflow-hidden relative">
                                 <div className="absolute top-0 right-0 p-6 opacity-5">
                                     <ScrollText className="size-36 text-violet-900" />
                                 </div>
                                 <CardContent className="p-6 space-y-6 relative z-10">
                                     <div>
                                         <Badge className="bg-violet-600 hover:bg-violet-600 text-white rounded-full font-bold uppercase tracking-widest text-[9px] px-2.5 py-0.5 shadow-sm">
                                             Billing Summary
                                         </Badge>
                                         <h4 className="text-lg font-black text-gray-900 mt-2.5">{selectedCompany?.name}</h4>
                                         <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                                             Period: {formatDateUS(activeStartDate)} — {formatDateUS(activeEndDate)}
                                         </p>
                                     </div>
 
                                     <div className="space-y-3 pt-3 border-t border-violet-100">
                                        {invoiceStyle === 'detailed' ? (
                                            <>
                                                <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                    <span>Consolidated Tours</span>
                                                    <span className="font-bold text-gray-900">{selectedOrderIds.size} tours</span>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                    <span>Total Lunches</span>
                                                    <span className="font-bold text-gray-900">
                                                        {aggregatedMeals.reduce((sum, m) => sum + m.quantity, 0)} meals
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                    <span>Consolidated Tours</span>
                                                    <span className="font-bold text-gray-900">
                                                        {selectedOrderIds.size > 0 ? `${selectedOrderIds.size} tours` : 'None (Standalone)'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                    <span>Total Lunches</span>
                                                    <span className="font-bold text-gray-900">
                                                        {parseInt(customLunchCount) || 0} meals
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                         
                                         <div className="flex justify-between text-xs text-gray-500 font-medium pt-2 mt-2 border-t border-violet-50/50">
                                             <span>Subtotal</span>
                                             <span className="font-bold text-gray-700">{formatCurrency(pricing.subtotal)}</span>
                                         </div>
 
                                         {/* Per-lunch discount selector */}
                                         {invoiceStyle === 'detailed' && (
                                             <>
                                                 <div className="flex items-center gap-2 pt-2 border-t border-violet-50/50">
                                                     <input
                                                         type="checkbox"
                                                         id="apply-per-lunch-discount"
                                                         checked={applyPerLunchDiscount}
                                                         onChange={(e) => {
                                                             setApplyPerLunchDiscount(e.target.checked);
                                                             if (e.target.checked && (parseInt(perLunchDiscountCount) || 0) === 0) {
                                                                 setPerLunchDiscountCount(totalLunches.toString());
                                                             }
                                                         }}
                                                         className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 size-4 cursor-pointer"
                                                     />
                                                     <label htmlFor="apply-per-lunch-discount" className="text-xs font-bold text-gray-700 cursor-pointer">
                                                         Apply discount on some lunches
                                                     </label>
                                                 </div>
 
                                                 {applyPerLunchDiscount && (
                                                     <div className="grid grid-cols-2 gap-2 bg-violet-50/50 p-2.5 rounded-xl border border-violet-100 transition-all">
                                                         <div className="space-y-1">
                                                             <Label htmlFor="discount-rate" className="text-[10px] font-bold text-gray-500 uppercase">
                                                                 Rate ($ off / lunch)
                                                             </Label>
                                                             <Input
                                                                 id="discount-rate"
                                                                 type="number"
                                                                 step="0.01"
                                                                 min="0"
                                                                 value={perLunchDiscountRate}
                                                                 onChange={(e) => setPerLunchDiscountRate(e.target.value)}
                                                                 className="h-8 text-xs font-bold bg-white border-gray-200 focus:ring-violet-500 focus:border-violet-500 rounded-lg w-full"
                                                                 placeholder="e.g. 0.50"
                                                             />
                                                         </div>
                                                         <div className="space-y-1">
                                                             <Label htmlFor="discount-count" className="text-[10px] font-bold text-gray-500 uppercase">
                                                                 No. of lunches (max {totalLunches})
                                                             </Label>
                                                             <Input
                                                                 id="discount-count"
                                                                 type="number"
                                                                 step="1"
                                                                 min="0"
                                                                 max={totalLunches}
                                                                 value={perLunchDiscountCount}
                                                                 onChange={(e) => {
                                                                     const val = parseInt(e.target.value) || 0;
                                                                     if (val > totalLunches) {
                                                                         setPerLunchDiscountCount(totalLunches.toString());
                                                                     } else {
                                                                         setPerLunchDiscountCount(e.target.value);
                                                                     }
                                                                 }}
                                                                 className="h-8 text-xs font-bold bg-white border-gray-200 focus:ring-violet-500 focus:border-violet-500 rounded-lg w-full"
                                                                 placeholder={`max ${totalLunches}`}
                                                             />
                                                         </div>
                                                     </div>
                                                 )}
 
                                                 {applyPerLunchDiscount && pricing.perLunchDiscount > 0 && (
                                                     <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50/50 -mx-2 px-2 py-1.5 rounded-lg">
                                                         <span>Per-Lunch Discount</span>
                                                         <span>-{formatCurrency(pricing.perLunchDiscount)}</span>
                                                     </div>
                                                 )}
                                             </>
                                         )}
 
                                         {pricing.discountPct > 0 && (
                                             <div className="flex justify-between text-xs text-emerald-600 font-bold bg-emerald-50/50 -mx-2 px-2 py-1.5 rounded-lg">
                                                 <span className="flex items-center gap-1">Company Discount ({pricing.discountPct}%)</span>
                                                 <span>-{formatCurrency(pricing.discountAmount)}</span>
                                             </div>
                                         )}
                                         <div className="flex justify-between text-xs text-gray-500 font-medium">
                                             <span>Resort Tax (4%)</span>
                                             <span className="font-bold text-gray-700">{formatCurrency(pricing.resortTax)}</span>
                                         </div>
                                         <div className="flex justify-between text-xs text-gray-400 font-medium italic">
                                             <span>Credit Card Fee (est. if paid by card)</span>
                                             <span className="font-semibold">{formatCurrency(pricing.processingFee)}</span>
                                         </div>
 
                                         <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-violet-200">
                                             <span className="text-sm font-black text-gray-900">Invoice Total (Base)</span>
                                             <span className="text-2xl font-black text-violet-700">
                                                 {formatCurrency(pricing.total)}
                                             </span>
                                         </div>
                                     </div>
 
                                     <Button
                                         onClick={handleCreateInvoice}
                                         disabled={generating || (invoiceStyle === 'detailed' && selectedOrderIds.size === 0)}
                                         className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold h-12 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
                                     >
                                         {generating ? (
                                             <>
                                                 <Loader2 className="size-4 animate-spin" />
                                                 Creating Stripe Invoice...
                                             </>
                                         ) : (
                                             <>
                                                 <CreditCard className="size-4 group-hover:scale-105 transition-transform" />
                                                 Generate Stripe Invoice
                                                 <ChevronRight className="size-4 ml-auto opacity-60 group-hover:translate-x-0.5 transition-transform" />
                                             </>
                                         )}
                                     </Button>
                                 </CardContent>
                             </Card>
                         </div>
                     </div>
                 ) : unpaidInvoicesInRange.length > 0 ? (
                    <Card className="shadow-sm border-amber-100 bg-amber-50/20 py-16 flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4 border border-amber-100/50">
                            <CreditCard className="size-8 animate-pulse" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Unpaid Invoice Already Generated</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">
                            An active invoice covers this period and company
                        </p>
                        <p className="text-xs text-gray-500 font-medium max-w-sm mt-2 px-6 mb-6">
                            There are no unpaid orders to bundle because they have already been consolidated into the following unpaid invoice:
                        </p>
                        
                        <div className="w-full max-w-md px-6 space-y-3">
                            {unpaidInvoicesInRange.map((invoice) => (
                                <div key={invoice.id} className="flex items-center justify-between p-4 rounded-2xl border border-amber-200 bg-white group/item hover:border-amber-400 transition-all shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-[10px] font-black uppercase text-amber-700">
                                            {invoice.status}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-gray-900">{formatCurrency(invoice.total_amount)}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">
                                                Period: {formatDateUS(invoice.period_start)} - {formatDateUS(invoice.period_end)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {invoice.pdf_url && (
                                            <a 
                                                href={invoice.pdf_url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-200 transition-all cursor-pointer"
                                                title="Download Stripe PDF"
                                            >
                                                <FileText className="size-3.5" />
                                            </a>
                                        )}
                                        {invoice.stripe_payment_link && (
                                            <button 
                                                onClick={() => handleCopyPaymentLink(invoice)}
                                                className={cn(
                                                    "size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center transition-all cursor-pointer",
                                                    invoice.status === 'draft' 
                                                        ? "text-blue-500 hover:text-blue-600 hover:border-blue-200" 
                                                        : "text-emerald-600 hover:text-emerald-700 hover:border-emerald-200"
                                                )}
                                                title={invoice.status === 'draft' ? "Copy Stripe Draft Link" : "Copy Payment Link"}
                                            >
                                                <Copy className="size-3.5" />
                                            </button>
                                        )}
                                        {invoice.status === 'draft' && (
                                            <button 
                                                onClick={() => handleSendInvoice(invoice.id)}
                                                disabled={sendingInvoiceId !== null}
                                                className="size-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                                                title="Finalize & Send Invoice Email"
                                            >
                                                {sendingInvoiceId === invoice.id ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : (
                                                    <Mail className="size-3.5" />
                                                )}
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => setInvoiceToDelete({ id: invoice.id, amount: invoice.total_amount, companyId: invoice.company_id })}
                                            className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                                            title="Delete Invoice & Reset Orders"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                ) : (
                    <Card className="shadow-sm border-gray-100 bg-white/50 border-dashed py-20 flex flex-col items-center justify-center text-center">
                        <div className="size-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                            <CheckCircle2 className="size-8" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">All Caught Up!</h3>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">
                            No unpaid fulfilled orders found for this company in the selected range
                        </p>
                        <p className="text-xs text-gray-500 font-medium max-w-sm mt-2 px-6">
                            All orders for {selectedCompany?.name} between {formatDateUS(activeStartDate)} and {formatDateUS(activeEndDate)} have already been invoiced or are in progress.
                        </p>
                    </Card>
                )
            ) : (
                <Card className="shadow-sm border-gray-100 bg-white/50 border-dashed py-24 flex flex-col items-center justify-center text-center">
                    <div className="size-16 rounded-3xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4 shadow-sm border border-violet-100/50">
                        <ScrollText className="size-7 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-black text-gray-900">
                        {activeCompanyId === 'all' ? 'All Companies Selected' : 'Select a Company'}
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider px-6">
                        {activeCompanyId === 'all'
                            ? 'Please choose a specific tour company above to bundle orders and generate a new invoice.'
                            : 'Choose a tour company and period above to prepare a consolidated invoice'}
                    </p>
                </Card>
            )}
                </>
            ) : (
                <>
                    {/* Invoice History Section */}
                    <Card className="shadow-sm border-gray-100 bg-white overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                                    <ScrollText className="size-4.5 text-violet-500" /> Invoice History Ledger
                                </h3>
                                <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                                    {filteredInvoices.length} invoices generated in total
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {selectedInvoiceIds.size > 0 && (
                                    <Button
                                        onClick={handleBulkSendInvoices}
                                        disabled={bulkSending}
                                        className="bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 px-4 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 text-xs"
                                    >
                                        {bulkSending ? (
                                            <>
                                                <Loader2 className="size-3.5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Mail className="size-3.5" />
                                                Send invoice {selectedInvoiceIds.size > 1 ? `(${selectedInvoiceIds.size})` : ''}
                                            </>
                                        )}
                                    </Button>
                                )}
                                <Select value={selectedCompanyId} onValueChange={(val) => {
                                    setSelectedCompanyId(val || 'all');
                                    setActiveCompanyId(val || 'all');
                                }}>
                                    <SelectTrigger className="bg-white border-gray-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 !rounded-xl !h-10 font-bold text-gray-900 shadow-sm w-[200px] transition-all duration-200 hover:border-gray-300">
                                        <SelectValue placeholder="All Companies">
                                            {selectedCompanyId === 'all' ? 'All Companies' : (companies.find(c => c.id === selectedCompanyId)?.name || 'All Companies')}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-gray-100 shadow-xl w-full">
                                        <SelectItem value="all" className="font-bold text-violet-600">
                                            All Companies
                                        </SelectItem>
                                        {companies.map(c => (
                                            <SelectItem key={c.id} value={c.id} className="font-semibold text-gray-800">
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                {filteredInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="w-12 py-3 pl-6 text-center">
                                        <input
                                            type="checkbox"
                                            checked={
                                                filteredInvoices.filter((inv: any) => inv.status !== 'paid').length > 0 &&
                                                filteredInvoices.filter((inv: any) => inv.status !== 'paid').every((inv: any) => selectedInvoiceIds.has(inv.id))
                                            }
                                            onChange={toggleAllUnpaidInvoices}
                                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                        />
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3 pl-2">Company</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Billing Period</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Created Date</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Amount</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Status</TableHead>
                                    <TableHead className="text-right font-bold text-gray-900 py-3 pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice: any) => {
                                    const isExpanded = expandedInvoiceId === invoice.id;
                                    const resortTax = invoice.tip_amount ?? 0;
                                    return (
                                        <React.Fragment key={invoice.id}>
                                            <TableRow 
                                                className={cn(
                                                    "cursor-pointer transition-colors",
                                                    isExpanded ? "bg-violet-50/40 hover:bg-violet-50/40" : "hover:bg-gray-50/50",
                                                    selectedInvoiceIds.has(invoice.id) && !isExpanded && "bg-violet-50/20"
                                                )}
                                                onClick={() => toggleExpandedInvoice(invoice.id)}
                                            >
                                                <TableCell className="text-center pl-6" onClick={(e) => e.stopPropagation()}>
                                                    {invoice.status !== 'paid' ? (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedInvoiceIds.has(invoice.id)}
                                                            onChange={() => toggleInvoice(invoice.id)}
                                                            className="rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                                        />
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            disabled
                                                            checked={false}
                                                            className="rounded border-gray-200 text-gray-300 cursor-not-allowed opacity-30"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-black text-gray-950 text-xs pl-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <ChevronDown className={cn(
                                                            "size-3.5 text-gray-400 transition-transform duration-200 flex-shrink-0",
                                                            isExpanded && "rotate-180 text-violet-500"
                                                        )} />
                                                        {invoice.tour_companies?.name || 'Unknown Company'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-600 font-medium">
                                                    {formatDateUS(invoice.period_start)} — {formatDateUS(invoice.period_end)}
                                                </TableCell>
                                                <TableCell className="text-xs text-gray-400 font-bold">
                                                    {formatDateUS(invoice.created_at)}
                                                </TableCell>
                                                <TableCell className="font-black text-gray-900 text-xs">
                                                    <div className="flex items-center gap-1.5">
                                                        ${invoice.total_amount.toFixed(2)}
                                                        {invoice.discount_percentage > 0 && (
                                                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 rounded-full font-bold text-[8px] px-1.5 py-0 tracking-wider">
                                                                -{invoice.discount_percentage}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={cn(
                                                        "rounded-full font-bold uppercase tracking-widest text-[9px] px-2.5 py-0.5",
                                                        invoice.status === 'paid' 
                                                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100" 
                                                            : invoice.status === 'sent'
                                                            ? "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-100"
                                                            : "bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-100"
                                                    )}>
                                                        {invoice.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {invoice.pdf_url && (
                                                            <a 
                                                                href={invoice.pdf_url} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-200 transition-all cursor-pointer"
                                                                title="Download Stripe PDF"
                                                            >
                                                                <FileText className="size-3.5" />
                                                            </a>
                                                        )}
                                                        {invoice.stripe_payment_link && (
                                                            <button 
                                                                onClick={() => handleCopyPaymentLink(invoice)}
                                                                className={cn(
                                                                    "size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center transition-all cursor-pointer",
                                                                    invoice.status === 'draft' 
                                                                        ? "text-blue-500 hover:text-blue-600 hover:border-blue-200" 
                                                                        : "text-emerald-600 hover:text-emerald-700 hover:border-emerald-200"
                                                                )}
                                                                title={invoice.status === 'draft' ? "Copy Stripe Draft Link" : "Copy Payment Link"}
                                                            >
                                                                <Copy className="size-3.5" />
                                                            </button>
                                                        )}
                                                        {invoice.status === 'draft' && (
                                                            <button 
                                                                onClick={() => handleSendInvoice(invoice.id)}
                                                                disabled={sendingInvoiceId !== null}
                                                                className="size-8 rounded-lg bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-600 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                                                                title="Finalize & Send Invoice Email"
                                                            >
                                                                {sendingInvoiceId === invoice.id ? (
                                                                    <Loader2 className="size-3.5 animate-spin" />
                                                                ) : (
                                                                    <Mail className="size-3.5" />
                                                                )}
                                                            </button>
                                                        )}
                                                        {invoice.status !== 'paid' && (
                                                            <button 
                                                                onClick={() => setInvoiceToMarkPaid({ id: invoice.id, amount: invoice.total_amount })}
                                                                disabled={markingPaidId !== null}
                                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                                                                title="Mark as Paid (Check)"
                                                            >
                                                                <CheckCircle2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                        {invoice.status !== 'paid' && (
                                                            <button 
                                                                onClick={() => setInvoiceToDelete({ id: invoice.id, amount: invoice.total_amount, companyId: invoice.company_id })}
                                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                                                                title="Delete Invoice & Reset Orders"
                                                            >
                                                                <Trash2 className="size-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                            {/* Expandable Detail Panel */}
                                            {isExpanded && (() => {
                                                const invoiceOrders = expandedInvoiceOrders[invoice.id] || [];
                                                const isLoadingOrders = loadingExpandedId === invoice.id;

                                                // Compute financial breakdown from stored invoice fields
                                                const totalDiscounts = (invoice.discount_amount ?? 0)
                                                    + (invoice.per_lunch_discount_rate ?? 0) * (invoice.per_lunch_discount_count ?? 0);
                                                
                                                // If orders are loaded, sum their pre-tax order subtotals; otherwise reverse calculate from total_amount (which includes 4% resort tax)
                                                const ordersPreTaxSubtotal = invoiceOrders.length > 0
                                                    ? invoiceOrders.reduce((sum: number, order: any) => {
                                                        const paidItems = (order.order_items || []).filter((i: any) => !i.is_comped);
                                                        return sum + paidItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0);
                                                    }, 0)
                                                    : null;

                                                const discountedSubtotalBeforeTax = ordersPreTaxSubtotal !== null
                                                    ? ordersPreTaxSubtotal - totalDiscounts
                                                    : invoice.total_amount / 1.04;

                                                const subtotal = discountedSubtotalBeforeTax + totalDiscounts;
                                                const resortTaxLine = discountedSubtotalBeforeTax * 0.04;
                                                const processingFeeEst = invoice.total_amount * 0.029 + 0.30;

                                                return (
                                                    <TableRow className="bg-violet-50/10 border-b border-violet-100/60">
                                                        <TableCell colSpan={7} className="p-0">
                                                            <div className="border-l-4 border-violet-400 ml-6 mr-4 my-3 rounded-xl overflow-hidden shadow-sm">

                                                                {/* ── Section 1: Bundled Orders ── */}
                                                                <div className="bg-white">
                                                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                                        <p className="text-xs font-black text-gray-800 flex items-center gap-1.5">
                                                                            <ClipboardList className="size-3.5 text-violet-500" />
                                                                            Bundled Orders
                                                                        </p>
                                                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                                                            {isLoadingOrders ? 'Loading...' : `${invoiceOrders.length} order${invoiceOrders.length !== 1 ? 's' : ''}`}
                                                                        </p>
                                                                    </div>

                                                                    {isLoadingOrders ? (
                                                                        <div className="flex items-center justify-center py-8">
                                                                            <Loader2 className="size-5 animate-spin text-violet-500" />
                                                                        </div>
                                                                    ) : invoiceOrders.length === 0 ? (
                                                                        <div className="py-6 text-center">
                                                                            <p className="text-xs text-gray-400 font-medium">No linked orders found (consolidated invoice)</p>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="overflow-x-auto">
                                                                            <table className="w-full text-xs">
                                                                                <thead className="bg-gray-50/70">
                                                                                    <tr>
                                                                                        <th className="text-left px-4 py-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Tour Date</th>
                                                                                        <th className="text-left px-4 py-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Guide / Lead</th>
                                                                                        <th className="text-left px-4 py-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Boxes</th>
                                                                                        <th className="text-center px-4 py-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Lunches</th>
                                                                                        <th className="text-center px-4 py-2 font-bold text-emerald-600 uppercase tracking-wider text-[10px]">Comped</th>
                                                                                        <th className="text-right px-4 py-2 font-bold text-gray-500 uppercase tracking-wider text-[10px]">Subtotal</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-gray-50">
                                                                                    {invoiceOrders.map((order: any) => {
                                                                                        const paidItems = order.order_items.filter((i: any) => !i.is_comped);
                                                                                        const compedItems = order.order_items.filter((i: any) => i.is_comped);
                                                                                        const paidQty = paidItems.reduce((s: number, i: any) => s + i.quantity, 0);
                                                                                        const compedQty = compedItems.reduce((s: number, i: any) => s + i.quantity, 0);
                                                                                        const orderSubtotal = paidItems.reduce((s: number, i: any) => s + i.quantity * i.unit_price, 0);
                                                                                        const boxSummary = order.order_items
                                                                                            .map((i: any) => `${i.quantity}× ${i.meal_name}${i.is_comped ? ' (C)' : ''}`)
                                                                                            .join(', ');
                                                                                        return (
                                                                                            <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                                                                                                <td className="px-4 py-2.5 font-bold text-gray-800 whitespace-nowrap">{formatDateUS(order.tour_date)}</td>
                                                                                                <td className="px-4 py-2.5 font-black text-gray-900">{order.customer_name}</td>
                                                                                                <td className="px-4 py-2.5 text-gray-500 max-w-[200px]">
                                                                                                    <span className="truncate block" title={boxSummary}>{boxSummary}</span>
                                                                                                </td>
                                                                                                <td className="px-4 py-2.5 text-center font-bold text-gray-800">{paidQty}</td>
                                                                                                <td className="px-4 py-2.5 text-center">
                                                                                                    {compedQty > 0 ? (
                                                                                                        <span className="inline-flex items-center justify-center size-5 rounded-full bg-emerald-50 text-emerald-700 font-black text-[10px] border border-emerald-100">{compedQty}</span>
                                                                                                    ) : (
                                                                                                        <span className="text-gray-300">—</span>
                                                                                                    )}
                                                                                                </td>
                                                                                                <td className="px-4 py-2.5 text-right font-black text-gray-900">{formatCurrency(orderSubtotal)}</td>
                                                                                            </tr>
                                                                                        );
                                                                                    })}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* ── Section 2: Details & Financial Breakdown ── */}
                                                                <div className="bg-violet-50/30 border-t border-violet-100/60 px-4 py-4">
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                                                        
                                                                        {/* Left Column: Stripe & Offline Payment Actions */}
                                                                        <div className="space-y-4">
                                                                            <div>
                                                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Stripe Invoice Details</p>
                                                                                {invoice.stripe_invoice_id ? (
                                                                                    <div className="flex flex-col gap-0.5">
                                                                                        <p className="text-xs font-mono text-violet-700 font-bold truncate" title={invoice.stripe_invoice_id}>
                                                                                            ID: {invoice.stripe_invoice_id}
                                                                                        </p>
                                                                                        {invoice.sent_at && (
                                                                                            <p className="text-[11px] text-gray-500 font-medium">
                                                                                                Sent on {formatDateUS(invoice.sent_at)}
                                                                                            </p>
                                                                                        )}
                                                                                        {invoice.paid_at && (
                                                                                            <p className="text-[11px] text-emerald-600 font-bold">
                                                                                                Paid on {formatDateUS(invoice.paid_at)}
                                                                                            </p>
                                                                                        )}
                                                                                    </div>
                                                                                ) : (
                                                                                    <p className="text-xs text-gray-400">—</p>
                                                                                )}
                                                                            </div>

                                                                            {invoice.status !== 'paid' && (
                                                                                <div>
                                                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Offline Payment</p>
                                                                                    <Button
                                                                                        onClick={() => setInvoiceToMarkPaid({ id: invoice.id, amount: invoice.total_amount })}
                                                                                        disabled={markingPaidId !== null}
                                                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 px-4 text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer border-none"
                                                                                    >
                                                                                        <CheckCircle2 className="size-4" />
                                                                                        Mark Paid by Check
                                                                                    </Button>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                        {/* Right Column: Financial Breakdown */}
                                                                        <div className="space-y-1.5 max-w-xs md:ml-auto w-full">
                                                                            <p className="text-xs font-black text-gray-800 mb-2 flex items-center gap-1.5">
                                                                                <CreditCard className="size-3.5 text-violet-500" />
                                                                                Financial Breakdown
                                                                            </p>
                                                                            <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                                                <span>Subtotal (before discounts)</span>
                                                                                <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                                                                            </div>
                                                                            {(invoice.discount_amount ?? 0) > 0 && (
                                                                                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                                                                                    <span>Company Discount ({invoice.discount_percentage}%)</span>
                                                                                    <span>-{formatCurrency(invoice.discount_amount)}</span>
                                                                                </div>
                                                                            )}
                                                                            {((invoice.per_lunch_discount_rate ?? 0) * (invoice.per_lunch_discount_count ?? 0)) > 0 && (
                                                                                <div className="flex justify-between text-xs text-emerald-600 font-bold">
                                                                                    <span>Per-Lunch Discount ({formatCurrency(invoice.per_lunch_discount_rate)} × {formatNumber(invoice.per_lunch_discount_count)})</span>
                                                                                    <span>-{formatCurrency((invoice.per_lunch_discount_rate ?? 0) * (invoice.per_lunch_discount_count ?? 0))}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between text-xs text-gray-600 font-medium">
                                                                                <span>Resort Tax (4%)</span>
                                                                                <span className="font-bold text-gray-900">{formatCurrency(resortTaxLine)}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-xs text-gray-400 italic font-medium">
                                                                                <span>Credit Card Fee (est.)</span>
                                                                                <span>{formatCurrency(processingFeeEst)}</span>
                                                                            </div>
                                                                            <div className="flex justify-between text-sm font-black text-gray-900 pt-2 border-t border-violet-200 mt-1">
                                                                                <span>Invoice Total</span>
                                                                                <span className="text-violet-700">{formatCurrency(invoice.total_amount)}</span>
                                                                            </div>
                                                                            {(invoice.tip_amount ?? 0) > 0 && (
                                                                                <div className="flex justify-between text-xs text-emerald-700 font-bold pt-1">
                                                                                    <span>Tip Received 🎉</span>
                                                                                    <span>+{formatCurrency(invoice.tip_amount)}</span>
                                                                                </div>
                                                                            )}
                                                                        </div>

                                                                    </div>
                                                                </div>

                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })()}
                                        </React.Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center">
                        <ScrollText className="size-10 mb-3 opacity-20" />
                        <p className="font-bold text-gray-900">No generated invoices found</p>
                        <p className="text-xs text-gray-400 font-bold uppercase mt-1 tracking-wider">
                            Invoices will appear here once generated for tour companies.
                        </p>
                    </div>
                )}
            </Card>
                </>
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={invoiceToDelete !== null}
                onClose={() => setInvoiceToDelete(null)}
                onConfirm={executeInvoiceDelete}
                title="Delete Generated Invoice?"
                description={
                    invoiceToDelete
                        ? `Are you sure you want to delete the invoice of $${invoiceToDelete.amount.toFixed(2)}? This will void the invoice on Stripe and immediately revert all bundled orders back to unpaid.`
                        : ''
                }
                confirmText={deletingInvoice ? "Deleting..." : "Delete Invoice"}
                cancelText="Keep Invoice"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={invoiceToMarkPaid !== null}
                onClose={() => setInvoiceToMarkPaid(null)}
                onConfirm={executeMarkAsPaid}
                title="Mark Invoice as Paid?"
                description={
                    invoiceToMarkPaid
                        ? `Are you sure you want to manually mark the invoice of $${invoiceToMarkPaid.amount.toFixed(2)} as paid? This will record the payment and update all linked orders to paid.`
                        : ''
                }
                confirmText={markingPaidId !== null ? "Marking Paid..." : "Mark as Paid"}
                cancelText="Cancel"
                variant="success"
            />
        </div>
    );
}
