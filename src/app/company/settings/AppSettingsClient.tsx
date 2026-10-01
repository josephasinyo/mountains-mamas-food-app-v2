'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
    Settings, Layout, 
    Save, Loader2, Smartphone, CheckCircle2,
    Utensils, FileText, ArrowUp, ArrowDown,
    Copy, ExternalLink, Sun, Coffee, Moon, Sparkles, UtensilsCrossed
} from 'lucide-react';
import { updateAppConfig, updateCompanyFormField } from '../actions';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AppSettingsClientProps {
    initialData: any;
    globalSettings: any;
    formFieldsData: {
        globalFields: any[];
        companyFields: any[];
    };
    activeMasterMealTypes?: string[];
}

export default function AppSettingsClient({ initialData, formFieldsData, activeMasterMealTypes }: AppSettingsClientProps) {
    const { config } = initialData;
    const [savedConfig, setSavedConfig] = useState(config);
    const [isPending, startTransition] = useTransition();

    const company = savedConfig?.tour_companies || config?.tour_companies;
    const defaultSlug = company?.default_slug || company?.slug || '';
    const genericSlug = company?.generic_slug || company?.slug || '';
    
    // Baseline/initial list of form fields
    const [initialFormFields, setInitialFormFields] = useState(() => {
        const { globalFields = [], companyFields = [] } = formFieldsData || {};
        return globalFields.map(gf => {
            const override = companyFields.find(cf => cf.field_id === gf.id);
            return {
                ...gf,
                is_enabled: override ? override.is_enabled : (!!gf.is_system_core || !!gf.auto_add),
                sort_order: override ? override.sort_order : 0
            };
        }).sort((a: any, b: any) => {
            if (a.location !== b.location) return a.location.localeCompare(b.location);
            return (a.sort_order || 0) - (b.sort_order || 0);
        });
    });
    
    // Active draft state of form fields
    const [companyFormFields, setCompanyFormFields] = useState(initialFormFields);
    
    const initialFormData = {
        allowed_meal_types: (savedConfig?.allowed_meal_types && savedConfig.allowed_meal_types.length > 0)
            ? savedConfig.allowed_meal_types
            : ['lunch'],
        show_box_lunch_category: savedConfig?.show_box_lunch_category ?? true,
        show_junior_box_lunch_category: savedConfig?.show_junior_box_lunch_category ?? true,
        use_split_box_types: savedConfig?.use_split_box_types ?? false,
        use_sandwich_only: savedConfig?.use_sandwich_only ?? true,
        custom_welcome_message: savedConfig?.custom_welcome_message ?? '',
        use_mountain_mamas_branding: savedConfig?.use_mountain_mamas_branding ?? false,
        confirmation_page_fields: savedConfig?.confirmation_page_fields ?? {},
    };

    const [formData, setFormData] = useState(initialFormData);

    // Sync formData when savedConfig changes
    React.useEffect(() => {
        setFormData({
            allowed_meal_types: (savedConfig?.allowed_meal_types && savedConfig.allowed_meal_types.length > 0)
                ? savedConfig.allowed_meal_types
                : ['lunch'],
            show_box_lunch_category: savedConfig?.show_box_lunch_category ?? true,
            show_junior_box_lunch_category: savedConfig?.show_junior_box_lunch_category ?? true,
            use_split_box_types: savedConfig?.use_split_box_types ?? false,
            use_sandwich_only: savedConfig?.use_sandwich_only ?? true,
            custom_welcome_message: savedConfig?.custom_welcome_message ?? '',
            use_mountain_mamas_branding: savedConfig?.use_mountain_mamas_branding ?? false,
            confirmation_page_fields: savedConfig?.confirmation_page_fields ?? {},
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
        
        const updatedLocationFields = [...locationFields];
        const temp = updatedLocationFields[idxInLocation];
        updatedLocationFields[idxInLocation] = updatedLocationFields[targetIdxInLocation];
        updatedLocationFields[targetIdxInLocation] = temp;
        
        const updatedFieldsWithNewOrders = updatedLocationFields.map((field, index) => ({
            ...field,
            sort_order: index
        }));
        
        const updatedFields = companyFormFields.map(f => {
            if (f.location === currentLocation) {
                return updatedFieldsWithNewOrders.find(u => u.id === f.id)!;
            }
            return f;
        });
        
        setCompanyFormFields(updatedFields);
    };

    return (
        <div className="space-y-8 max-w-4xl">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">App Configuration</h1>
                <p className="text-gray-500 font-medium mt-1">Configure your guest ordering interface, meal types, and custom fields.</p>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Master Meal Type Selection */}
                {activeMasterMealTypes && activeMasterMealTypes.length > 1 && (
                    <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                    <UtensilsCrossed className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">Enabled Meal Categories</CardTitle>
                                    <CardDescription>Select which meal times are offered to your guests in your custom ordering app.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { key: 'lunch', label: 'Lunch', icon: Sun, desc: 'Boxed lunches and sandwiches' },
                                    { key: 'breakfast', label: 'Breakfast', icon: Coffee, desc: 'Morning wraps and breakfast boxes' },
                                    { key: 'dinner', label: 'Dinner', icon: Moon, desc: 'Evening meal selections' },
                                    { key: 'charcuterie', label: 'Charcuterie', icon: Sparkles, desc: 'Gourmet charcuterie boards and boxes' },
                                ].filter(item => activeMasterMealTypes.includes(item.key)).map(item => {
                                    const Icon = item.icon;
                                    const isSelected = formData.allowed_meal_types.includes(item.key);
                                    return (
                                        <div 
                                            key={item.key}
                                            onClick={() => {
                                                const current = formData.allowed_meal_types;
                                                const next = isSelected 
                                                    ? current.filter((k: string) => k !== item.key)
                                                    : [...current, item.key];
                                                if (next.length === 0) {
                                                    toast.error('At least one meal category must remain enabled');
                                                    return;
                                                }
                                                setFormData({ ...formData, allowed_meal_types: next });
                                            }}
                                            className={cn(
                                                "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start justify-between gap-3",
                                                isSelected 
                                                    ? "border-violet-600 bg-violet-50/20 shadow-sm" 
                                                    : "border-gray-100 bg-gray-50/50 opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    "size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                                                    isSelected ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-500"
                                                )}>
                                                    <Icon className="size-4" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{item.label}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                                </div>
                                            </div>
                                            <Switch 
                                                checked={isSelected}
                                                onCheckedChange={() => {}}
                                                className="data-[state=checked]:bg-violet-600 shrink-0 pointer-events-none"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Lunch Variations Configuration */}
                {formData.allowed_meal_types.includes('lunch') && (
                    <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Utensils className="size-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold">Lunch Variations</CardTitle>
                                    <CardDescription>Select which package types your guests can choose from for lunch items.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                <div>
                                    <Label htmlFor="standard_box" className="text-sm font-bold text-gray-800">Standard Box / Bag Lunch</Label>
                                    <p className="text-xs text-gray-500 mt-0.5">Offer full lunch options with complete sides and drinks.</p>
                                </div>
                                <Switch 
                                    id="standard_box"
                                    checked={formData.show_box_lunch_category} 
                                    onCheckedChange={(val) => setFormData({...formData, show_box_lunch_category: val})}
                                    className="data-[state=checked]:bg-violet-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                <div>
                                    <Label htmlFor="junior_box" className="text-sm font-bold text-gray-800">Junior Box / Bag Lunch</Label>
                                    <p className="text-xs text-gray-500 mt-0.5">Offer smaller portion lunch options for kids or light eaters.</p>
                                </div>
                                <Switch 
                                    id="junior_box"
                                    checked={formData.show_junior_box_lunch_category} 
                                    onCheckedChange={(val) => setFormData({...formData, show_junior_box_lunch_category: val})}
                                    className="data-[state=checked]:bg-violet-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                                <div>
                                    <Label htmlFor="sandwich_only" className="text-sm font-bold text-gray-800">Sandwich Only Version</Label>
                                    <p className="text-xs text-gray-500 mt-0.5">Allow guests to order standalone sandwiches without sides.</p>
                                </div>
                                <Switch 
                                    id="sandwich_only"
                                    checked={formData.use_sandwich_only} 
                                    onCheckedChange={(val) => setFormData({...formData, use_sandwich_only: val})}
                                    className="data-[state=checked]:bg-violet-600"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* White-Label Branding & Welcome Message */}
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <CardHeader className="p-8 border-b border-gray-50">
                        <div className="flex items-center gap-4">
                            <div className="size-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                                <Settings className="size-5" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold">App Experience & Branding</CardTitle>
                                <CardDescription>Customize branding, links, and custom greeting messages for your guests.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 bg-gray-50/50">
                            <div>
                                <Label htmlFor="branding" className="text-sm font-bold text-gray-800">Use Mountain Mama's Branding</Label>
                                <p className="text-xs text-gray-500 mt-0.5">Show Mountain Mama's Café logo and header in your custom ordering app.</p>
                            </div>
                            <Switch 
                                id="branding"
                                checked={formData.use_mountain_mamas_branding} 
                                onCheckedChange={(val) => setFormData({...formData, use_mountain_mamas_branding: val})}
                                className="data-[state=checked]:bg-violet-600"
                            />
                        </div>

                        {/* Link Previews */}
                        {defaultSlug && (
                            <div className="p-4 rounded-2xl bg-violet-50/40 border border-violet-100 space-y-3">
                                <div>
                                    <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block mb-1">Standard Company Order Link</span>
                                    <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-violet-100">
                                        <code className="text-xs text-violet-900 font-mono truncate">{typeof window !== 'undefined' ? `${window.location.origin}/${defaultSlug}` : `/${defaultSlug}`}</code>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 rounded-lg text-xs font-bold gap-1.5 border-gray-200 text-gray-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50"
                                                onClick={() => {
                                                    const url = `${window.location.origin}/${defaultSlug}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success('Company link copied to clipboard');
                                                }}
                                            >
                                                <Copy className="size-3.5" />
                                                Copy
                                            </Button>
                                            <a
                                                href={`/${defaultSlug}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-gray-200 text-xs font-bold gap-1.5 text-gray-600 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-colors"
                                            >
                                                <ExternalLink className="size-3.5" />
                                                Preview
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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
