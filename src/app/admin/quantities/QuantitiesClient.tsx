'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Printer, ShoppingCart, X, FileText, CheckSquare, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDateTimeUS } from '@/lib/utils';
import { getQuantitiesOrders } from './actions';
import { toast } from 'sonner';

interface OrderItem {
    id: string;
    meal_name: string;
    quantity: number;
    box_type: string | null;
    bread_type: string | null;
    cookie_choice: string | null;
    customizations: string | null;
    guest_name?: string | null;
}

interface Order {
    id: string;
    tour_date: string;
    status: string;
    created_at: string;
    company_id: string | null;
    tour_companies?: { name: string; slug: string; prep_instructions?: string | null } | null;
    order_items: OrderItem[];
}

interface QuantitiesClientProps {
    initialOrders: Order[];
    companies: { id: string; name: string; prep_instructions?: string | null }[];
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

const STATUS_LABELS: Record<string, string> = {
    '': 'All Statuses',
    'pending': 'Pending',
    'fulfilled': 'Fulfilled',
    'cancelled': 'Cancelled',
};

export function QuantitiesClient({ initialOrders, companies }: QuantitiesClientProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders);
    const [dbLoading, setDbLoading] = useState(false);

    const handleQueryDatabase = async () => {
        setDbLoading(true);
        const result = await getQuantitiesOrders({
            dateFilterMode,
            startDate,
            endDate,
            companyId: companyFilter,
            status: statusFilter
        });
        if (result.success) {
            setOrders(result.orders);
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
        
        setDbLoading(true);
        const result = await getQuantitiesOrders({
            dateFilterMode,
            startDate: '',
            endDate: '',
            companyId: '',
            status: ''
        });
        if (result.success) {
            setOrders(result.orders);
        } else {
            toast.error(result.error || 'Failed to query database');
        }
        setDbLoading(false);
    };
    const [dateRange, setDateRange] = useState('today');
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [endDate, setEndDate] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    });
    const [dateFilterMode, setDateFilterMode] = useState<'tour' | 'order'>('tour');
    const [companyFilter, setCompanyFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [activeTab, setActiveTab] = useState<'smart' | 'summary'>('smart');
    const [smartPerspective, setSmartPerspective] = useState<'sandwich' | 'company'>('sandwich');
    const [expandedCompanies, setExpandedCompanies] = useState<Record<string, boolean>>({});
    const [activePrintMode, setActivePrintMode] = useState<'smart' | 'summary' | null>(null);

    useEffect(() => {
        if (activePrintMode) {
            // Use setTimeout to ensure DOM is updated with print mode classes before printing
            const timer = setTimeout(() => {
                window.print();
                setActivePrintMode(null);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [activePrintMode]);

    const handleDateRangeChange = (range: string) => {
        setDateRange(range);
        if (range !== 'custom') {
            const { start, end } = getPresetDates(range);
            setStartDate(start);
            setEndDate(end);
        }
    };

    const toggleSubElement = (primary: string, secondary: string) => {
        const key = `${primary}-${secondary}`;
        setExpandedCompanies(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleAllCompaniesForMeal = (mealName: string, companiesList: any[]) => {
        const keys = companiesList.map(co => `${mealName}-${co.companyName}`);
        const allExpanded = keys.every(k => expandedCompanies[k]);
        setExpandedCompanies(prev => {
            const next = { ...prev };
            keys.forEach(k => {
                if (!allExpanded) {
                    next[k] = true;
                } else {
                    delete next[k];
                }
            });
            return next;
        });
    };

    const toggleAllMealsForCompany = (companyName: string, mealsList: any[]) => {
        const keys = mealsList.map(meal => `${companyName}-${meal.mealName}`);
        const allExpanded = keys.every(k => expandedCompanies[k]);
        setExpandedCompanies(prev => {
            const next = { ...prev };
            keys.forEach(k => {
                if (!allExpanded) {
                    next[k] = true;
                } else {
                    delete next[k];
                }
            });
            return next;
        });
    };

    const filteredOrders = orders;

    // 1. Standard Aggregation (Original Logic)
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

    // 2. Smart Prep Sheet Aggregation (Hierarchical group: meal -> company -> customized lunches)
    interface SmartLunchItem {
        id: string;
        quantity: number;
        boxType: string | null;
        breadType: string | null;
        cookieChoice: string | null;
        customizations: string | null;
    }

    interface SmartCompanyGroup {
        companyName: string;
        prepInstructions?: string | null;
        totalQty: number;
        lunches: SmartLunchItem[];
    }

    interface SmartMealGroup {
        mealName: string;
        totalQty: number;
        boxTypes: {
            standard: number;
            junior: number;
            sandwichOnly: number;
        };
        companies: SmartCompanyGroup[];
    }

    const smartPrepMap: Record<string, SmartMealGroup> = {};

    filteredOrders.forEach(order => {
        const companyName = order.tour_companies?.name || 
                            companies.find(c => c.id === order.company_id)?.name || 
                            'Direct Customer';

        order.order_items?.forEach(item => {
            const mealName = item.meal_name;
            if (!mealName) return;

            const qty = item.quantity || 0;
            if (qty <= 0) return;

            const box = (item.box_type || '').toLowerCase();
            const isJunior = box.includes('junior');
            const isSandwich = box.includes('sandwich');
            const isStandard = !isJunior && !isSandwich && box.length > 0 && box !== 'no box' && box !== 'none';

            // 1. Initialize meal group
            if (!smartPrepMap[mealName]) {
                smartPrepMap[mealName] = {
                    mealName,
                    totalQty: 0,
                    boxTypes: { standard: 0, junior: 0, sandwichOnly: 0 },
                    companies: []
                };
            }

            const mealGroup = smartPrepMap[mealName];
            mealGroup.totalQty += qty;

            if (isJunior) {
                mealGroup.boxTypes.junior += qty;
            } else if (isSandwich) {
                mealGroup.boxTypes.sandwichOnly += qty;
            } else if (isStandard) {
                mealGroup.boxTypes.standard += qty;
            }

            // 2. Find or create company group within this meal
            let companyGroup = mealGroup.companies.find(c => c.companyName === companyName);
            if (!companyGroup) {
                const matchedCompany = order.company_id 
                    ? companies.find(c => c.id === order.company_id)
                    : companies.find(c => c.name === companyName);
                companyGroup = {
                    companyName,
                    prepInstructions: matchedCompany?.prep_instructions || order.tour_companies?.prep_instructions || null,
                    totalQty: 0,
                    lunches: []
                };
                mealGroup.companies.push(companyGroup);
            }

            companyGroup.totalQty += qty;

            // 3. Find if there's already an identical lunch in this company group (excluding guest name)
            const existingLunch = companyGroup.lunches.find(l => 
                (l.boxType || '').toLowerCase() === (item.box_type || '').toLowerCase() &&
                (l.breadType || '').toLowerCase() === (item.bread_type || '').toLowerCase() &&
                (l.customizations || '').toLowerCase().trim() === (item.customizations || '').toLowerCase().trim()
            );

            if (existingLunch) {
                existingLunch.quantity += qty;
            } else {
                companyGroup.lunches.push({
                    id: item.id,
                    quantity: qty,
                    boxType: item.box_type,
                    breadType: item.bread_type,
                    cookieChoice: null,
                    customizations: item.customizations
                });
            }
        });
    });

    const smartPrepList = Object.values(smartPrepMap)
        .map(meal => {
            // Sort companies by quantity (highest first)
            meal.companies.sort((a, b) => b.totalQty - a.totalQty);
            return meal;
        })
        .sort((a, b) => a.mealName.localeCompare(b.mealName));

    // 3. Tour Company Perspective Aggregation (Hierarchical group: company -> meal -> customized lunches)
    interface SmartCompanyMealGroup {
        mealName: string;
        totalQty: number;
        boxTypes: {
            standard: number;
            junior: number;
            sandwichOnly: number;
        };
        lunches: SmartLunchItem[];
    }

    interface SmartCompanyPerspectiveGroup {
        companyName: string;
        prepInstructions?: string | null;
        totalQty: number;
        meals: SmartCompanyMealGroup[];
    }

    const companyPrepMap: Record<string, SmartCompanyPerspectiveGroup> = {};

    filteredOrders.forEach(order => {
        const companyName = order.tour_companies?.name || 
                            companies.find(c => c.id === order.company_id)?.name || 
                            'Direct Customer';

        order.order_items?.forEach(item => {
            const mealName = item.meal_name;
            if (!mealName) return;

            const qty = item.quantity || 0;
            if (qty <= 0) return;

            const box = (item.box_type || '').toLowerCase();
            const isJunior = box.includes('junior');
            const isSandwich = box.includes('sandwich');
            const isStandard = !isJunior && !isSandwich && box.length > 0 && box !== 'no box' && box !== 'none';

            // Initialize company group
            if (!companyPrepMap[companyName]) {
                const matchedCompany = order.company_id 
                    ? companies.find(c => c.id === order.company_id)
                    : companies.find(c => c.name === companyName);
                companyPrepMap[companyName] = {
                    companyName,
                    prepInstructions: matchedCompany?.prep_instructions || order.tour_companies?.prep_instructions || null,
                    totalQty: 0,
                    meals: []
                };
            }

            const companyGroup = companyPrepMap[companyName];
            companyGroup.totalQty += qty;

            // Find or create meal group within this company
            let mealGroup = companyGroup.meals.find(m => m.mealName === mealName);
            if (!mealGroup) {
                mealGroup = {
                    mealName,
                    totalQty: 0,
                    boxTypes: { standard: 0, junior: 0, sandwichOnly: 0 },
                    lunches: []
                };
                companyGroup.meals.push(mealGroup);
            }

            mealGroup.totalQty += qty;

            if (isJunior) {
                mealGroup.boxTypes.junior += qty;
            } else if (isSandwich) {
                mealGroup.boxTypes.sandwichOnly += qty;
            } else if (isStandard) {
                mealGroup.boxTypes.standard += qty;
            }

            // Find if there's already an identical lunch in this meal group (excluding guest name)
            const existingLunch = mealGroup.lunches.find(l => 
                (l.boxType || '').toLowerCase() === (item.box_type || '').toLowerCase() &&
                (l.breadType || '').toLowerCase() === (item.bread_type || '').toLowerCase() &&
                (l.customizations || '').toLowerCase().trim() === (item.customizations || '').toLowerCase().trim()
            );

            if (existingLunch) {
                existingLunch.quantity += qty;
            } else {
                mealGroup.lunches.push({
                    id: item.id,
                    quantity: qty,
                    boxType: item.box_type,
                    breadType: item.bread_type,
                    cookieChoice: null,
                    customizations: item.customizations
                });
            }
        });
    });

    const companyPrepList = Object.values(companyPrepMap)
        .map(company => {
            // Sort meals within the company by name
            company.meals.sort((a, b) => a.mealName.localeCompare(b.mealName));
            return company;
        })
        .sort((a, b) => a.companyName.localeCompare(b.companyName));

    const hasFilters = !!(dateRange || companyFilter || statusFilter || startDate || endDate);

    return (
        <>
            <div className="space-y-6 dashboard-web-view no-print">
                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Prep Quantities</h1>
                        <p className="text-sm text-gray-500 mt-1">Generate kitchen prep sheets and totals for any date range.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            className="gap-2 h-11 px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold shadow-sm" 
                            onClick={() => setActivePrintMode('smart')}
                        >
                            <Printer className="size-4 text-violet-600" /> Print Smart Prep Sheet
                        </Button>
                        <Button 
                            variant="outline" 
                            className="gap-2 h-11 px-4 rounded-xl border-gray-200 hover:border-violet-200 hover:bg-violet-50 transition-all font-bold shadow-sm" 
                            onClick={() => setActivePrintMode('summary')}
                        >
                            <Printer className="size-4 text-violet-600" /> Print Standard Totals
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card className="rounded-2xl border-gray-100 shadow-sm mb-6 bg-white">
                    <CardContent className="p-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-xl border border-gray-200 shadow-inner">
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setDateFilterMode('tour')}
                                className={`h-8 rounded-lg px-3 text-[11px] font-bold uppercase tracking-wider transition-all ${
                                    dateFilterMode === 'tour' 
                                        ? 'bg-white text-violet-600 shadow-sm border border-gray-200/50' 
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
                                        ? 'bg-white text-violet-600 shadow-sm border border-gray-200/50' 
                                        : 'text-gray-400 hover:text-gray-600'
                                    }`}
                            >
                                Order Date
                            </Button>
                        </div>

                        <Select value={dateRange} onValueChange={(v) => handleDateRangeChange(v || '')}>
                            <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm bg-white">
                                <SelectValue placeholder="All Dates">
                                    {DATE_RANGE_LABELS[dateRange] || dateRange}
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
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-2 bg-gray-50/50 p-1 rounded-xl border border-gray-200">
                            <Input 
                                type="date" 
                                value={startDate} 
                                onChange={e => {
                                    setStartDate(e.target.value);
                                    setDateRange('custom');
                                }}
                                className="w-[150px] h-8 rounded-lg border-0 bg-transparent text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0" 
                            />
                            <span className="text-gray-400 text-xs font-semibold">to</span>
                            <Input 
                                type="date" 
                                value={endDate} 
                                onChange={e => {
                                    setEndDate(e.target.value);
                                    setDateRange('custom');
                                }}
                                className="w-[150px] h-8 rounded-lg border-0 bg-transparent text-sm font-semibold focus-visible:ring-0 focus-visible:ring-offset-0" 
                            />
                        </div>

                        <Select value={companyFilter} onValueChange={(v) => setCompanyFilter(v || '')}>
                            <SelectTrigger className="w-[180px] h-10 rounded-xl border-gray-200 font-semibold text-sm bg-white">
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
                            <SelectTrigger className="w-[160px] h-10 rounded-xl border-gray-200 font-semibold text-sm bg-white">
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

                        <Button 
                            onClick={handleQueryDatabase} 
                            disabled={dbLoading}
                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl h-10 px-5 font-bold text-sm transition-all flex items-center gap-2"
                        >
                            {dbLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {dbLoading ? 'Searching...' : 'Search'}
                        </Button>

                        {hasFilters && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={handleClearFilters}
                                disabled={dbLoading}
                                className="gap-2 text-xs font-bold h-10 px-4 text-gray-400 hover:text-rose-600 transition-colors"
                            >
                                <X className="size-3.5" /> Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Main Tabs selection */}
                <div className="flex border-b border-gray-200 gap-2 mb-6 bg-white/50 p-1 rounded-xl border shadow-sm max-w-md">
                    <button
                        onClick={() => setActiveTab('smart')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'smart'
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                    >
                        <CheckSquare className="size-4" /> Smart Prep Sheet
                    </button>
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                            activeTab === 'summary'
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
                        }`}
                    >
                        <FileText className="size-4" /> Standard Totals
                    </button>
                </div>

                {/* Sub-toggles for Smart Prep Sheet perspective */}
                {activeTab === 'smart' && (
                    <div className="space-y-6 mb-8">
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200 w-fit">
                            <span className="text-xs font-bold text-gray-400 px-2 uppercase tracking-wider">Group By:</span>
                            <button
                                onClick={() => setSmartPerspective('sandwich')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    smartPerspective === 'sandwich'
                                        ? 'bg-white text-violet-600 shadow-sm border border-gray-200/50 font-extrabold'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                🥪 Sandwich Name
                            </button>
                            <button
                                onClick={() => setSmartPerspective('company')}
                                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                                    smartPerspective === 'company'
                                        ? 'bg-white text-violet-600 shadow-sm border border-gray-200/50 font-extrabold'
                                        : 'text-gray-500 hover:text-gray-800'
                                }`}
                            >
                                🏢 Tour Company
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 pl-1">
                            {smartPerspective === 'sandwich' 
                                ? 'Showing main cards for each sandwich type. Expand a tour company inside a card to see their customized lunches.' 
                                : 'Showing main cards for each tour company. Expand a sandwich type inside a card to see their customized lunches.'}
                        </p>
                    </div>
                )}

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
                    <div className="space-y-6">
                        {/* TAB 1: Smart Prep Sheet */}
                        {activeTab === 'smart' && (
                            <>
                                {/* Perspective A: Group by Sandwich */}
                                {smartPerspective === 'sandwich' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {smartPrepList.length > 0 ? (
                                            smartPrepList.map((item, idx) => (
                                                <Card key={idx} className="rounded-2xl border-gray-100 shadow-md shadow-gray-100/50 overflow-hidden bg-white hover:shadow-lg transition-all border border-gray-100/80">
                                                    {/* Card Header */}
                                                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-lg font-black text-gray-900 tracking-tight">{item.mealName}</h3>
                                                            <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                                                                {item.boxTypes.standard > 0 && `${item.boxTypes.standard} Standard`}
                                                                {item.boxTypes.standard > 0 && (item.boxTypes.junior > 0 || item.boxTypes.sandwichOnly > 0) && ' · '}
                                                                {item.boxTypes.junior > 0 && `${item.boxTypes.junior} Junior`}
                                                                {(item.boxTypes.standard > 0 || item.boxTypes.junior > 0) && item.boxTypes.sandwichOnly > 0 && ' · '}
                                                                {item.boxTypes.sandwichOnly > 0 && `${item.boxTypes.sandwichOnly} Sandwich Only`}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                                                title="Expand/Collapse All"
                                                                onClick={() => toggleAllCompaniesForMeal(item.mealName, item.companies)}
                                                            >
                                                                {item.companies.every(co => !!expandedCompanies[`${item.mealName}-${co.companyName}`]) ? (
                                                                    <ChevronUp className="size-5" />
                                                                ) : (
                                                                    <ChevronDown className="size-5" />
                                                                )}
                                                            </Button>
                                                            <div className="size-11 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-violet-200">
                                                                {item.totalQty}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Body: Collapsible Tour Company list */}
                                                    <div className="p-4 space-y-3">
                                                        {item.companies.map((co, coIdx) => {
                                                            const isExpanded = !!expandedCompanies[`${item.mealName}-${co.companyName}`];
                                                            return (
                                                                <div key={coIdx} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                                                    {/* Tour Company row header */}
                                                                    <button
                                                                        onClick={() => toggleSubElement(item.mealName, co.companyName)}
                                                                        className="w-full flex items-center justify-between p-3.5 hover:bg-violet-50/40 transition-colors text-left bg-white"
                                                                    >
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <span className="font-bold text-sm text-gray-800">
                                                                                {co.companyName}
                                                                            </span>
                                                                            {co.prepInstructions && (
                                                                                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                                                                                    <span>📝 Prep Notes</span>
                                                                                </span>
                                                                            )}
                                                                            <span className="bg-violet-100 text-violet-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                                                {co.totalQty} lunch{co.totalQty > 1 ? 'es' : ''}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-gray-400">
                                                                            {isExpanded ? <ChevronUp className="size-4 text-violet-600" /> : <ChevronDown className="size-4" />}
                                                                        </div>
                                                                    </button>

                                                                    {/* Expandable customized orders */}
                                                                    {isExpanded && (
                                                                        <div className="p-3 bg-white border-t border-gray-100 space-y-2 max-h-96 overflow-y-auto">
                                                                            {co.prepInstructions && (
                                                                                <div className="mb-3 p-3 rounded-lg bg-amber-50/40 border border-amber-100/60 text-xs text-amber-800 flex items-start gap-1.5 leading-relaxed">
                                                                                    <span className="font-bold shrink-0">📌 Prep Notes:</span>
                                                                                    <span className="whitespace-pre-wrap">{co.prepInstructions}</span>
                                                                                </div>
                                                                            )}
                                                                            {co.lunches.map((lunch, lIdx) => (
                                                                                <div key={lIdx} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 text-xs text-gray-700 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                                                                                    <div className="w-full">
                                                                                        <div className="flex items-center flex-wrap gap-2">
                                                                                            <span className="font-black text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded text-[10px] border border-violet-100">
                                                                                                {lunch.quantity}x
                                                                                            </span>
                                                                                            <span className="text-gray-400 font-semibold text-[10px] uppercase mr-1">
                                                                                                {lunch.boxType || 'No Box'}
                                                                                            </span>
                                                                                            {/* Bread Choice */}
                                                                                            {lunch.breadType && !['sandwich', 'none', 'no bread', 'standard'].includes(lunch.breadType.toLowerCase()) && (
                                                                                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100/70 text-[10px] font-bold">
                                                                                                    🍞 {lunch.breadType === 'gluten-free' || lunch.breadType === 'gf' ? 'Gluten-Free' : lunch.breadType}
                                                                                                </span>
                                                                                            )}
                                                                                            {/* Customizations */}
                                                                                            {lunch.customizations && (
                                                                                                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100/70 text-[10px] font-bold italic">
                                                                                                    ⚠️ {lunch.customizations}
                                                                                                </span>
                                                                                            )}
                                                                                            {/* Standard notice if nothing custom */}
                                                                                            {!lunch.customizations && 
                                                                                             (!lunch.breadType || ['sandwich', 'none', 'no bread', 'standard'].includes(lunch.breadType.toLowerCase())) && (
                                                                                                <span className="text-[10px] text-gray-400 italic font-medium">Standard preparation</span>
                                                                                             )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {(() => {
                                                        const breadCounts: Record<string, number> = {};
                                                        item.companies.forEach(co => {
                                                            co.lunches.forEach(lunch => {
                                                                const rawBread = lunch.breadType;
                                                                const isStandard = !rawBread || ['sandwich', 'none', 'no bread', 'standard'].includes(rawBread.toLowerCase());
                                                                const displayBread = isStandard 
                                                                    ? 'Standard' 
                                                                    : (rawBread === 'gluten-free' || rawBread === 'gf' ? 'Gluten-Free' : rawBread);
                                                                breadCounts[displayBread] = (breadCounts[displayBread] || 0) + lunch.quantity;
                                                            });
                                                        });
                                                        return (
                                                            <div className="px-5 py-3.5 bg-violet-50/30 border-t border-violet-100/50 flex flex-col gap-2.5 text-xs rounded-b-2xl">
                                                                <span className="font-extrabold uppercase text-[10px] tracking-wider text-violet-800 text-left">Bread Prep Totals</span>
                                                                <div className="flex flex-wrap gap-2 justify-start">
                                                                    {Object.entries(breadCounts).map(([bread, count], bIdx) => (
                                                                        <span key={bIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-violet-100 text-violet-800 font-bold shadow-sm shadow-violet-100/50 text-[10px]">
                                                                            <span className="text-gray-500 font-medium">{bread}:</span>
                                                                            <span className="font-black text-violet-700">{count}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center text-gray-400 font-semibold">
                                                No customized sandwiches found for this selection.
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Perspective B: Group by Tour Company */}
                                {smartPerspective === 'company' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {companyPrepList.length > 0 ? (
                                            companyPrepList.map((company, idx) => (
                                                <Card key={idx} className="rounded-2xl border-gray-100 shadow-md shadow-gray-100/50 overflow-hidden bg-white hover:shadow-lg transition-all border border-gray-100/80">
                                                    {/* Card Header */}
                                                    <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white flex justify-between items-center">
                                                        <div>
                                                            <h3 className="text-lg font-black text-gray-900 tracking-tight">{company.companyName}</h3>
                                                            <p className="text-[11px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                                                                {company.meals.length} meal type{company.meals.length > 1 ? 's' : ''} ordered
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                                                title="Expand/Collapse All"
                                                                onClick={() => toggleAllMealsForCompany(company.companyName, company.meals)}
                                                            >
                                                                {company.meals.every(meal => !!expandedCompanies[`${company.companyName}-${meal.mealName}`]) ? (
                                                                    <ChevronUp className="size-5" />
                                                                ) : (
                                                                    <ChevronDown className="size-5" />
                                                                )}
                                                            </Button>
                                                            <div className="size-11 rounded-full bg-violet-600 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-violet-200">
                                                                {company.totalQty}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Prep Instructions Banner */}
                                                    {company.prepInstructions && (
                                                        <div className="px-5 py-3.5 bg-amber-50/50 border-b border-amber-100/60 text-xs text-amber-900 flex items-start gap-2 leading-relaxed">
                                                            <span className="text-base shrink-0 mt-0.5">📝</span>
                                                            <div className="space-y-1">
                                                                <p className="font-extrabold uppercase text-[9px] tracking-wider text-amber-800">Private Prep Instructions</p>
                                                                <p className="whitespace-pre-wrap">{company.prepInstructions}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Card Body: Collapsible Sandwich list */}
                                                    <div className="p-4 space-y-3">
                                                        {company.meals.map((meal, mIdx) => {
                                                            const isExpanded = !!expandedCompanies[`${company.companyName}-${meal.mealName}`];
                                                            return (
                                                                <div key={mIdx} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50/30">
                                                                    {/* Meal row header */}
                                                                    <button
                                                                        onClick={() => toggleSubElement(company.companyName, meal.mealName)}
                                                                        className="w-full flex items-center justify-between p-3.5 hover:bg-violet-50/40 transition-colors text-left bg-white"
                                                                    >
                                                                        <div className="flex items-center gap-2 flex-1">
                                                                            <span className="font-bold text-sm text-gray-800">
                                                                                {meal.mealName}
                                                                            </span>
                                                                            <span className="bg-violet-100 text-violet-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                                                                                {meal.totalQty} lunch{meal.totalQty > 1 ? 'es' : ''}
                                                                            </span>
                                                                        </div>
                                                                        <div className="text-gray-400">
                                                                            {isExpanded ? <ChevronUp className="size-4 text-violet-600" /> : <ChevronDown className="size-4" />}
                                                                        </div>
                                                                    </button>

                                                                    {/* Expandable customized orders */}
                                                                    {isExpanded && (
                                                                        <div className="p-3 bg-white border-t border-gray-100 space-y-2 max-h-96 overflow-y-auto">
                                                                            {meal.lunches.map((lunch, lIdx) => (
                                                                                <div key={lIdx} className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 text-xs text-gray-700 hover:bg-gray-50/50 px-2 rounded-lg transition-colors">
                                                                                    <div className="w-full">
                                                                                        <div className="flex items-center flex-wrap gap-2">
                                                                                            <span className="font-black text-violet-700 bg-violet-50 px-1.5 py-0.5 rounded text-[10px] border border-violet-100">
                                                                                                {lunch.quantity}x
                                                                                            </span>
                                                                                            <span className="text-gray-400 font-semibold text-[10px] uppercase mr-1">
                                                                                                {lunch.boxType || 'No Box'}
                                                                                            </span>
                                                                                            {/* Bread Choice */}
                                                                                            {lunch.breadType && !['sandwich', 'none', 'no bread', 'standard'].includes(lunch.breadType.toLowerCase()) && (
                                                                                                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100/70 text-[10px] font-bold">
                                                                                                    🍞 {lunch.breadType === 'gluten-free' || lunch.breadType === 'gf' ? 'Gluten-Free' : lunch.breadType}
                                                                                                </span>
                                                                                            )}
                                                                                            {/* Customizations */}
                                                                                            {lunch.customizations && (
                                                                                                <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-100/70 text-[10px] font-bold italic">
                                                                                                    ⚠️ {lunch.customizations}
                                                                                                </span>
                                                                                            )}
                                                                                            {/* Standard notice if nothing custom */}
                                                                                            {!lunch.customizations && 
                                                                                             (!lunch.breadType || ['sandwich', 'none', 'no bread', 'standard'].includes(lunch.breadType.toLowerCase())) && (
                                                                                                <span className="text-[10px] text-gray-400 italic font-medium">Standard preparation</span>
                                                                                             )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {(() => {
                                                        const breadCounts: Record<string, number> = {};
                                                        company.meals.forEach(meal => {
                                                            meal.lunches.forEach(lunch => {
                                                                const rawBread = lunch.breadType;
                                                                const isStandard = !rawBread || ['sandwich', 'none', 'no bread', 'standard'].includes(rawBread.toLowerCase());
                                                                const displayBread = isStandard 
                                                                    ? 'Standard' 
                                                                    : (rawBread === 'gluten-free' || rawBread === 'gf' ? 'Gluten-Free' : rawBread);
                                                                breadCounts[displayBread] = (breadCounts[displayBread] || 0) + lunch.quantity;
                                                            });
                                                        });
                                                        return (
                                                            <div className="px-5 py-3.5 bg-violet-50/30 border-t border-violet-100/50 flex flex-col gap-2.5 text-xs rounded-b-2xl">
                                                                <span className="font-extrabold uppercase text-[10px] tracking-wider text-violet-800 text-left">Bread Prep Totals</span>
                                                                <div className="flex flex-wrap gap-2 justify-start">
                                                                    {Object.entries(breadCounts).map(([bread, count], bIdx) => (
                                                                        <span key={bIdx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-violet-100 text-violet-800 font-bold shadow-sm shadow-violet-100/50 text-[10px]">
                                                                            <span className="text-gray-500 font-medium">{bread}:</span>
                                                                            <span className="font-black text-violet-700">{count}</span>
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center text-gray-400 font-semibold">
                                                No customized lunches found for this selection.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                        {activeTab === 'smart' && aggregatedCookies.length > 0 && (
                            <div className="mt-8 max-w-4xl">
                                <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden bg-white">
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
                                                    <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Total</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {aggregatedCookies.map((item, i) => (
                                                    <TableRow key={i} className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0 transition-colors">
                                                        <TableCell className="font-semibold text-sm text-amber-700 py-2.5 pl-6">{item.name}</TableCell>
                                                        <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.junior}</TableCell>
                                                        <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.standard}</TableCell>
                                                        <TableCell className="py-2.5 text-center font-bold text-violet-700 w-36">{item.junior + item.standard}</TableCell>
                                                    </TableRow>
                                                ))}
                                                <TableRow className="bg-violet-50/50 border-t-2 border-violet-200">
                                                    <TableCell className="font-black text-gray-900 pl-6 py-3">TOTAL</TableCell>
                                                    <TableCell className="py-3 text-center font-black text-violet-600 text-base">{cookiesJuniorTotal}</TableCell>
                                                    <TableCell className="py-3 text-center font-black text-violet-600 text-base">{cookiesStandardTotal}</TableCell>
                                                    <TableCell className="py-3 text-center font-black text-violet-600 text-base w-36">{cookiesJuniorTotal + cookiesStandardTotal}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </div>
                                </Card>
                            </div>
                        )}

                        {/* TAB 2: Summary View (Original Tables) */}
                        {activeTab === 'summary' && (
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
                                                        <TableHead className="font-bold text-gray-900 py-3 text-center w-36">Total</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {aggregatedCookies.map((item, i) => (
                                                        <TableRow key={i} className="hover:bg-gray-50/50 border-b border-gray-100 last:border-0 transition-colors">
                                                            <TableCell className="font-semibold text-sm text-amber-700 py-2.5 pl-6">{item.name}</TableCell>
                                                            <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.junior}</TableCell>
                                                            <TableCell className="py-2.5 text-center text-gray-600 font-semibold">{item.standard}</TableCell>
                                                            <TableCell className="py-2.5 text-center font-bold text-violet-700 w-36">{item.junior + item.standard}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                    <TableRow className="bg-violet-50/50 border-t-2 border-violet-200">
                                                        <TableCell className="font-black text-gray-900 pl-6 py-3">TOTAL</TableCell>
                                                        <TableCell className="py-3 text-center font-black text-violet-600 text-base">{cookiesJuniorTotal}</TableCell>
                                                        <TableCell className="py-3 text-center font-black text-violet-600 text-base">{cookiesStandardTotal}</TableCell>
                                                        <TableCell className="py-3 text-center font-black text-violet-600 text-base w-36">{cookiesJuniorTotal + cookiesStandardTotal}</TableCell>
                                                    </TableRow>
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Print View (Hidden on Screen) */}
            <div className="print-only-section print-prep-report">
                <div className="p-8">
                    <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Kitchen Prep Report</h1>
                            <p className="text-sm font-bold text-gray-600">Mountain Mama's Café · Prep & Customization Sheet</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Printed On</p>
                            <p className="text-sm font-bold" suppressHydrationWarning>
                                {formatDateTimeUS(new Date())}
                            </p>
                        </div>
                    </div>

                    {/* Filter Summary for Context */}
                    <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md flex flex-wrap gap-x-6 gap-y-1">
                        <div>
                            <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider">Date Mode</span>
                            <span className="font-semibold uppercase text-xs">{dateFilterMode} Date</span>
                        </div>
                        <div>
                            <span className="text-[9px] font-bold uppercase text-gray-500 block tracking-wider">Range</span>
                            <span className="font-semibold text-xs">
                                {dateRange === 'custom' 
                                    ? `${startDate || 'Start'} to ${endDate || 'End'}` 
                                    : (DATE_RANGE_LABELS[dateRange] || dateRange)}
                            </span>
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

                    {/* SECTION 1: Standard Totals Summary Table */}
                    {(activePrintMode === null || activePrintMode === 'summary') && (
                        <div className="mb-8 print-section">
                            <h2 className="text-md font-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-200 text-gray-800">
                                1. Summary Totals
                            </h2>
                            {aggregatedMeals.length > 0 && (
                                <table className="w-full border-collapse text-sm mb-6">
                                    <thead>
                                        <tr className="bg-gray-100 text-black">
                                            <th className="p-1.5 px-3 text-left font-bold border-b-2 border-gray-300">Sandwich / Salad</th>
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
                                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                                            <td className="p-2 px-3 text-left uppercase text-xs">Total Sandwiches</td>
                                            <td className="p-2 px-3 text-center text-sm">{mealsJuniorTotal}</td>
                                            <td className="p-2 px-3 text-center text-sm">{mealsStandardTotal}</td>
                                            <td className="p-2 px-3 text-center text-sm">{mealsSandwichTotal}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}

                            {aggregatedCookies.length > 0 && (
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-100 text-black">
                                            <th className="p-1.5 px-3 text-left font-bold border-b-2 border-gray-300">House-made Cookie</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Junior Box</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Standard Box</th>
                                            <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aggregatedCookies.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-200">
                                                <td className="p-1.5 px-3 text-left font-semibold text-amber-900">{item.name}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.junior}</td>
                                                <td className="p-1.5 px-3 text-center font-semibold">{item.standard}</td>
                                                <td className="p-1.5 px-3 text-center font-bold text-black w-28">{item.junior + item.standard}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                                            <td className="p-2 px-3 text-left uppercase text-xs">Total Cookies</td>
                                            <td className="p-2 px-3 text-center text-sm">{cookiesJuniorTotal}</td>
                                            <td className="p-2 px-3 text-center text-sm">{cookiesStandardTotal}</td>
                                            <td className="p-2 px-3 text-center text-sm w-28">{cookiesJuniorTotal + cookiesStandardTotal}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            )}
                        </div>
                    )}

                    {activePrintMode === null && (
                        <div className="print-page-break" style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>
                    )}

                    {/* SECTION 2: Detailed Smart Prep Breakdown */}
                    {(activePrintMode === null || activePrintMode === 'smart') && (
                        <div className="print-section">
                            <h2 className="text-md font-black uppercase tracking-wider mb-4 pb-1 border-b border-gray-200 text-gray-800">
                                2. Smart Prep Sheet ({smartPerspective === 'sandwich' ? 'Customizations by Sandwich' : 'Customizations by Tour Company'})
                            </h2>
                            
                            {smartPerspective === 'sandwich' ? (
                                <div className="grid grid-cols-2 gap-4">
                                    {smartPrepList.map((item, idx) => (
                                        <div 
                                            key={idx} 
                                            className="border border-gray-300 rounded-lg p-4 bg-white print-card"
                                            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                                        >
                                            <div className="flex justify-between items-start border-b border-gray-200 pb-2 mb-3">
                                                <div>
                                                    <h3 className="text-sm font-black text-black uppercase tracking-tight">{item.mealName}</h3>
                                                    <p className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">
                                                        {item.boxTypes.standard > 0 && `${item.boxTypes.standard} Std`}
                                                        {item.boxTypes.standard > 0 && (item.boxTypes.junior > 0 || item.boxTypes.sandwichOnly > 0) && ' · '}
                                                        {item.boxTypes.junior > 0 && `${item.boxTypes.junior} Jr`}
                                                        {(item.boxTypes.standard > 0 || item.boxTypes.junior > 0) && item.boxTypes.sandwichOnly > 0 && ' · '}
                                                        {item.boxTypes.sandwichOnly > 0 && `${item.boxTypes.sandwichOnly} Only`}
                                                    </p>
                                                </div>
                                                <div className="bg-black text-white px-2 py-0.5 text-xs font-black rounded">
                                                    QTY: {item.totalQty}
                                                </div>
                                            </div>

                                            {/* List Companies & their Lunches (expanded completely for print) */}
                                            <div className="space-y-4">
                                                {item.companies.map((co, coIdx) => (
                                                    <div key={coIdx} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-black text-black bg-gray-50 px-2 py-1 border border-gray-200 rounded">
                                                            <span>{co.companyName}</span>
                                                            <span>({co.totalQty} lunch{co.totalQty > 1 ? 'es' : ''})</span>
                                                        </div>
                                                        <ul className="text-xs pl-2 space-y-1">
                                                            {co.lunches.map((lunch, lIdx) => {
                                                                const hasCustomBread = lunch.breadType && !['sandwich', 'none', 'no bread', 'standard'].includes(lunch.breadType.toLowerCase());
                                                                const hasCustomization = !!lunch.customizations;
                                                                
                                                                return (
                                                                    <li key={lIdx} className="border-b border-gray-100 py-1 last:border-0">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="font-bold">{lunch.quantity}x</span>
                                                                            <span className="text-[10px] text-gray-400">({lunch.boxType || 'No Box'})</span>
                                                                            
                                                                            {hasCustomBread && (
                                                                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded px-1">
                                                                                    🍞 {lunch.breadType === 'gluten-free' || lunch.breadType === 'gf' ? 'Gluten-Free' : lunch.breadType}
                                                                                </span>
                                                                            )}
                                                                            {hasCustomization && (
                                                                                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-100 rounded px-1 italic">
                                                                                    ⚠️ {lunch.customizations}
                                                                                </span>
                                                                            )}
                                                                            {!hasCustomBread && !hasCustomization && (
                                                                                <span className="text-[10px] text-gray-400 italic">Standard</span>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                            {(() => {
                                                const breadCounts: Record<string, number> = {};
                                                item.companies.forEach(co => {
                                                    co.lunches.forEach(lunch => {
                                                        const rawBread = lunch.breadType;
                                                        const isStandard = !rawBread || ['sandwich', 'none', 'no bread', 'standard'].includes(rawBread.toLowerCase());
                                                        const displayBread = isStandard 
                                                            ? 'Standard' 
                                                            : (rawBread === 'gluten-free' || rawBread === 'gf' ? 'Gluten-Free' : rawBread);
                                                        breadCounts[displayBread] = (breadCounts[displayBread] || 0) + lunch.quantity;
                                                    });
                                                });
                                                return (
                                                    <div className="mt-3 pt-2 border-t border-gray-200 flex flex-col gap-1.5 text-[10px] text-gray-700 font-bold">
                                                        <span className="uppercase tracking-wider text-gray-400 text-left">Bread Prep Totals</span>
                                                        <div className="flex flex-wrap gap-3 justify-start">
                                                            {Object.entries(breadCounts).map(([bread, count], bIdx) => (
                                                                <span key={bIdx} className="font-black text-black">
                                                                    {bread}: {count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    {companyPrepList.map((company, idx) => (
                                        <div 
                                            key={idx} 
                                            className="border border-gray-300 rounded-lg p-4 bg-white print-card"
                                            style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                                        >
                                            <div className="flex justify-between items-start border-b border-gray-200 pb-2 mb-3">
                                                <div>
                                                    <h3 className="text-sm font-black text-black uppercase tracking-tight">{company.companyName}</h3>
                                                </div>
                                                <div className="bg-black text-white px-2 py-0.5 text-xs font-black rounded">
                                                    TOTAL: {company.totalQty}
                                                </div>
                                            </div>

                                            {/* List Meals & their Lunches (expanded completely for print) */}
                                            <div className="space-y-4">
                                                {company.meals.map((meal, mIdx) => (
                                                    <div key={mIdx} className="space-y-1">
                                                        <div className="flex justify-between text-xs font-black text-black bg-gray-50 px-2 py-1 border border-gray-200 rounded">
                                                            <span>{meal.mealName}</span>
                                                            <span>({meal.totalQty} lunch{meal.totalQty > 1 ? 'es' : ''})</span>
                                                        </div>
                                                        <ul className="text-xs pl-2 space-y-1">
                                                            {meal.lunches.map((lunch, lIdx) => {
                                                                const hasCustomBread = lunch.breadType && !['sandwich', 'none', 'no bread', 'standard'].includes(lunch.breadType.toLowerCase());
                                                                const hasCustomization = !!lunch.customizations;
                                                                
                                                                return (
                                                                    <li key={lIdx} className="border-b border-gray-100 py-1 last:border-0">
                                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                                            <span className="font-bold">{lunch.quantity}x</span>
                                                                            <span className="text-[10px] text-gray-400">({lunch.boxType || 'No Box'})</span>
                                                                            
                                                                            {hasCustomBread && (
                                                                                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-100 rounded px-1">
                                                                                    🍞 {lunch.breadType === 'gluten-free' || lunch.breadType === 'gf' ? 'Gluten-Free' : lunch.breadType}
                                                                                </span>
                                                                            )}
                                                                            {hasCustomization && (
                                                                                <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-100 rounded px-1 italic">
                                                                                    ⚠️ {lunch.customizations}
                                                                                </span>
                                                                            )}
                                                                            {!hasCustomBread && !hasCustomization && (
                                                                                <span className="text-[10px] text-gray-400 italic">Standard</span>
                                                                            )}
                                                                        </div>
                                                                    </li>
                                                                );
                                                            })}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                            {(() => {
                                                const breadCounts: Record<string, number> = {};
                                                company.meals.forEach(meal => {
                                                    meal.lunches.forEach(lunch => {
                                                        const rawBread = lunch.breadType;
                                                        const isStandard = !rawBread || ['sandwich', 'none', 'no bread', 'standard'].includes(rawBread.toLowerCase());
                                                        const displayBread = isStandard 
                                                            ? 'Standard' 
                                                            : (rawBread === 'gluten-free' || rawBread === 'gf' ? 'Gluten-Free' : rawBread);
                                                        breadCounts[displayBread] = (breadCounts[displayBread] || 0) + lunch.quantity;
                                                    });
                                                });
                                                return (
                                                    <div className="mt-3 pt-2 border-t border-gray-200 flex flex-col gap-1.5 text-[10px] text-gray-700 font-bold">
                                                        <span className="uppercase tracking-wider text-gray-400 text-left">Bread Prep Totals</span>
                                                        <div className="flex flex-wrap gap-3 justify-start">
                                                            {Object.entries(breadCounts).map(([bread, count], bIdx) => (
                                                                <span key={bIdx} className="font-black text-black">
                                                                    {bread}: {count}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ))}
                                </div>
                            )}
                            {/* print cookies table at bottom of smart prep print view */}
                            {aggregatedCookies.length > 0 && (
                                <div className="mt-8 print-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
                                    <h2 className="text-sm font-black uppercase tracking-wider mb-3 pb-1 border-b border-gray-200 text-gray-800">
                                        House-made Cookies
                                    </h2>
                                    <table className="w-full border-collapse text-sm">
                                        <thead>
                                            <tr className="bg-gray-100 text-black">
                                                <th className="p-1.5 px-3 text-left font-bold border-b-2 border-gray-300">House-made Cookie</th>
                                                <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Junior Box</th>
                                                <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Standard Box</th>
                                                <th className="p-1.5 px-3 text-center font-bold border-b-2 border-gray-300 w-28">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {aggregatedCookies.map((item, i) => (
                                                <tr key={i} className="border-b border-gray-200">
                                                    <td className="p-1.5 px-3 text-left font-semibold text-amber-900">{item.name}</td>
                                                    <td className="p-1.5 px-3 text-center font-semibold">{item.junior}</td>
                                                    <td className="p-1.5 px-3 text-center font-semibold">{item.standard}</td>
                                                    <td className="p-1.5 px-3 text-center font-bold text-black w-28">{item.junior + item.standard}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-gray-50 border-t-2 border-gray-300 font-bold">
                                                <td className="p-2 px-3 text-left uppercase text-xs">Total Cookies</td>
                                                <td className="p-2 px-3 text-center text-sm">{cookiesJuniorTotal}</td>
                                                <td className="p-2 px-3 text-center text-sm">{cookiesStandardTotal}</td>
                                                <td className="p-2 px-3 text-center text-sm w-28">{cookiesJuniorTotal + cookiesStandardTotal}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-12 pt-4 border-t border-gray-300 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                        Mountain Mama's Café Admin Dashboard · Smart Prep Sheet
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
                    nav, aside, header, .no-print, .dashboard-web-view, .flex border-b {
                        display: none !important;
                    }

                    /* Reset body margins for print */
                    body, html {
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
                        border-collapse: collapse;
                    }
                    
                    .print-card {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}</style>
        </>
    );
}
