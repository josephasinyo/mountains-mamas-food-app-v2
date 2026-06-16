'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createCompany, updateCompany, updateCompanyStatus, deleteCompany, resendInvitation, deleteInvoice, impersonateCompany } from './actions';
import type { TourCompany } from '@/lib/supabase/types';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
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
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plus, MoreHorizontal, Pencil, CheckCircle, XCircle, Trash2,
    Building2, CreditCard, FileText, Copy, ChevronRight, ChevronDown,
    Phone, Mail, Globe, ExternalLink, Clock, LayoutGrid, List, Send, User, Percent, Settings
} from 'lucide-react';
import { cn, formatDateUS } from '@/lib/utils';


interface CompaniesClientProps {
    initialCompanies: (TourCompany & { 
        company_app_config: any;
        contracts: any[];
        invoices: any[];
    })[];
}

export function CompaniesClient({ initialCompanies }: CompaniesClientProps) {
    const [companies, setCompanies] = useState(initialCompanies);
    const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [editingCompany, setEditingCompany] = useState<(TourCompany & { company_app_config?: any }) | null>(null);
    const [loading, setLoading] = useState(false);
    const [companyToDelete, setCompanyToDelete] = useState<{ id: string; name: string } | null>(null);
    const [companyToResend, setCompanyToResend] = useState<{ id: string; name: string } | null>(null);
    const [filter, setFilter] = useState('all');
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('direct_pay');
    const [representativeName, setRepresentativeName] = useState('');
    const [representativeTitle, setRepresentativeTitle] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState('0');
    const [prepInstructions, setPrepInstructions] = useState('');
    const [useMountainMamasBranding, setUseMountainMamasBranding] = useState(false);
    const [customWelcomeMessage, setCustomWelcomeMessage] = useState('');

    const filtered = filter === 'all' ? companies : companies.filter(c => c.status === filter);

    const hasChanges = editingCompany ? (
        name !== (editingCompany.name || '') ||
        email !== (editingCompany.email || '') ||
        phone !== (editingCompany.phone || '') ||
        paymentMethod !== editingCompany.payment_method ||
        representativeName !== (editingCompany.representative_name || '') ||
        representativeTitle !== (editingCompany.representative_title || '') ||
        discountPercentage !== String(editingCompany.discount_percentage ?? 0) ||
        prepInstructions !== (editingCompany.prep_instructions || '') ||
        useMountainMamasBranding !== (editingCompany.company_app_config?.use_mountain_mamas_branding ?? false) ||
        customWelcomeMessage !== (editingCompany.company_app_config?.custom_welcome_message || '')
    ) : (
        name.length > 0 || email.length > 0 || prepInstructions.length > 0 || useMountainMamasBranding || customWelcomeMessage.length > 0
    );

    const [invoiceToDelete, setInvoiceToDelete] = useState<{ id: string; amount: number; companyId: string } | null>(null);
    const [deletingInvoice, setDeletingInvoice] = useState(false);

    const executeInvoiceDelete = async () => {
        if (!invoiceToDelete) return;
        setDeletingInvoice(true);
        const toastId = toast.loading('Deleting invoice and updating tour records...');
        try {
            const res = await deleteInvoice(invoiceToDelete.id);
            if (res.success) {
                toast.success('Invoice deleted successfully! Tours reverted to unpaid.', { id: toastId });
                setCompanies(prev => prev.map(c => {
                    if (c.id === invoiceToDelete.companyId) {
                        return {
                            ...c,
                            invoices: c.invoices.filter((inv: any) => inv.id !== invoiceToDelete.id)
                        };
                    }
                    return c;
                }));
            } else {
                toast.error(res.error || 'Failed to delete invoice', { id: toastId });
            }
        } catch (err: any) {
            toast.error('Unexpected error while deleting invoice.', { id: toastId });
        } finally {
            setDeletingInvoice(false);
            setInvoiceToDelete(null);
        }
    };

    const counts = {
        all: companies.length,
        active: companies.filter(c => c.status === 'active').length,
        pending_approval: companies.filter(c => c.status === 'pending_approval').length,
        suspended: companies.filter(c => c.status === 'suspended').length,
    };

    function toggleExpand(id: string) {
        setExpandedCompanyId(expandedCompanyId === id ? null : id);
    }

    function openCreate() {
        setEditingCompany(null);
        setName('');
        setEmail('');
        setPhone('');
        setPaymentMethod('direct_pay');
        setRepresentativeName('');
        setRepresentativeTitle('');
        setDiscountPercentage('0');
        setPrepInstructions('');
        setUseMountainMamasBranding(false);
        setCustomWelcomeMessage('');
        setOpen(true);
    }

    function openEdit(company: TourCompany & { company_app_config?: any }) {
        setEditingCompany(company);
        setName(company.name || '');
        setEmail(company.email || '');
        setPhone(company.phone || '');
        setPaymentMethod(company.payment_method);
        setRepresentativeName(company.representative_name || '');
        setRepresentativeTitle(company.representative_title || '');
        setDiscountPercentage(String(company.discount_percentage ?? 0));
        setPrepInstructions(company.prep_instructions || '');
        setUseMountainMamasBranding(company.company_app_config?.use_mountain_mamas_branding ?? false);
        setCustomWelcomeMessage(company.company_app_config?.custom_welcome_message || '');
        setOpen(true);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.set('name', name);
            formData.set('email', email);
            formData.set('phone', phone);
            formData.set('payment_method', paymentMethod);
            formData.set('representative_name', representativeName);
            formData.set('representative_title', representativeTitle);
            formData.set('discount_percentage', discountPercentage);
            formData.set('prep_instructions', prepInstructions);
            formData.set('use_mountain_mamas_branding', String(useMountainMamasBranding));
            formData.set('custom_welcome_message', customWelcomeMessage);

            const result = editingCompany
                ? await updateCompany(editingCompany.id, formData)
                : await createCompany(formData);

            if (result.success) {
                setOpen(false);
                if (editingCompany) {
                    setCompanies(prev => prev.map(c => c.id === editingCompany.id ? { 
                        ...c, 
                        ...result.data,
                        contracts: c.contracts || [],
                        invoices: c.invoices || []
                    } : c));
                    toast.success(`Company "${name}" updated successfully`);
                } else {
                    setCompanies(prev => [{
                        ...result.data,
                        contracts: [],
                        invoices: []
                    }, ...prev]);
                    toast.success(`Company "${name}" created successfully`);
                }
            } else {
                toast.error(result.error || 'Failed to save company');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('A network error occurred.');
        } finally {
            setLoading(false);
        }
    }

    async function handleStatus(id: string, status: string) {
        const result = await updateCompanyStatus(id, status);
        if (result.success) {
            setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: status as any, is_active: status === 'active' } : c));
            const company = companies.find(c => c.id === id);
            toast.success(`Company "${company?.name || id}" is now ${status}`);
        } else {
            toast.error(result.error || 'Failed to update status');
        }
    }

    function handleDelete(id: string, name: string) {
        setCompanyToDelete({ id, name });
    }

    async function executeDelete() {
        if (!companyToDelete) return;
        const { id, name } = companyToDelete;
        const result = await deleteCompany(id);
        if (result.success) {
            setCompanies(prev => prev.filter(c => c.id !== id));
            toast.success(`Company "${name}" deleted successfully`);
        } else {
            toast.error(result.error || 'Failed to delete company');
        }
        setCompanyToDelete(null);
    }

    function handleResendInvitation(id: string, name: string) {
        setCompanyToResend({ id, name });
    }

    async function executeResendInvitation() {
        if (!companyToResend) return;
        const { id, name } = companyToResend;
        setLoading(true);
        try {
            const result = await resendInvitation(id);
            if (result.success) {
                toast.success(`Invitation resent to "${name}" successfully!`);
            } else {
                toast.error(result.error || 'Failed to resend invitation');
            }
        } catch (error) {
            console.error('Resend error:', error);
            toast.error('A network error occurred.');
        } finally {
            setLoading(false);
            setCompanyToResend(null);
        }
    }

    async function handleImpersonate(companyId: string, companyName: string) {
        const toastId = toast.loading(`Connecting to ${companyName}'s dashboard...`);
        try {
            const result = await impersonateCompany(companyId);
            if (result.success) {
                toast.success('Successfully connected!', { id: toastId });
                window.location.href = '/company';
            } else {
                toast.error(result.error || 'Failed to connect to portal', { id: toastId });
            }
        } catch (error) {
            console.error('Impersonation error:', error);
            toast.error('A network error occurred.', { id: toastId });
        }
    }

    function copyLink(slug: string) {
        navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
        toast.success('Link copied to clipboard');
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Tour Companies</h1>
                    <p className="text-sm text-muted-foreground font-medium">Manage partners, payment methods, and onboarding.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl mr-2">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewMode('table')}
                            className={`h-8 rounded-lg px-3 transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'}`}
                        >
                            <List className="size-4 mr-1.5" />
                            <span className="text-xs font-bold">Table</span>
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setViewMode('cards')}
                            className={`h-8 rounded-lg px-3 transition-all ${viewMode === 'cards' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-500'}`}
                        >
                            <LayoutGrid className="size-4 mr-1.5" />
                            <span className="text-xs font-bold">Cards</span>
                        </Button>
                    </div>
                    <Button onClick={openCreate} className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100 font-bold">
                        <Plus className="size-4" /> Add Company
                    </Button>
                </div>
            </div>

            {/* Filter Tabs */}
            <Tabs value={filter} onValueChange={setFilter} className="mb-4">
                <TabsList>
                    <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
                    <TabsTrigger value="active">Active ({counts.active})</TabsTrigger>
                    <TabsTrigger value="pending_approval">Pending ({counts.pending_approval})</TabsTrigger>
                    <TabsTrigger value="suspended">Suspended ({counts.suspended})</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Table */}
            {filtered.length === 0 ? (
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <Building2 className="size-10 opacity-20" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">
                            {filter === 'all' ? 'No companies yet' : `No ${filter === 'pending_approval' ? 'Pending' : filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')} companies`}
                        </p>
                        <p className="text-sm font-medium mt-1">{filter === 'all' ? 'Add your first tour company.' : 'Try a different filter.'}</p>
                    </CardContent>
                </Card>
            ) : viewMode === 'table' ? (
                <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Company</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Payment</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4 text-center">Ordering Link</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Created</TableHead>
                                <TableHead className="text-right font-bold text-gray-900 py-4 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((company) => {
                                const isExpanded = expandedCompanyId === company.id;
                                return (
                                    <React.Fragment key={company.id}>
                                        <TableRow 
                                            className={cn(
                                                "cursor-pointer transition-all duration-200 group border-gray-50",
                                                isExpanded ? "bg-violet-50/30" : "hover:bg-violet-50/10"
                                            )}
                                            onClick={() => toggleExpand(company.id)}
                                        >
                                            <TableCell className={cn(
                                                "relative py-4 pl-6",
                                                isExpanded && "after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-violet-600"
                                            )}>
                                                <ChevronRight className={cn(
                                                    "size-4 text-muted-foreground transition-all duration-300",
                                                    isExpanded && "rotate-90 text-violet-600 scale-110"
                                                )} />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-10 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 shadow-sm border border-gray-100",
                                                        isExpanded 
                                                            ? "bg-violet-600 text-white shadow-lg shadow-violet-200 scale-110" 
                                                            : "bg-white text-gray-400 group-hover:bg-violet-50 group-hover:text-violet-600 group-hover:border-violet-100"
                                                    )}>
                                                        {company.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className={cn(
                                                            "font-bold text-[15px] transition-colors",
                                                            isExpanded ? "text-violet-900" : "text-gray-900"
                                                        )}>{company.name}</p>
                                                        <p className="text-xs text-gray-500 font-medium">{company.email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-[10px] font-bold rounded-lg px-2.5 py-0.5 border-gray-200 text-gray-500 gap-1.5">
                                                    {company.payment_method === 'direct_pay'
                                                        ? <><CreditCard className="size-3 text-emerald-500" /> Direct Pay</>
                                                        : <><FileText className="size-3 text-blue-500" /> Invoice</>
                                                    }
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={company.status === 'active' ? 'default' : company.status === 'suspended' ? 'destructive' : 'secondary'}
                                                    className={`text-[10px] font-bold rounded-lg px-2.5 py-0.5 uppercase tracking-wider ${
                                                        company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                                                        company.status === 'suspended' ? 'bg-rose-50 text-rose-700 border-rose-100' : 
                                                        company.status === 'pending_approval' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                        'bg-gray-100 text-gray-400 border-gray-200'
                                                    }`}
                                                >
                                                    {company.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()} className="text-center">
                                                {company.company_app_config?.use_mountain_mamas_branding ? (
                                                    <div className="flex flex-col gap-1.5 items-center justify-center">
                                                        <button
                                                            onClick={() => copyLink(company.default_slug || company.slug)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors group/link"
                                                            title="Copy Default Link"
                                                        >
                                                            <span className="text-[9px] text-violet-400 font-normal uppercase mr-0.5">Default:</span>
                                                            <code>/{company.default_slug || company.slug}</code>
                                                            <Copy className="size-3 opacity-50 group-hover/link:opacity-100" />
                                                        </button>
                                                        <button
                                                            onClick={() => copyLink(company.generic_slug || company.slug)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors group/link"
                                                            title="Copy Generic Link"
                                                        >
                                                            <span className="text-[9px] text-violet-400 font-normal uppercase mr-0.5">Generic:</span>
                                                            <code>/{company.generic_slug || company.slug}</code>
                                                            <Copy className="size-3 opacity-50 group-hover/link:opacity-100" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => copyLink(company.slug)}
                                                        className="inline-flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors group/link"
                                                    >
                                                        <code>/{company.slug}</code>
                                                        <Copy className="size-3 opacity-50 group-hover/link:opacity-100" />
                                                    </button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-[11px] text-gray-400 font-bold" suppressHydrationWarning>
                                                {formatDateUS(company.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="inline-flex items-center justify-center size-9 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all cursor-pointer">
                                                            <MoreHorizontal className="size-5" />
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1">
                                                        <DropdownMenuItem onClick={() => openEdit(company)} className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700">
                                                            <Pencil className="size-3.5" /> Edit Company
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleImpersonate(company.id, company.name)} className="rounded-lg gap-2 font-bold text-violet-600 focus:bg-violet-50 focus:text-violet-700">
                                                            <ExternalLink className="size-3.5" /> View Portal
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleResendInvitation(company.id, company.name)} className="rounded-lg gap-2 font-bold text-violet-600 focus:bg-violet-50 focus:text-violet-700">
                                                            <Send className="size-3.5" /> Resend Invitation
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                        {company.status === 'active' ? (
                                                            <DropdownMenuItem
                                                                onClick={() => handleStatus(company.id, 'suspended')}
                                                                className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                                            >
                                                                <XCircle className="size-3.5" /> Suspend
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <DropdownMenuItem onClick={() => handleStatus(company.id, 'active')} className="rounded-lg gap-2 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                                                                <CheckCircle className="size-3.5" /> Activate
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                        <DropdownMenuItem 
                                                            onClick={() => handleDelete(company.id, company.name)} 
                                                            className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                                        >
                                                            <Trash2 className="size-3.5" /> Delete Company
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
 
                                        {isExpanded && (
                                            <TableRow className="bg-gray-50/20 hover:bg-gray-50/20 border-gray-50">
                                                <TableCell colSpan={7} className="p-0">
                                                    <div className="px-14 py-8 bg-white shadow-inner">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                                            {/* Contact Details */}
                                                            <div className="space-y-5">
                                                                <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                    <Building2 className="size-3.5 text-violet-500" /> Partner Profile
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="size-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                                                            <Mail className="size-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                                                                            <p className="text-sm font-bold text-gray-900">{company.email}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="size-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                                            <Phone className="size-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Contact</p>
                                                                            <p className="text-sm font-bold text-gray-900">{company.phone || 'Not provided'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="size-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                                                            <User className="size-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Legal Representative</p>
                                                                            <p className="text-sm font-bold text-gray-900">{company.representative_name || 'Not provided'}{company.representative_title ? ` (${company.representative_title})` : ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="size-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                                                            <Globe className="size-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Public Slug(s)</p>
                                                                            {company.company_app_config?.use_mountain_mamas_branding ? (
                                                                                <div className="space-y-1">
                                                                                    <p className="text-xs font-mono text-blue-600 font-bold">Default: /{company.default_slug || company.slug}</p>
                                                                                    <p className="text-xs font-mono text-blue-600 font-bold">Generic: /{company.generic_slug || company.slug}</p>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-sm font-mono text-blue-600 font-bold">/{company.slug}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-4">
                                                                        <div className="size-8 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                                                            <Settings className="size-4" />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ordering Branding</p>
                                                                            <p className="text-sm font-bold text-gray-900">
                                                                                {company.company_app_config?.use_mountain_mamas_branding 
                                                                                    ? "Mountain Mama's Café" 
                                                                                    : "Tour Company Name"}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
 
                                                            {/* Contracts */}
                                                            <div className="space-y-5">
                                                                <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                    <FileText className="size-3.5 text-blue-500" /> Active Contracts
                                                                </div>
                                                                {company.contracts && company.contracts.length > 0 ? (
                                                                    <div className="space-y-3">
                                                                        {company.contracts.map((contract: any) => (
                                                                            <div key={contract.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/50 group/item hover:border-violet-200 transition-all">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-violet-600 border border-gray-100 group-hover/item:bg-violet-600 group-hover/item:text-white transition-all">
                                                                                        <FileText className="size-5" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-xs font-bold capitalize text-gray-900">{contract.status}</p>
                                                                                        <p className="text-[10px] text-gray-400 font-bold">
                                                                                            {contract.signed_at ? `Signed ${formatDateUS(contract.signed_at)}` : 'Awaiting signature'}
                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                                {(contract.pdf_url || contract.status === 'signed') && (
                                                                                    <a 
                                                                                        href={contract.pdf_url || `/admin/companies/contracts/${contract.id}`} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-violet-600 hover:border-violet-200 transition-all cursor-pointer"
                                                                                        title="View / Print Signed Contract"
                                                                                    >
                                                                                        <ExternalLink className="size-3.5" />
                                                                                    </a>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium bg-gray-50/50">
                                                                        <FileText className="size-6 mb-2 opacity-20" />
                                                                        No active contracts.
                                                                    </div>
                                                                )}
                                                            </div>
 
                                                            {/* Invoices */}
                                                            <div className="space-y-5">
                                                                <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                    <CreditCard className="size-3.5 text-emerald-500" /> Recent Billing
                                                                </div>
                                                                {company.invoices && company.invoices.length > 0 ? (
                                                                    <div className="space-y-3">
                                                                        {company.invoices.slice(0, 3).map((invoice: any) => (
                                                                            <div key={invoice.id} className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/50 group/item hover:border-violet-200 transition-all">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className={cn(
                                                                                        "size-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[9px] font-black uppercase border border-gray-100",
                                                                                        invoice.status === 'paid' ? "text-emerald-600 group-hover/item:bg-emerald-600" : "text-amber-600 group-hover/item:bg-amber-600",
                                                                                        "group-hover/item:text-white transition-all"
                                                                                    )}>
                                                                                        {invoice.status}
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-black text-gray-900">${invoice.total_amount.toFixed(2)}</p>
                                                                                        <p className="text-[10px] text-gray-400 font-bold">
                                                                                            {formatDateUS(invoice.created_at)}
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
                                                                                        onClick={() => setInvoiceToDelete({ id: invoice.id, amount: invoice.total_amount, companyId: company.id })}
                                                                                        className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-all cursor-pointer"
                                                                                        title="Delete Invoice & Reset Orders"
                                                                                    >
                                                                                        <Trash2 className="size-3.5" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {company.invoices.length > 3 && (
                                                                            <p className="text-[10px] text-center text-gray-400 font-black uppercase tracking-widest pt-1">
                                                                                + {company.invoices.length - 3} more
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium bg-gray-50/50">
                                                                        <CreditCard className="size-6 mb-2 opacity-20" />
                                                                        No billing history.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {company.prep_instructions && (
                                                            <div className="mt-8 p-5 rounded-2xl bg-gray-50 border border-gray-100 space-y-2">
                                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                    <FileText className="size-3.5 text-gray-500" /> Prep & Packaging Profile
                                                                </div>
                                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{company.prep_instructions}</p>
                                                            </div>
                                                        )}
                                                        {company.company_app_config?.custom_welcome_message && (
                                                            <div className="mt-4 p-5 rounded-2xl bg-violet-50/30 border border-violet-100/60 space-y-2">
                                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-violet-500">
                                                                    <Settings className="size-3.5" /> Custom Welcome Message
                                                                </div>
                                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{company.company_app_config.custom_welcome_message}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filtered.map((company) => (
                        <Card key={company.id} className={`rounded-[32px] border-none shadow-sm transition-all duration-300 group hover:ring-2 hover:ring-violet-500 hover:shadow-2xl hover:shadow-violet-100 ${
                            company.status === 'active' ? 'bg-white' : 'bg-gray-50/80 opacity-70 grayscale'
                        }`}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-6">
                                    <div className={cn(
                                        "size-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg border border-gray-100 transition-all duration-500 group-hover:scale-110",
                                        company.status === 'active' ? "bg-violet-600 text-white shadow-violet-200" : "bg-gray-200 text-gray-400"
                                    )}>
                                        {company.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <Badge
                                            variant={company.status === 'active' ? 'default' : company.status === 'suspended' ? 'destructive' : 'secondary'}
                                            className={`text-[9px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-[0.1em] shadow-sm border-none ${
                                                company.status === 'active' ? 'bg-emerald-500 text-white' : 
                                                company.status === 'suspended' ? 'bg-rose-500 text-white' : 
                                                'bg-gray-400 text-white'
                                            }`}
                                        >
                                            {company.status.replace('_', ' ')}
                                        </Badge>
                                        <Badge variant="outline" className="text-[9px] font-black rounded-full px-2.5 py-0.5 uppercase tracking-[0.1em] border-gray-100 text-gray-400 bg-gray-50/50">
                                            {company.payment_method === 'direct_pay' ? 'Direct Pay' : 'Invoice'}
                                        </Badge>
                                    </div>
                                </div>
 
                                <div className="space-y-1 mb-6">
                                    <h3 className="font-bold text-[18px] text-gray-900 tracking-tight group-hover:text-violet-700 transition-colors">{company.name}</h3>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Mail className="size-3 text-violet-400" />
                                        <span className="truncate">{company.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                        <Phone className="size-3 text-emerald-400" />
                                        <span>{company.phone || 'No phone'}</span>
                                    </div>
                                    {company.representative_name && (
                                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                            <User className="size-3 text-indigo-400" />
                                            <span className="truncate">{company.representative_name}{company.representative_title ? ` (${company.representative_title})` : ''}</span>
                                        </div>
                                    )}
                                </div>
 
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 group-hover:bg-white group-hover:border-violet-100 transition-all">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Contracts</p>
                                        <p className="text-sm font-black text-gray-700">{company.contracts?.length || 0}</p>
                                    </div>
                                    <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 group-hover:bg-white group-hover:border-violet-100 transition-all">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">Invoices</p>
                                        <p className="text-sm font-black text-gray-700">{company.invoices?.length || 0}</p>
                                    </div>
                                </div>
                                {company.prep_instructions && (
                                    <div className="bg-gray-50/50 rounded-2xl p-3 border border-gray-100 group-hover:bg-white group-hover:border-violet-100 transition-all mb-6">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <span>📝</span> Prep & Packaging Profile
                                        </p>
                                        <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                                            {company.prep_instructions}
                                        </p>
                                    </div>
                                )}
                                {company.company_app_config?.custom_welcome_message && (
                                    <div className="bg-violet-50/30 rounded-2xl p-3 border border-violet-100/60 transition-all mb-6">
                                        <p className="text-[9px] font-black text-violet-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                                            <span>👋</span> Custom Welcome Instructions
                                        </p>
                                        <p className="text-xs text-gray-600 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                                            {company.company_app_config.custom_welcome_message}
                                        </p>
                                    </div>
                                )}
 
                                <div className="pt-5 border-t border-gray-50 flex flex-col gap-2 w-full">
                                    {company.company_app_config?.use_mountain_mamas_branding ? (
                                        <div className="flex flex-col gap-2 w-full text-left">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Default Link</span>
                                                <button
                                                    onClick={() => copyLink(company.default_slug || company.slug)}
                                                    className="text-[11px] font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest flex items-center gap-1.5"
                                                >
                                                    Copy default <Copy className="size-3" />
                                                </button>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Generic Link</span>
                                                <button
                                                    onClick={() => copyLink(company.generic_slug || company.slug)}
                                                    className="text-[11px] font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest flex items-center gap-1.5"
                                                >
                                                    Copy generic <Copy className="size-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between w-full">
                                            <button
                                                onClick={() => copyLink(company.slug)}
                                                className="text-[11px] font-black text-violet-600 hover:text-violet-700 uppercase tracking-widest flex items-center gap-1.5"
                                            >
                                                Copy Link <Copy className="size-3" />
                                            </button>
                                            <span className="text-[11px] font-mono text-gray-400">/{company.slug}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center justify-end w-full mt-2">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="size-8 rounded-xl bg-gray-50 text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all flex items-center justify-center">
                                            <MoreHorizontal className="size-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1">
                                            <DropdownMenuItem onClick={() => openEdit(company)} className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700">
                                                <Pencil className="size-3.5" /> Edit Profile
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleImpersonate(company.id, company.name)} className="rounded-lg gap-2 font-bold text-violet-600 focus:bg-violet-50 focus:text-violet-700">
                                                <ExternalLink className="size-3.5" /> View Portal
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleResendInvitation(company.id, company.name)} className="rounded-lg gap-2 font-bold text-violet-600 focus:bg-violet-50 focus:text-violet-700">
                                                <Send className="size-3.5" /> Resend Invitation
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                            {company.status === 'active' ? (
                                                <DropdownMenuItem
                                                    onClick={() => handleStatus(company.id, 'suspended')}
                                                    className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                                >
                                                    <XCircle className="size-3.5" /> Suspend Partner
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem onClick={() => handleStatus(company.id, 'active')} className="rounded-lg gap-2 font-bold text-emerald-600 focus:bg-emerald-50 focus:text-emerald-700">
                                                    <CheckCircle className="size-3.5" /> Reactivate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                            <DropdownMenuItem 
                                                onClick={() => handleDelete(company.id, company.name)} 
                                                className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                            >
                                                <Trash2 className="size-3.5" /> Delete Partner
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent 
                    className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
                >
                    <DialogHeader>
                        <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                        <DialogDescription>
                            {editingCompany ? 'Update company details.' : 'Register a new tour company partner.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 mt-4 pb-2">
                        {/* Section 1: Partner Identity */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2 pb-1.5 border-b border-gray-100">
                                <Building2 className="size-3.5" /> Partner Identity
                            </h4>
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs font-bold text-gray-700">Company Name *</Label>
                                    <Input id="name" name="name" required placeholder="Yellowstone Safari Tours"
                                        value={name || ''} onChange={(e) => setName(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-xs font-bold text-gray-700">Email Address *</Label>
                                        <Input id="email" name="email" type="email" required placeholder="company@example.com"
                                            value={email || ''} onChange={(e) => setEmail(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs font-bold text-gray-700">Phone Contact</Label>
                                        <Input id="phone" name="phone" placeholder="(406) 555-0123"
                                            value={phone || ''} onChange={(e) => setPhone(e.target.value)} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="representative_name" className="text-xs font-bold text-gray-700">Representative Name</Label>
                                        <Input id="representative_name" name="representative_name" placeholder="John Doe"
                                            value={representativeName || ''} onChange={(e) => setRepresentativeName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="representative_title" className="text-xs font-bold text-gray-700">Representative Title</Label>
                                        <Input id="representative_title" name="representative_title" placeholder="Owner"
                                            value={representativeTitle || ''} onChange={(e) => setRepresentativeTitle(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Billing & Discounts */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2 pb-1.5 border-b border-gray-100">
                                <CreditCard className="size-3.5" /> Billing & Discounts
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                <div className="space-y-1.5">
                                    <Label className="text-xs font-bold text-gray-700">Payment Method *</Label>
                                    <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val || '')}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue>
                                                {paymentMethod === 'direct_pay' ? 'Direct Pay' : 'Monthly Invoice'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="direct_pay">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs">💳 Direct Pay</span>
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="monthly_invoice">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-xs">📄 Monthly Invoice</span>
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="discount_percentage" className="text-xs font-bold text-gray-700">Company Discount (%)</Label>
                                    <div className="relative">
                                        <Input 
                                            id="discount_percentage" 
                                            name="discount_percentage" 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            step="0.5"
                                            placeholder="0"
                                            value={discountPercentage}
                                            onChange={(e) => setDiscountPercentage(e.target.value)}
                                            className="pr-8"
                                        />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {paymentMethod === 'direct_pay' ? (
                                    <div className="p-3 rounded-xl border bg-emerald-50/30 border-emerald-100/50 text-[11px] text-emerald-800 font-medium">
                                        Guests will see prices and pay securely during checkout via Stripe.
                                    </div>
                                ) : (
                                    <div className="p-3 rounded-xl border bg-blue-50/30 border-blue-100/50 text-[11px] text-blue-800 font-medium">
                                        No prices shown to guests. Orders are tracked for monthly invoicing.
                                    </div>
                                )}
                                {Number(discountPercentage) > 0 && (
                                    <div className="p-3 rounded-xl border bg-amber-50/30 border-amber-100/50 text-[11px] text-amber-800 font-medium">
                                        A {discountPercentage}% discount will be automatically applied to all future invoices generated for this company.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 3: App Portal Settings */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2 pb-1.5 border-b border-gray-100">
                                <Globe className="size-3.5" /> App Portal Settings
                            </h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-violet-100/60 bg-violet-50/20">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="use_mountain_mamas_branding" className="text-xs font-bold text-violet-900">Use Mountain Mama's Café Branding</Label>
                                        <p className="text-[10px] text-violet-600/70 font-medium">Show Cafe logo in header instead of company name</p>
                                    </div>
                                    <Switch 
                                        id="use_mountain_mamas_branding"
                                        checked={useMountainMamasBranding} 
                                        onCheckedChange={(val) => setUseMountainMamasBranding(val)}
                                        className="data-[state=checked]:bg-violet-600"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="custom_welcome_message" className="text-xs font-bold text-gray-700">Custom Welcome Instructions</Label>
                                    <Input 
                                        id="custom_welcome_message" 
                                        name="custom_welcome_message" 
                                        placeholder="e.g. Please place your family's order for your tour in Yellowstone..."
                                        value={customWelcomeMessage} 
                                        onChange={(e) => setCustomWelcomeMessage(e.target.value)} 
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Kitchen Operations */}
                        <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-violet-600 uppercase tracking-widest flex items-center gap-2 pb-1.5 border-b border-gray-100">
                                <FileText className="size-3.5" /> Kitchen Operations (Internal)
                            </h4>
                            <div className="space-y-1.5">
                                <Label htmlFor="prep_instructions" className="text-xs font-bold text-gray-700">Preparation & Packaging Instructions</Label>
                                <Textarea 
                                    id="prep_instructions" 
                                    name="prep_instructions" 
                                    placeholder="e.g. Wrap lunches individually in brown paper bags. Group all vegan orders in a separate cooler box. Add extra napkins."
                                    value={prepInstructions}
                                    onChange={(e) => setPrepInstructions(e.target.value)}
                                    className="min-h-[80px]"
                                />
                                <p className="text-[10px] text-gray-400 font-medium">These private instructions are only visible to admin/kitchen staff on prep sheets.</p>
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t border-gray-100">
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit" disabled={loading || !hasChanges}>
                                {loading ? 'Saving...' : editingCompany ? 'Update' : 'Create Company'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={!!companyToDelete}
                onClose={() => setCompanyToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Company"
                description={`Are you sure you want to delete "${companyToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete Company"
                cancelText="Cancel"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={!!companyToResend}
                onClose={() => setCompanyToResend(null)}
                onConfirm={executeResendInvitation}
                title="Resend Invitation"
                description={`Are you sure you want to resend the invitation email to "${companyToResend?.name}"? This will also reset their temporary password.`}
                confirmText="Resend Invitation"
                cancelText="Cancel"
                variant="info"
            />

            <ConfirmDialog
                isOpen={!!invoiceToDelete}
                onClose={() => setInvoiceToDelete(null)}
                onConfirm={executeInvoiceDelete}
                title="Delete Billing Invoice"
                description={`Are you sure you want to delete this invoice for $${invoiceToDelete?.amount.toFixed(2)}? This will void/delete it in Stripe and revert all associated orders back to unpaid.`}
                confirmText="Delete Invoice"
                cancelText="Cancel"
                variant="danger"
            />
        </>
    );
}
