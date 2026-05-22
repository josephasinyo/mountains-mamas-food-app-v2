'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
    Calendar, TrendingUp, ShoppingBag, Users, 
    ChevronRight, ArrowUpRight, DollarSign, Package
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AnalyticsClientProps {
    dailyOrders: any[];
    companyLunches: any[];
    popularMeals: any[];
    revenueData: any[];
    stats: {
        totalRevenue: number;
        totalLunches: number;
        activeCompaniesCount: number;
        avgLunchValue: number;
        cancelledRevenue: number;
        cancelledLunches: number;
    };
}

export function AnalyticsClient({ 
    dailyOrders, 
    companyLunches, 
    popularMeals, 
    revenueData,
    stats
}: AnalyticsClientProps) {
    const [timeRange, setTimeRange] = useState('30d');

    const COLORS = ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                <p className="text-sm text-muted-foreground">Deep dive into orders, revenue, and popularity.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <Card className="bg-gradient-to-br from-violet-500/10 to-purple-500/5 border-violet-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Total Revenue</p>
                            <DollarSign className="size-4 text-violet-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold">${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-violet-600/70 mt-1">Excludes cancelled</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Lunches</p>
                            <Package className="size-4 text-blue-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold">{stats.totalLunches}</h3>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-600/70 mt-1">Excludes cancelled</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Active Companies</p>
                            <Users className="size-4 text-emerald-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold">{stats.activeCompaniesCount}</h3>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Currently partnered</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Avg. Lunch Price</p>
                            <TrendingUp className="size-4 text-amber-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold">${stats.avgLunchValue.toFixed(2)}</h3>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-600/70 mt-1">Active orders only</p>
                        <p className="text-xs text-muted-foreground">Per lunch</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/5 border-rose-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">Lost Revenue</p>
                            <ShoppingBag className="size-4 text-rose-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold">${stats.cancelledRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-rose-600/70 mt-1">Cancelled orders</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-500/10 to-gray-500/5 border-slate-500/20">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Cancelled Lunches</p>
                            <Calendar className="size-4 text-slate-600" />
                        </div>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-2xl font-bold">{stats.cancelledLunches}</h3>
                        </div>
                        <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-600/70 mt-1">Total items cancelled</p>
                        <p className="text-xs text-muted-foreground">Last 30 days</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Lunches Trend</CardTitle>
                        <CardDescription>Daily volume of individual lunch items.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={dailyOrders}>
                                    <defs>
                                        <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11}} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11}} 
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => [value, 'Lunches']}
                                    />
                                    <Area 
                                        type="monotone" 
                                        dataKey="orders" 
                                        name="Lunches"
                                        stroke="#8b5cf6" 
                                        fillOpacity={1} 
                                        fill="url(#colorOrders)" 
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Popular Meals */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Most Popular Meals</CardTitle>
                        <CardDescription>Top 5 meals by quantity sold.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={popularMeals} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis type="number" axisLine={false} tickLine={false} tick={{fontSize: 11}} />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11}} 
                                        width={100}
                                    />
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        formatter={(value) => [value, 'Lunches']}
                                    />
                                    <Bar dataKey="orders" radius={[0, 4, 4, 0]}>
                                        {popularMeals.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Company Distribution */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-base">Lunches by Company</CardTitle>
                        <CardDescription>Meal item volume per tour partner.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={companyLunches}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="lunches"
                                    >
                                        {companyLunches.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 space-y-2">
                            {companyLunches.map((c, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <div className="size-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                                        <span className="text-muted-foreground">{c.name}</span>
                                    </div>
                                    <span className="font-medium">{c.lunches}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Revenue Breakdown</CardTitle>
                        <CardDescription>Daily revenue performance.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                    <XAxis 
                                        dataKey="date" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11}} 
                                        dy={10}
                                    />
                                    <YAxis 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fontSize: 11}} 
                                    />
                                    <Tooltip 
                                        formatter={(value) => [`$${value}`, 'Revenue']}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
