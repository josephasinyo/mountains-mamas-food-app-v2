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

export default function FoodSearchWrapper({ initialItems }: FoodSearchWrapperProps) {
  const { config } = useCompany();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Process items based on company config
  let processedItems = initialItems;

  if (config) {
    processedItems = initialItems.filter(item => {
      // If item is junior box lunch, check if category is allowed
      if (item.category === 'junior_box_lunch' && !config.show_junior_box_lunch_category) {
        return false;
      }
      return true;
    });
  }

  // Filter items by category
  const categoryFilteredItems = selectedCategory === 'all' 
    ? processedItems 
    : processedItems.filter(item => item.category === selectedCategory);

  // Search filter
  const filteredItems = categoryFilteredItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

        {/* Filtered Meals Grid List */}
        {filteredItems.length > 0 ? (
          <FoodList items={filteredItems} />
        ) : (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>🥣</div>
            <p className={styles.noResultsText}>No meals found matching &quot;{searchQuery}&quot;</p>
            <button className={styles.resetBtn} onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}>
              Reset search & filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
