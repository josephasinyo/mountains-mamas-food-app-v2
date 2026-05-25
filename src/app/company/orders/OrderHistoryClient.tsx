'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    Search, ShoppingCart, Calendar, Clock, 
    ChevronRight, ListFilter, Download, Printer, 
    Ticket, Building2, X, MoreHorizontal, Pencil,
    Trash2, Check, ArrowUpDown, ArrowUp, ArrowDown,
    LayoutGrid, List,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn, formatDateUS } from '@/lib/utils';
import { OrderItemDetails } from '@/components/ui/OrderItemCustomFields';

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
import { ConfirmDialog } from '@/components/ConfirmDialog';

import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { updateCompanyOrderStatus, deleteCompanyOrder, getCompanyMenuSelections } from '../actions';
import { updateOrderDetails } from '../../admin/orders/actions';
import { toast } from 'sonner';
import { OrderItemCustomFields } from '@/components/ui/OrderItemCustomFields';

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
};

interface OrderHistoryClientProps {
    initialData: any;
}

export default function OrderHistoryClient({ initialData }: OrderHistoryClientProps) {
    const [allOrders, setAllOrders] = useState<any[]>(initialData.recentOrders || []);
    const [search, setSearch] = useState('');
    const [expanded, setExpanded] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilterMode, setDateFilterMode] = useState<'tour' | 'order'>('tour');
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'created_at' | 'tour_date', direction: 'asc' | 'desc' }>({ 
        key: 'created_at', 
        direction: 'desc' 
    });

    const toggleSort = (key: 'created_at' | 'tour_date') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Edit Dialog State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<any>(null);
    const [customerName, setCustomerName] = useState('');
    const [guideName, setGuideName] = useState('');
    const [tourDate, setTourDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [notes, setNotes] = useState('');
    const [editItems, setEditItems] = useState<any[]>([]);

    const filteredOrders = (allOrders || []).filter((order: any) => {
        // Search
        const searchMatch = 
            order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
            order.guide_name?.toLowerCase().includes(search.toLowerCase());
        if (search && !searchMatch) return false;

        // Status
        if (statusFilter && order.status !== statusFilter) return false;

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
            const targetDateStr = dateFilterMode === 'tour' ? order.tour_date : order.created_at.split('T')[0];
            
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

        return true;
    });

    const sortedOrders = [...filteredOrders].sort((a: any, b: any) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (!aVal) return 1;
        if (!bVal) return -1;
        
        if (sortConfig.direction === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const totalLunchItemsCount = React.useMemo(() => {
        return filteredOrders.reduce((sum: number, order: any) => {
            return sum + (order.order_items?.reduce((acc: number, item: any) => acc + (item.quantity || 1), 0) || 0);
        }, 0);
    }, [filteredOrders]);

    function handleExport() {
        const headers = ['Order ID', 'Customer', 'Guide', 'Tour Date', 'Pickup', 'Status', 'Items', 'Placed At'];
        const rows = filteredOrders.map((o: any) => {
            const items = o.order_items?.map((i: any) => `${i.quantity}x ${i.meal_name}${i.guest_name ? ` (Guest: ${i.guest_name})` : ''}`).join('; ') || '';
            return [
                o.id.slice(0, 8), 
                `"${o.customer_name}"`, 
                `"${o.guide_name || ''}"`, 
                o.tour_date, 
                o.pickup_time || '', 
                o.status, 
                `"${items}"`, 
                new Date(o.created_at).toISOString()
            ].join(',');
        });

        const csv = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleStatus(id: string, status: string) {
        setLoading(true);
        const result = await updateCompanyOrderStatus(id, status);
        if (result.success) {
            toast.success(`Order marked as ${STATUS_LABELS[status] || status}`);
            setAllOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        } else {
            toast.error(result.error || 'Failed to update status');
        }
        setLoading(false);
    }

    function handleDelete(id: string) {
        setOrderToDelete(id);
    }

    async function executeDelete() {
        if (!orderToDelete) return;
        setLoading(true);
        const result = await deleteCompanyOrder(orderToDelete);
        if (result.success) {
            toast.success('Order deleted successfully');
            setAllOrders(prev => prev.filter(o => o.id !== orderToDelete));
        } else {
            toast.error(result.error || 'Failed to delete order');
        }
        setLoading(false);
        setOrderToDelete(null);
    }

    async function handleSaveEdit() {
        if (!editingOrder) return;
        setLoading(true);
        const result = await updateOrderDetails(editingOrder.id, {
            customer_name: customerName,
            guide_name: guideName || null,
            tour_date: tourDate,
            pickup_time: pickupTime || null,
            notes: notes || null,
            company_id: editingOrder.company_id
        }, editItems);

        if (result.success) {
            toast.success('Order updated successfully');
            setAllOrders(prev => prev.map(o => o.id === editingOrder.id ? { 
                ...o, 
                customer_name: customerName,
                guide_name: guideName || null,
                tour_date: tourDate,
                pickup_time: pickupTime || null,
                notes: notes || null,
                order_items: editItems
            } : o));
            setIsEditDialogOpen(false);
        } else {
            toast.error(result.error || 'Failed to update order');
        }
        setLoading(false);
    }

    const hasChanges = 
        customerName !== editingOrder?.customer_name ||
        guideName !== (editingOrder?.guide_name || '') ||
        tourDate !== editingOrder?.tour_date ||
        pickupTime !== (editingOrder?.pickup_time || '') ||
        notes !== (editingOrder?.notes || '') ||
        JSON.stringify(editItems) !== JSON.stringify(editingOrder?.order_items);

    const updateEditItem = (itemId: string, updates: any) => {
        setEditItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    };
    const pendingCount = filteredOrders.filter((o: any) => o.status === 'pending').length;
    const hasFilters = !!(dateRange || statusFilter || search);

    return (
        <div className="space-y-6 dashboard-web-view no-print">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Order History</h1>
                        <p className="hidden md:block text-sm font-medium text-gray-500 mt-1">
                            <span className="text-violet-600 font-bold">{filteredOrders.length}</span> order{filteredOrders.length !== 1 ? 's' : ''} found ·{' '}
                            <span className="text-violet-600 font-bold">{totalLunchItemsCount}</span> total lunch{totalLunchItemsCount !== 1 ? 'es' : ''} ·{' '}
                            <span className="text-amber-500 font-bold">{pendingCount}</span> pending
                        </p>
                    </div>
                    {/* Mobile View Mode Toggle */}
                    <div className="flex md:hidden items-center gap-1 bg-gray-100 p-1 rounded-xl h-11 border border-gray-200/50">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`h-9 rounded-lg px-3 transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-violet-600 font-bold' : 'text-gray-500 font-medium'}`}
                        >
                            <List className="size-4 mr-1" />
                            <span className="text-xs">List</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={`h-9 rounded-lg px-3 transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-violet-600 font-bold' : 'text-gray-500 font-medium'}`}
                        >
                            <LayoutGrid className="size-4 mr-1" />
                            <span className="text-xs">Cards</span>
                        </Button>
                    </div>
                </div>

                {/* Mobile-only Stats */}
                <p className="block md:hidden text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-100/70 rounded-xl p-3 text-center">
                    <span className="text-violet-600 font-black">{filteredOrders.length}</span> orders ·{' '}
                    <span className="text-violet-600 font-black">{totalLunchItemsCount}</span> lunches ·{' '}
                    <span className="text-amber-500 font-black">{pendingCount}</span> pending
                </p>

                {/* Actions Grid */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                    {/* Desktop View Mode Toggle */}
                    <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-xl h-11 border border-gray-200/50 mr-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`h-9 rounded-lg px-3 transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-violet-600 font-bold' : 'text-gray-500 font-medium'}`}
                        >
                            <List className="size-4 mr-1.5" />
                            <span className="text-xs">List</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            type="button"
                            onClick={() => setViewMode('cards')}
                            className={`h-9 rounded-lg px-3 transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-violet-600 font-bold' : 'text-gray-500 font-medium'}`}
                        >
                            <LayoutGrid className="size-4 mr-1.5" />
                            <span className="text-xs">Cards</span>
                        </Button>
                    </div>

                    {/* Print & Export buttons row */}
                    <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            className="gap-1.5 h-11 px-2 md:px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold no-print text-[11px] md:text-sm" 
                            onClick={() => {
                                document.body.classList.add('print-table-mode');
                                window.print();
                                document.body.classList.remove('print-table-mode');
                            }}
                        >
                            <Printer className="size-4 shrink-0" />
                            <span className="truncate">Print Table</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            className="gap-1.5 h-11 px-2 md:px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold no-print text-[11px] md:text-sm" 
                            onClick={handleExport}
                        >
                            <Download className="size-4 shrink-0" />
                            <span className="truncate">Export CSV</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <Card className="rounded-2xl border-gray-100 shadow-sm mb-6">
                <CardContent className="p-3 flex flex-wrap items-center gap-4">
                    {/* Search Bar */}
                    <div className="relative flex-1 min-w-[240px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input 
                            placeholder="Search customer or guide..." 
                            className="pl-10 h-10 rounded-xl border-gray-200 bg-white font-medium text-sm focus:ring-violet-500/10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

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

                    <Select value={dateRange} onValueChange={(val) => setDateRange(val ?? '')}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                            <SelectValue placeholder="All Dates">
                                {DATE_RANGE_LABELS[dateRange] || dateRange || 'All Dates'}
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

                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? '')}>
                        <SelectTrigger className="w-[160px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            <SelectItem value="pending" className="font-semibold text-xs">Pending</SelectItem>
                            <SelectItem value="fulfilled" className="font-semibold text-xs">Fulfilled</SelectItem>
                            <SelectItem value="cancelled" className="font-semibold text-xs">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    {hasFilters && (
                        <Button variant="ghost" size="sm" onClick={() => { setDateRange(''); setStatusFilter(''); setSearch(''); }} className="gap-2 text-xs font-bold h-10 px-4 text-gray-400 hover:text-gray-900 transition-colors">
                            <X className="size-3.5" /> Clear
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* View Layout Content */}
            {viewMode === 'table' ? (
                <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead className="w-[32px] py-4 pl-6" />
                                    <TableHead className="font-bold text-gray-900 py-4">Customer</TableHead>
                                    <TableHead 
                                        className="font-bold text-gray-900 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors group/sort"
                                        onClick={() => toggleSort('tour_date')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Tour Date
                                            {sortConfig.key === 'tour_date' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="size-3 text-violet-600" /> : <ArrowDown className="size-3 text-violet-600" />
                                            ) : (
                                                <ArrowUpDown className="size-3 text-gray-300 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead 
                                        className="font-bold text-gray-900 py-4 cursor-pointer hover:bg-gray-100/50 transition-colors group/sort"
                                        onClick={() => toggleSort('created_at')}
                                    >
                                        <div className="flex items-center gap-1">
                                            Placed At
                                            {sortConfig.key === 'created_at' ? (
                                                sortConfig.direction === 'asc' ? <ArrowUp className="size-3 text-violet-600" /> : <ArrowDown className="size-3 text-violet-600" />
                                            ) : (
                                                <ArrowUpDown className="size-3 text-gray-300 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                                            )}
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-bold text-gray-900 py-4">Items</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                                    <TableHead className="font-bold text-gray-900 py-4 text-center pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOrders.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="py-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                                    <ShoppingCart className="size-8 opacity-20" />
                                                </div>
                                                <p className="font-bold text-gray-900 text-lg">No orders found</p>
                                                <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    sortedOrders.flatMap((order: any) => {
                                        const isExpanded = expanded === order.id;
                                        return [
                                            <TableRow
                                                key={order.id}
                                                className={`cursor-pointer transition-all duration-200 border-b border-gray-100 group relative ${
                                                    isExpanded ? 'bg-violet-50/50' : 'hover:bg-gray-50/80'
                                                }`}
                                                onClick={() => setExpanded(isExpanded ? null : order.id)}
                                            >
                                                <TableCell className={`pl-6 py-4 relative ${isExpanded ? 'after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-violet-600' : ''}`}>
                                                    <ChevronRight className={`size-4 text-gray-300 group-hover:text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-90 text-violet-600' : ''}`} />
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`size-9 rounded-xl flex items-center justify-center text-[13px] font-black transition-all ${
                                                            isExpanded 
                                                                ? 'bg-violet-600 text-white shadow-sm' 
                                                                : 'bg-gray-100 text-gray-600 group-hover:bg-violet-100 group-hover:text-violet-700'
                                                        }`}>
                                                            {(order.guide_name || order.customer_name)?.charAt(0).toUpperCase() || '?'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[13.5px] text-gray-900">{order.guide_name || order.customer_name}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-bold text-gray-900">{formatDateUS(order.tour_date)}</span>
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{order.pickup_time || 'No time set'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-[13px] font-semibold text-gray-400">
                                                            {isMounted ? formatDateUS(order.created_at) : ''}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">
                                                            {isMounted ? new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3 text-left">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-7 rounded-lg bg-violet-50 flex items-center justify-center text-[11px] font-extrabold text-violet-600 border border-violet-100">
                                                                {order.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0}
                                                            </div>
                                                            <span className="text-[12px] font-bold text-gray-900">Total Items</span>
                                                        </div>
                                                        {!isExpanded && (
                                                            <div className="flex flex-col items-start gap-0.5 ml-1">
                                                                {order.order_items?.slice(0, 5).map((item: any, i: number) => (
                                                                    <p key={i} className="text-[10px] font-medium text-gray-500 leading-tight">
                                                                        <span className="font-bold text-violet-600/80">{item.quantity}x</span> {item.meal_name}
                                                                    </p>
                                                                ))}
                                                                {order.order_items && order.order_items.length > 5 && (
                                                                    <p className="text-[9px] font-bold text-violet-500 italic mt-0.5">
                                                                        {order.order_items.length - 5} more items
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className={`
                                                        rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider
                                                        ${order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                        ${order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                        ${order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                    `}>
                                                        {STATUS_LABELS[order.status] || order.status.replace('_', ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-4 text-center pr-6" onClick={e => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger className={cn(
                                                            buttonVariants({ variant: 'ghost', size: 'icon' }),
                                                            "h-9 w-9 p-0 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all"
                                                        )}>
                                                            <MoreHorizontal className="size-4" />
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Actions</DropdownMenuLabel>
                                                        </DropdownMenuGroup>
                                                        
                                                        <DropdownMenuItem 
                                                            className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700 cursor-pointer"
                                                            onClick={() => {
                                                                setEditingOrder(order);
                                                                setCustomerName(order.customer_name || '');
                                                                setGuideName(order.guide_name || '');
                                                                setTourDate(order.tour_date || '');
                                                                setPickupTime(order.pickup_time || '');
                                                                setNotes(order.notes || '');
                                                                setEditItems(JSON.parse(JSON.stringify(order.order_items || [])));
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="size-3.5" /> Edit Order
                                                        </DropdownMenuItem>
                                                            
                                                            {order.status === 'cancelled' ? (
                                                                <DropdownMenuItem 
                                                                    className="rounded-lg gap-2 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                                                                    onClick={() => handleStatus(order.id, 'pending')}
                                                                >
                                                                    <Check className="size-3.5" /> Set to Pending
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem 
                                                                    className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                                                                    onClick={() => handleStatus(order.id, 'cancelled')}
                                                                >
                                                                    <X className="size-3.5" /> Cancel Order
                                                                </DropdownMenuItem>
                                                            )}

                                                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                            
                                                            <DropdownMenuItem 
                                                                className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                                                                onClick={() => handleDelete(order.id)}
                                                            >
                                                                <Trash2 className="size-3.5" /> Delete Order
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>,
                                            <AnimatePresence key={`${order.id}-detail`}>
                                                {isExpanded && (
                                                    <TableRow className="border-none hover:bg-transparent">
                                                        <TableCell colSpan={7} className="p-0 border-b border-gray-100">
                                                            <motion.div 
                                                                initial={{ opacity: 0, height: 0 }}
                                                                animate={{ opacity: 1, height: 'auto' }}
                                                                exit={{ opacity: 0, height: 0 }}
                                                                className="overflow-hidden bg-gray-50/50 px-6 py-8 border-t border-gray-100"
                                                            >
                                                                <div className="max-w-3xl mx-auto">
                                                                    <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                                                                        <div className="divide-y divide-gray-100/70">
                                                                            {order.order_items?.map((item: any, i: number) => (
                                                                                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="font-black text-violet-600 text-base w-8">
                                                                                            {item.quantity}x
                                                                                        </div>
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-extrabold text-base text-gray-900 leading-tight">{item.meal_name}</p>
                                                                                            <OrderItemDetails item={item} />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right ml-8">
                                                                                        <p className="font-bold text-base text-gray-900 tracking-tight">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                                                                                        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">${Number(item.unit_price).toFixed(2)} ea</p>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {order.notes && (
                                                                            <div className="bg-amber-50/30 p-6">
                                                                                <span className="text-[11px] font-black text-amber-700 uppercase tracking-[0.2em] block mb-2">KITCHEN NOTES</span>
                                                                                <p className="text-[15px] text-amber-900 font-black italic leading-relaxed">&ldquo;{order.notes}&rdquo;</p>
                                                                            </div>
                                                                        )}
                                                                        <div className="flex items-center justify-between p-6 bg-gray-50/30">
                                                                            <div className="flex items-center gap-10">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pickup</span>
                                                                                    <span className="text-[14px] font-black text-gray-900">{order.pickup_time || 'N/A'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Payment</span>
                                                                                    <span className="text-[14px] font-black text-gray-900 capitalize">{order.payment_status?.replace('_', ' ')}</span>
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Placed At</span>
                                                                                    <span className="text-[14px] font-black text-gray-900">
                                                                                        {isMounted ? new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                                                    </span>
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="text-right flex items-center gap-4">
                                                                                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">TOTAL AMOUNT</span>
                                                                                <span className="text-[20px] font-black text-violet-600 tracking-tighter">
                                                                                    ${order.order_items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * item.quantity), 0).toFixed(2)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </AnimatePresence>
                                        ];
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedOrders.length === 0 ? (
                        <div className="col-span-full py-24 text-center">
                            <div className="flex flex-col items-center justify-center text-gray-400">
                                <div className="size-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                                    <ShoppingCart className="size-8 opacity-20" />
                                </div>
                                <p className="font-bold text-gray-900 text-lg">No orders found</p>
                                <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
                            </div>
                        </div>
                    ) : (
                        sortedOrders.map((order: any) => {
                            const isExpanded = expanded === order.id;
                            const totalItems = order.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                            const totalPrice = order.order_items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;

                            return (
                                <Card 
                                    key={order.id} 
                                    className={cn(
                                        "rounded-[24px] border border-gray-100 bg-white shadow-sm transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-md",
                                        isExpanded ? "ring-2 ring-violet-500" : ""
                                    )}
                                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                                >
                                    <CardContent className="p-5 space-y-4">
                                        {/* Top Header Row */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "size-10 rounded-xl flex items-center justify-center text-sm font-black transition-all",
                                                    isExpanded 
                                                        ? "bg-violet-600 text-white shadow-sm" 
                                                        : "bg-violet-50 text-violet-700"
                                                )}>
                                                    {(order.guide_name || order.customer_name)?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-[15px] text-gray-900 leading-tight">{order.guide_name || order.customer_name}</h3>
                                                </div>
                                            </div>
                                            
                                            {/* Action Dropdown inside Card */}
                                            <div onClick={e => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className={cn(
                                                        buttonVariants({ variant: 'ghost', size: 'icon' }),
                                                        "h-8 w-8 p-0 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition-all"
                                                    )}>
                                                        <MoreHorizontal className="size-4" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1">
                                                        <DropdownMenuGroup>
                                                            <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 py-2">Actions</DropdownMenuLabel>
                                                        </DropdownMenuGroup>
                                                        <DropdownMenuItem 
                                                            className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700 cursor-pointer"
                                                            onClick={() => {
                                                                setEditingOrder(order);
                                                                setCustomerName(order.customer_name || '');
                                                                setGuideName(order.guide_name || '');
                                                                setTourDate(order.tour_date || '');
                                                                setPickupTime(order.pickup_time || '');
                                                                setNotes(order.notes || '');
                                                                setEditItems(JSON.parse(JSON.stringify(order.order_items || [])));
                                                                setIsEditDialogOpen(true);
                                                            }}
                                                        >
                                                            <Pencil className="size-3.5" /> Edit Order
                                                        </DropdownMenuItem>
                                                        
                                                        {order.status === 'cancelled' ? (
                                                            <DropdownMenuItem 
                                                                className="rounded-lg gap-2 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700 cursor-pointer"
                                                                onClick={() => handleStatus(order.id, 'pending')}
                                                            >
                                                                <Check className="size-3.5" /> Set to Pending
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem 
                                                                className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                                                                onClick={() => handleStatus(order.id, 'cancelled')}
                                                            >
                                                                <X className="size-3.5" /> Cancel Order
                                                            </DropdownMenuItem>
                                                        )}

                                                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                        <DropdownMenuItem 
                                                            className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700 cursor-pointer"
                                                            onClick={() => handleDelete(order.id)}
                                                        >
                                                            <Trash2 className="size-3.5" /> Delete Order
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>

                                        {/* Meta Information (Dates & Pickup) */}
                                        <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="size-3.5 text-violet-500 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tour Date</span>
                                                    <span className="text-[12px] font-bold text-gray-900 leading-tight">{formatDateUS(order.tour_date)}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Clock className="size-3.5 text-violet-500 shrink-0" />
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Pickup</span>
                                                    <span className="text-[12px] font-bold text-gray-900 leading-tight">{order.pickup_time || 'No time set'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status and Items Summary */}
                                        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                            <Badge variant="outline" className={cn(
                                                "rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : '',
                                                order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : '',
                                                order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''
                                            )}>
                                                {STATUS_LABELS[order.status] || order.status.replace('_', ' ')}
                                            </Badge>
                                            
                                            <div className="text-right">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">Placed At</span>
                                                <span className="text-[12px] font-semibold text-gray-400">
                                                    {isMounted ? formatDateUS(order.created_at) : ''}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Brief summary of items */}
                                        {!isExpanded && (
                                            <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-gray-100">
                                                <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                                                    <div className="size-5 rounded bg-violet-100 flex items-center justify-center text-[10px] font-black text-violet-700">
                                                        {totalItems}
                                                    </div>
                                                    <span>Total Items</span>
                                                </div>
                                                <div className="space-y-1">
                                                    {order.order_items?.slice(0, 5).map((item: any, idx: number) => (
                                                        <p key={idx} className="text-[11px] font-medium text-gray-600 leading-tight">
                                                            <span className="font-bold text-violet-600">{item.quantity}x</span> {item.meal_name}
                                                        </p>
                                                    ))}
                                                    {order.order_items && order.order_items.length > 5 && (
                                                        <p className="text-[9px] font-bold text-violet-500 italic mt-0.5">
                                                            {order.order_items.length - 5} more items
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Expandable detailed content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div 
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="overflow-hidden pt-4 border-t border-gray-100 space-y-4"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <div className="space-y-3">
                                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Item Breakdown</span>
                                                        <div className="divide-y divide-gray-100/70 border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm">
                                                            {order.order_items?.map((item: any, i: number) => (
                                                                <div key={i} className="p-3 hover:bg-gray-50/50 transition-colors flex items-start justify-between gap-4">
                                                                    <div className="space-y-0.5 min-w-0">
                                                                        <p className="font-extrabold text-base text-gray-900 leading-tight truncate">
                                                                            <span className="text-violet-600 font-black mr-1.5">{item.quantity}x</span>
                                                                            {item.meal_name}
                                                                        </p>
                                                                        <OrderItemDetails item={item} />
                                                                    </div>
                                                                    <div className="text-right shrink-0">
                                                                        <p className="font-bold text-base text-gray-900">${(Number(item.unit_price) * item.quantity).toFixed(2)}</p>
                                                                        <p className="text-xs text-gray-400 font-semibold">${Number(item.unit_price).toFixed(2)} ea</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {order.notes && (
                                                        <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                                                            <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">KITCHEN NOTES</span>
                                                            <p className="text-xs text-amber-900 font-bold italic leading-relaxed">&ldquo;{order.notes}&rdquo;</p>
                                                        </div>
                                                    )}

                                                    <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="text-[9px] text-gray-400 uppercase tracking-wider">Payment Status</span>
                                                            <span className="font-black text-gray-900 capitalize">{order.payment_status?.replace('_', ' ')}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Total Amount</span>
                                                            <span className="text-sm font-black text-violet-600">
                                                                ${totalPrice.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            )}

            {/* Edit Order Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="size-12 rounded-2xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-200">
                                <Pencil className="size-6 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black text-gray-900">Edit Order</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">
                                    Reference: #{editingOrder?.id.slice(0, 8)}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={(e) => {
                        e.preventDefault();
                        handleSaveEdit();
                    }}>
                        <div className="px-8 py-8 space-y-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* Header Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2.5">
                                    <Label htmlFor="customer_name" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Customer Name</Label>
                                    <Input id="customer_name" name="customer_name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className="h-11 rounded-xl border-gray-200 font-semibold focus:ring-violet-500/20" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="guide_name" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Guide Name</Label>
                                    <Input id="guide_name" name="guide_name" value={guideName} onChange={(e) => setGuideName(e.target.value)} className="h-11 rounded-xl border-gray-200 font-semibold focus:ring-violet-500/20" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="tour_date" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Tour Date</Label>
                                    <Input id="tour_date" name="tour_date" type="date" value={tourDate} onChange={(e) => setTourDate(e.target.value)} required className="h-11 rounded-xl border-gray-200 font-semibold focus:ring-violet-500/20" />
                                </div>
                                <div className="space-y-2.5">
                                    <Label htmlFor="pickup_time" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Pickup Time</Label>
                                    <Input id="pickup_time" name="pickup_time" placeholder="e.g. 07:30 AM" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="h-11 rounded-xl border-gray-200 font-semibold focus:ring-violet-500/20" />
                                </div>
                                <div className="col-span-2 space-y-2.5">
                                    <Label htmlFor="notes" className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">General Notes</Label>
                                    <Input id="notes" name="notes" placeholder="General instructions for the whole order..." value={notes} onChange={(e) => setNotes(e.target.value)} className="h-11 rounded-xl border-gray-200 font-medium" />
                                </div>
                            </div>

                            {/* Items Editing Section */}
                            <div className="pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-between mb-5">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-violet-600">Order Items</Label>
                                    <Badge variant="outline" className="bg-violet-50 text-violet-600 border-violet-100 font-bold text-[10px] px-2.5 py-0.5">
                                        {editItems.length} {editItems.length === 1 ? 'Item' : 'Items'}
                                    </Badge>
                                </div>
                                <div className="space-y-6">
                                    {editItems.map((item) => (
                                        <div key={item.id} className="p-5 rounded-2xl border border-gray-100 bg-gray-50/20 space-y-5 transition-all hover:border-violet-100/50 hover:bg-violet-50/5">
                                            <div className="flex items-center justify-between border-b border-gray-100/50 pb-4">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-sm font-bold text-gray-900 tracking-tight">{item.meal_name}</span>
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Meal Configuration</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase">Qty</Label>
                                                    <Input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity} 
                                                        onChange={(e) => updateEditItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                        className="w-14 h-8 rounded-lg border-gray-200 font-bold text-center focus:ring-violet-500/20"
                                                    />
                                                </div>
                                            </div>

                                            {/* Item Components Grid */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Type</Label>
                                                    <Input 
                                                        value={item.box_type || ''} 
                                                        onChange={(e) => updateEditItem(item.id, { box_type: e.target.value })}
                                                        placeholder="Box Lunch"
                                                        className="h-9 rounded-lg border-gray-200 text-[12px] font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Bread / Style</Label>
                                                    <Input 
                                                        value={item.bread_type || ''} 
                                                        onChange={(e) => updateEditItem(item.id, { bread_type: e.target.value })}
                                                        placeholder="Sandwich"
                                                        className="h-9 rounded-lg border-gray-200 text-[12px] font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cookie / Treat</Label>
                                                    <Input 
                                                        value={item.cookie_choice || ''} 
                                                        onChange={(e) => updateEditItem(item.id, { cookie_choice: e.target.value })}
                                                        placeholder="Cookie"
                                                        className="h-9 rounded-lg border-gray-200 text-[12px] font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Guest Name</Label>
                                                    <Input 
                                                        value={item.guest_name || ''} 
                                                        onChange={(e) => updateEditItem(item.id, { guest_name: e.target.value })}
                                                        placeholder="Guest Name"
                                                        className="h-9 rounded-lg border-gray-200 text-[12px] font-medium"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Allergy / Customizations</Label>
                                                    <Input 
                                                        value={item.customizations || ''} 
                                                        onChange={(e) => updateEditItem(item.id, { customizations: e.target.value })}
                                                        placeholder="Allergies..."
                                                        className="h-9 rounded-lg border-gray-200 text-[12px] font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-gray-50/50 px-8 py-6 border-t border-gray-100">
                            <Button type="button" variant="ghost" className="rounded-xl font-bold text-gray-500" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading || !hasChanges} className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-10 shadow-lg shadow-violet-100">
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={orderToDelete !== null}
                onClose={() => setOrderToDelete(null)}
                title="Delete Order"
                description="Are you sure you want to delete this order? This action cannot be undone."
                onConfirm={executeDelete}
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
}
