'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export function usePinGuard(requiredRole: 'owner' | 'any') {
  const router = useRouter();
  const pathname = usePathname();
  const OWNER_PIN = '9999';

  useEffect(() => {
    if (requiredRole === 'owner') {
      const role = sessionStorage.getItem('grocery-role');
      if (role !== 'owner') {
        sessionStorage.removeItem('grocery-role');
        router.replace('/');
      }
    }
  }, [router, pathname, requiredRole]);
}

export function useInactivityTimeout() {
  const router = useRouter();
  const TIMEOUT = 5 * 60 * 1000;

  useEffect(() => {
    if (sessionStorage.getItem('grocery-role') !== 'owner' && sessionStorage.getItem('grocery-role') !== 'staff') return;

    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        sessionStorage.removeItem('grocery-role');
        router.replace('/');
      }, TIMEOUT);
    };

    const events = ['mousedown', 'touchstart', 'keydown', 'scroll'];
    events.forEach((e) => document.addEventListener(e, reset));
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [router, TIMEOUT]);
}
