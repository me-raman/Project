import React, { useState } from 'react';
import { Navbar, Footer } from './components/Layout';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';

function App() {
  const [view, setView] = useState('home');
  const [productData, setProductData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (query) => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/product/${encodeURIComponent(query)}`);

      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Invalid QR Code or Product Not Found');
      }

      if (response.ok) {
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
            notes: h.notes
          }));

          setEvents(formattedEvents);
          setView('details');
        }

      } else {
        setError(data.message || 'Product not found');
      }
    } catch (err) {
      console.error("API Error:", err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setView('home');
    setProductData(null);
    setEvents([]);
    setError('');
  };

  const handleOpenLogin = () => {
    // Trigger login modal via global function set by Navbar
    if (window.openLoginModal) {
      window.openLoginModal();
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0d10] font-sans text-zinc-100">
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

        {view === 'details' && productData && (
          <ProductDetails
            product={productData}
            events={events}
            onBack={handleBack}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
