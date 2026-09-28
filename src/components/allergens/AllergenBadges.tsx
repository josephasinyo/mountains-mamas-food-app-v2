'use client';

import React from 'react';
import { getAllergensByIds, AllergenTag } from '@/lib/allergens';
import { AlertTriangle, Sparkles } from 'lucide-react';

interface AllergenBadgesProps {
  allergens?: (string | null | undefined)[] | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
  itemType?: 'meal' | 'bread' | 'cookie' | 'item' | string;
  dietaryPrefix?: string;
}

export default function AllergenBadges({
  allergens,
  size = 'md',
  showLabels = false,
  className = '',
  itemType = 'meal',
  dietaryPrefix,
}: AllergenBadgesProps) {
  const tags = getAllergensByIds(allergens || []);

  if (!tags || tags.length === 0) {
    return null;
  }

  const dietaryTags = tags.filter((t) => t.category === 'dietary');
  const allergenTags = tags.filter((t) => t.category === 'allergen');

  // Compact icon-only mode (for Food Cards & Table lists)
  if (!showLabels) {
    const iconDimension = size === 'xs' ? 20 : size === 'sm' ? 24 : 28;
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {dietaryTags.map((tag) => (
          <div
            key={tag.id}
            title={tag.label}
            className="relative rounded-full overflow-hidden flex-shrink-0 border border-emerald-300 shadow-sm hover:scale-105 transition-transform"
            style={{ width: iconDimension, height: iconDimension }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tag.iconUrl}
              alt={tag.label}
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          </div>
        ))}
        {allergenTags.map((tag) => (
          <div
            key={tag.id}
            title={`Contains ${tag.label}`}
            className="relative rounded-full overflow-hidden flex-shrink-0 border border-amber-300 shadow-sm hover:scale-105 transition-transform"
            style={{ width: iconDimension, height: iconDimension }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tag.iconUrl}
              alt={tag.label}
              className="w-full h-full object-cover rounded-full"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    );
  }

  // Full Categorized View (Option 1: Distinct Dietary row + "Contains" Allergen warning)
  const isXs = size === 'xs';
  const containerPadding = isXs ? 'p-1.5 rounded-xl text-[11px]' : 'p-2 rounded-2xl text-xs';
  const pillPadding = isXs ? 'px-2 py-0.5 rounded-full text-[11px] gap-1 font-medium' : 'px-2.5 py-1 rounded-full text-xs gap-1.5 font-bold';
  const iconSize = isXs ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const iconWrapperSize = isXs ? 'w-3.5 h-3.5' : 'w-4 h-4';

  let resolvedDietaryLabel = dietaryPrefix;
  if (!resolvedDietaryLabel) {
    if (itemType === 'cookie') {
      resolvedDietaryLabel = 'This cookie is:';
    } else if (itemType === 'bread') {
      resolvedDietaryLabel = 'This bread is:';
    } else if (itemType === 'item') {
      resolvedDietaryLabel = 'This item is:';
    } else {
      resolvedDietaryLabel = 'This meal is:';
    }
  }

  return (
    <div className={`space-y-1.5 my-1.5 ${className}`}>
      {/* 1. Positive Dietary Suitability Badges */}
      {dietaryTags.length > 0 && (
        <div className={`inline-flex flex-wrap items-center gap-1.5 ${containerPadding} bg-emerald-50/70 border border-emerald-200/70 text-emerald-950 shadow-xs`}>
          <div className="flex items-center gap-1 text-emerald-800 font-bold px-1 flex-shrink-0">
            <Sparkles className={`${iconSize} text-emerald-600 stroke-[2.5]`} />
            <span>{resolvedDietaryLabel}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {dietaryTags.map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center ${pillPadding} bg-white text-emerald-950 border border-emerald-300 shadow-xs hover:bg-emerald-50/70 transition-colors`}
              >
                <span className={`relative ${iconWrapperSize} rounded-full overflow-hidden flex-shrink-0`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tag.iconUrl}
                    alt={tag.label}
                    className="w-full h-full object-cover rounded-full"
                  />
                </span>
                <span>{tag.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. Contains Allergens Alert Bar */}
      {allergenTags.length > 0 && (
        <div className={`inline-flex flex-wrap items-center gap-1.5 ${containerPadding} bg-amber-50/70 border border-amber-200/70 text-amber-950 shadow-xs`}>
          <div className="flex items-center gap-1 text-amber-800 font-bold px-1 flex-shrink-0">
            <AlertTriangle className={`${iconSize} text-amber-600 stroke-[2.5]`} />
            <span>Contains:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {allergenTags.map((tag) => (
              <span
                key={tag.id}
                className={`inline-flex items-center ${pillPadding} bg-white text-stone-900 border border-amber-300 shadow-xs hover:bg-amber-50/70 transition-colors`}
              >
                <span className={`relative ${iconWrapperSize} rounded-full overflow-hidden flex-shrink-0`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={tag.iconUrl}
                    alt={tag.label}
                    className="w-full h-full object-cover rounded-full"
                  />
                </span>
                <span>{tag.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
