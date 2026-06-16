'use client';

import styles from './Header.module.css';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getSession } from '@/app/company/actions';

import { useCompany } from '@/components/context/CompanyProvider';

export default function Header() {
  const { company, config } = useCompany();
  const { cartCount } = useCart();
  const [isBumped, setIsBumped] = useState(false);
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (cartCount === 0) return;
    setIsBumped(true);
    const timer = setTimeout(() => {
      setIsBumped(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cartCount]);

  useEffect(() => {
    getSession().then(session => {
      setIsLoggedIn(!!session);
    });
  }, [pathname]);

  const isHome = pathname === '/' || (company && (
    pathname === `/${company.slug}` ||
    (company.default_slug && pathname === `/${company.default_slug}`) ||
    (company.generic_slug && pathname === `/${company.generic_slug}`)
  ));

  return (
    <header className={styles.header}>
      {isHome ? (
        <Link href={company ? `/${company.slug}` : "/"} className={styles.logo}>
          <div className={styles.logoContainer}>
            {company && !config?.use_mountain_mamas_branding ? (
              <div className="flex items-center gap-2">
                {company.logo_url ? (
                  <img src={company.logo_url} alt={`${company.name} Logo`} className="h-8 w-8 object-contain rounded-lg shrink-0" />
                ) : (
                  <div className="size-8 rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-md shrink-0">
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={styles.mountainText}>{company.name.toUpperCase()}</span>
              </div>
            ) : (
              <>
                <span className={styles.mountainText}>MOUNTAIN</span>
                <span className={styles.mamasText}>Mama&apos;s Café</span>
              </>
            )}
          </div>
        </Link>
      ) : (
        <Link href={company ? `/${company.slug}` : "/"} className={styles.backLink}>
           <span className={styles.arrow}>←</span> Food List
        </Link>
      )}
      
      <div className={styles.headerRight}>
        {isLoggedIn && (
          <Link href="/company" className={styles.dashboardIcon} title="Go to Dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
            </svg>
          </Link>
        )}

        <Link href="/cart" className={styles.cartIcon}>
          <div className={`${styles.iconWrapper} ${isBumped ? styles.bump : ''}`}>
             <svg 
               viewBox="0 0 24 24" 
               fill="none" 
               stroke="currentColor" 
               strokeWidth="2" 
               strokeLinecap="round" 
               strokeLinejoin="round" 
               className={styles.cartSvg}
             >
               <circle cx="9" cy="21" r="1" />
               <circle cx="20" cy="21" r="1" />
               <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
             </svg>
             {cartCount > 0 && <span className={styles.badge}>{cartCount}</span>}
          </div>
        </Link>
      </div>
    </header>
  );
}
