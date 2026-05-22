'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Settings, Save, Loader2, Plus, Trash2, Cookie, Utensils, Layout, FileText, Edit2, ArrowUp, ArrowDown } from 'lucide-react';
import { saveAllSettings } from './actions';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface AppSettingsClientProps {
    initialSettings: any;
    initialFields: any[];
}

export default function AppSettingsClient({ initialSettings, initialFields }: AppSettingsClientProps) {
    const [isPending, startTransition] = useTransition();
    
    // Core state buffers
    const [breadOptions, setBreadOptions] = useState<string[]>(initialSettings?.bread_options || []);
    const [cookieOptions, setCookieOptions] = useState<string[]>(initialSettings?.cookie_options || []);
    const [fields, setFields] = useState<any[]>(initialFields || []);
    const [deletedFieldIds, setDeletedFieldIds] = useState<string[]>([]);
    
    const [newBread, setNewBread] = useState('');
    const [newCookie, setNewCookie] = useState('');

    // Original references for change detection
    const [originalSettings, setOriginalSettings] = useState(initialSettings);
    const [originalFields, setOriginalFields] = useState(initialFields);

    // Field Editor State
    const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<any>(null);
    const [fieldFormData, setFieldFormData] = useState({
        name: '',
        label: '',
        placeholder: '',
        type: 'text',
        location: 'meal_page',
        is_required: false,
        default_options: [] as string[],
        auto_add: false
    });
    const [newOption, setNewOption] = useState('');

    // Change Detection
    const hasChanges = 
        JSON.stringify(breadOptions) !== JSON.stringify(originalSettings?.bread_options || []) ||
        JSON.stringify(cookieOptions) !== JSON.stringify(originalSettings?.cookie_options || []) ||
        JSON.stringify(fields) !== JSON.stringify(originalFields) ||
        deletedFieldIds.length > 0;

    // Sticky Save Bar handler
    const handleSave = async () => {
        if (!hasChanges) return;
        
        startTransition(async () => {
            const result = await saveAllSettings({
                breadOptions,
                cookieOptions,
                fields,
                deletedFieldIds
            });
            if (result.success) {
                toast.success('All settings and form fields saved successfully');
                // Perform a reload to get fresh database IDs for any newly created fields
                window.location.reload();
            } else {
                toast.error('Failed to save settings: ' + result.error);
            }
        });
    };

    // Bread / Cookie option modifications (Local State Only!)
    const addOption = (type: 'bread' | 'cookie') => {
        if (type === 'bread' && newBread.trim()) {
            if (breadOptions.includes(newBread.trim())) {
                toast.error('This option already exists');
                return;
            }
            setBreadOptions([...breadOptions, newBread.trim()]);
            setNewBread('');
        } else if (type === 'cookie' && newCookie.trim()) {
            if (cookieOptions.includes(newCookie.trim())) {
                toast.error('This option already exists');
                return;
            }
            setCookieOptions([...cookieOptions, newCookie.trim()]);
            setNewCookie('');
        }
    };

    const removeOption = (type: 'bread' | 'cookie', index: number) => {
        if (type === 'bread') {
            setBreadOptions(breadOptions.filter((_, i) => i !== index));
        } else {
            setCookieOptions(cookieOptions.filter((_, i) => i !== index));
        }
    };

    const moveOption = (type: 'bread' | 'cookie', index: number, direction: 'up' | 'down') => {
        if (type === 'bread') {
            if (direction === 'up' && index === 0) return;
            if (direction === 'down' && index === breadOptions.length - 1) return;
            const updated = [...breadOptions];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            const temp = updated[index];
            updated[index] = updated[targetIndex];
            updated[targetIndex] = temp;
            setBreadOptions(updated);
        } else {
            if (direction === 'up' && index === 0) return;
            if (direction === 'down' && index === cookieOptions.length - 1) return;
            const updated = [...cookieOptions];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            const temp = updated[index];
            updated[index] = updated[targetIndex];
            updated[targetIndex] = temp;
            setCookieOptions(updated);
        }
    };

    // Field Creation / Dialog Editing
    const handleEditField = (field?: any) => {
        if (field) {
            setEditingField(field);
            setFieldFormData({
                name: field.name,
                label: field.label,
                placeholder: field.placeholder || '',
                type: field.type,
                location: field.location,
                is_required: !!field.is_required,
                default_options: field.default_options || [],
                auto_add: !!field.auto_add
            });
        } else {
            setEditingField(null);
            setFieldFormData({
                name: '',
                label: '',
                placeholder: '',
                type: 'text',
                location: 'meal_page',
                is_required: false,
                default_options: [],
                auto_add: false
            });
        }
        setNewOption('');
        setIsFieldDialogOpen(true);
    };

    const addFieldOption = () => {
        if (newOption.trim()) {
            if (fieldFormData.default_options.includes(newOption.trim())) {
                toast.error('This option already exists');
                return;
            }
            setFieldFormData({
                ...fieldFormData,
                default_options: [...fieldFormData.default_options, newOption.trim()]
            });
            setNewOption('');
        }
    };

    const removeFieldOption = (index: number) => {
        setFieldFormData({
            ...fieldFormData,
            default_options: fieldFormData.default_options.filter((_, i) => i !== index)
        });
    };

    // Dialog Save - Buffered into client state fields array!
    const handleSaveField = () => {
        if (!fieldFormData.name || !fieldFormData.label) {
            toast.error('Name and Label are required');
            return;
        }

        const nameExists = fields.some(f => 
            f.name.toLowerCase() === fieldFormData.name.toLowerCase() && 
            (!editingField || f.id !== editingField.id)
        );
        if (nameExists) {
            toast.error(`A field with name "${fieldFormData.name}" already exists.`);
            return;
        }

        if (editingField) {
            // Edit existing field in state
            setFields(fields.map(f => f.id === editingField.id ? {
                ...f,
                ...fieldFormData
            } : f));
            toast.success('Field changes updated (click "Save Changes" at bottom to save)');
        } else {
            // Add new field with a temporary ID
            const tempId = 'temp_' + Date.now();
            const locationFields = fields.filter(f => f.location === fieldFormData.location);
            const maxSort = locationFields.reduce((max, f) => Math.max(max, f.sort_order || 0), -1);
            
            const newField = {
                id: tempId,
                ...fieldFormData,
                is_active: true,
                sort_order: maxSort + 1,
                is_system_core: false
            };
            setFields([...fields, newField]);
            toast.success('New field added (click "Save Changes" at bottom to save)');
        }
        setIsFieldDialogOpen(false);
    };

    // Up/Down reordering handler within location groups
    const moveField = (fieldId: string, direction: 'up' | 'down') => {
        const fieldIndex = fields.findIndex(f => f.id === fieldId);
        if (fieldIndex === -1) return;
        
        const currentLocation = fields[fieldIndex].location;
        const locationFields = fields
            .filter(f => f.location === currentLocation)
            .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
            
        const idxInLocation = locationFields.findIndex(f => f.id === fieldId);
        
        if (direction === 'up' && idxInLocation === 0) return;
        if (direction === 'down' && idxInLocation === locationFields.length - 1) return;
        
        const targetIdxInLocation = direction === 'up' ? idxInLocation - 1 : idxInLocation + 1;
        
        const updatedLocationFields = [...locationFields];
        const temp = updatedLocationFields[idxInLocation];
        updatedLocationFields[idxInLocation] = updatedLocationFields[targetIdxInLocation];
        updatedLocationFields[targetIdxInLocation] = temp;
        
        // Re-assign clean distinct sequential sort orders
        const updatedFieldsWithNewOrders = updatedLocationFields.map((field, index) => ({
            ...field,
            sort_order: index
        }));
        
        // Re-merge into primary list
        const updatedFields = fields.map(f => {
            if (f.location === currentLocation) {
                return updatedFieldsWithNewOrders.find(u => u.id === f.id)!;
            }
            return f;
        });
        
        setFields(updatedFields);
    };

    // Active state toggle handler
    const toggleFieldActive = (fieldId: string, checked: boolean) => {
        setFields(fields.map(f => f.id === fieldId ? { ...f, is_active: checked } : f));
        toast.info(`Field status updated to ${checked ? 'Active' : 'Inactive'} (click "Save Changes" to save)`);
    };

    // Field deletion dialog states
    const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);

    const handleDeleteField = (id: string) => {
        setFieldToDelete(id);
    };

    const executeDeleteField = () => {
        if (!fieldToDelete) return;
        
        const field = fields.find(f => f.id === fieldToDelete);
        if (field) {
            if (field.is_system_core) {
                toast.error("Core system fields cannot be deleted.");
                setFieldToDelete(null);
                return;
            }
            
            // Buffer ID if it's not a temp one
            if (!String(fieldToDelete).startsWith('temp_')) {
                setDeletedFieldIds([...deletedFieldIds, fieldToDelete]);
            }
            
            setFields(fields.filter(f => f.id !== fieldToDelete));
            toast.success('Field deleted (click "Save Changes" to save)');
        }
        setFieldToDelete(null);
    };

    const renderOptionList = (type: 'bread' | 'cookie', options: string[]) => {
        const N = options.length;
        const leftCount = Math.ceil(N / 2);
        
        const leftOptions = options.slice(0, leftCount);
        const rightOptions = options.slice(leftCount);
        
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                {/* Left Column */}
                <div className="flex flex-col gap-3">
                    <AnimatePresence>
                        {leftOptions.map((opt, i) => {
                            const originalIdx = i;
                            return (
                                <motion.div 
                                    key={opt}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/50 group"
                                >
                                    <span className="text-sm font-bold text-gray-700">{opt}</span>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => moveOption(type, originalIdx, 'up')}
                                            disabled={originalIdx === 0}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-opacity"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="size-4" />
                                        </button>
                                        <button 
                                            onClick={() => moveOption(type, originalIdx, 'down')}
                                            disabled={originalIdx === N - 1}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-opacity"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="size-4" />
                                        </button>
                                        <button 
                                            onClick={() => removeOption(type, originalIdx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-3">
                    <AnimatePresence>
                        {rightOptions.map((opt, i) => {
                            const originalIdx = leftCount + i;
                            return (
                                <motion.div 
                                    key={opt}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 bg-gray-50/50 group"
                                >
                                    <span className="text-sm font-bold text-gray-700">{opt}</span>
                                    <div className="flex items-center gap-1">
                                        <button 
                                            onClick={() => moveOption(type, originalIdx, 'up')}
                                            disabled={originalIdx === 0}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-opacity"
                                            title="Move Up"
                                        >
                                            <ArrowUp className="size-4" />
                                        </button>
                                        <button 
                                            onClick={() => moveOption(type, originalIdx, 'down')}
                                            disabled={originalIdx === N - 1}
                                            className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-20 transition-opacity"
                                            title="Move Down"
                                        >
                                            <ArrowDown className="size-4" />
                                        </button>
                                        <button 
                                            onClick={() => removeOption(type, originalIdx)}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Global App Settings</h1>
                <p className="text-gray-500 font-medium mt-1">Manage global options and dynamic checkout/meal fields.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Bread Options */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Utensils className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Bread Options</CardTitle>
                                <CardDescription>Manage the list of bread types available globally.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex gap-2">
                            <Input 
                                value={newBread}
                                onChange={(e) => setNewBread(e.target.value)}
                                placeholder="Add new bread type (e.g. Sourdough)"
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && addOption('bread')}
                            />
                            <Button 
                                onClick={() => addOption('bread')}
                                className="rounded-xl bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-100 text-white"
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>

                        {renderOptionList('bread', breadOptions)}
                    </CardContent>
                </Card>

                {/* Cookie Options */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Cookie className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Cookie Options</CardTitle>
                                <CardDescription>Manage the list of cookie types available globally.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex gap-2">
                            <Input 
                                value={newCookie}
                                onChange={(e) => setNewCookie(e.target.value)}
                                placeholder="Add new cookie type (e.g. Macadamia Nut)"
                                className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white"
                                onKeyDown={(e) => e.key === 'Enter' && addOption('cookie')}
                            />
                            <Button 
                                onClick={() => addOption('cookie')}
                                className="rounded-xl bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-100 text-white"
                            >
                                <Plus className="size-4" />
                            </Button>
                        </div>

                        {renderOptionList('cookie', cookieOptions)}
                    </CardContent>
                </Card>

                {/* Dynamic Form Fields Management */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50 flex flex-row items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                <Layout className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Dynamic Form Fields</CardTitle>
                                <CardDescription>Define global fields, set their order, and control default default onboarding rules.</CardDescription>
                            </div>
                        </div>
                        <Button 
                            onClick={() => handleEditField()}
                            className="rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100 gap-2 text-white"
                        >
                            <Plus className="size-4" /> Add Field
                        </Button>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="space-y-8">
                            {/* Meal Page Fields */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Utensils className="size-4" /> Meal Page Fields
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {fields.filter(f => f.location === 'meal_page')
                                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                        .map((field, idx, arr) => {
                                            const isFirst = idx === 0;
                                            const isLast = idx === arr.length - 1;
                                            return (
                                                <div key={field.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-sm font-bold text-gray-900">{field.label}</p>
                                                                {field.is_system_core && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-500 rounded-md">CORE</span>
                                                                )}
                                                                {field.auto_add && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-50 text-violet-600 rounded-md">AUTO-ADD</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight mt-0.5">{field.type} • {field.is_required ? 'Required' : 'Optional'} • Name: {field.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                                        {/* Up/Down Sort */}
                                                        <div className="flex items-center gap-0.5">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-7 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                                onClick={() => moveField(field.id, 'up')}
                                                                disabled={isFirst}
                                                            >
                                                                <ArrowUp className="size-3.5" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-7 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                                onClick={() => moveField(field.id, 'down')}
                                                                disabled={isLast}
                                                            >
                                                                <ArrowDown className="size-3.5" />
                                                            </Button>
                                                        </div>

                                                        {/* Active Status Switch */}
                                                        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                                                            <Switch 
                                                                checked={field.is_active !== false}
                                                                onCheckedChange={(checked) => toggleFieldActive(field.id, checked)}
                                                            />
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase tracking-tight w-12",
                                                                field.is_active !== false ? "text-green-600" : "text-gray-400"
                                                            )}>
                                                                {field.is_active !== false ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>

                                                        {/* Edit / Delete (Visible on Hover/Focus) */}
                                                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                                                            <Button variant="ghost" size="icon" className="size-7 text-gray-400 hover:text-gray-900" onClick={() => handleEditField(field)}>
                                                                <Edit2 className="size-3.5" />
                                                            </Button>
                                                            {!field.is_system_core && (
                                                                <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteField(field.id)}>
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>

                            {/* Tour Details Fields */}
                            <div>
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Layout className="size-4" /> Tour Details Fields
                                </h3>
                                <div className="flex flex-col gap-3">
                                    {fields.filter(f => f.location === 'tour_details')
                                        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                                        .map((field, idx, arr) => {
                                            const isFirst = idx === 0;
                                            const isLast = idx === arr.length - 1;
                                            return (
                                                <div key={field.id} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-400">
                                                            <FileText className="size-4" />
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <p className="text-sm font-bold text-gray-900">{field.label}</p>
                                                                {field.is_system_core && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-gray-100 text-gray-500 rounded-md">CORE</span>
                                                                )}
                                                                {field.auto_add && (
                                                                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-violet-50 text-violet-600 rounded-md">AUTO-ADD</span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight mt-0.5">{field.type} • {field.is_required ? 'Required' : 'Optional'} • Name: {field.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 self-end sm:self-auto">
                                                        {/* Up/Down Sort */}
                                                        <div className="flex items-center gap-0.5">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-7 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                                onClick={() => moveField(field.id, 'up')}
                                                                disabled={isFirst}
                                                            >
                                                                <ArrowUp className="size-3.5" />
                                                            </Button>
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="size-7 rounded-lg text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                                onClick={() => moveField(field.id, 'down')}
                                                                disabled={isLast}
                                                            >
                                                                <ArrowDown className="size-3.5" />
                                                            </Button>
                                                        </div>

                                                        {/* Active Status Switch */}
                                                        <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                                                            <Switch 
                                                                checked={field.is_active !== false}
                                                                onCheckedChange={(checked) => toggleFieldActive(field.id, checked)}
                                                            />
                                                            <span className={cn(
                                                                "text-[10px] font-bold uppercase tracking-tight w-12",
                                                                field.is_active !== false ? "text-green-600" : "text-gray-400"
                                                            )}>
                                                                {field.is_active !== false ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>

                                                        {/* Edit / Delete */}
                                                        <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                                                            <Button variant="ghost" size="icon" className="size-7 text-gray-400 hover:text-gray-900" onClick={() => handleEditField(field)}>
                                                                <Edit2 className="size-3.5" />
                                                            </Button>
                                                            {!field.is_system_core && (
                                                                <Button variant="ghost" size="icon" className="size-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteField(field.id)}>
                                                                    <Trash2 className="size-3.5" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Field Edit Dialog */}
                <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
                    <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto rounded-3xl bg-white border border-gray-100 shadow-2xl p-6">
                        <div className="flex flex-col gap-2">
                            <DialogTitle className="text-xl font-extrabold text-gray-900">{editingField ? 'Edit Field' : 'Add New Field'}</DialogTitle>
                            <DialogDescription className="text-gray-500 text-xs">Configure the global field definition.</DialogDescription>
                        </div>
                        
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="field_name" className="text-sm font-bold text-gray-800">Field Name (ID)</Label>
                                <Input 
                                    id="field_name"
                                    value={fieldFormData.name}
                                    onChange={e => setFieldFormData({ ...fieldFormData, name: e.target.value })}
                                    placeholder="e.g. allergy_info"
                                    disabled={editingField?.is_system_core}
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="display_label" className="text-sm font-bold text-gray-800">Display Label</Label>
                                <Input 
                                    id="display_label"
                                    value={fieldFormData.label}
                                    onChange={e => setFieldFormData({ ...fieldFormData, label: e.target.value })}
                                    placeholder="e.g. Any Allergy Info?"
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="placeholder" className="text-sm font-bold text-gray-800">Placeholder</Label>
                                <Input 
                                    id="placeholder"
                                    value={fieldFormData.placeholder}
                                    onChange={e => setFieldFormData({ ...fieldFormData, placeholder: e.target.value })}
                                    placeholder="e.g. Enter allergy details here..."
                                    className="rounded-xl border-gray-100 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-800">Type</Label>
                                    <Select 
                                        value={fieldFormData.type} 
                                        onValueChange={val => setFieldFormData({ ...fieldFormData, type: val || 'text' })}
                                        disabled={editingField?.is_system_core}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border-gray-100 bg-gray-50/50">
                                            <SelectValue>
                                                {fieldFormData.type ? fieldFormData.type.charAt(0).toUpperCase() + fieldFormData.type.slice(1) : ''}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-xl">
                                            <SelectItem value="text">Text</SelectItem>
                                            <SelectItem value="textarea">Textarea</SelectItem>
                                            <SelectItem value="date">Date</SelectItem>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="select">Select</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-800">Location</Label>
                                    <Select 
                                        value={fieldFormData.location} 
                                        onValueChange={val => setFieldFormData({ ...fieldFormData, location: val || 'meal_page' })}
                                        disabled={editingField?.is_system_core}
                                    >
                                        <SelectTrigger className="w-full rounded-xl border-gray-100 bg-gray-50/50">
                                            <SelectValue>
                                                {fieldFormData.location === 'meal_page' ? 'Meal Page' : 'Tour Details'}
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="bg-white rounded-xl">
                                            <SelectItem value="meal_page">Meal Page</SelectItem>
                                            <SelectItem value="tour_details">Tour Details</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {fieldFormData.type === 'select' && (
                                <div className="space-y-3 p-4 rounded-2xl bg-violet-50/30 border border-violet-100/50">
                                    <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Layout className="size-4 text-violet-600" />
                                        Select Options
                                    </Label>
                                    
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newOption}
                                            onChange={e => setNewOption(e.target.value)}
                                            placeholder="e.g. Option A, Option B"
                                            className="bg-white rounded-xl border-gray-200"
                                            onKeyDown={e => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addFieldOption();
                                                }
                                            }}
                                        />
                                        <Button 
                                            type="button"
                                            onClick={addFieldOption}
                                            className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl"
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>

                                    {fieldFormData.default_options && fieldFormData.default_options.length > 0 ? (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {fieldFormData.default_options.map((opt: string, idx: number) => (
                                                <div 
                                                    key={idx}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-gray-100 text-xs font-semibold text-gray-700 shadow-sm"
                                                >
                                                    <span>{opt}</span>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeFieldOption(idx)}
                                                        className="text-gray-400 hover:text-red-500 rounded-full transition-colors"
                                                    >
                                                        <Trash2 className="size-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-400 font-medium italic">No options added yet. Add options for users to select.</p>
                                    )}
                                </div>
                            )}

                            {/* Required Switch */}
                            <div className="flex items-center gap-3 py-4 border-y border-gray-50">
                                <Switch 
                                    id="is_required"
                                    checked={fieldFormData.is_required}
                                    onCheckedChange={val => setFieldFormData({ ...fieldFormData, is_required: val })}
                                />
                                <Label htmlFor="is_required" className="cursor-pointer font-bold text-gray-800">
                                    Required Field <span className="text-muted-foreground font-normal block text-xs mt-0.5">Customers must fill out this field before ordering</span>
                                </Label>
                            </div>

                            {/* Auto-Add Switch */}
                            <div className="flex items-center gap-3 py-4 border-b border-gray-50">
                                <Switch 
                                    id="auto_add"
                                    checked={fieldFormData.auto_add}
                                    onCheckedChange={val => setFieldFormData({ ...fieldFormData, auto_add: val })}
                                />
                                <Label htmlFor="auto_add" className="cursor-pointer font-bold text-gray-800">
                                    Add Automatically to Companies <span className="text-muted-foreground font-normal block text-xs mt-0.5">Newly created tour companies will get this field enabled by default</span>
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="pt-2 gap-2 sm:gap-0">
                            <Button variant="outline" className="rounded-xl border-gray-200" onClick={() => setIsFieldDialogOpen(false)}>Cancel</Button>
                            <Button className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 shadow-lg shadow-violet-100 rounded-xl" onClick={handleSaveField}>
                                Save Field
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Sticky Save Bar */}
                <div className="flex items-center justify-between p-6 rounded-[28px] bg-white border-2 border-violet-100 shadow-xl shadow-violet-100/50 sticky bottom-8 z-20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <Settings className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Live Changes</p>
                            <p className="text-xs text-gray-500 font-medium">Changes take effect immediately upon saving.</p>
                        </div>
                    </div>
                    <Button 
                        onClick={handleSave} 
                        disabled={isPending || !hasChanges}
                        className={cn(
                            "h-12 px-10 rounded-xl font-bold shadow-lg gap-2 group transition-all duration-300",
                            hasChanges 
                                ? "bg-violet-600 hover:bg-violet-700 text-white shadow-violet-200" 
                                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                        )}
                    >
                        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4 group-hover:scale-110 transition-transform" />}
                        {hasChanges ? 'Save Changes' : 'No Changes'}
                    </Button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={!!fieldToDelete}
                onClose={() => setFieldToDelete(null)}
                onConfirm={executeDeleteField}
                title="Delete Field"
                description="Are you sure you want to delete this field? This will remove it from the list of fields. Click 'Save Changes' to commit."
                confirmText="Delete Field"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
