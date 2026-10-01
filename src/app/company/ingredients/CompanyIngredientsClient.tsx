'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Search, LayoutGrid, List, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Cookie, Wheat } from 'lucide-react';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { updateCompanyIngredientsConfig } from '../actions';
import { toast } from 'sonner';
import type { Ingredient } from '@/lib/supabase/types';
import AllergenBadges from '@/components/allergens/AllergenBadges';
import FormattedText from '@/components/ui/FormattedText';

interface CompanyIngredientsClientProps {
    initialData: {
        success: boolean;
        ingredients: Ingredient[];
        mealPageOptions: {
            breads?: string[];
            cookies?: string[];
        };
    };
}

const INGREDIENT_TABS = [
    { key: 'cookie', label: 'Cookies', icon: Cookie, singular: 'Cookie' },
    { key: 'bread', label: 'Breads', icon: Wheat, singular: 'Bread' },
] as const;

type IngredientTabType = typeof INGREDIENT_TABS[number]['key'];

export default function CompanyIngredientsClient({ initialData }: CompanyIngredientsClientProps) {
    const { ingredients = [], mealPageOptions = {} } = initialData;
    const [activeTab, setActiveTab] = useState<IngredientTabType>('cookie');
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [isPending, startTransition] = useTransition();

    // Initial configured arrays
    const masterBreads = ingredients.filter(i => i.type === 'bread');
    const masterCookies = ingredients.filter(i => i.type === 'cookie');

    // Helper: determine active selections and company sort order
    const getInitialSelectedMap = () => {
        const selectedMap: Record<string, boolean> = {};

        // Breads
        if (mealPageOptions.breads && Array.isArray(mealPageOptions.breads) && mealPageOptions.breads.length > 0) {
            masterBreads.forEach(b => {
                selectedMap[b.name.toLowerCase()] = mealPageOptions.breads!.some(
                    name => name.toLowerCase() === b.name.toLowerCase()
                );
            });
        } else {
            // Default: all active master breads are enabled
            masterBreads.forEach(b => {
                selectedMap[b.name.toLowerCase()] = true;
            });
        }

        // Cookies
        if (mealPageOptions.cookies && Array.isArray(mealPageOptions.cookies) && mealPageOptions.cookies.length > 0) {
            masterCookies.forEach(c => {
                selectedMap[c.name.toLowerCase()] = mealPageOptions.cookies!.some(
                    name => name.toLowerCase() === c.name.toLowerCase()
                );
            });
        } else {
            // Default: all active master cookies are enabled
            masterCookies.forEach(c => {
                selectedMap[c.name.toLowerCase()] = true;
            });
        }

        return selectedMap;
    };

    const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>(getInitialSelectedMap);

    // Sort company lists based on configured mealPageOptions order
    const sortListByConfig = (list: Ingredient[], configuredNames?: string[]) => {
        if (!configuredNames || !Array.isArray(configuredNames) || configuredNames.length === 0) {
            return [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        }

        const nameIndexMap = new Map<string, number>();
        configuredNames.forEach((name, idx) => {
            nameIndexMap.set(name.toLowerCase(), idx);
        });

        return [...list].sort((a, b) => {
            const indexA = nameIndexMap.has(a.name.toLowerCase()) ? nameIndexMap.get(a.name.toLowerCase())! : 999 + (a.sort_order || 0);
            const indexB = nameIndexMap.has(b.name.toLowerCase()) ? nameIndexMap.get(b.name.toLowerCase())! : 999 + (b.sort_order || 0);
            return indexA - indexB;
        });
    };

    const [localBreads, setLocalBreads] = useState(() => sortListByConfig(masterBreads, mealPageOptions.breads));
    const [localCookies, setLocalCookies] = useState(() => sortListByConfig(masterCookies, mealPageOptions.cookies));

    const currentList = activeTab === 'cookie' ? localCookies : localBreads;

    const filteredList = currentList.filter(item => {
        const q = search.toLowerCase();
        return (
            item.name.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q)) ||
            (item.allergens && item.allergens.some(a => a.toLowerCase().includes(q)))
        );
    });

    const activeCount = currentList.filter(item => selectedMap[item.name.toLowerCase()]).length;

    // Save company configuration
    const saveConfig = async (
        updatedBreadsList: Ingredient[],
        updatedCookiesList: Ingredient[],
        updatedSelectedMap: Record<string, boolean>
    ) => {
        const selectedBreads = updatedBreadsList
            .filter(b => updatedSelectedMap[b.name.toLowerCase()])
            .map(b => b.name);

        const selectedCookies = updatedCookiesList
            .filter(c => updatedSelectedMap[c.name.toLowerCase()])
            .map(c => c.name);

        const result = await updateCompanyIngredientsConfig({
            breads: selectedBreads,
            cookies: selectedCookies,
        });

        return result;
    };

    const handleToggle = (item: Ingredient) => {
        const nextStatus = !selectedMap[item.name.toLowerCase()];
        const nextMap = { ...selectedMap, [item.name.toLowerCase()]: nextStatus };
        setSelectedMap(nextMap);

        startTransition(async () => {
            const result = await saveConfig(localBreads, localCookies, nextMap);
            if (result.success) {
                toast.success(`"${item.name}" ${nextStatus ? 'enabled' : 'disabled'} for your ordering app`);
            } else {
                setSelectedMap(selectedMap);
                toast.error('Failed to update ingredient selection');
            }
        });
    };

    const handleMove = (itemId: string, direction: 'up' | 'down') => {
        const list = activeTab === 'cookie' ? [...localCookies] : [...localBreads];
        const currentIndex = list.findIndex(i => i.id === itemId);
        if (currentIndex === -1) return;

        if (direction === 'up' && currentIndex === 0) return;
        if (direction === 'down' && currentIndex === list.length - 1) return;

        const neighborIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
        const [movedItem] = list.splice(currentIndex, 1);
        list.splice(neighborIndex, 0, movedItem);

        if (activeTab === 'cookie') {
            setLocalCookies(list);
        } else {
            setLocalBreads(list);
        }

        startTransition(async () => {
            const result = await saveConfig(
                activeTab === 'bread' ? list : localBreads,
                activeTab === 'cookie' ? list : localCookies,
                selectedMap
            );
            if (!result.success) {
                toast.error('Failed to update sort order');
            }
        });
    };

    const currentTabInfo = INGREDIENT_TABS.find(t => t.key === activeTab)!;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Ingredients Management</h1>
                    <p className="text-gray-500 font-medium mt-1">
                        Choose which {currentTabInfo.label.toLowerCase()} appear in your ordering app and arrange their display order.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('table')}
                            className={`h-8 rounded-lg px-3 transition-all ${
                                viewMode === 'table' ? 'bg-white shadow-sm text-violet-600 font-bold' : 'text-gray-500'
                            }`}
                        >
                            <List className="size-4 mr-1.5" />
                            <span className="text-xs">Table</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewMode('cards')}
                            className={`h-8 rounded-lg px-3 transition-all ${
                                viewMode === 'cards' ? 'bg-white shadow-sm text-violet-600 font-bold' : 'text-gray-500'
                            }`}
                        >
                            <LayoutGrid className="size-4 mr-1.5" />
                            <span className="text-xs">Cards</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filter Bar & Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {INGREDIENT_TABS.map(tab => {
                        const Icon = tab.icon;
                        const count = tab.key === 'cookie' ? localCookies.length : localBreads.length;
                        const activeC = (tab.key === 'cookie' ? localCookies : localBreads).filter(
                            i => selectedMap[i.name.toLowerCase()]
                        ).length;
                        const isSelected = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
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
                                    {activeC}/{count} active
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Search */}
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                    <Input
                        placeholder={`Search ${currentTabInfo.label.toLowerCase()}...`}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-10 h-11 rounded-2xl border-gray-200 bg-white"
                    />
                </div>
            </div>

            {/* Content */}
            {filteredList.length === 0 ? (
                <Card className="rounded-[32px] border-none shadow-xl shadow-gray-200/50">
                    <CardContent className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <div className="size-20 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                            <currentTabInfo.icon className="size-10 opacity-20 text-gray-900" />
                        </div>
                        <p className="font-bold text-gray-900 text-lg">
                            {search ? `No ${currentTabInfo.label.toLowerCase()} match your search` : `No ${currentTabInfo.label.toLowerCase()} available`}
                        </p>
                        <p className="text-sm font-medium mt-1 text-gray-500">
                            {search ? 'Try adjusting your search terms.' : 'Contact Mountain Mama’s Café to add master ingredients.'}
                        </p>
                    </CardContent>
                </Card>
            ) : viewMode === 'table' ? (
                <Card className="rounded-3xl border-none shadow-xl shadow-gray-200/50 overflow-hidden bg-white">
                    <Table>
                        <TableHeader className="bg-gray-50/60">
                            <TableRow className="border-gray-100">
                                <TableHead className="w-[100px] font-bold text-gray-900 py-4 pl-6 text-center">Image</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Name</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Category</TableHead>
                                <TableHead className="max-w-[340px] font-bold text-gray-900 py-4">Description</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4">Allergens & Dietary</TableHead>
                                <TableHead className="font-bold text-gray-900 py-4 text-center">App Status</TableHead>
                                <TableHead className="text-right font-bold text-gray-900 py-4 pr-6">Order</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredList.map((item, idx) => {
                                const isSelected = Boolean(selectedMap[item.name.toLowerCase()]);
                                return (
                                    <TableRow
                                        key={item.id}
                                        className={`border-gray-50 transition-colors ${
                                            isSelected ? 'hover:bg-violet-50/10' : 'bg-gray-50/40 opacity-70'
                                        }`}
                                    >
                                        <TableCell className="pl-6">
                                            <div className="size-18 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm mx-auto">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.name} className="size-full object-cover" />
                                                ) : (
                                                    <currentTabInfo.icon className="size-7 text-gray-200" />
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
                                                {item.description ? <FormattedText text={item.description} /> : <span className="italic opacity-50">No description available.</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <AllergenBadges allergens={item.allergens} size="xs" showLabels={true} itemType={item.type} className="mt-1" />
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <Switch
                                                    checked={isSelected}
                                                    onCheckedChange={() => handleToggle(item)}
                                                />
                                                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                                                    isSelected ? 'text-emerald-600' : 'text-gray-400'
                                                }`}>
                                                    {isSelected ? 'Active' : 'Hidden'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                                    onClick={() => handleMove(item.id, 'up')}
                                                    disabled={idx === 0}
                                                >
                                                    <ArrowUp className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-8 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                                    onClick={() => handleMove(item.id, 'down')}
                                                    disabled={idx === filteredList.length - 1}
                                                >
                                                    <ArrowDown className="size-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredList.map((item, idx) => {
                        const isSelected = Boolean(selectedMap[item.name.toLowerCase()]);
                        return (
                            <Card
                                key={item.id}
                                className={`rounded-[32px] border-none shadow-sm transition-all duration-300 group ${
                                    isSelected
                                        ? 'bg-white ring-1 ring-gray-100 hover:ring-violet-500 hover:shadow-2xl hover:shadow-violet-100'
                                        : 'bg-gray-50/80 opacity-70 grayscale'
                                }`}
                            >
                                <CardContent className="p-6">
                                    <div className="aspect-[4/3] rounded-2xl bg-gray-100 mb-5 overflow-hidden relative shadow-sm">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                className="size-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="size-full flex items-center justify-center text-gray-200">
                                                <currentTabInfo.icon className="size-12" />
                                            </div>
                                        )}
                                        <div className="absolute top-3 right-3 flex gap-2">
                                            <Badge
                                                className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 uppercase tracking-wider shadow-sm border-none ${
                                                    isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-400 text-white'
                                                }`}
                                            >
                                                {isSelected ? 'Active in App' : 'Hidden'}
                                            </Badge>
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
                                            {item.description ? <FormattedText text={item.description} /> : 'No description available.'}
                                        </div>
                                        <AllergenBadges allergens={item.allergens} size="xs" showLabels={true} itemType={item.type} className="mt-2" />
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                                onClick={() => handleMove(item.id, 'up')}
                                                disabled={currentList.findIndex(i => i.id === item.id) === 0}
                                            >
                                                <ChevronLeft className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-7 text-gray-300 hover:text-violet-600 hover:bg-violet-50 rounded-lg disabled:opacity-20"
                                                onClick={() => handleMove(item.id, 'down')}
                                                disabled={currentList.findIndex(i => i.id === item.id) === currentList.length - 1}
                                            >
                                                <ChevronRight className="size-4" />
                                            </Button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={isSelected}
                                                onCheckedChange={() => handleToggle(item)}
                                                id={`toggle-${item.id}`}
                                            />
                                            <label
                                                htmlFor={`toggle-${item.id}`}
                                                className="text-xs font-bold text-gray-700 cursor-pointer select-none"
                                            >
                                                {isSelected ? 'Enabled' : 'Disabled'}
                                            </label>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
