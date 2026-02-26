'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true when the current browser session is a Hub demo preview.
 * Demo mode is set in localStorage by HubDemoClient after establishing
 * the demo auth session, and cleared when the banner is dismissed.
 */
export function useDemoMode(): boolean {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    try {
      setIsDemo(localStorage.getItem('dna_demo_mode') === '1');
    } catch {
      // localStorage may be unavailable in some contexts
    }
  }, []);

  return isDemo;
}
