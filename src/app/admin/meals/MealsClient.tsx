'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { createMeal, updateMeal, deleteMeal, toggleMealActive, updateMealSortOrder } from './actions';
import type { Meal } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { 
    Plus, MoreHorizontal, Pencil, Trash2, Eye, EyeOff, 
    UtensilsCrossed, Upload, X, ImageIcon, LayoutGrid, List, Search,
    ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Printer
} from 'lucide-react';

interface MealsClientProps {
    initialMeals: Meal[];
}

export function MealsClient({ initialMeals }: MealsClientProps) {
    const [meals, setMeals] = useState<Meal[]>(initialMeals);
    const [open, setOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [loading, setLoading] = useState(false);
    const [mealToDelete, setMealToDelete] = useState<{ id: string; name: string } | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [search, setSearch] = useState('');
    const [standardImagePreview, setStandardImagePreview] = useState<string | null>(null);
    const [juniorImagePreview, setJuniorImagePreview] = useState<string | null>(null);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    // Store actual File objects in state to avoid DOM file input issues
    const [mainImageFile, setMainImageFile] = useState<File | null>(null);
    const [standardImageFile, setStandardImageFile] = useState<File | null>(null);
    const [juniorImageFile, setJuniorImageFile] = useState<File | null>(null);

    // Form States
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [sandwichPrice, setSandwichPrice] = useState('');
    const [category, setCategory] = useState('sandwich');
    const [lunchPackage, setLunchPackage] = useState('box');
    const [sortOrder, setSortOrder] = useState('0');
    const [boxIncludes, setBoxIncludes] = useState('');
    const [juniorPrice, setJuniorPrice] = useState('');
    const [juniorBoxIncludes, setJuniorBoxIncludes] = useState('');
    const [allowSplitBox, setAllowSplitBox] = useState(false);
    const [isActive, setIsActive] = useState(true);

    const hasChanges = editingMeal ? (
        name !== (editingMeal.name || '') ||
        description !== (editingMeal.description || '') ||
        price !== (editingMeal.price?.toString() || '') ||
        category !== (editingMeal.category || 'sandwich') ||
        lunchPackage !== (editingMeal.lunch_package || 'box') ||
        sortOrder !== (editingMeal.sort_order?.toString() || '0') ||
        boxIncludes !== (editingMeal.box_includes || '') ||
        juniorPrice !== (editingMeal.junior_price?.toString() || '') ||
        juniorBoxIncludes !== (editingMeal.junior_box_includes || '') ||
        allowSplitBox !== (editingMeal.allow_split_box || false) ||
        isActive !== editingMeal.is_active ||
        imagePreview !== editingMeal.image_url ||
        standardImagePreview !== editingMeal.box_lunch_image_url ||
        juniorImagePreview !== editingMeal.junior_box_lunch_image_url ||
        sandwichPrice !== (editingMeal.sandwich_price?.toString() || '')
    ) : (
        name.length > 0 || description.length > 0 || price.length > 0
    );

    function handleImageChange(e: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'standard' | 'junior') {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (10MB limit)
            const MAX_SIZE = 10 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
                toast.error('Image size must be less than 10MB');
                e.target.value = ''; // Reset input field
                return;
            }

            // Check MIME types
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                toast.error('Unsupported image format. Please upload PNG, JPEG, JPG, or WebP.');
                e.target.value = ''; // Reset input field
                return;
            }

            // Store the actual File object in state
            if (type === 'main') setMainImageFile(file);
            else if (type === 'standard') setStandardImageFile(file);
            else if (type === 'junior') setJuniorImageFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                if (type === 'main') setImagePreview(reader.result as string);
                else if (type === 'standard') setStandardImagePreview(reader.result as string);
                else if (type === 'junior') setJuniorImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    function closeDialog() {
        setOpen(false);
        setEditingMeal(null);
        setName('');
        setDescription('');
        setPrice('');
        setCategory('sandwich');
        setLunchPackage('box');
        setSortOrder('0');
        setBoxIncludes('');
        setJuniorPrice('');
        setJuniorBoxIncludes('');
        setAllowSplitBox(false);
        setIsActive(true);
        setImagePreview(null);
        setStandardImagePreview(null);
        setJuniorImagePreview(null);
        setMainImageFile(null);
        setStandardImageFile(null);
        setJuniorImageFile(null);
        setSandwichPrice('');
    }

    function openCreate() {
        closeDialog();
        setOpen(true);
    }

    function openEdit(meal: Meal) {
        setEditingMeal(meal);
        setName(meal.name || '');
        setDescription(meal.description || '');
        setPrice(meal.price?.toString() || '');
        setCategory(meal.category);
        setLunchPackage(meal.lunch_package || 'box');
        setSortOrder(meal.sort_order?.toString() || '0');
        setBoxIncludes(meal.box_includes || '');
        setJuniorPrice(meal.junior_price?.toString() || '');
        setJuniorBoxIncludes(meal.junior_box_includes || '');
        setAllowSplitBox(meal.allow_split_box || false);
        setIsActive(meal.is_active);
        
        // Correctly map image URLs from the meal object
        setImagePreview(meal.image_url || null);
        setStandardImagePreview(meal.box_lunch_image_url || null);
        setJuniorImagePreview(meal.junior_box_lunch_image_url || null);
        setSandwichPrice(meal.sandwich_price?.toString() || '');
        
        setOpen(true);
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        try {
            // Validate image for new meals
            if (!editingMeal && !imagePreview) {
                toast.error('An image is required for new meals.');
                setLoading(false);
                return;
            }

            // Validate sandwich price if category is sandwich
            if (category === 'sandwich' && (!sandwichPrice || isNaN(parseFloat(sandwichPrice)))) {
                toast.error('Sandwich only price is required.');
                setLoading(false);
                return;
            }

            // Build FormData manually from state to avoid DOM file input issues
            const formData = new FormData();
            formData.set('name', name);
            formData.set('description', description);
            formData.set('price', price);
            formData.set('category', category);
            formData.set('lunch_package', lunchPackage);
            formData.set('allow_split_box', allowSplitBox ? 'true' : 'false');
            formData.set('is_active', isActive ? 'true' : 'false');
            formData.set('box_includes', boxIncludes);
            formData.set('junior_price', juniorPrice);
            formData.set('junior_box_includes', juniorBoxIncludes);

            // Append file objects from state (not from DOM)
            if (mainImageFile) {
                formData.set('image_file', mainImageFile);
            }
            if (standardImageFile) {
                formData.set('standard_image_file', standardImageFile);
            }
            if (juniorImageFile) {
                formData.set('junior_image_file', juniorImageFile);
            }

            // Pass existing URLs for images that weren't changed
            formData.set('image_url', (!mainImageFile && imagePreview?.startsWith('http')) ? imagePreview : '');
            formData.set('standard_image_url', (!standardImageFile && standardImagePreview?.startsWith('http')) ? standardImagePreview : '');
            formData.set('junior_image_url', (!juniorImageFile && juniorImagePreview?.startsWith('http')) ? juniorImagePreview : '');
            
            formData.set('sandwich_price', sandwichPrice);

            const result = editingMeal
                ? await updateMeal(editingMeal.id, formData)
                : await createMeal(formData);

            if (result.success && result.data) {
                if (editingMeal) {
                    setMeals(prev => prev.map(m => m.id === result.data.id ? result.data : m));
                    toast.success(`"${name}" updated successfully`);
                } else {
                    setMeals(prev => [result.data, ...prev]);
                    toast.success(`"${name}" created successfully`);
                }
                closeDialog();
            } else {
                toast.error(result.error || 'Failed to save meal');
            }
        } catch (error) {
            console.error('Save error:', error);
            toast.error('A network error occurred. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    function handleDelete(id: string, name: string) {
        setMealToDelete({ id, name });
    }

    async function executeDelete() {
        if (!mealToDelete) return;
        const { id, name } = mealToDelete;
        const result = await deleteMeal(id);
        if (result.success) {
            setMeals(meals.filter(m => m.id !== id));
            toast.success(`"${name}" deleted successfully`);
        } else {
            toast.error(result.error || 'Failed to delete meal');
        }
        setMealToDelete(null);
    }

    async function handleToggle(id: string, current: boolean) {
        const result = await toggleMealActive(id, !current);
        if (result.success) {
            setMeals(meals.map(m => m.id === id ? { ...m, is_active: !current } : m));
            const meal = meals.find(m => m.id === id);
            toast.success(`"${meal?.name || 'Meal'}" is now ${!current ? 'active' : 'hidden'}`);
        } else {
            toast.error(result.error || 'Failed to update visibility');
        }
    }

    const filteredMeals = meals
        .filter(meal => 
            meal.name.toLowerCase().includes(search.toLowerCase()) ||
            meal.category.toLowerCase().includes(search.toLowerCase()) ||
            (meal.description && meal.description.toLowerCase().includes(search.toLowerCase()))
        )
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    async function handleMove(id: string, direction: 'up' | 'down') {
        const currentIndex = meals.findIndex(m => m.id === id);
        if (currentIndex === -1) return;
        
        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === meals.length - 1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentMeal = meals[currentIndex];
        const neighborMeal = meals[neighborIndex];

        // Swap sort orders
        const currentOrder = currentMeal.sort_order || 0;
        const neighborOrder = neighborMeal.sort_order || 0;

        // Optimization: if they are the same, increment/decrement
        const newCurrentOrder = direction === 'up' ? neighborOrder - 1 : neighborOrder + 1;

        // Update local state first
        const updatedMeals = [...meals];
        updatedMeals[currentIndex] = { ...currentMeal, sort_order: newCurrentOrder };
        setMeals(updatedMeals.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));

        // Update DB
        await updateMealSortOrder(currentMeal.id, newCurrentOrder);
    }

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Menu Management</h1>
                    <p className="text-sm text-muted-foreground font-medium">
                        {meals.length} meal{meals.length !== 1 ? 's' : ''} · {meals.filter(m => m.is_active).length} active
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative w-72 mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input 
                            placeholder="Search meals..." 
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
                    <Button onClick={() => window.print()} variant="outline" className="gap-1.5 rounded-xl border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-bold h-10 px-4">
                        <Printer className="size-4" /> Print Menu
                    </Button>
                    <Button onClick={openCreate} className="gap-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100 font-bold h-10 px-4">
                        <Plus className="size-4" /> Add Meal
                    </Button>
                </div>
            </div>

            {/* Table */}
            {filteredMeals.length === 0 ? (
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50">
                    <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                            <UtensilsCrossed className="size-10 opacity-20" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">
                            {search ? 'No meals match your search' : 'No meals yet'}
                        </p>
                        <p className="text-sm font-medium mt-1">
                            {search ? 'Try adjusting your search terms.' : 'Add your first meal to get started.'}
                        </p>
                        {!search && (
                            <Button className="mt-8 gap-2 rounded-xl bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-100 px-8 h-12 font-bold" onClick={openCreate}>
                                <Plus className="size-5" /> Add First Meal
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
                                <TableHead className="max-w-[300px] font-bold text-gray-900 py-4">Description</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Category</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Price</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4 text-center">Display Order</TableHead>
                                <TableHead className="text-right font-bold text-gray-900 py-4 pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMeals.map((meal, idx) => (
                                <TableRow key={meal.id} className="border-gray-50 hover:bg-violet-50/10 transition-colors">
                                    <TableCell className="pl-6">
                                        <div 
                                            className="group relative size-20 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm cursor-pointer hover:border-violet-300 transition-all mx-auto"
                                            onClick={() => openEdit(meal)}
                                        >
                                            {meal.image_url ? (
                                                <img src={meal.image_url} alt={meal.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <UtensilsCrossed className="size-8 text-gray-200" />
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="font-bold text-[15px] text-gray-900">{meal.name}</p>
                                    </TableCell>
                                    <TableCell className="max-w-[300px]">
                                        <p className="text-sm text-gray-500 font-medium line-clamp-2 leading-relaxed">
                                            {meal.description || <span className="italic opacity-50">No description provided.</span>}
                                        </p>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize text-[10px] font-bold rounded-lg px-2.5 py-0.5 border-gray-200 text-gray-500">{meal.category}</Badge>
                                    </TableCell>
                                    <TableCell className="font-bold text-gray-900">${Number(meal.price).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={meal.is_active ? 'default' : 'secondary'} 
                                            className={`text-[10px] font-bold rounded-lg px-2.5 py-0.5 uppercase tracking-wider ${
                                                meal.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50' : 'bg-gray-100 text-gray-400 border-gray-200'
                                            }`}
                                        >
                                            {meal.is_active ? 'Active' : 'Hidden'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-1">
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-30"
                                                onClick={() => handleMove(meal.id, 'up')}
                                                disabled={idx === 0}
                                            >
                                                <ArrowUp className="size-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-30"
                                                onClick={() => handleMove(meal.id, 'down')}
                                                disabled={idx === filteredMeals.length - 1}
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
                                                <DropdownMenuItem onClick={() => openEdit(meal)} className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700">
                                                    <Pencil className="size-3.5" /> Edit Meal
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleToggle(meal.id, meal.is_active)} className="rounded-lg gap-2 font-bold text-gray-700 focus:bg-violet-50 focus:text-violet-700">
                                                    {meal.is_active ? (
                                                        <><EyeOff className="size-3.5" /> Hide from App</>
                                                    ) : (
                                                        <><Eye className="size-3.5" /> Show in App</>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                                <DropdownMenuItem
                                                    onClick={() => handleDelete(meal.id, meal.name)}
                                                    className="rounded-lg gap-2 font-bold text-rose-600 focus:bg-rose-50 focus:text-rose-700"
                                                >
                                                    <Trash2 className="size-3.5" /> Delete Meal
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
                    {filteredMeals.map((meal) => (
                        <Card key={meal.id} className={`rounded-[32px] border-none shadow-sm transition-all duration-300 group ${
                            meal.is_active ? 'bg-white ring-1 ring-gray-100 hover:ring-violet-500 hover:shadow-2xl hover:shadow-violet-100' : 'bg-gray-50/80 opacity-70 grayscale'
                        }`}>
                            <CardContent className="p-6">
                                <div className="aspect-video rounded-2xl bg-gray-100 mb-5 overflow-hidden relative">
                                    {meal.image_url ? (
                                        <img src={meal.image_url} alt={meal.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="size-full flex items-center justify-center text-gray-200">
                                            <UtensilsCrossed className="size-12" />
                                        </div>
                                    )}
                                    <div className="absolute top-3 right-3 flex gap-2">
                                        <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-black text-gray-900 shadow-sm border border-white/50">
                                            ${Number(meal.price).toFixed(2)}
                                        </div>
                                        <Badge className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider shadow-sm border-none ${
                                            meal.is_active ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                                        }`}>
                                            {meal.is_active ? 'Active' : 'Hidden'}
                                        </Badge>
                                    </div>
                                    
                                    {/* Action Overlays */}
                                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="rounded-full bg-white hover:bg-violet-600 hover:text-white transition-all scale-75 group-hover:scale-100 duration-300"
                                            onClick={() => openEdit(meal)}
                                        >
                                            <Pencil className="size-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="secondary" 
                                            className="rounded-full bg-white hover:bg-violet-600 hover:text-white transition-all scale-75 group-hover:scale-100 duration-300"
                                            onClick={() => handleToggle(meal.id, meal.is_active)}
                                        >
                                            {meal.is_active ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            variant="destructive" 
                                            className="rounded-full bg-white hover:bg-rose-600 text-rose-600 hover:text-white transition-all scale-75 group-hover:scale-100 duration-300"
                                            onClick={() => handleDelete(meal.id, meal.name)}
                                        >
                                            <Trash2 className="size-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-1 mb-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-bold text-[17px] text-gray-900 tracking-tight">{meal.name}</h3>
                                        <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest rounded-lg border-gray-100 text-gray-400 px-2">
                                            {meal.category}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed min-h-[32px]">
                                        {meal.description || 'No description available for this item.'}
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                                    <div className="flex items-center gap-1">
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                            onClick={() => handleMove(meal.id, 'up')}
                                            disabled={meals.findIndex(m => m.id === meal.id) === 0}
                                        >
                                            <ChevronLeft className="size-4" />
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                            onClick={() => handleMove(meal.id, 'down')}
                                            disabled={meals.findIndex(m => m.id === meal.id) === meals.length - 1}
                                        >
                                            <ChevronRight className="size-4" />
                                        </Button>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(meal)} className="h-7 text-[10px] font-black uppercase tracking-wider text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg">
                                        Edit Details
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Dialog */}
            <Dialog open={open} onOpenChange={(val) => !val && closeDialog()}>
                <DialogContent 
                    className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto"
                >
                    <DialogHeader>
                        <DialogTitle>{editingMeal ? 'Edit Meal' : 'Add New Meal'}</DialogTitle>
                        <DialogDescription>
                            {editingMeal ? 'Update this meal\'s details.' : 'Fill in the details to add a new meal to the menu.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input id="name" name="name" required placeholder="Turkey & Havarti"
                                value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description *</Label>
                            <Textarea id="description" name="description" rows={5} required
                                placeholder="Oven roasted turkey with havarti cheese..."
                                value={description} onChange={(e) => setDescription(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Category</Label>
                                <Select value={category} onValueChange={(v) => setCategory(v || '')}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue>
                                            {category.charAt(0).toUpperCase() + category.slice(1)}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sandwich">Sandwich</SelectItem>
                                        <SelectItem value="salad">Salad</SelectItem>
                                        <SelectItem value="cookie">Cookie</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lunch_package">Lunch Package</Label>
                                <Select value={lunchPackage} onValueChange={(val: any) => setLunchPackage(val)}>
                                    <SelectTrigger id="lunch_package" className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="box">Box Lunch</SelectItem>
                                        <SelectItem value="bag">Bag Lunch</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>



                        <div className="space-y-2">
                            <Label>Main Meal Image (Homepage) *</Label>
                            <div className="flex flex-col gap-3">
                                {imagePreview ? (
                                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted group">
                                        <img src={imagePreview} alt="Preview" className="size-full object-cover" />
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                setImagePreview(null);
                                                setMainImageFile(null);
                                                const input = document.getElementById('image_file') as HTMLInputElement;
                                                if (input) input.value = '';
                                            }}
                                            className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label 
                                        htmlFor="image_file" 
                                        className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                    >
                                        <div className="flex flex-col items-center justify-center py-4">
                                            <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                <Upload className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="text-sm font-medium">Click to upload main image</p>
                                        </div>
                                    </label>
                                )}
                                <input 
                                    id="image_file" 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={(e) => handleImageChange(e, 'main')}
                                />
                            </div>
                        </div>

                        {/* Standard Box Section - ALWAYS VISIBLE */}
                        <div className="space-y-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Standard Version</Badge>
                                <h3 className="text-sm font-bold text-gray-900">Standard {lunchPackage === 'box' ? 'Box' : 'Bag'} Details</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="price">Price ($) *</Label>
                                    <Input id="price" name="price" type="number" step="0.01" required
                                        value={price} onChange={(e) => setPrice(e.target.value)}
                                        placeholder="14.00" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="box_includes">
                                    Standard {lunchPackage === 'box' ? 'Box' : 'Bag'} Includes *
                                </Label>
                                <Textarea id="box_includes" name="box_includes" rows={4} required
                                    placeholder={`List everything that goes into the ${lunchPackage}...`}
                                    value={boxIncludes} onChange={(e) => setBoxIncludes(e.target.value)} />
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Standard Meal Image</Label>
                                <div className="flex flex-col gap-3">
                                    {standardImagePreview ? (
                                        <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted group">
                                            <img src={standardImagePreview} alt="Standard Preview" className="size-full object-cover" />
                                            <button 
                                                type="button"
                                                onClick={() => {
                                                    setStandardImagePreview(null);
                                                    setStandardImageFile(null);
                                                    const input = document.getElementById('standard_image_file') as HTMLInputElement;
                                                    if (input) input.value = '';
                                                }}
                                                className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <label 
                                            htmlFor="standard_image_file" 
                                            className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                        >
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                    <Upload className="size-5 text-muted-foreground" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-500">Click to upload standard image</p>
                                            </div>
                                        </label>
                                    )}
                                    <input 
                                        id="standard_image_file" 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => handleImageChange(e, 'standard')}
                                    />
                                </div>
                            </div>
                        </div>

                        {category === 'sandwich' && (
                            <div className="space-y-4 p-4 rounded-2xl bg-amber-50/20 border border-amber-100 mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Sandwich Only Version</Badge>
                                    <h3 className="text-sm font-bold text-gray-900">Sandwich Only Details</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sandwich_price">Sandwich Only Price ($) *</Label>
                                        <Input id="sandwich_price" name="sandwich_price" type="number" step="0.01"
                                            required={category === 'sandwich'}
                                            value={sandwichPrice} onChange={(e) => setSandwichPrice(e.target.value)}
                                            placeholder="8.50" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 py-4 border-y border-gray-100">
                            <Switch checked={allowSplitBox} onCheckedChange={setAllowSplitBox} id="split_box" />
                            <Label htmlFor="split_box" className="cursor-pointer font-bold text-violet-700">
                                Enable Junior Box
                            </Label>
                        </div>



                        {allowSplitBox && (
                            <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="space-y-4 p-4 rounded-2xl bg-violet-50/30 border border-violet-100">
                                    <div className="flex items-center gap-2">
                                        <Badge className="bg-violet-100 text-violet-700 hover:bg-violet-100 border-none px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">Junior Version</Badge>
                                        <h3 className="text-sm font-bold text-gray-900">Junior {lunchPackage === 'box' ? 'Box' : 'Bag'} Details</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="junior_price">Junior Price ($)</Label>
                                            <Input id="junior_price" name="junior_price" type="number" step="0.01"
                                                value={juniorPrice} onChange={(e) => setJuniorPrice(e.target.value)}
                                                placeholder="12.00" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="junior_box_includes">Junior Includes</Label>
                                        <Input id="junior_box_includes" name="junior_box_includes"
                                            placeholder="Smaller sandwich, fruit, cookie..."
                                            value={juniorBoxIncludes} onChange={(e) => setJuniorBoxIncludes(e.target.value)} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Junior Meal Image</Label>
                                        <div className="flex flex-col gap-3">
                                            {juniorImagePreview ? (
                                                <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted group">
                                                    <img src={juniorImagePreview} alt="Junior Preview" className="size-full object-cover" />
                                                    <button 
                                                        type="button"
                                                        onClick={() => {
                                                            setJuniorImagePreview(null);
                                                            setJuniorImageFile(null);
                                                            const input = document.getElementById('junior_image_file') as HTMLInputElement;
                                                            if (input) input.value = '';
                                                        }}
                                                        className="absolute top-2 right-2 size-8 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <label 
                                                    htmlFor="junior_image_file" 
                                                    className="flex flex-col items-center justify-center aspect-video w-full rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex flex-col items-center justify-center py-4">
                                                        <div className="size-10 rounded-full bg-muted flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                                            <Upload className="size-5 text-muted-foreground" />
                                                        </div>
                                                        <p className="text-sm font-medium text-gray-500">Click to upload junior image</p>
                                                    </div>
                                                </label>
                                            )}
                                            <input 
                                                id="junior_image_file" 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                onChange={(e) => handleImageChange(e, 'junior')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-2">
                            <Switch checked={isActive} onCheckedChange={setIsActive} id="active" />
                            <Label htmlFor="active" className="cursor-pointer">
                                Active <span className="text-muted-foreground font-normal">(visible to tour companies)</span>
                            </Label>
                        </div>

                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                            <Button type="submit" disabled={loading || !hasChanges}>
                                {loading ? 'Saving...' : editingMeal ? 'Update Meal' : 'Create Meal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                isOpen={!!mealToDelete}
                onClose={() => setMealToDelete(null)}
                onConfirm={executeDelete}
                title="Delete Meal"
                description={`Are you sure you want to delete "${mealToDelete?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
            {(() => {
                const activeMeals = meals.filter(m => m.is_active);
                const mealChunks = [];
                const chunkSize = 4;
                for (let i = 0; i < activeMeals.length; i += chunkSize) {
                    mealChunks.push(activeMeals.slice(i, i + chunkSize));
                }

                return mounted && createPortal(
                    <div id="print-menu-section" className="hidden">
                        {mealChunks.map((chunk, idx) => (
                            <div 
                                key={idx} 
                                className="print-page flex flex-col justify-center" 
                                style={{ 
                                    pageBreakAfter: idx === mealChunks.length - 1 ? 'avoid' : 'always', 
                                    breakAfter: idx === mealChunks.length - 1 ? 'avoid' : 'page' 
                                }}
                            >
                                    <div className="flex flex-col items-center mb-6 shrink-0">
                                        <svg width="340" height="65" viewBox="0 0 340 65" className="mx-auto select-none pointer-events-none">
                                            <g transform="translate(10, 8)">
                                                <g transform="skewX(-8)">
                                                    <rect x="0" y="2" width="112" height="38" rx="6" fill="#1a1a1a" />
                                                </g>
                                                <text 
                                                    x="56" 
                                                    y="30" 
                                                    fill="white" 
                                                    textAnchor="middle"
                                                    style={{
                                                        fontFamily: 'var(--font-bebas), sans-serif',
                                                        fontSize: '25px',
                                                        fontWeight: 'bold',
                                                        letterSpacing: '2px'
                                                    }}
                                                >
                                                    MOUNTAIN
                                                </text>
                                                <text 
                                                    x="122" 
                                                    y="32" 
                                                    fill="#7c3aed" 
                                                    style={{
                                                        fontFamily: 'var(--font-pacifico), cursive',
                                                        fontSize: '34px'
                                                    }}
                                                >
                                                    Mama's Café
                                                </text>
                                            </g>
                                        </svg>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-3">Menu</p>
                                    </div>
                                
                                <div className="grid grid-cols-2 gap-6 my-auto">
                                    {chunk.map((meal) => (
                                        <div key={meal.id} className="print-card flex flex-col space-y-2 p-3 border border-gray-100 rounded-2xl bg-white shadow-sm">
                                            <div className="relative h-[200px] w-full rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                                                {meal.image_url ? (
                                                    <img 
                                                        src={meal.image_url} 
                                                        alt={meal.name} 
                                                        className="size-full object-cover" 
                                                    />
                                                ) : (
                                                    <div className="size-full flex items-center justify-center text-gray-400">
                                                        <UtensilsCrossed className="size-8" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <h3 className="text-base font-bold text-gray-900 leading-tight">{meal.name}</h3>
                                                </div>
                                                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mt-1">{meal.category}</p>
                                                <p className="text-xs text-gray-600 mt-2 leading-relaxed whitespace-pre-wrap">{meal.description || 'No description provided.'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 flex justify-center shrink-0">
                                    <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" className="select-none pointer-events-none">
                                        <circle cx="20" cy="20" r="18" fill="#EDE9FE" />
                                        <text 
                                            x="20" 
                                            y="24.5" 
                                            fill="#6D28D9" 
                                            textAnchor="middle"
                                            style={{
                                                fontFamily: 'system-ui, -apple-system, sans-serif',
                                                fontSize: '14px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            {idx + 1}
                                        </text>
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>,
                    document.body
                );
            })()}

            {/* Font preloader to ensure browser downloads fonts on page load before print is triggered */}
            <div className="opacity-0 pointer-events-none absolute size-0 overflow-hidden" aria-hidden="true">
                <span style={{ fontFamily: 'var(--font-bebas)' }}>MOUNTAIN</span>
                <span style={{ fontFamily: 'var(--font-pacifico)' }}>Mama's Café</span>
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Pacifico&display=swap');
                @page {
                    size: portrait;
                    margin: 0.8cm 1cm 1.2cm 1cm;
                }
                @media print {
                    html, body {
                        background-color: white !important;
                        color: black !important;
                        height: auto !important;
                        overflow: visible !important;
                    }
                    /* Completely collapse all other containers from layout */
                    body > *:not(#print-menu-section) {
                        display: none !important;
                    }
                    /* Display print container */
                    #print-menu-section {
                        display: block !important;
                        position: relative;
                        width: 100%;
                    }
                    .print-page {
                        height: 100vh !important;
                        position: relative !important;
                        box-sizing: border-box !important;
                        display: flex !important;
                        flex-direction: column !important;
                        justify-content: center !important;
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                        page-break-after: always !important;
                        break-after: page !important;
                    }
                    /* Page break settings */
                    .print-card {
                        page-break-inside: avoid;
                        break-inside: avoid;
                    }
                }
            `}} />
        </>
    );
}
