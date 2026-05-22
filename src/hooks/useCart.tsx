'use client';

import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { CartItem, FoodItem } from '@/lib/types';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: FoodItem, quantity: number, option?: string, price?: number) => void;
  removeFromCart: (cartId: string) => void;
  updateQuantity: (cartId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const isInitialMount = useRef(true);

  // Load cart from local storage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
    }
    isInitialMount.current = false;
  }, []);

  // Save cart to local storage on change (skip initial mount)
  useEffect(() => {
    if (!isInitialMount.current) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  const addToCart = useCallback((item: any, quantity: number, option?: string, price?: number) => {
    setCart((prev) => {
      // Find matching item where all options are entirely similar
      const existingItemIndex = prev.findIndex((ci) => {
        // 1. Match on both id AND name to avoid false merges
        const isBaseMatch = ci.id === item.id && 
                            ci.name === item.name && 
                            (ci.selectedOption || '') === (option || '');
        
        if (!isBaseMatch) return false;

        // 2. Compare customization details (case-insensitive and trimmed for safety)
        const cleanString = (str: any) => (str || '').toString().trim().toLowerCase();
        
        // Use either item.bread_type or item.dynamic_fields.bread_type
        const ciBread = ci.bread_type || ci.dynamic_fields?.bread_type;
        const itemBread = item.bread_type || item.dynamic_fields?.bread_type;

        const ciCookie = ci.cookie_choice || ci.dynamic_fields?.cookie_choice;
        const itemCookie = item.cookie_choice || item.dynamic_fields?.cookie_choice;

        const ciGuest = ci.guest_name || ci.dynamic_fields?.guest_name;
        const itemGuest = item.guest_name || item.dynamic_fields?.guest_name;

        const ciCustom = ci.customizations || ci.dynamic_fields?.customizations;
        const itemCustom = item.customizations || item.dynamic_fields?.customizations;

        const isBreadMatch = cleanString(ciBread) === cleanString(itemBread);
        const isCookieMatch = cleanString(ciCookie) === cleanString(itemCookie);
        const isGuestMatch = cleanString(ciGuest) === cleanString(itemGuest);
        const isCustomMatch = cleanString(ciCustom) === cleanString(itemCustom);

        if (!isBreadMatch || !isCookieMatch || !isGuestMatch || !isCustomMatch) {
          return false;
        }

        // 3. Compare other dynamic fields if present
        const ciDyn = ci.dynamic_fields || {};
        const itemDyn = item.dynamic_fields || {};
        const dynKeys = new Set([...Object.keys(ciDyn), ...Object.keys(itemDyn)]);
        
        for (const key of dynKeys) {
          // Skip the standard keys we already compared
          if (['bread_type', 'cookie_choice', 'guest_name', 'customizations', 'selectedOption'].includes(key)) continue;
          if (cleanString(ciDyn[key]) !== cleanString(itemDyn[key])) {
            return false;
          }
        }

        return true;
      });

      if (existingItemIndex > -1) {
        // Add to existing quantity
        const newCart = [...prev];
        newCart[existingItemIndex] = {
          ...newCart[existingItemIndex],
          quantity: newCart[existingItemIndex].quantity + quantity,
        };
        return newCart;
      }

      // Create new entry — cartId includes info and unique timestamp to guarantee uniqueness
      const breadPart = item.bread_type ? `-${item.bread_type}` : '';
      const guestPart = item.guest_name ? `-${item.guest_name}` : '';
      const cartId = `${item.id}-${item.name}-${option || 'Standard'}${breadPart}${guestPart}-${Date.now()}`;
      
      return [...prev, { 
        ...item, 
        cartId, 
        quantity, 
        selectedOption: option,
        unitPrice: price || item.price || 0 
      }];
    });
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }, []);

  const updateQuantity = useCallback((cartId: string, quantity: number) => {
    setCart((prev) => prev.map((item) => {
      if (item.cartId === cartId) {
        return { ...item, quantity: Math.max(1, quantity) };
      }
      return item;
    }));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const cartTotal = cart.reduce((total, item) => total + (item.unitPrice * item.quantity), 0);
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
