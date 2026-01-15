import React, { useState } from 'react';
import { Navbar, Footer } from './components/Layout';
import { Home } from './pages/Home';
import { ProductDetails } from './pages/ProductDetails';

function App() {
  const [view, setView] = useState('home'); // 'home' or 'details'
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
        // Fallback if server returns HTML (e.g. unhandled 404)
        throw new Error('Invalid QR Code or Product Not Found');
      }

      if (response.ok) {

        // Critical Check: Only allow customers to view details if product is Received at Pharmacy
        const isReceivedAtPharmacy = data.history.some(h => h.status === 'Received at Pharmacy');

        if (!isReceivedAtPharmacy) {
          // Use a specific error string that Home.jsx will recognize
          setError('Product in supply chain (not yet at pharmacy)');
        } else {
          setProductData(data.product);

          // Transform backend history to frontend events format
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

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />

      <main>
        {view === 'home' && (
          <Home onSearch={handleSearch} loading={loading} error={error} />
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
