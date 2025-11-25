import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import QRCode from 'react-qr-code';

// Animated Background
function AnimatedBackground() {
  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none'
      }}>
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(34,197,94,0.5) 0%, rgba(34,197,94,0) 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          top: '-100px',
          left: '-100px',
          animation: 'float1 25s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(16,185,129,0) 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          bottom: '-100px',
          right: '-100px',
          animation: 'float2 20s ease-in-out infinite'
        }}></div>

        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: 'rgba(34,197,94,0.6)',
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `particle ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          ></div>
        ))}
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(50px, -50px) scale(1.1); }
          50% { transform: translate(-30px, -80px) scale(0.95); }
          75% { transform: translate(-50px, 40px) scale(1.05); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-60px, 50px) scale(1.08); }
          66% { transform: translate(40px, -40px) scale(0.92); }
        }
        
        @keyframes particle {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-40px); opacity: 1; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}

// QR Code Modal Component - FIXED farm name issue
function QRCodeModal({ listing, onClose }) {
  const qrData = JSON.stringify({
    id: listing.id,
    name: listing.name,
    quantity: listing.quantity,
    price: listing.price,
    grade: listing.grade,
    farmerId: listing.farmerId,
    farmerName: listing.farmerName || 'Unknown Farmer',
    farmName: listing.farmName || 'Unknown Farm',
    farmLocation: listing.farmLocation || 'Unknown Location',
    timestamp: new Date().toISOString()
  });

  const downloadQR = () => {
    const svg = document.getElementById(`qr-${listing.id}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `${listing.name.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '2rem',
      animation: 'slideInUp 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(16,185,129,0.2))',
        backdropFilter: 'blur(30px)',
        border: '2px solid rgba(34,197,94,0.5)',
        borderRadius: '2rem',
        padding: '3rem',
        maxWidth: '500px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          📱 Product Code
        </h2>
        <p style={{ color: '#9ca3af', marginBottom: '2rem' }}>
          Scan to verify authenticity
        </p>

        <div style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          marginBottom: '2rem',
          display: 'inline-block'
        }}>
          <QRCode
            id={`qr-${listing.id}`}
            value={qrData}
            size={200}
            level="H"
          />
        </div>

        <div style={{
          background: 'rgba(34,197,94,0.1)',
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          textAlign: 'left'
        }}>
          <p style={{ marginBottom: '0.5rem' }}><strong>Product:</strong> {listing.name}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Grade:</strong> {listing.grade}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Quantity:</strong> {listing.quantity} kg</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Farm:</strong> {listing.farmName || 'Unknown Farm'}</p>
          <p><strong>ID:</strong> {listing.id.substring(0, 12)}...</p>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={downloadQR}
            style={{
              flex: 1,
              background: 'linear-gradient(90deg, #22c55e, #10b981)',
              color: 'white',
              padding: '1rem',
              borderRadius: '1rem',
              border: 'none',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1.1rem'
            }}
          >
            📥 Download
          </button>

          <button
            onClick={onClose}
            style={{
              flex: 1,
              background: 'rgba(239,68,68,0.2)',
              border: '2px solid rgba(239,68,68,0.4)',
              color: 'white',
              padding: '1rem',
              borderRadius: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '1.1rem'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Landing Page (keeping original)
function FarmerLanding() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <AnimatedBackground />

      <div style={{
        maxWidth: '1200px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        width: '100%'
      }}>
        <div style={{
          width: '150px',
          height: '150px',
          margin: '0 auto 2rem',
          background: 'linear-gradient(135deg, #22c55e, #10b981)',
          borderRadius: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '5rem',
          boxShadow: '0 30px 80px rgba(34,197,94,0.6)',
          animation: 'pulse 3s ease-in-out infinite',
          cursor: 'pointer',
          transition: 'all 0.5s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          🌾
        </div>

        <h1 style={{
          fontSize: '5.5rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          background: 'linear-gradient(90deg, #22c55e 0%, #10b981 25%, #059669 50%, #10b981 75%, #22c55e 100%)',
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 3s linear infinite'
        }}>
          KhetFlow Farmer
        </h1>

        <p style={{
          fontSize: '2rem',
          color: '#d1d5db',
          marginBottom: '1rem',
          fontWeight: '500'
        }}>
          Turn "Imperfect" Produce into Profit
        </p>

        <p style={{
          fontSize: '1.3rem',
          color: '#9ca3af',
          marginBottom: '4rem',
          maxWidth: '800px',
          margin: '0 auto 4rem'
        }}>
          Sell Grade B & C produce that would otherwise go to waste. Perfect quality, just imperfect looks. Zero waste, better income.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem',
          maxWidth: '1000px',
          margin: '0 auto 4rem'
        }}>
          {[
            { label: 'Better Prices', value: '+35%', icon: '💰', color: '#22c55e', desc: 'Than throwing away' },
            { label: 'Zero Waste', value: '100%', icon: '♻️', color: '#10b981', desc: 'Sell all imperfect produce' },
            { label: 'Happy Buyers', value: '1,200+', icon: '🏪', color: '#059669', desc: 'Businesses save money' }
          ].map((stat, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === i ? 'rgba(34,197,94,0.2)' : 'rgba(34,197,94,0.1)',
                backdropFilter: 'blur(20px)',
                border: hoveredCard === i ? '1px solid rgba(34,197,94,0.5)' : '1px solid rgba(34,197,94,0.2)',
                borderRadius: '2rem',
                padding: '2.5rem 2rem',
                transition: 'all 0.4s',
                cursor: 'pointer',
                transform: hoveredCard === i ? 'translateY(-15px) scale(1.05)' : 'translateY(0) scale(1)',
                boxShadow: hoveredCard === i ? `0 25px 50px ${stat.color}40` : '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{stat.icon}</div>
              <div style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                color: stat.color,
                marginBottom: '0.5rem'
              }}>
                {stat.value}
              </div>
              <div style={{ color: '#e5e7eb', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {stat.label}
              </div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{stat.desc}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'linear-gradient(90deg, #22c55e, #10b981)',
            color: 'white',
            padding: '1.5rem 4rem',
            borderRadius: '1.25rem',
            border: 'none',
            fontSize: '1.4rem',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 20px 40px rgba(34,197,94,0.5)',
            transition: 'all 0.4s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)';
            e.currentTarget.style.boxShadow = '0 25px 50px rgba(34,197,94,0.7)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(34,197,94,0.5)';
          }}
        >
          🚀 Start Selling Imperfect Produce
        </button>
      </div>
    </div>
  );
}

// Auth Page (keeping brief - same as before)
function AuthPage({ isLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    farmerName: '',
    farmName: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        navigate('/dashboard');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, 'farmers', userCred.user.uid), {
          farmerName: form.farmerName,
          farmName: form.farmName,
          email: form.email,
          phone: form.phone,
          location: form.location,
          userType: 'farmer',
          totalEarnings: 0,
          pendingEarnings: 0,
          createdAt: serverTimestamp()
        });
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace('auth/', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <AnimatedBackground />

      <div style={{
        background: 'rgba(34,197,94,0.1)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '3rem',
        padding: '4rem',
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)',
        animation: 'slideInUp 0.5s ease-out'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          margin: '0 auto 2rem',
          background: 'linear-gradient(135deg, #22c55e, #10b981)',
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          boxShadow: '0 20px 50px rgba(34,197,94,0.6)',
          animation: 'pulse 3s ease-in-out infinite'
        }}>
          🌾
        </div>

        <h1 style={{
          fontSize: '3rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textAlign: 'center',
          background: 'linear-gradient(90deg, #22c55e, #10b981)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isLogin ? 'Welcome Farmer' : 'Join KhetFlow'}
        </h1>

        <p style={{
          textAlign: 'center',
          color: '#9ca3af',
          marginBottom: '2rem',
          fontSize: '1.1rem'
        }}>
          {isLogin ? 'Login to list your imperfect produce' : 'Register to start selling'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5',
            padding: '1rem',
            borderRadius: '1rem',
            marginBottom: '1.5rem',
            fontSize: '0.95rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <>
              <input
                type="text"
                placeholder="Your Name *"
                value={form.farmerName}
                onChange={(e) => setForm({...form, farmerName: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '1.05rem',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Farm Name *"
                value={form.farmName}
                onChange={(e) => setForm({...form, farmName: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '1.05rem',
                  outline: 'none'
                }}
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email Address *"
            value={form.email}
            onChange={(e) => setForm({...form, email: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '1rem',
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.05rem',
              outline: 'none'
            }}
          />

          <input
            type="password"
            placeholder="Password *"
            value={form.password}
            onChange={(e) => setForm({...form, password: e.target.value})}
            required
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: '1rem',
              border: '1px solid rgba(34,197,94,0.3)',
              background: 'rgba(255,255,255,0.05)',
              color: 'white',
              fontSize: '1.05rem',
              outline: 'none'
            }}
          />

          {!isLogin && (
            <>
              <input
                type="tel"
                placeholder="Phone Number *"
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '1.05rem',
                  outline: 'none'
                }}
              />
              <input
                type="text"
                placeholder="Farm Location *"
                value={form.location}
                onChange={(e) => setForm({...form, location: e.target.value})}
                required
                style={{
                  width: '100%',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: '1px solid rgba(34,197,94,0.3)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  fontSize: '1.05rem',
                  outline: 'none'
                }}
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? 'rgba(34,197,94,0.5)' : 'linear-gradient(90deg, #22c55e, #10b981)',
              color: 'white',
              padding: '1.25rem',
              borderRadius: '1.25rem',
              border: 'none',
              fontSize: '1.2rem',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 15px 35px rgba(34,197,94,0.5)',
              transition: 'all 0.3s'
            }}
          >
            {loading ? '⏳ Processing...' : (isLogin ? '🔑 Login' : '✨ Create Account')}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '2rem 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
          <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.2)' }}></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#9ca3af', marginBottom: '1rem' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button
            onClick={() => navigate(isLogin ? '/register' : '/login')}
            style={{
              background: 'transparent',
              border: '2px solid rgba(34,197,94,0.3)',
              color: '#22c55e',
              padding: '0.9rem 2rem',
              borderRadius: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            {isLogin ? '✨ Sign Up' : '🔑 Login'}
          </button>
        </div>

        <button
          onClick={() => navigate('/')}
          style={{
            width: '100%',
            marginTop: '1.5rem',
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.2)',
            color: 'white',
            padding: '1rem',
            borderRadius: '1rem',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
        >
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

// Protected Route
function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem'
      }}>
        <div style={{ animation: 'pulse 1s ease-in-out infinite' }}>⏳</div>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}

// Dashboard with Orders Tab - ENHANCED WITH ALL NEW FEATURES
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [farmerData, setFarmerData] = useState(null);
  const [view, setView] = useState('listings'); // 'listings' or 'orders'
  const [showAddForm, setShowAddForm] = useState(false);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [pendingEarnings, setPendingEarnings] = useState(0);

  const [newListing, setNewListing] = useState({
    name: '',
    quantity: '',
    price: '',
    grade: 'B',
    description: '',
    imageFile: null,
    imagePreview: null,
    isFlashSale: false,
    flashSaleDiscount: 0,
    flashSaleEndTime: ''
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchFarmerData(user.uid);
        await fetchListings(user.uid);
        await fetchOrders(user.uid);
        await calculateEarnings(user.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchFarmerData = async (uid) => {
    try {
      const docRef = doc(db, 'farmers', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFarmerData(docSnap.data());
      }
    } catch (error) {
      console.error('Error fetching farmer data:', error);
    }
  };

  const fetchListings = async (uid) => {
    try {
      const q = query(collection(db, 'listings'), where('farmerId', '==', uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(data);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const fetchOrders = async (uid) => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      const farmerOrders = allOrders.filter(order => 
        order.items && order.items.some(item => item.farmerId === uid)
      );
      
      setOrders(farmerOrders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // NEW: Calculate earnings from delivered orders
  const calculateEarnings = async (uid) => {
    try {
      const ordersSnapshot = await getDocs(collection(db, 'orders'));
      const allOrders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let delivered = 0;
      let pending = 0;

      allOrders.forEach(order => {
        if (order.items) {
          const farmerItems = order.items.filter(item => item.farmerId === uid);
          const orderTotal = farmerItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
          const farmerEarning = orderTotal * 0.9; // 90% payment

          if (order.status === 'delivered') {
            delivered += farmerEarning;
          } else if (order.status === 'picked' || order.status === 'pending') {
            pending += farmerEarning;
          }
        }
      });

      setTotalEarnings(delivered);
      setPendingEarnings(pending);

      // Update Firestore
      await updateDoc(doc(db, 'farmers', uid), {
        totalEarnings: delivered,
        pendingEarnings: pending
      });
    } catch (error) {
      console.error('Error calculating earnings:', error);
    }
  };

  const markReadyForPickup = async (orderId) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        readyForPickup: true,
        readyAt: serverTimestamp()
      });
      alert('✅ Marked as ready for pickup!');
      await fetchOrders(user.uid);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  // ENHANCED: Handle image upload with preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        alert('Image too large! Please choose an image smaller than 5MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewListing({
          ...newListing,
          imageFile: file,
          imagePreview: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // ENHANCED: Add listing with photo and flash sale support
  const handleAddListing = async (e) => {
    e.preventDefault();
    setUploading(true);

    try {
      const finalPrice = newListing.isFlashSale 
        ? parseFloat(newListing.price) * (1 - parseFloat(newListing.flashSaleDiscount) / 100)
        : parseFloat(newListing.price);

      const listing = {
        farmerId: user.uid,
        farmerName: farmerData?.farmerName || 'Unknown',
        farmName: farmerData?.farmName || 'Unknown Farm',
        farmLocation: farmerData?.location || 'Unknown',
        name: newListing.name,
        quantity: parseFloat(newListing.quantity),
        price: finalPrice,
        originalPrice: parseFloat(newListing.price),
        grade: newListing.grade,
        image: newListing.imagePreview || '🌾',
        icon: newListing.imagePreview || '🌾',
        description: newListing.description,
        savings: newListing.grade === 'B' ? '40-50%' : '50-60%',
        status: 'active',
        isFlashSale: newListing.isFlashSale,
        flashSaleDiscount: newListing.isFlashSale ? parseFloat(newListing.flashSaleDiscount) : 0,
        flashSaleEndTime: newListing.isFlashSale ? newListing.flashSaleEndTime : null,
        createdAt: serverTimestamp(),
        hasTrackingCode: true
      };

      await addDoc(collection(db, 'listings'), listing);

      alert('✅ Product listed successfully! 🎉');
      
      setNewListing({ 
        name: '', 
        quantity: '', 
        price: '', 
        grade: 'B', 
        description: '', 
        imageFile: null,
        imagePreview: null,
        isFlashSale: false,
        flashSaleDiscount: 0,
        flashSaleEndTime: ''
      });
      setShowAddForm(false);
      await fetchListings(user.uid);
    } catch (error) {
      alert('Error listing product: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (confirm('Delete this listing?')) {
      try {
        await deleteDoc(doc(db, 'listings', listingId));
        alert('✅ Listing deleted successfully!');
        await fetchListings(user.uid);
      } catch (error) {
        alert('Error deleting listing: ' + error.message);
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '3rem'
      }}>
        <div style={{ animation: 'pulse 1s ease-in-out infinite' }}>⏳</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', position: 'relative' }}>
      <AnimatedBackground />

      {/* QR Code Modal */}
      {showQRModal && selectedListing && (
        <QRCodeModal
          listing={selectedListing}
          onClose={() => {
            setShowQRModal(false);
            setSelectedListing(null);
          }}
        />
      )}

      {/* Header with Tab Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(34,197,94,0.1)',
        backdropFilter: 'blur(30px)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: '2rem',
        padding: '2rem',
        marginBottom: '3rem',
        position: 'relative',
        zIndex: 10,
        boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #22c55e, #10b981)',
            borderRadius: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            boxShadow: '0 10px 30px rgba(34,197,94,0.6)'
          }}>
            🌾
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              {farmerData?.farmName || 'Farmer Dashboard'}
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
              {farmerData?.farmerName} • {user?.email}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button
            onClick={() => setView('listings')}
            style={{
              background: view === 'listings' ? 'linear-gradient(90deg, #22c55e, #10b981)' : 'transparent',
              border: view === 'listings' ? 'none' : '2px solid rgba(34,197,94,0.3)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '1.25rem',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            📦 My Listings
          </button>

          <button
            onClick={() => setView('orders')}
            style={{
              background: view === 'orders' ? 'linear-gradient(90deg, #3b82f6, #06b6d4)' : 'transparent',
              border: view === 'orders' ? 'none' : '2px solid rgba(59,130,246,0.3)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '1.25rem',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.3s',
              position: 'relative'
            }}
          >
            🛒 Orders ({orders.length})
            {orders.filter(o => o.status === 'pending' && !o.readyForPickup).length > 0 && (
              <div style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                background: '#ef4444',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {orders.filter(o => o.status === 'pending' && !o.readyForPickup).length}
              </div>
            )}
          </button>

          <button
            onClick={handleLogout}
            style={{
              background: 'rgba(239,68,68,0.2)',
              border: '2px solid rgba(239,68,68,0.4)',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '1.25rem',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Listings View - ENHANCED */}
      {view === 'listings' && (
        <>
          {/* Stats - ENHANCED with earnings */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem',
            position: 'relative',
            zIndex: 10
          }}>
            {[
              { icon: '📦', label: 'Active Listings', value: listings.length, color: '#22c55e' },
              { icon: '💰', label: 'Total Earnings', value: `₹${totalEarnings.toFixed(2)}`, color: '#10b981' },
              { icon: '⏳', label: 'Pending Earnings', value: `₹${pendingEarnings.toFixed(2)}`, color: '#f59e0b' },
              { icon: '📋', label: 'Total Orders', value: orders.length, color: '#3b82f6' }
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: 'rgba(34,197,94,0.1)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: '2rem',
                  padding: '2rem',
                  textAlign: 'center',
                  transition: 'all 0.4s',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 25px 50px ${stat.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.5rem' }}>
                  {stat.value}
                </div>
                <div style={{ color: '#9ca3af', fontSize: '1rem' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Add Listing Button */}
          {!showAddForm && (
            <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 10 }}>
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  background: 'linear-gradient(90deg, #22c55e, #10b981)',
                  color: 'white',
                  padding: '1.5rem 3rem',
                  borderRadius: '1.25rem',
                  border: 'none',
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 15px 35px rgba(34,197,94,0.5)',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0) scale(1)'}
              >
                ➕ List Imperfect Produce
              </button>
            </div>
          )}

          {/* ENHANCED Add Listing Form - WITH PHOTO UPLOAD & FLASH SALES */}
          {showAddForm && (
            <div style={{
              background: 'rgba(34,197,94,0.1)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: '2rem',
              padding: '3rem',
              marginBottom: '3rem',
              position: 'relative',
              zIndex: 10,
              boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
              animation: 'slideInUp 0.5s ease-out'
            }}>
              <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                📝 List Your Imperfect Produce
              </h2>
              <p style={{ color: '#9ca3af', marginBottom: '2rem', fontSize: '1rem' }}>
                This will appear in the Business Portal marketplace! 💚
              </p>

              <form onSubmit={handleAddListing} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Photo Upload Section - NEW */}
                <div style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '2px dashed rgba(34,197,94,0.3)',
                  borderRadius: '1rem',
                  padding: '2rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#22c55e'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(34,197,94,0.3)'}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    id="image-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
                    {newListing.imagePreview ? (
                      <div>
                        <img 
                          src={newListing.imagePreview} 
                          alt="Preview" 
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            borderRadius: '1rem',
                            marginBottom: '1rem'
                          }}
                        />
                        <p style={{ color: '#22c55e', fontSize: '1rem' }}>✅ Photo uploaded! Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📸</div>
                        <p style={{ fontSize: '1.2rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                          Click to upload product photo
                        </p>
                        <p style={{ fontSize: '0.9rem', color: '#6b7280' }}>
                          (Optional - Max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={newListing.name}
                      onChange={(e) => setNewListing({...newListing, name: e.target.value})}
                      placeholder="e.g., Fresh Tomatoes"
                      required
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontSize: '1.1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                      Quantity (kg) *
                    </label>
                    <input
                      type="number"
                      value={newListing.quantity}
                      onChange={(e) => setNewListing({...newListing, quantity: e.target.value})}
                      placeholder="50"
                      required
                      min="0.1"
                      step="0.1"
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontSize: '1.1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                      Price per kg (₹) *
                    </label>
                    <input
                      type="number"
                      value={newListing.price}
                      onChange={(e) => setNewListing({...newListing, price: e.target.value})}
                      placeholder="25"
                      required
                      min="1"
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontSize: '1.1rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                      Imperfection Level *
                    </label>
                    <select
                      value={newListing.grade}
                      onChange={(e) => setNewListing({...newListing, grade: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        borderRadius: '1rem',
                        border: '1px solid rgba(34,197,94,0.3)',
                        background: 'rgba(255,255,255,0.05)',
                        color: 'white',
                        fontSize: '1.1rem',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="B" style={{ background: '#1e293b' }}>Grade B - Minor imperfections</option>
                      <option value="C" style={{ background: '#1e293b' }}>Grade C - Major imperfections</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                    Product Description *
                  </label>
                  <textarea
                    value={newListing.description}
                    onChange={(e) => setNewListing({...newListing, description: e.target.value})}
                    placeholder="Describe the imperfections and quality..."
                    required
                    rows="4"
                    style={{
                      width: '100%',
                      padding: '1rem',
                      borderRadius: '1rem',
                      border: '1px solid rgba(34,197,94,0.3)',
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      fontSize: '1.1rem',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Flash Sale Section - NEW */}
                <div style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '2px solid rgba(245,158,11,0.3)',
                  borderRadius: '1rem',
                  padding: '2rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <input
                      type="checkbox"
                      id="flashSale"
                      checked={newListing.isFlashSale}
                      onChange={(e) => setNewListing({...newListing, isFlashSale: e.target.checked})}
                      style={{
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer'
                      }}
                    />
                    <label htmlFor="flashSale" style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#f59e0b', cursor: 'pointer' }}>
                      ⚡ Enable Flash Sale
                    </label>
                  </div>

                  {newListing.isFlashSale && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                          Discount % *
                        </label>
                        <input
                          type="number"
                          value={newListing.flashSaleDiscount}
                          onChange={(e) => setNewListing({...newListing, flashSaleDiscount: e.target.value})}
                          placeholder="20"
                          required={newListing.isFlashSale}
                          min="5"
                          max="80"
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '1rem',
                            border: '1px solid rgba(245,158,11,0.3)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '1.1rem',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>
                          Sale Ends On *
                        </label>
                        <input
                          type="datetime-local"
                          value={newListing.flashSaleEndTime}
                          onChange={(e) => setNewListing({...newListing, flashSaleEndTime: e.target.value})}
                          required={newListing.isFlashSale}
                          style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '1rem',
                            border: '1px solid rgba(245,158,11,0.3)',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            fontSize: '1.1rem',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {newListing.isFlashSale && newListing.flashSaleDiscount && newListing.price && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: 'rgba(34,197,94,0.1)',
                      borderRadius: '0.5rem',
                      textAlign: 'center'
                    }}>
                      <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Flash Sale Price:</p>
                      <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#22c55e' }}>
                        ₹{(parseFloat(newListing.price) * (1 - parseFloat(newListing.flashSaleDiscount) / 100)).toFixed(2)}/kg
                        <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: '#9ca3af', marginLeft: '1rem' }}>
                          ₹{newListing.price}/kg
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    type="submit"
                    disabled={uploading}
                    style={{
                      flex: 1,
                      background: uploading ? 'rgba(34,197,94,0.5)' : 'linear-gradient(90deg, #22c55e, #10b981)',
                      color: 'white',
                      padding: '1.25rem',
                      borderRadius: '1rem',
                      border: 'none',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      cursor: uploading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    {uploading ? '⏳ Saving...' : '✅ List Product'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewListing({ 
                        name: '', 
                        quantity: '', 
                        price: '', 
                        grade: 'B', 
                        description: '', 
                        imageFile: null,
                        imagePreview: null,
                        isFlashSale: false,
                        flashSaleDiscount: 0,
                        flashSaleEndTime: ''
                      });
                    }}
                    style={{
                      flex: 1,
                      background: 'rgba(239,68,68,0.2)',
                      border: '2px solid rgba(239,68,68,0.4)',
                      color: 'white',
                      padding: '1.25rem',
                      borderRadius: '1rem',
                      fontSize: '1.2rem',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.3s'
                    }}
                  >
                    ✕ Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Listings Grid - ENHANCED with photo display */}
          <div style={{
            background: 'rgba(34,197,94,0.1)',
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(34,197,94,0.2)',
            borderRadius: '2rem',
            padding: '3rem',
            position: 'relative',
            zIndex: 10,
            boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
          }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
              ♻️ Your Listings ({listings.length})
            </h2>

            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</div>
                <p style={{ fontSize: '1.2rem' }}>No listings yet. Add your first product!</p>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '2rem',
                      padding: '2rem',
                      transition: 'all 0.4s',
                      cursor: 'pointer',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px)';
                      e.currentTarget.style.boxShadow = '0 20px 50px rgba(34,197,94,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Flash Sale Badge - NEW */}
                    {listing.isFlashSale && (
                      <div style={{
                        position: 'absolute',
                        top: '1rem',
                        left: '1rem',
                        background: 'linear-gradient(135deg, #f59e0b, #eab308)',
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        boxShadow: '0 5px 15px rgba(245,158,11,0.5)',
                        animation: 'pulse 2s ease-in-out infinite'
                      }}>
                        ⚡ -{listing.flashSaleDiscount}%
                      </div>
                    )}

                    <div style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: listing.grade === 'B' ? 'linear-gradient(135deg, #f59e0b, #eab308)' : 'linear-gradient(135deg, #fb923c, #f59e0b)',
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '2rem',
                      fontSize: '0.9rem',
                      fontWeight: '700',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
                    }}>
                      Grade {listing.grade}
                    </div>

                    {listing.image && listing.image.startsWith('data:') ? (
                      <img
                        src={listing.image}
                        alt={listing.name}
                        style={{
                          width: '100%',
                          height: '200px',
                          objectFit: 'cover',
                          borderRadius: '1rem',
                          marginBottom: '1.5rem',
                          marginTop: '2rem'
                        }}
                      />
                    ) : (
                      <div style={{ fontSize: '5rem', textAlign: 'center', marginBottom: '1.5rem', marginTop: '2rem' }}>
                        {listing.image || listing.icon || '🌾'}
                      </div>
                    )}

                    <h3 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      {listing.name}
                    </h3>

                    <p style={{ color: '#9ca3af', fontSize: '1rem', marginBottom: '1rem', lineHeight: '1.5' }}>
                      {listing.description}
                    </p>

                    <p style={{ color: '#9ca3af', fontSize: '1.1rem', marginBottom: '1rem' }}>
                      📦 {listing.quantity} kg available
                    </p>

                    <div style={{ marginBottom: '1.5rem' }}>
                      <p style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: '#22c55e'
                      }}>
                        ₹{listing.price}/kg
                        {listing.isFlashSale && listing.originalPrice && (
                          <span style={{
                            fontSize: '1.2rem',
                            textDecoration: 'line-through',
                            color: '#9ca3af',
                            marginLeft: '0.5rem'
                          }}>
                            ₹{listing.originalPrice}/kg
                          </span>
                        )}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowQRModal(true);
                        }}
                        style={{
                          flex: 1,
                          background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
                          color: 'white',
                          padding: '1rem',
                          borderRadius: '1rem',
                          border: 'none',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        📱 View Code
                      </button>

                      <button
                        onClick={() => handleDeleteListing(listing.id)}
                        style={{
                          flex: 1,
                          background: 'rgba(239,68,68,0.2)',
                          border: '2px solid rgba(239,68,68,0.4)',
                          color: 'white',
                          padding: '1rem',
                          borderRadius: '1rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '1rem'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Orders View - ENHANCED with income tracking */}
      {view === 'orders' && (
        <div style={{ position: 'relative', zIndex: 10 }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '2rem'
          }}>
            🛒 Orders for My Products ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '5rem',
              background: 'rgba(34,197,94,0.1)',
              backdropFilter: 'blur(30px)',
              borderRadius: '2rem',
              border: '1px solid rgba(34,197,94,0.2)'
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ fontSize: '1.5rem', color: '#9ca3af' }}>
                No orders yet. Wait for businesses to order your produce!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {orders.map((order) => {
                const farmerItems = order.items?.filter(item => item.farmerId === user.uid) || [];
                const orderTotal = farmerItems.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
                const farmerEarning = (orderTotal * 0.9).toFixed(2); // 90% payment
                
                return (
                  <div
                    key={order.id}
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      backdropFilter: 'blur(30px)',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: '2rem',
                      padding: '2rem',
                      transition: 'all 0.4s'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem'
                    }}>
                      <div style={{
                        display: 'inline-block',
                        background: order.status === 'pending' 
                          ? 'rgba(245,158,11,0.2)' 
                          : order.status === 'picked' 
                          ? 'rgba(59,130,246,0.2)' 
                          : 'rgba(34,197,94,0.2)',
                        border: `2px solid ${
                          order.status === 'pending' ? '#f59e0b' :
                          order.status === 'picked' ? '#3b82f6' :
                          '#22c55e'
                        }`,
                        color: order.status === 'pending' ? '#f59e0b' :
                               order.status === 'picked' ? '#3b82f6' :
                               '#22c55e',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontSize: '0.9rem',
                        fontWeight: '700'
                      }}>
                        {order.status === 'pending' && '⏳ Pending'}
                        {order.status === 'picked' && '🚚 Out for Delivery'}
                        {order.status === 'delivered' && '✅ Delivered'}
                      </div>

                      {order.readyForPickup && (
                        <div style={{
                          display: 'inline-block',
                          background: 'linear-gradient(135deg, #22c55e, #10b981)',
                          color: 'white',
                          padding: '0.5rem 1rem',
                          borderRadius: '2rem',
                          fontSize: '0.9rem',
                          fontWeight: '700'
                        }}>
                          ✅ Ready
                        </div>
                      )}
                    </div>

                    <h3 style={{
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                      marginBottom: '1rem'
                    }}>
                      Order #{order.id.substring(0, 8)}
                    </h3>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>🏪 Business:</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: '600' }}>{order.businessName || 'Unknown'}</p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>📍 Delivery Address:</p>
                      <p style={{ fontSize: '1rem' }}>{order.deliveryAddress}</p>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>📞 Contact:</p>
                      <p style={{ fontSize: '1rem' }}>{order.phone}</p>
                    </div>

                    {order.riderName && (
                      <div style={{ marginBottom: '1rem' }}>
                        <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>🚚 Rider:</p>
                        <p style={{ fontSize: '1rem' }}>{order.riderName}</p>
                      </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                      <p style={{ color: '#9ca3af', marginBottom: '0.5rem' }}>Your Products in this Order:</p>
                      {farmerItems.map((item, i) => (
                        <p key={i} style={{ fontSize: '1rem', fontWeight: '600', color: '#22c55e' }}>
                          • {item.name} ({item.cartQuantity}kg) - ₹{item.price * item.cartQuantity}
                        </p>
                      ))}
                    </div>

                    {/* ENHANCED: Income display with 90% payment */}
                    <div style={{
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      paddingTop: '1rem',
                      marginTop: '1rem',
                      marginBottom: '1.5rem',
                      background: order.status === 'delivered' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.02)',
                      padding: '1rem',
                      borderRadius: '1rem'
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ color: '#9ca3af' }}>Order Total:</span>
                        <span style={{ fontWeight: '600' }}>₹{orderTotal.toFixed(2)}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{ color: '#9ca3af' }}>Platform Fee (10%):</span>
                        <span style={{ fontWeight: '600', color: '#ef4444' }}>-₹{(orderTotal * 0.1).toFixed(2)}</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                      }}>
                        <span style={{ color: '#9ca3af', fontSize: '1.1rem' }}>Your Earnings (90%):</span>
                        <span style={{
                          fontSize: '1.8rem',
                          fontWeight: '700',
                          color: order.status === 'delivered' ? '#22c55e' : '#f59e0b'
                        }}>
                          ₹{farmerEarning}
                        </span>
                      </div>
                      {order.status === 'delivered' && (
                        <div style={{
                          marginTop: '1rem',
                          textAlign: 'center',
                          padding: '0.75rem',
                          background: 'rgba(34,197,94,0.2)',
                          borderRadius: '0.5rem',
                          color: '#22c55e',
                          fontWeight: '600',
                          fontSize: '1rem'
                        }}>
                          💰 Payment Received Instantly!
                        </div>
                      )}
                    </div>

                    {order.status === 'pending' && !order.readyForPickup && (
                      <button
                        onClick={() => markReadyForPickup(order.id)}
                        style={{
                          width: '100%',
                          background: 'linear-gradient(90deg, #22c55e, #10b981)',
                          color: 'white',
                          padding: '1rem',
                          borderRadius: '1rem',
                          border: 'none',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontSize: '1.1rem'
                        }}
                      >
                        ✅ Mark as Ready for Pickup
                      </button>
                    )}

                    {order.readyForPickup && order.status === 'pending' && (
                      <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        background: 'rgba(34,197,94,0.1)',
                        borderRadius: '1rem',
                        color: '#22c55e',
                        fontWeight: '600'
                      }}>
                        ✅ Ready • Waiting for rider pickup
                      </div>
                    )}

                    {order.status === 'picked' && (
                      <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        background: 'rgba(59,130,246,0.1)',
                        borderRadius: '1rem',
                        color: '#3b82f6',
                        fontWeight: '600'
                      }}>
                        🚚 Out for Delivery • Earnings pending
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div style={{
                        textAlign: 'center',
                        padding: '1rem',
                        background: 'rgba(34,197,94,0.1)',
                        borderRadius: '1rem',
                        color: '#22c55e',
                        fontWeight: '600'
                      }}>
                        ✅ Delivered Successfully • ₹{farmerEarning} Credited
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FarmerLanding />} />
        <Route path="/login" element={<AuthPage isLogin={true} />} />
        <Route path="/register" element={<AuthPage isLogin={false} />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
