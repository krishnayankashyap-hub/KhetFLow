import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, addDoc, query, where, serverTimestamp, increment } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { Html5QrcodeScanner } from 'html5-qrcode';

// ==========================================
// 1. ANIMATED BACKGROUND
// ==========================================
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
          background: 'radial-gradient(circle, rgba(251,146,60,0.5) 0%, rgba(251,146,60,0) 70%)',
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
          background: 'radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0) 70%)',
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
              background: 'rgba(251,146,60,0.6)',
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
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ==========================================
// 2. DELIVERY & PAYMENT MODAL (Instant Money)
// ==========================================
function DeliveryPaymentModal({ order, onClose, onConfirm }) {
  const [paymentPhoto, setPaymentPhoto] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Logic: Calculate 90% of delivery fee
  const deliveryFee = order.deliveryFee || 150; 
  const riderEarnings = Math.floor(deliveryFee * 0.90);
  
  // Logic: Check if Cash on Delivery (COD)
  const isCOD = order.paymentMethod === 'cod' || order.paymentMethod === 'pay_on_delivery';

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { 
        alert('Photo too large!'); 
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setPaymentPhoto(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (isCOD && !paymentPhoto) {
      alert("⚠️ Since this is Pay on Delivery, you must upload a photo of the received payment (Cash or UPI screen).");
      return;
    }
    setIsUploading(true);
    await onConfirm(paymentPhoto, riderEarnings);
    setIsUploading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem',
      animation: 'slideInUp 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(31,41,55,0.95), rgba(17,24,39,0.95))',
        border: '2px solid rgba(34,197,94,0.3)', borderRadius: '2rem', padding: '3rem',
        maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
      }}>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#22c55e', textAlign: 'center' }}>
          🚀 Confirm Delivery
        </h2>
        
        {/* Earnings Preview */}
        <div style={{ 
          background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '1.5rem', 
          marginBottom: '2rem', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' 
        }}>
          <p style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Instant Earnings</p>
          <p style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#22c55e', lineHeight: 1 }}>₹{riderEarnings}</p>
          <p style={{ fontSize: '0.9rem', color: '#6b7280', marginTop: '0.5rem' }}>
            (90% of Delivery Fee ₹{deliveryFee})
          </p>
        </div>

        {/* COD Section */}
        {isCOD ? (
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', padding: '1rem', borderRadius: '1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#fb923c', fontWeight: 'bold', fontSize: '1.2rem', textAlign: 'center' }}>
                ⚠️ Collect Cash: ₹{order.totalAmount}
              </p>
            </div>
            
            <p style={{ color: '#d1d5db', marginBottom: '1rem', textAlign: 'center' }}>
              Please take a photo of the Cash or UPI Transaction screen to verify payment.
            </p>
            
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '2rem', border: '2px dashed #4b5563', borderRadius: '1.5rem',
              cursor: 'pointer', background: paymentPhoto ? 'rgba(34,197,94,0.1)' : 'transparent',
              transition: 'all 0.3s'
            }}>
              <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📸</span>
              <span style={{ color: '#9ca3af' }}>{paymentPhoto ? 'Photo Captured (Tap to Retake)' : 'Tap to Capture Proof'}</span>
              <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
            </label>
            
            {paymentPhoto && (
              <img src={paymentPhoto} alt="Proof" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '1rem', marginTop: '1rem', border: '2px solid #22c55e' }} />
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '2rem', textAlign: 'center', padding: '1rem', background: 'rgba(59,130,246,0.1)', borderRadius: '1rem', border: '1px solid rgba(59,130,246,0.3)' }}>
            <p style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '1.2rem' }}>💳 Online Payment (Pre-paid)</p>
            <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>No cash collection needed.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={onClose} 
            style={{ 
              flex: 1, padding: '1.2rem', borderRadius: '1rem', background: 'transparent', 
              border: '2px solid #4b5563', color: 'white', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 'bold'
            }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isUploading || (isCOD && !paymentPhoto)}
            style={{ 
              flex: 1, padding: '1.2rem', borderRadius: '1rem', border: 'none',
              background: (isCOD && !paymentPhoto) ? '#4b5563' : 'linear-gradient(90deg, #22c55e, #10b981)', 
              color: 'white', fontWeight: 'bold', fontSize: '1.1rem', cursor: (isCOD && !paymentPhoto) ? 'not-allowed' : 'pointer',
              boxShadow: (isCOD && !paymentPhoto) ? 'none' : '0 10px 25px rgba(34,197,94,0.4)'
            }}
          >
            {isUploading ? 'Processing...' : '✅ Finish & Earn'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. QR SCANNER + VERIFICATION MODAL
// ==========================================
function VerificationModal({ order, onClose, onVerify, riderData }) {
  const [scannedData, setScannedData] = useState(null);
  
  // EXTENDED CHECKLIST (8 POINTS)
  const [checklist, setChecklist] = useState({
    freshness: false,
    packaging: false,
    quantity: false,
    noticeable_damage: false,
    temperature_check: false, // New
    color_check: false,       // New
    no_pests: false,          // New
    labeling_correct: false   // New
  });
  
  const [photos, setPhotos] = useState([]);
  const [notes, setNotes] = useState('');
  const scannerRef = useRef(null);
  const [scannerInitialized, setScannnerInitialized] = useState(false);

  useEffect(() => {
    if (!scannerInitialized) {
      const scanner = new Html5QrcodeScanner('qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      });

      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            setScannedData(data);
            scanner.clear();
          } catch (e) {
            alert('Invalid QR code!');
          }
        },
        (error) => {}
      );

      scannerRef.current = scanner;
      setScannnerInitialized(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const handlePhotoCapture = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVerify = async () => {
    if (!scannedData) { alert('Please scan QR code first!'); return; }
    
    // Check if all checklist items are true
    const allChecked = Object.values(checklist).every(v => v);
    if (!allChecked) { alert('Please complete the entire quality checklist!'); return; }

    if (photos.length === 0) { alert('Please take at least one photo!'); return; }

    try {
      await addDoc(collection(db, 'verifications'), {
        orderId: order.id,
        riderId: riderData.uid,
        riderName: riderData.riderName,
        scannedProduct: scannedData,
        checklist: checklist,
        photos: photos,
        notes: notes,
        timestamp: serverTimestamp(),
        status: 'verified'
      });

      await updateDoc(doc(db, 'orders', order.id), {
        status: 'picked', // Move to picked status
        verificationCompleted: true,
        verificationPhotos: photos,
        verificationNotes: notes,
        updatedAt: serverTimestamp()
      });

      onVerify();
    } catch (error) {
      alert('Error verifying: ' + error.message);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 10000, padding: '2rem', overflowY: 'auto', animation: 'slideInUp 0.3s ease-out'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(251,146,60,0.2), rgba(245,158,11,0.2))',
        backdropFilter: 'blur(30px)', border: '2px solid rgba(251,146,60,0.5)', borderRadius: '2rem',
        padding: '3rem', maxWidth: '800px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>🔍 Product Verification</h2>
          <button onClick={onClose} style={{ background: 'rgba(239,68,68,0.2)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.5rem' }}>✕</button>
        </div>

        {/* Step 1: QR Scanner */}
        {!scannedData ? (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📱 Step 1: Scan Farm QR Code</h3>
            <div id="qr-reader" style={{ borderRadius: '1rem', overflow: 'hidden' }}></div>
          </div>
        ) : (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.5)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#22c55e' }}>✅ Farm Validated</h3>
            <p><strong>Product:</strong> {scannedData.name}</p>
            <p><strong>Grade:</strong> {scannedData.grade}</p>
            <p><strong>Quantity:</strong> {scannedData.quantity} kg</p>
            <p><strong>Farm:</strong> {scannedData.farmName}</p>
          </div>
        )}

        {/* Step 2: Extended Visual Inspection */}
        {scannedData && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>✓ Step 2: Quality Check (8 Points)</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {[
                { key: 'freshness', label: 'Freshness Check', icon: '🌿' },
                { key: 'packaging', label: 'Packaging Secure', icon: '📦' },
                { key: 'quantity', label: 'Weight Verified', icon: '⚖️' },
                { key: 'noticeable_damage', label: 'No Physical Damage', icon: '🔍' },
                { key: 'temperature_check', label: 'Temperature Optimal', icon: '🌡️' }, // New
                { key: 'color_check', label: 'Color Natural', icon: '🎨' },      // New
                { key: 'no_pests', label: 'No Pests/Insects', icon: '🐛' },       // New
                { key: 'labeling_correct', label: 'Labeling Correct', icon: '🏷️' } // New
              ].map((item) => (
                <label key={item.key} style={{
                  display: 'flex', alignItems: 'center', padding: '1rem',
                  background: checklist[item.key] ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                  borderRadius: '1rem', cursor: 'pointer',
                  border: checklist[item.key] ? '2px solid #22c55e' : '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s'
                }}>
                  <input
                    type="checkbox"
                    checked={checklist[item.key]}
                    onChange={(e) => setChecklist({...checklist, [item.key]: e.target.checked})}
                    style={{ width: '24px', height: '24px', marginRight: '1rem', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>{item.icon}</span>
                  <span style={{ fontSize: '1rem', fontWeight: '500' }}>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Photos */}
        {scannedData && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📸 Step 3: Take Verification Photos</h3>
            <label style={{
              display: 'inline-block', padding: '1rem 2rem', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
              borderRadius: '1rem', cursor: 'pointer', fontWeight: '700', marginBottom: '1rem'
            }}>
              📷 Capture Photos
              <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} />
            </label>
            {photos.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                {photos.map((photo, i) => (
                  <div key={i} style={{ position: 'relative' }}>
                    <img src={photo} alt={`Photo ${i+1}`} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '1rem', border: '2px solid rgba(34,197,94,0.5)' }} />
                  </div>
                ))}
              </div>
            )}
            <p style={{ color: '#9ca3af', marginTop: '1rem', fontSize: '0.9rem' }}>
              Photos: {photos.length} (min. 1 required)
            </p>
          </div>
        )}

        {/* Step 4: Notes */}
        {scannedData && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>📝 Notes (Optional)</h3>
            <textarea
              value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any observations..."
              rows="2" style={{ width: '100%', padding: '1rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
            />
          </div>
        )}

        {/* Verify Button */}
        {scannedData && (
          <button
            onClick={handleVerify}
            disabled={!Object.values(checklist).every(v => v) || photos.length === 0}
            style={{
              width: '100%',
              background: Object.values(checklist).every(v => v) && photos.length > 0
                ? 'linear-gradient(90deg, #22c55e, #10b981)'
                : 'rgba(100,100,100,0.5)',
              color: 'white', padding: '1.5rem', borderRadius: '1rem', border: 'none',
              fontSize: '1.3rem', fontWeight: '700',
              cursor: Object.values(checklist).every(v => v) && photos.length > 0 ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s'
            }}
          >
            {Object.values(checklist).every(v => v) && photos.length > 0 ? '✅ Verify & Pick Up' : '⚠️ Complete Checklist & Photos'}
          </button>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 4. LANDING PAGE
// ==========================================
function RiderLanding() {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden'
    }}>
      <AnimatedBackground />

      <div style={{ maxWidth: '1200px', textAlign: 'center', position: 'relative', zIndex: 10, width: '100%' }}>
        <div style={{
          width: '150px', height: '150px', margin: '0 auto 2rem', background: 'linear-gradient(135deg, #fb923c, #f59e0b)',
          borderRadius: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem',
          boxShadow: '0 30px 80px rgba(251,146,60,0.6)', animation: 'pulse 3s ease-in-out infinite', cursor: 'pointer', transition: 'all 0.5s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          🚚
        </div>

        <h1 style={{
          fontSize: '5.5rem', fontWeight: 'bold', marginBottom: '1.5rem',
          background: 'linear-gradient(90deg, #fb923c 0%, #f59e0b 25%, #eab308 50%, #f59e0b 75%, #fb923c 100%)',
          backgroundSize: '200% 100%', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          animation: 'shimmer 3s linear infinite'
        }}>
          KhetFlow Rider
        </h1>

        <p style={{ fontSize: '2rem', color: '#d1d5db', marginBottom: '1rem', fontWeight: '500' }}>
          Deliver Fresh, Earn More
        </p>

        <p style={{ fontSize: '1.3rem', color: '#9ca3af', marginBottom: '4rem', maxWidth: '800px', margin: '0 auto 4rem' }}>
          Join KhetFlow's delivery network. Pick up fresh produce from farms and deliver to businesses. Flexible hours, good earnings.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem', maxWidth: '1000px', margin: '0 auto 4rem' }}>
          {[
            { label: 'Instant Pay', value: '₹+-', icon: '⚡', color: '#22c55e', desc: 'Get paid immediately after delivery' },
            { label: 'Flexible Hours', value: '24/7', icon: '🕒', color: '#fb923c', desc: 'Log in and work whenever you want' },
            { label: 'Weekly Bonus', value: '+-', icon: '🎁', color: '#f59e0b', desc: 'Earn extra rewards for completing targets' }
          ].map((stat, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === i ? 'rgba(251,146,60,0.2)' : 'rgba(251,146,60,0.1)',
                backdropFilter: 'blur(20px)',
                border: hoveredCard === i ? '1px solid rgba(251,146,60,0.5)' : '1px solid rgba(251,146,60,0.2)',
                borderRadius: '2rem', padding: '2.5rem 2rem', transition: 'all 0.4s', cursor: 'pointer',
                transform: hoveredCard === i ? 'translateY(-15px) scale(1.05)' : 'translateY(0) scale(1)',
                boxShadow: hoveredCard === i ? `0 25px 50px ${stat.color}40` : '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>{stat.icon}</div>
              <div style={{ fontSize: '3rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.5rem' }}>{stat.value}</div>
              <div style={{ color: '#e5e7eb', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{stat.label}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>{stat.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'linear-gradient(90deg, #fb923c, #f59e0b)', color: 'white', padding: '1.5rem 4rem',
              borderRadius: '1.25rem', border: 'none', fontSize: '1.4rem', fontWeight: '700', cursor: 'pointer',
              boxShadow: '0 20px 40px rgba(251,146,60,0.5)', transition: 'all 0.4s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.05)'; e.currentTarget.style.boxShadow = '0 25px 50px rgba(251,146,60,0.7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(251,146,60,0.5)'; }}
          >
            🚀 Start Delivering
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. AUTH & PROTECTED ROUTES
// ==========================================
function AuthPage({ isLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', riderName: '', phone: '', vehicleType: 'bike', vehicleNumber: '' });
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
        await setDoc(doc(db, 'riders', userCred.user.uid), {
          riderName: form.riderName, email: form.email, phone: form.phone,
          vehicleType: form.vehicleType, vehicleNumber: form.vehicleNumber,
          userType: 'rider', totalDeliveries: 0, totalEarnings: 0, rating: 5.0, createdAt: serverTimestamp()
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
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem', position: 'relative', overflow: 'hidden'
    }}>
      <AnimatedBackground />

      <div style={{
        background: 'rgba(251,146,60,0.1)', backdropFilter: 'blur(30px)', border: '1px solid rgba(251,146,60,0.2)',
        borderRadius: '3rem', padding: '4rem', maxWidth: '500px', width: '100%', position: 'relative', zIndex: 10,
        boxShadow: '0 30px 80px rgba(0,0,0,0.7)', animation: 'slideInUp 0.5s ease-out'
      }}>
        <div style={{
          width: '100px', height: '100px', margin: '0 auto 2rem', background: 'linear-gradient(135deg, #fb923c, #f59e0b)',
          borderRadius: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem',
          boxShadow: '0 20px 50px rgba(251,146,60,0.6)', animation: 'pulse 3s ease-in-out infinite'
        }}>
          🚚
        </div>

        <h1 style={{
          fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center',
          background: 'linear-gradient(90deg, #fb923c, #f59e0b)', backgroundClip: 'text',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          {isLogin ? 'Welcome Rider' : 'Join as Rider'}
        </h1>

        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '2rem', fontSize: '1.1rem' }}>
          {isLogin ? 'Login to start delivering' : 'Register to become a rider'}
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {!isLogin && (
            <>
              <input type="text" placeholder="Your Name *" value={form.riderName} onChange={(e) => setForm({...form, riderName: e.target.value})} required style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.05rem', outline: 'none' }} />
              <input type="tel" placeholder="Phone Number *" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.05rem', outline: 'none' }} />
            </>
          )}

          <input type="email" placeholder="Email Address *" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} required style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.05rem', outline: 'none' }} />
          <input type="password" placeholder="Password *" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} required style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.05rem', outline: 'none' }} />

          {!isLogin && (
            <>
              <select value={form.vehicleType} onChange={(e) => setForm({...form, vehicleType: e.target.value})} style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.05rem', cursor: 'pointer', outline: 'none' }}>
                <option value="bike" style={{ background: '#1e293b' }}>🏍️ Bike</option>
                <option value="scooter" style={{ background: '#1e293b' }}>🛵 Scooter</option>
                <option value="car" style={{ background: '#1e293b' }}>🚗 Car</option>
                <option value="van" style={{ background: '#1e293b' }}>🚐 Van</option>
              </select>
              <input type="text" placeholder="Vehicle Number *" value={form.vehicleNumber} onChange={(e) => setForm({...form, vehicleNumber: e.target.value})} required style={{ width: '100%', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(251,146,60,0.3)', background: 'rgba(255,255,255,0.05)', color: 'white', fontSize: '1.05rem', outline: 'none' }} />
            </>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? 'rgba(251,146,60,0.5)' : 'linear-gradient(90deg, #fb923c, #f59e0b)', color: 'white', padding: '1.25rem', borderRadius: '1.25rem', border: 'none', fontSize: '1.2rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 15px 35px rgba(251,146,60,0.5)', transition: 'all 0.3s' }}>
            {loading ? '⏳ Processing...' : (isLogin ? '🔑 Login' : '✨ Create Account')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button onClick={() => navigate(isLogin ? '/register' : '/login')} style={{ background: 'transparent', border: '2px solid rgba(251,146,60,0.3)', color: '#fb923c', padding: '0.9rem 2rem', borderRadius: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s' }}>
            {isLogin ? '✨ Sign Up' : '🔑 Login'}
          </button>
        </div>
        <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: '1.5rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '1rem', borderRadius: '1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        <div style={{ animation: 'pulse 1s ease-in-out infinite' }}>⏳</div>
      </div>
    );
  }
  return user ? children : <Navigate to="/login" />;
}

// ==========================================
// 6. DASHBOARD
// ==========================================
function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [riderData, setRiderData] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  
  // Modals
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchRiderData(user.uid);
        await fetchOrders();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchRiderData = async (uid) => {
    try {
      const docRef = doc(db, 'riders', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setRiderData({ uid, ...docSnap.data() });
      }
    } catch (error) {
      console.error('Error fetching rider data:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const q = query(collection(db, 'orders'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // --- ACTIONS ---

  // 1. ACCEPT ORDER
  const handleAcceptOrder = async (order) => {
    const confirmAccept = window.confirm("Are you sure you want to accept this order?");
    if (!confirmAccept) return;

    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'accepted',
        riderId: user.uid,
        riderName: riderData?.riderName || 'Unknown',
        riderPhone: riderData?.phone || '',
        acceptedAt: serverTimestamp()
      });
      alert('✅ Order Accepted! Proceed to Farm for Pickup.');
      await fetchOrders();
      setFilter('accepted');
    } catch (error) {
      alert('Error accepting order: ' + error.message);
    }
  };

  // 2. TRIGGER VERIFY
  const handleVerifyPickup = (order) => {
    setSelectedOrder(order);
    setShowVerificationModal(true);
  };

  // 3. TRIGGER DELIVERY
  const handleDeliverOrder = (order) => {
    setSelectedOrder(order);
    setShowDeliveryModal(true);
  };

  // 4. CONFIRM DELIVERY & UPDATE EARNINGS
  const handleDeliveryComplete = async (paymentPhoto, earnings) => {
    try {
      // Update Order
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        status: 'delivered',
        paymentStatus: 'paid', // Mark paid
        paymentProof: paymentPhoto || null,
        deliveredAt: serverTimestamp()
      });

      // Update Rider Wallet INSTANTLY (Atomic increment)
      await updateDoc(doc(db, 'riders', user.uid), {
        totalEarnings: increment(earnings),
        totalDeliveries: increment(1)
      });

      // Refresh Local State
      setRiderData(prev => ({
        ...prev,
        totalEarnings: (prev.totalEarnings || 0) + earnings,
        totalDeliveries: (prev.totalDeliveries || 0) + 1
      }));

      setShowDeliveryModal(false);
      setSelectedOrder(null);
      alert(`✅ Delivered! ₹${earnings} added to your wallet instantly.`);
      await fetchOrders();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>
        <div style={{ animation: 'pulse 1s ease-in-out infinite' }}>⏳</div>
      </div>
    );
  }

  // UPDATED FILTER LOGIC
  const filteredOrders = orders.filter(order => {
    if (filter === 'pending') return order.status === 'pending';
    if (filter === 'accepted') return order.status === 'accepted' && order.riderId === user.uid; // My accepted orders
    if (filter === 'picked') return order.status === 'picked' && order.riderId === user.uid;
    if (filter === 'delivered') return order.status === 'delivered' && order.riderId === user.uid;
    return false;
  });

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', position: 'relative' }}>
      <AnimatedBackground />

      {/* Verification Modal */}
      {showVerificationModal && selectedOrder && riderData && (
        <VerificationModal
          order={selectedOrder}
          riderData={riderData}
          onClose={() => { setShowVerificationModal(false); setSelectedOrder(null); }}
          onVerify={async () => {
            alert('✅ Product verified and picked up!');
            setShowVerificationModal(false);
            setSelectedOrder(null);
            await fetchOrders();
            setFilter('picked');
          }}
        />
      )}

      {/* Delivery Modal */}
      {showDeliveryModal && selectedOrder && (
        <DeliveryPaymentModal
          order={selectedOrder}
          onClose={() => { setShowDeliveryModal(false); setSelectedOrder(null); }}
          onConfirm={handleDeliveryComplete}
        />
      )}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(251,146,60,0.1)', backdropFilter: 'blur(30px)', border: '1px solid rgba(251,146,60,0.2)',
        borderRadius: '2rem', padding: '2rem', marginBottom: '3rem', position: 'relative', zIndex: 10,
        boxShadow: '0 15px 40px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px', height: '80px', background: 'linear-gradient(135deg, #fb923c, #f59e0b)',
            borderRadius: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem',
            boxShadow: '0 10px 30px rgba(251,146,60,0.6)'
          }}>
            🚚
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
              Rider Dashboard
            </h1>
            <p style={{ color: '#9ca3af', fontSize: '1.1rem' }}>
              {riderData?.riderName} • {riderData?.vehicleType}
            </p>
          </div>
        </div>

        <button onClick={handleLogout} style={{ background: 'rgba(239,68,68,0.2)', border: '2px solid rgba(239,68,68,0.4)', color: 'white', padding: '1rem 2rem', borderRadius: '1.25rem', fontWeight: '700', fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.3s' }}>
          🚪 Logout
        </button>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '3rem', position: 'relative', zIndex: 10
      }}>
        {[
          { icon: '💰', label: 'Wallet Balance (Instant)', value: `₹${riderData?.totalEarnings || 0}`, color: '#22c55e' },
          { icon: '📦', label: 'Total Deliveries', value: riderData?.totalDeliveries || 0, color: '#fb923c' },
          { icon: '⭐', label: 'Rating', value: riderData?.rating || 5.0, color: '#f59e0b' }
        ].map((stat, i) => (
          <div key={i} style={{ background: 'rgba(251,146,60,0.1)', backdropFilter: 'blur(30px)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '2rem', padding: '2rem', textAlign: 'center', transition: 'all 0.4s', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px) scale(1.05)'; e.currentTarget.style.boxShadow = `0 25px 50px ${stat.color}40`; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{stat.icon}</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: stat.color, marginBottom: '0.5rem' }}>{stat.value}</div>
            <div style={{ color: '#9ca3af', fontSize: '1rem' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', position: 'relative', zIndex: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: 'New Requests', icon: '⏳' },
          { key: 'accepted', label: 'To Farm', icon: '🚲' },
          { key: 'picked', label: 'In Transit', icon: '📦' },
          { key: 'delivered', label: 'History', icon: '✅' }
        ].map((tab) => (
          <button key={tab.key} onClick={() => setFilter(tab.key)} style={{
              background: filter === tab.key ? 'linear-gradient(90deg, #fb923c, #f59e0b)' : 'rgba(251,146,60,0.1)',
              border: filter === tab.key ? 'none' : '2px solid rgba(251,146,60,0.3)',
              color: 'white', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: '700', fontSize: '1.1rem',
              cursor: 'pointer', transition: 'all 0.3s', boxShadow: filter === tab.key ? '0 10px 30px rgba(251,146,60,0.4)' : 'none'
            }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ background: 'rgba(251,146,60,0.1)', backdropFilter: 'blur(30px)', border: '1px solid rgba(251,146,60,0.2)', borderRadius: '2rem', padding: '3rem', position: 'relative', zIndex: 10, boxShadow: '0 15px 40px rgba(0,0,0,0.4)' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>
          📦 Orders ({filteredOrders.length})
        </h2>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</div>
            <p style={{ fontSize: '1.2rem' }}>No orders found in this category.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
            {filteredOrders.map((order) => (
              <div key={order.id} style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '2rem', padding: '2rem', transition: 'all 0.4s', cursor: 'pointer'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-10px)'; e.currentTarget.style.boxShadow = '0 20px 50px rgba(251,146,60,0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* Status Badge */}
                <div style={{
                  display: 'inline-block',
                  background: order.status === 'pending' ? 'rgba(245,158,11,0.2)' : order.status === 'accepted' ? 'rgba(59,130,246,0.2)' : order.status === 'picked' ? 'rgba(168,85,247,0.2)' : 'rgba(34,197,94,0.2)',
                  border: `2px solid ${order.status === 'pending' ? '#f59e0b' : order.status === 'accepted' ? '#3b82f6' : order.status === 'picked' ? '#a855f7' : '#22c55e'}`,
                  color: order.status === 'pending' ? '#f59e0b' : order.status === 'accepted' ? '#3b82f6' : order.status === 'picked' ? '#a855f7' : '#22c55e',
                  padding: '0.5rem 1rem', borderRadius: '2rem', fontSize: '0.9rem', fontWeight: '700', marginBottom: '1.5rem'
                }}>
                  {order.status === 'pending' && '⏳ New Request'}
                  {order.status === 'accepted' && '🚲 Accepted (To Farm)'}
                  {order.status === 'picked' && '📦 Picked Up'}
                  {order.status === 'delivered' && '✅ Delivered'}
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fb923c' }}>
                  Order #{order.id.substring(0, 8)}
                </h3>

                {/* DETAILED LOCATIONS */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem' }}>
                    {/* FARM DETAILS */}
                    <div style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>FROM (FARM):</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#e5e7eb' }}>{order.farmName || 'Green Valley Farms'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#d1d5db' }}>📍 {order.farmAddress || 'Village Road, Sector 4'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#fb923c' }}>📞 {order.farmPhone || '+91 98765 43210'}</p>
                    </div>
                    {/* BUSINESS DETAILS */}
                    <div>
                        <p style={{ color: '#9ca3af', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>TO (BUSINESS):</p>
                        <p style={{ fontSize: '1.1rem', fontWeight: '700', color: '#e5e7eb' }}>{order.businessName || 'Fresh Mart'}</p>
                        <p style={{ fontSize: '0.95rem', color: '#d1d5db' }}>📍 {order.deliveryAddress}</p>
                        <p style={{ fontSize: '0.95rem', color: '#fb923c' }}>📞 {order.phone}</p>
                    </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Items:</p>
                  <p style={{ fontSize: '1rem', fontWeight: 'bold' }}>{order.totalItems} kg Total Weight</p>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem', marginTop: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#9ca3af' }}>Your Earnings:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                      ₹{Math.floor((order.deliveryFee || 150) * 0.9)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>Payment: {order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '💳 Online Paid'}</p>
                </div>

                {/* ACTION BUTTONS */}
                
                {/* 1. Accept Button (Only for Pending) */}
                {order.status === 'pending' && (
                  <button onClick={(e) => { e.stopPropagation(); handleAcceptOrder(order); }}
                    style={{ width: '100%', background: 'linear-gradient(90deg, #fb923c, #f59e0b)', color: 'white', padding: '1rem', borderRadius: '1rem', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }}>
                    🖐 Accept Order
                  </button>
                )}

                {/* 2. Verify Button (Only for Accepted) */}
                {order.status === 'accepted' && (
                  <button onClick={(e) => { e.stopPropagation(); handleVerifyPickup(order); }}
                    style={{ width: '100%', background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', color: 'white', padding: '1rem', borderRadius: '1rem', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }}>
                    🔍 Verify & Pick Up
                  </button>
                )}

                {/* 3. Deliver Button (Only for Picked) */}
                {order.status === 'picked' && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeliverOrder(order); }}
                    style={{ width: '100%', background: 'linear-gradient(90deg, #22c55e, #10b981)', color: 'white', padding: '1rem', borderRadius: '1rem', border: 'none', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s' }}>
                    ✅ Mark as Delivered
                  </button>
                )}

                {order.status === 'delivered' && (
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34,197,94,0.1)', borderRadius: '1rem', color: '#22c55e', fontWeight: '600' }}>
                    ✅ Completed
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RiderLanding />} />
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
