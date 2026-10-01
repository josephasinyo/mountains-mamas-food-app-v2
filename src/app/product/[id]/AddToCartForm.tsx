'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { FoodItem } from '@/lib/types';
import type { Ingredient } from '@/lib/supabase/types';
import { useCart } from '@/hooks/useCart';
import { findGfCookieOption } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import AllergenBadges from '@/components/allergens/AllergenBadges';
import FormattedText from '@/components/ui/FormattedText';
import { parseOptionItem } from '@/lib/allergens';
import { Check, ChevronDown, Cookie, Wheat } from 'lucide-react';
import styles from './AddToCartForm.module.css';

interface Props {
  item: FoodItem; // Base item
  variants?: FoodItem[]; // Available lunch box variants
  ingredients?: Ingredient[];
}

const SANDWICH_OPTIONS = [
  'Sandwich',
  'Make it a wrap'
];

const DRESSING_OPTIONS = [
  'Huckleberry vinaigrette',
  'Blue Cheese',
  'Ranch'
];

import { useCompany } from '@/components/context/CompanyProvider';

export default function AddToCartForm({ item, ingredients = [] }: Props) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { company, config, globalSettings, formFields, isLoading } = useCompany();

  const isLunch = !item.meal_type || item.meal_type === 'lunch';
  const isSalad = isLunch && item.category === 'salad' && !item.name.toLowerCase().includes('sandwich');

  const isSandwichAllowed = isLunch && !!config?.use_sandwich_only && item.category === 'sandwich';
  const isBoxAllowed = isLunch && !!config?.show_box_lunch_category;
  const isJuniorAllowed = isLunch && !!config?.show_junior_box_lunch_category && 
    (item.allow_split_box || item.category === 'sandwich' || item.category === 'salad' || item.name.toLowerCase().includes('sandwich'));

  const enabledOptionsCount = isLunch 
    ? (isSandwichAllowed ? 1 : 0) + (isBoxAllowed ? 1 : 0) + (isJuniorAllowed ? 1 : 0)
    : 1;

  const defaultVariant = useMemo(() => {
    if (!isLunch) return 'standard';
    if (isSalad) {
      return isBoxAllowed ? 'standard' : 'junior';
    }
    if (isBoxAllowed) return 'standard';
    if (isJuniorAllowed) return 'junior';
    if (isSandwichAllowed) return 'sandwich';
    return 'standard';
  }, [isLunch, isBoxAllowed, isJuniorAllowed, isSandwichAllowed, isSalad]);

  const [selectedVariant, setSelectedVariant] = useState<'standard' | 'junior' | 'sandwich'>(defaultVariant);
  
  // Sync selected variant when config or allowed statuses change
  useEffect(() => {
    if (!isLunch) return;
    if (selectedVariant === 'standard' && !isBoxAllowed) {
      setSelectedVariant(defaultVariant);
    } else if (selectedVariant === 'junior' && !isJuniorAllowed) {
      setSelectedVariant(defaultVariant);
    } else if (selectedVariant === 'sandwich' && !isSandwichAllowed) {
      setSelectedVariant(defaultVariant);
    }
  }, [isLunch, selectedVariant, isBoxAllowed, isJuniorAllowed, isSandwichAllowed, defaultVariant]);

  const showSplitOptions = isLunch && enabledOptionsCount >= 2 && !isSalad;

  const activeImage = !isLunch
    ? (item.image_url || '/placeholder.png')
    : (selectedVariant === 'sandwich'
        ? (item.sandwich_image_url || item.image_url || '/placeholder.png')
        : (selectedVariant === 'junior'
            ? (item.junior_box_lunch_image_url || item.image_url || '/placeholder.png')
            : (item.box_lunch_image_url || item.image_url || '/placeholder.png')));

  const price = !isLunch
    ? (item.price || 0)
    : (selectedVariant === 'sandwich'
        ? (item.sandwich_price || 0)
        : (selectedVariant === 'junior'
            ? (item.junior_price || item.price || 0)
            : (item.price || 0)));

  // Breads list from database ingredients
  const breadIngredients = useMemo<Ingredient[]>(() => {
    const dbBreads = (ingredients || []).filter(i => i.type === 'bread' && i.is_active);
    if (dbBreads.length > 0) {
      const mealOpts = config?.meal_page_options;
      const parsed = typeof mealOpts === 'string' ? JSON.parse(mealOpts) : mealOpts;
      if (parsed?.breads && Array.isArray(parsed.breads) && parsed.breads.length > 0) {
        const filtered = parsed.breads
          .map((name: string) => dbBreads.find(b => b.name.toLowerCase() === name.toLowerCase()))
          .filter(Boolean) as Ingredient[];
        if (filtered.length > 0) return filtered;
      }
      return dbBreads;
    }

    // Fallback if no ingredients passed yet
    const globalBreads = (globalSettings?.bread_options && Array.isArray(globalSettings.bread_options)) 
      ? globalSettings.bread_options 
      : ['White Sourdough', 'Whole Grain Wheat', 'Gluten-Free Bread'];
    
    return globalBreads.map((name: string, idx: number) => ({
      id: `fallback-bread-${idx}`,
      name,
      type: 'bread' as const,
      description: '',
      image_url: null,
      allergens: name.toLowerCase().includes('gluten') ? ['Gluten-Free'] : ['Vegetarian'],
      is_active: true,
      sort_order: idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as Ingredient[];
  }, [ingredients, config, globalSettings]);

  // Cookies list from database ingredients
  const cookieIngredients = useMemo<Ingredient[]>(() => {
    const dbCookies = (ingredients || []).filter(i => i.type === 'cookie' && i.is_active);
    if (dbCookies.length > 0) {
      const mealOpts = config?.meal_page_options;
      const parsed = typeof mealOpts === 'string' ? JSON.parse(mealOpts) : mealOpts;
      if (parsed?.cookies && Array.isArray(parsed.cookies) && parsed.cookies.length > 0) {
        const filtered = parsed.cookies
          .map((name: string) => dbCookies.find(c => c.name.toLowerCase() === name.toLowerCase()))
          .filter(Boolean) as Ingredient[];
        if (filtered.length > 0) return filtered;
      }
      return dbCookies;
    }

    // Fallback if no ingredients passed yet
    const globalCookies = (globalSettings?.cookie_options && Array.isArray(globalSettings.cookie_options)) 
      ? globalSettings.cookie_options 
      : ['Chocolate Chip Cookie', 'Gluten-Free Brownie'];

    return globalCookies.map((name: string, idx: number) => ({
      id: `fallback-cookie-${idx}`,
      name,
      type: 'cookie' as const,
      description: '',
      image_url: null,
      allergens: name.toLowerCase().includes('gluten') ? ['Gluten-Free'] : ['Contains Dairy', 'Contains Eggs'],
      is_active: true,
      sort_order: idx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })) as Ingredient[];
  }, [ingredients, config, globalSettings]);

  // Compute the default bread option (company-specific overrides)
  const defaultBreadOption = useMemo(() => {
    if (company?.slug === 'teton-excursions-llc' && breadIngredients.length > 0) {
      if (item.name === 'The Vegetarian') {
        const wholeGrain = breadIngredients.find((b: Ingredient) => b.name.toLowerCase().includes('whole grain'));
        if (wholeGrain) return wholeGrain.name;
      } else {
        const herby = breadIngredients.find((b: Ingredient) => b.name.toLowerCase().includes('herby'));
        if (herby) return herby.name;
      }
    }
    return breadIngredients[0]?.name || 'White Sourdough';
  }, [company?.slug, item.name, breadIngredients]);

  // State
  const [quantity, setQuantity] = useState<number | string>(1);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  // Dynamic Field Values State
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});

  // Initialize field values when fields load
  useEffect(() => {
    if (formFields.length > 0) {
      const initialValues: Record<string, any> = {};
      formFields.forEach(field => {
        if (field.location === 'meal_page') {
          if (field.name === 'bread_type') initialValues[field.name] = defaultBreadOption;
          else if (field.name === 'cookie_choice') initialValues[field.name] = cookieIngredients[0]?.name || 'Chocolate Chip Cookie';
          else if (field.name === 'sandwich_options') initialValues[field.name] = SANDWICH_OPTIONS[0];
          else if (field.name === 'dressing_options') initialValues[field.name] = DRESSING_OPTIONS[0];
          else if (field.type === 'select') {
            const opts = field.default_options || field.options || [];
            initialValues[field.name] = opts.length > 0 ? opts[0] : '';
          } else initialValues[field.name] = '';
        }
      });
      setFieldValues(initialValues);
    }
  }, [formFields, breadIngredients, cookieIngredients, defaultBreadOption]);

  const handleFieldChange = (name: string, value: any) => {
    setFieldValues(prev => {
      const nextValues = { ...prev, [name]: value };
      
      // Auto-logic when Gluten-Free bread is selected
      if (name === 'bread_type' && typeof value === 'string' && value.toLowerCase().includes('gluten')) {
        // Find a cookie option that represents a gluten-free brownie / cookie
        const gfCookie = cookieIngredients.find(c => 
          c.name.toLowerCase().includes('gluten') || 
          (c.allergens && c.allergens.some(a => a.toLowerCase().includes('gluten-free')))
        )?.name || findGfCookieOption(cookieIngredients.map(c => c.name));
        
        if (gfCookie) {
          nextValues['cookie_choice'] = gfCookie;
        }

        // Set customizations/allergy text to Gluten-Free if empty or doesn't already say it
        const currentCustom = nextValues['customizations'] || '';
        if (!currentCustom.toLowerCase().includes('gluten-free') && !currentCustom.toLowerCase().includes('gluten free')) {
          nextValues['customizations'] = currentCustom ? `${currentCustom}, Gluten-Free` : 'Gluten-Free';
        }
      }
      
      return nextValues;
    });
  };
  
  // Popup State
  const [showPopup, setShowPopup] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync selected options when the dynamic lists change
  useEffect(() => {
    if (breadIngredients.length > 0 && !fieldValues['bread_type']) {
      handleFieldChange('bread_type', defaultBreadOption);
    }
    if (cookieIngredients.length > 0 && !fieldValues['cookie_choice']) {
      handleFieldChange('cookie_choice', cookieIngredients[0]?.name);
    }
  }, [breadIngredients, cookieIngredients, fieldValues, defaultBreadOption]);

  const handleAddToCart = () => {
    const finalQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity;
    
    if (!finalQuantity || finalQuantity <= 0) {
      return;
    }

    const pkgLabel = item.lunch_package === 'bag' ? 'Bag' : 'Box';
    let launchTypeStr = `${pkgLabel} Lunch`;
    if (!isLunch) {
      launchTypeStr = item.meal_type ? (item.meal_type.charAt(0).toUpperCase() + item.meal_type.slice(1)) : 'Item';
    } else if (selectedVariant === 'junior') {
      launchTypeStr = `Junior ${pkgLabel} Lunch`;
    } else if (selectedVariant === 'sandwich') {
      launchTypeStr = 'Sandwich only';
    }

    if (isLunch && enabledOptionsCount === 1 && !isSalad) {
      if (selectedVariant === 'standard') {
        launchTypeStr = `This is a ${item.lunch_package === 'bag' ? 'bag' : 'box'} lunch`;
      } else if (selectedVariant === 'junior') {
        launchTypeStr = `This is a junior ${item.lunch_package === 'bag' ? 'bag' : 'box'} lunch`;
      } else if (selectedVariant === 'sandwich') {
        launchTypeStr = 'This is a standalone sandwich';
      }
    }

    addToCart(
      {
        ...item,
        cartId: `${item.id}-${selectedVariant}-${Date.now()}`,
        quantity: finalQuantity,
        selectedOption: launchTypeStr,
        unitPrice: price,
        guest_name: fieldValues['guest_name'] || '',
        customizations: fieldValues['customizations'] || '',
        bread_type: (!isLunch || isSalad) ? undefined : fieldValues['bread_type'],
        cookie_choice: (!isLunch || selectedVariant === 'sandwich') ? undefined : fieldValues['cookie_choice'],
        dynamic_fields: fieldValues // Store all field values
      } as any, 
      finalQuantity, 
      launchTypeStr, 
      price
    );

    setPopupMessage(`${finalQuantity}x added!`);
    setShowPopup(true);
    setIsLeaving(false);

    setQuantity('');
    // Clear dynamic fields
    const resetValues = { ...fieldValues };
    Object.keys(resetValues).forEach(key => {
      if (!['bread_type', 'cookie_choice', 'sandwich_options', 'dressing_options'].includes(key)) {
        resetValues[key] = '';
      }
    });
    setFieldValues(resetValues);

    setTimeout(() => {
        setIsLeaving(true);
        setTimeout(() => {
            setShowPopup(false);
            if (company?.slug) {
                router.push(`/${company.slug}`);
            } else if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
            } else {
                router.push('/');
            }
        }, 300);
    }, 600);
  };

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  // Enhanced Custom Dropdown for Ingredients (Breads & Cookies)
  const renderIngredientDropdown = (
    label: string,
    id: string,
    selectedValue: string,
    ingredientList: Ingredient[],
    type: 'bread' | 'cookie'
  ) => {
    const isOpen = openDropdown === id;
    const selectedItem = ingredientList.find(
      i => i.name.toLowerCase() === (selectedValue || '').toLowerCase()
    ) || ingredientList[0];

    const Icon = type === 'bread' ? Wheat : Cookie;

    return (
      <div className={styles.section} key={id}>
        <label className={styles.label}>{label}</label>
        <div className="relative">
          {/* Trigger Button */}
          <div
            onClick={() => toggleDropdown(id)}
            className="flex items-center justify-between p-2.5 sm:p-3 rounded-2xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-md hover:shadow-violet-50/50 cursor-pointer transition-all duration-200"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
              <div className="size-11 sm:size-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
                {selectedItem?.image_url ? (
                  <img src={selectedItem.image_url} alt={selectedItem.name} className="size-full object-cover" />
                ) : (
                  <Icon className="size-6 text-gray-300" />
                )}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[15px] font-bold text-gray-900 truncate">
                  {selectedItem ? selectedItem.name : selectedValue}
                </span>
                {selectedItem?.allergens && selectedItem.allergens.length > 0 && (
                  <div className="mt-0.5">
                    <AllergenBadges 
                      allergens={selectedItem.allergens} 
                      size="xs" 
                      showLabels={true} 
                      itemType={type} 
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 text-gray-400">
              <ChevronDown className={`size-5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violet-600' : ''}`} />
            </div>
          </div>

          {/* Expanded Rich Options Dropdown */}
          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 z-40 bg-white rounded-3xl border border-gray-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] p-2.5 max-h-[380px] overflow-y-auto space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
              {ingredientList.map((ingredient) => {
                const isSelected = (selectedItem?.id && selectedItem.id === ingredient.id) || 
                  (selectedItem?.name.toLowerCase() === ingredient.name.toLowerCase());
                return (
                  <div
                    key={ingredient.id}
                    onClick={() => {
                      handleFieldChange(id, ingredient.name);
                      setOpenDropdown(null);
                    }}
                    className={`flex items-start gap-3.5 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-50/70 border-violet-300 ring-1 ring-violet-200/80 shadow-sm'
                        : 'bg-white border-gray-100 hover:border-violet-200 hover:bg-violet-50/20'
                    }`}
                  >
                    <div className="w-20 h-16 sm:w-24 sm:h-18 rounded-xl bg-gray-100 border border-gray-100 overflow-hidden shrink-0 shadow-sm relative">
                      {ingredient.image_url ? (
                        <img src={ingredient.image_url} alt={ingredient.name} className="size-full object-cover" />
                      ) : (
                        <div className="size-full flex items-center justify-center text-gray-300">
                          <Icon className="size-8" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 py-0.5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-[14px] sm:text-[15px] font-extrabold text-gray-900 leading-tight">
                          {ingredient.name}
                        </h4>
                        {isSelected && (
                          <span className="size-5 rounded-full bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Check className="size-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      {ingredient.allergens && ingredient.allergens.length > 0 && (
                        <div className="mb-1.5" onClick={e => e.stopPropagation()}>
                          <AllergenBadges 
                            allergens={ingredient.allergens} 
                            size="xs" 
                            showLabels={true} 
                            itemType={type} 
                          />
                        </div>
                      )}

                      {ingredient.description && (
                        <div className="text-xs text-gray-500 font-medium line-clamp-2 leading-relaxed">
                          <FormattedText text={ingredient.description} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Standard Dropdown for other fields (Sandwich Options, Dressing, Custom Selects)
  const renderStandardDropdown = (
    label: string, 
    id: string, 
    selectedValue: string, 
    options: { label: string; onClick: () => void }[]
  ) => {
    const isOpen = openDropdown === id;
    const parsedSelected = parseOptionItem(selectedValue);

    return (
      <div className={styles.section} key={id}>
        <label className={styles.label}>{label}</label>
        <div className={styles.dropdown}>
          <div className={styles.selected} onClick={() => toggleDropdown(id)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, paddingRight: '8px', minWidth: 0 }}>
              <span style={{ fontSize: '15px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {parsedSelected.name || selectedValue}
              </span>
              {parsedSelected.allergens.length > 0 && (
                <div style={{ width: '100%' }}>
                  <AllergenBadges allergens={parsedSelected.allergens} size="xs" showLabels={true} itemType="item" className="my-0.5" />
                </div>
              )}
            </div>
            <svg 
              className={`${styles.chevron} ${isOpen ? styles.rotate : ''}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
          {isOpen && (
            <div className={styles.options}>
              {options.map((opt, i) => {
                const parsedOpt = parseOptionItem(opt.label);
                return (
                  <div 
                    key={i} 
                    className={styles.option}
                    onClick={() => {
                      opt.onClick();
                      setOpenDropdown(null);
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100%', minWidth: 0 }}>
                      <span style={{ fontSize: '15px', fontWeight: 500, color: '#1f2937' }}>
                        {parsedOpt.name}
                      </span>
                      {parsedOpt.allergens.length > 0 && (
                        <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
                          <AllergenBadges allergens={parsedOpt.allergens} size="xs" showLabels={true} itemType="item" className="my-0.5" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className={styles.form} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ 
            width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTopColor: '#8b5cf6',
            borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px'
          }} />
          Loading menu options...
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className={styles.form} ref={formRef}>
      {showPopup && (
         <div className={`${styles.popup} ${isLeaving ? styles.leaving : ''}`}>
             <div className={styles.iconCircle}>
                <svg className={styles.checkIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
             </div>
             <div className={styles.popupText}>
                <span className={styles.popupTitle}>Added to Cart!</span>
                <span className={styles.popupDetail}>{popupMessage}</span>
             </div>
         </div>
      )}

      {/* Reactive Image Header */}
      <div className={styles.imageWrapper}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
              src={activeImage || '/placeholder.png'} 
              alt={item.name} 
              className={styles.image} 
          />
      </div>

      <div className={styles.detailsWrapper}>
        <div className={styles.headerRow}>
            <h1 className={styles.title}>{item.name}</h1>
            {config?.show_prices && price > 0 && (
              <span className={styles.priceTag}>${price.toFixed(2)}</span>
            )}
        </div>
        <AllergenBadges allergens={item.allergens} size="sm" showLabels={true} className="mt-1 mb-3" />
        {isLunch && enabledOptionsCount === 1 && !isSalad && (
          <div className={styles.singleOptionBanner}>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ width: '20px', height: '20px', flexShrink: 0 }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>
              {selectedVariant === 'standard' && `This is a ${item.lunch_package === 'bag' ? 'bag' : 'box'} lunch`}
              {selectedVariant === 'junior' && `This is a junior ${item.lunch_package === 'bag' ? 'bag' : 'box'} lunch`}
              {selectedVariant === 'sandwich' && 'This is a standalone sandwich'}
            </span>
          </div>
        )}
        
        {/* Item Description / Box Contents */}
        {!isLunch ? (
          item.description ? (
            <div className={styles.ingredientsBox}>
              <p className="text-sm text-gray-700 leading-relaxed m-0">
                <FormattedText text={item.description} />
              </p>
            </div>
          ) : null
        ) : (
          (item.description || !isSalad) && (
            <div className={styles.ingredientsBox}>
              {item.description && (
                <div style={{ marginBottom: (!isSalad ? '12px' : '0') }}>
                  <strong>{isSalad ? 'Salad' : 'Sandwich'} includes:</strong> <FormattedText text={item.description} />
                </div>
              )}
              {!isSalad && selectedVariant !== 'sandwich' && (
                <div>
                  <strong>{item.lunch_package === 'bag' ? 'Bag includes:' : 'Box includes:'}</strong> {selectedVariant === 'junior'
                    ? (item.junior_box_includes || 'Sandwich, chips, cookie')
                    : (item.box_includes || 'Sandwich, fruit, water, chips, cookie')
                  }
                </div>
              )}
            </div>
          )
        )}

        {/* Meal Options Selector */}
        {showSplitOptions && !isSalad && (
            <div className={styles.section}>
                <label className={styles.label}>Meal Options</label>
                <div className={styles.variantSelector}>
                    {isBoxAllowed && (
                        <div 
                            className={`${styles.variantCard} ${selectedVariant === 'standard' ? styles.activeVariant : ''}`}
                            onClick={() => setSelectedVariant('standard')}
                        >
                            <div>
                            <div className={styles.variantName}>{item.lunch_package === 'bag' ? 'Bag Lunch' : 'Box Lunch'}</div>
                            {config?.show_prices && <div className={styles.variantPrice}>${(item.price || 0).toFixed(2)}</div>}
                            </div>
                        </div>
                    )}
                    
                    {isJuniorAllowed && (
                        <div 
                            className={`${styles.variantCard} ${selectedVariant === 'junior' ? styles.activeVariant : ''}`}
                            onClick={() => setSelectedVariant('junior')}
                        >
                            <div>
                            <div className={styles.variantName}>Junior {item.lunch_package === 'bag' ? 'Bag' : 'Box'}</div>
                            {config?.show_prices && <div className={styles.variantPrice}>${(item.junior_price || item.price || 0).toFixed(2)}</div>}
                            </div>
                        </div>
                    )}

                    {isSandwichAllowed && (
                        <div 
                            className={`${styles.variantCard} ${selectedVariant === 'sandwich' ? styles.activeVariant : ''}`}
                            onClick={() => setSelectedVariant('sandwich')}
                        >
                            <div>
                            <div className={styles.variantName}>Sandwich only</div>
                            {config?.show_prices && item.sandwich_price && item.sandwich_price > 0 ? (
                                <div className={styles.variantPrice}>${Number(item.sandwich_price).toFixed(2)}</div>
                            ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Dynamic Fields */}
        {formFields
          .filter(f => f.location === 'meal_page' && f.is_enabled)
          .map(field => {
            // Special logic for core lunch-only fields
            if (!isLunch && ['sandwich_options', 'bread_type', 'bread_options', 'cookie_choice', 'dressing_options'].includes(field.name)) {
              return null;
            }
            if (field.name === 'sandwich_options' && isSalad) return null;
            if (field.name === 'bread_options' && isSalad) return null;
            if (field.name === 'dressing_options' && !isSalad) return null;
            if (field.name === 'cookie_choice' && selectedVariant === 'sandwich') return null;

            const currentValue = fieldValues[field.name] || '';

            // Render rich dropdown for breads
            if (field.name === 'bread_type' || field.name === 'bread_options') {
              return renderIngredientDropdown(
                field.label,
                'bread_type',
                currentValue,
                breadIngredients,
                'bread'
              );
            }

            // Render rich dropdown for cookies
            if (field.name === 'cookie_choice') {
              return renderIngredientDropdown(
                field.label,
                'cookie_choice',
                currentValue,
                cookieIngredients,
                'cookie'
              );
            }

            if (field.type === 'select' || ['sandwich_options', 'dressing_options'].includes(field.name)) {
              let options: string[] = [];
              if (field.name === 'sandwich_options') options = SANDWICH_OPTIONS;
              else if (field.name === 'dressing_options') options = DRESSING_OPTIONS;
              else options = field.default_options || field.options || [];

              return renderStandardDropdown(
                field.label,
                field.name,
                currentValue,
                options.map(opt => ({ label: opt, onClick: () => handleFieldChange(field.name, opt) }))
              );
            }

            if (field.type === 'textarea' || field.name === 'customizations') {
              return (
                <div className={styles.section} key={field.id}>
                  <label className={styles.label}>{field.label}</label>
                  <textarea 
                    value={currentValue}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className={styles.quantityInput}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    rows={3}
                    style={{ resize: 'vertical' }}
                    required={field.is_required}
                  />
                </div>
              );
            }

            return (
              <div className={styles.section} key={field.id}>
                <label className={styles.label}>{field.label}</label>
                <input 
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={currentValue}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className={styles.quantityInput}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  required={field.is_required}
                />
              </div>
            );
          })}

        <div className={styles.section}>
          <label className={styles.label}>Quantity</label>
          <div className={styles.quantityControl}>
             <input 
               type="number" 
               value={quantity} 
               onChange={(e) => {
                 const val = e.target.value;
                 if (val === '') {
                   setQuantity('');
                 } else {
                   const num = parseInt(val);
                   setQuantity(isNaN(num) ? '' : num);
                 }
               }}
               className={styles.quantityInput}
               placeholder="Qty"
               min="1"
             />
          </div>
        </div>

        <div className={styles.actions}>
           <Button 
             onClick={handleAddToCart}
             className={styles.addButton}
           >
             <svg 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="white" 
               strokeWidth="3" 
               strokeLinecap="round" 
               strokeLinejoin="round" 
               style={{ width: '20px', height: '20px', marginRight: '8px' }}
             >
               <line x1="12" y1="5" x2="12" y2="19" />
               <line x1="5" y1="12" x2="19" y2="12" />
             </svg>
             ADD TO CART
           </Button>

           <Button 
             onClick={() => window.location.href = '/cart'}
             className={styles.continueButton}
           >
             <svg 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="currentColor" 
               strokeWidth="2.5" 
               strokeLinecap="round" 
               strokeLinejoin="round" 
               style={{ width: '20px', height: '20px', marginRight: '8px' }}
             >
               <circle cx="9" cy="21" r="1" />
               <circle cx="20" cy="21" r="1" />
               <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
             </svg>
             VIEW CART
           </Button>
        </div>
      </div>
    </div>
  );
}
