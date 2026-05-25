'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Printer, ShoppingCart, X } from 'lucide-react';
import { formatDateTimeUS } from '@/lib/utils';


interface OrderItem {
    id: string;
    meal_name: string;
    quantity: number;
    box_type: string | null;
    bread_type: string | null;
    cookie_choice: string | null;
    customizations: string | null;
}

interface Order {
    id: string;
    tour_date: string;
    status: string;
    created_at: string;
    company_id: string | null;
    order_items: OrderItem[];
}

interface QuantitiesClientProps {
    initialOrders: Order[];
    companies: { id: string; name: string }[];
}

const DATE_RANGE_LABELS: Record<string, string> = {
    '': 'All Dates',
    'today': 'Today',
    'yesterday': 'Yesterday',
    'tomorrow': 'Tomorrow',
    'this_week': 'This Week',
    'last_week': 'Last Week',
    'next_week': 'Next Week',
    'this_month': 'This Month',
    'last_month': 'Last Month',
    'next_month': 'Next Month',
    'next_3_months': 'Next 3 Months',
    'next_6_months': 'Next 6 Months',
    'next_12_months': 'Next 12 Months',
    'this_year': 'This Year',
    'last_3_months': 'Last 3 Months',
    'last_6_months': 'Last 6 Months',
    'last_12_months': 'Last 12 Months'
};

const STATUS_LABELS: Record<string, string> = {
    '': 'All Statuses',
    'pending': 'Pending',
    'fulfilled': 'Fulfilled',
    'cancelled': 'Cancelled',
};

export function QuantitiesClient({ initialOrders, companies }: QuantitiesClientProps) {
    const [orders] = useState<Order[]>(initialOrders);
    const [dateRange, setDateRange] = useState('today');
    const [dateFilterMode, setDateFilterMode] = useState<'tour' | 'order'>('tour');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const filteredOrders = orders.filter(o => {
        // Date Filtering Logic
        if (dateRange) {
            const now = new Date();
            const getLocalDateStr = (d: Date) => {
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
            };
            const todayStr = getLocalDateStr(now);
            const targetDateStr = dateFilterMode === 'tour' ? o.tour_date : o.created_at.split('T')[0];
            
            const parseLocalDate = (dateStr: string) => {
                const parts = dateStr.split('-');
                if (parts.length !== 3) return new Date();
                const [yyyy, mm, dd] = parts.map(Number);
                return new Date(yyyy, mm - 1, dd);
            };

            const orderDate = parseLocalDate(targetDateStr);
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            if (dateRange === 'today') {
                if (targetDateStr !== todayStr) return false;
            } else if (dateRange === 'yesterday') {
                const yesterday = new Date(today);
                yesterday.setDate(today.getDate() - 1);
                const yesterdayStr = getLocalDateStr(yesterday);
                if (targetDateStr !== yesterdayStr) return false;
            } else if (dateRange === 'tomorrow') {
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                const tomorrowStr = getLocalDateStr(tomorrow);
                if (targetDateStr !== tomorrowStr) return false;
            } else if (dateRange === 'this_week') {
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                if (orderDate < startOfWeek) return false;
            } else if (dateRange === 'last_week') {
                const startOfLastWeek = new Date(today);
                startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
                const endOfLastWeek = new Date(startOfLastWeek);
                endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
                if (orderDate < startOfLastWeek || orderDate > endOfLastWeek) return false;
            } else if (dateRange === 'next_week') {
                const startOfNextWeek = new Date(today);
                startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);
                const endOfNextWeek = new Date(startOfNextWeek);
                endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
                if (orderDate < startOfNextWeek || orderDate > endOfNextWeek) return false;
            } else if (dateRange === 'this_month') {
                if (orderDate.getMonth() !== today.getMonth() || orderDate.getFullYear() !== today.getFullYear()) return false;
            } else if (dateRange === 'last_month') {
                const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                if (orderDate.getMonth() !== lastMonth.getMonth() || orderDate.getFullYear() !== lastMonth.getFullYear()) return false;
            } else if (dateRange === 'next_month') {
                const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                if (orderDate.getMonth() !== nextMonth.getMonth() || orderDate.getFullYear() !== nextMonth.getFullYear()) return false;
            } else if (dateRange === 'next_3_months') {
                const limit = new Date(today);
                limit.setMonth(today.getMonth() + 3);
                if (orderDate <= today || orderDate > limit) return false;
            } else if (dateRange === 'next_6_months') {
                const limit = new Date(today);
                limit.setMonth(today.getMonth() + 6);
                if (orderDate <= today || orderDate > limit) return false;
            } else if (dateRange === 'next_12_months') {
                const limit = new Date(today);
                limit.setMonth(today.getMonth() + 12);
                if (orderDate <= today || orderDate > limit) return false;
            } else if (dateRange === 'this_year') {
                if (orderDate.getFullYear() !== today.getFullYear()) return false;
            } else if (dateRange === 'last_3_months') {
                const limit = new Date(today);
                limit.setMonth(today.getMonth() - 3);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                if (orderDate < limit || orderDate >= tomorrow) return false;
            } else if (dateRange === 'last_6_months') {
                const limit = new Date(today);
                limit.setMonth(today.getMonth() - 6);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                if (orderDate < limit || orderDate >= tomorrow) return false;
            } else if (dateRange === 'last_12_months') {
                const limit = new Date(today);
                limit.setMonth(today.getMonth() - 12);
                const tomorrow = new Date(today);
                tomorrow.setDate(today.getDate() + 1);
                if (orderDate < limit || orderDate >= tomorrow) return false;
            } else if (dateRange.includes('-')) { // Custom date YYYY-MM-DD
                if (targetDateStr !== dateRange) return false;
            }
        }

        if (companyFilter && o.company_id !== companyFilter) return false;
        if (statusFilter && o.status !== statusFilter) return false;
        return true;
    });

    // Aggregate quantities from filtered orders
    const itemsAggregation: Record<string, { type: 'meal' | 'cookie', name: string; standard: number; junior: number; sandwich: number }> = {};
    let mealsJuniorTotal = 0;
    let mealsStandardTotal = 0;
    let mealsSandwichTotal = 0;
    let cookiesJuniorTotal = 0;
    let cookiesStandardTotal = 0;

    filteredOrders.forEach(order => {
        order.order_items?.forEach(item => {
            const box = (item.box_type || '').toLowerCase();
            const isJunior = box.includes('junior');
            const isSandwich = box.includes('sandwich');
            const isStandard = !isJunior && !isSandwich && box.length > 0 && box !== 'no box' && box !== 'none';

            // Aggregate meals
            const mealName = item.meal_name;
            if (mealName) {
                if (!itemsAggregation[mealName]) {
                    itemsAggregation[mealName] = { type: 'meal', name: mealName, standard: 0, junior: 0, sandwich: 0 };
                }
                
                if (isJunior) {
                    itemsAggregation[mealName].junior += item.quantity;
                    mealsJuniorTotal += item.quantity;
                } else if (isSandwich) {
                    itemsAggregation[mealName].sandwich += item.quantity;
                    mealsSandwichTotal += item.quantity;
                } else if (isStandard) {
                    itemsAggregation[mealName].standard += item.quantity;
                    mealsStandardTotal += item.quantity;
                }
            }

            // Aggregate cookies
            const cookieName = item.cookie_choice;
            if (cookieName && cookieName !== 'No Cookie' && cookieName.trim() !== '' && !isSandwich) {
                const cName = cookieName;
                const cookieKey = `cookie_${cName}`;
                if (!itemsAggregation[cookieKey]) {
                    itemsAggregation[cookieKey] = { type: 'cookie', name: cName, standard: 0, junior: 0, sandwich: 0 };
                }
                
                if (isJunior) {
                    itemsAggregation[cookieKey].junior += item.quantity;
                    cookiesJuniorTotal += item.quantity;
                } else if (isStandard) {
                    itemsAggregation[cookieKey].standard += item.quantity;
                    cookiesStandardTotal += item.quantity;
                }
            }
        });
    });

    const aggregatedMeals = Object.values(itemsAggregation)
        .filter(i => i.type === 'meal')
        .sort((a, b) => a.name.localeCompare(b.name));

    const aggregatedCookies = Object.values(itemsAggregation)
        .filter(i => i.type === 'cookie')
        .sort((a, b) => a.name.localeCompare(b.name));

    const hasFilters = !!(dateRange || companyFilter || statusFilter);

    return (
        <>
            <div className="space-y-6 dashboard-web-view no-print">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Prep Quantities</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="gap-2 h-11 px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold" 
                            onClick={() => window.print()}
                        >
                            <Printer className="size-4" /> Print Table
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="rounded-2xl border-gray-100 shadow-sm mb-6">
                    <CardContent className="p-3 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl border border-gray-200">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDateFilterMode('tour')}
                                className={`h-8 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    dateFilterMode === 'tour' 
                                        ? 'bg-white text-violet-600 shadow-sm border-gray-200' 
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                Tour Date
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDateFilterMode('order')}
                                className={`h-8 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    dateFilterMode === 'order' 
                                        ? 'bg-white text-violet-600 shadow-sm border-gray-200' 
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                Order Date
                            </Button>
                        </div>

                        <Select value={dateRange} onValueChange={(v) => setDateRange(v || '')}>
                            <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                                <SelectValue placeholder="All Dates">
                                    {DATE_RANGE_LABELS[dateRange] || dateRange}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Dates</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="yesterday">Yesterday</SelectItem>
                                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                                <SelectItem value="this_week">This Week</SelectItem>
                                <SelectItem value="last_week">Last Week</SelectItem>
                                <SelectItem value="next_week">Next Week</SelectItem>
                                <SelectItem value="this_month">This Month</SelectItem>
                                <SelectItem value="last_month">Last Month</SelectItem>
                                <SelectItem value="next_month">Next Month</SelectItem>
                                <SelectItem value="next_3_months">Next 3 Months</SelectItem>
                                <SelectItem value="next_6_months">Next 6 Months</SelectItem>
                                <SelectItem value="next_12_months">Next 12 Months</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                                <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                                <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                                <SelectItem value="last_12_months">Last 12 Months</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input 
                            type="date" 
                            value={dateRange.includes('-') ? dateRange : ''} 
                            onChange={e => setDateRange(e.target.value)}
                            className="w-[160px] h-10 rounded-xl border-gray-200 text-sm font-semibold" 
                        />

                        <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v || '')}>
                            <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                                <SelectValue placeholder="All Companies">
                                    {companies.find(c => c.id === companyFilter)?.name || 'All Companies'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Companies</SelectItem>
                                {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>

                        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || '')}>
                            <SelectTrigger className="w-[160px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                                <SelectValue placeholder="All Statuses">
                                    {STATUS_LABELS[statusFilter] || 'All Statuses'}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="fulfilled">Fulfilled</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>

                        {hasFilters && (
                            <Button variant="ghost" size="sm" onClick={() => { setDateRange(''); setCompanyFilter(''); setStatusFilter(''); }} className="gap-2 text-xs font-bold h-10 px-4 text-gray-400 hover:text-gray-900 transition-colors">
                                <X className="size-3.5" /> Clear
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Content */}
                {aggregatedMeals.length === 0 && aggregatedCookies.length === 0 ? (
                    <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                        <CardContent className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                                <ShoppingCart className="size-10 opacity-20" />
                            </div>
                            <p className="font-bold text-gray-900 text-lg">No items found</p>
                            <p className="text-sm mt-1 max-w-[300px] text-center">
                                Try adjusting your filters to see prep totals.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {/* Meals Table */}
                        {aggregatedMeals.length > 0 && (
                            <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                                <div className="px-6 py-4 border-b border-gray-100 bg-white">
                                    <h2 className="text-lg font-bold text-gray-900">Sandwiches & Salads</h2>
                                </div>
                                <div className="p-0">
                                    <Table>
                                        <TableHeader className="bg-violet-100/50">
                                            <TableRow className="hover:bg-transparent border-violet-100">
                                            <TableHead className="font-bold text-gray-900 py-3 pl-6 text-left">Sandwich</TableHead>
                                            <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Junior Box</TableHead>
                                            <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Standard Box</TableHead>
                                            <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Sandwich Only</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aggregatedMeals.map((item, i) => (
                                            <TableRow key={i} className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0 transition-colors">
                                                <TableCell className="font-semibold text-sm text-gray-900 py-2.5 pl-6">{item.name}</TableCell>
                                                <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.junior}</TableCell>
                                                <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.standard}</TableCell>
                                                <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.sandwich || 0}</TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-violet-50/50 border-t-2 border-violet-200">
                                            <TableCell className="font-black text-gray-900 pl-6 py-3">TOTAL</TableCell>
                                            <TableCell className="py-3 text-center font-black text-violet-600 text-base">{mealsJuniorTotal}</TableCell>
                                            <TableCell className="py-3 text-center font-black text-violet-600 text-base">{mealsStandardTotal}</TableCell>
                                            <TableCell className="py-3 text-center font-black text-violet-600 text-base">{mealsSandwichTotal}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            </Card>
                        )}

                        {/* Cookies Table */}
                        {aggregatedCookies.length > 0 && (
                            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-white">
                                    <h2 className="text-lg font-bold text-gray-900">House-made Cookies</h2>
                                </div>
                                <div className="p-0">
                                    <Table>
                                        <TableHeader className="bg-violet-100/50">
                                            <TableRow className="hover:bg-transparent border-violet-100">
                                            <TableHead className="font-bold text-gray-900 py-3 pl-6 text-left">House-made Cookie</TableHead>
                                            <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Junior Box</TableHead>
                                            <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Standard Box</TableHead>
                                            <TableHead className="w-36"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {aggregatedCookies.map((item, i) => (
                                            <TableRow key={i} className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0 transition-colors">
                                                <TableCell className="font-semibold text-sm text-amber-700 py-2.5 pl-6">{item.name}</TableCell>
                                                <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.junior}</TableCell>
                                                <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.standard}</TableCell>
                                                <TableCell className="w-36"></TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow className="bg-violet-50/50 border-t-2 border-violet-200">
                                            <TableCell className="font-black text-gray-900 pl-6 py-3">TOTAL</TableCell>
                                            <TableCell className="py-3 text-center font-black text-violet-600 text-base">{cookiesJuniorTotal}</TableCell>
                                            <TableCell className="py-3 text-center font-black text-violet-600 text-base">{cookiesStandardTotal}</TableCell>
                                            <TableCell className="w-36"></TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                            </Card>
                        )}
                    </div>
                )}
            </div>

            {/* Print View (Hidden on Screen) */}
            <div className="print-only-section print-prep-report">
                <div className="p-8">
                    <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Prep Quantities Report</h1>
                            <p className="text-sm font-bold text-gray-600">Mountain Mama's Café · Kitchen Prep Sheet</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Printed On</p>
                            <p className="text-sm font-bold" suppressHydrationWarning>
                                {formatDateTimeUS(new Date())}
                            </p>
                        </div>
                    </div>

                    {/* Filter Summary for Context */}
                    <div className="mb-4 p-2 bg-gray-50 border border-gray-200 rounded-md flex flex-wrap gap-x-6 gap-y-1">
                        <div>
                            <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider">Date Mode</span>
                            <span className="font-semibold uppercase text-xs">{dateFilterMode} Date</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider">Range</span>
                            <span className="font-semibold text-xs">{DATE_RANGE_LABELS[dateRange] || dateRange}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider">Company</span>
                            <span className="font-semibold text-xs">{companies.find(c => c.id === companyFilter)?.name || 'All Companies'}</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider">Status</span>
                            <span className="font-semibold text-xs">{STATUS_LABELS[statusFilter] || 'All Statuses'}</span>
                        </div>
                    </div>

                    <div className="print-only-section mt-8">
                        {/* Meals Table */}
                        {aggregatedMeals.length > 0 && (
                            <div className="mb-10">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 text-black">
                                            <th className="p-1.5 px-3 text-left font-bold border-b-2 border-gray-300">Sandwich</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Junior Box</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Standard Box</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Sandwich Only</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedMeals.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                <td className="p-1.5 px-3 text-left font-semibold text-gray-800">{item.name}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.junior}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.standard}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.sandwich || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t-2 border-gray-300">
                                            <td className="p-2 px-3 font-black text-left uppercase text-xs">Total</td>
                                            <td className="p-2 px-3 text-center font-black text-base">{mealsJuniorTotal}</td>
                                            <td className="p-2 px-3 text-center font-black text-base">{mealsStandardTotal}</td>
                                            <td className="p-2 px-3 text-center font-black text-base">{mealsSandwichTotal}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}

                        {/* Cookies Table */}
                        {aggregatedCookies.length > 0 && (
                            <div>
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 text-black">
                                            <th className="p-1.5 px-3 text-left font-bold border-b-2 border-gray-300">House-made Cookie</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Junior Box</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Standard Box</th>
                                            <th className="p-1.5 px-3 border-b-2 border-gray-300 w-28"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedCookies.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                <td className="p-1.5 px-3 text-left font-semibold text-gray-800">{item.name}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.junior}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.standard}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold"></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t-2 border-gray-300">
                                            <td className="p-2 px-3 font-black text-left uppercase text-xs">Total</td>
                                            <td className="p-2 px-3 text-center font-black text-base">{cookiesJuniorTotal}</td>
                                            <td className="p-2 px-3 text-center font-black text-base">{cookiesStandardTotal}</td>
                                            <td className="p-2 px-3 w-28"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-6 border-t-2 border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-widest text-center">
                        Mountains Mama's Café Admin Dashboard · Prep Quantities Sheet
                    </div>
                </div>
            </div>

            <style jsx global>{`
                /* Hide print containers by default in screen view */
                @media screen {
                    .print-only-section {
                        display: none !important;
                    }
                }

                @media print {
                    /* Hide EVERYTHING in the dashboard */
                    nav, aside, header, .no-print, .dashboard-web-view {
                        display: none !important;
                    }

                    /* Reset body margins for print */
                    body, html {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    /* Only show the prep report */
                    .print-prep-report {
                        display: block !important;
                        position: absolute !important;
                        top: 0; left: 0; width: 100%;
                    }

                    @page {
                        margin: 1.5cm;
                        size: portrait;
                    }

                    /* Ensure background colors and borders print correctly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    table {
                        width: 100%;
                        border-spacing: 0;
                    }
                }
            `}</style>
        </>
    );
}
