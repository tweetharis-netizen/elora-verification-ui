// pages/_app.js
// Main application wrapper with context providers

import '../styles/globals.css';
import { useRouter } from 'next/router';
import { AppProvider } from '../lib/contexts/AppContext';
import { NotificationProvider } from '../lib/contexts/NotificationContext';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '../components/ui/ErrorMessages';
import Navigation from '../components/Navigation';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const isLandingPage = router.pathname === '/';
  const shouldShowNav = !isLandingPage && router.pathname !== '/demo';

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={() => window.location.reload()}
    >
      <NotificationProvider>
        <AppProvider>
          {shouldShowNav && <Navigation />}
          <div className={shouldShowNav ? 'pt-16' : ''}>
            <Component {...pageProps} />
          </div>
        </AppProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default MyApp;
