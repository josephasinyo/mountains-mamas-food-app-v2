'use client';

import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

import styles from './cart.module.css';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { CartItem } from '@/lib/types';
import { formatFieldName, STANDARD_ITEM_KEYS } from '@/lib/format-field-name';

// Helper component for each grouped food item
const CartGroup = ({ 
  itemGroup, 
  onRemove,
  onUpdateQuantity,
  isOpen,
  onToggle
}: { 
  itemGroup: { foodId: string; name: string; image: string; items: CartItem[] }; 
  onRemove: (id: string) => void; 
  onUpdateQuantity: (id: string, qty: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className={styles.itemGroup}>
      <div className={styles.mainRow}>
        <div className={styles.imageWrapper}>
          <Link href={`/product/${itemGroup.foodId}`} className={styles.imageLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={itemGroup.image || '/placeholder.png'} 
              alt={itemGroup.name} 
              className={styles.itemImage} 
              loading="lazy"
            />
          </Link>
        </div>
        <div className={styles.info}>
          <Link href={`/product/${itemGroup.foodId}`} className={styles.nameLink}>
            <h3 className={styles.name}>{itemGroup.name}</h3>
          </Link>
          <button onClick={onToggle} className={styles.toggleDetails}>
            {isOpen ? 'Hide' : 'Details'} 
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
          </button>
        </div>
      </div>

      <div className={`${styles.accordionWrapper} ${isOpen ? styles.isOpen : ''}`}>
        <div className={styles.detailsList}>
          {itemGroup.items.map((cartItem: any) => (
            <div key={cartItem.cartId} className={styles.detailRow}>
              <div className={styles.detailInfo}>
                <span className={styles.optionTitle}>
                  {cartItem.selectedOption || 'Standard'}
                </span>
                <div className={styles.optionMeta}>
                  {cartItem.bread_type && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Bread Options:</span> {cartItem.bread_type}
                    </div>
                  )}
                  {cartItem.cookie_choice && (
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Cookie Options:</span> {cartItem.cookie_choice}
                    </div>
                  )}
                  {/* Dynamic fields (sandwich options, dressing, etc.) */}
                  {cartItem.dynamic_fields && typeof cartItem.dynamic_fields === 'object' && 
                    Object.entries(cartItem.dynamic_fields).map(([key, val]) => {
                      if (val && !STANDARD_ITEM_KEYS.includes(key)) {
                        return (
                          <div className={styles.metaItem} key={key}>
                            <span className={styles.metaLabel}>{formatFieldName(key)}:</span> {String(val)}
                          </div>
                        );
                      }
                      return null;
                    })
                  }
                  {cartItem.guest_name && (
                    <div className={`${styles.metaItem} ${styles.guestNameItem}`}>
                      <span className={styles.metaLabel}>Guest Name:</span> {cartItem.guest_name}
                    </div>
                  )}
                  {cartItem.customizations && (
                    <div className={`${styles.metaItem} ${styles.allergyItem}`}>
                      <span className={styles.metaLabel}>Allergy Alert:</span> {cartItem.customizations}
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.detailActions}>
                <div className={styles.quantityControls}>
                    <button 
                      onClick={() => onUpdateQuantity(cartItem.cartId, cartItem.quantity - 1)} 
                      className={styles.qtyBtn}
                    >
                      -
                    </button>
                    <span className={styles.detailQty}>{cartItem.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(cartItem.cartId, cartItem.quantity + 1)} 
                      className={styles.qtyBtn}
                    >
                      +
                    </button>
                </div>
                
                <button 
                  onClick={() => onRemove(cartItem.cartId)} 
                  className={styles.removeBtn}
                  aria-label="Remove item"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={styles.trashIcon}>
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import { useCompany } from '@/components/context/CompanyProvider';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();
  const { company } = useCompany();
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState('');

  // Auto-expand all groups when cart loads/changes (handles async localStorage hydration)
  useEffect(() => {
    if (cart.length > 0) {
      const expanded: Record<string, boolean> = {};
      cart.forEach((item: any) => { expanded[item.id] = true; });
      setOpenGroups(expanded);
    }
  }, [cart.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePlaceOrder = () => {
    // Save notes to localStorage so checkout page can access it
    if (notes.trim()) {
      localStorage.setItem('orderNotes', notes.trim());
    } else {
      localStorage.removeItem('orderNotes');
    }
    router.push('/checkout'); 
  };

  // Group items by Food ID
  const groupedItems = cart.reduce((acc, item: any) => {
    // Strip " - Box Lunch" or " - Junior Box Lunch" to get the base meal name
    const displayName = item.name.replace(/\s*-\s*(Box Lunch|Junior Box Lunch)$/i, '').trim();
    const groupKey = item.id;

    if (!acc[groupKey]) {
        acc[groupKey] = {
            foodId: item.id,
            name: displayName,
            image: item.image_url || '',
            items: []
        };
    }
    acc[groupKey].items.push(item);
    return acc;
  }, {} as Record<string, { foodId: string; name: string; image: string; items: CartItem[] }>);

  const groups = Object.values(groupedItems);

  const toggleGroup = (id: string) => {
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const areAllOpen = groups.length > 0 && groups.every(g => openGroups[g.foodId]);

  const toggleAll = () => {
    if (areAllOpen) {
      setOpenGroups({});
    } else {
      const newState: Record<string, boolean> = {};
      groups.forEach(g => { newState[g.foodId] = true; });
      setOpenGroups(newState);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const resortTax = subtotal * 0.04;
  const processingFee = (subtotal + resortTax) * 0.029 + 0.30;
  const total = subtotal + resortTax + processingFee;

  return (
    <div className={styles.container}>
      
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>MY CART</h1>
        {groups.length > 0 && (
          <button onClick={toggleAll} className={styles.toggleAllBtn} title={areAllOpen ? "Collapse All" : "Expand All"}>
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className={`${styles.toggleAllIcon} ${areAllOpen ? styles.rotateIcon : ''}`}
            >
              <polyline points="7 13 12 18 17 13" />
              <polyline points="7 6 12 11 17 6" />
            </svg>
          </button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className={styles.empty}>
          <p>Your cart is empty.</p>
          <Link href={company ? `/${company.slug}` : "/"} className={styles.shopLink}>Start Ordering</Link>
        </div>
      ) : (
        <>
          <div className={styles.items}>
            {groups.map((group) => (
              <CartGroup 
                key={group.foodId} 
                itemGroup={group} 
                onRemove={removeFromCart} 
                onUpdateQuantity={updateQuantity}
                isOpen={!!openGroups[group.foodId]}
                onToggle={() => toggleGroup(group.foodId)}
              />
            ))}
          </div>

          <div className={styles.notesSection}>
            <label htmlFor="orderNotes" className={styles.notesLabel}>
              Additional Notes (Optional)
            </label>
            <textarea
              id="orderNotes"
              className={styles.notesTextarea}
              placeholder="Add any special instructions or comments for your order..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          {company?.payment_method === 'direct_pay' && subtotal > 0 && (
            <div className={styles.summarySection}>
                <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span>Resort Tax (4%)</span>
                    <span>${resortTax.toFixed(2)}</span>
                </div>
                <div className={styles.summaryRow}>
                    <span>Processing Fee</span>
                    <span>${processingFee.toFixed(2)}</span>
                </div>
                <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                </div>
            </div>
          )}

          <div className={styles.footer}>
              <Button fullWidth onClick={handlePlaceOrder}>PLACE THE ORDER</Button>
          </div>
        </>
      )}
    </div>
  );
}
