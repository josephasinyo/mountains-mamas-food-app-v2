'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import styles from './checkout.module.css';
import { getTourGroups, submitOrder } from '@/lib/google-sheets';
import { findBestMatch } from '@/lib/utils';
import { useCompany } from '@/components/context/CompanyProvider';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const { company, config, formFields, isLoading: isContextLoading } = useCompany();
  
  const [formData, setFormData] = useState<Record<string, any>>({
    tourDate: '',
    pickUpTime: '',
    guideName: '',
    fullName: ''
  });

  const [tourGroups, setTourGroups] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [isStandard, setIsStandard] = useState(false);
  const [isYellowstone, setIsYellowstone] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  
  const isSubmitted = useRef(false);

  useEffect(() => {
    // Redirect if cart is empty, but only if we haven't just submitted
    if (cart.length === 0 && !isSubmitted.current) {
      router.push('/cart');
    }

    // Load saved tour details from local storage
    const savedDetails = localStorage.getItem('tourDetails');
    const savedNotes = localStorage.getItem('orderNotes');
    const now = new Date();

    // Notes logic
    if (savedNotes) {
      setNotes(savedNotes);
    }

    const _isYellowstone = localStorage.getItem('yellowstone-scenic') === 'true';
    setIsYellowstone(_isYellowstone);
    const _isStandard = localStorage.getItem('standard-only') === 'true';
    setIsStandard(_isStandard);

    if (savedDetails) {
      try {
        const { data, expiry } = JSON.parse(savedDetails);
        if (now.getTime() < expiry && data) {
          setFormData(prev => ({
            ...prev,
            ...data,
            // Explicitly support both snake_case and camelCase formats to match standard & custom fields
            tourDate: data.tourDate || data.tour_date || '',
            pickUpTime: data.pickUpTime || data.pickup_time || '',
            guideName: data.guideName || data.guide_name || '',
            fullName: data.fullName || data.full_name || '',
            tour_date: data.tour_date || data.tourDate || '',
            pickup_time: data.pickup_time || data.pickUpTime || '',
            guide_name: data.guide_name || data.guideName || '',
            full_name: data.full_name || data.fullName || ''
          }));
        }
      } catch (e) {
        console.error('Failed to parse saved tour details', e);
      }
    }
  }, [cart, router]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Sync formData with formFields if needed
  useEffect(() => {
    if (formFields.length > 0) {
      setFormData(prev => {
        const next = { ...prev };
        formFields.forEach(f => {
          if (f.location === 'tour_details' && !(f.name in next)) {
            next[f.name] = '';
          }
        });
        return next;
      });
    }
  }, [formFields]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFieldChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setOpenDropdown(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const companyId = company?.id;
      if (!companyId) {
        toast.error('Company context lost. Please return to the menu and try again.');
        setIsLoading(false);
        return;
      }

      // Determine payment method and status based on company config
      const isDirectPay = company?.payment_method === 'direct_pay';
      const showStripe = config?.show_stripe_checkout;
      
      const orderPayload = {
        ...formData,
        tourGroup: company?.name || '',
        tourDate: formData.tour_date || formData.tourDate,
        pickUpTime: formData.pickup_time || formData.pickUpTime,
        guideName: formData.guide_name || formData.guideName,
        fullName: formData.full_name || formData.fullName,
        companyId: companyId,
        notes: notes,
        dynamic_fields: formData,
        paymentMethod: isDirectPay && showStripe ? 'stripe' : 'monthly_invoice',
        paymentStatus: 'unpaid'
      };

      const { submitSupabaseOrder } = await import('@/lib/supabase/public-actions');
      const result = await submitSupabaseOrder(orderPayload, cart);
      
      if (result.success) {
        // Save tour details to local storage (valid for 30 days)
        const expiry = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
        const detailsToSave = {
          data: formData,
          expiry: expiry
        };
        localStorage.setItem('tourDetails', JSON.stringify(detailsToSave));
        localStorage.removeItem('orderNotes');

        // Handle Stripe Checkout if applicable
        if (isDirectPay && showStripe) {
          const { createOrderCheckoutSession } = await import('./actions');
          const stripeResult = await createOrderCheckoutSession(result.orderId, cart, company?.name || 'Mountain Mama\'s Café', company?.slug);
          
          if (stripeResult.success && stripeResult.url) {
            window.location.href = stripeResult.url;
            return;
          } else {
            console.error('Stripe session creation failed:', stripeResult.error);
            // Fallback: still redirect to success but with warning? 
            // Or stay here and show error. 
            toast.error('Failed to initialize payment. Please contact the cafe.');
            setIsLoading(false);
            return;
          }
        }

        isSubmitted.current = true;
        clearCart();
        router.push(`/success?slug=${company?.slug || ''}`);
      } else {
        toast.error('There was an error placing your order: ' + result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Order submission failed:', error);
      toast.error('Network error. Please check your connection.');
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>TOUR DETAILS</h1>
      
      <form onSubmit={handleSubmit} className={styles.form} ref={formRef}>
        {formFields
          .filter(f => f.location === 'tour_details' && f.is_enabled)
          .map(field => {
            const currentValue = formData[field.name] || '';

            // Map internal names to UI state if needed
            let value = currentValue;
            let name = field.name;

            // Handle core fields with special logic
            if (field.name === 'tour_company_name') return null; // Skip this as requested

            if (field.type === 'select' || field.name === 'pickup_time') {
              let options: string[] = [];
              if (field.name === 'pickup_time') {
                options = Array.from({ length: 33 }).map((_, i) => {
                  const hour24 = 5 + Math.floor(i / 2);
                  const min = i % 2 === 0 ? '00' : '30';
                  const ampm = hour24 >= 12 ? 'PM' : 'AM';
                  const hour12 = hour24 > 12 ? hour24 - 12 : hour24 === 0 ? 12 : hour24;
                  return `${hour12}:${min} ${ampm}`;
                });
              } else {
                options = field.default_options || field.options || [];
              }

              return (
                <div className={styles.field} key={field.id}>
                  <label className={styles.label}>{field.label}</label>
                  <div 
                    className={styles.dropdown} 
                    onClick={() => setOpenDropdown(openDropdown === field.id ? null : field.id)}
                  >
                    <div className={styles.selected}>
                      {value || field.placeholder || `Select ${field.label.toLowerCase()}...`}
                      <ChevronDown className={cn(styles.chevron, openDropdown === field.id && styles.rotate)} />
                    </div>
                    {openDropdown === field.id && (
                      <div className={styles.options}>
                        {options.map((opt) => (
                          <div 
                            key={opt} 
                            className={styles.option}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFieldChange(field.name, opt);
                            }}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            return (
              <div className={styles.field} key={field.id}>
                <label className={styles.label}>{field.label}</label>
                <input
                  type={field.type === 'date' ? 'date' : (field.type === 'number' ? 'number' : 'text')}
                  name={field.name}
                  value={value}
                  onChange={handleInputChange}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  className={styles.input}
                  required={field.is_required}
                  autoComplete="off"
                />
              </div>
            );
          })}

        <div className={styles.footer}>
          <Button fullWidth type="submit" disabled={isLoading}>
            {isLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                PLACING ORDER 
                <svg className={styles.spinner} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle className={styles.spinnerTrack} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className={styles.spinnerPath} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            ) : 'CONFIRM ORDER'}
          </Button>
        </div>
      </form>

      <Link href="/cart" className={styles.backLink}>
        Back to Cart
      </Link>
    </div>
  );
}
