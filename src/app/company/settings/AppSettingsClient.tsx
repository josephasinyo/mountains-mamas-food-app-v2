'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
    Settings, Layout, 
    Save, Loader2, Smartphone, CheckCircle2,
    Cookie, Utensils, FileText, ArrowUp, ArrowDown
} from 'lucide-react';
import { updateAppConfig, updateCompanyFormField } from '../actions';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AppSettingsClientProps {
    initialData: any;
    globalSettings: any;
    formFieldsData: {
        globalFields: any[];
        companyFields: any[];
    };
}

export default function AppSettingsClient({ initialData, globalSettings, formFieldsData }: AppSettingsClientProps) {
    const { config } = initialData;
    const [savedConfig, setSavedConfig] = useState(config);
    const [isPending, startTransition] = useTransition();
    
    // Baseline/initial list of form fields
    const [initialFormFields, setInitialFormFields] = useState(() => {
        const { globalFields, companyFields } = formFieldsData;
        return globalFields.map(gf => {
            const override = companyFields.find(cf => cf.field_id === gf.id);
            return {
                ...gf,
                is_enabled: override ? override.is_enabled : !!gf.is_system_core,
                sort_order: override ? override.sort_order : 0
            };
        }).sort((a, b) => {
            if (a.location !== b.location) return a.location.localeCompare(b.location);
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    });
    
    // Active draft state of form fields
    const [companyFormFields, setCompanyFormFields] = useState(initialFormFields);
    
    const initialFormData = {
        show_box_lunch_category: savedConfig?.show_box_lunch_category ?? true,
        show_junior_box_lunch_category: savedConfig?.show_junior_box_lunch_category ?? true,
        use_split_box_types: savedConfig?.use_split_box_types ?? false,
        use_sandwich_only: savedConfig?.use_sandwich_only ?? true,
        custom_welcome_message: savedConfig?.custom_welcome_message ?? '',
        use_mountain_mamas_branding: savedConfig?.use_mountain_mamas_branding ?? false,
        confirmation_page_fields: savedConfig?.confirmation_page_fields ?? {},
        meal_page_options: savedConfig?.meal_page_options ?? { breads: [], cookies: [] }
    };

    const [formData, setFormData] = useState(initialFormData);

    // Sync formData when savedConfig changes
    React.useEffect(() => {
        setFormData({
            show_box_lunch_category: savedConfig?.show_box_lunch_category ?? true,
            show_junior_box_lunch_category: savedConfig?.show_junior_box_lunch_category ?? true,
            use_split_box_types: savedConfig?.use_split_box_types ?? false,
            use_sandwich_only: savedConfig?.use_sandwich_only ?? true,
            custom_welcome_message: savedConfig?.custom_welcome_message ?? '',
            use_mountain_mamas_branding: savedConfig?.use_mountain_mamas_branding ?? false,
            confirmation_page_fields: savedConfig?.confirmation_page_fields ?? {},
            meal_page_options: savedConfig?.meal_page_options ?? { breads: [], cookies: [] }
        });
    }, [savedConfig]);

    const configChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
    const fieldsChanged = JSON.stringify(companyFormFields) !== JSON.stringify(initialFormFields);
    const hasChanges = configChanged || fieldsChanged;

    const handleSave = async () => {
        if (!hasChanges) return;

        if (!formData.use_sandwich_only && !formData.show_box_lunch_category && !formData.show_junior_box_lunch_category) {
            toast.error('At least one meal option must be enabled');
            return;
        }
        
        startTransition(async () => {
            try {
                let configSuccess = true;
                let fieldsSuccess = true;

                // Save config changes if any
                if (configChanged) {
                    const result = await updateAppConfig(formData);
                    if (!result.success) configSuccess = false;
                }

                // Save form fields changes if any
                if (fieldsChanged) {
                    // Update all changed fields
                    const fieldsToUpdate = companyFormFields.filter(field => {
                        const initial = initialFormFields.find(i => i.id === field.id);
                        return !initial || initial.is_enabled !== field.is_enabled || initial.sort_order !== field.sort_order;
                    });

                    const results = await Promise.all(
                        fieldsToUpdate.map(field => 
                            updateCompanyFormField(field.id, { 
                                is_enabled: field.is_enabled, 
                                sort_order: field.sort_order 
                            })
                        )
                    );
                    if (results.some(r => !r.success)) fieldsSuccess = false;
                }

                if (configSuccess && fieldsSuccess) {
                    toast.success('App configuration and settings updated successfully');
                    setSavedConfig(formData);
                    setInitialFormFields(companyFormFields);
                } else {
                    toast.error('Failed to update some settings');
                }
            } catch (error) {
                console.error('Error saving settings:', error);
                toast.error('An error occurred while saving settings');
            }
        });
    };

    // Helper to get ordered list of breads
    const orderedBreads = React.useMemo(() => {
        const selectedBreads = formData.meal_page_options.breads || [];
        const globalBreads = globalSettings?.bread_options || [];
        // Active selected ones in their configured order
        const active = selectedBreads.filter((b: string) => globalBreads.includes(b));
        // Remaining unselected ones in global order
        const inactive = globalBreads.filter((b: string) => !selectedBreads.includes(b));
        return [...active, ...inactive];
    }, [formData.meal_page_options.breads, globalSettings?.bread_options]);

    // Helper to get ordered list of cookies
    const orderedCookies = React.useMemo(() => {
        const selectedCookies = formData.meal_page_options.cookies || [];
        const globalCookies = globalSettings?.cookie_options || [];
        // Active selected ones in their configured order
        const active = selectedCookies.filter((c: string) => globalCookies.includes(c));
        // Remaining unselected ones in global order
        const inactive = globalCookies.filter((c: string) => !selectedCookies.includes(c));
        return [...active, ...inactive];
    }, [formData.meal_page_options.cookies, globalSettings?.cookie_options]);

    const toggleBread = (bread: string) => {
        const currentBreads = formData.meal_page_options.breads || [];
        const newBreads = currentBreads.includes(bread)
            ? currentBreads.filter((b: string) => b !== bread)
            : [...currentBreads, bread];
        
        setFormData({
            ...formData,
            meal_page_options: {
                ...formData.meal_page_options,
                breads: newBreads
            }
        });
    };

    const toggleCookie = (cookie: string) => {
        const currentCookies = formData.meal_page_options.cookies || [];
        const newCookies = currentCookies.includes(cookie)
            ? currentCookies.filter((c: string) => c !== cookie)
            : [...currentCookies, cookie];
        
        setFormData({
            ...formData,
            meal_page_options: {
                ...formData.meal_page_options,
                cookies: newCookies
            }
        });
    };

    const moveBread = (bread: string, direction: 'up' | 'down') => {
        const currentBreads = [...(formData.meal_page_options.breads || [])];
        const idx = currentBreads.indexOf(bread);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === currentBreads.length - 1) return;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const temp = currentBreads[idx];
        currentBreads[idx] = currentBreads[targetIdx];
        currentBreads[targetIdx] = temp;

        setFormData({
            ...formData,
            meal_page_options: {
                ...formData.meal_page_options,
                breads: currentBreads
            }
        });
    };

    const moveCookie = (cookie: string, direction: 'up' | 'down') => {
        const currentCookies = [...(formData.meal_page_options.cookies || [])];
        const idx = currentCookies.indexOf(cookie);
        if (idx === -1) return;
        if (direction === 'up' && idx === 0) return;
        if (direction === 'down' && idx === currentCookies.length - 1) return;

        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        const temp = currentCookies[idx];
        currentCookies[idx] = currentCookies[targetIdx];
        currentCookies[targetIdx] = temp;

        setFormData({
            ...formData,
            meal_page_options: {
                ...formData.meal_page_options,
                cookies: currentCookies
            }
        });
    };

    const toggleFormField = (fieldId: string, currentState: boolean) => {
        const newState = !currentState;
        setCompanyFormFields(prev => prev.map(f => f.id === fieldId ? { ...f, is_enabled: newState } : f));
    };

    const moveField = (fieldId: string, direction: 'up' | 'down') => {
        const fieldIndex = companyFormFields.findIndex(f => f.id === fieldId);
        if (fieldIndex === -1) return;
        
        const currentLocation = companyFormFields[fieldIndex].location;
        const locationFields = companyFormFields.filter(f => f.location === currentLocation);
        const idxInLocation = locationFields.findIndex(f => f.id === fieldId);
        
        if (direction === 'up' && idxInLocation === 0) return;
        if (direction === 'down' && idxInLocation === locationFields.length - 1) return;
        
        const targetIdxInLocation = direction === 'up' ? idxInLocation - 1 : idxInLocation + 1;
        
        // Swap their positions in the locationFields array
        const updatedLocationFields = [...locationFields];
        const temp = updatedLocationFields[idxInLocation];
        updatedLocationFields[idxInLocation] = updatedLocationFields[targetIdxInLocation];
        updatedLocationFields[targetIdxInLocation] = temp;
        
        // Assign clean distinct sequential sort_orders (0, 1, 2...) based on their new positions
        const updatedFieldsWithNewOrders = updatedLocationFields.map((field, index) => ({
            ...field,
            sort_order: index
        }));
        
        // Merge the updated location fields back into the main list and sort
        const sortedFields = companyFormFields.map(f => {
            if (f.location === currentLocation) {
                return updatedFieldsWithNewOrders.find(u => u.id === f.id)!;
            }
            return f;
        }).sort((a, b) => {
            if (a.location !== b.location) return a.location.localeCompare(b.location);
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
        
        setCompanyFormFields(sortedFields);
    };

    return (
        <div className="space-y-8 max-w-4xl pb-12">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">App Settings</h1>
                <p className="text-gray-500 font-medium mt-1">Configure how your custom ordering app looks and behaves.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Meal Options */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                <Layout className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Meal Options</CardTitle>
                                <CardDescription>Configure how meals are presented in your ordering app.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-violet-100 bg-violet-50/20">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold text-violet-900">Enable sandwich only</Label>
                                <p className="text-xs text-violet-600/70 font-medium">When enabled, customers can choose standalone sandwiches</p>
                            </div>
                            <Switch 
                                checked={formData.use_sandwich_only} 
                                onCheckedChange={(val) => setFormData({...formData, use_sandwich_only: val})}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl border border-violet-100 bg-violet-50/20">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold text-violet-900">Enable box lunch</Label>
                                <p className="text-xs text-violet-600/70 font-medium">When enabled, customers can choose the box lunch</p>
                            </div>
                            <Switch 
                                checked={formData.show_box_lunch_category} 
                                onCheckedChange={(val) => setFormData({...formData, show_box_lunch_category: val})}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-2xl border border-violet-100 bg-violet-50/20">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold text-violet-900">Enable junior box lunch</Label>
                                <p className="text-xs text-violet-600/70 font-medium">When enabled, customers can choose the junior box lunch</p>
                            </div>
                            <Switch 
                                checked={formData.show_junior_box_lunch_category} 
                                onCheckedChange={(val) => setFormData({...formData, show_junior_box_lunch_category: val})}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Branding & Welcome Message */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                <Settings className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">App Branding & Custom Message</CardTitle>
                                <CardDescription>Customize the header branding and welcome message shown to your guests.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-violet-100 bg-violet-50/20">
                            <div className="space-y-1">
                                <Label className="text-sm font-bold text-violet-900">Use Mountain Mama's Café Branding</Label>
                                <p className="text-xs text-violet-600/70 font-medium">
                                    When enabled, your guests will see "Mountain Mama's Café" in the header instead of your company name
                                </p>
                            </div>
                            <Switch 
                                checked={formData.use_mountain_mamas_branding} 
                                onCheckedChange={(val) => setFormData({...formData, use_mountain_mamas_branding: val})}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="custom_welcome_message" className="text-sm font-bold text-gray-700">Custom Welcome Instructions</Label>
                            <Textarea 
                                id="custom_welcome_message"
                                placeholder="e.g. Please place your family’s order for your tour in Yellowstone below by selecting the meals of your choice."
                                value={formData.custom_welcome_message}
                                onChange={(e) => setFormData({...formData, custom_welcome_message: e.target.value})}
                                rows={3}
                                className="resize-none rounded-xl"
                            />
                            <p className="text-[11px] text-gray-400 font-medium">This message will be prominently displayed at the top of your custom ordering page.</p>
                        </div>
                    </CardContent>
                </Card>


                {/* Bread Selection */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                <Utensils className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Bread Options</CardTitle>
                                <CardDescription>Select and reorder bread types to offer on your meal pages. Move items up or down to set their display priority.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {orderedBreads.map((bread: string, idx: number) => {
                                const isSelected = formData.meal_page_options.breads?.includes(bread);
                                const currentSelectedBreads = formData.meal_page_options.breads || [];
                                const idxInSelected = currentSelectedBreads.indexOf(bread);
                                return (
                                    <div 
                                        key={bread}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                            isSelected
                                                ? "border-orange-200 bg-orange-50/30 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected && currentSelectedBreads.length > 1 && (
                                                <div className="flex flex-col gap-0.5">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); moveBread(bread, 'up'); }}
                                                        disabled={idxInSelected === 0}
                                                        className="p-1 hover:bg-orange-100 rounded disabled:opacity-30"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="size-3 text-orange-800" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); moveBread(bread, 'down'); }}
                                                        disabled={idxInSelected === currentSelectedBreads.length - 1}
                                                        className="p-1 hover:bg-orange-100 rounded disabled:opacity-30"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="size-3 text-orange-800" />
                                                    </button>
                                                </div>
                                            )}
                                            <span className={cn(
                                                "text-sm font-bold",
                                                isSelected ? "text-orange-900" : "text-gray-600"
                                            )}>
                                                {isSelected ? `#${idxInSelected + 1}: ` : ''}{bread}
                                            </span>
                                        </div>
                                        <Switch 
                                            checked={isSelected} 
                                            onCheckedChange={() => toggleBread(bread)}
                                            className="data-[state=checked]:bg-orange-600"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {(!globalSettings?.bread_options || globalSettings.bread_options.length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-4">No bread options configured by admin.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Cookie Selection */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                                <Cookie className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Cookie Options</CardTitle>
                                <CardDescription>Select and reorder cookie types to offer on your meal pages. Move items up or down to set their display priority.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {orderedCookies.map((cookie: string) => {
                                const isSelected = formData.meal_page_options.cookies?.includes(cookie);
                                const currentSelectedCookies = formData.meal_page_options.cookies || [];
                                const idxInSelected = currentSelectedCookies.indexOf(cookie);
                                return (
                                    <div 
                                        key={cookie}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all",
                                            isSelected
                                                ? "border-amber-200 bg-amber-50/30 shadow-sm"
                                                : "border-gray-50 bg-gray-50/50 opacity-60"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isSelected && currentSelectedCookies.length > 1 && (
                                                <div className="flex flex-col gap-0.5">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); moveCookie(cookie, 'up'); }}
                                                        disabled={idxInSelected === 0}
                                                        className="p-1 hover:bg-amber-100 rounded disabled:opacity-30"
                                                        title="Move Up"
                                                    >
                                                        <ArrowUp className="size-3 text-amber-800" />
                                                    </button>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); moveCookie(cookie, 'down'); }}
                                                        disabled={idxInSelected === currentSelectedCookies.length - 1}
                                                        className="p-1 hover:bg-amber-100 rounded disabled:opacity-30"
                                                        title="Move Down"
                                                    >
                                                        <ArrowDown className="size-3 text-amber-800" />
                                                    </button>
                                                </div>
                                            )}
                                            <span className={cn(
                                                "text-sm font-bold",
                                                isSelected ? "text-amber-900" : "text-gray-600"
                                            )}>
                                                {isSelected ? `#${idxInSelected + 1}: ` : ''}{cookie}
                                            </span>
                                        </div>
                                        <Switch 
                                            checked={isSelected} 
                                            onCheckedChange={() => toggleCookie(cookie)}
                                            className="data-[state=checked]:bg-amber-600"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                        {(!globalSettings?.cookie_options || globalSettings.cookie_options.length === 0) && (
                            <p className="text-sm text-gray-500 text-center py-4">No cookie options configured by admin.</p>
                        )}
                    </CardContent>
                </Card>

                {/* Form Customization */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                <FileText className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">Form Customization</CardTitle>
                                <CardDescription>Select and reorder fields for your ordering forms.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-10">
                        {/* Meal Page Fields */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Utensils className="size-4" /> Meal Page (Add to Cart)
                            </h3>
                            <div className="space-y-3">
                                {companyFormFields.filter(f => f.location === 'meal_page').map((field, idx, arr) => (
                                    <div key={field.id} className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                        field.is_enabled ? "border-violet-100 bg-violet-50/20" : "border-gray-50 bg-gray-50/50 opacity-60"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <button 
                                                    onClick={() => moveField(field.id, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-violet-100 rounded disabled:opacity-30"
                                                >
                                                    <ArrowUp className="size-3" />
                                                </button>
                                                <button 
                                                    onClick={() => moveField(field.id, 'down')}
                                                    disabled={idx === arr.length - 1}
                                                    className="p-1 hover:bg-violet-100 rounded disabled:opacity-30"
                                                >
                                                    <ArrowDown className="size-3" />
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{field.label}</p>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{field.type} • {field.is_required ? 'Required' : 'Optional'}</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={field.is_enabled} 
                                            onCheckedChange={() => toggleFormField(field.id, field.is_enabled)}
                                            className="data-[state=checked]:bg-violet-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tour Details Fields */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Layout className="size-4" /> Tour Details (Checkout)
                            </h3>
                            <div className="space-y-3">
                                {companyFormFields.filter(f => f.location === 'tour_details').map((field, idx, arr) => (
                                    <div key={field.id} className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all",
                                        field.is_enabled ? "border-emerald-100 bg-emerald-50/20" : "border-gray-50 bg-gray-50/50 opacity-60"
                                    )}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <button 
                                                    onClick={() => moveField(field.id, 'up')}
                                                    disabled={idx === 0}
                                                    className="p-1 hover:bg-emerald-100 rounded disabled:opacity-30"
                                                >
                                                    <ArrowUp className="size-3" />
                                                </button>
                                                <button 
                                                    onClick={() => moveField(field.id, 'down')}
                                                    disabled={idx === arr.length - 1}
                                                    className="p-1 hover:bg-emerald-100 rounded disabled:opacity-30"
                                                >
                                                    <ArrowDown className="size-3" />
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{field.label}</p>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">{field.type} • {field.is_required ? 'Required' : 'Optional'}</p>
                                            </div>
                                        </div>
                                        <Switch 
                                            checked={field.is_enabled} 
                                            onCheckedChange={() => toggleFormField(field.id, field.is_enabled)}
                                            className="data-[state=checked]:bg-emerald-600"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Sticky Save Bar */}
                <div className="flex items-center justify-between p-6 rounded-[28px] bg-white border-2 border-violet-100 shadow-xl shadow-violet-100/50 sticky bottom-8 z-20 backdrop-blur-sm mt-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-violet-600 flex items-center justify-center text-white shadow-lg shadow-violet-200">
                            <Smartphone className="size-5" />
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
                        {hasChanges ? 'Save Configuration' : 'No Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
