'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UserPlus, MoreVertical, Loader2, Shield, Lock, Trash2, Edit2, Ban, CheckCircle2 } from 'lucide-react';
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
    createStaffMember, 
    updateStaffPermissions, 
    toggleStaffSuspension, 
    deleteStaffMember 
} from './actions';
import { formatDateUS } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface StaffUser {
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
    { id: '/admin', label: 'Dashboard' },
    { id: '/admin/orders', label: 'Orders' },
    { id: '/admin/quantities', label: 'Quantities' },
    { id: '/admin/invoices', label: 'Invoices' },
    { id: '/admin/meals', label: 'Meals' },
    { id: '/admin/companies', label: 'Companies' },
    { id: '/admin/analytics', label: 'Analytics' },
    { id: '/admin/activity', label: 'Activity Log' },
];

export function StaffClient({ initialStaff }: { initialStaff: StaffUser[] }) {
    const [staff, setStaff] = useState<StaffUser[]>(initialStaff);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    
    // Add Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [selectedPages, setSelectedPages] = useState<string[]>(['/admin', '/admin/orders', '/admin/quantities']);
    const [loading, setLoading] = useState(false);

    // Edit Form State
    const [editingUser, setEditingUser] = useState<StaffUser | null>(null);

    async function handleAddSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createStaffMember({ name, email, accessible_pages: selectedPages });
            if (result.success) {
                toast.success('Staff member created and invitation sent!');
                if (result.warning) toast.warning(result.warning);
                setIsAddOpen(false);
                // We do a hard reload to get the fresh list from the server
                window.location.reload();
            } else {
                toast.error(result.error || 'Failed to create staff member');
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
            const result = await updateStaffPermissions(editingUser.id, selectedPages);
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

    function openEditModal(user: StaffUser) {
        setEditingUser(user);
        setSelectedPages(user.accessible_pages);
        setIsEditOpen(true);
    }

    function openAddModal() {
        setName('');
        setEmail('');
        setSelectedPages(['/admin', '/admin/orders', '/admin/quantities']);
        setIsAddOpen(true);
    }

    const [suspendingId, setSuspendingId] = useState<string | null>(null);
    async function handleToggleSuspension(user: StaffUser) {
        const newStatus = !user.suspended;
        setSuspendingId(user.id);
        const result = await toggleStaffSuspension(user.id, newStatus);
        setSuspendingId(null);

        if (result.success) {
            toast.success(`User ${newStatus ? 'suspended' : 'reactivated'} successfully`);
            setStaff(staff.map(s => s.id === user.id ? { ...s, suspended: newStatus } : s));
        } else {
            toast.error(result.error || 'Failed to update suspension status');
        }
    }

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [confirmToggleId, setConfirmToggleId] = useState<string | null>(null);

    async function handleDelete(id: string) {
        setDeletingId(id);
        const result = await deleteStaffMember(id);
        setDeletingId(null);

        if (result.success) {
            toast.success('Staff member removed permanently');
            setStaff(staff.filter(s => s.id !== id));
        } else {
            toast.error(result.error || 'Failed to remove staff member');
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Staff Management</h1>
                    <p className="text-gray-500 mt-1">Manage admin portal access for your team members.</p>
                </div>
                <Button onClick={openAddModal} className="bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-200">
                    <UserPlus className="size-4 mr-2" />
                    Add Staff Member
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.map(user => (
                    <Card key={user.id} className="relative overflow-hidden flex flex-col group transition-all duration-200 hover:shadow-md hover:border-violet-200">
                        {user.suspended && (
                            <div className="absolute inset-0 bg-gray-50/80 backdrop-blur-[1px] z-10 flex items-center justify-center pointer-events-none">
                                <Badge variant="outline" className="bg-white text-red-600 border-red-200 shadow-sm px-3 py-1 font-bold text-sm pointer-events-auto">
                                    <Ban className="size-4 mr-1.5" /> Suspended
                                </Badge>
                            </div>
                        )}
                        <div className="p-5 flex-1 relative">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center text-violet-600 font-bold border border-violet-200">
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-[15px] leading-none">{user.name}</h3>
                                        <p className="text-sm text-gray-500 mt-1">{user.email}</p>
                                    </div>
                                </div>
                                <div className="relative z-20">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="h-8 w-8 -mr-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-md inline-flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-gray-300">
                                            <MoreVertical className="size-4" />
                                        </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={() => openEditModal(user)}>
                                            <Edit2 className="size-4 mr-2 text-gray-500" /> Edit Permissions
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setConfirmToggleId(user.id)}>
                                            {user.suspended ? (
                                                <><CheckCircle2 className="size-4 mr-2 text-emerald-500" /> Reactivate User</>
                                            ) : (
                                                <><Ban className="size-4 mr-2 text-amber-500" /> Suspend User</>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => setConfirmDeleteId(user.id)} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                                            <Trash2 className="size-4 mr-2" /> Remove Staff
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        <Shield className="size-3" />
                                        Access Level
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {user.accessible_pages.map(page => {
                                            const pageInfo = AVAILABLE_PAGES.find(p => p.id === page);
                                            return (
                                                <Badge key={page} variant="secondary" className="bg-violet-50 text-violet-700 hover:bg-violet-100 font-medium">
                                                    {pageInfo?.label || page}
                                                </Badge>
                                            );
                                        })}
                                        {user.accessible_pages.length === 0 && (
                                            <span className="text-xs text-gray-400 italic">No access granted</span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-1.5 text-gray-500">
                                        <Lock className="size-3" />
                                        {user.needs_password_change ? (
                                            <span className="text-amber-600 font-medium">Pending Setup</span>
                                        ) : (
                                            <span className="text-emerald-600 font-medium">Active</span>
                                        )}
                                    </div>
                                    <div className="text-gray-400">
                                        Joined {formatDateUS(new Date(user.created_at))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ConfirmDialog
                            isOpen={confirmDeleteId === user.id}
                            onClose={() => setConfirmDeleteId(null)}
                            onConfirm={() => {
                                setConfirmDeleteId(null);
                                handleDelete(user.id);
                            }}
                            title="Remove Staff Member"
                            description={`Are you sure you want to permanently remove ${user.name}? They will immediately lose access to the admin dashboard. This action cannot be undone.`}
                            confirmText="Yes, remove staff"
                            isLoading={deletingId === user.id}
                        />

                        <ConfirmDialog
                            isOpen={confirmToggleId === user.id}
                            onClose={() => setConfirmToggleId(null)}
                            onConfirm={() => {
                                setConfirmToggleId(null);
                                handleToggleSuspension(user);
                            }}
                            title={user.suspended ? "Reactivate Staff Member" : "Suspend Staff Member"}
                            description={user.suspended ? `Are you sure you want to reactivate ${user.name}? They will regain access to the admin dashboard.` : `Are you sure you want to suspend ${user.name}? They will immediately lose access to the admin dashboard.`}
                            confirmText={user.suspended ? "Yes, reactivate" : "Yes, suspend"}
                            isLoading={suspendingId === user.id}
                        />
                    </Card>
                ))}
                
                {staff.length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <Shield className="size-8 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-lg font-bold text-gray-900 mb-1">No staff members yet</h3>
                        <p className="text-gray-500 mb-4">Add your team members to help manage orders.</p>
                        <Button onClick={openAddModal} variant="outline" className="bg-white">
                            <UserPlus className="size-4 mr-2" />
                            Add First Staff Member
                        </Button>
                    </div>
                )}
            </div>

            {/* Add Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleAddSubmit}>
                        <DialogHeader>
                            <DialogTitle>Add Staff Member</DialogTitle>
                            <DialogDescription>
                                They will receive an email with a temporary password to access the portal.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-3 pt-2">
                                <Label>Accessible Pages</Label>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {AVAILABLE_PAGES.map(page => (
                                        <div key={page.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`page-${page.id}`} 
                                                checked={selectedPages.includes(page.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedPages([...selectedPages, page.id]);
                                                    else setSelectedPages(selectedPages.filter(p => p !== page.id));
                                                }}
                                            />
                                            <label htmlFor={`page-${page.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                {page.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white" disabled={loading}>
                                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Sending Invite...</> : 'Send Invite'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Permissions</DialogTitle>
                            <DialogDescription>
                                Update access levels for {editingUser?.name}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-3 pt-2">
                                <Label>Accessible Pages</Label>
                                <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    {AVAILABLE_PAGES.map(page => (
                                        <div key={page.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`edit-page-${page.id}`} 
                                                checked={selectedPages.includes(page.id)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) setSelectedPages([...selectedPages, page.id]);
                                                    else setSelectedPages(selectedPages.filter(p => p !== page.id));
                                                }}
                                            />
                                            <label htmlFor={`edit-page-${page.id}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                                {page.label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                            <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white" disabled={loading}>
                                {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Saving...</> : 'Save Permissions'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
