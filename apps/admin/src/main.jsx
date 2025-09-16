import React from 'react';
import App from './App.tsx';
import { createRoot } from 'react-dom/client'
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
    throw new Error('Missing Clerk Publishable Key');
}

createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
            <ClerkLoaded>
                <App />
            </ClerkLoaded>
        </ClerkProvider>
    </React.StrictMode>
);
