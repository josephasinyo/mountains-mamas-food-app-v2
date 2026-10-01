'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { 
    createIngredient, 
    updateIngredient, 
    deleteIngredient, 
    toggleIngredientActive, 
    updateIngredientSortOrder 
} from './actions';
import type { Ingredient } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import AllergenPicker from '@/components/allergens/AllergenPicker';
import AllergenBadges from '@/components/allergens/AllergenBadges';
import FormattedText from '@/components/ui/FormattedText';
import RichTextEditor from '@/components/ui/RichTextEditor';
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
import { 
    Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, 
    Upload, X, LayoutGrid, List, Search,
    ChevronLeft, ChevronRight, ArrowUp, ArrowDown,
    Cookie, Wheat, Layers
} from 'lucide-react';

const INGREDIENT_TABS = [
    { key: 'cookie', label: 'Cookies', icon: Cookie, singular: 'Cookie' },
    { key: 'bread', label: 'Breads', icon: Wheat, singular: 'Bread' },
] as const;

type IngredientTabType = typeof INGREDIENT_TABS[number]['key'];

interface IngredientsClientProps {
    initialIngredients: Ingredient[];
}

export function IngredientsClient({ initialIngredients }: IngredientsClientProps) {
    const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients);
    const [activeTab, setActiveTab] = useState<IngredientTabType>('cookie');
    const [open, setOpen] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
    const [loading, setLoading] = useState(false);
    const [ingredientToDelete, setIngredientToDelete] = useState<{ id: string; name: string } | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [search, setSearch] = useState('');

    // Form states
    const [name, setName] = useState('');
    const [type, setType] = useState<'bread' | 'cookie'>('cookie');
    const [description, setDescription] = useState('');
    const [sortOrder, setSortOrder] = useState('0');
    const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);

    const hasChanges = editingIngredient ? (
        name !== (editingIngredient.name || '') ||
        type !== (editingIngredient.type || 'cookie') ||
        description !== (editingIngredient.description || '') ||
        sortOrder !== (editingIngredient.sort_order?.toString() || '0') ||
        isActive !== editingIngredient.is_active ||
        imagePreview !== editingIngredient.image_url ||
        imageFile !== null ||
        JSON.stringify(selectedAllergens.slice().sort()) !== JSON.stringify(((editingIngredient.allergens || []) as string[]).slice().sort())
    ) : (
        name.length > 0 || description.length > 0 || selectedAllergens.length > 0 || imageFile !== null || imagePreview !== null
    );

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) {
            const MAX_SIZE = 10 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                toast.error('Image size must be less than 10MB');
                e.target.value = '';
                return;
            }

            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Unsupported image format. Please upload PNG, JPEG, JPG, or WebP.');
                e.target.value = '';
                return;
            }

            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    function closeDialog() {
        setOpen(false);
        setEditingIngredient(null);
        setName('');
        setType(activeTab);
        setDescription('');
        setSortOrder('0');
        setSelectedAllergens([]);
        setIsActive(true);
        setImagePreview(null);
        setImageFile(null);
    }

    function openCreate() {
        closeDialog();
        setType(activeTab);
        setSelectedAllergens([]);
        setOpen(true);
    }

    function openEdit(item: Ingredient) {
        setEditingIngredient(item);
        setName(item.name || '');
        setType(item.type);
        setDescription(item.description || '');
        setSortOrder(item.sort_order?.toString() || '0');
        setSelectedAllergens(Array.isArray(item.allergens) ? item.allergens : []);
        setIsActive(item.is_active);
        setImagePreview(item.image_url || null);
        setImageFile(null);
        setOpen(true);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        try {
            const formData = new FormData();
            formData.set('name', name);
            formData.set('type', type);
            formData.set('description', description);
            formData.set('sort_order', sortOrder);
            formData.set('allergens', JSON.stringify(selectedAllergens));
            formData.set('is_active', isActive ? 'true' : 'false');

            if (imageFile) {
                formData.set('image_file', imageFile);
            }
            formData.set('image_url', (!imageFile && imagePreview) ? imagePreview : '');

            const result = editingIngredient
                ? await updateIngredient(editingIngredient.id, formData)
                : await createIngredient(formData);

            if (result.success && result.data) {
                const savedItem = result.data as Ingredient;
                if (editingIngredient) {
                    setIngredients(prev => prev.map(item => item.id === savedItem.id ? savedItem : item));
                    toast.success(`"${name}" updated successfully`);
                } else {
                    setIngredients(prev => [savedItem, ...prev]);
                    toast.success(`"${name}" created successfully`);
                }
                closeDialog();
            } else {
                toast.error(result.error || 'Failed to save ingredient');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('A network error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleDelete(id: string, name: string) {
        setIngredientToDelete({ id, name });
    }

    async function executeDelete() {
        if (!ingredientToDelete) return;
        const { id, name } = ingredientToDelete;
        const result = await deleteIngredient(id);
        if (result.success) {
            setIngredients(prev => prev.filter(item => item.id !== id));
            toast.success(`"${name}" deleted successfully`);
        } else {
            toast.error(result.error || 'Failed to delete ingredient');
        }
        setIngredientToDelete(null);
    }

    async function handleToggle(id: string, current: boolean) {
        const result = await toggleIngredientActive(id, !current);
        if (result.success) {
            setIngredients(prev => prev.map(item => item.id === id ? { ...item, is_active: !current } : item));
            const item = ingredients.find(i => i.id === id);
            toast.success(`"${item?.name || 'Ingredient'}" is now ${!current ? 'active' : 'hidden'}`);
        } else {
            toast.error(result.error || 'Failed to update visibility');
        }
    }

    // Filter ingredients for the current tab & search query
    const tabIngredients = ingredients
        .filter(item => item.type === activeTab)
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const filteredIngredients = tabIngredients.filter(item => {
        const q = search.toLowerCase();
        return (
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.allergens && item.allergens.some(a => a.toLowerCase().includes(q)))
        );
    });

    async function handleMove(id: string, direction: 'up' | 'down') {
        const currentIndex = filteredIngredients.findIndex(item => item.id === id);
        if (currentIndex === -1) return;
        
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === filteredIngredients.length - 1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentItem = filteredIngredients[currentIndex];
        const neighborItem = filteredIngredients[neighborIndex];

        const currentOrder = currentItem.sort_order || 0;
        const neighborOrder = neighborItem.sort_order || 0;

        const updatedIngredients = ingredients.map(item => {
            if (item.id === currentItem.id) return { ...item, sort_order: neighborOrder };
            if (item.id === neighborItem.id) return { ...item, sort_order: currentOrder };
            return item;
        });
        setIngredients(updatedIngredients);

        await updateIngredientSortOrder(currentItem.id, direction);
    }

    const currentTabInfo = INGREDIENT_TABS.find(t => t.key === activeTab)!;

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Ingredients Management</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {tabIngredients.length} {currentTabInfo.label.toLowerCase()} · {tabIngredients.filter(i => i.is_active).length} active
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-72 mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input 
                            placeholder={`Search ${currentTabInfo.label.toLowerCase()}...`} 
                            className="pl-10 h-10 rounded-xl border-gray-200 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
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
                    <Button onClick={openCreate} className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100 font-bold h-10 px-4">
                        <Plus className="size-4" /> Add {currentTabInfo.singular}
                    </Button>
                </div>
            </div>

            {/* Tab Filter */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
                {INGREDIENT_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const count = ingredients.filter(i => i.type === tab.key).length;
                    const isSelected = activeTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                    ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-[1.02]'
                                    : 'bg-white text-gray-600 hover:bg-gray-100/80 border border-gray-200/60'
                            }`}
                        >
                            <Icon className={`size-4 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                            <span>{tab.label}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                            }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            {filteredIngredients.length === 0 ? (
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <currentTabInfo.icon className="size-10 opacity-20 text-gray-900" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">
                            {search ? `No ${currentTabInfo.label.toLowerCase()} match your search` : `No ${currentTabInfo.label.toLowerCase()} yet`}
                        </p>
                        <p className="text-sm font-medium mt-1">
                            {search ? 'Try adjusting your search terms.' : `Add your first ${currentTabInfo.singular.toLowerCase()} to get started.`}
                        </p>
                        {!search && (
                            <Button className="mt-8 gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100 px-8 h-12 font-bold" onClick={openCreate}>
                                <Plus className="size-5" /> Add First {currentTabInfo.singular}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : viewMode === 'table' ? (
                <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="w-[100px] font-bold text-gray-900 py-4 pl-6 text-center">Image</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Name</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Type</TableHead>
                                <TableHead className="max-w-[340px] font-bold text-gray-900 py-4">Description</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Allergens & Dietary</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4 text-center">Display Order</TableHead>
                                <TableHead className="text-right font-bold text-gray-900 py-4 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIngredients.map((item, idx) => (
                                <TableRow key={item.id} className="border-gray-50 hover:bg-violet-50/10 transition-colors">
                                    <TableCell className="pl-6">
                                        <div 
                                            className="group relative size-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm cursor-pointer hover:border-violet-300 transition-all mx-auto"
                                            onClick={() => openEdit(item)}
                                        >
                                            {item.image_url ? (
                                                <img src={item.image_url} alt={item.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <currentTabInfo.icon className="size-8 text-gray-200" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-[15px] text-gray-900">{item.name}</p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`text-[10px] font-bold rounded-lg px-2.5 py-0.5 border capitalize ${
                                            item.type === 'cookie' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {item.type}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[340px]">
                                        <div className="text-sm text-gray-600 font-medium line-clamp-2 leading-relaxed">
                                            {item.description ? <FormattedText text={item.description} /> : <span className="italic opacity-50">No description provided.</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <AllergenBadges allergens={item.allergens} size="xs" showLabels={true} className="mt-1" />
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={item.is_active ? 'default' : 'secondary'} 
                                            className={`text-[10px] font-bold rounded-lg px-2.5 py-0.5 uppercase tracking-wider ${
                                                item.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50' : 'bg-gray-100 text-gray-400 border-gray-200'
                                            }`}
                                        >
                                            {item.is_active ? 'Active' : 'Hidden'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-30"
                                                onClick={() => handleMove(item.id, 'up')}
                                                disabled={idx === 0}
                                            >
                                                <ArrowUp className="size-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-30"
                                                onClick={() => handleMove(item.id, 'down')}
                                                disabled={idx === filteredIngredients.length - 1}
                                            >
                                                <ArrowDown className="size-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger className="inline-flex items-center justify-center size-9 rounded-xl text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-all cursor-pointer">
                                                <MoreHorizontal className="size-5" />
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[180px] rounded-xl border-gray-100 shadow-xl p-1">
                                                <DropdownMenuItem onClick={() => openEdit(item)} className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700">
                                                    <Pencil className="size-3.5" /> Edit {currentTabInfo.singular}
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggle(item.id, item.is_active)} className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700">
                                                    {item.is_active ? (
                                                        <><EyeOff className="size-3.5" /> Hide from App</>
                                                    ) : (
                                                        <><Eye className="size-3.5" /> Show in App</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                                >
                                                    <Trash2 className="size-3.5" /> Delete {currentTabInfo.singular}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIngredients.map((item) => (
                        <Card key={item.id} className={`rounded-[32px] border-none shadow-sm transition-all duration-300 group ${
                            item.is_active ? 'bg-white ring-1 ring-gray-100 hover:ring-violet-500 hover:shadow-2xl hover:shadow-violet-100' : 'bg-gray-50/80 opacity-70 grayscale'
                        }`}>
                            <CardContent className="p-6">
                                <div className="aspect-[4/3] rounded-2xl bg-gray-100 mb-5 overflow-hidden relative">
                                    {item.image_url ? (
                                        <img src={item.image_url} alt={item.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="size-full flex items-center justify-center text-gray-200">
                                            <currentTabInfo.icon className="size-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <Badge className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider shadow-sm border-none ${
                                            item.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                                        }`}>
                                            {item.is_active ? 'Active' : 'Hidden'}
                                        </Badge>
                                    </div>
                                    
                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="rounded-full bg-white hover:bg-violet-600 hover:text-white transition-all scale-75 group-hover:scale-100 duration-300"
                                            onClick={() => openEdit(item)}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="rounded-full bg-white hover:bg-violet-600 hover:text-white transition-all scale-75 group-hover:scale-100 duration-300"
                                            onClick={() => handleToggle(item.id, item.is_active)}
                                        >
                                            {item.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="destructive" 
                                            className="rounded-full bg-white hover:bg-rose-600 text-rose-600 hover:text-white transition-all scale-75 group-hover:scale-100 duration-300"
                                            onClick={() => handleDelete(item.id, item.name)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="font-bold text-[17px] text-gray-900 tracking-tight">{item.name}</h3>
                                        <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider rounded-lg px-2 border capitalize ${
                                            item.type === 'cookie' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        }`}>
                                            {item.type}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed min-h-[32px]">
                                        {item.description ? <FormattedText text={item.description} /> : 'No description available for this item.'}
                                    </div>
                                    <AllergenBadges allergens={item.allergens} size="xs" showLabels={true} className="mt-2" />
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                            onClick={() => handleMove(item.id, 'up')}
                                            disabled={tabIngredients.findIndex(i => i.id === item.id) === 0}
                                        >
                                            <ChevronLeft className="size-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                            onClick={() => handleMove(item.id, 'down')}
                                            disabled={tabIngredients.findIndex(i => i.id === item.id) === tabIngredients.length - 1}
                                        >
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(item)} className="h-7 text-[10px] font-black uppercase tracking-wider text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg">
                                        Edit Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add / Edit Dialog */}
            <Dialog open={open} onOpenChange={(val) => !val && closeDialog()}>
                <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingIngredient ? `Edit ${currentTabInfo.singular}` : `Add New ${currentTabInfo.singular}`}</DialogTitle>
                        <DialogDescription>
                            {editingIngredient ? `Update details for this ${currentTabInfo.singular.toLowerCase()}.` : `Fill in the details to add a new ${currentTabInfo.singular.toLowerCase()}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="ingredient_name">Name *</Label>
                            <Input 
                                id="ingredient_name" 
                                required 
                                placeholder={type === 'cookie' ? 'e.g. Chocolate Chip Cookie' : 'e.g. Sourdough Bread'}
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Category *</Label>
                            <Select value={type} onValueChange={(v) => setType(v as 'bread' | 'cookie')}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cookie">Cookie</SelectItem>
                                    <SelectItem value="bread">Bread</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ingredient_description" className="text-sm font-bold text-gray-800">
                                Description
                            </Label>
                            <RichTextEditor
                                value={description}
                                onChange={setDescription}
                                placeholder={`Describe the ${type} flavors, texture, or notes...`}
                                minHeight="110px"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Image</Label>
                            <div className="flex flex-col gap-3">
                                {imagePreview ? (
                                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden border bg-muted group">
                                        <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setImageFile(null);
                                                const input = document.getElementById('ingredient_image_file') as HTMLInputElement;
                                                if (input) input.value = '';
                                            }}
                                            className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="ingredient_image_file" 
                                        className="flex flex-col items-center justify-center aspect-[4/3] w-full rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <Upload className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">Click to upload image</p>
                                        </div>
                                    </label>
                                )}
                                <input 
                                    id="ingredient_image_file" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageChange}
                                />
                            </div>
                        </div>

                        {/* Allergen & Dietary Picker */}
                        <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200/80 space-y-2">
                            <AllergenPicker
                                selectedAllergens={selectedAllergens}
                                onChange={setSelectedAllergens}
                            />
                        </div>

                        <div className="flex items-center gap-3 pt-2">
                            <Switch checked={isActive} onCheckedChange={setIsActive} id="active_ingredient" />
                            <Label htmlFor="active_ingredient" className="cursor-pointer">
                                Active <span className="text-muted-foreground font-normal">(visible in ordering dropdowns)</span>
                            </Label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button type="submit" disabled={loading || !hasChanges}>
                                {loading ? 'Saving...' : editingIngredient ? 'Update Ingredient' : 'Create Ingredient'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!ingredientToDelete}
                onClose={() => setIngredientToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Ingredient"
                description={`Are you sure you want to delete "${ingredientToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </>
    );
}
