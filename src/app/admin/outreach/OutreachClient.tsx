'use client';

import { useState, useRef, useCallback, useTransition, useEffect } from 'react';
import {
    Upload, Search, Send, Trash2, UserPlus, X, Mail,
    CheckCircle2, Clock, XCircle, ArrowRight, FileSpreadsheet,
    MoreHorizontal, ExternalLink, Phone, MapPin, Globe,
    AlertCircle, ChevronDown, Loader2, StickyNote, Plus, Pencil
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
    importLeadsFromCSV,
    deleteOutreachLead,
    deleteMultipleLeads,
    sendCampaignEmailToLead,
    convertLeadToPartner,
    updateLeadNotes,
    updateLeadStatus,
    createOutreachLead,
    updateOutreachLead,
    getCampaignPreviewHtml,
} from './actions';

// ---- Types ----
interface Lead {
    id: string;
    company_name: string;
    phone: string | null;
    email: string;
    website: string | null;
    home_base: string | null;
    state: string | null;
    primary_gate: string | null;
    tour_type: string | null;
    season: string | null;
    status: string;
    last_contacted_at: string | null;
    follow_up_date: string | null;
    notes: string | null;
    partnership_notes: string | null;
    created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    not_contacted: { label: 'Not Contacted', color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', icon: Clock },
    emailed: { label: 'Emailed', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Mail },
    responded: { label: 'Responded', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: CheckCircle2 },
    converted: { label: 'Converted', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: UserPlus },
    rejected: { label: 'Rejected', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
};

export function OutreachClient({ initialLeads }: { initialLeads: Lead[] }) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showImportModal, setShowImportModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
    const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
    const [showConvertConfirm, setShowConvertConfirm] = useState<string | null>(null);
    const [editingNotes, setEditingNotes] = useState<string | null>(null);
    const [notesValue, setNotesValue] = useState('');
    const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

    // Create / Edit Lead modal state
    const [showCampaignModal, setShowCampaignModal] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('short_intro');
    const [previewHtml, setPreviewHtml] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [campaignTargetIds, setCampaignTargetIds] = useState<string[]>([]);
    
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerWidth, setContainerWidth] = useState(600);

    useEffect(() => {
        if (!containerRef.current || !showCampaignModal) return;
        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, [showCampaignModal]);

    const [showLeadFormModal, setShowLeadFormModal] = useState(false);
    const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
    const emptyForm = { company_name: '', email: '', phone: '', website: '', home_base: '', state: '', primary_gate: '', tour_type: '', season: '', notes: '', partnership_notes: '' };
    const [leadForm, setLeadForm] = useState(emptyForm);

    const openCreateModal = () => {
        setEditingLeadId(null);
        setLeadForm(emptyForm);
        setShowLeadFormModal(true);
    };

    const openEditModal = (lead: Lead) => {
        setEditingLeadId(lead.id);
        setLeadForm({
            company_name: lead.company_name || '',
            email: lead.email || '',
            phone: lead.phone || '',
            website: lead.website || '',
            home_base: lead.home_base || '',
            state: lead.state || '',
            primary_gate: lead.primary_gate || '',
            tour_type: lead.tour_type || '',
            season: lead.season || '',
            notes: lead.notes || '',
            partnership_notes: lead.partnership_notes || '',
        });
        setShowLeadFormModal(true);
    };

    const handleLeadFormSubmit = async () => {
        if (!leadForm.company_name || !leadForm.email) {
            toast.error('Company name and email are required.');
            return;
        }
        startTransition(async () => {
            if (editingLeadId) {
                // Update
                const result = await updateOutreachLead(editingLeadId, leadForm);
                if (result.success && result.data) {
                    setLeads(prev => prev.map(l => l.id === editingLeadId ? { ...l, ...result.data } : l));
                    toast.success('Lead updated successfully');
                } else {
                    toast.error(result.error || 'Failed to update lead');
                    return;
                }
            } else {
                // Create
                const result = await createOutreachLead(leadForm);
                if (result.success && result.data) {
                    setLeads(prev => [result.data, ...prev]);
                    toast.success('Lead created successfully');
                } else {
                    toast.error(result.error || 'Failed to create lead');
                    return;
                }
            }
            setShowLeadFormModal(false);
            setEditingLeadId(null);
            setLeadForm(emptyForm);
        });
    };

    // Campaign sending state
    const [isSendingCampaign, setIsSendingCampaign] = useState(false);
    const [campaignProgress, setCampaignProgress] = useState({ current: 0, total: 0 });
    const [campaignCurrentName, setCampaignCurrentName] = useState('');

    const [isPending, startTransition] = useTransition();

    // ---- Filtering ----
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = search === '' ||
            lead.company_name.toLowerCase().includes(search.toLowerCase()) ||
            lead.email.toLowerCase().includes(search.toLowerCase()) ||
            (lead.home_base && lead.home_base.toLowerCase().includes(search.toLowerCase()));
        const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // ---- Selection ----
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredLeads.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredLeads.map(l => l.id)));
        }
    };

    // ---- CSV Import ----
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importLoading, setImportLoading] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLoading(true);

        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            complete: async (results) => {
                const allRows = results.data as string[][];
                if (allRows.length < 2) {
                    toast.error('CSV file must have headers and at least one data row.');
                    setImportLoading(false);
                    return;
                }

                const headers = allRows[0];
                const dataRows = allRows.slice(1);

                const result = await importLeadsFromCSV(headers, dataRows);

                if (result.success) {
                    toast.success(`Imported ${result.imported} leads (${result.skipped} skipped)`);
                    // Refresh the leads list
                    window.location.reload();
                } else {
                    toast.error(result.error || 'Import failed');
                }

                setImportLoading(false);
                setShowImportModal(false);
            },
            error: (err) => {
                toast.error('Failed to parse CSV: ' + err.message);
                setImportLoading(false);
            },
        });

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // ---- Delete ----
    const handleDeleteLead = async (id: string) => {
        startTransition(async () => {
            const result = await deleteOutreachLead(id);
            if (result.success) {
                setLeads(prev => prev.filter(l => l.id !== id));
                toast.success('Lead deleted');
            } else {
                toast.error(result.error || 'Delete failed');
            }
            setShowDeleteConfirm(null);
        });
    };

    const handleBulkDelete = async () => {
        const ids = Array.from(selectedIds);
        startTransition(async () => {
            const result = await deleteMultipleLeads(ids);
            if (result.success) {
                setLeads(prev => prev.filter(l => !selectedIds.has(l.id)));
                setSelectedIds(new Set());
                toast.success(`${ids.length} leads deleted`);
            } else {
                toast.error(result.error || 'Bulk delete failed');
            }
            setShowBulkDeleteConfirm(false);
        });
    };

    // ---- Preview Generation ----
    const updatePreview = useCallback(async (templateId: string, companyName: string) => {
        setPreviewLoading(true);
        try {
            const result = await getCampaignPreviewHtml(companyName, templateId);
            if (result.success && result.html) {
                setPreviewHtml(result.html);
            }
        } catch (e) {
            console.error('Failed to get campaign preview', e);
        } finally {
            setPreviewLoading(false);
        }
    }, []);

    // ---- Send Campaign ----
    const handleSendCampaign = () => {
        const targetIds = Array.from(selectedIds);
        const targetLeads = leads.filter(l => targetIds.includes(l.id) && l.status !== 'converted');

        if (targetLeads.length === 0) {
            toast.error('No eligible leads selected (converted leads are excluded)');
            return;
        }

        setCampaignTargetIds(targetLeads.map(l => l.id));
        setSelectedTemplateId('short_intro');
        setShowCampaignModal(true);
        updatePreview('short_intro', targetLeads[0].company_name);
    };

    const handleSingleLeadCampaign = (lead: Lead) => {
        setCampaignTargetIds([lead.id]);
        setSelectedTemplateId('short_intro');
        setShowCampaignModal(true);
        updatePreview('short_intro', lead.company_name);
    };

    const executeCampaignSending = async () => {
        setShowCampaignModal(false);
        const targetLeads = leads.filter(l => campaignTargetIds.includes(l.id));

        setIsSendingCampaign(true);
        setCampaignProgress({ current: 0, total: targetLeads.length });

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < targetLeads.length; i++) {
            const lead = targetLeads[i];
            setCampaignProgress({ current: i + 1, total: targetLeads.length });
            setCampaignCurrentName(lead.company_name);

            const result = await sendCampaignEmailToLead(lead.id, selectedTemplateId);

            if (result.success) {
                successCount++;
                setLeads(prev =>
                    prev.map(l => l.id === lead.id
                        ? { ...l, status: 'emailed', last_contacted_at: new Date().toISOString() }
                        : l
                    )
                );
            } else {
                failCount++;
            }

            // Small delay between emails to avoid rate limiting
            if (i < targetLeads.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        setIsSendingCampaign(false);
        setSelectedIds(new Set());
        setCampaignTargetIds([]);

        if (failCount === 0) {
            toast.success(`Campaign sent to ${successCount} leads!`);
        } else {
            toast.warning(`${successCount} sent, ${failCount} failed`);
        }
    };

    // ---- Convert to Partner ----
    const handleConvert = async (id: string) => {
        startTransition(async () => {
            const result = await convertLeadToPartner(id);
            if (result.success) {
                setLeads(prev =>
                    prev.map(l => l.id === id ? { ...l, status: 'converted' } : l)
                );
                toast.success('Lead converted to partner! Invitation email sent.');
            } else {
                toast.error(result.error || 'Conversion failed');
            }
            setShowConvertConfirm(null);
        });
    };

    // ---- Notes ----
    const handleSaveNotes = async (id: string) => {
        startTransition(async () => {
            const result = await updateLeadNotes(id, notesValue);
            if (result.success) {
                setLeads(prev =>
                    prev.map(l => l.id === id ? { ...l, notes: notesValue } : l)
                );
                toast.success('Notes saved');
            } else {
                toast.error('Failed to save notes');
            }
            setEditingNotes(null);
        });
    };

    // ---- Status Update ----
    const handleStatusChange = async (id: string, newStatus: string) => {
        startTransition(async () => {
            const result = await updateLeadStatus(id, newStatus);
            if (result.success) {
                setLeads(prev =>
                    prev.map(l => l.id === id ? { ...l, status: newStatus } : l)
                );
            } else {
                toast.error('Failed to update status');
            }
            setActionMenuOpen(null);
        });
    };

    // ---- Stats ----
    const stats = {
        total: leads.length,
        not_contacted: leads.filter(l => l.status === 'not_contacted').length,
        emailed: leads.filter(l => l.status === 'emailed').length,
        responded: leads.filter(l => l.status === 'responded').length,
        converted: leads.filter(l => l.status === 'converted').length,
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                    Outreach Campaign Manager
                </h1>
                <p className="text-sm text-gray-500 font-medium">
                    Manage tour company prospects and send email campaigns via Brevo.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                    { label: 'Total Leads', value: stats.total, color: 'from-violet-500 to-purple-600', textColor: 'text-white' },
                    { label: 'Not Contacted', value: stats.not_contacted, color: 'from-gray-50 to-gray-100', textColor: 'text-gray-700', borderColor: 'border border-gray-200' },
                    { label: 'Emailed', value: stats.emailed, color: 'from-blue-50 to-blue-100', textColor: 'text-blue-700', borderColor: 'border border-blue-200' },
                    { label: 'Responded', value: stats.responded, color: 'from-amber-50 to-amber-100', textColor: 'text-amber-700', borderColor: 'border border-amber-200' },
                    { label: 'Converted', value: stats.converted, color: 'from-emerald-50 to-emerald-100', textColor: 'text-emerald-700', borderColor: 'border border-emerald-200' },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-2xl bg-gradient-to-br ${stat.color} ${stat.borderColor || ''} p-4 shadow-sm`}>
                        <p className={`text-[11px] font-bold uppercase tracking-wider ${stat.textColor} opacity-70`}>{stat.label}</p>
                        <p className={`text-2xl font-black ${stat.textColor} mt-1`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
                    {/* Search */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search companies, emails..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="appearance-none pl-4 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold bg-gray-50/50 focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none cursor-pointer transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="not_contacted">Not Contacted</option>
                            <option value="emailed">Emailed</option>
                            <option value="responded">Responded</option>
                            <option value="converted">Converted</option>
                            <option value="rejected">Rejected</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {selectedIds.size > 0 && (
                        <>
                            <button
                                onClick={handleSendCampaign}
                                disabled={isSendingCampaign}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl hover:shadow-violet-300 transition-all disabled:opacity-50"
                            >
                                <Send className="size-4" />
                                Send Campaign ({selectedIds.size})
                            </button>
                            <button
                                onClick={() => setShowBulkDeleteConfirm(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 text-sm font-bold border border-red-200 hover:bg-red-100 transition-all"
                            >
                                <Trash2 className="size-4" />
                                Delete ({selectedIds.size})
                            </button>
                        </>
                    )}
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-300 transition-all"
                    >
                        <Plus className="size-4" />
                        Add Lead
                    </button>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-700 text-sm font-bold border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                    >
                        <Upload className="size-4" />
                        Import CSV
                    </button>
                </div>
            </div>

            {/* Campaign Progress Bar */}
            <AnimatePresence>
                {isSendingCampaign && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-gradient-to-r from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-5 shadow-sm"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-8 rounded-full bg-violet-100 flex items-center justify-center">
                                <Loader2 className="size-4 text-violet-600 animate-spin" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-violet-900">
                                    Sending Campaign... {campaignProgress.current} of {campaignProgress.total}
                                </p>
                                <p className="text-xs text-violet-600 font-medium">
                                    Currently sending to: {campaignCurrentName}
                                </p>
                            </div>
                        </div>
                        <div className="w-full bg-violet-100 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                                initial={{ width: '0%' }}
                                animate={{
                                    width: `${(campaignProgress.current / campaignProgress.total) * 100}%`,
                                }}
                                transition={{ duration: 0.3 }}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Leads Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {filteredLeads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className="size-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                            <FileSpreadsheet className="size-7 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No leads found</h3>
                        <p className="text-sm text-gray-500 mb-4 max-w-sm">
                            {leads.length === 0
                                ? 'Import your tour company spreadsheet to get started.'
                                : 'No leads match your current filters.'
                            }
                        </p>
                        {leads.length === 0 && (
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all"
                            >
                                <Upload className="size-4" />
                                Import CSV
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-4 py-3 text-left w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === filteredLeads.length && filteredLeads.length > 0}
                                            onChange={toggleSelectAll}
                                            className="size-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Contact</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 hidden lg:table-cell">Location</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</th>
                                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-gray-400 hidden xl:table-cell">Last Contacted</th>
                                    <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredLeads.map((lead) => {
                                    const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.not_contacted;
                                    const StatusIcon = statusConfig.icon;
                                    const isSelected = selectedIds.has(lead.id);

                                    return (
                                        <tr
                                            key={lead.id}
                                            className={`group transition-colors ${
                                                isSelected
                                                    ? 'bg-violet-50/40'
                                                    : 'hover:bg-gray-50/50'
                                            }`}
                                        >
                                            {/* Checkbox */}
                                            <td className="px-4 py-3.5">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSelect(lead.id)}
                                                    className="size-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer accent-violet-600"
                                                />
                                            </td>

                                            {/* Company */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-bold text-gray-900 text-[14px] leading-tight">
                                                        {lead.company_name}
                                                    </span>
                                                    {lead.tour_type && (
                                                        <span className="text-[11px] text-gray-400 font-medium">{lead.tour_type}</span>
                                                    )}
                                                    {lead.notes && (
                                                        <span className="text-[11px] text-violet-500 font-medium flex items-center gap-1 mt-0.5">
                                                            <StickyNote className="size-3" />
                                                            {lead.notes.length > 40 ? lead.notes.slice(0, 40) + '...' : lead.notes}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Contact */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex flex-col gap-1">
                                                    <a
                                                        href={`mailto:${lead.email}`}
                                                        className="text-[13px] font-semibold text-gray-700 hover:text-violet-600 transition-colors truncate max-w-[200px] inline-block"
                                                        title={lead.email}
                                                    >
                                                        {lead.email}
                                                    </a>
                                                    {lead.phone && (
                                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Phone className="size-3" />
                                                            {lead.phone}
                                                        </span>
                                                    )}
                                                    {lead.website && (
                                                        <a
                                                            href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1 transition-colors"
                                                        >
                                                            <Globe className="size-3" />
                                                            Website
                                                        </a>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Location */}
                                            <td className="px-4 py-3.5 hidden lg:table-cell">
                                                <div className="flex flex-col gap-0.5">
                                                    {lead.home_base && (
                                                        <span className="text-[13px] text-gray-600 font-medium flex items-center gap-1">
                                                            <MapPin className="size-3 text-gray-400" />
                                                            {lead.home_base}{lead.state ? `, ${lead.state}` : ''}
                                                        </span>
                                                    )}
                                                    {lead.primary_gate && (
                                                        <span className="text-[11px] text-gray-400 font-medium">
                                                            Gate: {lead.primary_gate}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusConfig.color} ${statusConfig.bg} ${statusConfig.border} border`}>
                                                    <StatusIcon className="size-3" />
                                                    {statusConfig.label}
                                                </span>
                                            </td>

                                            {/* Last Contacted */}
                                            <td className="px-4 py-3.5 hidden xl:table-cell">
                                                <span className="text-[13px] text-gray-500 font-medium">
                                                    {lead.last_contacted_at
                                                        ? new Date(lead.last_contacted_at).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric',
                                                        })
                                                        : ' - '
                                                    }
                                                </span>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-4 py-3.5 text-right">
                                                <div className="relative inline-block">
                                                    <button
                                                        onClick={() => setActionMenuOpen(actionMenuOpen === lead.id ? null : lead.id)}
                                                        className="inline-flex items-center justify-center size-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                    </button>

                                                    {/* Dropdown Menu */}
                                                    <AnimatePresence>
                                                        {actionMenuOpen === lead.id && (
                                                            <>
                                                                <div
                                                                    className="fixed inset-0 z-40"
                                                                    onClick={() => setActionMenuOpen(null)}
                                                                />
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    className="absolute right-0 top-10 z-50 w-52 bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 py-1.5 overflow-hidden"
                                                                >
                                                                    {lead.status !== 'emailed' && lead.status !== 'converted' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setActionMenuOpen(null);
                                                                                handleSingleLeadCampaign(lead);
                                                                            }}
                                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-violet-50 hover:text-violet-700 transition-colors"
                                                                        >
                                                                            <Send className="size-4" />
                                                                            Send Campaign Email
                                                                        </button>
                                                                    )}

                                                                    {lead.status !== 'converted' && (
                                                                        <button
                                                                            onClick={() => {
                                                                                setActionMenuOpen(null);
                                                                                setShowConvertConfirm(lead.id);
                                                                            }}
                                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                                                        >
                                                                            <UserPlus className="size-4" />
                                                                            Convert to Partner
                                                                        </button>
                                                                    )}

                                                                    {/* Status changes */}
                                                                    {lead.status !== 'not_contacted' && lead.status !== 'converted' && (
                                                                        <button
                                                                            onClick={() => handleStatusChange(lead.id, 'not_contacted')}
                                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 hover:text-gray-700 transition-colors"
                                                                        >
                                                                            <Clock className="size-4" />
                                                                            Mark Not Contacted
                                                                        </button>
                                                                    )}

                                                                    {lead.status !== 'responded' && lead.status !== 'converted' && (
                                                                        <button
                                                                            onClick={() => handleStatusChange(lead.id, 'responded')}
                                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                                                                        >
                                                                            <CheckCircle2 className="size-4" />
                                                                            Mark as Responded
                                                                        </button>
                                                                    )}

                                                                    {lead.status !== 'rejected' && lead.status !== 'converted' && (
                                                                        <button
                                                                            onClick={() => handleStatusChange(lead.id, 'rejected')}
                                                                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                                                                        >
                                                                            <XCircle className="size-4" />
                                                                            Mark as Rejected
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        onClick={() => {
                                                                            setActionMenuOpen(null);
                                                                            openEditModal(lead);
                                                                        }}
                                                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                                    >
                                                                        <Pencil className="size-4" />
                                                                        Edit Details
                                                                    </button>

                                                                    <button
                                                                        onClick={() => {
                                                                            setActionMenuOpen(null);
                                                                            setEditingNotes(lead.id);
                                                                            setNotesValue(lead.notes || '');
                                                                        }}
                                                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <StickyNote className="size-4" />
                                                                        Edit Notes
                                                                    </button>

                                                                    <div className="border-t border-gray-100 my-1" />

                                                                    <button
                                                                        onClick={() => {
                                                                            setActionMenuOpen(null);
                                                                            setShowDeleteConfirm(lead.id);
                                                                        }}
                                                                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                        Delete Lead
                                                                    </button>
                                                                </motion.div>
                                                            </>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Footer */}
                {filteredLeads.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between text-xs text-gray-400 font-semibold">
                        <span>
                            Showing {filteredLeads.length} of {leads.length} leads
                        </span>
                        {selectedIds.size > 0 && (
                            <span className="text-violet-600">
                                {selectedIds.size} selected
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* =================== MODALS =================== */}

            {/* Import CSV Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowImportModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <FileSpreadsheet className="size-5 text-violet-600" />
                                    Import CSV
                                </h2>
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="size-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                                Upload your tour company spreadsheet (CSV format). Columns like
                                <strong> Company Name</strong>, <strong>Email</strong>, <strong>Phone</strong>,
                                <strong> Website</strong>, <strong>Home Base</strong>, <strong>State</strong>, and
                                <strong> Tour Type</strong> will be automatically mapped.
                            </p>

                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-violet-300 hover:bg-violet-50/30 transition-all cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {importLoading ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="size-8 text-violet-500 animate-spin" />
                                        <p className="text-sm font-bold text-violet-600">Processing...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="size-14 rounded-2xl bg-violet-100 flex items-center justify-center">
                                            <Upload className="size-6 text-violet-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Click to upload CSV</p>
                                            <p className="text-xs text-gray-400 mt-1">Supports .csv files exported from Excel or Google Sheets</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirm Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full p-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="size-5 text-red-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Delete Lead?</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-5">
                                This lead will be permanently removed. This action cannot be undone.
                            </p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteLead(showDeleteConfirm)}
                                    disabled={isPending}
                                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {isPending ? 'Deleting...' : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bulk Delete Confirm Modal */}
            <AnimatePresence>
                {showBulkDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowBulkDeleteConfirm(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-sm w-full p-6"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className="size-10 rounded-xl bg-red-100 flex items-center justify-center">
                                    <AlertCircle className="size-5 text-red-600" />
                                </div>
                                <h2 className="text-lg font-bold text-gray-900">Delete {selectedIds.size} Leads?</h2>
                            </div>
                            <p className="text-sm text-gray-500 mb-5">
                                All selected leads will be permanently removed. This cannot be undone.
                            </p>
                            <div className="flex gap-2 justify-end">
                                <button
                                    onClick={() => setShowBulkDeleteConfirm(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={isPending}
                                    className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {isPending ? 'Deleting...' : `Delete ${selectedIds.size} Leads`}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Convert to Partner Confirm Modal */}
            <AnimatePresence>
                {showConvertConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowConvertConfirm(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6"
                        >
                            {(() => {
                                const lead = leads.find(l => l.id === showConvertConfirm);
                                return (
                                    <>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="size-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                                                <UserPlus className="size-5 text-emerald-600" />
                                            </div>
                                            <div>
                                                <h2 className="text-lg font-bold text-gray-900">Convert to Partner</h2>
                                                <p className="text-[13px] text-gray-500 font-medium">{lead?.company_name}</p>
                                            </div>
                                        </div>

                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5 text-sm text-emerald-800 space-y-2">
                                            <p className="font-bold">This will:</p>
                                            <ul className="list-disc list-inside space-y-1 text-[13px]">
                                                <li>Create a new tour company in the system</li>
                                                <li>Set payment method to <strong>Monthly Invoice</strong></li>
                                                <li>Initialize their menu and app settings</li>
                                                <li>Create a login account and send invitation email</li>
                                                <li>Mark this lead as &quot;Converted&quot;</li>
                                            </ul>
                                        </div>

                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setShowConvertConfirm(null)}
                                                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleConvert(showConvertConfirm)}
                                                disabled={isPending}
                                                className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                                            >
                                                {isPending ? (
                                                    <>
                                                        <Loader2 className="size-4 animate-spin" />
                                                        Converting...
                                                    </>
                                                ) : (
                                                    <>
                                                        Convert <ArrowRight className="size-4" />
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Notes Modal */}
            <AnimatePresence>
                {editingNotes && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setEditingNotes(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full p-6"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <StickyNote className="size-5 text-violet-600" />
                                    Edit Notes
                                </h2>
                                <button
                                    onClick={() => setEditingNotes(null)}
                                    className="size-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 mb-3 font-medium">
                                {leads.find(l => l.id === editingNotes)?.company_name}
                            </p>
                            <textarea
                                value={notesValue}
                                onChange={(e) => setNotesValue(e.target.value)}
                                placeholder="Add notes about this lead..."
                                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
                            />
                            <div className="flex gap-2 justify-end mt-4">
                                <button
                                    onClick={() => setEditingNotes(null)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleSaveNotes(editingNotes)}
                                    disabled={isPending}
                                    className="px-4 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all disabled:opacity-50"
                                >
                                    {isPending ? 'Saving...' : 'Save Notes'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create / Edit Lead Modal */}
            <AnimatePresence>
                {showLeadFormModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowLeadFormModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    {editingLeadId ? (
                                        <><Pencil className="size-5 text-blue-600" /> Edit Lead</>
                                    ) : (
                                        <><Plus className="size-5 text-emerald-600" /> Add New Lead</>
                                    )}
                                </h2>
                                <button
                                    onClick={() => setShowLeadFormModal(false)}
                                    className="size-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Row 1: Company Name */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Company Name *</label>
                                    <input
                                        type="text"
                                        value={leadForm.company_name}
                                        onChange={(e) => setLeadForm(f => ({ ...f, company_name: e.target.value }))}
                                        placeholder="e.g. Yellowstone Tour Guides"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                    />
                                </div>

                                {/* Row 2: Email */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Email *</label>
                                    <input
                                        type="email"
                                        value={leadForm.email}
                                        onChange={(e) => setLeadForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder="info@company.com"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                    />
                                </div>

                                {/* Row 3: Phone & Website */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Phone</label>
                                        <input
                                            type="text"
                                            value={leadForm.phone}
                                            onChange={(e) => setLeadForm(f => ({ ...f, phone: e.target.value }))}
                                            placeholder="406-555-1234"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Website</label>
                                        <input
                                            type="text"
                                            value={leadForm.website}
                                            onChange={(e) => setLeadForm(f => ({ ...f, website: e.target.value }))}
                                            placeholder="https://company.com"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Row 4: Home Base & State */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Home Base</label>
                                        <input
                                            type="text"
                                            value={leadForm.home_base}
                                            onChange={(e) => setLeadForm(f => ({ ...f, home_base: e.target.value }))}
                                            placeholder="West Yellowstone"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">State</label>
                                        <input
                                            type="text"
                                            value={leadForm.state}
                                            onChange={(e) => setLeadForm(f => ({ ...f, state: e.target.value }))}
                                            placeholder="MT"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Row 5: Primary Gate & Tour Type */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Primary Gate</label>
                                        <input
                                            type="text"
                                            value={leadForm.primary_gate}
                                            onChange={(e) => setLeadForm(f => ({ ...f, primary_gate: e.target.value }))}
                                            placeholder="West"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Tour Type</label>
                                        <input
                                            type="text"
                                            value={leadForm.tour_type}
                                            onChange={(e) => setLeadForm(f => ({ ...f, tour_type: e.target.value }))}
                                            placeholder="Sightseeing"
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                {/* Row 6: Season */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Season</label>
                                    <input
                                        type="text"
                                        value={leadForm.season}
                                        onChange={(e) => setLeadForm(f => ({ ...f, season: e.target.value }))}
                                        placeholder="Summer"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all"
                                    />
                                </div>

                                {/* Row 7: Notes */}
                                <div>
                                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Notes</label>
                                    <textarea
                                        value={leadForm.notes}
                                        onChange={(e) => setLeadForm(f => ({ ...f, notes: e.target.value }))}
                                        placeholder="Internal notes about this lead..."
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium bg-gray-50/50 focus:bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 outline-none transition-all resize-none"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setShowLeadFormModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleLeadFormSubmit}
                                    disabled={isPending}
                                    className={`px-5 py-2.5 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50 inline-flex items-center gap-2 ${
                                        editingLeadId
                                            ? 'bg-blue-600 hover:bg-blue-700'
                                            : 'bg-emerald-600 hover:bg-emerald-700'
                                    }`}
                                >
                                    {isPending ? (
                                        <><Loader2 className="size-4 animate-spin" /> {editingLeadId ? 'Updating...' : 'Creating...'}</>
                                    ) : (
                                        editingLeadId ? 'Save Changes' : 'Create Lead'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Campaign Selector & Live Preview Modal */}
            <AnimatePresence>
                {showCampaignModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
                        onClick={() => setShowCampaignModal(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-5xl w-full h-[85vh] flex flex-col overflow-hidden"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                        <Mail className="size-5 text-violet-600" />
                                        Customize Campaign
                                    </h2>
                                    <p className="text-xs text-gray-500 font-semibold mt-0.5">
                                        Select an email template, preview how it looks, and send to {campaignTargetIds.length} recipient{campaignTargetIds.length > 1 ? 's' : ''}.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowCampaignModal(false)}
                                    className="size-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-all"
                                >
                                    <X className="size-4" />
                                </button>
                            </div>

                            {/* Modal Content Columns */}
                            <div className="flex-1 flex overflow-hidden">
                                {/* Left Side: Template Selector */}
                                <div className="w-[320px] flex-shrink-0 border-r border-gray-100 p-5 overflow-y-auto space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">Choose Email Template</label>
                                        <div className="space-y-2.5">
                                            {[
                                                {
                                                    id: 'short_intro',
                                                    title: 'Friendly First Touch',
                                                    desc: 'Personal, high-delivery text-only email.',
                                                    icon: '👋',
                                                    theme: 'text-violet-600 bg-violet-50 border-violet-100'
                                                },
                                                {
                                                    id: 'social_proof',
                                                    title: 'Trust Builder',
                                                    desc: 'Dual-stats & testimonial for warm prospects.',
                                                    icon: '⭐',
                                                    theme: 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                                },
                                                {
                                                    id: 'seasonal_urgency',
                                                    title: 'Season Opener',
                                                    desc: 'Time-sensitive urgency notice for 2026.',
                                                    icon: '🔥',
                                                    theme: 'text-orange-600 bg-orange-50 border-orange-100'
                                                }
                                            ].map((tpl) => {
                                                const isSelected = selectedTemplateId === tpl.id;
                                                return (
                                                    <div
                                                        key={tpl.id}
                                                        onClick={() => {
                                                            setSelectedTemplateId(tpl.id);
                                                            const firstLead = leads.find(l => campaignTargetIds.includes(l.id));
                                                            if (firstLead) {
                                                                updatePreview(tpl.id, firstLead.company_name);
                                                            }
                                                        }}
                                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                            isSelected
                                                                ? 'border-violet-600 bg-violet-50/20 shadow-sm shadow-violet-100'
                                                                : 'border-gray-150 bg-white hover:border-gray-300'
                                                        }`}
                                                    >
                                                        <div className="flex gap-2.5 items-center">
                                                            <div className="size-8 rounded-lg bg-white flex items-center justify-center text-base shadow-sm border border-gray-100 flex-shrink-0">
                                                                {tpl.icon}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className={`text-xs font-bold truncate ${isSelected ? 'text-violet-900' : 'text-gray-900'}`}>{tpl.title}</h3>
                                                                <p className="text-[10px] text-gray-500 font-medium truncate mt-0.5">{tpl.desc}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Email Preview Container */}
                                <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden">
                                    {/* Real Sandbox Sandbox Iframe */}
                                    <div ref={containerRef} className="flex-1 p-6 flex items-center justify-center overflow-hidden">
                                        {previewLoading ? (
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Loader2 className="size-6 text-violet-600 animate-spin" />
                                                <span className="text-xs text-gray-400 font-bold">Rendering preview...</span>
                                            </div>
                                        ) : (
                                            <motion.div
                                                className="bg-white shadow-md border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 flex flex-col w-full h-full max-w-4xl"
                                                layout
                                            >
                                                <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center gap-1.5">
                                                    <div className="size-2.5 rounded-full bg-red-400" />
                                                    <div className="size-2.5 rounded-full bg-yellow-400" />
                                                    <div className="size-2.5 rounded-full bg-green-400" />
                                                    <span className="text-[10px] text-gray-400 font-bold ml-2 truncate">
                                                        Subject: {
                                                            ((): string => {
                                                                const rawCompany = leads.find(l => campaignTargetIds.includes(l.id))?.company_name || 'Your Company';
                                                                const firstCompany = rawCompany.replace(/\s*#\s*\d+\s*$/, '').trim();
                                                                const subjects: Record<string, string> = {
                                                                    short_intro: `Quick question about ${firstCompany}'s Yellowstone tour lunches`,
                                                                    social_proof: "How Yellowstone tour companies are solving the lunch problem",
                                                                    seasonal_urgency: `⛰️ 2026 Yellowstone season is here - secure your lunch partner spot`,
                                                                };
                                                                return subjects[selectedTemplateId] || "Mountain Mama's Coffeehouse & Bakery - Yellowstone Tour Operator Box Lunch Program";
                                                            })()
                                                        }
                                                    </span>
                                                </div>
                                                <div className="flex-1 bg-white relative overflow-hidden flex items-center justify-center">
                                                    {containerWidth < 640 ? (
                                                        <div className="w-full h-full overflow-hidden relative">
                                                            <iframe
                                                                title="Email Preview"
                                                                srcDoc={previewHtml}
                                                                className="absolute top-0 left-0 origin-top-left border-none bg-white"
                                                                style={{
                                                                    width: '600px',
                                                                    height: `${100 / (containerWidth / 600)}%`,
                                                                    transform: `scale(${containerWidth / 600})`,
                                                                }}
                                                                sandbox="allow-same-origin"
                                                            />
                                                        </div>
                                                    ) : (
                                                        <iframe
                                                            title="Email Preview"
                                                            srcDoc={previewHtml}
                                                            className="w-full h-full border-none bg-white"
                                                            sandbox="allow-same-origin"
                                                        />
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50/50">
                                <button
                                    onClick={() => setShowCampaignModal(false)}
                                    className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeCampaignSending}
                                    disabled={previewLoading || isSendingCampaign}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-bold shadow-lg shadow-violet-200 hover:shadow-xl transition-all disabled:opacity-50 inline-flex items-center gap-2"
                                >
                                    <Send className="size-4" />
                                    Send Campaign to {campaignTargetIds.length} Recipient{campaignTargetIds.length > 1 ? 's' : ''}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
