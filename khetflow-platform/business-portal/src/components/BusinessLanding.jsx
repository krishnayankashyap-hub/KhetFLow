import { useNavigate } from 'react-router-dom';

export default function BusinessLanding() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center'
    }}>
      <div style={{ maxWidth: '800px' }}>
        {/* Logo */}
        <div style={{ 
          width: '120px', 
          height: '120px', 
          margin: '0 auto 2rem',
          background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
          borderRadius: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '4rem',
          boxShadow: '0 20px 60px rgba(59, 130, 246, 0.5)',
          animation: 'float 3s ease-in-out infinite'
        }}>
          🏪
        </div>

        {/* Title */}
        <h1 className="gradient-text" style={{ 
          fontSize: '4.5rem', 
          fontWeight: 'bold',
          marginBottom: '1rem'
        }}>
          KhetFlow Business
        </h1>

        <p style={{ 
          fontSize: '1.5rem', 
          color: '#d1d5db',
          marginBottom: '1rem'
        }}>
          From Surplus Stock to Business Profit
        </p>

        <p style={{ 
          fontSize: '1.125rem', 
          color: '#9ca3af',
          marginBottom: '3rem'
        }}>
          Access premium quality imperfect produce at wholesale prices
        </p>

        {/* Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '1.5rem', 
          justifyContent: 'center',
          marginBottom: '3rem'
        }}>
          <button
            onClick={() => navigate('/register')}
            className="btn-primary hover-scale"
          >
            🚀 Start Ordering
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="hover-scale"
            style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              padding: '1rem 2rem',
              borderRadius: '0.75rem',
              color: 'white',
              fontWeight: '600',
              fontSize: '1.1rem'
            }}
          >
            🔑 Login
          </button>
        </div>

        {/* Features */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '1.5rem',
          marginTop: '3rem'
        }}>
          {[
            { icon: '📱', title: 'QR Verified' },
            { icon: '🤝', title: 'Group Buy' },
            { icon: '🚚', title: 'Free Delivery' },
            { icon: '💳', title: 'Instant Pay' }
          ].map((feature, i) => (
            <div 
              key={i}
              className="glass-card-blue"
              style={{ padding: '1.5rem', textAlign: 'center' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                {feature.icon}
              </div>
              <div style={{ fontWeight: '600', color: '#60a5fa' }}>
                {feature.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
