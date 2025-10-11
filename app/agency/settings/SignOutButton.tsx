'use client';

import { useFormStatus } from 'react-dom';

export default function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      className="btn bg-primary text-primary-foreground hover:bg-primary/90 border-primary" 
      type="submit" 
      disabled={pending}
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
