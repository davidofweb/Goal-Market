import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {PrivyProvider} from '@privy-io/react-auth';
import App from './App.tsx';
import './index.css';

// Default Demo App ID from Privy, but easily customizable via VITE_PRIVY_APP_ID
const PRIVY_APP_ID = (import.meta as any).env.VITE_PRIVY_APP_ID || "clvy4u7f40000l008g7015v19";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'google', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#3b82f6',
          showWalletLoginFirst: false,
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <App />
    </PrivyProvider>
  </StrictMode>,
);

