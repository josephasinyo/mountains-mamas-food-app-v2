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
    Phone, Mail, Globe, ExternalLink, Clock, Send, User, Percent, Settings, MapPin
} from 'lucide-react';
import { cn, formatDateUS, formatTitleCase } from '@/lib/utils';


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
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('direct_pay');
    const [representativeName, setRepresentativeName] = useState('');
    const [representativeTitle, setRepresentativeTitle] = useState('');
    const [mailingAddress, setMailingAddress] = useState('');
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
        mailingAddress !== (editingCompany.mailing_address || '') ||
        discountPercentage !== String(editingCompany.discount_percentage ?? 0) ||
        prepInstructions !== (editingCompany.prep_instructions || '') ||
        useMountainMamasBranding !== (editingCompany.company_app_config?.use_mountain_mamas_branding ?? false) ||
        customWelcomeMessage !== (editingCompany.company_app_config?.custom_welcome_message || '')
    ) : (
        name.length > 0 || email.length > 0 || mailingAddress.length > 0 || prepInstructions.length > 0 || useMountainMamasBranding || customWelcomeMessage.length > 0
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
        setMailingAddress('');
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
        setMailingAddress(company.mailing_address || '');
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
            formData.set('mailing_address', mailingAddress);
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
            ) : (
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
                                        <TableRow className={cn(
                                            "group transition-colors border-gray-50",
                                            isExpanded ? "bg-violet-50/30 hover:bg-violet-50/40" : "hover:bg-gray-50/50"
                                        )}>
                                            <TableCell className="pl-4">
                                                <button
                                                    onClick={() => toggleExpand(company.id)}
                                                    className="size-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors"
                                                >
                                                    {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                                                </button>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border border-gray-100",
                                                        company.status === 'active' ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-400"
                                                    )}>
                                                        {company.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-gray-900 flex items-center gap-2">
                                                            {formatTitleCase(company.name)}
                                                            {company.discount_percentage > 0 && (
                                                                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-[10px] font-black border-none px-1.5 py-0">
                                                                    {company.discount_percentage}% OFF
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-2 font-medium">
                                                            <span>{company.email}</span>
                                                            {company.phone && <span>• {company.phone}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {company.payment_method === 'direct_pay' ? (
                                                    <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-50 gap-1.5">
                                                        <CreditCard className="size-3 text-blue-500" />
                                                        Direct Pay
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-50 gap-1.5">
                                                        <FileText className="size-3 text-purple-500" />
                                                        Invoice
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={company.status === 'active' ? 'default' : company.status === 'suspended' ? 'destructive' : 'secondary'}
                                                    className={`text-[10px] font-bold rounded-lg uppercase tracking-wider ${
                                                        company.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-50' :
                                                        company.status === 'suspended' ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-50' :
                                                        'bg-gray-100 text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {company.status.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {company.company_app_config?.use_mountain_mamas_branding ? (
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <button
                                                            onClick={() => copyLink(company.default_slug || company.slug)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-lg transition-colors group/link"
                                                            title={`Copy default link: /${company.default_slug || company.slug}`}
                                                        >
                                                            <span>/{company.default_slug || company.slug}</span>
                                                            <Copy className="size-3 opacity-60 group-hover/link:opacity-100" />
                                                        </button>
                                                        <button
                                                            onClick={() => copyLink(company.generic_slug || company.slug)}
                                                            className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors group/link"
                                                            title={`Copy white-labeled link: /${company.generic_slug || company.slug}`}
                                                        >
                                                            <span>/{company.generic_slug || company.slug}</span>
                                                            <Copy className="size-3 opacity-60 group-hover/link:opacity-100" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyLink(company.slug)}
                                                        className="h-8 rounded-lg text-xs font-mono font-bold text-violet-600 hover:text-violet-700 hover:bg-violet-50 gap-1.5"
                                                        title={`Copy ordering link: /${company.slug}`}
                                                    >
                                                        <Copy className="size-3.5" />
                                                        /{company.slug}
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground font-medium">
                                                {formatDateUS(company.created_at)}
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger className="size-8 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 inline-flex items-center justify-center transition-colors">
                                                        <MoreHorizontal className="size-4" />
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
                                                    <div className="px-10 py-6 bg-white shadow-inner">
                                                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                                            {/* Column 1: Partner Details + Contract */}
                                                            <div className="lg:col-span-5 space-y-4">
                                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                    <Building2 className="size-3.5 text-violet-500" /> Partner Profile
                                                                </div>
                                                                <div className="space-y-3.5 bg-gray-50/50 rounded-2xl p-4 border border-gray-100">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="size-7 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600 shrink-0">
                                                                            <Mail className="size-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Email Address</p>
                                                                            <p className="text-xs font-bold text-gray-900 truncate">{company.email}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="size-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                                                            <Phone className="size-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Phone Contact</p>
                                                                            <p className="text-xs font-bold text-gray-900">{company.phone || 'Not provided'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="size-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                                            <User className="size-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Legal Representative</p>
                                                                            <p className="text-xs font-bold text-gray-900">{company.representative_name ? formatTitleCase(company.representative_name) : 'Not provided'}{company.representative_title ? ` (${formatTitleCase(company.representative_title)})` : ''}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="size-7 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                                                            <MapPin className="size-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Mailing Address</p>
                                                                            <p className="text-xs font-bold text-gray-900 whitespace-pre-line">{company.mailing_address ? formatTitleCase(company.mailing_address) : 'Not provided'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-3">
                                                                        <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                                            <Globe className="size-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Public Slug(s)</p>
                                                                            {company.company_app_config?.use_mountain_mamas_branding ? (
                                                                                <div className="space-y-0.5">
                                                                                    <p className="text-xs font-mono text-blue-600 font-bold">Default: /{company.default_slug || company.slug}</p>
                                                                                    <p className="text-xs font-mono text-blue-600 font-bold">White-labeled: /{company.generic_slug || company.slug}</p>
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-xs font-mono text-blue-600 font-bold">/{company.slug}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-start gap-3 pt-1 border-t border-gray-100">
                                                                        <div className="size-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                                            <FileText className="size-3.5" />
                                                                        </div>
                                                                        <div className="min-w-0 flex-1">
                                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Signed Agreement</p>
                                                                            {company.contracts && company.contracts.length > 0 ? (
                                                                                <div className="flex flex-wrap gap-2 mt-1">
                                                                                    {company.contracts.map((contract: any) => (
                                                                                        <a 
                                                                                            key={contract.id} 
                                                                                            href={contract.pdf_url || `/admin/companies/contracts/${contract.id}`} 
                                                                                            target="_blank" 
                                                                                            rel="noopener noreferrer"
                                                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-xs font-bold text-blue-700 hover:bg-blue-100 hover:border-blue-200 transition-all"
                                                                                            title="View / Print Signed Contract"
                                                                                        >
                                                                                            <FileText className="size-3" />
                                                                                            <span>{contract.status === 'signed' ? (contract.signed_at ? `Signed (${formatDateUS(contract.signed_at)})` : 'Signed Contract') : 'Contract (Pending)'}</span>
                                                                                            <ExternalLink className="size-3 text-blue-500" />
                                                                                        </a>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <p className="text-xs font-medium text-gray-400 mt-0.5">No active contract</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Column 2: Invoices in Table Format */}
                                                            <div className="lg:col-span-7 space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                        <CreditCard className="size-3.5 text-emerald-500" /> Invoices ({company.invoices?.length || 0})
                                                                    </div>
                                                                </div>

                                                                {company.invoices && company.invoices.length > 0 ? (
                                                                    <div className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                                                                        <table className="w-full text-left border-collapse text-xs">
                                                                            <thead>
                                                                                <tr className="bg-gray-50/80 border-b border-gray-100 text-[10px] font-black uppercase tracking-wider text-gray-400">
                                                                                    <th className="py-2.5 px-3">Date</th>
                                                                                    <th className="py-2.5 px-3">Amount</th>
                                                                                    <th className="py-2.5 px-3">Status</th>
                                                                                    <th className="py-2.5 px-3 text-right">Link / Actions</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody className="divide-y divide-gray-50 font-medium">
                                                                                {company.invoices.map((invoice: any) => (
                                                                                    <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                                                                                        <td className="py-2.5 px-3 text-gray-600 font-bold whitespace-nowrap">
                                                                                            {formatDateUS(invoice.created_at)}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 font-black text-gray-900 whitespace-nowrap">
                                                                                            ${invoice.total_amount.toFixed(2)}
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                                                            <span className={cn(
                                                                                                "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                                                                                                invoice.status === 'paid' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                                                                            )}>
                                                                                                {invoice.status}
                                                                                            </span>
                                                                                        </td>
                                                                                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                                            <div className="inline-flex items-center gap-1 justify-end">
                                                                                                {invoice.pdf_url && (
                                                                                                    <a 
                                                                                                        href={invoice.pdf_url} 
                                                                                                        target="_blank" 
                                                                                                        rel="noopener noreferrer"
                                                                                                        className="size-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 transition-all cursor-pointer"
                                                                                                        title="Download Stripe PDF"
                                                                                                    >
                                                                                                        <FileText className="size-3.5" />
                                                                                                    </a>
                                                                                                )}
                                                                                                {invoice.stripe_payment_link && (
                                                                                                    <button 
                                                                                                        onClick={() => {
                                                                                                            const link = invoice.status === 'draft' ? invoice.stripe_payment_link : `${window.location.origin}/invoice/${invoice.id}/pay`;
                                                                                                            navigator.clipboard.writeText(link);
                                                                                                            toast.success(invoice.status === 'draft' ? 'Stripe draft link copied!' : 'Payment link copied to clipboard!');
                                                                                                        }}
                                                                                                        className="size-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                                                                                                        title={invoice.status === 'draft' ? "Copy Stripe Draft Link" : "Copy Payment Link"}
                                                                                                    >
                                                                                                        <Copy className="size-3.5" />
                                                                                                    </button>
                                                                                                )}
                                                                                                <button 
                                                                                                    onClick={() => setInvoiceToDelete({ id: invoice.id, amount: invoice.total_amount, companyId: company.id })}
                                                                                                    className="size-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                                                                                    title="Delete Invoice & Reset Orders"
                                                                                                >
                                                                                                    <Trash2 className="size-3.5" />
                                                                                                </button>
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs font-medium bg-gray-50/50">
                                                                        <CreditCard className="size-6 mb-2 opacity-20" />
                                                                        No invoices found.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Optional notes/instructions */}
                                                        {company.prep_instructions && (
                                                            <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                                                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                                                    <FileText className="size-3.5 text-gray-500" /> Prep & Packaging Profile
                                                                </div>
                                                                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{company.prep_instructions}</p>
                                                            </div>
                                                        )}
                                                        {company.company_app_config?.custom_welcome_message && (
                                                            <div className="mt-3 p-4 rounded-2xl bg-violet-50/30 border border-violet-100/60 space-y-1.5">
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
                                <div className="space-y-1.5">
                                    <Label htmlFor="mailing_address" className="text-xs font-bold text-gray-700">Mailing / Delivery Address</Label>
                                    <textarea 
                                        id="mailing_address" 
                                        name="mailing_address" 
                                        rows={2}
                                        placeholder="Street address, Suite / PO Box, City, State, ZIP"
                                        value={mailingAddress || ''} 
                                        onChange={(e) => setMailingAddress(e.target.value)}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
                                    />
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
                                    <Textarea 
                                        id="custom_welcome_message" 
                                        name="custom_welcome_message" 
                                        placeholder="e.g. Please place your family's order for your tour in Yellowstone..."
                                        value={customWelcomeMessage} 
                                        onChange={(e) => setCustomWelcomeMessage(e.target.value)} 
                                        rows={3}
                                        className="resize-none"
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
