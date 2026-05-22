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
    FileText, Loader2, RefreshCw, ScrollText, CheckCircle2, ChevronRight, Trash2, Search
} from 'lucide-react';
import { cn, formatDateUS } from '@/lib/utils';
import { fetchOrdersForInvoicing, fetchInvoicesHistory } from './actions';
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
    
    // UI Loading States
    const [fetching, setFetching] = useState<boolean>(false);
    const [generating, setGenerating] = useState<boolean>(false);
    const [deletingInvoice, setDeletingInvoice] = useState<boolean>(false);

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
        if (activeCompanyId && activeStartDate && activeEndDate) {
            loadEligibleOrders(activeCompanyId, activeStartDate, activeEndDate);
        } else {
            setOrders([]);
            setSelectedOrderIds(new Set());
        }
    }, [activeCompanyId, activeStartDate, activeEndDate]);

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
        const aggregations: Record<string, { meal_name: string; box_type: string; quantity: number; total_price: number }> = {};
        
        orders.forEach(order => {
            if (!selectedOrderIds.has(order.id)) return;
            
            order.order_items.forEach((item: any) => {
                const key = `${item.meal_name}-${item.box_type || 'Box Lunch'}`;
                if (!aggregations[key]) {
                    aggregations[key] = {
                        meal_name: item.meal_name,
                        box_type: item.box_type || 'Box Lunch',
                        quantity: 0,
                        total_price: 0
                    };
                }
                aggregations[key].quantity += item.quantity;
                aggregations[key].total_price += item.quantity * item.unit_price;
            });
        });

        return Object.values(aggregations);
    };

    const getEstimatedTotal = () => {
        let subtotal = 0;
        orders.forEach(order => {
            if (!selectedOrderIds.has(order.id)) return;
            order.order_items.forEach((item: any) => {
                subtotal += item.quantity * item.unit_price;
            });
        });
        
        const resortTax = subtotal * 0.04;
        const processingFee = (subtotal + resortTax) * 0.029 + 0.30;
        const total = subtotal + resortTax + processingFee;
        
        return { subtotal, resortTax, processingFee, total };
    };

    const handleCreateInvoice = async () => {
        if (!activeCompanyId || activeCompanyId === 'all' || selectedOrderIds.size === 0) {
            toast.error('Please select at least one order to invoice.');
            return;
        }

        setGenerating(true);
        const toastId = toast.loading('Generating invoice and billing on Stripe...');

        try {
            const res = await generateCompanyInvoice(Array.from(selectedOrderIds));
            if (res.success) {
                toast.success('Invoice generated successfully! View under history or on Stripe.', { id: toastId });
                
                // Refresh local history & reload orders
                const historyRes = await fetchInvoicesHistory();
                if (historyRes.success) {
                    setInvoices(historyRes.invoices);
                }
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

    const aggregatedMeals = getAggregatedMeals();
    const pricing = getEstimatedTotal();
    const selectedCompany = companies.find(c => c.id === activeCompanyId);

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
        <div className="space-y-8">
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
                ) : orders.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                        {/* List & Selection */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Checklist Table */}
                            <Card className="shadow-sm border-gray-100 bg-white overflow-hidden">
                                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-gray-900 text-base">Select Orders to Invoice</h3>
                                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                                            {selectedOrderIds.size} of {orders.length} tours selected for billing
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleAllOrders}
                                        className="h-8 text-xs font-bold border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 cursor-pointer"
                                    >
                                        {selectedOrderIds.size === orders.length ? 'Deselect All' : 'Select All'}
                                    </Button>
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
                                                            ${orderTotal.toFixed(2)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>

                        {/* Invoice Builder / Aggregations Sidebar */}
                        <div className="space-y-6">
                            {/* Aggregated Preview Card */}
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
                                                        <p className="text-xs font-bold text-gray-900">{agg.quantity} lunches</p>
                                                        <p className="text-[10px] text-violet-600 font-black">${agg.total_price.toFixed(2)}</p>
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
                                        
                                        <div className="flex justify-between text-xs text-gray-500 font-medium pt-2 mt-2 border-t border-violet-50/50">
                                            <span>Subtotal</span>
                                            <span className="font-bold text-gray-700">${pricing.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>Resort Tax (4%)</span>
                                            <span className="font-bold text-gray-700">${pricing.resortTax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                                            <span>Processing Fee</span>
                                            <span className="font-bold text-gray-700">${pricing.processingFee.toFixed(2)}</span>
                                        </div>

                                        <div className="flex justify-between items-baseline pt-3 border-t border-dashed border-violet-200">
                                            <span className="text-sm font-black text-gray-900">Invoice Total</span>
                                            <span className="text-2xl font-black text-violet-700">
                                                ${pricing.total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleCreateInvoice}
                                        disabled={generating || selectedOrderIds.size === 0}
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
                                            <p className="text-sm font-black text-gray-900">${invoice.total_amount.toFixed(2)}</p>
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
                                            <a 
                                                href={invoice.stripe_payment_link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer"
                                                title="Open Stripe Payment Link"
                                            >
                                                <ExternalLink className="size-3.5" />
                                            </a>
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

            {/* Invoice History Section */}
            <Card className="shadow-sm border-gray-100 bg-white overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                            <ScrollText className="size-4.5 text-violet-500" /> Invoice History Ledger
                        </h3>
                        <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5 tracking-wider">
                            {filteredInvoices.length} {selectedCompanyId ? 'company' : 'global'} invoices generated in total
                        </p>
                    </div>
                    {selectedCompanyId && (
                        <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-100 font-bold rounded-full py-0.5 px-2.5 text-[9px] uppercase tracking-wider">
                            Filtered: {selectedCompany?.name}
                        </Badge>
                    )}
                </div>
                {filteredInvoices.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-bold text-gray-900 py-3 pl-6">Company</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Billing Period</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Created Date</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Amount</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-3">Status</TableHead>
                                    <TableHead className="text-right font-bold text-gray-900 py-3 pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.map((invoice: any) => (
                                    <TableRow key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-black text-gray-950 text-xs pl-6">
                                            {invoice.tour_companies?.name || 'Unknown Company'}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-600 font-medium">
                                            {formatDateUS(invoice.period_start)} — {formatDateUS(invoice.period_end)}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-400 font-bold">
                                            {formatDateUS(invoice.created_at)}
                                        </TableCell>
                                        <TableCell className="font-black text-gray-900 text-xs">
                                            ${invoice.total_amount.toFixed(2)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "rounded-full font-bold uppercase tracking-widest text-[9px] px-2.5 py-0.5",
                                                invoice.status === 'paid' 
                                                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100" 
                                                    : "bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-100"
                                            )}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
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
                                                    <a 
                                                        href={invoice.stripe_payment_link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-200 transition-all cursor-pointer"
                                                        title="Open Stripe Payment Link"
                                                    >
                                                        <ExternalLink className="size-3.5" />
                                                    </a>
                                                )}
                                                <button 
                                                    onClick={() => setInvoiceToDelete({ id: invoice.id, amount: invoice.total_amount, companyId: invoice.company_id })}
                                                    className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                                                    title="Delete Invoice & Reset Orders"
                                                >
                                                    <Trash2 className="size-3.5" />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
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
        </div>
    );
}
