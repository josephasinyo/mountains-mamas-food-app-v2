'use client';

import { useState } from 'react';
import { FoodItem } from '@/lib/types';
import { useCompany } from '@/components/context/CompanyProvider';
import SearchBar from '@/components/ui/SearchBar';
import FoodList from './FoodList';
import styles from './FoodSearchWrapper.module.css';

interface FoodSearchWrapperProps {
  initialItems: FoodItem[];
}

const MEAL_TYPE_CONFIG = [
  { id: 'lunch', label: 'Lunch', icon: '🥪', description: 'Handcrafted sandwiches, wraps, salads, and box lunches' },
  { id: 'breakfast', label: 'Breakfast', icon: '☀️', description: 'Fresh morning items and breakfast boxes' },
  { id: 'dinner', label: 'Dinner', icon: '🍽️', description: 'Savory dinners and evening entrees' },
  { id: 'charcuterie', label: 'Charcuterie', icon: '🧀', description: 'Artisan meats, cheeses, and grazing boxes' },
] as const;

export default function FoodSearchWrapper({ initialItems }: FoodSearchWrapperProps) {
  const { config } = useCompany();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<string>('all');

  const allowedMealTypes: string[] = (config?.allowed_meal_types && config.allowed_meal_types.length > 0)
    ? config.allowed_meal_types
    : ['lunch'];

  // Process items based on company config and allowed meal types
  let processedItems = initialItems.filter(item => {
    const itemMealType = item.meal_type || 'lunch';
    if (!allowedMealTypes.includes(itemMealType)) {
      return false;
    }
    // If item is junior box lunch, check if category is allowed
    if (item.category === 'junior_box_lunch' && !config?.show_junior_box_lunch_category) {
      return false;
    }
    return true;
  });

  // Search filter
  const searchFilteredItems = processedItems.filter(item => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  // Identify active meal types that have at least 1 activated meal for this company
  const availableMealTypes = MEAL_TYPE_CONFIG.filter(type => {
    return allowedMealTypes.includes(type.id) && processedItems.some(item => (item.meal_type || 'lunch') === type.id);
  });

  const hasMultipleMealTypes = availableMealTypes.length > 1;

  // Sections to display
  const sectionsToRender = (selectedMealType === 'all'
    ? availableMealTypes
    : availableMealTypes.filter(t => t.id === selectedMealType)
  ).map(type => {
    const items = searchFilteredItems.filter(item => (item.meal_type || 'lunch') === type.id);
    return {
      ...type,
      items,
    };
  }).filter(section => section.items.length > 0);

  return (
    <div className={styles.container}>
      {/* MAIN MENU FLOW */}
      <div className={styles.menuSection}>
        {/* Elegant Search Bar */}
        <div className={styles.searchContainer}>
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search for your favorite meal..."
          />
        </div>

        {/* Meal Type Filter Chips (Shown if company has activated items in >1 meal type) */}
        {hasMultipleMealTypes && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <button
              onClick={() => setSelectedMealType('all')}
              className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all ${
                selectedMealType === 'all'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-105'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All Items ({searchFilteredItems.length})
            </button>
            {availableMealTypes.map(type => {
              const count = searchFilteredItems.filter(item => (item.meal_type || 'lunch') === type.id).length;
              const isSelected = selectedMealType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedMealType(type.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-md shadow-violet-200 scale-105'
                      : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected ? 'bg-violet-800 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Render sections with headers if multiple types exist or if filtered */}
        {sectionsToRender.length > 0 ? (
          <div className="space-y-12">
            {sectionsToRender.map(section => (
              <div key={section.id} className="space-y-4">
                {/* Section Header (rendered if multiple types active or when viewing all) */}
                {hasMultipleMealTypes && (
                  <div className="border-b border-gray-100 pb-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{section.icon}</span>
                      <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                        {section.label}
                      </h2>
                      <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full">
                        {section.items.length} {section.items.length === 1 ? 'option' : 'options'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium">
                      {section.description}
                    </p>
                  </div>
                )}
                
                <FoodList items={section.items} />
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🥣</div>
            <p className={styles.noResultsText}>
              {searchQuery ? `No meals found matching "${searchQuery}"` : 'No meals currently available in this section.'}
            </p>
            <button
              className={styles.resetBtn}
              onClick={() => { setSearchQuery(''); setSelectedMealType('all'); }}
            >
              Reset search & filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
