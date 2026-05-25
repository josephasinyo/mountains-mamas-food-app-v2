'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    ShoppingCart, Clock, CheckCircle2, TrendingUp, 
    ArrowRight, Package, Calendar, ChevronRight,
    ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDateUS } from '@/lib/utils';
import { OrderItemDetails } from '@/components/ui/OrderItemCustomFields';


interface CompanyDashboardClientProps {
    initialData: any;
}

export default function CompanyDashboardClient({ initialData }: CompanyDashboardClientProps) {
    const { stats, recentOrders } = initialData;
    const [expanded, setExpanded] = React.useState<string | null>(null);
    const [sortConfig, setSortConfig] = React.useState<{ key: 'created_at' | 'tour_date', direction: 'asc' | 'desc' }>({ 
        key: 'created_at', 
        direction: 'desc' 
    });

    const toggleSort = (key: 'created_at' | 'tour_date') => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedOrders = [...(recentOrders || [])].sort((a, b) => {
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

    const statCards = [
        {
            title: 'Total Lunches',
            value: stats?.totalLunches || 0,
            icon: ShoppingCart,
            color: 'text-violet-600',
            bg: 'bg-violet-50',
            description: 'All-time lunch orders'
        },
        {
            title: 'Today\'s Lunches',
            value: stats?.todayLunches || 0,
            icon: Calendar,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            description: 'For today\'s tours'
        },
        {
            title: 'Pending Lunches',
            value: stats?.pendingLunches || 0,
            icon: Clock,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
            description: 'Awaiting fulfillment'
        }
    ];

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
                <p className="text-gray-500 font-medium mt-1">Welcome back! Here&apos;s what&apos;s happening with your tours today.</p>
            </div>

            {/* Stats Grid */}
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
                                        <span className="text-3xl font-black text-gray-900 tracking-tighter">{card.value}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{card.title}</span>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <span className="text-xs font-semibold text-gray-400">{card.description}</span>
                                    <TrendingUp className="size-3 text-emerald-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </motion.div>

            <div className="grid grid-cols-1 gap-8">
                {/* Recent Orders Table */}
                <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[32px] overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-bold text-gray-900">Recent Orders</CardTitle>
                            <CardDescription className="font-medium">The latest orders placed by your guides and customers.</CardDescription>
                        </div>
                        <Link href="/company/orders">
                            <Button variant="ghost" className="rounded-xl font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-2">
                                View All <ArrowRight className="size-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Customer</th>
                                        <th 
                                            className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:bg-gray-100/50 transition-colors group/sort"
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
                                        </th>
                                        <th 
                                            className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:bg-gray-100/50 transition-colors group/sort"
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
                                        </th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Status</th>
                                        <th className="px-8 py-4 text-left text-[11px] font-black uppercase tracking-widest text-gray-400">Items</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sortedOrders && sortedOrders.length > 0 ? (
                                        sortedOrders.flatMap((order: any) => {
                                            const isExpanded = expanded === order.id;
                                            const totalItems = order.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                                            const rows = [
                                                <tr 
                                                    key={order.id} 
                                                    className={`group transition-colors cursor-pointer ${isExpanded ? 'bg-violet-50/30' : 'hover:bg-gray-50/50'}`}
                                                    onClick={() => setExpanded(isExpanded ? null : order.id)}
                                                >
                                                    <td className="px-8 py-5">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-black transition-all ${isExpanded ? 'bg-violet-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-600'}`}>
                                                                {(order.guide_name || order.customer_name)?.charAt(0).toUpperCase() || '?'}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-sm text-gray-900">{order.guide_name || order.customer_name}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-bold text-gray-900">{formatDateUS(order.tour_date)}</p>
                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">{order.pickup_time || 'No time'}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <p className="text-sm font-semibold text-gray-400">{formatDateUS(order.created_at)}</p>
                                                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tighter">{new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <Badge variant="outline" className={`
                                                            rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border-transparent shadow-none
                                                            ${order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                            ${order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                            ${order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                            ${order.status === 'ticket_created' ? 'bg-violet-50 text-violet-700 border-violet-200' : ''}
                                                        `}>
                                                            {order.status.replace('_', ' ')}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-8 py-5 text-left">
                                                        <div className="flex flex-col items-start gap-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="size-6 rounded-md bg-violet-50 flex items-center justify-center text-[10px] font-black text-violet-600 border border-violet-100">
                                                                    {totalItems}
                                                                </div>
                                                                <span className="text-[12px] font-bold text-gray-900">Total Items</span>
                                                            </div>
                                                            <div className="flex flex-col items-start gap-0.5">
                                                                {order.order_items?.slice(0, 5).map((item: any, i: number) => (
                                                                    <p key={i} className="text-[10px] font-medium text-gray-500 leading-tight">
                                                                        <span className="font-bold text-violet-600/70">{item.quantity}x</span> {item.meal_name}
                                                                    </p>
                                                                ))}
                                                                {order.order_items && order.order_items.length > 5 && (
                                                                    <p className="text-[9px] font-bold text-violet-500 italic mt-0.5">
                                                                        {order.order_items.length - 5} more items
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ];

                                            if (isExpanded) {
                                                rows.push(
                                                    <tr key={`${order.id}-detail`} className="border-none hover:bg-transparent">
                                                        <td colSpan={5} className="p-0 border-b border-gray-100">
                                                            <div className="bg-gray-50/50 px-8 py-6 border-t border-gray-100">
                                                                <div className="max-w-xl mx-auto">
                                                                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
                                                                        <div className="divide-y divide-gray-100/70">
                                                                            {order.order_items?.map((item: any, i: number) => (
                                                                                <div key={i} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="font-black text-violet-600 text-base">
                                                                                            {item.quantity}x
                                                                                        </div>
                                                                                        <div className="space-y-0.5">
                                                                                            <p className="font-extrabold text-base text-gray-900 leading-tight">{item.meal_name}</p>
                                                                                            <OrderItemDetails item={item} />
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                        {order.notes && (
                                                                            <div className="bg-amber-50/30 p-4">
                                                                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">NOTES</span>
                                                                                <p className="text-xs text-amber-900 font-bold italic">&ldquo;{order.notes}&rdquo;</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }

                                            return rows;
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">
                                                No orders found yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View */}
                        <div className="block md:hidden space-y-4 px-4 py-4 bg-gray-50/30">
                            {sortedOrders && sortedOrders.length > 0 ? (
                                sortedOrders.map((order: any) => {
                                    const totalItems = order.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                                    const isExpanded = expanded === order.id;
                                    return (
                                        <div 
                                            key={order.id} 
                                            className={`bg-white rounded-2xl p-4 border transition-all duration-300 overflow-hidden cursor-pointer ${isExpanded ? 'ring-2 ring-violet-500 shadow-md border-transparent' : 'border-gray-100 shadow-sm hover:shadow-md'}`}
                                            onClick={() => setExpanded(isExpanded ? null : order.id)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${isExpanded ? 'bg-violet-600 text-white shadow-sm' : 'bg-violet-50 text-violet-700'}`}>
                                                        {(order.guide_name || order.customer_name)?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-sm text-gray-900 leading-tight">{order.guide_name || order.customer_name}</h4>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className={`
                                                    rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-transparent shadow-none
                                                    ${order.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : ''}
                                                    ${order.status === 'fulfilled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}
                                                    ${order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border-rose-200' : ''}
                                                    ${order.status === 'ticket_created' ? 'bg-violet-50 text-violet-700 border-violet-200' : ''}
                                                `}>
                                                    {order.status.replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-b border-gray-50 py-2 mt-2 text-gray-500 font-semibold">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Tour Date</span>
                                                    <span className="text-gray-900 font-bold">{formatDateUS(order.tour_date)}</span>
                                                    <span className="text-[10px] text-gray-400 mt-0.5">{order.pickup_time || 'No time'}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Placed At</span>
                                                    <span className="text-gray-400 font-semibold">{formatDateUS(order.created_at)}</span>
                                                    <span className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 mt-3">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="size-5 rounded bg-violet-50 flex items-center justify-center text-[9px] font-black text-violet-600 border border-violet-100">
                                                        {totalItems}
                                                    </div>
                                                    <span className="text-[11px] font-bold text-gray-900">Items Ordered</span>
                                                </div>
                                                <div className="space-y-1 bg-gray-50/50 rounded-lg p-2 border border-gray-100/50">
                                                    {order.order_items?.slice(0, 5).map((item: any, idx: number) => (
                                                        <p key={idx} className="text-[10px] font-medium text-gray-600 leading-tight">
                                                            <span className="font-bold text-violet-600/70">{item.quantity}x</span> {item.meal_name}
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
                                                        className="overflow-hidden pt-3 mt-3 border-t border-gray-100 space-y-3"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <div className="space-y-2">
                                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block">Item Breakdown</span>
                                                            <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl bg-white overflow-hidden shadow-sm">
                                                                {order.order_items?.map((item: any, i: number) => (
                                                                    <div key={i} className="p-3.5 flex items-start justify-between gap-4">
                                                                        <div className="space-y-0.5">
                                                                            <p className="font-extrabold text-base text-gray-900 leading-tight">
                                                                                <span className="text-violet-600 font-black mr-1.5">{item.quantity}x</span>
                                                                                {item.meal_name}
                                                                            </p>
                                                                            <OrderItemDetails item={item} />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        {order.notes && (
                                                            <div className="bg-amber-50/40 p-3 rounded-xl border border-amber-100/50">
                                                                <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest block mb-1">NOTES</span>
                                                                <p className="text-xs text-amber-900 font-bold italic leading-relaxed">&ldquo;{order.notes}&rdquo;</p>
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-gray-400 font-medium">
                                    No orders found yet.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
