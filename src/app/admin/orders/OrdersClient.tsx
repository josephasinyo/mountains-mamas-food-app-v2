'use client';

import React, { useState, useEffect } from 'react';
import { updateOrderStatus, bulkUpdateStatus, exportOrdersCSV, updateOrderDetails, deleteOrder, bulkDeleteOrders, getPaginatedOrders } from './actions';
import { handleOrderChangeRequest } from '@/app/company/orders/change-actions';
import { createClient } from '@/lib/supabase/client';
import { getGlobalSettings } from '@/lib/supabase/public-actions';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Download, CheckCircle, Ticket, ShoppingCart, Lock,
    ChevronRight, X, Building2, Pencil, Printer,
    MoreHorizontal, Trash2, Check, ListFilter,
    ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List,
    Search, Loader2, Plus
} from 'lucide-react';
import { cn, formatDateUS, formatDateTimeUS } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { motion, AnimatePresence } from 'framer-motion';
import { OrderItemDetails } from '@/components/ui/OrderItemCustomFields';
import { formatFieldName, STANDARD_ITEM_KEYS } from '@/lib/format-field-name';

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
    'last_12_months': 'Last 12 Months',
    'custom': 'Custom Range'
};

const getPresetDates = (range: string): { start: string; end: string } => {
    const now = new Date();
    const getLocalDateStr = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };
    const todayStr = getLocalDateStr(now);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
        case 'today':
            return { start: todayStr, end: todayStr };
        case 'yesterday': {
            const yesterday = new Date(today);
            yesterday.setDate(today.getDate() - 1);
            return { start: getLocalDateStr(yesterday), end: getLocalDateStr(yesterday) };
        }
        case 'tomorrow': {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return { start: getLocalDateStr(tomorrow), end: getLocalDateStr(tomorrow) };
        }
        case 'this_week': {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            return { start: getLocalDateStr(startOfWeek), end: '' };
        }
        case 'last_week': {
            const startOfLastWeek = new Date(today);
            startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
            const endOfLastWeek = new Date(startOfLastWeek);
            endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
            return { start: getLocalDateStr(startOfLastWeek), end: getLocalDateStr(endOfLastWeek) };
        }
        case 'next_week': {
            const startOfNextWeek = new Date(today);
            startOfNextWeek.setDate(today.getDate() - today.getDay() + 7);
            const endOfNextWeek = new Date(startOfNextWeek);
            endOfNextWeek.setDate(startOfNextWeek.getDate() + 6);
            return { start: getLocalDateStr(startOfNextWeek), end: getLocalDateStr(endOfNextWeek) };
        }
        case 'this_month': {
            const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            return { start: getLocalDateStr(startOfMonth), end: getLocalDateStr(endOfMonth) };
        }
        case 'last_month': {
            const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            return { start: getLocalDateStr(startOfLastMonth), end: getLocalDateStr(endOfLastMonth) };
        }
        case 'next_month': {
            const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
            const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0);
            return { start: getLocalDateStr(startOfNextMonth), end: getLocalDateStr(endOfNextMonth) };
        }
        case 'next_3_months': {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const limit = new Date(today);
            limit.setMonth(today.getMonth() + 3);
            return { start: getLocalDateStr(tomorrow), end: getLocalDateStr(limit) };
        }
        case 'next_6_months': {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const limit = new Date(today);
            limit.setMonth(today.getMonth() + 6);
            return { start: getLocalDateStr(tomorrow), end: getLocalDateStr(limit) };
        }
        case 'next_12_months': {
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            const limit = new Date(today);
            limit.setMonth(today.getMonth() + 12);
            return { start: getLocalDateStr(tomorrow), end: getLocalDateStr(limit) };
        }
        case 'this_year': {
            const startOfYear = new Date(today.getFullYear(), 0, 1);
            const endOfYear = new Date(today.getFullYear(), 11, 31);
            return { start: getLocalDateStr(startOfYear), end: getLocalDateStr(endOfYear) };
        }
        case 'last_3_months': {
            const limit = new Date(today);
            limit.setMonth(today.getMonth() - 3);
            return { start: getLocalDateStr(limit), end: todayStr };
        }
        case 'last_6_months': {
            const limit = new Date(today);
            limit.setMonth(today.getMonth() - 6);
            return { start: getLocalDateStr(limit), end: todayStr };
        }
        case 'last_12_months': {
            const limit = new Date(today);
            limit.setMonth(today.getMonth() - 12);
            return { start: getLocalDateStr(limit), end: todayStr };
        }
        default:
            if (range && range.includes('-')) {
                return { start: range, end: range };
            }
            return { start: '', end: '' };
    }
};

interface OrderItem {
    id: string;
    meal_name: string;
    quantity: number;
    box_type: string | null;
    bread_type: string | null;
    cookie_choice: string | null;
    guest_name: string | null;
    customizations: string | null;
    unit_price: number;
    custom_fields: Record<string, any> | null;
    meal_id?: string | null;
}

interface Order {
    id: string;
    customer_name: string;
    guide_name: string | null;
    tour_date: string;
    pickup_time: string | null;
    status: string;
    payment_status: string;
    notes: string | null;
    is_locked: boolean;
    created_at: string;
    company_id: string | null;
    tour_companies: { name: string; slug: string; prep_instructions?: string | null } | null;
    order_items: OrderItem[];
}

interface OrdersClientProps {
    initialOrders: Order[];
    initialTotalCount?: number;
    initialTotalLunches?: number;
    initialPendingCount?: number;
    companies: { id: string; name: string; status: string; prep_instructions?: string | null }[];
    initialChangeRequests?: any[];
}

const STATUS_LABELS: Record<string, string> = {
    pending: 'Pending',
    fulfilled: 'Fulfilled',
    cancelled: 'Cancelled',
};

const formatBoxType = (box: string | null) => {
    if (!box) return '';
    if (box.toLowerCase().startsWith('this is a')) return box;
    return box
        .replace(/junior box lunch/i, 'Junior Box')
        .replace(/junior bag lunch/i, 'Junior Bag')
        .replace(/box lunch/i, 'Box Lunch')
        .replace(/bag lunch/i, 'Bag Lunch')
        .replace(/junior box/i, 'Junior Box')
        .replace(/standard box/i, 'Box Lunch')
        .replace(/sandwich only/i, 'Sandwich only');
};

export function OrdersClient({ 
    initialOrders, 
    initialTotalCount = 0, 
    initialTotalLunches = 0, 
    initialPendingCount = 0, 
    companies,
    initialChangeRequests = []
}: OrdersClientProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [totalCount, setTotalCount] = useState(initialTotalCount);
    const [totalLunches, setTotalLunches] = useState(initialTotalLunches);
    const [pendingCount, setPendingCount] = useState(initialPendingCount);
    const [page, setPage] = useState(1);
    const [dbLoading, setDbLoading] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [expanded, setExpanded] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [dateFilterMode, setDateFilterMode] = useState<'tour' | 'order'>('tour');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [editItems, setEditItems] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Change Requests State
    const [changeRequests, setChangeRequests] = useState<any[]>(initialChangeRequests);
    const [activeTab, setActiveTab] = useState<'orders' | 'requests'>('orders');
    const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<any>(null);
    const [declineReason, setDeclineReason] = useState('');
    const [requestActionLoading, setRequestActionLoading] = useState<string | null>(null);

    const handleRequestDecision = async (requestId: string, decision: 'approved' | 'declined', reason?: string) => {
        setRequestActionLoading(requestId);
        try {
            const result = await handleOrderChangeRequest(requestId, decision, reason);
            if (result.success) {
                toast.success(`Request ${decision} successfully`);
                setChangeRequests(prev => prev.filter(r => r.id !== requestId));
                // Reload dashboard data
                handleQueryDatabase(page);
            } else {
                toast.error(result.error || `Failed to ${decision} request`);
            }
        } catch (e: any) {
            toast.error(e.message || String(e));
        } finally {
            setRequestActionLoading(null);
            setDeclineDialogOpen(false);
            setDeclineReason('');
            setSelectedRequest(null);
        }
    };

    const handleBadgeClick = (e: React.MouseEvent, orderId: string) => {
        e.stopPropagation();
        setActiveTab('requests');
        setTimeout(() => {
            const element = document.getElementById(`request-${orderId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-2', 'ring-violet-600', 'ring-offset-2');
                setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-violet-600', 'ring-offset-2');
                }, 2000);
            }
        }, 100);
    };

    const handleQueryDatabase = async (targetPage = 1) => {
        setDbLoading(true);
        const result = await getPaginatedOrders({
            page: targetPage,
            limit: 100,
            searchTerm,
            dateFilterMode,
            startDate,
            endDate,
            companyId: companyFilter,
            status: statusFilter
        });
        if (result.success) {
            setOrders(result.orders);
            setTotalCount(result.totalCount);
            setTotalLunches(result.totalLunches || 0);
            setPendingCount(result.pendingCount || 0);
            setPage(targetPage);
        } else {
            toast.error(result.error || 'Failed to query database');
        }
        setDbLoading(false);
    };

    const handleClearFilters = async () => {
        setDateRange('');
        setStartDate('');
        setEndDate('');
        setCompanyFilter('');
        setStatusFilter('');
        setSearchTerm('');
        
        setDbLoading(true);
        const result = await getPaginatedOrders({
            page: 1,
            limit: 100,
            dateFilterMode,
            searchTerm: '',
            startDate: '',
            endDate: '',
            companyId: '',
            status: ''
        });
        if (result.success) {
            setOrders(result.orders);
            setTotalCount(result.totalCount);
            setTotalLunches(result.totalLunches || 0);
            setPendingCount(result.pendingCount || 0);
            setPage(1);
        } else {
            toast.error(result.error || 'Failed to query database');
        }
        setDbLoading(false);
    };

    const handleDateRangeChange = (range: string) => {
        setDateRange(range);
        if (range !== 'custom') {
            const { start, end } = getPresetDates(range);
            setStartDate(start);
            setEndDate(end);
        }
    };
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [sortConfig, setSortConfig] = useState<{ key: 'created_at' | 'tour_date', direction: 'asc' | 'desc' }>({ 
        key: 'created_at', 
        direction: 'desc' 
    });

    const [confirmState, setConfirmState] = React.useState<{
        isOpen: boolean;
        title: string;
        description: string;
        resolve: (val: boolean) => void;
        variant?: 'danger' | 'warning' | 'info' | 'success';
        confirmText?: string;
    } | null>(null);

    const niceConfirm = (title: string, description: string, variant: 'danger' | 'warning' | 'info' | 'success' = 'info', confirmText = 'Confirm') => {
        return new Promise<boolean>((resolve) => {
            setConfirmState({
                isOpen: true,
                title,
                description,
                resolve,
                variant,
                confirmText
            });
        });
    };

    const toggleSort = (key: 'created_at' | 'tour_date') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const getDateFilterLabel = () => {
        if (dateRange === 'custom') {
            return `${startDate || 'START'} TO ${endDate || 'END'}`;
        }
        if (!dateRange) return 'ALL';
        if (dateRange === 'today') return 'TODAY';
        if (dateRange === 'yesterday') return 'YESTERDAY';
        if (dateRange === 'this_week') return 'THIS WEEK';
        if (dateRange === 'last_week') return 'LAST WEEK';
        if (dateRange === 'this_month') return 'THIS MONTH';
        if (dateRange === 'last_month') return 'LAST MONTH';
        return dateRange.toUpperCase();
    };

    const getCompanyFilterLabel = () => {
        if (!companyFilter) return 'ALL';
        const comp = companies.find(c => c.id === companyFilter);
        return comp ? comp.name.toUpperCase() : 'UNKNOWN';
    };

    const getStatusFilterLabel = () => {
        if (!statusFilter) return 'ALL';
        return (STATUS_LABELS[statusFilter] || statusFilter).toUpperCase();
    };

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;
        const queryParams = new URLSearchParams(window.location.search);
        const printId = queryParams.get('print');
        if (printId) {
            // Remove the print query param from URL immediately to prevent infinite loop on orders state update
            window.history.replaceState(null, '', window.location.pathname);
            
            setSelected(new Set([printId]));
            // Wait slightly for rendering to settle
            setTimeout(() => {
                document.body.classList.add('print-tickets-mode');
                window.print();
                document.body.classList.remove('print-tickets-mode');
                
                const matchedOrder = orders.find(o => o.id === printId);
                if (matchedOrder) {
                    markOrdersAsPrintedAndFulfilled([matchedOrder]);
                }
            }, 600);
        }
    }, [isMounted, orders]);

    // Form States
    const [customerName, setCustomerName] = useState('');
    const [guideName, setGuideName] = useState('');
    const [tourDate, setTourDate] = useState('');
    const [pickupTime, setPickupTime] = useState('');
    const [notes, setNotes] = useState('');
    const [companyId, setCompanyId] = useState<string | null>(null);

    const [selectedCompanyConfig, setSelectedCompanyConfig] = useState<any | null>(null);
    const [selectedCompanyMeals, setSelectedCompanyMeals] = useState<any[]>([]);
    const [globalSettings, setGlobalSettings] = useState<any | null>(null);

    useEffect(() => {
        const fetchGlobal = async () => {
            const res = await getGlobalSettings();
            if (res.success) {
                setGlobalSettings(res.settings);
            }
        };
        fetchGlobal();
    }, []);

    useEffect(() => {
        const fetchCompanyDetails = async () => {
            const supabaseClient = createClient();
            
            const { data: allMeals } = await supabaseClient
                .from('meals')
                .select('*')
                .eq('is_active', true);

            if (!companyId) {
                setSelectedCompanyConfig(null);
                setSelectedCompanyMeals(allMeals || []);
                return;
            }
            
            const { data: configData } = await supabaseClient
                .from('company_app_config')
                .select('*')
                .eq('company_id', companyId)
                .single();
            
            const { data: selections } = await supabaseClient
                .from('company_menu_selections')
                .select('meal_id')
                .eq('company_id', companyId)
                .eq('is_selected', true);
            
            if (configData) {
                setSelectedCompanyConfig(configData);
            } else {
                setSelectedCompanyConfig(null);
            }

            if (selections && allMeals) {
                const selectedIds = new Set(selections.map((s: any) => s.meal_id));
                const activeMeals = allMeals.filter((m: any) => selectedIds.has(m.id));
                setSelectedCompanyMeals(activeMeals);
            } else {
                setSelectedCompanyMeals([]);
            }
        };
        fetchCompanyDetails();
    }, [companyId]);

    const getBreadOptions = (currentItemValue?: string) => {
        const mealOpts = selectedCompanyConfig?.meal_page_options;
        const parsed = typeof mealOpts === 'string' ? JSON.parse(mealOpts) : mealOpts;
        const globalBreads = (globalSettings?.bread_options && Array.isArray(globalSettings.bread_options)) 
            ? globalSettings.bread_options 
            : [];
        let options: string[] = [];
        if (parsed?.breads && Array.isArray(parsed.breads) && parsed.breads.length > 0) {
            const activeBreads = parsed.breads.filter((b: string) => globalBreads.includes(b));
            if (activeBreads.length > 0) {
                options = activeBreads;
            }
        }
        if (options.length === 0) {
            options = globalBreads.length > 0 ? globalBreads : ['White Bread'];
        }
        if (currentItemValue && !options.includes(currentItemValue)) {
            return [...options, currentItemValue];
        }
        return options;
    };

    const getCookieOptions = (currentItemValue?: string) => {
        const mealOpts = selectedCompanyConfig?.meal_page_options;
        const parsed = typeof mealOpts === 'string' ? JSON.parse(mealOpts) : mealOpts;
        const globalCookies = (globalSettings?.cookie_options && Array.isArray(globalSettings.cookie_options)) 
            ? globalSettings.cookie_options 
            : [];
        let options: string[] = [];
        if (parsed?.cookies && Array.isArray(parsed.cookies) && parsed.cookies.length > 0) {
            const activeCookies = parsed.cookies.filter((c: string) => globalCookies.includes(c));
            if (activeCookies.length > 0) {
                options = activeCookies;
            }
        }
        if (options.length === 0) {
            options = globalCookies.length > 0 ? globalCookies : ['Chocolate Chip'];
        }
        if (currentItemValue && !options.includes(currentItemValue)) {
            return [...options, currentItemValue];
        }
        return options;
    };

    const getBoxTypeOptions = (item: any) => {
        const meal = selectedCompanyMeals.find((m) => m.id === item.meal_id || m.name === item.meal_name);
        const pkgLabel = meal ? (meal.lunch_package === 'bag' ? 'Bag' : 'Box') : 'Box';
        const isSalad = meal ? (meal.category === 'salad' && !meal.name.toLowerCase().includes('sandwich')) : false;
        
        // Settings from selectedCompanyConfig (default to true if config not loaded yet)
        const isSandwichAllowed = selectedCompanyConfig ? (selectedCompanyConfig.use_sandwich_only !== false && (meal ? meal.category === 'sandwich' : true)) : true;
        const isBoxAllowed = selectedCompanyConfig ? (selectedCompanyConfig.show_box_lunch_category !== false) : true;
        const isJuniorAllowed = selectedCompanyConfig ? (selectedCompanyConfig.show_junior_box_lunch_category !== false && (meal ? (meal.allow_split_box || meal.category === 'sandwich' || meal.name.toLowerCase().includes('sandwich')) : true)) : true;
        
        const enabledOptionsCount = (isSandwichAllowed ? 1 : 0) + (isBoxAllowed ? 1 : 0) + (isJuniorAllowed ? 1 : 0);
        
        const options: string[] = [];
        
        if (isSalad) {
            options.push(`${pkgLabel} Lunch`);
        } else {
            if (enabledOptionsCount === 1) {
                if (isBoxAllowed) {
                    options.push(`This is a ${pkgLabel.toLowerCase()} lunch`);
                }
                if (isJuniorAllowed) {
                    options.push(`This is a junior ${pkgLabel.toLowerCase()} lunch`);
                }
                if (isSandwichAllowed) {
                    options.push(`This is a standalone sandwich`);
                }
            } else {
                if (isBoxAllowed) {
                    options.push(`${pkgLabel} Lunch`);
                }
                if (isJuniorAllowed) {
                    options.push(`Junior ${pkgLabel} Lunch`);
                }
                if (isSandwichAllowed) {
                    options.push(`Sandwich only`);
                }
            }
        }
        
        // Always include the current box_type if it is set and not already in options
        const currentVal = item.box_type;
        if (currentVal && !options.includes(currentVal)) {
            options.push(currentVal);
        }
        
        return options;
    };

    const handleRemoveItem = (itemId: string) => {
        setEditItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleAddItem = () => {
        const defaultMeal = selectedCompanyMeals[0] || { id: null, name: 'Custom Selection', price: 0 };
        const defaultBreadOptions = getBreadOptions();
        const defaultCookieOptions = getCookieOptions();

        const newItem = {
            id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            meal_id: defaultMeal.id,
            meal_name: defaultMeal.name,
            quantity: 1,
            box_type: 'Box Lunch',
            bread_type: defaultBreadOptions[0] || '',
            cookie_choice: defaultCookieOptions[0] || '',
            guest_name: '',
            customizations: '',
            unit_price: defaultMeal.price || 0,
            custom_fields: null
        };
        setEditItems(prev => [...prev, newItem]);
    };

    const hasChanges = editingOrder ? (
        customerName !== (editingOrder.customer_name || '') ||
        guideName !== (editingOrder.guide_name || '') ||
        tourDate !== (editingOrder.tour_date || '') ||
        pickupTime !== (editingOrder.pickup_time || '') ||
        notes !== (editingOrder.notes || '') ||
        companyId !== (editingOrder.company_id || null) ||
        JSON.stringify(editItems) !== JSON.stringify(editingOrder.order_items)
    ) : false;

    const filtered = orders;

    const sorted = [...filtered].sort((a, b) => {
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

    const ordersToPrint = React.useMemo(() => {
        if (selected.size > 0) {
            return sorted.filter(o => selected.has(o.id));
        }
        return sorted;
    }, [sorted, selected]);

    const totalLunchItemsCount = totalLunches;

    function toggleSelect(id: string) {
        const next = new Set(selected);
        next.has(id) ? next.delete(id) : next.add(id);
        setSelected(next);
    }

    function toggleAll() {
        if (selected.size === filtered.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(filtered.map(o => o.id)));
        }
    }

    async function markOrdersAsPrintedAndFulfilled(ordersList: Order[]) {
        if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
            console.log('Skipping fulfillment marking on localhost');
            return;
        }

        const orderIds = ordersList.map(o => o.id);
        if (orderIds.length === 0) return;
        
        // Optimistic update locally
        setOrders(prev => prev.map(o => orderIds.includes(o.id) ? { ...o, status: 'fulfilled' } : o));
        
        // Update database
        const result = await bulkUpdateStatus(orderIds, 'fulfilled');
        if (!result.success) {
            toast.error(result.error || 'Failed to automatically mark orders as fulfilled in database.');
        } else {
            toast.success(`Successfully marked ${orderIds.length} order(s) as fulfilled.`);
        }
    }

    async function handleStatus(id: string, status: string) {
        const result = await updateOrderStatus(id, status);
        if (result.success) {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
        }
    }

    async function handleBulk(status: string) {
        if (!selected.size) return;
        const confirmed = await niceConfirm(
            'Confirm Bulk Update',
            `Are you sure you want to mark ${selected.size} order(s) as ${STATUS_LABELS[status] || status}?`,
            status === 'cancelled' ? 'danger' : 'info'
        );
        if (!confirmed) return;
        const result = await bulkUpdateStatus(Array.from(selected), status);
        if (result.success) {
            setOrders(prev => prev.map(o => selected.has(o.id) ? { ...o, status } : o));
            setSelected(new Set());
        }
    }

    async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!editingOrder || !hasChanges) return;
        if (editItems.length === 0) {
            toast.error('Orders must contain at least one item.');
            return;
        }
        setLoading(true);

        const details = {
            customer_name: customerName,
            guide_name: guideName || null,
            tour_date: tourDate,
            pickup_time: pickupTime || null,
            notes: notes || null,
            company_id: companyId || null,
        };

        const result = await updateOrderDetails(
            editingOrder.id, 
            details, 
            editItems.map(item => ({ 
                id: item.id, 
                quantity: item.quantity, 
                customizations: item.customizations,
                guest_name: item.guest_name,
                box_type: item.box_type,
                bread_type: item.bread_type,
                cookie_choice: item.cookie_choice,
                meal_id: item.meal_id,
                meal_name: item.meal_name,
                unit_price: item.unit_price
            }))
        );

        if (result.success) {
            const matchedCompany = companies.find(c => c.id === companyId);
            setOrders(prev => prev.map(o => o.id === editingOrder.id ? { 
                ...o, 
                ...details, 
                tour_companies: companyId ? { 
                    name: matchedCompany?.name || '', 
                    slug: '', 
                    prep_instructions: matchedCompany?.prep_instructions || null 
                } : null,
                order_items: editItems 
            } : o));
            setIsEditDialogOpen(false);
            setEditingOrder(null);
            setEditItems([]);
            setLoading(false);
        }
    }

    async function handleDelete(id: string) {
        const confirmed = await niceConfirm(
            'Delete Order',
            'Are you sure you want to delete this order? This action cannot be undone.',
            'danger',
            'Delete'
        );
        if (!confirmed) return;
        setLoading(true);
        const result = await deleteOrder(id);
        if (result.success) {
            setOrders(prev => prev.filter(o => o.id !== id));
            toast.success('Order deleted successfully');
        } else {
            toast.error(result.error || 'Failed to delete order');
        }
        setLoading(false);
    }

    const updateEditItem = (itemId: string, updates: Partial<OrderItem>) => {
        setEditItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    };

    async function handleExport() {
        const result = await exportOrdersCSV({
            dateFrom: startDate || undefined,
            dateTo: endDate || undefined,
            companyId: companyFilter || undefined,
            status: statusFilter || undefined,
        });
        if (result.success && result.csv) {
            const blob = new Blob([result.csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    const renderChangeRequests = () => {
        if (changeRequests.length === 0) {
            return (
                <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden bg-white">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-gray-400">
                        <div className="size-20 rounded-full bg-violet-50 flex items-center justify-center mb-6">
                            <CheckCircle className="size-10 text-violet-500 opacity-60" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">No pending change requests</p>
                        <p className="text-sm mt-1 max-w-[320px] text-center text-gray-500">
                            All requests submitted by partner companies have been processed.
                        </p>
                    </CardContent>
                </Card>
            );
        }

        return (
            <div className="space-y-6">
                {changeRequests.map((request) => {
                    const originalOrder = request.orders;
                    const proposedDetails = request.details || {};
                    const isDeletion = request.type === 'delete';
                    const isCancellation = request.type === 'cancel';

                    // Compare values helpers
                    const renderCompareRow = (label: string, original: any, proposed: any, formatFn?: (v: any) => string) => {
                        const originalStr = formatFn ? formatFn(original) : String(original || '');
                        const proposedStr = formatFn ? formatFn(proposed) : String(proposed || '');
                        const isChanged = !isDeletion && !isCancellation && originalStr !== proposedStr;

                        return (
                            <div className="grid grid-cols-3 py-2 border-b border-gray-100/70 text-sm" key={label}>
                                <span className="font-bold text-gray-500">{label}</span>
                                <span className={cn("text-gray-700", isChanged && "line-through text-red-500 bg-red-50/50 px-1 rounded")}>
                                    {originalStr || <span className="italic text-gray-400">None</span>}
                                </span>
                                <span className="text-gray-900 font-medium">
                                    {!isDeletion && !isCancellation && isChanged ? (
                                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
                                            {proposedStr || <span className="italic text-emerald-600">None</span>}
                                        </span>
                                    ) : (
                                        <span>—</span>
                                    )}
                                </span>
                            </div>
                        );
                    };

                    return (
                        <Card id={`request-${originalOrder?.id}`} key={request.id} className="rounded-3xl border-gray-100 shadow-md overflow-hidden bg-white transition-all duration-500">
                            {/* Card Header */}
                            <CardHeader className="bg-gray-50/50 px-6 py-5 border-b border-gray-100 flex flex-row items-center justify-between flex-wrap gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge className={cn(
                                            "font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-lg border",
                                            isDeletion 
                                                ? "bg-rose-50 text-rose-700 border-rose-200" 
                                                : isCancellation
                                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                                    : "bg-blue-50 text-blue-700 border-blue-200"
                                        )}>
                                            {isDeletion ? 'Deletion Request' : isCancellation ? 'Cancellation Request' : 'Update / Edit Request'}
                                        </Badge>
                                        <span className="text-sm font-bold text-gray-900">
                                            Order #{originalOrder?.id?.slice(0, 8).toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Submitted by <span className="font-bold text-gray-700">{request.tour_companies?.name}</span> ({request.tour_companies?.email}) · Placed {new Date(request.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setDeclineReason('');
                                            setDeclineDialogOpen(true);
                                        }}
                                        disabled={requestActionLoading !== null}
                                        className="rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold px-4 py-2 text-xs"
                                    >
                                        Decline
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => handleRequestDecision(request.id, 'approved')}
                                        disabled={requestActionLoading !== null}
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 text-xs shadow-sm shadow-emerald-100 flex items-center gap-1"
                                    >
                                        {requestActionLoading === request.id ? (
                                            <Loader2 className="size-3 animate-spin" />
                                        ) : (
                                            <Check className="size-3" />
                                        )}
                                        Approve
                                    </Button>
                                </div>
                            </CardHeader>

                            {/* Card Content */}
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Order Details Comparison</h3>
                                    <div className="border border-gray-100 rounded-2xl p-4 bg-gray-50/20 divide-y divide-gray-100">
                                        <div className="grid grid-cols-3 pb-2 text-xs font-bold text-gray-400 uppercase tracking-wide">
                                            <span>Field</span>
                                            <span>Original Value</span>
                                            <span>Proposed Value</span>
                                        </div>
                                        {renderCompareRow("Customer Name", originalOrder?.customer_name, proposedDetails.customer_name)}
                                        {renderCompareRow("Guide Name", originalOrder?.guide_name, proposedDetails.guide_name)}
                                        {renderCompareRow("Tour Date", originalOrder?.tour_date, proposedDetails.tour_date, (v) => v ? formatDateUS(v) : '')}
                                        {renderCompareRow("Pickup Time", originalOrder?.pickup_time, proposedDetails.pickup_time)}
                                        {renderCompareRow("Notes", originalOrder?.notes, proposedDetails.notes)}
                                    </div>
                                </div>

                                {/* Items Comparison */}
                                {!isDeletion && !isCancellation && (
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Proposed Menu Selections</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {(() => {
                                                const originalItems = originalOrder?.order_items || [];
                                                const proposedItems = proposedDetails.items || [];

                                                // Helper to check if item is identical
                                                const isItemEqual = (a: any, b: any) => {
                                                    return (
                                                        a.meal_name === b.meal_name &&
                                                        a.quantity === b.quantity &&
                                                        a.guest_name === b.guest_name &&
                                                        a.box_type === b.box_type &&
                                                        a.bread_type === b.bread_type &&
                                                        a.cookie_choice === b.cookie_choice &&
                                                        a.customizations === b.customizations
                                                    );
                                                };

                                                const allComparisons: {
                                                    status: 'added' | 'removed' | 'modified' | 'unchanged';
                                                    original?: any;
                                                    proposed?: any;
                                                }[] = [];

                                                // Find added, modified, unchanged
                                                proposedItems.forEach((pItem: any) => {
                                                    const oItem = originalItems.find((o: any) => o.id === pItem.id);
                                                    if (!oItem) {
                                                        allComparisons.push({ status: 'added', proposed: pItem });
                                                    } else if (!isItemEqual(oItem, pItem)) {
                                                        allComparisons.push({ status: 'modified', original: oItem, proposed: pItem });
                                                    } else {
                                                        allComparisons.push({ status: 'unchanged', original: oItem, proposed: pItem });
                                                    }
                                                });

                                                // Find removed
                                                originalItems.forEach((oItem: any) => {
                                                    const pItem = proposedItems.find((p: any) => p.id === oItem.id);
                                                    if (!pItem) {
                                                        allComparisons.push({ status: 'removed', original: oItem });
                                                    }
                                                });

                                                if (allComparisons.length === 0) {
                                                    return <p className="text-xs text-gray-400 italic">No menu selections submitted</p>;
                                                }

                                                // Helper to render field changes inline
                                                const renderFieldDiff = (label: string, originalVal: any, proposedVal: any, formatFn?: (v: any) => string) => {
                                                    const origStr = formatFn ? formatFn(originalVal) : (originalVal || '');
                                                    const propStr = formatFn ? formatFn(proposedVal) : (proposedVal || '');
                                                    const isChanged = origStr !== propStr;

                                                    if (!isChanged) {
                                                        if (!propStr) return null;
                                                        return (
                                                            <div className="text-xs text-gray-600 flex gap-1">
                                                                <span className="font-bold text-gray-400">{label}:</span>
                                                                <span className="text-gray-800">{propStr}</span>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="text-xs flex items-center gap-1.5 flex-wrap">
                                                            <span className="font-bold text-gray-400">{label}:</span>
                                                            {origStr && (
                                                                <span className="line-through text-red-500 bg-red-50 px-1 rounded">
                                                                    {origStr}
                                                                </span>
                                                            )}
                                                            <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                                                {propStr || <span className="italic text-emerald-600">None</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                };

                                                return allComparisons.map((comp, idx) => {
                                                    const item = comp.proposed || comp.original;
                                                    const key = item.id || `comp-${idx}`;
                                                    
                                                    if (comp.status === 'added') {
                                                        return (
                                                            <div key={key} className="border border-emerald-200 rounded-2xl p-4 bg-emerald-50/10 shadow-sm space-y-2 relative overflow-hidden">
                                                                <div className="absolute top-3 right-3">
                                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-none font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">
                                                                        + Added
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <p className="font-bold text-sm text-gray-900 pr-16">{item.meal_name}</p>
                                                                    <div className="text-xs text-gray-600 flex gap-1">
                                                                        <span className="font-bold text-gray-400">Box Options:</span>
                                                                        <span className="text-gray-800">
                                                                            {[formatBoxType(item.box_type), item.bread_type, item.cookie_choice].filter(Boolean).join(' • ')}
                                                                        </span>
                                                                    </div>
                                                                    {item.guest_name && (
                                                                        <div className="text-xs text-gray-600 flex gap-1">
                                                                            <span className="font-bold text-gray-400">Guest:</span>
                                                                            <span className="font-bold text-violet-600">{item.guest_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {item.customizations && (
                                                                        <div className="mt-2 border-t border-dashed border-gray-100 pt-2 text-xs">
                                                                            <p className="font-bold text-amber-700">Customizations:</p>
                                                                            <p className="text-gray-700 italic mt-0.5">{item.customizations}</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs">
                                                                        <span className="font-bold text-gray-400">Quantity:</span>
                                                                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">{item.quantity}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (comp.status === 'removed') {
                                                        return (
                                                            <div key={key} className="border border-rose-200 rounded-2xl p-4 bg-rose-50/5 shadow-sm space-y-2 relative overflow-hidden opacity-75">
                                                                <div className="absolute top-3 right-3">
                                                                    <Badge className="bg-rose-500 hover:bg-rose-600 text-white border-none font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">
                                                                        - Removed
                                                                    </Badge>
                                                                </div>
                                                                <div className="space-y-1 text-gray-400">
                                                                    <p className="font-bold text-sm line-through text-red-500 pr-16">{item.meal_name}</p>
                                                                    <div className="text-xs line-through text-red-400 flex gap-1">
                                                                        <span className="font-bold">Box Options:</span>
                                                                        <span>
                                                                            {[formatBoxType(item.box_type), item.bread_type, item.cookie_choice].filter(Boolean).join(' • ')}
                                                                        </span>
                                                                    </div>
                                                                    {item.guest_name && (
                                                                        <div className="text-xs line-through text-red-400 flex gap-1">
                                                                            <span className="font-bold">Guest:</span>
                                                                            <span>{item.guest_name}</span>
                                                                        </div>
                                                                    )}
                                                                    {item.customizations && (
                                                                        <div className="mt-2 border-t border-dashed border-gray-100 pt-2 text-xs">
                                                                            <p className="font-bold text-red-400">Customizations:</p>
                                                                            <p className="line-through text-red-400 italic mt-0.5">{item.customizations}</p>
                                                                        </div>
                                                                    )}
                                                                    <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs">
                                                                        <span className="font-bold">Quantity:</span>
                                                                        <span className="line-through text-red-500 bg-red-50 px-2 py-0.5 rounded-md font-bold">{item.quantity}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (comp.status === 'modified') {
                                                        const orig = comp.original;
                                                        const prop = comp.proposed;
                                                        return (
                                                            <div key={key} className="border border-blue-200 rounded-2xl p-4 bg-blue-50/5 shadow-sm space-y-3 relative overflow-hidden">
                                                                <div className="absolute top-3 right-3">
                                                                    <Badge className="bg-blue-500 hover:bg-blue-600 text-white border-none font-bold text-[8px] tracking-wider uppercase px-2 py-0.5 rounded-md">
                                                                        Modified
                                                                    </Badge>
                                                                </div>
                                                                <p className="font-bold text-sm text-gray-900 pr-16">{prop.meal_name}</p>
                                                                <div className="space-y-1.5">
                                                                    {renderFieldDiff("Box Type", orig.box_type, prop.box_type, formatBoxType)}
                                                                    {renderFieldDiff("Bread / Style", orig.bread_type, prop.bread_type)}
                                                                    {renderFieldDiff("Cookie / Treat", orig.cookie_choice, prop.cookie_choice)}
                                                                    {renderFieldDiff("Guest Name", orig.guest_name, prop.guest_name)}
                                                                    {renderFieldDiff("Customizations", orig.customizations, prop.customizations)}
                                                                    {renderFieldDiff("Quantity", orig.quantity, prop.quantity)}
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    // Unchanged
                                                    return (
                                                        <div key={key} className="border border-gray-100 rounded-2xl p-4 bg-white shadow-sm space-y-2 opacity-85">
                                                            <div className="space-y-1">
                                                                <p className="font-bold text-sm text-gray-800">{item.meal_name}</p>
                                                                <div className="text-xs text-gray-500 flex gap-1">
                                                                    <span className="font-bold text-gray-400">Box Options:</span>
                                                                    <span>
                                                                        {[formatBoxType(item.box_type), item.bread_type, item.cookie_choice].filter(Boolean).join(' • ')}
                                                                    </span>
                                                                </div>
                                                                {item.guest_name && (
                                                                    <div className="text-xs text-gray-500 flex gap-1">
                                                                        <span className="font-bold text-gray-400">Guest:</span>
                                                                        <span className="font-medium text-gray-700">{item.guest_name}</span>
                                                                    </div>
                                                                )}
                                                                {item.customizations && (
                                                                    <div className="mt-2 border-t border-dashed border-gray-100 pt-2 text-xs">
                                                                        <p className="font-bold text-gray-400">Customizations:</p>
                                                                        <p className="text-gray-600 italic mt-0.5">{item.customizations}</p>
                                                                    </div>
                                                                )}
                                                                <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs">
                                                                    <span className="font-bold text-gray-400">Quantity:</span>
                                                                    <span className="text-gray-800 font-bold">{item.quantity}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                )}
                                {(isDeletion || isCancellation) && (
                                    <div className="space-y-4">
                                        <h3 className={cn("text-xs font-black uppercase tracking-widest mt-6", isDeletion ? "text-rose-500" : "text-amber-500")}>
                                            {isDeletion ? "Order Items to Delete" : "Order Items to Cancel"}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {originalOrder?.order_items?.map((item: any, idx: number) => {
                                                const key = item.id || `del-item-${idx}`;
                                                return (
                                                    <div key={key} className={cn("border rounded-2xl p-4 shadow-sm space-y-2 opacity-85", isDeletion ? "border-rose-100 bg-rose-50/5" : "border-amber-100 bg-amber-50/5")}>
                                                        <div className="space-y-1">
                                                            <p className="font-bold text-sm text-gray-900 pr-16">{item.meal_name}</p>
                                                            <div className="text-xs text-gray-500 flex gap-1">
                                                                <span className="font-bold text-gray-400">Box Options:</span>
                                                                <span>
                                                                    {[formatBoxType(item.box_type), item.bread_type, item.cookie_choice].filter(Boolean).join(' • ')}
                                                                </span>
                                                            </div>
                                                            {item.guest_name && (
                                                                <div className="text-xs text-gray-500 flex gap-1">
                                                                    <span className="font-bold text-gray-400">Guest:</span>
                                                                    <span className="font-medium text-gray-700">{item.guest_name}</span>
                                                                </div>
                                                            )}
                                                            {item.customizations && (
                                                                <div className="mt-2 border-t border-dashed border-gray-100 pt-2 text-xs">
                                                                    <p className="font-bold text-gray-400">Customizations:</p>
                                                                    <p className="text-gray-600 italic mt-0.5">{item.customizations}</p>
                                                                </div>
                                                            )}
                                                            <div className="pt-2 border-t border-gray-100 flex items-center gap-1.5 text-xs">
                                                                <span className="font-bold text-gray-400">Quantity:</span>
                                                                <span className="text-gray-800 font-bold">{item.quantity}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {(!originalOrder?.order_items || originalOrder.order_items.length === 0) && (
                                                <p className="text-xs text-gray-400 italic">No order items</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const hasFilters = !!(dateRange || companyFilter || statusFilter || startDate || endDate || searchTerm);
    const allSelected = filtered.length > 0 && selected.size === filtered.length;

    return (
        <>

            <div className="space-y-6 dashboard-web-view no-print">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Orders</h1>
                        <p className="hidden md:block text-sm font-medium text-gray-500 mt-1">
                            <span className="text-violet-600 font-bold">{totalCount}</span> order{totalCount !== 1 ? 's' : ''} total ·{' '}
                            <span className="text-violet-600 font-bold">{totalLunches}</span> total lunch{totalLunches !== 1 ? 'es' : ''} ·{' '}
                            <span className="text-amber-500 font-bold">{pendingCount}</span> pending order{pendingCount !== 1 ? 's' : ''}
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
                    <span className="text-violet-600 font-black">{totalCount}</span> orders ·{' '}
                    <span className="text-violet-600 font-black">{totalLunches}</span> lunches ·{' '}
                    <span className="text-amber-500 font-black">{pendingCount}</span> pending order{pendingCount !== 1 ? 's' : ''}
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
                    <div className="grid grid-cols-2 sm:grid-cols-5 md:flex items-center gap-2 w-full md:w-auto">
                        <Button 
                            variant="outline" 
                            className="gap-2 h-11 px-2 md:px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold no-print text-[11px] md:text-sm" 
                            onClick={toggleAll}
                        >
                            <Checkbox
                                checked={allSelected}
                                className="rounded-md border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 shrink-0 pointer-events-none"
                            />
                            <span className="truncate">Select All ({filtered.length})</span>
                        </Button>
                        <Button 
                            variant="outline" 
                            className="gap-1.5 h-11 px-2 md:px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold no-print text-[11px] md:text-sm" 
                            onClick={async () => {
                                document.body.classList.add('print-table-mode');
                                window.print();
                                document.body.classList.remove('print-table-mode');
                                await markOrdersAsPrintedAndFulfilled(ordersToPrint);
                            }}
                        >
                            <Printer className="size-4 shrink-0" />
                            <span className="truncate">
                                {selected.size > 0 ? `Print Table (${selected.size})` : 'Print Table'}
                            </span>
                        </Button>
                        <Button 
                            variant="outline" 
                            className="gap-1.5 h-11 px-2 md:px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold no-print text-[11px] md:text-sm" 
                            onClick={async () => {
                                if (selected.size === 0) {
                                    toast.error('Please select at least one order to print tickets.');
                                    return;
                                }
                                document.body.classList.add('print-tickets-mode');
                                window.print();
                                document.body.classList.remove('print-tickets-mode');
                                await markOrdersAsPrintedAndFulfilled(ordersToPrint);
                            }}
                        >
                            <Ticket className="size-4 text-violet-600 shrink-0" />
                            <span className="truncate">
                                {selected.size > 0 ? `Tickets (${selected.size})` : 'Tickets'}
                            </span>
                        </Button>

                        <Button 
                            variant="outline" 
                            className="gap-1.5 h-11 px-2 md:px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold no-print text-[11px] md:text-sm" 
                            onClick={handleExport}
                        >
                            <Download className="size-4 shrink-0" />
                            <span className="truncate">Export</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex items-center gap-2 border-b border-gray-200 pb-px mb-6 no-print">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={cn(
                        "pb-3 px-4 text-sm font-bold border-b-2 transition-all relative outline-none",
                        activeTab === 'orders'
                            ? "border-violet-600 text-violet-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    Active Orders
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={cn(
                        "pb-3 px-4 text-sm font-bold border-b-2 transition-all relative flex items-center gap-1.5 outline-none",
                        activeTab === 'requests'
                            ? "border-violet-600 text-violet-600"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    )}
                >
                    Change Requests
                    {changeRequests.length > 0 && (
                        <Badge className="bg-violet-600 hover:bg-violet-700 text-white border-none text-[10px] px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full font-bold">
                            {changeRequests.length}
                        </Badge>
                    )}
                </button>
            </div>

            {activeTab === 'orders' ? (
                <>
                    {/* Filters */}
                    <Card className="rounded-2xl border-gray-100 shadow-sm mb-6">
                <CardContent className="p-3 flex flex-wrap items-center gap-4">
                    <div className="relative w-full sm:w-[260px] md:w-[320px]">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search orders..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 h-10 rounded-xl border-gray-200 text-sm font-semibold focus-visible:ring-violet-600 w-full"
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

                    <Select value={dateRange} onValueChange={(val) => handleDateRangeChange(val ?? '')}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                            <SelectValue placeholder="All Dates">
                                {DATE_RANGE_LABELS[dateRange] || dateRange || 'All Dates'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Dates</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
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

                    <div className="flex items-center gap-2">
                        <Input 
                            type="date" 
                            value={startDate} 
                            onChange={e => {
                                setStartDate(e.target.value);
                                setDateRange('custom');
                            }}
                            className="w-[160px] h-10 rounded-xl border-gray-200 text-sm font-semibold" 
                        />
                        <span className="text-gray-400 text-sm font-medium">to</span>
                        <Input 
                            type="date" 
                            value={endDate} 
                            onChange={e => {
                                setEndDate(e.target.value);
                                setDateRange('custom');
                            }}
                            className="w-[160px] h-10 rounded-xl border-gray-200 text-sm font-semibold" 
                        />
                    </div>

                    <Select value={companyFilter} onValueChange={(val) => setCompanyFilter(val ?? '')}>
                        <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                            <SelectValue placeholder="All Companies">
                                {companyFilter ? (
                                    companies.find(c => c.id === companyFilter)?.name || 'All Companies'
                                ) : 'All Companies'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Companies</SelectItem>
                            {companies.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val ?? '')}>
                        <SelectTrigger className="w-[160px] h-10 rounded-xl border-gray-200 font-semibold text-sm">
                            <SelectValue placeholder="All Statuses">
                                {statusFilter ? (
                                    statusFilter === 'pending' ? 'Pending' :
                                    statusFilter === 'fulfilled' ? 'Fulfilled' :
                                    statusFilter === 'cancelled' ? 'Cancelled' :
                                    statusFilter
                                ) : 'All Statuses'}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Statuses</SelectItem>
                            <SelectItem value="pending" className="font-semibold text-xs">Pending</SelectItem>
                            <SelectItem value="fulfilled" className="font-semibold text-xs">Fulfilled</SelectItem>
                            <SelectItem value="cancelled" className="font-semibold text-xs">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button 
                        onClick={() => handleQueryDatabase(1)} 
                        disabled={dbLoading}
                        className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-10 px-5 font-bold text-sm transition-all flex items-center gap-2"
                    >
                        {dbLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        {dbLoading ? 'Searching...' : 'Search'}
                    </Button>

                    {(hasFilters || page > 1) && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={handleClearFilters} 
                            disabled={dbLoading}
                            className="gap-2 text-xs font-bold h-10 px-4 text-gray-400 hover:text-gray-900 transition-colors"
                        >
                            <X className="size-3.5" /> Clear
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Pagination Controls */}
            {totalCount > 100 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-gray-150 shadow-sm no-print mb-6">
                    <div className="text-sm font-semibold text-gray-500">
                        Showing <span className="font-bold text-gray-800">{Math.min(totalCount, (page - 1) * 100 + 1)}</span> to{' '}
                        <span className="font-bold text-gray-800">{Math.min(totalCount, page * 100)}</span> of{' '}
                        <span className="font-bold text-gray-800">{totalCount}</span> orders
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleQueryDatabase(page - 1)}
                            disabled={page === 1 || dbLoading}
                            className="rounded-xl font-bold h-10 px-4 border-gray-200 hover:bg-violet-50 transition-colors"
                        >
                            Previous
                        </Button>
                        <span className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            {dbLoading && <Loader2 className="h-4 w-4 text-violet-600 animate-spin" />}
                            Page {page} of {Math.ceil(totalCount / 100)}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => handleQueryDatabase(page + 1)}
                            disabled={page >= Math.ceil(totalCount / 100) || dbLoading}
                            className="rounded-xl font-bold h-10 px-4 border-gray-200 hover:bg-violet-50 transition-colors"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}

            {/* Bulk Actions */}
            {selected.size > 0 && (
                <div className="flex items-center gap-4 p-4 rounded-2xl border border-violet-200 bg-violet-50/50 shadow-sm mb-6">
                    <span className="text-sm font-bold text-violet-700 ml-2">{selected.size} items selected</span>
                    <div className="h-6 w-px bg-violet-200 mx-2" />
                    <Select onValueChange={(val: string | null) => { if (val) handleBulk(val); }}>
                        <SelectTrigger className="w-[180px] h-9 rounded-xl border-violet-200 bg-white text-xs font-bold text-violet-700">
                            <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="pending">Mark Pending</SelectItem>
                            <SelectItem value="fulfilled">Mark Fulfilled</SelectItem>
                            <SelectItem value="cancelled">Mark Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-9 px-4 rounded-xl font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-all ml-auto gap-2" 
                        onClick={async () => {
                            if (!selected.size) return;
                            
                            const confirmed = await niceConfirm(
                                'Delete Selected Orders',
                                `Are you sure you want to delete all ${selected.size} selected order(s)? This action cannot be undone.`,
                                'danger',
                                'Delete'
                            );
                            if (!confirmed) return;
                            
                            setLoading(true);
                            const result = await bulkDeleteOrders(Array.from(selected));
                            
                            if (result.success) {
                                toast.success('Orders deleted successfully!');
                                const deletedIds = new Set(selected);
                                setOrders(prev => prev.filter(o => !deletedIds.has(o.id)));
                                setSelected(new Set());
                            } else {
                                toast.error(result.error || 'Failed to delete orders');
                            }
                            setLoading(false);
                        }}
                        disabled={loading}
                    >
                        <Trash2 className="size-4" />
                        {loading ? 'Deleting...' : 'Delete Selected'}
                    </Button>

                    <Button size="sm" variant="ghost" className="h-9 px-4 rounded-xl font-bold text-gray-400 hover:text-gray-600" onClick={() => setSelected(new Set())}>
                        Deselect
                    </Button>
                </div>
            )}

            {/* Table */}
            {filtered.length === 0 ? (
                <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-gray-400">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <ShoppingCart className="size-10 opacity-20" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">No orders found</p>
                        <p className="text-sm mt-1 max-w-[300px] text-center">
                            {orders.length === 0 ? 'Orders will appear once customers start ordering.' : 'Try adjusting your filters.'}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === 'table' ? (
                <Card className="rounded-3xl border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="w-[50px] pl-6 py-4">
                                    <Checkbox
                                        checked={allSelected}
                                        onCheckedChange={toggleAll}
                                        className="rounded-md border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                    />
                                </TableHead>
                                <TableHead className="w-[32px] py-4" />
                                <TableHead className="font-bold text-gray-900 py-4">Customer</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Company</TableHead>
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
                            {sorted.flatMap((order) => {
                                const rows = [
                                    <TableRow
                                        key={order.id}
                                        className={`cursor-pointer transition-all duration-200 border-b border-gray-100 group relative ${
                                            expanded === order.id 
                                                ? 'bg-violet-50/50' 
                                                : 'hover:bg-gray-50/80'
                                        }`}
                                        onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                                    >
                                        <TableCell className={`pl-6 py-4 relative ${expanded === order.id ? 'after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-violet-600' : ''}`} onClick={e => e.stopPropagation()}>
                                            <Checkbox
                                                checked={selected.has(order.id)}
                                                onCheckedChange={() => toggleSelect(order.id)}
                                                className="rounded-md border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                            />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <ChevronRight className={`size-4 text-gray-300 group-hover:text-gray-500 transition-transform duration-300 ${expanded === order.id ? 'rotate-90 text-violet-600' : ''}`} />
                                        </TableCell>
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-9 rounded-xl flex items-center justify-center text-[13px] font-black transition-all ${
                                                    expanded === order.id 
                                                        ? 'bg-violet-600 text-white shadow-sm' 
                                                        : 'bg-gray-100 text-gray-600 group-hover:bg-violet-100 group-hover:text-violet-700'
                                                }`}>
                                                    {(order.guide_name || order.customer_name)?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-bold text-[13.5px] text-gray-900">{order.guide_name || order.customer_name}</p>
                                                        {order.is_locked && <Lock className="size-3 text-amber-500" />}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100/50 border border-gray-200/50 text-[11px] font-bold text-gray-600">
                                                <Building2 className="size-3 text-gray-400" />
                                                {order.tour_companies?.name || 'Individual'}
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
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <Badge variant="outline" className={`
                                                    ${order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                    ${order.status === 'ticket_created' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                                                    ${order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                    ${order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                `}>
                                                    {STATUS_LABELS[order.status] || order.status}
                                                </Badge>
                                                {(() => {
                                                    const pendingReq = (order as any).order_change_requests?.find((r: any) => r.status === 'pending');
                                                    if (pendingReq) {
                                                        return (
                                                            <Badge 
                                                                variant="outline" 
                                                                onClick={(e) => handleBadgeClick(e, order.id)}
                                                                className="rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200 animate-pulse cursor-pointer hover:bg-blue-100 transition-colors"
                                                            >
                                                                Pending {pendingReq.type === 'delete' ? 'Deletion' : pendingReq.type === 'cancel' ? 'Cancellation' : 'Edit'}
                                                            </Badge>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center pr-6" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className={cn(
                                                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                                                    "h-9 w-9 p-0 rounded-xl hover:bg-violet-50 hover:text-violet-600 transition-all"
                                                )}>
                                                    <MoreHorizontal className="size-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1 bg-white">
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
                                                            setCompanyId(order.company_id || null);
                                                            setEditItems(JSON.parse(JSON.stringify(order.order_items || [])));
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="size-3.5" /> Edit Order
                                                    </DropdownMenuItem>
 
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700 cursor-pointer">
                                                            <ListFilter className="size-3.5" /> Change Status
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent className="rounded-xl border-gray-100 shadow-xl p-1 ml-1 bg-white">
                                                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                                <DropdownMenuItem
                                                                    key={value}
                                                                    className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700 cursor-pointer"
                                                                    onClick={() => handleStatus(order.id, value)}
                                                                >
                                                                    {order.status === value && <Check className="size-3 text-violet-600" />}
                                                                    <span className={order.status === value ? 'text-violet-600 pl-0' : 'pl-5'}>{label}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>
 
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
                                    </TableRow>
                                ];
 
                                if (expanded === order.id) {
                                    rows.push(
                                        <TableRow key={`${order.id}-detail`} className="border-none hover:bg-transparent">
                                            <TableCell colSpan={9} className="p-0 border-b border-gray-100">
                                                <div className="bg-gray-50/50 px-6 py-8 border-t border-gray-100">
                                                    <div className="max-w-3xl mx-auto">
                                                        {/* Single Unified Card */}
                                                        <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                                                            {/* Section 1: Items List */}
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
                                                                            <p className="font-bold text-base text-gray-900 tracking-tight">${(item.unit_price * item.quantity).toFixed(2)}</p>
                                                                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">${item.unit_price.toFixed(2)} ea</p>
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
                                                                            {isMounted ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
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
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                }
                                return rows;
                            })}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
                    {filtered.map((order) => {
                        const isExpanded = expanded === order.id;
                        const totalItems = order.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                        const totalPrice = order.order_items?.reduce((acc: number, item: any) => acc + (Number(item.unit_price) * item.quantity), 0) || 0;

                        return (
                            <Card 
                                key={order.id} 
                                className={cn(
                                    "rounded-[24px] border border-gray-100 bg-white shadow-sm transition-all duration-300 overflow-hidden cursor-pointer hover:shadow-md relative",
                                    isExpanded ? "ring-2 ring-violet-500 shadow-md animate-in fade-in zoom-in-95 duration-200" : ""
                                )}
                                onClick={() => setExpanded(isExpanded ? null : order.id)}
                            >
                                <CardContent className="p-5 space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div onClick={e => e.stopPropagation()} className="pt-0.5">
                                                <Checkbox
                                                    checked={selected.has(order.id)}
                                                    onCheckedChange={() => toggleSelect(order.id)}
                                                    className="rounded-md border-gray-300 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                                />
                                            </div>
                                            <div className={cn(
                                                "size-10 rounded-xl flex items-center justify-center text-sm font-black transition-all",
                                                isExpanded 
                                                    ? "bg-violet-600 text-white shadow-sm" 
                                                    : "bg-violet-50 text-violet-700"
                                            )}>
                                                {(order.guide_name || order.customer_name)?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                            <div className="min-w-0 max-w-[150px] sm:max-w-[200px]">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-[15px] text-gray-900 leading-tight truncate">{order.guide_name || order.customer_name}</h3>
                                                    {order.is_locked && <Lock className="size-3 text-amber-500 shrink-0" />}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger className={cn(
                                                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                                                    "h-8 w-8 p-0 rounded-lg hover:bg-violet-50 hover:text-violet-600 transition-all"
                                                )}>
                                                    <MoreHorizontal className="size-4" />
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1 bg-white">
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
                                                            setCompanyId(order.company_id || null);
                                                            setEditItems(JSON.parse(JSON.stringify(order.order_items || [])));
                                                            setIsEditDialogOpen(true);
                                                        }}
                                                    >
                                                        <Pencil className="size-3.5" /> Edit Order
                                                    </DropdownMenuItem>
                                                    
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700 cursor-pointer">
                                                            <ListFilter className="size-3.5" /> Change Status
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuSubContent className="rounded-xl border-gray-100 shadow-xl p-1 ml-1 bg-white">
                                                            {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                                <DropdownMenuItem
                                                                    key={value}
                                                                    className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700 cursor-pointer"
                                                                    onClick={() => handleStatus(order.id, value)}
                                                                >
                                                                    {order.status === value && <Check className="size-3 text-violet-600" />}
                                                                    <span className={order.status === value ? 'text-violet-600 pl-0' : 'pl-5'}>{label}</span>
                                                                </DropdownMenuItem>
                                                            ))}
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuSub>

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

                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold">
                                        <Building2 className="size-3.5 text-gray-400 shrink-0" />
                                        <span className="truncate">{order.tour_companies?.name || 'Individual'}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-semibold text-gray-500 border-t border-gray-50">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Tour Date</span>
                                            <span className="text-[12px] font-bold text-gray-900 leading-tight">{formatDateUS(order.tour_date)}</span>
                                            <span className="text-[10px] text-gray-400 mt-0.5 truncate">{order.pickup_time || 'No time set'}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Placed At</span>
                                            <span className="text-[12px] font-semibold text-gray-400 leading-tight">{isMounted ? formatDateUS(order.created_at) : ''}</span>
                                            <span className="text-[10px] text-gray-400 mt-0.5 truncate">
                                                {isMounted ? new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Badge variant="outline" className={cn(
                                                "rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                                order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : '',
                                                order.status === 'ticket_created' ? 'bg-blue-50 text-blue-700 border-blue-200' : '',
                                                order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : '',
                                                order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''
                                            )}>
                                                {STATUS_LABELS[order.status] || order.status.replace('_', ' ')}
                                            </Badge>
                                            {(() => {
                                                const pendingReq = (order as any).order_change_requests?.find((r: any) => r.status === 'pending');
                                                if (pendingReq) {
                                                    return (
                                                        <Badge 
                                                            variant="outline" 
                                                            onClick={(e) => handleBadgeClick(e, order.id)}
                                                            className="rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-200 animate-pulse cursor-pointer hover:bg-blue-100 transition-colors"
                                                        >
                                                            Pending {pendingReq.type === 'delete' ? 'Deletion' : pendingReq.type === 'cancel' ? 'Cancellation' : 'Edit'}
                                                        </Badge>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        
                                        <div className="text-right">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Price</span>
                                            <span className="text-[14px] font-black text-violet-600">
                                                ${totalPrice.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50/50 rounded-xl p-3 space-y-1.5 border border-gray-100">
                                        <div className="flex items-center gap-2 font-bold text-xs text-gray-800">
                                            <div className="size-5 rounded bg-violet-100 flex items-center justify-center text-[10px] font-black text-violet-700">
                                                {totalItems}
                                            </div>
                                            <span>Total Items</span>
                                        </div>
                                        <div className="space-y-1">
                                            {order.order_items?.slice(0, 5).map((item: any, idx: number) => (
                                                <p key={idx} className="text-[11px] font-medium text-gray-600 leading-tight truncate">
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
                                                        <p className="text-xs text-amber-900 font-bold italic leading-relaxed break-words">&ldquo;{order.notes}&rdquo;</p>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Edit Order Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white">
                    <DialogHeader className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
                        <DialogTitle className="text-xl font-bold text-gray-900 tracking-tight">Edit Order Details</DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium">
                            Update order metadata and individual item details.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleEditSubmit}>
                        <div className="px-8 py-8 space-y-6 max-h-[70vh] overflow-y-auto">
                            {/* Metadata Section */}
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
                                    <Label className="text-[11px] font-bold uppercase tracking-[0.1em] text-gray-400 ml-1">Tour Company</Label>
                                    <Select value={companyId || 'none'} onValueChange={(v) => setCompanyId(v === 'none' ? null : v)}>
                                        <SelectTrigger className="h-11 rounded-xl border-gray-200 font-semibold focus:ring-violet-500/20">
                                            <SelectValue>
                                                {companyId 
                                                    ? (companies.find(c => c.id === companyId)?.name || 'Unknown Company') 
                                                    : 'Individual Order'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {companies
                                                .filter(c => c.status === 'active' || c.id === editingOrder?.company_id)
                                                .map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        {c.name} {c.status !== 'active' ? `(${c.status.replace('_', ' ')})` : ''}
                                                    </SelectItem>
                                                ))
                                            }
                                        </SelectContent>
                                    </Select>
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
                                            <div className="flex items-start justify-between border-b border-gray-100/50 pb-4 gap-4">
                                                <div className="flex-grow min-w-0 space-y-1">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Meal Selection</Label>
                                                    <Select
                                                        value={item.meal_name || ''}
                                                        onValueChange={(val) => {
                                                            const selectedMeal = selectedCompanyMeals.find((m) => m.name === val);
                                                            if (selectedMeal) {
                                                                updateEditItem(item.id, {
                                                                    meal_id: selectedMeal.id,
                                                                    meal_name: selectedMeal.name,
                                                                    unit_price: selectedMeal.price || 0
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger className="!h-9 !w-full rounded-lg border-gray-200 text-[12px] font-bold bg-white">
                                                            <SelectValue placeholder="Select a meal..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-gray-200 max-h-[200px] overflow-y-auto">
                                                            {selectedCompanyMeals.map((m: any) => (
                                                                <SelectItem key={m.id} value={m.name} className="text-[12px] font-bold">
                                                                    {m.name} (${Number(m.price || 0).toFixed(2)})
                                                                </SelectItem>
                                                            ))}
                                                            {item.meal_name && !selectedCompanyMeals.some((m) => m.name === item.meal_name) && (
                                                                <SelectItem key="fallback" value={item.meal_name} className="text-[12px] font-bold">
                                                                    {item.meal_name} (Current - Inactive)
                                                                </SelectItem>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 pt-5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Label className="text-[10px] font-bold text-gray-400 uppercase">Qty</Label>
                                                        <Input 
                                                            type="number" 
                                                            min="1"
                                                            value={item.quantity} 
                                                            onChange={(e) => updateEditItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                            className="w-14 h-8 rounded-lg border-gray-200 font-bold text-center focus:ring-violet-500/20"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg"
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Item Components Grid */}
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Type</Label>
                                                    <Select
                                                        value={item.box_type || ''}
                                                        onValueChange={(val) => updateEditItem(item.id, { box_type: val })}
                                                    >
                                                        <SelectTrigger className="!h-9 !w-full rounded-lg border-gray-200 text-[12px] font-medium bg-white">
                                                            <SelectValue placeholder="Select type..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-gray-200">
                                                            {getBoxTypeOptions(item).map((opt: string) => (
                                                                <SelectItem key={opt} value={opt} className="text-[12px] font-medium">
                                                                    {opt}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Bread / Style</Label>
                                                    <Select
                                                        value={item.bread_type || ''}
                                                        onValueChange={(val) => updateEditItem(item.id, { bread_type: val })}
                                                    >
                                                        <SelectTrigger className="!h-9 !w-full rounded-lg border-gray-200 text-[12px] font-medium bg-white">
                                                            <SelectValue placeholder="Select bread..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-gray-200">
                                                            {getBreadOptions(item.bread_type || '').map((opt: string) => (
                                                                <SelectItem key={opt} value={opt} className="text-[12px] font-medium">
                                                                    {opt}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Cookie Choice</Label>
                                                    <Select
                                                        value={item.cookie_choice || ''}
                                                        onValueChange={(val) => updateEditItem(item.id, { cookie_choice: val })}
                                                    >
                                                        <SelectTrigger className="!h-9 !w-full rounded-lg border-gray-200 text-[12px] font-medium bg-white">
                                                            <SelectValue placeholder="Select cookie..." />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white border-gray-200">
                                                            {getCookieOptions(item.cookie_choice || '').map((opt: string) => (
                                                                <SelectItem key={opt} value={opt} className="text-[12px] font-medium">
                                                                    {opt}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
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
                                                    <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Item Notes / Customizations</Label>
                                                    <Input 
                                                        value={item.customizations || ''} 
                                                        onChange={(e) => updateEditItem(item.id, { customizations: e.target.value })}
                                                        placeholder="No onions, extra sauce..."
                                                        className="h-9 rounded-lg border-gray-200 text-[12px] font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Add Selection Button */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAddItem}
                                        className="w-full py-4 border-dashed border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 text-violet-600 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all mt-4"
                                    >
                                        <Plus className="size-4" />
                                        Add Selection
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="bg-gray-50/50 px-8 py-6 border-t border-gray-100">
                            <Button type="button" variant="ghost" className="rounded-xl font-bold text-gray-500" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading || !hasChanges || editItems.length === 0} className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold px-10 shadow-lg shadow-violet-100">
                                {loading ? 'Saving...' : 'Update Order'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
                </>
            ) : (
                renderChangeRequests()
            )}
        </div>
            {/* Print Tickets Layout */}
            {(() => {
                const ticketCards = ordersToPrint.flatMap((order) => {
                    const items = order.order_items || [];
                    if (items.length === 0) {
                        return [
                            <div 
                                key={`${order.id}-empty`} 
                                className="print-ticket-card border border-gray-400 p-6 rounded-2xl break-inside-avoid bg-white flex flex-col justify-between"
                                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                            >
                                <div>
                                    {/* Brand Header with Logo */}
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <img src="/icon.svg" alt="" className="w-7 h-7" />
                                        <h1 className="text-xl font-black text-center text-[#1E3A8A] tracking-wider uppercase">
                                            MOUNTAIN MAMA&apos;S CAFE
                                        </h1>
                                    </div>

                                    {/* Dashed separator */}
                                    <div className="border-t border-dashed border-gray-300 my-2 dashed-sep" />

                                    {/* Gray Rounded Meta Box */}
                                    <div className="bg-[#F3F4F6] p-2.5 rounded-lg text-[11px] text-gray-800 font-medium border border-gray-200 meta-box">
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                            <div className="break-words">
                                                <span className="font-bold text-gray-600">Guest Name:</span>{' '}
                                                <span className="uppercase font-bold text-gray-900">{order.customer_name}</span>
                                            </div>
                                            <div className="break-words text-right">
                                                <span className="font-bold text-gray-600">Tour Date:</span>{' '}
                                                <span className="font-bold text-gray-900">{formatDateUS(order.tour_date)}</span>
                                            </div>
                                            <div className="break-words">
                                                <span className="font-bold text-gray-600">Group:</span>{' '}
                                                <span className="text-gray-900 font-bold">{order.tour_companies?.name || 'Individual'}</span>
                                            </div>
                                            <div className="break-words text-right">
                                                <span className="font-bold text-gray-600">Guide:</span>{' '}
                                                <span className="text-gray-900 font-bold">{order.guide_name || 'None'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-900 pickup-time">
                                        <span>⏰ Pick-up:</span>
                                        <span className="font-extrabold">{order.pickup_time || 'None'}</span>
                                    </div>

                                    {/* Order Details Header */}
                                    <div className="mt-2 pb-0.5 border-b border-gray-300 order-details-header">
                                        <p className="text-[10px] font-bold tracking-wider text-gray-900">Order Details</p>
                                    </div>

                                    {/* Order Items list */}
                                    <div className="my-2">
                                        <p className="text-xs text-gray-400 italic">No items found for this order</p>
                                    </div>
                                </div>

                                {/* Footer block */}
                                <div>
                                    <div className="text-center my-2">
                                        <p className="text-lg font-bold text-amber-600 italic font-serif enjoy-text">Enjoy your meal!</p>
                                        <p className="text-[7px] font-black text-gray-400 tracking-widest uppercase mt-0.5 support-text">
                                            THANK YOU FOR SUPPORTING LOCAL BUSINESSES!
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 flex justify-between text-[7px] text-gray-400 font-bold uppercase tracking-widest card-footer-info">
                                        <span>Order ID: {order.id.includes('-') ? order.id.split('-')[0].toUpperCase() : order.id.toUpperCase()}</span>
                                        <span>Printed: {isMounted ? formatDateTimeUS(new Date()) : ''}</span>
                                    </div>
                                </div>
                            </div>
                        ];
                    }

                    // Expand each item of quantity Q into Q individual items of quantity 1
                    const expandedItems = items.flatMap((item: any, itemIdx: number) => {
                        const qty = item.quantity || 1;
                        const singleItems = [];
                        for (let k = 0; k < qty; k++) {
                            singleItems.push({
                                ...item,
                                quantity: 1,
                                _itemIndex: k
                            });
                        }
                        return singleItems;
                    });

                    return expandedItems.map((item: any, itemIdx: number) => {
                        const ticketKey = `${order.id}-${item.id || itemIdx}-${item._itemIndex}`;
                        return (
                            <div 
                                key={ticketKey} 
                                className="print-ticket-card border border-gray-400 p-4 rounded-2xl break-inside-avoid bg-white flex flex-col justify-between"
                                style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                            >
                                <div>
                                    {/* Brand Header with Logo */}
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <img src="/icon.svg" alt="" className="w-7 h-7" />
                                        <h1 className="text-xl font-black text-center text-[#1E3A8A] tracking-wider uppercase">
                                            MOUNTAIN MAMA&apos;S CAFE
                                        </h1>
                                    </div>

                                    {/* Dashed separator */}
                                    <div className="border-t border-dashed border-gray-300 my-2 dashed-sep" />

                                    {/* Gray Rounded Meta Box */}
                                    <div className="bg-[#F3F4F6] p-2.5 rounded-lg text-[11px] text-gray-800 font-medium border border-gray-200 meta-box">
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                                            <div className="break-words">
                                                <span className="font-bold text-gray-600">Guest Name:</span>{' '}
                                                <span className="uppercase font-bold text-gray-900">{item.guest_name || order.customer_name}</span>
                                            </div>
                                            <div className="break-words text-right">
                                                <span className="font-bold text-gray-600">Tour Date:</span>{' '}
                                                <span className="font-bold text-gray-900">{formatDateUS(order.tour_date)}</span>
                                            </div>
                                            <div className="break-words">
                                                <span className="font-bold text-gray-600">Group:</span>{' '}
                                                <span className="text-gray-900 font-bold">{order.tour_companies?.name || 'Individual'}</span>
                                            </div>
                                            <div className="break-words text-right">
                                                <span className="font-bold text-gray-600">Guide:</span>{' '}
                                                <span className="text-gray-900 font-bold">{order.guide_name || 'None'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-gray-900 pickup-time">
                                        <span>⏰ Pick-up:</span>
                                        <span className="font-extrabold">{order.pickup_time || 'None'}</span>
                                    </div>

                                    {/* Order Details Header */}
                                    <div className="mt-2 pb-0.5 border-b border-gray-300 order-details-header">
                                        <p className="text-[10px] font-bold tracking-wider text-gray-900">Order Details</p>
                                    </div>

                                    {/* Order Items list */}
                                    <div className="my-2">
                                        <p className="font-bold text-sm text-gray-900 item-title">
                                            {item.quantity}x {item.meal_name}
                                        </p>
                                        <p className="text-xs text-gray-700 italic leading-snug item-options">
                                            {[
                                                formatBoxType(item.box_type),
                                                item.bread_type,
                                                item.cookie_choice,
                                                ...((item.custom_fields && typeof item.custom_fields === 'object')
                                                    ? Object.entries(item.custom_fields)
                                                        .filter(([key, val]) => val && !STANDARD_ITEM_KEYS.includes(key))
                                                        .map(([key, val]) => `${formatFieldName(key)}: ${String(val)}`)
                                                    : [])
                                            ].filter(Boolean).join(' • ')}
                                        </p>
                                        {(item.guest_name || item.customizations) && (
                                            <p className="text-xs text-gray-800 font-medium leading-snug mt-0.5 item-notes">
                                                {item.guest_name && <span className="font-bold text-violet-700">{item.guest_name}</span>}
                                                {item.guest_name && item.customizations && ' '}
                                                {item.customizations && <span className="text-red-600 italic font-semibold">{item.customizations}</span>}
                                            </p>
                                        )}

                                        {/* Company prep instructions in ticket details */}
                                        {order.tour_companies?.prep_instructions && (
                                            <div className="mt-1.5 bg-amber-50 border border-amber-100 p-2 rounded-lg text-xs font-semibold text-amber-900 item-notes">
                                                ⚠️ Note: {order.tour_companies.prep_instructions.length > 100 ? order.tour_companies.prep_instructions.slice(0, 100) + '...' : order.tour_companies.prep_instructions}
                                            </div>
                                        )}

                                        {/* General order notes */}
                                        {order.notes && (
                                            <>
                                                <div className="w-10 border-t border-dashed border-gray-300 my-1.5 dashed-sep" />
                                                <p className="font-bold text-xs text-gray-900 item-notes">Notes</p>
                                                <p className="text-xs text-gray-800 italic leading-snug item-notes">
                                                    {order.notes.length > 100 ? order.notes.slice(0, 100) + '...' : order.notes}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Footer block */}
                                <div>
                                    <div className="text-center my-2">
                                        <p className="text-lg font-bold text-amber-600 italic font-serif enjoy-text">Enjoy your meal!</p>
                                        <p className="text-[7px] font-black text-gray-400 tracking-widest uppercase mt-0.5 support-text">
                                            THANK YOU FOR SUPPORTING LOCAL BUSINESSES!
                                        </p>
                                    </div>

                                    <div className="pt-2 border-t border-gray-100 flex justify-between text-[7px] text-gray-400 font-bold uppercase tracking-widest card-footer-info">
                                        <span>Order ID: {order.id.includes('-') ? order.id.split('-')[0].toUpperCase() : order.id.toUpperCase()}</span>
                                        <span>Printed: {isMounted ? formatDateTimeUS(new Date()) : ''}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    });
                });

                const ticketPages = [];
                for (let i = 0; i < ticketCards.length; i += 6) {
                    ticketPages.push(ticketCards.slice(i, i + 6));
                }

                return (
                    <div className="print-only-section print-tickets-container">
                        {ticketPages.map((pageGroup, pageIdx) => (
                            <div key={`page-${pageIdx}`} className="print-ticket-page">
                                <div className="print-tickets-grid">
                                    {pageGroup}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })()}

            {/* Print Zebra Labels Layout */}
            <div className="print-only-section print-zebra-container">
                <div className="p-0 print-zebra-grid">
                    {ordersToPrint.flatMap((order) => {
                        const items = order.order_items || [];
                        if (items.length === 0) {
                            return [
                                <div 
                                    key={`${order.id}-zebra-empty`} 
                                    className="print-zebra-card border border-gray-400 p-3 bg-white flex flex-col justify-between"
                                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                                >
                                    <div>
                                        {/* Header */}
                                        <div className="flex items-center justify-between border-b border-black pb-1 mb-1">
                                            <span className="text-[10px] font-black tracking-wider text-violet-700 uppercase">MTN MAMA CAFE</span>
                                            <span className="text-[9px] font-bold text-gray-500 truncate max-w-[50%]">{order.tour_companies?.name || 'Retail'}</span>
                                        </div>

                                        {/* Name & Tour Date */}
                                        <div className="text-xs font-bold text-gray-900 uppercase">
                                            {order.guide_name || order.customer_name || 'Guest'}
                                        </div>

                                        <div className="text-[9px] text-gray-600 font-semibold mt-1">
                                            Date: {formatDateUS(order.tour_date)}
                                            {order.pickup_time && ` · Time: ${order.pickup_time}`}
                                        </div>

                                        <div className="text-[10px] font-bold text-rose-600 mt-2">
                                            No items found for this order
                                        </div>
                                    </div>
                                    
                                    <div className="pt-1 border-t border-gray-200 flex justify-between text-[7px] text-gray-400 font-bold uppercase">
                                        <span>ID: {order.id.slice(0, 8).toUpperCase()}</span>
                                        <span>{isMounted ? formatDateTimeUS(new Date()).split(',')[0] : ''}</span>
                                    </div>
                                </div>
                            ];
                        }

                        const expandedItems = items.flatMap((item: any, itemIdx: number) => {
                            const qty = item.quantity || 1;
                            const singleItems = [];
                            for (let k = 0; k < qty; k++) {
                                singleItems.push({
                                    ...item,
                                    quantity: 1,
                                    _itemIndex: k
                                });
                            }
                            return singleItems;
                        });

                        return expandedItems.map((item: any, itemIdx: number) => {
                            const ticketKey = `${order.id}-${item.id || itemIdx}-${item._itemIndex}-zebra`;
                            return (
                                <div 
                                    key={ticketKey} 
                                    className="print-zebra-card border border-gray-400 p-3 bg-white flex flex-col justify-between"
                                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                                >
                                    <div>
                                        {/* Header: Company & Tour Details */}
                                        <div className="flex items-center justify-between border-b border-black pb-1 mb-1">
                                            <span className="text-[10px] font-black tracking-wider text-violet-700 uppercase truncate max-w-[65%]">
                                                {order.tour_companies?.name || 'Retail Order'}
                                            </span>
                                            {order.guide_name && (
                                                <span className="text-[8px] font-bold text-gray-500 uppercase truncate max-w-[30%]">
                                                    G: {order.guide_name}
                                                </span>
                                            )}
                                        </div>

                                        {/* Customer / Guest Name - PRIMARY */}
                                        <div className="text-[15px] font-black text-gray-950 uppercase tracking-tight truncate mb-1">
                                            {item.guest_name || order.customer_name || 'Quick Guest'}
                                        </div>

                                        {/* Meal Item */}
                                        <div className="bg-gray-100 p-1.5 rounded border border-gray-200 mb-1">
                                            <p className="font-extrabold text-[12px] text-gray-950 leading-tight">
                                                {item.meal_name}
                                                <span className="text-[9px] font-medium text-gray-600 ml-1.5 uppercase">
                                                    ({item.box_type || 'Bag Lunch'})
                                                </span>
                                            </p>
                                        </div>

                                        {/* Options breakdown */}
                                        <div className="text-[9.5px] text-gray-900 leading-tight space-y-0.5">
                                            {item.bread_type && (
                                                <p className="font-medium text-gray-700">
                                                    🍞 <span className="font-semibold text-gray-900">{item.bread_type}</span>
                                                </p>
                                            )}
                                            {item.cookie_choice && (
                                                <p className="font-medium text-gray-700">
                                                    🍪 <span className="font-semibold text-gray-900">{item.cookie_choice}</span>
                                                </p>
                                            )}
                                            {item.custom_fields && typeof item.custom_fields === 'object' && 
                                                Object.entries(item.custom_fields)
                                                    .filter(([key, val]) => val && !STANDARD_ITEM_KEYS.includes(key))
                                                    .map(([key, val]) => (
                                                        <p key={key} className="font-medium text-gray-700">
                                                            ▪️ <span className="font-semibold text-gray-900">{formatFieldName(key)}: {String(val)}</span>
                                                        </p>
                                                    ))
                                            }
                                        </div>

                                        {/* Customizations / Warnings */}
                                        {item.customizations && (
                                            <div className="mt-1 border-t border-dashed border-gray-300 pt-0.5">
                                                <p className="text-[9.5px] font-black text-red-600 leading-tight uppercase tracking-tight">
                                                    ⚠️ {item.customizations}
                                                </p>
                                            </div>
                                        )}

                                        {/* Tour Company Prep Instructions */}
                                        {order.tour_companies?.prep_instructions && (
                                            <div className="mt-1 border-t border-dashed border-gray-200 pt-0.5">
                                                <p className="text-[8px] font-bold text-amber-700 leading-tight italic truncate">
                                                    Note: {order.tour_companies.prep_instructions}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer: Date & Order Info */}
                                    <div className="border-t border-gray-200 pt-1 mt-1 flex items-center justify-between text-[7px] text-gray-400 font-bold uppercase">
                                        <span>ID: {order.id.slice(0, 8).toUpperCase()}</span>
                                        <span>
                                            {order.tour_date ? formatDateUS(order.tour_date) : ''} 
                                            {order.pickup_time ? ` @ ${order.pickup_time}` : ''}
                                        </span>
                                    </div>
                                </div>
                            );
                        });
                    })}
                </div>
            </div>

            {/* Print Table Layout */}
            <div className="print-only-section print-table-container">
                <div className="p-6">
                    {/* Header Branding */}
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-black tracking-widest text-[#7C3AED] uppercase">MOUNTAIN MAMA'S CAFÉ</h1>
                        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide mt-0.5">Orders Dashboard</h2>
                    </div>

                    {/* Filters & Count Bar */}
                    <div className="flex justify-between items-end pb-3 border-b-2 border-[#7C3AED] mb-4">
                        <div className="text-[11px] font-bold text-gray-700 flex flex-wrap gap-x-4">
                            {dateRange && (
                                <div>
                                    <span className="text-[#7C3AED]">Date Filter:</span> {getDateFilterLabel()}
                                </div>
                            )}
                            {companyFilter && (
                                <div>
                                    <span className="text-[#7C3AED]">Company:</span> {getCompanyFilterLabel()}
                                </div>
                            )}
                            {statusFilter && (
                                <div>
                                    <span className="text-[#7C3AED]">Status:</span> {getStatusFilterLabel()}
                                </div>
                            )}
                            {!dateRange && !companyFilter && !statusFilter && (
                                <div className="text-gray-400 italic font-medium">All Orders (No Filter)</div>
                            )}
                        </div>
                        <div className="text-[11px] font-black text-gray-900">
                            Total Orders: {ordersToPrint.length}
                        </div>
                    </div>

                    {/* Table */}
                    <table className="w-full border-collapse text-left text-xs">
                        <thead>
                            <tr className="bg-[#7C3AED] text-white font-bold text-[10.5px] tracking-wider border-none">
                                <th className="p-3 w-[15%] rounded-l-md">Name</th>
                                <th className="p-3 w-[10%]">Date</th>
                                <th className="p-3 w-[15%]">Placed At</th>
                                <th className="p-3 w-[18%]">Company / Guide</th>
                                <th className="p-3 w-[27%]">Order Details</th>
                                <th className="p-3 w-[15%] rounded-r-md">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100/70">
                            {ordersToPrint.map((order) => (
                                <tr key={order.id} className="odd:bg-white even:bg-purple-50/5 break-inside-avoid">
                                    {/* NAME */}
                                    <td className="p-3 align-top font-bold text-gray-900">
                                        {order.guide_name || order.customer_name}
                                    </td>
                                    {/* DATE */}
                                    <td className="p-3 align-top font-bold text-gray-800">
                                        {formatDateUS(order.tour_date)}
                                    </td>
                                    {/* PLACED AT */}
                                    <td className="p-3 align-top text-gray-700 font-medium">
                                        {isMounted ? formatDateTimeUS(new Date(order.created_at)) : ''}
                                    </td>
                                    {/* COMPANY / GUIDE */}
                                    <td className="p-3 align-top">
                                        <p className="font-bold text-gray-900">
                                            {order.tour_companies?.name || 'Individual'}
                                        </p>
                                        {order.guide_name && (
                                            <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                                                Guide: {order.guide_name}
                                            </p>
                                        )}
                                    </td>
                                    {/* ORDER DETAILS */}
                                    <td className="p-3 align-top">
                                        <div className="space-y-2">
                                            {order.order_items?.map((item, idx) => (
                                                <div key={idx}>
                                                    {idx > 0 && <div className="border-t border-dashed border-gray-200 my-2 w-16" />}
                                                    <div>
                                                        <p className="font-bold text-xs text-gray-900 tracking-tight">
                                                            {item.quantity}x {item.meal_name}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 font-medium italic mt-0.5">
                                                            {[
                                                                formatBoxType(item.box_type), 
                                                                item.bread_type, 
                                                                item.cookie_choice
                                                            ].filter(Boolean).join(' • ')}
                                                        </p>
                                                        {item.guest_name && (
                                                            <p className="text-[10px] text-gray-600 font-medium mt-0.5">
                                                                {item.guest_name}
                                                            </p>
                                                        )}
                                                        {item.customizations && (
                                                            <p className="text-[10px] text-amber-800 font-medium italic mt-0.5">
                                                                Detail: {item.customizations}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                            {order.pickup_time && (
                                                <p className="text-[9.5px] text-[#7C3AED] font-bold mt-2 pt-2 border-t border-dotted border-gray-200">
                                                    ⏰ Time of pick-up: {order.pickup_time}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    {/* NOTES */}
                                    <td className="p-3 align-top text-[10px] text-gray-600 italic leading-normal break-words">
                                        {order.notes || ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="mt-8 pt-4 border-t border-purple-200 flex justify-between text-[10px] font-black text-purple-400 uppercase tracking-widest">
                        <span>Total Orders in Report: {filtered.length}</span>
                        <span>Mountain Mama's Café Admin System</span>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @page ticket-page {
                    size: letter;
                    margin: 0 !important;
                }

                @page table-page {
                    size: portrait;
                    margin: 1.5cm;
                }

                /* Hide print containers by default in screen view */
                .print-only-section {
                    display: none !important;
                }

                @media print {
                    /* Hide EVERYTHING in the dashboard */
                    nav,
                    aside,
                    header,
                    .no-print,
                    .dashboard-web-view,
                    #impersonation-banner {
                        display: none !important;
                    }

                    /* Reset body margins for print only for tickets and zebra labels */
                    body.print-tickets-mode, body.print-tickets-mode html,
                    body.print-zebra-mode, body.print-zebra-mode html {
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }

                    body.print-table-mode, body.print-table-mode html {
                        padding: 0 !important;
                        background: white !important;
                    }

                    /* Only show the requested container */
                    body.print-tickets-mode .print-tickets-container {
                        display: block !important;
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        width: 8.5in !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        z-index: 99999 !important;
                        background: white !important;
                        page: ticket-page;
                    }

                    /* Specific container styling for each ticket sheet page */
                    .print-ticket-page {
                        display: block !important;
                        width: 8.5in !important;
                        height: 11in !important;
                        padding-top: 0.625in !important;
                        padding-left: 0.625in !important;
                        box-sizing: border-box !important;
                        page-break-after: always !important;
                        break-after: page !important;
                        background: white !important;
                    }

                    body.print-table-mode .print-table-container {
                        display: block !important;
                        position: absolute !important;
                        top: 0; left: 0; width: 100%;
                        page: table-page;
                    }

                    body.print-zebra-mode .print-zebra-container {
                        display: block !important;
                        position: absolute !important;
                        top: 0; left: 0; width: 100%;
                        page: ticket-page;
                    }

                    /* Tickets 2-column grid layout for print (3" x 3" square labels, 6 per page) */
                    body.print-tickets-mode .print-tickets-grid {
                        display: grid !important;
                        grid-template-columns: repeat(2, 3in) !important;
                        grid-auto-rows: 3in !important;
                        gap: 0.375in 1.25in !important;
                        width: 7.25in !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                    }

                    /* 3" x 3" ticket card styling */
                    .print-ticket-card {
                        width: 3in !important;
                        height: 3in !important;
                        border: 1.5px solid #4b5563 !important;
                        border-radius: 0.5rem !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        padding: 0.5rem !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: space-between !important;
                        background: white !important;
                        font-size: 9px !important;
                    }

                    .print-ticket-card h1 {
                        font-size: 12px !important;
                        line-height: 1.1 !important;
                    }

                    .print-ticket-card img {
                        width: 18px !important;
                        height: 18px !important;
                    }

                    .print-ticket-card .dashed-sep {
                        margin: 0.15rem 0 !important;
                    }

                    .print-ticket-card .meta-box {
                        padding: 0.25rem 0.35rem !important;
                        font-size: 8.5px !important;
                        line-height: 1.2 !important;
                        border-radius: 0.25rem !important;
                    }

                    .print-ticket-card .pickup-time {
                        margin-top: 0.2rem !important;
                        font-size: 9.5px !important;
                    }

                    .print-ticket-card .order-details-header {
                        margin-top: 0.2rem !important;
                        font-size: 8.5px !important;
                    }

                    .print-ticket-card .item-title {
                        font-size: 11px !important;
                        line-height: 1.2 !important;
                    }

                    .print-ticket-card .item-options {
                        font-size: 8.5px !important;
                        line-height: 1.2 !important;
                    }

                    .print-ticket-card .item-notes {
                        font-size: 8.5px !important;
                        line-height: 1.2 !important;
                    }

                    .print-ticket-card .enjoy-text {
                        font-size: 12px !important;
                        line-height: 1.1 !important;
                        margin: 0.25rem 0 0 0 !important;
                    }

                    .print-ticket-card .support-text {
                        font-size: 6px !important;
                        line-height: 1.1 !important;
                    }

                    .print-ticket-card .card-footer-info {
                        font-size: 6px !important;
                        padding-top: 0.2rem !important;
                        margin-top: 0.2rem !important;
                    }

                    /* Zebra grid layout: responsive columns that auto-fit to 1 column on Zebra, 2 columns on Letter */
                    body.print-zebra-mode .print-zebra-grid {
                        display: grid !important;
                        grid-template-columns: repeat(auto-fit, minmax(2.7in, 1fr)) !important;
                        gap: 0.75rem !important;
                        width: 100% !important;
                        padding: 0.5rem !important;
                        box-sizing: border-box !important;
                    }

                    /* Zebra ticket styling for printing */
                    .print-zebra-card {
                        width: 2.7in !important;
                        height: 2.7in !important;
                        box-sizing: border-box !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        border: 1.5px solid #4b5563 !important;
                        border-radius: 0.5rem !important;
                    }

                    /* Ensure background colors and borders print correctly */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
            {confirmState && (
                <ConfirmDialog
                    isOpen={confirmState.isOpen}
                    title={confirmState.title}
                    description={confirmState.description}
                    variant={confirmState.variant}
                    confirmText={confirmState.confirmText}
                    onConfirm={() => {
                        confirmState.resolve(true);
                        setConfirmState(prev => prev ? { ...prev, isOpen: false } : null);
                    }}
                    onClose={() => {
                        confirmState.resolve(false);
                        setConfirmState(prev => prev ? { ...prev, isOpen: false } : null);
                    }}
                />
            )}

            <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
                <DialogContent className="sm:max-w-[425px] rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold text-gray-900">Decline Change Request</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Please provide a reason for declining this request. This will be sent directly to the tour company.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="reason" className="text-xs font-bold text-gray-700 uppercase tracking-wide">Reason for Decline</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., The requested changes cannot be accommodated for tomorrow's pickup schedule."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                                className="min-h-[100px] rounded-xl border-gray-200 focus-visible:ring-violet-600"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button 
                            type="button"
                            variant="ghost" 
                            className="rounded-xl font-bold text-gray-500"
                            onClick={() => { setDeclineDialogOpen(false); setDeclineReason(''); setSelectedRequest(null); }}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="button"
                            disabled={!declineReason.trim() || requestActionLoading !== null}
                            onClick={() => {
                                if (selectedRequest) {
                                    handleRequestDecision(selectedRequest.id, 'declined', declineReason);
                                }
                            }}
                            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-6 shadow-lg shadow-red-100"
                        >
                            {requestActionLoading ? 'Declining...' : 'Confirm Decline'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
