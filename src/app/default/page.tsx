'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DefaultRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Clear the flags in local storage
    localStorage.removeItem('hide-junior');
    localStorage.removeItem('yellowstone-scenic');
    localStorage.removeItem('standard-only');
    // Redirect to home
    router.replace('/');
  }, [router]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <p>Redirecting to store...</p>
    </div>
  );
}
