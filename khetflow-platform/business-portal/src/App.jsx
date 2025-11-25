import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect, useRef, createContext, useContext } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, addDoc, query, where, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


// ==================== THEME SYSTEM ====================

const ThemeContext = createContext();

function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}

function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('khetflow-theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('khetflow-theme', isDark ? 'dark' : 'light');
    document.body.style.transition = 'background 0.3s, color 0.3s';
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const theme = {
    isDark,
    toggleTheme,
    colors: isDark ? {
      bg: '#0f172a',
      bgLight: 'rgba(59,130,246,0.1)',
      bgCard: 'rgba(30,41,59,0.8)',
      bgCardHover: 'rgba(30,41,59,0.95)',
      border: 'rgba(59,130,246,0.3)',
      borderLight: 'rgba(59,130,246,0.15)',
      text: '#ffffff',
      textMuted: '#9ca3af',
      primary: '#3b82f6',
      primaryDark: '#2563eb',
      success: '#22c55e',
      successDark: '#16a34a',
      error: '#ef4444',
      errorDark: '#dc2626',
      warning: '#f59e0b',
      warningDark: '#d97706',
      gradient1: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      gradient2: 'linear-gradient(135deg, #22c55e, #10b981)',
      gradient3: 'linear-gradient(135deg, #f59e0b, #eab308)',
      shadow: '0 20px 60px rgba(0,0,0,0.5)'
    } : {
      bg: '#f8fafc',
      bgLight: 'rgba(59,130,246,0.05)',
      bgCard: 'rgba(255,255,255,0.95)',
      bgCardHover: 'rgba(255,255,255,1)',
      border: 'rgba(59,130,246,0.25)',
      borderLight: 'rgba(59,130,246,0.1)',
      text: '#0f172a',
      textMuted: '#64748b',
      primary: '#3b82f6',
      primaryDark: '#2563eb',
      success: '#22c55e',
      successDark: '#16a34a',
      error: '#ef4444',
      errorDark: '#dc2626',
      warning: '#f59e0b',
      warningDark: '#d97706',
      gradient1: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
      gradient2: 'linear-gradient(135deg, #22c55e, #10b981)',
      gradient3: 'linear-gradient(135deg, #f59e0b, #eab308)',
      shadow: '0 20px 60px rgba(0,0,0,0.15)'
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div style={{ 
        minHeight: '100vh', 
        background: theme.colors.bg,
        color: theme.colors.text,
        transition: 'all 0.3s'
      }}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// ==================== TOAST NOTIFICATION SYSTEM ====================

function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toast.success = (message, type = 'info') => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    return () => {
      delete toast.error;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      zIndex: 10001,
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      maxWidth: '400px'
    }}>
      {toasts.map(toast => (
        <Toast 
          key={toast.id} 
          {...toast} 
          onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} 
        />
      ))}
    </div>
  );
}

function Toast({ message, type, onClose }) {
  const theme = useTheme();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => Math.max(0, p - 2));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const colors = {
    success: { bg: theme.colors.success, icon: '✅', label: 'Success' },
    error: { bg: theme.colors.error, icon: '❌', label: 'Error' },
    info: { bg: theme.colors.primary, icon: 'ℹ️', label: 'Info' },
    warning: { bg: theme.colors.warning, icon: '⚠️', label: 'Warning' }
  };

  const color = colors[type] || colors.info;

  return (
    <div style={{
      background: theme.colors.bgCard,
      backdropFilter: 'blur(20px)',
      border: `2px solid ${color.bg}`,
      borderRadius: '1rem',
      padding: '1.5rem',
      minWidth: '300px',
      boxShadow: `0 10px 40px ${color.bg}60`,
      animation: 'slideInRight 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{color.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ margin: '0 0 0.25rem 0', color: color.bg, fontWeight: '700', fontSize: '0.9rem' }}>
            {color.label}
          </p>
          <p style={{ margin: 0, color: theme.colors.text, fontSize: '0.95rem', lineHeight: 1.4 }}>
            {message}
          </p>
        </div>
        <button 
          onClick={onClose} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: theme.colors.textMuted, 
            cursor: 'pointer', 
            fontSize: '1.2rem',
            flexShrink: 0,
            padding: 0,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          ✕
        </button>
      </div>
      <div style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        height: '4px', 
        width: `${progress}%`, 
        background: color.bg, 
        transition: 'width 0.1s linear',
        boxShadow: `0 0 10px ${color.bg}`
      }} />
    </div>
  );
}

// ==================== SKELETON LOADER ====================

function SkeletonLoader({ width = '100%', height = '20px', borderRadius = '0.5rem', style = {} }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.05) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style
    }} />
  );
}

function CardSkeleton() {
  return (
    <div style={{ 
      background: 'rgba(255,255,255,0.05)', 
      borderRadius: '2rem', 
      padding: '2rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <SkeletonLoader height="200px" />
      <SkeletonLoader width="80%" height="24px" />
      <SkeletonLoader width="60%" height="16px" />
      <SkeletonLoader width="40%" height="32px" />
      <SkeletonLoader height="48px" />
    </div>
  );
}

// ==================== PREMIUM BUTTON ====================

function PremiumButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  loading = false, 
  disabled = false, 
  fullWidth = false,
  size = 'md',
  icon,
  style = {}, 
  ...props 
}) {
  const theme = useTheme();
   
  const variants = {
    primary: {
      background: theme.colors.gradient1,
      color: 'white',
      border: 'none'
    },
    success: {
      background: theme.colors.gradient2,
      color: 'white',
      border: 'none'
    },
    danger: {
      background: `linear-gradient(90deg, ${theme.colors.error}, ${theme.colors.errorDark})`,
      color: 'white',
      border: 'none'
    },
    warning: {
      background: theme.colors.gradient3,
      color: 'white',
      border: 'none'
    },
    ghost: {
      background: 'transparent',
      border: `2px solid ${theme.colors.border}`,
      color: theme.colors.text
    },
    outline: {
      background: 'transparent',
      border: `2px solid ${theme.colors.primary}`,
      color: theme.colors.primary
    }
  };

  const sizes = {
    sm: { padding: '0.75rem 1.5rem', fontSize: '0.95rem' },
    md: { padding: '1rem 2rem', fontSize: '1.1rem' },
    lg: { padding: '1.25rem 2.5rem', fontSize: '1.2rem' }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...variants[variant],
        ...sizes[size],
        width: fullWidth ? '100%' : 'auto',
        borderRadius: '1rem',
        fontWeight: '700',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        boxShadow: disabled || loading ? 'none' : '0 4px 20px rgba(0,0,0,0.2)',
        ...style
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
        }
      }}
      {...props}
    >
      {loading ? (
        <>
          <div style={{ 
            width: '16px', 
            height: '16px', 
            border: '2px solid white', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 0.8s linear infinite' 
          }} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span style={{ fontSize: '1.2rem' }}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}

// ==================== PREMIUM INPUT ====================

function PremiumInput({ 
  label, 
  error, 
  icon, 
  helperText,
  ...props 
}) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div style={{ width: '100%' }}>
      {label && (
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          color: theme.colors.text,
          fontWeight: '600',
          fontSize: '0.95rem'
        }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '1.2rem',
            color: theme.colors.textMuted
          }}>
            {icon}
          </span>
        )}
        <input
          {...props}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={{
            width: '100%',
            padding: icon ? '1.25rem 1.25rem 1.25rem 3.5rem' : '1.25rem',
            borderRadius: '1rem',
            border: `2px solid ${error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.border}`,
            background: theme.colors.bgCard,
            color: theme.colors.text,
            fontSize: '1.05rem',
            outline: 'none',
            transition: 'all 0.3s',
            boxShadow: isFocused ? `0 0 0 4px ${theme.colors.primary}20` : 'none',
            ...props.style
          }}
        />
      </div>
      {error && (
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          color: theme.colors.error, 
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>⚠️</span> {error}
        </p>
      )}
      {helperText && !error && (
        <p style={{ 
          margin: '0.5rem 0 0 0', 
          color: theme.colors.textMuted, 
          fontSize: '0.85rem'
        }}>
          {helperText}
        </p>
      )}
    </div>
  );
}

// ==================== THEME TOGGLE ====================

function ThemeToggle() {
  const theme = useTheme();

  return (
    <button
      onClick={theme.toggleTheme}
      style={{
        background: theme.colors.bgCard,
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '2rem',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'all 0.3s',
        color: theme.colors.text,
        fontWeight: '600',
        fontSize: '1rem',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      }}
    >
      <span style={{ fontSize: '1.3rem', transition: 'all 0.3s' }}>
        {theme.isDark ? '🌙' : '☀️'}
      </span>
      <span>{theme.isDark ? 'Dark Mode' : 'Light Mode'}</span>
    </button>
  );
}

// ==================== ANIMATED BACKGROUND ====================

function AnimatedBackground() {
  const theme = useTheme();

  return (
    <>
      <div style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: theme.isDark ? 1 : 0.6
      }}>
        <div style={{
          position: 'absolute',
          width: '700px',
          height: '700px',
          background: `radial-gradient(circle, ${theme.colors.primary}50 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
          top: '-150px',
          left: '-150px',
          animation: 'float1 25s ease-in-out infinite'
        }}></div>
        
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          background: `radial-gradient(circle, ${theme.colors.success}40 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
          bottom: '-150px',
          right: '-150px',
          animation: 'float2 20s ease-in-out infinite'
        }}></div>

        <div style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          background: `radial-gradient(circle, ${theme.colors.warning}30 0%, transparent 70%)`,
          borderRadius: '50%',
          filter: 'blur(100px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: 'float1 30s ease-in-out infinite reverse'
        }}></div>

        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: `${Math.random() * 8 + 2}px`,
              height: `${Math.random() * 8 + 2}px`,
              background: theme.colors.primary,
              borderRadius: '50%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.4,
              animation: `particle ${3 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 3}s`,
              boxShadow: `0 0 10px ${theme.colors.primary}`
            }}
          ></div>
        ))}
      </div>

      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(60px, -60px) scale(1.15); }
          50% { transform: translate(-40px, -100px) scale(0.9); }
          75% { transform: translate(-60px, 50px) scale(1.1); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-70px, 60px) scale(1.1); }
          66% { transform: translate(50px, -50px) scale(0.95); }
        }
        
        @keyframes particle {
          0%, 100% { transform: translateY(0); opacity: 0; }
          50% { transform: translateY(-50px); opacity: 0.6; }
        }
        
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.08); }
        }

        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(100px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

// ==================== SUCCESS CONFETTI ====================

function SuccessConfetti() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 9999
    }}>
      {[...Array(80)].map((_, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: '-20px',
            width: `${Math.random() * 10 + 5}px`,
            height: `${Math.random() * 10 + 5}px`,
            background: ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
            borderRadius: Math.random() > 0.5 ? '50%' : '0',
            animation: `confetti ${2 + Math.random() * 3}s ease-out forwards`,
            animationDelay: `${Math.random() * 0.5}s`,
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}
        />
      ))}
    </div>
  );
}


// ==================== DELIVERY VERIFICATION MODAL (PREMIUM) ====================

function DeliveryVerificationModal({ order, onClose, onVerify }) {
  const theme = useTheme();
  const [scannedData, setScannedData] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const scannerRef = useRef(null);
  const [scannerInitialized, setScannerInitialized] = useState(false);

  useEffect(() => {
    if (!scannerInitialized) {
      const scanner = new Html5QrcodeScanner('delivery-qr-reader', {
        fps: 10,
        qrbox: { width: 250, height: 250 }
      });

      scanner.render(
        (decodedText) => {
          try {
            const data = JSON.parse(decodedText);
            setScannedData(data);
            scanner.clear();
            toast.success('QR Code scanned successfully!', 'success');
          } catch (e) {
            toast.error('Invalid QR code! Please try again.', 'error');
          }
        },
        (error) => {
          // Ignore scanning errors
        }
      );

      scannerRef.current = scanner;
      setScannerInitialized(true);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const handleConfirmDelivery = async () => {
    if (!scannedData) {
    toast.error('Please scan the product code first!', 'warning');
      return;
    }

    setVerifying(true);
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: 'delivered',
        deliveryVerified: true,
        deliveryScannedData: scannedData,
        deliveryConfirmedAt: serverTimestamp()
      });

      toast.success('Delivery verified successfully! 🎉', 'success');
      setTimeout(() => onVerify(), 1000);
    } catch (error) {
      toast.error('Error confirming delivery: ' + error.message, 'error');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.9)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '2rem',
      overflowY: 'auto',
      animation: 'fadeIn 0.3s ease-out'
    }}>
      <div style={{
        background: theme.colors.bgCard,
        backdropFilter: 'blur(30px)',
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '2rem',
        padding: '3rem',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: theme.colors.shadow,
        animation: 'slideInUp 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            background: theme.colors.gradient1,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            📦 Verify Delivery
          </h2>
          <button
            onClick={onClose}
            style={{
              background: `${theme.colors.error}20`,
              border: 'none',
              color: theme.colors.error,
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '1.5rem',
              transition: 'all 0.3s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
              e.currentTarget.style.background = `${theme.colors.error}40`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
              e.currentTarget.style.background = `${theme.colors.error}20`;
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ color: theme.colors.textMuted, marginBottom: '2rem', fontSize: '1.1rem' }}>
          Scan the product code to verify authenticity and confirm delivery
        </p>

        {/* Order Details */}
        <div style={{
          background: theme.colors.bgLight,
          borderRadius: '1rem',
          padding: '1.5rem',
          marginBottom: '2rem',
          border: `1px solid ${theme.colors.borderLight}`
        }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: theme.colors.text }}>Order Details</h3>
          <p style={{ marginBottom: '0.5rem', color: theme.colors.text }}>
            <strong>Order ID:</strong> {order.id.substring(0, 12)}...
          </p>
          <p style={{ marginBottom: '0.5rem', color: theme.colors.text }}>
            <strong>Rider:</strong> {order.riderName || 'Not assigned'}
          </p>
          <p style={{ color: theme.colors.text }}>
            <strong>Amount:</strong> <span style={{ color: theme.colors.success, fontSize: '1.2rem', fontWeight: 'bold' }}>₹{order.totalAmount}</span>
          </p>
        </div>

        {/* Rider's Verification Photos */}
        {order.verificationPhotos && order.verificationPhotos.length > 0 && (
          <div style={{
            background: `${theme.colors.success}15`,
            border: `2px solid ${theme.colors.success}`,
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: theme.colors.success }}>
              ✅ Rider Verification Complete
            </h3>
            <p style={{ color: theme.colors.textMuted, marginBottom: '1rem' }}>Photos taken at pickup:</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {order.verificationPhotos.map((photo, i) => (
                <img
                  key={i}
                  src={photo}
                  alt={`Verification ${i+1}`}
                  style={{
                    width: '110px',
                    height: '110px',
                    objectFit: 'cover',
                    borderRadius: '0.75rem',
                    border: `3px solid ${theme.colors.success}`,
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                  }}
                  onClick={() => window.open(photo, '_blank')}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(2deg)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
                />
              ))}
            </div>
            {order.verificationNotes && (
              <p style={{ marginTop: '1rem', color: theme.colors.textMuted, fontStyle: 'italic' }}>
                <strong>Notes:</strong> {order.verificationNotes}
              </p>
            )}
          </div>
        )}

        {/* Scanner */}
        {!scannedData ? (
          <div style={{
            background: theme.colors.bgLight,
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            border: `1px solid ${theme.colors.borderLight}`
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: theme.colors.text }}>
              📱 Scan Product Code
            </h3>
            <div id="delivery-qr-reader" style={{ borderRadius: '1rem', overflow: 'hidden' }}></div>
          </div>
        ) : (
          <div style={{
            background: `${theme.colors.success}15`,
            border: `2px solid ${theme.colors.success}`,
            borderRadius: '1rem',
            padding: '2rem',
            marginBottom: '2rem',
            animation: 'slideInUp 0.5s ease-out'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: theme.colors.success }}>
              ✅ Product Verified!
            </h3>
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <p style={{ color: theme.colors.text }}>
                <strong>Product:</strong> {scannedData.name}
              </p>
              <p style={{ color: theme.colors.text }}>
                <strong>Farm:</strong> {scannedData.farmName}
              </p>
              <p style={{ color: theme.colors.text }}>
                <strong>Grade:</strong> <span style={{ 
                  background: theme.colors.gradient3, 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: 'bold'
                }}>{scannedData.grade}</span>
              </p>
              <p style={{ color: theme.colors.text }}>
                <strong>Location:</strong> {scannedData.farmLocation}
              </p>
            </div>
            <p style={{ marginTop: '1.5rem', color: theme.colors.success, fontSize: '1.1rem', fontWeight: '600' }}>
              ✓ Authentic product from verified farm
            </p>
          </div>
        )}

        {/* Confirm Button */}
        {scannedData && (
          <PremiumButton
            variant="success"
            fullWidth
            size="lg"
            loading={verifying}
            onClick={handleConfirmDelivery}
            icon="✅"
          >
            {verifying ? 'Confirming Delivery...' : 'Confirm Delivery Received'}
          </PremiumButton>
        )}
      </div>
    </div>
  );
}

// ==================== BUSINESS LANDING PAGE (PREMIUM) ====================

function BusinessLanding() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <AnimatedBackground />

      {/* Theme Toggle - Top Right */}
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div style={{
        maxWidth: '1200px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 10,
        width: '100%',
        animation: 'fadeIn 1s ease-out'
      }}>
        <div style={{
          width: '170px',
          height: '170px',
          margin: '0 auto 2rem',
          background: theme.colors.gradient1,
          borderRadius: '2.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '6rem',
          boxShadow: `0 30px 80px ${theme.colors.primary}60`,
          animation: 'pulse 3s ease-in-out infinite',
          cursor: 'pointer',
          transition: 'all 0.5s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15) rotate(10deg)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
        >
          🏪
        </div>

        <h1 style={{
          fontSize: '6rem',
          fontWeight: 'bold',
          marginBottom: '1.5rem',
          background: `linear-gradient(90deg, ${theme.colors.primary} 0%, #06b6d4 25%, ${theme.colors.success} 50%, #06b6d4 75%, ${theme.colors.primary} 100%)`,
          backgroundSize: '200% 100%',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'shimmer 3s linear infinite'
        }}>
          KhetFlow Business
        </h1>

        <p style={{
          fontSize: '2.2rem',
          color: theme.colors.text,
          marginBottom: '1rem',
          fontWeight: '600'
        }}>
          Save Big on Fresh Produce 💰
        </p>

        <p style={{
          fontSize: '1.4rem',
          color: theme.colors.textMuted,
          marginBottom: '4rem',
          maxWidth: '850px',
          margin: '0 auto 4rem',
          lineHeight: 1.6
        }}>
          Buy Grade B & C produce directly from farms. Same quality, 40-60% cheaper. Perfect for restaurants, cafes, and food businesses.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginBottom: '4rem',
          maxWidth: '1100px',
          margin: '0 auto 4rem'
        }}>
          {[
            { label: 'Save Money', value: '40-60%', icon: '💰', color: theme.colors.success, desc: 'Cheaper than retail' },
            { label: 'Fresh Quality', value: '100%', icon: '🌿', color: theme.colors.success, desc: 'Same nutrition value' },
            { label: 'Happy Businesses', value: '850+', icon: '🏪', color: theme.colors.primary, desc: 'Restaurants & cafes' }
          ].map((stat, i) => (
            <div
              key={i}
              onMouseEnter={() => setHoveredCard(i)}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                background: hoveredCard === i ? theme.colors.bgCardHover : theme.colors.bgCard,
                backdropFilter: 'blur(20px)',
                border: hoveredCard === i ? `2px solid ${stat.color}` : `1px solid ${theme.colors.border}`,
                borderRadius: '2rem',
                padding: '3rem 2rem',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                transform: hoveredCard === i ? 'translateY(-20px) scale(1.05)' : 'translateY(0) scale(1)',
                boxShadow: hoveredCard === i ? `0 25px 60px ${stat.color}40` : '0 10px 30px rgba(0,0,0,0.2)',
              }}
            >
              <div style={{ 
                fontSize: '4.5rem', 
                marginBottom: '1rem',
                transform: hoveredCard === i ? 'scale(1.2) rotate(10deg)' : 'scale(1)',
                transition: 'all 0.3s'
              }}>
                {stat.icon}
              </div>
              <div style={{
                fontSize: '3.5rem',
                fontWeight: 'bold',
                color: stat.color,
                marginBottom: '0.5rem'
              }}>
                {stat.value}
              </div>
              <div style={{ color: theme.colors.text, fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                {stat.label}
              </div>
              <div style={{ color: theme.colors.textMuted, fontSize: '1rem' }}>{stat.desc}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          gap: '2rem',
          justifyContent: 'center',
          marginBottom: '5rem',
          flexWrap: 'wrap'
        }}>
          <PremiumButton
            variant="primary"
            size="lg"
            icon="🚀"
            onClick={() => navigate('/login')}
            style={{ fontSize: '1.5rem', padding: '1.5rem 4rem' }}
          >
            Login
          </PremiumButton>

          <PremiumButton
            variant="outline"
            size="lg"
            icon="📖"
            onClick={() => navigate('/register')}
            style={{ fontSize: '1.5rem', padding: '1.5rem 4rem' }}
          >
            Creat account
          </PremiumButton>
        </div>

        {/* Features Section */}
        <div style={{
          background: theme.colors.bgCard,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '2rem',
          padding: '3rem',
          marginTop: '4rem',
          textAlign: 'left'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            textAlign: 'center',
            color: theme.colors.text
          }}>
            Why Choose KhetFlow? 🌟
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem'
          }}>
            {[
              { icon: '✅', title: 'Verified Quality', desc: 'QR code verification ensures authentic produce' },
              { icon: '📦', title: 'Direct from Farm', desc: 'No middlemen, better prices for you' },
              { icon: '🚚', title: 'Fast Delivery', desc: 'Quick and reliable delivery to your doorstep' },
              { icon: '💚', title: 'Reduce Waste', desc: 'Help prevent food waste, save the environment' }
            ].map((feature, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 'bold', marginBottom: '0.5rem', color: theme.colors.text }}>
                  {feature.title}
                </h3>
                <p style={{ color: theme.colors.textMuted, lineHeight: 1.5 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


// ==================== AUTH PAGE (PREMIUM) ====================

function AuthPage({ isLogin }) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [form, setForm] = useState({
    email: '',
    password: '',
    businessName: '',
    ownerName: '',
    phone: '',
    address: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'email':
        return !value ? 'Email is required' : 
               !/\S+@\S+\.\S+/.test(value) ? 'Email is invalid' : '';
      case 'password':
        return !value ? 'Password is required' :
               value.length < 6 ? 'Password must be at least 6 characters' : '';
      case 'businessName':
        return !isLogin && !value ? 'Business name is required' : '';
      case 'ownerName':
        return !isLogin && !value ? 'Owner name is required' : '';
      case 'phone':
        return !isLogin && !value ? 'Phone is required' :
               !isLogin && !/^\d{10}$/.test(value) ? 'Phone must be 10 digits' : '';
      case 'address':
        return !isLogin && !value ? 'Address is required' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    if (touched[name]) {
      setErrors({ ...errors, [name]: validateField(name, value) });
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched({ ...touched, [name]: true });
    setErrors({ ...errors, [name]: validateField(name, value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    Object.keys(form).forEach(key => {
      const error = validateField(key, form[key]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(Object.keys(form).reduce((acc, key) => ({ ...acc, [key]: true }), {}));
      toast.error('Please fix all errors before submitting', 'error');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, form.email, form.password);
      toast.success('Login successful! Welcome back! 🎉', 'success');
        navigate('/dashboard');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await setDoc(doc(db, 'businesses', userCred.user.uid), {
          businessName: form.businessName,
          ownerName: form.ownerName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          userType: 'business',
          createdAt: serverTimestamp()
        });
        toast.success('Account created successfully! 🎉', 'success');
        navigate('/dashboard');
      }
    } catch (err) {
      const errorMessage = err.message.replace('Firebase: ', '').replace('auth/', '');
      toast.error(errorMessage, 'error');
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

      {/* Theme Toggle */}
      <div style={{ position: 'fixed', top: '2rem', right: '2rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div style={{
        background: theme.colors.bgCard,
        backdropFilter: 'blur(30px)',
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '3rem',
        padding: '4rem',
        maxWidth: '550px',
        width: '100%',
        position: 'relative',
        zIndex: 10,
        boxShadow: theme.colors.shadow,
        animation: 'slideInUp 0.5s ease-out'
      }}>
        <div style={{
          width: '110px',
          height: '110px',
          margin: '0 auto 2rem',
          background: theme.colors.gradient1,
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4.5rem',
          boxShadow: `0 20px 50px ${theme.colors.primary}60`,
          animation: 'pulse 3s ease-in-out infinite'
        }}>
          🏪
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          textAlign: 'center',
          background: theme.colors.gradient1,
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {isLogin ? 'Welcome Back' : 'Join KhetFlow'}
        </h1>

        <p style={{
          textAlign: 'center',
          color: theme.colors.textMuted,
          marginBottom: '3rem',
          fontSize: '1.15rem'
        }}>
          {isLogin ? 'Login to order fresh produce' : 'Register your business today'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {!isLogin && (
            <>
              <PremiumInput
                type="text"
                name="businessName"
                placeholder="Business Name"
                label="Business Name"
                icon="🏪"
                value={form.businessName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.businessName && errors.businessName}
                required
              />
              <PremiumInput
                type="text"
                name="ownerName"
                placeholder="Owner Name"
                label="Owner Name"
                icon="👤"
                value={form.ownerName}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.ownerName && errors.ownerName}
                required
              />
            </>
          )}

          <PremiumInput
            type="email"
            name="email"
            placeholder="Email Address"
            label="Email Address"
            icon="📧"
            value={form.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email}
            required
          />

          <PremiumInput
            type="password"
            name="password"
            placeholder="Password"
            label="Password"
            icon="🔒"
            value={form.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password}
            helperText={!isLogin && "Must be at least 6 characters"}
            required
          />

          {!isLogin && (
            <>
              <PremiumInput
                type="tel"
                name="phone"
                placeholder="Phone Number"
                label="Phone Number"
                icon="📱"
                value={form.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.phone && errors.phone}
                helperText="10 digit phone number"
                required
              />
              <PremiumInput
                type="text"
                name="address"
                placeholder="Business Address"
                label="Business Address"
                icon="📍"
                value={form.address}
                onChange={handleChange}
                onBlur={handleBlur}
                error={touched.address && errors.address}
                required
              />
            </>
          )}

          <PremiumButton
            type="submit"
            variant="primary"
            fullWidth
            size="lg"
            loading={loading}
            icon={isLogin ? '🔑' : '✨'}
          >
            {isLogin ? 'Login' : 'Create Account'}
          </PremiumButton>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '2.5rem 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: theme.colors.border }}></div>
          <span style={{ color: theme.colors.textMuted, fontSize: '0.95rem', fontWeight: '500' }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: theme.colors.border }}></div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <p style={{ color: theme.colors.textMuted, marginBottom: '1.5rem', fontSize: '1rem' }}>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </p>
          <PremiumButton
            variant="ghost"
            onClick={() => navigate(isLogin ? '/register' : '/login')}
            icon={isLogin ? '✨' : '🔑'}
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </PremiumButton>
        </div>

        <PremiumButton
          variant="ghost"
          fullWidth
          onClick={() => navigate('/')}
          icon="←"
          style={{ marginTop: '2rem' }}
        >
          Back to Home
        </PremiumButton>
      </div>
    </div>
  );
}

// ==================== PROTECTED ROUTE ====================

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
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '2rem'
      }}>
        <AnimatedBackground />
        <div style={{ 
          fontSize: '5rem',
          animation: 'pulse 1s ease-in-out infinite',
          position: 'relative',
          zIndex: 10
        }}>
          🏪
        </div>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          border: '4px solid rgba(59,130,246,0.2)', 
          borderTopColor: '#3b82f6', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          position: 'relative',
          zIndex: 10
        }} />
        <p style={{ 
          fontSize: '1.3rem', 
          color: '#9ca3af',
          position: 'relative',
          zIndex: 10
        }}>
          Loading KhetFlow...
        </p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
}


// ==================== DASHBOARD (PREMIUM - COMPLETE) ====================

function Dashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const [user, setUser] = useState(null);
  const [businessData, setBusinessData] = useState(null);
  const [view, setView] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ address: '', phone: '' });
  const [ordering, setOrdering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // New State for Payment and Delivery Fee
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'
  // Simulating distance for demo (e.g., 12.5km)
  const [estimatedDistance] = useState(12.5); 
  const deliveryRate = 8; // ₹8 per km limit
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price-low');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        await fetchBusinessData(user.uid);
        await fetchListings();
        await fetchOrders(user.uid);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const fetchBusinessData = async (uid) => {
    try {
      const docRef = doc(db, 'businesses', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setBusinessData(data);
        setDeliveryForm({ address: data.address || '', phone: data.phone || '' });
      }
    } catch (error) {
      toast.error('Error loading business data', 'error');
    }
  };

  const fetchListings = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'listings'));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListings(data);
    } catch (error) {
      toast.error('Error loading products', 'error');
    }
  };

  const fetchOrders = async (uid) => {
    try {
      const q = query(collection(db, 'orders'), where('businessId', '==', uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (error) {
      toast.error('Error loading orders', 'error');
    }
  };

  const getFilteredAndSortedListings = () => {
    let filtered = listings;
    if (searchTerm) {
      filtered = filtered.filter(listing => 
        listing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        listing.farmLocation?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(listing => listing.grade === gradeFilter);
    }
    if (sortBy === 'price-low') {
      filtered = [...filtered].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filtered = [...filtered].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'quantity') {
      filtered = [...filtered].sort((a, b) => b.quantity - a.quantity);
    } else if (sortBy === 'name') {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }
    return filtered;
  };

  const filteredListings = getFilteredAndSortedListings();

  const addToCart = (listing) => {
    const existingItem = cart.find(item => item.id === listing.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === listing.id 
          ? { ...item, cartQuantity: Math.min(item.cartQuantity + 1, item.quantity) }
          : item
      ));
      toast.success(`Updated ${listing.name} quantity in cart`, 'info');
    } else {
      setCart([...cart, { ...listing, cartQuantity: 1 }]);
      toast.success(`Added ${listing.name} to cart! 🛒`, 'success');
    }
  };

  const updateCartQuantity = (listingId, newQuantity) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.id !== listingId));
      toast.success('Item removed from cart', 'info');
    } else {
      setCart(cart.map(item => 
        item.id === listingId 
          ? { ...item, cartQuantity: Math.min(newQuantity, item.quantity) }
          : item
      ));
    }
  };

  // Calculations for Order
  const subTotal = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);
  const deliveryFee = Math.ceil(estimatedDistance * deliveryRate);
  const finalTotal = subTotal + deliveryFee;

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setOrdering(true);
    try {
      const order = {
        businessId: user.uid,
        businessName: businessData?.businessName || 'Unknown',
        items: cart,
        totalItems: cart.reduce((sum, item) => sum + item.cartQuantity, 0),
        subTotal: subTotal,
        deliveryFee: deliveryFee,
        totalAmount: finalTotal,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'online' ? 'paid' : 'pending',
        deliveryAddress: deliveryForm.address,
        phone: deliveryForm.phone,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'orders'), order);

      setCart([]);
      setShowCart(false);
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setView('orders');
      }, 3000);

      await fetchOrders(user.uid);
    } catch (error) {
      toast.error('Error placing order: ' + error.message, 'error');
    } finally {
      setOrdering(false);
    }
  };

  const handleVerifyDelivery = (order) => {
    setSelectedOrder(order);
    setShowVerificationModal(true);
  };

  const handleVerificationComplete = async () => {
    setShowVerificationModal(false);
    setSelectedOrder(null);
    await fetchOrders(user.uid);
  };

  const handleLogout = async () => {
    await signOut(auth);
    toast.success('Logged out successfully', 'info');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem', position: 'relative' }}>
        <AnimatedBackground />
        <div style={{ position: 'relative', zIndex: 10 }}>
          <div style={{ marginBottom: '3rem' }}>
            <SkeletonLoader height="120px" borderRadius="2rem" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        </div>
      </div>
    );
  }

  const totalItems = cart.reduce((sum, item) => sum + item.cartQuantity, 0);

  return (
    <div style={{ minHeight: '100vh', padding: '2rem', position: 'relative' }}>
      <AnimatedBackground />
      <ToastContainer />
      {showSuccess && <SuccessConfetti />}
      {showVerificationModal && selectedOrder && (
        <DeliveryVerificationModal 
          order={selectedOrder} 
          onClose={() => {
            setShowVerificationModal(false);
            setSelectedOrder(null);
          }}
          onVerify={handleVerificationComplete}
        />
      )}

      {/* ====== HEADER ===== */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: theme.colors.bgCard,
        backdropFilter: 'blur(30px)',
        border: `2px solid ${theme.colors.border}`,
        borderRadius: '2rem',
        padding: '2rem',
        marginBottom: '3rem',
        position: 'relative',
        zIndex: 10,
        boxShadow: theme.colors.shadow,
        flexWrap: 'wrap',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: theme.colors.gradient1,
            borderRadius: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '3rem',
            boxShadow: `0 10px 30px ${theme.colors.primary}60`,
            animation: 'pulse 3s ease-in-out infinite'
          }}>🏪</div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: theme.colors.text }}>
              {businessData?.businessName || 'Business Dashboard'}
            </h1>
            <p style={{ color: theme.colors.textMuted, fontSize: '1.1rem' }}>
              {businessData?.ownerName} • {user?.email}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <PremiumButton 
            variant={view === 'marketplace' ? 'primary' : 'ghost'}
            onClick={() => setView('marketplace')}
            icon="🛒"
          >Marketplace</PremiumButton>
          <PremiumButton 
            variant={view === 'orders' ? 'success' : 'ghost'}
            onClick={() => setView('orders')}
            icon="📦"
          >Orders ({orders.length})</PremiumButton>
          <ThemeToggle />
          <PremiumButton 
            variant="danger"
            onClick={handleLogout}
            icon="🚪"
          >Logout</PremiumButton>
        </div>
      </div>

      {/* ====== MARKETPLACE VIEW ===== */}
      {view === 'marketplace' && (
        <>
          {/* Search & Filter Bar */}
          <div style={{
            background: theme.colors.bgCard,
            backdropFilter: 'blur(30px)',
            border: `2px solid ${theme.colors.border}`,
            borderRadius: '2rem',
            padding: '2rem',
            marginBottom: '3rem',
            position: 'relative',
            zIndex: 10,
            boxShadow: theme.colors.shadow
          }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              <PremiumInput 
                type="text"
                placeholder="Search products..."
                icon="🔍"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: '1 1 300px' }}
              />
              <select 
                value={gradeFilter} 
                onChange={(e) => setGradeFilter(e.target.value)}
                style={{
                  flex: '0 1 150px',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: `2px solid ${theme.colors.border}`,
                  background: theme.colors.bgCard,
                  color: theme.colors.text,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: '600'
                }}>
                <option value="all" style={{ background: theme.colors.bg }}>All Grades</option>
                <option value="B" style={{ background: theme.colors.bg }}>Grade B</option>
                <option value="C" style={{ background: theme.colors.bg }}>Grade C</option>
              </select>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  flex: '0 1 200px',
                  padding: '1.25rem',
                  borderRadius: '1rem',
                  border: `2px solid ${theme.colors.border}`,
                  background: theme.colors.bgCard,
                  color: theme.colors.text,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  outline: 'none',
                  fontWeight: '600'
                }}>
                <option value="price-low" style={{ background: theme.colors.bg }}>Price: Low to High</option>
                <option value="price-high" style={{ background: theme.colors.bg }}>Price: High to Low</option>
                <option value="quantity" style={{ background: theme.colors.bg }}>Most Available</option>
                <option value="name" style={{ background: theme.colors.bg }}>Name: A-Z</option>
              </select>
              {(searchTerm || gradeFilter !== 'all' || sortBy !== 'price-low') && (
                <PremiumButton 
                  variant="danger" 
                  onClick={() => {
                    setSearchTerm('');
                    setGradeFilter('all');
                    setSortBy('price-low');
                    toast.success('Filters cleared', 'info');
                  }}
                  icon="✕"
                  size="sm"
                >
                  Clear
                </PremiumButton>
              )}
            </div>
            <div style={{ 
              padding: '1rem', 
              background: theme.colors.bgLight, 
              borderRadius: '1rem',
              textAlign: 'center',
              color: theme.colors.textMuted,
              fontSize: '1rem',
              fontWeight: '500'
            }}>
              Showing <strong style={{ color: theme.colors.primary }}>{filteredListings.length}</strong> of <strong>{listings.length}</strong> products
              {searchTerm && <span> matching "<strong style={{ color: theme.colors.success }}>{searchTerm}</strong>"</span>}
              {gradeFilter !== 'all' && <span> • Grade <strong style={{ color: theme.colors.warning }}>{gradeFilter}</strong></span>}
            </div>
          </div>
          {/* Cart Badge */}
          {cart.length > 0 && !showCart && (
            <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 100 }}>
              <PremiumButton 
                variant="success"
                size="lg"
                onClick={() => setShowCart(true)}
                style={{ position: 'relative', fontSize: '1.3rem', boxShadow: `0 20px 60px ${theme.colors.success}60` }}
              >
                🛒 View Cart ({cart.length})
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: theme.colors.error,
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}>
                  {totalItems}
                </div>
              </PremiumButton>
            </div>
          )}
          {/* Cart Modal */}
          {showCart && (
            <div style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '2rem',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div style={{
                background: theme.colors.bgCard,
                backdropFilter: 'blur(30px)',
                border: `2px solid ${theme.colors.border}`,
                borderRadius: '2rem',
                padding: '3rem',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: theme.colors.shadow,
                animation: 'slideInUp 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '2rem'
                }}>
                  <h2 style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold',
                    background: theme.colors.gradient2,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    🛒 Your Cart
                  </h2>
                  <button
                    onClick={() => setShowCart(false)}
                    style={{
                      background: `${theme.colors.error}20`,
                      border: 'none',
                      color: theme.colors.error,
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '1.5rem',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'rotate(90deg) scale(1.1)';
                      e.currentTarget.style.background = `${theme.colors.error}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'rotate(0deg) scale(1)';
                      e.currentTarget.style.background = `${theme.colors.error}20`;
                    }}
                  >
                    ✕
                  </button>
                </div>
                {cart.map((item) => (
                  <div 
                    key={item.id}
                    style={{
                      background: theme.colors.bgLight,
                      borderRadius: '1rem',
                      padding: '1.5rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: `1px solid ${theme.colors.border}`,
                      transition: 'all 0.3s',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem', color: theme.colors.text }}>
                        {item.name}
                      </h3>
                      <p style={{ color: theme.colors.textMuted, fontSize: '1rem' }}>
                        ₹{item.price}/kg • Grade {item.grade}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.cartQuantity - 1)}
                        style={{
                          background: `${theme.colors.error}20`,
                          border: `2px solid ${theme.colors.error}`,
                          color: theme.colors.error,
                          width: '40px',
                          height: '40px',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        -
                      </button>
                      <span style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        minWidth: '60px', 
                        textAlign: 'center',
                        color: theme.colors.text 
                      }}>
                        {item.cartQuantity}kg
                      </span>
                      <button 
                        onClick={() => updateCartQuantity(item.id, item.cartQuantity + 1)}
                        style={{
                          background: `${theme.colors.success}20`,
                          border: `2px solid ${theme.colors.success}`,
                          color: theme.colors.success,
                          width: '40px',
                          height: '40px',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          fontSize: '1.5rem',
                          fontWeight: 'bold',
                          transition: 'all 0.3s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        +
                      </button>
                      <span style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: 'bold', 
                        color: theme.colors.success,
                        minWidth: '100px',
                        textAlign: 'right'
                      }}>
                        ₹{item.price * item.cartQuantity}
                      </span>
                    </div>
                  </div>
                ))}
                
                <div style={{
                  borderTop: `2px solid ${theme.colors.border}`,
                  paddingTop: '1.5rem',
                  marginTop: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  {/* Subtotal */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '1.1rem', color: theme.colors.textMuted }}>Subtotal:</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: theme.colors.text }}>₹{subTotal}</span>
                  </div>

                  {/* Delivery Fee Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '1.2rem' }}>🛵</span>
                      <span style={{ fontSize: '1.1rem', color: theme.colors.textMuted }}>
                        Delivery Fee ({estimatedDistance}km)
                      </span>
                    </div>
                    <span style={{ fontSize: '1.1rem', fontWeight: '600', color: theme.colors.text }}>₹{deliveryFee}</span>
                  </div>

                  {/* Final Total */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    borderTop: `1px dashed ${theme.colors.border}`,
                    paddingTop: '1rem',
                    marginTop: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: theme.colors.text }}>Total Amount:</span>
                    <span style={{ fontSize: '2rem', fontWeight: 'bold', color: theme.colors.success }}>
                      ₹{finalTotal}
                    </span>
                  </div>
                </div>

                <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <PremiumInput
                    type="text"
                    placeholder="Delivery Address"
                    label="Delivery Address"
                    icon="📍"
                    value={deliveryForm.address}
                    onChange={(e) => setDeliveryForm({...deliveryForm, address: e.target.value})}
                    required
                  />
                  <PremiumInput
                    type="tel"
                    placeholder="Phone Number"
                    label="Phone Number"
                    icon="📱"
                    value={deliveryForm.phone}
                    onChange={(e) => setDeliveryForm({...deliveryForm, phone: e.target.value})}
                    required
                  />

                  {/* Payment Method Selection */}
                  <div>
                    <label style={{ 
                      display: 'block', 
                      marginBottom: '0.75rem', 
                      color: theme.colors.text,
                      fontWeight: '600',
                      fontSize: '0.95rem'
                    }}>
                      Payment Method
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {/* Pay Now Option */}
                      <div
                        onClick={() => setPaymentMethod('online')}
                        style={{
                          border: `2px solid ${paymentMethod === 'online' ? theme.colors.primary : theme.colors.border}`,
                          background: paymentMethod === 'online' ? `${theme.colors.primary}10` : 'transparent',
                          borderRadius: '1rem',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textAlign: 'center'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>💳</span>
                        <span style={{ fontWeight: 'bold', color: theme.colors.text }}>Pay Now</span>
                        <span style={{ fontSize: '0.8rem', color: theme.colors.success }}>Hassle-free</span>
                      </div>

                      {/* Pay on Delivery Option */}
                      <div
                        onClick={() => setPaymentMethod('cod')}
                        style={{
                          border: `2px solid ${paymentMethod === 'cod' ? theme.colors.success : theme.colors.border}`,
                          background: paymentMethod === 'cod' ? `${theme.colors.success}10` : 'transparent',
                          borderRadius: '1rem',
                          padding: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          textAlign: 'center'
                        }}
                      >
                        <span style={{ fontSize: '1.5rem' }}>💵</span>
                        <span style={{ fontWeight: 'bold', color: theme.colors.text }}>Pay on Delivery</span>
                        <span style={{ fontSize: '0.8rem', color: theme.colors.textMuted }}>Cash/UPI</span>
                      </div>
                    </div>
                  </div>

                  <PremiumButton
                    type="submit"
                    variant="success"
                    fullWidth
                    size="lg"
                    loading={ordering}
                    icon="✅"
                  >
                    {ordering ? 'Placing Order...' : `Place Order - ₹${finalTotal}`}
                  </PremiumButton>
                </form>
              </div>
            </div>
          )}
          {showSuccess && (
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: theme.colors.gradient2,
              color: 'white',
              padding: '3rem 5rem',
              borderRadius: '2rem',
              boxShadow: `0 30px 80px ${theme.colors.success}60`,
              zIndex: 10001,
              textAlign: 'center',
              fontSize: '2rem',
              fontWeight: 'bold',
              animation: 'pulse 1s ease-in-out infinite'
            }}>
              ✅ Order Placed Successfully! 🎉
            </div>
          )}
          {/* Product Listings */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '2rem',
            position: 'relative',
            zIndex: 10
          }}>
            {filteredListings.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '5rem',
                background: theme.colors.bgCard,
                borderRadius: '2rem',
                border: `2px solid ${theme.colors.border}`
              }}>
                <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
                <p style={{ fontSize: '1.5rem', color: theme.colors.textMuted, marginBottom: '2rem' }}>
                  No products found matching your criteria
                </p>
                <PremiumButton 
                  variant="primary" 
                  onClick={() => {
                    setSearchTerm('');
                    setGradeFilter('all');
                    setSortBy('price-low');
                  }}
                  icon="↺"
                >
                  Clear All Filters
                </PremiumButton>
              </div>
            ) : (
              filteredListings.map((listing) => (
                <div 
                  key={listing.id}
                  style={{
                    background: theme.colors.bgCard,
                    backdropFilter: 'blur(30px)',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '2rem',
                    padding: '2rem',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                    e.currentTarget.style.boxShadow = `0 20px 50px ${theme.colors.primary}40`;
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: listing.grade === 'B' ? theme.colors.gradient3 : `linear-gradient(135deg, #fb923c, #f59e0b)`,
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '2rem',
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
                    zIndex: 1
                  }}>
                    Grade {listing.grade}
                  </div>
                  {listing.image && listing.image.startsWith('data:') ? (
                    <img 
                      src={listing.image} 
                      alt={listing.name} 
                      style={{
                        width: '100%',
                        height: '220px',
                        objectFit: 'cover',
                        borderRadius: '1rem',
                        marginBottom: '1.5rem',
                        transition: 'all 0.3s'
                      }}
                    />
                  ) : (
                    <div style={{ 
                      fontSize: '5.5rem', 
                      textAlign: 'center', 
                      marginBottom: '1.5rem',
                      transition: 'all 0.3s'
                    }}>
                      {listing.image || listing.icon || '🌾'}
                    </div>
                  )}
                  <h3 style={{ 
                    fontSize: '1.75rem', 
                    fontWeight: 'bold', 
                    marginBottom: '0.5rem',
                    color: theme.colors.text 
                  }}>
                    {listing.name}
                  </h3>
                  <p style={{ 
                    color: theme.colors.textMuted, 
                    fontSize: '1rem', 
                    marginBottom: '1rem',
                    lineHeight: 1.5 
                  }}>
                    {listing.description}
                  </p>
                  <p style={{ 
                    color: theme.colors.textMuted, 
                    fontSize: '1rem', 
                    marginBottom: '0.5rem'
                  }}>
                    📍 {listing.farmLocation}
                  </p>
                  <p style={{ 
                    color: theme.colors.textMuted, 
                    fontSize: '1.1rem', 
                    marginBottom: '1rem' 
                  }}>
                    📦 {listing.quantity} kg available
                  </p>
                  <p style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold', 
                    color: theme.colors.success,
                    marginBottom: '0.5rem'
                  }}>
                    ₹{listing.price}/kg
                  </p>
                  <p style={{ 
                    color: theme.colors.warning, 
                    fontSize: '1rem', 
                    marginBottom: '1.5rem',
                    fontWeight: '600'
                  }}>
                    💰 Save {listing.savings} vs retail
                  </p>
                  <PremiumButton 
                    variant="success" 
                    fullWidth 
                    onClick={() => addToCart(listing)}
                    icon="🛒"
                  >
                    Add to Cart
                  </PremiumButton>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ====== ORDERS VIEW ===== */}
      {view === 'orders' && (
        <div style={{ position: 'relative', zIndex: 10 }}>
          {}
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '2rem',
            color: theme.colors.text 
          }}>
            📦 My Orders ({orders.length})
          </h2>
          {orders.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '5rem',
              background: theme.colors.bgCard,
              backdropFilter: 'blur(30px)',
              borderRadius: '2rem',
              border: `2px solid ${theme.colors.border}`
            }}>
              <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>📦</div>
              <p style={{ fontSize: '1.5rem', color: theme.colors.textMuted }}>
                No orders yet. Start shopping!
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
              gap: '2rem'
            }}>
              {orders.map((order) => (
                <div 
                  key={order.id}
                  style={{
                    background: theme.colors.bgCard,
                    backdropFilter: 'blur(30px)',
                    border: `2px solid ${theme.colors.border}`,
                    borderRadius: '2rem',
                    padding: '2rem',
                    transition: 'all 0.4s'
                  }}>
                  {}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      background: order.status === 'pending' 
                        ? `${theme.colors.warning}20` 
                        : order.status === 'picked' 
                          ? `${theme.colors.primary}20` 
                          : `${theme.colors.success}20`,
                      border: `2px solid ${
                        order.status === 'pending' ? theme.colors.warning : 
                        order.status === 'picked' ? theme.colors.primary : 
                        theme.colors.success
                      }`,
                      color: order.status === 'pending' ? theme.colors.warning : 
                             order.status === 'picked' ? theme.colors.primary : 
                             theme.colors.success,
                      padding: '0.5rem 1rem',
                      borderRadius: '2rem',
                      fontSize: '0.9rem',
                      fontWeight: '700'
                    }}>
                      {order.status === 'pending' && '⏳ Pending'}
                      {order.status === 'picked' && '📦 Out for Delivery'}
                      {order.status === 'delivered' && '✅ Delivered'}
                    </div>
                    {order.deliveryVerified && (
                      <div style={{
                        display: 'inline-block',
                        background: theme.colors.gradient2,
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '2rem',
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        boxShadow: `0 4px 15px ${theme.colors.success}40`
                      }}>
                        ✅ Verified
                      </div>
                    )}
                  </div>
                  <h3 style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    marginBottom: '1rem',
                    color: theme.colors.text 
                  }}>
                    Order #{order.id.substring(0, 8)}
                  </h3>
                  {/* ... Items ... */}
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ color: theme.colors.textMuted, marginBottom: '0.5rem', fontWeight: '600' }}>Items:</p>
                    {order.items && order.items.slice(0, 3).map((item, i) => (
                      <p key={i} style={{ fontSize: '1rem', color: theme.colors.text, marginBottom: '0.25rem' }}>
                        • {item.name} ({item.cartQuantity}kg) - ₹{item.price * item.cartQuantity}
                      </p>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <p style={{ color: theme.colors.textMuted, fontStyle: 'italic' }}>
                        +{order.items.length - 3} more items
                      </p>
                    )}
                  </div>
                  {order.riderName && (
                    <p style={{ color: theme.colors.textMuted, marginBottom: '0.5rem' }}>
                      🚚 Rider: <strong style={{ color: theme.colors.text }}>{order.riderName}</strong>
                    </p>
                  )}
                  <div style={{
                    borderTop: `2px solid ${theme.colors.border}`,
                    paddingTop: '1rem',
                    marginTop: '1rem',
                    marginBottom: '1.5rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.5rem'
                    }}>
                      <span style={{ color: theme.colors.textMuted }}>Total Items:</span>
                      <span style={{ fontWeight: '600', color: theme.colors.text }}>{order.totalItems} kg</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: theme.colors.textMuted, fontWeight: '600' }}>Amount:</span>
                      <span style={{ 
                        fontSize: '1.5rem', 
                        fontWeight: '700', 
                        color: theme.colors.success
                      }}>
                        ₹{order.totalAmount}
                      </span>
                    </div>
                  </div>
                  {order.status === 'picked' && !order.deliveryVerified && (
                    <PremiumButton 
                      variant="primary"
                      fullWidth
                      onClick={() => handleVerifyDelivery(order)}
                      icon="📱"
                    >Verify & Confirm Delivery</PremiumButton>
                  )}
                  {order.deliveryVerified && (
                    <div style={{
                      textAlign: 'center',
                      padding: '1rem',
                      background: `${theme.colors.success}15`,
                      borderRadius: '1rem',
                      color: theme.colors.success,
                      fontWeight: '600',
                      border: `1px solid ${theme.colors.success}`
                    }}>
                      ✅ Delivery Confirmed
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {}
          <Route path="/" element={<BusinessLanding />} />
          <Route path="/login" element={<AuthPage isLogin={true} />} />
          <Route path="/register" element={<AuthPage isLogin={false} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
