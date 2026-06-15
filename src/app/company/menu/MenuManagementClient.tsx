'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { UtensilsCrossed, Search, CheckCircle2, Info, Loader2, LayoutGrid, List, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { toggleMenuSelection, updateMenuSortOrder } from '../actions';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface MenuManagementClientProps {
    initialData: any;
}

export default function MenuManagementClient({ initialData }: MenuManagementClientProps) {
    const { meals, selections, config } = initialData;
    const [search, setSearch] = useState('');
    const [pendingId, setPendingId] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
    const [activeImgIndexes, setActiveImgIndexes] = useState<Record<string, number>>({});
    
    // Map sort orders and selection status from selections
    const selectionSortMap = new Map<string, number>(
        selections.map((s: any) => [s.meal_id, s.sort_order || 0])
    );
    const selectionMap = new Map<string, boolean>(
        selections.map((s: any) => [s.meal_id, !!s.is_selected])
    );

    const [localMeals, setLocalMeals] = useState([...meals].sort((a, b) => {
        const orderA = selectionSortMap.get(a.id) || 0;
        const orderB = selectionSortMap.get(b.id) || 0;
        return orderA - orderB;
    }));

    const filteredMeals = localMeals.filter((meal: any) => 
        meal.name.toLowerCase().includes(search.toLowerCase()) ||
        meal.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleMove = async (mealId: string, direction: 'up' | 'down') => {
        const currentIndex = localMeals.findIndex(m => m.id === mealId);
        if (currentIndex === -1) return;

        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === localMeals.length - 1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const currentMeal = localMeals[currentIndex];
        const neighborMeal = localMeals[neighborIndex];

        // We use the neighbor's order as base
        const neighborOrder = selectionSortMap.get(neighborMeal.id) || 0;
        const newOrder = direction === 'up' ? neighborOrder - 1 : neighborOrder + 1;

        // Update local state
        const updatedMeals = [...localMeals];
        const [movedItem] = updatedMeals.splice(currentIndex, 1);
        updatedMeals.splice(neighborIndex, 0, movedItem);
        
        setLocalMeals(updatedMeals);
        selectionSortMap.set(mealId, newOrder);

        // Update DB
        const result = await updateMenuSortOrder(mealId, newOrder);
        if (!result.success) {
            toast.error('Failed to update display order');
        }
    };

    const handleToggle = async (mealId: string, currentStatus: boolean) => {
        setPendingId(mealId);
        startTransition(async () => {
            const result = await toggleMenuSelection(mealId, !currentStatus);
            if (result.success) {
                toast.success(`Menu updated: ${meals.find((m: any) => m.id === mealId)?.name}`);
            } else {
                toast.error('Failed to update menu selection');
            }
            setPendingId(null);
        });
    };

    const categories = Array.from(new Set(meals.map((m: any) => m.category)));

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Menu Management</h1>
                    <p className="text-gray-500 font-medium mt-1">Select the meals you want to offer to your guides and customers.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
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
                    <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                        <Input 
                            placeholder="Search meals..." 
                            className="pl-10 h-11 rounded-xl border-gray-200 bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMeals.map((meal: any) => {
                        const isSelected = selectionMap.get(meal.id) ?? true;
                        // 1. Filter images based on App Settings configurations
                        const availableImages = [
                            { label: 'Main', url: meal.image_url },
                            ...(config?.show_box_lunch_category !== false ? [{ label: 'Standard Box', url: meal.box_lunch_image_url }] : []),
                            ...(config?.show_junior_box_lunch_category ? [{ label: 'Junior Box', url: meal.junior_box_lunch_image_url }] : []),
                            ...(config?.use_sandwich_only ? [{ label: 'Sandwich Only', url: meal.sandwich_image_url }] : []),
                        ].filter(img => !!img.url);

                        const activeIndex = activeImgIndexes[meal.id] ?? 0;
                        const activeImg = availableImages[activeIndex]?.url || meal.image_url;

                        // 2. Determine price and label dynamically based on active slideshow slide
                        const currentSlideLabel = availableImages[activeIndex]?.label || 'Main';
                        let displayPrice = meal.price;
                        let displayLabel = 'Standard Box';

                        if (currentSlideLabel === 'Junior Box') {
                            displayPrice = meal.junior_price || meal.price;
                            displayLabel = 'Junior Box';
                        } else if (currentSlideLabel === 'Sandwich Only') {
                            displayPrice = meal.sandwich_price || meal.price;
                            displayLabel = 'Sandwich Only';
                        } else if (currentSlideLabel === 'Main') {
                            // If Main slide is shown, default to Standard Box if enabled, otherwise Junior, otherwise Sandwich
                            const showStandardPrice = config?.show_box_lunch_category !== false;
                            const showJuniorPrice = !!config?.show_junior_box_lunch_category && meal.junior_price > 0;
                            const showSandwichPrice = !!config?.use_sandwich_only && meal.sandwich_price > 0;
                            
                            if (showStandardPrice) {
                                displayPrice = meal.price;
                                displayLabel = 'Standard Box';
                            } else if (showJuniorPrice) {
                                displayPrice = meal.junior_price;
                                displayLabel = 'Junior Box';
                            } else if (showSandwichPrice) {
                                displayPrice = meal.sandwich_price;
                                displayLabel = 'Sandwich Only';
                            }
                        }
                        
                        return (
                            <Card key={meal.id} className={`rounded-[32px] border-none shadow-sm transition-all duration-300 group ${
                                isSelected ? 'bg-white ring-1 ring-gray-100 hover:ring-violet-500 hover:shadow-2xl hover:shadow-violet-100' : 'bg-gray-50/80 opacity-70 grayscale'
                            }`}>
                                <CardContent className="p-6">
                                    <div className="aspect-[4/3] rounded-2xl bg-gray-100 mb-5 overflow-hidden relative">
                                        {activeImg ? (
                                            <img 
                                                src={activeImg} 
                                                alt={meal.name} 
                                                className="size-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                            />
                                        ) : (
                                            <div className="size-full flex items-center justify-center text-gray-200">
                                                <UtensilsCrossed className="size-12" />
                                            </div>
                                        )}

                                        {/* Image Pagination Dots */}
                                        {availableImages.length > 1 && (
                                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-md px-2.5 py-1.5 rounded-full z-10 border border-white/10">
                                                {availableImages.map((img, idx) => {
                                                    const isActive = activeIndex === idx;
                                                    return (
                                                        <button
                                                            key={img.label}
                                                            title={img.label}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveImgIndexes(prev => ({ ...prev, [meal.id]: idx }));
                                                            }}
                                                            className={`size-2 rounded-full transition-all ${
                                                                isActive 
                                                                    ? 'bg-white scale-125 shadow-sm' 
                                                                    : 'bg-white/40 hover:bg-white/60'
                                                            }`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Slide Navigation Arrows */}
                                        {availableImages.length > 1 && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const prevIdx = (activeIndex - 1 + availableImages.length) % availableImages.length;
                                                        setActiveImgIndexes(prev => ({ ...prev, [meal.id]: prevIdx }));
                                                    }}
                                                    className="absolute left-3 top-1/2 -translate-y-1/2 size-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                                >
                                                    <ChevronLeft className="size-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const nextIdx = (activeIndex + 1) % availableImages.length;
                                                        setActiveImgIndexes(prev => ({ ...prev, [meal.id]: nextIdx }));
                                                    }}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 size-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-sm z-10 transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                                                >
                                                    <ChevronRight className="size-4" />
                                                </button>
                                            </>
                                        )}

                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl text-[12px] font-black text-gray-900 shadow-sm border border-white/50 flex flex-col items-center">
                                                <span>${Number(displayPrice).toFixed(2)}</span>
                                                <span className="text-[8px] text-violet-600 border-t border-gray-100 mt-0.5 pt-0.5 font-bold uppercase tracking-wider">{displayLabel}</span>
                                            </div>
                                            <Badge className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider shadow-sm border-none ${
                                                isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                                            }`}>
                                                {isSelected ? 'Available' : 'Hidden'}
                                            </Badge>
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
                                                disabled={localMeals.findIndex(m => m.id === meal.id) === 0}
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                                onClick={() => handleMove(meal.id, 'down')}
                                                disabled={localMeals.findIndex(m => m.id === meal.id) === localMeals.length - 1}
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                            {pendingId === meal.id && <Loader2 className="size-3 text-violet-600 animate-spin ml-1" />}
                                        </div>
                                        <Switch 
                                            checked={isSelected} 
                                            onCheckedChange={() => handleToggle(meal.id, isSelected)}
                                            className="data-[state=checked]:bg-violet-600 scale-90"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="w-[100px] font-bold text-gray-900 py-4 pl-6 text-center">Image</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Name</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Category</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Price</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Status</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4 text-center">Order</TableHead>
                                <TableHead className="text-right font-bold text-gray-900 py-4 pr-6">Selection</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMeals.map((meal: any, idx) => {
                                const isSelected = selectionMap.get(meal.id) ?? true;
                                const availableImages = [
                                    { label: 'Main', url: meal.image_url },
                                    ...(config?.show_box_lunch_category !== false ? [{ label: 'Standard Box', url: meal.box_lunch_image_url }] : []),
                                    ...(config?.show_junior_box_lunch_category ? [{ label: 'Junior Box', url: meal.junior_box_lunch_image_url }] : []),
                                    ...(config?.use_sandwich_only ? [{ label: 'Sandwich Only', url: meal.sandwich_image_url }] : []),
                                ].filter(img => !!img.url);

                                const activeIndex = activeImgIndexes[meal.id] ?? 0;
                                const activeImg = availableImages[activeIndex]?.url || meal.image_url;

                                const showStandardPrice = config?.show_box_lunch_category !== false;
                                const showJuniorPrice = !!config?.show_junior_box_lunch_category && meal.junior_price > 0;
                                const showSandwichPrice = !!config?.use_sandwich_only && meal.sandwich_price > 0;

                                const currentSlideLabel = availableImages[activeIndex]?.label || 'Main';
                                let displayPrice = meal.price;
                                let displayLabel = 'Standard Box';

                                if (currentSlideLabel === 'Junior Box') {
                                    displayPrice = meal.junior_price || meal.price;
                                    displayLabel = 'Junior Box';
                                } else if (currentSlideLabel === 'Sandwich Only') {
                                    displayPrice = meal.sandwich_price || meal.price;
                                    displayLabel = 'Sandwich Only';
                                } else if (currentSlideLabel === 'Main') {
                                    if (showStandardPrice) {
                                        displayPrice = meal.price;
                                        displayLabel = 'Standard Box';
                                    } else if (showJuniorPrice) {
                                        displayPrice = meal.junior_price;
                                        displayLabel = 'Junior Box';
                                    } else if (showSandwichPrice) {
                                        displayPrice = meal.sandwich_price;
                                        displayLabel = 'Sandwich Only';
                                    }
                                }

                                return (
                                    <TableRow key={meal.id} className="border-gray-50 hover:bg-violet-50/10 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className="size-16 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm mx-auto relative">
                                                    {activeImg ? (
                                                        <img src={activeImg} alt={meal.name} className="size-full object-cover" />
                                                    ) : (
                                                        <UtensilsCrossed className="size-6 text-gray-200" />
                                                    )}
                                                </div>
                                                {availableImages.length > 1 && (
                                                    <div className="flex gap-1 bg-gray-100 p-0.5 rounded-full border border-gray-200">
                                                        {availableImages.map((img, i) => {
                                                            const isActive = activeIndex === i;
                                                            return (
                                                                <button
                                                                    key={img.label}
                                                                    title={img.label}
                                                                    onClick={() => setActiveImgIndexes(prev => ({ ...prev, [meal.id]: i }))}
                                                                    className={`size-2 rounded-full transition-all ${
                                                                        isActive ? 'bg-violet-600 scale-110 shadow-sm' : 'bg-gray-300 hover:bg-gray-400'
                                                                    }`}
                                                                />
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-bold text-[15px] text-gray-900">{meal.name}</p>
                                            <p className="text-xs text-gray-500 font-medium line-clamp-1">{meal.description}</p>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize text-[10px] font-bold rounded-lg px-2.5 py-0.5 border-gray-200 text-gray-500 bg-gray-50/50">{meal.category}</Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            <div>${Number(displayPrice).toFixed(2)}</div>
                                            <div className="text-[10px] text-violet-600 font-bold uppercase tracking-wider">{displayLabel}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Badge 
                                                    variant={isSelected ? 'default' : 'secondary'} 
                                                    className={`text-[10px] font-bold rounded-lg px-2.5 py-0.5 uppercase tracking-wider ${
                                                        isSelected ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50' : 'bg-gray-100 text-gray-400 border-gray-200'
                                                    }`}
                                                >
                                                    {isSelected ? 'Active' : 'Disabled'}
                                                </Badge>
                                                {pendingId === meal.id && <Loader2 className="size-3 text-violet-600 animate-spin" />}
                                            </div>
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
                                            <Switch 
                                                checked={isSelected} 
                                                onCheckedChange={() => handleToggle(meal.id, isSelected)}
                                                className="data-[state=checked]:bg-violet-600 scale-90"
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            )}

            {filteredMeals.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-6">
                        <Search className="size-10 text-gray-200" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">No meals found</h3>
                    <p className="text-gray-500 mt-1 max-w-xs">Try adjusting your search to find what you&apos;re looking for.</p>
                </div>
            )}

            <div className="p-6 rounded-3xl bg-violet-50 border border-violet-100 flex items-start gap-4">
                <div className="size-10 rounded-xl bg-white flex items-center justify-center text-violet-600 shadow-sm shrink-0">
                    <Info className="size-5" />
                </div>
                <div>
                    <h4 className="font-bold text-violet-900">Pro Tip</h4>
                    <p className="text-sm text-violet-700/80 mt-1 font-medium leading-relaxed">
                        Changes here are applied instantly to your custom ordering app. Your guides will see the updated menu the next time they refresh their page.
                    </p>
                </div>
            </div>
        </div>
    );
}
