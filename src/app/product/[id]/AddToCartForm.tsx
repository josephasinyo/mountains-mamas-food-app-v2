'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

import { FoodItem } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import styles from './AddToCartForm.module.css';

interface Props {
  item: FoodItem; // Base item
  variants?: FoodItem[]; // Available lunch box variants
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

export default function AddToCartForm({ item }: Props) {
  const { addToCart } = useCart();
  const { company, config, globalSettings, formFields, isLoading } = useCompany();

  const isSalad = item.category === 'salad' && !item.name.toLowerCase().includes('sandwich');

  const isSandwichAllowed = !!config?.use_sandwich_only && item.category === 'sandwich';
  const isBoxAllowed = !!config?.show_box_lunch_category;
  const isJuniorAllowed = !!config?.show_junior_box_lunch_category && 
    (item.allow_split_box || item.category === 'sandwich' || item.name.toLowerCase().includes('sandwich'));

  const enabledOptionsCount = (isSandwichAllowed ? 1 : 0) + (isBoxAllowed ? 1 : 0) + (isJuniorAllowed ? 1 : 0);

  const defaultVariant = useMemo(() => {
    if (isSalad) return 'standard';
    if (isBoxAllowed) return 'standard';
    if (isJuniorAllowed) return 'junior';
    if (isSandwichAllowed) return 'sandwich';
    return 'standard';
  }, [isBoxAllowed, isJuniorAllowed, isSandwichAllowed, isSalad]);

  const [selectedVariant, setSelectedVariant] = useState<'standard' | 'junior' | 'sandwich'>(defaultVariant);
  
  // Sync selected variant when config or allowed statuses change
  useEffect(() => {
    if (selectedVariant === 'standard' && !isBoxAllowed && !isSalad) {
      setSelectedVariant(defaultVariant);
    } else if (selectedVariant === 'junior' && !isJuniorAllowed) {
      setSelectedVariant(defaultVariant);
    } else if (selectedVariant === 'sandwich' && !isSandwichAllowed) {
      setSelectedVariant(defaultVariant);
    }
  }, [selectedVariant, isBoxAllowed, isJuniorAllowed, isSandwichAllowed, defaultVariant, isSalad]);

  const showSplitOptions = enabledOptionsCount >= 2 && !isSalad;

  const activeImage = selectedVariant === 'sandwich'
    ? (item.sandwich_image_url || item.image_url || '/placeholder.png')
    : (selectedVariant === 'junior'
        ? (item.junior_box_lunch_image_url || item.image_url || '/placeholder.png')
        : (item.box_lunch_image_url || item.image_url || '/placeholder.png'));

  const price = selectedVariant === 'sandwich'
    ? (item.sandwich_price || 0)
    : (selectedVariant === 'junior'
        ? (item.junior_price || item.price || 0)
        : (item.price || 0));

  // Compute dynamic options with useMemo for stable references
  const dynamicBreadOptions = useMemo(() => {
    // Check company-specific curated options first
    const mealOpts = config?.meal_page_options;
    const parsed = typeof mealOpts === 'string' ? JSON.parse(mealOpts) : mealOpts;
    
    const globalBreads = (globalSettings?.bread_options && Array.isArray(globalSettings.bread_options)) 
      ? globalSettings.bread_options 
      : [];

    if (parsed?.breads && Array.isArray(parsed.breads) && parsed.breads.length > 0) {
      // Filter out options that are not in the global active list
      // Maintain the order of parsed.breads since it is sorted by company preference
      const activeBreads = parsed.breads.filter((b: string) => globalBreads.includes(b));
      if (activeBreads.length > 0) {
        return activeBreads;
      }
    }
    // Fall back to global settings
    if (globalBreads.length > 0) {
      return globalBreads;
    }
    // Ultimate fallback
    return ['White Bread'];
  }, [config, globalSettings]);

  const dynamicCookieOptions = useMemo(() => {
    const mealOpts = config?.meal_page_options;
    const parsed = typeof mealOpts === 'string' ? JSON.parse(mealOpts) : mealOpts;
    
    const globalCookies = (globalSettings?.cookie_options && Array.isArray(globalSettings.cookie_options)) 
      ? globalSettings.cookie_options 
      : [];

    if (parsed?.cookies && Array.isArray(parsed.cookies) && parsed.cookies.length > 0) {
      // Filter out options that are not in the global active list
      // Maintain the order of parsed.cookies since it is sorted by company preference
      const activeCookies = parsed.cookies.filter((c: string) => globalCookies.includes(c));
      if (activeCookies.length > 0) {
        return activeCookies;
      }
    }
    if (globalCookies.length > 0) {
      return globalCookies;
    }
    return ['Chocolate Chip'];
  }, [config, globalSettings]);

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
          if (field.name === 'bread_type') initialValues[field.name] = dynamicBreadOptions[0];
          else if (field.name === 'cookie_choice') initialValues[field.name] = dynamicCookieOptions[0];
          else if (field.name === 'sandwich_options') initialValues[field.name] = SANDWICH_OPTIONS[0];
          else if (field.name === 'dressing_options') initialValues[field.name] = DRESSING_OPTIONS[0];
          else initialValues[field.name] = '';
        }
      });
      setFieldValues(initialValues);
    }
  }, [formFields, dynamicBreadOptions, dynamicCookieOptions]);

  const handleFieldChange = (name: string, value: any) => {
    setFieldValues(prev => {
      const nextValues = { ...prev, [name]: value };
      
      // Auto-logic when Gluten-Free bread is selected
      if (name === 'bread_type' && typeof value === 'string' && value.toLowerCase().includes('gluten-free')) {
        // Find a cookie option that represents a gluten-free brownie
        const gfCookie = dynamicCookieOptions.find(c => 
          c.toLowerCase().includes('gluten-free') || 
          (c.toLowerCase().includes('gf') && c.toLowerCase().includes('brownie')) ||
          c.toLowerCase().includes('brownie')
        );
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
    if (dynamicBreadOptions.length > 0 && !fieldValues['bread_type']) {
      handleFieldChange('bread_type', dynamicBreadOptions[0]);
    }
    if (dynamicCookieOptions.length > 0 && !fieldValues['cookie_choice']) {
      handleFieldChange('cookie_choice', dynamicCookieOptions[0]);
    }
  }, [dynamicBreadOptions, dynamicCookieOptions, fieldValues]);

  const handleAddToCart = () => {
    const finalQuantity = typeof quantity === 'string' ? parseInt(quantity) : quantity;
    
    if (!finalQuantity || finalQuantity <= 0) {
      return;
    }

    const pkgLabel = item.lunch_package === 'bag' ? 'Bag' : 'Box';
    let launchTypeStr = `${pkgLabel} Lunch`;
    if (selectedVariant === 'junior') {
      launchTypeStr = `Junior ${pkgLabel} Lunch`;
    } else if (selectedVariant === 'sandwich') {
      launchTypeStr = 'Sandwich only';
    }

    if (enabledOptionsCount === 1 && !isSalad) {
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
        bread_type: isSalad ? undefined : fieldValues['bread_type'],
        cookie_choice: selectedVariant === 'sandwich' ? undefined : fieldValues['cookie_choice'],
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
        }, 800);
    }, 2000);
  };

  const toggleDropdown = (dropdownName: string) => {
    setOpenDropdown(openDropdown === dropdownName ? null : dropdownName);
  };

  const renderDropdown = (
    label: string, 
    id: string, 
    selectedValue: string, 
    options: { label: string; onClick: () => void }[]
  ) => {
    const isOpen = openDropdown === id;
    return (
      <div className={styles.section} key={id}>
        <label className={styles.label}>{label}</label>
        <div className={styles.dropdown}>
          <div className={styles.selected} onClick={() => toggleDropdown(id)}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, paddingRight: '12px' }}>
              {selectedValue.toLowerCase().includes('gluten') ? (
                <span className={styles.badge}>{selectedValue}</span>
              ) : (
                <span style={{fontSize: '15px'}}>{selectedValue}</span>
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
              {options.map((opt, i) => (
                <div 
                  key={i} 
                  className={styles.option}
                  onClick={() => {
                    opt.onClick();
                    setOpenDropdown(null);
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                    {opt.label.toLowerCase().includes('gluten') ? (
                      <span className={styles.badge}>{opt.label}</span>
                    ) : (
                      <span style={{fontSize: '15px'}}>{opt.label}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Don't render the form until company context is loaded — this prevents
  // the global settings from flashing as a fallback before the company config arrives
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
      </div>      <div className={styles.detailsWrapper}>
        <div className={styles.headerRow}>
            <h1 className={styles.title}>{item.name}</h1>
            {config?.show_prices && price > 0 && (
              <span className={styles.priceTag}>${price.toFixed(2)}</span>
            )}
        </div>
        {enabledOptionsCount === 1 && !isSalad && (
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
        {(item.description || !isSalad) && (
          <div className={styles.ingredientsBox}>
            {item.description && (
              <div style={{ marginBottom: (!isSalad ? '12px' : '0') }}>
                <strong>{isSalad ? 'Salad' : 'Sandwich'} includes:</strong> {item.description}
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
            // Special logic for core fields
            if (field.name === 'sandwich_options' && isSalad) return null;
            if (field.name === 'bread_options' && isSalad) return null;
            if (field.name === 'dressing_options' && !isSalad) return null;
            if (field.name === 'cookie_choice' && selectedVariant === 'sandwich') return null;

            const currentValue = fieldValues[field.name] || '';

            if (field.type === 'select' || ['sandwich_options', 'bread_type', 'cookie_choice', 'dressing_options'].includes(field.name)) {
              let options: string[] = [];
              if (field.name === 'sandwich_options') options = SANDWICH_OPTIONS;
              else if (field.name === 'bread_type') options = dynamicBreadOptions;
              else if (field.name === 'cookie_choice') options = dynamicCookieOptions;
              else if (field.name === 'dressing_options') options = DRESSING_OPTIONS;
              else options = field.default_options || field.options || [];

              return renderDropdown(
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
