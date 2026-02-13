'use client';

import { useState } from 'react';

export type ManualFormState = 'idle' | 'submitting' | 'success' | 'error';

export function useManualForm() {
  const [state, setState] = useState<ManualFormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit(email: string, firstName?: string, church?: string) {
    setState('submitting');
    setErrorMsg('');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, church }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Something went wrong');
      }
      setState('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong');
      setState('error');
    }
  }

  return { state, errorMsg, submit };
}
