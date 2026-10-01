'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MoreVertical, Loader2, Users, Lock, Trash2, Edit2, Ban, CheckCircle2, Search } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { 
    createCompanyStaffMember, 
    updateCompanyStaffPermissions, 
    toggleCompanyStaffSuspension, 
    deleteCompanyStaffMember 
} from './actions';
import { formatDateUS } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';

export interface StaffUser {
    id: string;
    email: string | undefined;
    name: string;
    accessible_pages: string[];
    needs_password_change: boolean;
    suspended: boolean;
    created_at: string;
    last_sign_in_at?: string;
}

const AVAILABLE_PAGES = [
    { id: '/company', label: 'Dashboard' },
    { id: '/company/orders', label: 'Orders' },
    { id: '/company/invoices', label: 'Invoices' },
    { id: '/company/manual', label: 'User Manual' },
    { id: '/company/menu', label: 'Menu Management' },
    { id: '/company/ingredients', label: 'Ingredients' },
    { id: '/company/settings', label: 'App Settings' },
    { id: '/company/staff', label: 'Staff Management' },
];

export function CompanyStaffClient({ initialStaff }: { initialStaff: StaffUser[] }) {
    const [staff, setStaff] = useState<StaffUser[]>(initialStaff);
    const [search, setSearch] = useState('');
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    // Add Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedPages, setSelectedPages] = useState<string[]>([
        '/company', 
        '/company/orders', 
        '/company/invoices',
        '/company/menu',
        '/company/ingredients'
    ]);
    const [loading, setLoading] = useState(false);

    // Edit Form State
    const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

    // Dialog Confirmation State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        confirmText: string;
        variant: 'danger' | 'warning' | 'info' | 'success';
        onConfirm: () => Promise<void>;
    }>({
        isOpen: false,
        title: '',
        description: '',
        confirmText: '',
        variant: 'info',
        onConfirm: async () => {},
    });

    async function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createCompanyStaffMember({ name, email, accessible_pages: selectedPages });
            if (result.success) {
                toast.success('Team member created and invitation sent!');
                if (result.warning) toast.warning(result.warning);
                setIsAddOpen(false);
                setName('');
                setEmail('');
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to create team member');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleEditSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!editingUser) return;
        setLoading(true);

        try {
            const result = await updateCompanyStaffPermissions(editingUser.id, selectedPages);
            if (result.success) {
                toast.success('Permissions updated successfully!');
                setStaff(staff.map(s => s.id === editingUser.id ? { ...s, accessible_pages: selectedPages } : s));
                setIsEditOpen(false);
            } else {
                toast.error(result.error || 'Failed to update permissions');
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    }

    function openEdit(user: StaffUser) {
        setEditingUser(user);
        setSelectedPages(user.accessible_pages);
        setIsEditOpen(true);
    }

    function handleTogglePage(pageId: string) {
        setSelectedPages(prev => 
            prev.includes(pageId) 
                ? prev.filter(p => p !== pageId)
                : [...prev, pageId]
        );
    }

    function selectAllPages() {
        setSelectedPages(AVAILABLE_PAGES.map(p => p.id));
    }

    function deselectAllPages() {
        setSelectedPages([]);
    }

    const filteredStaff = staff.filter(user => {
        const q = search.toLowerCase();
        return (
            user.name.toLowerCase().includes(q) ||
            (user.email && user.email.toLowerCase().includes(q))
        );
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 mt-1">Manage team portal access and permissions for your company.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative w-64 hidden sm:block">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input
                            placeholder="Search team members..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 h-10 rounded-xl bg-white border-gray-200"
                        />
                    </div>
                    <Button 
                        onClick={() => {
                            setName('');
                            setEmail('');
                            setSelectedPages(['/company', '/company/orders', '/company/invoices', '/company/menu', '/company/ingredients']);
                            setIsAddOpen(true);
                        }} 
                        className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-100 font-bold h-10 px-4"
                    >
                        <UserPlus className="size-4" /> Add Team Member
                    </Button>
                </div>
            </div>

            {/* Mobile Search */}
            <div className="relative w-full sm:hidden">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                    placeholder="Search team members..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-xl bg-white border-gray-200 w-full"
                />
            </div>

            {/* Staff List */}
            {filteredStaff.length === 0 ? (
                <Card className="p-12 text-center border-none shadow-sm rounded-3xl bg-white">
                    <div className="size-16 rounded-full bg-violet-50 text-violet-600 flex items-center justify-center mx-auto mb-4">
                        <Users className="size-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {search ? 'No team members match your search' : 'No team members yet'}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
                        {search 
                            ? 'Try searching with a different name or email address.' 
                            : 'Add staff members to give your team access to manage orders, invoices, and menus.'}
                    </p>
                    {!search && (
                        <Button 
                            onClick={() => setIsAddOpen(true)} 
                            className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold"
                        >
                            <UserPlus className="size-4" /> Add First Team Member
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map((user) => (
                        <Card 
                            key={user.id} 
                            className={`p-6 border-none shadow-sm rounded-3xl flex flex-col justify-between transition-all bg-white relative group ${
                                user.suspended ? 'opacity-60 bg-gray-50' : 'hover:shadow-md hover:ring-1 hover:ring-violet-200'
                            }`}
                        >
                            <div>
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`size-12 rounded-2xl flex items-center justify-center text-lg font-bold shrink-0 ${
                                            user.suspended ? 'bg-gray-200 text-gray-500' : 'bg-violet-100 text-violet-700'
                                        }`}>
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-gray-900 text-base truncate flex items-center gap-2">
                                                {user.name}
                                                {user.suspended && (
                                                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Suspended</Badge>
                                                )}
                                            </h3>
                                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                        </div>
                                    </div>

                                    {/* Action Dropdown */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="size-8 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 inline-flex items-center justify-center transition-colors outline-none cursor-pointer">
                                            <MoreVertical className="size-4" />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg border-gray-100">
                                            <DropdownMenuItem onClick={() => openEdit(user)} className="gap-2 font-medium cursor-pointer rounded-lg">
                                                <Edit2 className="size-4 text-gray-500" /> Edit Permissions
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setConfirmState({
                                                        isOpen: true,
                                                        title: user.suspended ? 'Activate Team Member?' : 'Suspend Team Member?',
                                                        description: user.suspended 
                                                            ? `Are you sure you want to reactivate access for ${user.name}? They will be able to log in to the portal again.`
                                                            : `Are you sure you want to suspend ${user.name}? They will immediately lose access to the portal.`,
                                                        confirmText: user.suspended ? 'Reactivate' : 'Suspend Member',
                                                        variant: user.suspended ? 'success' : 'warning',
                                                        onConfirm: async () => {
                                                            const result = await toggleCompanyStaffSuspension(user.id, !user.suspended);
                                                            if (result.success) {
                                                                toast.success(user.suspended ? 'Team member reactivated' : 'Team member suspended');
                                                                setStaff(staff.map(s => s.id === user.id ? { ...s, suspended: !user.suspended } : s));
                                                            } else {
                                                                toast.error(result.error || 'Failed to update status');
                                                            }
                                                        }
                                                    });
                                                }}
                                                className={`gap-2 font-medium cursor-pointer rounded-lg ${user.suspended ? 'text-emerald-600 focus:text-emerald-700' : 'text-amber-600 focus:text-amber-700'}`}
                                            >
                                                {user.suspended ? (
                                                    <><CheckCircle2 className="size-4" /> Reactivate Member</>
                                                ) : (
                                                    <><Ban className="size-4" /> Suspend Access</>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator className="my-1 bg-gray-100" />
                                            <DropdownMenuItem 
                                                onClick={() => {
                                                    setConfirmState({
                                                        isOpen: true,
                                                        title: 'Delete Team Member?',
                                                        description: `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
                                                        confirmText: 'Delete Permanently',
                                                        variant: 'danger',
                                                        onConfirm: async () => {
                                                            const result = await deleteCompanyStaffMember(user.id);
                                                            if (result.success) {
                                                                toast.success('Team member deleted');
                                                                setStaff(staff.filter(s => s.id !== user.id));
                                                            } else {
                                                                toast.error(result.error || 'Failed to delete team member');
                                                            }
                                                        }
                                                    });
                                                }}
                                                className="gap-2 font-medium text-red-600 focus:text-red-700 cursor-pointer rounded-lg"
                                            >
                                                <Trash2 className="size-4" /> Delete Member
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* Status Details */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={`text-[11px] font-semibold border ${
                                            user.suspended 
                                                ? 'border-red-200 bg-red-50 text-red-700' 
                                                : user.needs_password_change 
                                                    ? 'border-amber-200 bg-amber-50 text-amber-700' 
                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                        }`}>
                                            {user.suspended ? 'Suspended' : user.needs_password_change ? 'Pending Password Setup' : 'Active Account'}
                                        </Badge>
                                    </div>

                                    {/* Accessible Pages */}
                                    <div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                                            Allowed Sections ({user.accessible_pages.length})
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {user.accessible_pages.map(page => {
                                                const label = AVAILABLE_PAGES.find(p => p.id === page)?.label || page;
                                                return (
                                                    <span key={page} className="text-[11px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md">
                                                        {label}
                                                    </span>
                                                );
                                            })}
                                            {user.accessible_pages.length === 0 && (
                                                <span className="text-[11px] text-gray-400 italic">No pages assigned</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                                <span>Added {formatDateUS(user.created_at)}</span>
                                {user.last_sign_in_at ? (
                                    <span>Last active {formatDateUS(user.last_sign_in_at)}</span>
                                ) : (
                                    <span className="text-amber-500 font-medium">Never logged in</span>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Add Team Member</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Invite a colleague to access your company portal. They will receive temporary login credentials via email.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleAddSubmit} className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label htmlFor="staff-name" className="text-xs font-bold uppercase tracking-wider text-gray-600">Full Name</Label>
                            <Input 
                                id="staff-name" 
                                placeholder="e.g. Sarah Jenkins" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                required 
                                className="rounded-xl h-11"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="staff-email" className="text-xs font-bold uppercase tracking-wider text-gray-600">Email Address</Label>
                            <Input 
                                id="staff-email" 
                                type="email" 
                                placeholder="sarah@yourcompany.com" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="rounded-xl h-11"
                            />
                        </div>

                        <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-600">Page Permissions</Label>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        onClick={selectAllPages}
                                        className="text-[11px] font-bold text-violet-600 hover:text-violet-700"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">·</span>
                                    <button 
                                        type="button" 
                                        onClick={deselectAllPages}
                                        className="text-[11px] font-bold text-gray-500 hover:text-gray-700"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border border-gray-100 rounded-2xl p-3 bg-gray-50/50">
                                {AVAILABLE_PAGES.map(page => (
                                    <label key={page.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs font-medium text-gray-700">
                                        <Checkbox 
                                            checked={selectedPages.includes(page.id)}
                                            onCheckedChange={() => handleTogglePage(page.id)}
                                            className="rounded-md data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                        />
                                        <span>{page.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsAddOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold"
                            >
                                {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : <UserPlus className="size-4 mr-2" />}
                                Send Invite
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Permissions Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[480px] rounded-3xl p-6">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">Edit Permissions: {editingUser?.name}</DialogTitle>
                        <DialogDescription className="text-sm text-gray-500">
                            Configure which sections of your company portal this team member can access.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold uppercase tracking-wider text-gray-600">Accessible Sections</Label>
                                <div className="flex items-center gap-2">
                                    <button 
                                        type="button" 
                                        onClick={selectAllPages}
                                        className="text-[11px] font-bold text-violet-600 hover:text-violet-700"
                                    >
                                        Select All
                                    </button>
                                    <span className="text-gray-300">·</span>
                                    <button 
                                        type="button" 
                                        onClick={deselectAllPages}
                                        className="text-[11px] font-bold text-gray-500 hover:text-gray-700"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 border border-gray-100 rounded-2xl p-3 bg-gray-50/50">
                                {AVAILABLE_PAGES.map(page => (
                                    <label key={page.id} className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer text-xs font-medium text-gray-700">
                                        <Checkbox 
                                            checked={selectedPages.includes(page.id)}
                                            onCheckedChange={() => handleTogglePage(page.id)}
                                            className="rounded-md data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
                                        />
                                        <span>{page.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsEditOpen(false)}
                                className="rounded-xl"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={loading}
                                className="rounded-xl bg-violet-600 hover:bg-violet-700 font-bold"
                            >
                                {loading && <Loader2 className="size-4 animate-spin mr-2" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Action Confirmation Dialog */}
            <ConfirmDialog 
                isOpen={confirmState.isOpen}
                onClose={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmState.onConfirm}
                title={confirmState.title}
                description={confirmState.description}
                confirmText={confirmState.confirmText}
                variant={confirmState.variant}
            />
        </div>
    );
}
