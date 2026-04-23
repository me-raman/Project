import React, { useState, useEffect } from 'react';
import { Navbar, Footer } from './components/Layout';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Compliance } from './pages/Compliance';
import { Profile } from './pages/Profile';
import { ChangePassword } from './pages/ChangePassword';
import { ResetPassword } from './pages/ResetPassword';

function App() {
  const [view, setView] = useState(() => {
    const path = window.location.pathname;
    if (path === '/privacy-policy') return 'privacy';
    if (path === '/terms-of-service') return 'terms';
    if (path === '/compliance') return 'compliance';
    if (path === '/profile') return 'profile';
    if (path === '/change-password') return 'change-password';
    if (path === '/reset-password') return 'reset-password';
    if (path.startsWith('/verify/')) return 'verify';
    return 'home';
  });
  const [productData, setProductData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationMeta, setVerificationMeta] = useState(null);

  // Auto-verify when landing on /verify/:productId
  useEffect(() => {
    if (view === 'verify') {
      const path = window.location.pathname;
      const encodedId = path.replace('/verify/', '');
      if (encodedId) {
        handleSearch(decodeURIComponent(encodedId));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async (query) => {
    setLoading(true);
    setError('');

    try {
      const userId = sessionStorage.getItem('userId') || '';
      const role = sessionStorage.getItem('userRole') || '';

      const response = await fetch(`/api/product/verify/${encodeURIComponent(query)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Invalid QR Code or Product Not Found');
      }

      if (!response.ok) {
        // Handle signature failure
        if (data.warning === 'INVALID_SIGNATURE') {
          setError('⚠️ Invalid QR code signature. This product may be counterfeit!');
          return;
        }
        setError(data.message || 'Product not found');
        return;
      }

      // Handle recalled products
      if (data.warning === 'PRODUCT_RECALLED') {
        setProductData(data.product);
        const formattedEvents = (data.history || []).map(h => ({
          stage: h.status,
          handler: h.handler?.companyName || 'Unknown',
          location: h.location,
          timestamp: new Date(h.timestamp).toLocaleString(),
          notes: h.notes,
          latitude: h.latitude,
          longitude: h.longitude
        }));
        setEvents(formattedEvents);
        setView('details');
        setVerificationMeta({ warning: 'PRODUCT_RECALLED', message: data.message, scanCount: data.scanCount });
        return;
      }

      const isReceivedAtPharmacy = data.history.some(h => h.status === 'Received at Pharmacy');

      if (!isReceivedAtPharmacy) {
        setError('Product in supply chain (not yet at pharmacy)');
      } else {
        setProductData(data.product);

        const formattedEvents = data.history.map(h => ({
          stage: h.status,
          handler: h.handler?.companyName || 'Unknown',
          location: h.location,
          timestamp: new Date(h.timestamp).toLocaleString(),
          notes: h.notes,
          latitude: h.latitude,
          longitude: h.longitude
        }));

        setEvents(formattedEvents);
        setView('details');
        setVerificationMeta({
          warning: data.warning,
          signatureValid: data.signatureValid,
          scanCount: data.scanCount
        });
      }

    } catch (err) {
      console.error("API Error:", err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    setView('home');
    setProductData(null);
    setEvents([]);
    setError('');
    setVerificationMeta(null);
  };

  const handleOpenLogin = () => {
    // Trigger login modal via global function set by Navbar
    if (window.openLoginModal) {
      window.openLoginModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] font-sans text-zinc-100">
      <Navbar onLoginClick={handleOpenLogin} />

      <main>
        {view === 'home' && (
          <Home
            onSearch={handleSearch}
            loading={loading}
            error={error}
            onOpenLogin={handleOpenLogin}
          />
        )}

        {view === 'privacy' && <PrivacyPolicy />}
        {view === 'terms' && <TermsOfService />}
        {view === 'compliance' && <Compliance />}
        {view === 'profile' && <Profile />}
        {view === 'change-password' && <ChangePassword />}
        {view === 'reset-password' && <ResetPassword />}

        {view === 'details' && productData && (
          <ProductDetails
            product={productData}
            events={events}
            onBack={handleBack}
            verificationMeta={verificationMeta}
          />
        )}

        {view === 'verify' && !productData && (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              {loading ? (
                <>
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-zinc-400 text-lg">Verifying product authenticity...</p>
                </>
              ) : error ? (
                <div className="max-w-md mx-auto p-8">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
                  <p className="text-zinc-400 mb-6">{error}</p>
                  <button
                    onClick={handleBack}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-500 transition-colors"
                  >
                    Go to Home
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {view === 'verify' && productData && (
          <ProductDetails
            product={productData}
            events={events}
            onBack={handleBack}
            verificationMeta={verificationMeta}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
