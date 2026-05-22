'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
    Search, Clock, ShoppingBag, Utensils, 
    Building2, FileText, PenTool, ShieldCheck, Settings,
    ChevronRight, Mail, PlusCircle, Pencil, Trash2, 
    LogIn, LogOut, CheckCircle2, Globe, Database, Calendar, User
} from 'lucide-react';
import { cn, formatDateUS, formatDateTimeUS } from '@/lib/utils';


interface ActivityLog {
    id: string;
    user_email: string | null;
    user_role: string | null;
    action: string;
    entity_type: string | null;
    entity_id: string | null;
    details: any;
    created_at: string;
}

interface ActivityClientProps {
    initialLogs: ActivityLog[];
}

export function ActivityClient({ initialLogs }: ActivityClientProps) {
    const [logs] = useState<ActivityLog[]>(initialLogs);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const filteredLogs = logs.filter(log => {
        const matchesSearch = 
            (log.user_email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (log.action?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (log.entity_id?.toLowerCase() || '').includes(searchTerm.toLowerCase());
        
        const matchesType = filterType === 'all' || log.entity_type === filterType;
        
        return matchesSearch && matchesType;
    });

    const ENTITY_ICONS: Record<string, any> = {
        order: ShoppingBag,
        meal: Utensils,
        company: Building2,
        invoice: FileText,
        contract: PenTool,
        auth: ShieldCheck,
        config: Settings
    };

    const ACTION_COLORS: Record<string, string> = {
        create: 'text-emerald-600 bg-emerald-50',
        update: 'text-blue-600 bg-blue-50',
        delete: 'text-rose-600 bg-rose-50',
        login: 'text-violet-600 bg-violet-50',
        logout: 'text-amber-600 bg-amber-50',
        default: 'text-gray-600 bg-gray-50'
    };

    function getActionIcon(action: string) {
        const a = action.toLowerCase();
        if (a.includes('create')) return PlusCircle;
        if (a.includes('update')) return Pencil;
        if (a.includes('delete')) return Trash2;
        if (a.includes('login')) return LogIn;
        if (a.includes('logout')) return LogOut;
        return CheckCircle2;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900">Activity Logs</h1>
                    <p className="text-sm text-muted-foreground font-medium">Audit trail of all administrative actions.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input 
                            placeholder="Search email, action..." 
                            className="pl-9 h-10 w-[240px] rounded-xl border-gray-200 focus:ring-violet-500/20 shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                {['all', 'order', 'meal', 'company', 'invoice', 'auth', 'config'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={cn(
                            "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border",
                            filterType === type 
                                ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200" 
                                : "bg-white text-gray-500 border-gray-200 hover:border-violet-300 hover:text-violet-600"
                        )}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Activity Table */}
            <Card className="overflow-hidden border-gray-200 shadow-sm">
                <Table>
                    <TableHeader className="bg-gray-50/50">
                        <TableRow className="hover:bg-transparent border-b border-gray-100">
                            <TableHead className="w-10"></TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 py-4">Action</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Type</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400">User Email</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Role</TableHead>
                            <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-400 text-right pr-6">Date & Time</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center">
                                        <Database className="size-12 mb-4 opacity-10" />
                                        <p className="font-bold text-gray-900">No activity logs found</p>
                                        <p className="text-xs">Adjust filters or search to see more results.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => {
                                const isExpanded = expandedId === log.id;
                                const EntityIcon = ENTITY_ICONS[log.entity_type || ''] || Clock;
                                const ActionIcon = getActionIcon(log.action);
                                const actionType = log.action.toLowerCase().split(' ')[0];
                                const colorClass = ACTION_COLORS[actionType] || ACTION_COLORS.default;

                                return (
                                    <React.Fragment key={log.id}>
                                        <TableRow 
                                            className={cn(
                                                "cursor-pointer transition-all duration-200 group",
                                                isExpanded ? "bg-violet-50/50" : "hover:bg-muted/30 border-b border-gray-50"
                                            )}
                                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                        >
                                            <TableCell className={cn(
                                                "relative py-4",
                                                isExpanded && "after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-violet-600"
                                            )}>
                                                <ChevronRight className={cn(
                                                    "size-4 text-muted-foreground transition-all duration-300",
                                                    isExpanded && "rotate-90 text-violet-600 scale-110"
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("size-8 rounded-lg flex items-center justify-center relative flex-shrink-0", colorClass)}>
                                                        <ActionIcon className="size-4" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-[14px] text-gray-900 leading-none">
                                                            {log.action.replace(/_/g, ' ')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <EntityIcon className="size-3.5 text-gray-400" />
                                                    <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                                        {log.entity_type}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Mail className="size-3.5 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-600 truncate max-w-[200px]">
                                                        {log.user_email || 'System'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-tighter bg-violet-50 text-violet-700 border-violet-100">
                                                    {log.user_role || 'system'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {formatDateUS(log.created_at)}
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>

                                        {isExpanded && (
                                            <TableRow className="bg-muted/10 hover:bg-muted/10 border-b border-gray-100/50">
                                                <TableCell colSpan={6} className="p-0">
                                                    <div className="px-14 py-8 bg-white/50 backdrop-blur-sm border-b border-gray-100">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
                                                                    <FileText className="size-3" /> Event Details (JSON)
                                                                </div>
                                                                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 shadow-inner relative overflow-hidden group/payload">
                                                                    <div className="absolute top-0 left-0 w-1 h-full bg-violet-400 opacity-20 group-hover/payload:opacity-50 transition-opacity"></div>
                                                                    <pre className="text-[12px] font-mono text-gray-700 whitespace-pre-wrap break-all leading-relaxed">
                                                                        {JSON.stringify(log.details, null, 2)}
                                                                    </pre>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="space-y-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
                                                                    <Globe className="size-3" /> Audit Context
                                                                </div>
                                                                <div className="bg-white rounded-2xl border border-gray-200 divide-y overflow-hidden shadow-sm">
                                                                    <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Exact Time</span>
                                                                        <span className="text-xs font-bold text-gray-900">{formatDateTimeUS(log.created_at)}</span>
                                                                    </div>
                                                                    <div className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resource ID</span>
                                                                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-600">{log.entity_id || '---'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
