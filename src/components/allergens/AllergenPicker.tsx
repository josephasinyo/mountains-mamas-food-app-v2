'use client';

import React from 'react';
import { ALLERGEN_LIST, AllergenTag } from '@/lib/allergens';
import { Check, X } from 'lucide-react';

interface AllergenPickerProps {
  selectedAllergens: string[];
  onChange: (allergens: string[]) => void;
  className?: string;
  itemType?: 'meal' | 'bread' | 'cookie' | 'item' | string;
  dietaryTitle?: string;
}

export default function AllergenPicker({
  selectedAllergens = [],
  onChange,
  className = '',
  itemType = 'meal',
  dietaryTitle,
}: AllergenPickerProps) {
  const toggleAllergen = (id: string) => {
    if (selectedAllergens.includes(id)) {
      onChange(selectedAllergens.filter((item) => item !== id));
    } else {
      onChange([...selectedAllergens, id]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const allergenGroup = ALLERGEN_LIST.filter((t) => t.category === 'allergen');
  const dietaryGroup = ALLERGEN_LIST.filter((t) => t.category === 'dietary');

  let resolvedDietaryTitle = dietaryTitle;
  if (!resolvedDietaryTitle) {
    if (itemType === 'cookie') {
      resolvedDietaryTitle = 'THIS COOKIE IS';
    } else if (itemType === 'bread') {
      resolvedDietaryTitle = 'THIS BREAD IS';
    } else if (itemType === 'item') {
      resolvedDietaryTitle = 'THIS ITEM IS';
    } else {
      resolvedDietaryTitle = 'THIS MEAL IS';
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-gray-800">
          Allergens & Dietary Information
        </label>
        {selectedAllergens.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear all ({selectedAllergens.length})
          </button>
        )}
      </div>

      {/* 1. Dietary & Lifestyle Group (THIS MEAL IS) */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          {resolvedDietaryTitle}
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dietaryGroup.map((tag) => {
            const isSelected = selectedAllergens.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleAllergen(tag.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all min-h-[44px] ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/90 text-emerald-950 font-bold shadow-sm ring-1 ring-emerald-400'
                    : 'border-gray-200 bg-white hover:bg-gray-50/90 text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tag.iconUrl}
                    alt={tag.label}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-xs font-semibold leading-snug flex-1 break-words">
                  {tag.label}
                </span>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-emerald-600 text-white' : 'border border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Allergens Group (CONTAINS ALLERGENS) */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
          Contains Allergens
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {allergenGroup.map((tag) => {
            const isSelected = selectedAllergens.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleAllergen(tag.id)}
                className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all min-h-[44px] ${
                  isSelected
                    ? 'border-rose-500 bg-rose-50/90 text-rose-950 font-bold shadow-sm ring-1 ring-rose-400'
                    : 'border-gray-200 bg-white hover:bg-gray-50/90 text-gray-800 hover:border-gray-300'
                }`}
              >
                <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tag.iconUrl}
                    alt={tag.label}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <span className="text-xs font-semibold leading-snug flex-1 break-words">
                  {tag.label}
                </span>
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? 'bg-rose-500 text-white' : 'border border-gray-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
