import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';

export default function FarmerAuth({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        navigate('/dashboard');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        await setDoc(doc(db, 'farmers', userCredential.user.uid), {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          location: formData.location,
          verified: false,
          createdAt: new Date().toISOString()
        });
        
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ bottom: '10%', right: '10%' }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-gradient-to-br from-teal-500/20 to-green-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, -50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ top: '50%', right: '20%' }}
        />
      </div>

      {/* Main Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glow Effect Behind Card */}
        <motion.div
          className="absolute -inset-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-3xl blur-2xl opacity-20"
          animate={{
            opacity: [0.2, 0.4, 0.2],
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Glass Card */}
        <motion.div 
          className="relative glass-card p-10 backdrop-blur-2xl bg-white/5 border border-white/10"
          whileHover={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}
        >
          {/* Logo/Icon */}
          <motion.div 
            className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-green-500/50"
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ duration: 6, repeat: Infinity }}
          >
            <span className="text-4xl">🌾</span>
          </motion.div>

          {/* Title with Animated Gradient */}
          <motion.div className="text-center mb-8">
            <motion.h1 
              className="text-5xl font-bold mb-3 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0%', '100%', '0%']
              }}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              {isLogin ? 'Welcome Back' : 'Join KhetFlow'}
            </motion.h1>
            <motion.p 
              className="text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isLogin ? 'Login to continue your journey' : 'Start your farming success story'}
            </motion.p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -20 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <InputField
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    icon="👤"
                    required={!isLogin}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    isFocused={focusedField === 'name'}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              icon="📧"
              required
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'email'}
            />

            <InputField
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              icon="🔒"
              required
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              isFocused={focusedField === 'password'}
            />

            <AnimatePresence mode="wait">
              {!isLogin && (
                <>
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.05 }}
                  >
                    <InputField
                      type="tel"
                      placeholder="Phone Number"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      icon="📱"
                      required={!isLogin}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      isFocused={focusedField === 'phone'}
                    />
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    <InputField
                      type="text"
                      placeholder="Farm Location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      icon="📍"
                      required={!isLogin}
                      onFocus={() => setFocusedField('location')}
                      onBlur={() => setFocusedField(null)}
                      isFocused={focusedField === 'location'}
                    />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              className="w-full relative overflow-hidden group"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button Background with Gradient Animation */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-green-500 via-emerald-600 to-green-500 rounded-xl"
                animate={{
                  backgroundPosition: ['0%', '100%', '0%']
                }}
                transition={{ duration: 3, repeat: Infinity }}
                style={{ backgroundSize: '200% 100%' }}
              />
              
              {/* Shimmer Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                  x: ['-100%', '200%']
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Button Content */}
              <span className="relative z-10 flex items-center justify-center gap-2 py-4 text-white font-bold text-lg">
                {loading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.span>
                    Processing...
                  </>
                ) : (
                  <>
                    {isLogin ? '🔑 Login' : '🚀 Create Account'}
                  </>
                )}
              </span>
              
              {/* Glow Effect on Hover */}
              <motion.div 
                className="absolute inset-0 bg-green-400/0 group-hover:bg-green-400/20 rounded-xl transition-all duration-300"
              />
            </motion.button>

            {/* Forgot Password (for login only) */}
            {isLogin && (
              <motion.div 
                className="text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <button
                  type="button"
                  className="text-sm text-gray-400 hover:text-green-400 transition-colors"
                >
                  Forgot password?
                </button>
              </motion.div>
            )}
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </div>

          {/* Toggle Login/Signup */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-gray-400 mb-4">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
            </p>
            
            <motion.button
              onClick={() => setIsLogin(!isLogin)}
              className="relative group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10 px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/50 rounded-xl font-semibold text-green-400 transition-all duration-300 inline-block">
                {isLogin ? '✨ Sign Up' : '🔑 Login'}
              </span>
              
              {/* Glow on hover */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/20 to-green-500/0 rounded-xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity"
              />
            </motion.button>
          </motion.div>

          {/* Security Badge */}
          <motion.div 
            className="mt-8 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span className="text-green-400">🔐</span>
              <span>Secured by Firebase Authentication</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-green-400/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}


function InputField({ icon, type, placeholder, value, onChange, required, onFocus, onBlur, isFocused }) {
  return (
    <motion.div 
      className="relative group"
      animate={isFocused ? { scale: 1.02 } : { scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Glow Effect when focused */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-0 group-focus-within:opacity-30 transition-opacity"
      />
      
      {/* Input Container */}
      <div className="relative flex items-center">
        {/* Icon */}
        <motion.span 
          className="absolute left-4 text-2xl z-10"
          animate={isFocused ? { scale: 1.2, rotate: [0, -10, 10, 0] } : { scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          {icon}
        </motion.span>
        
        {/* Input Field */}
        <motion.input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onFocus={onFocus}
          onBlur={onBlur}
          className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl pl-14 pr-4 py-4 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 focus:bg-white/10 transition-all duration-300"
          whileFocus={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderColor: 'rgba(34, 197, 94, 0.5)'
          }}
        />

        {/* Animated border on focus */}
        {isFocused && (
          <motion.div
            className="absolute inset-0 rounded-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 border-2 border-green-500/50 rounded-xl"
              animate={{
                boxShadow: [
                  '0 0 0px rgba(34, 197, 94, 0.5)',
                  '0 0 20px rgba(34, 197, 94, 0.5)',
                  '0 0 0px rgba(34, 197, 94, 0.5)',
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
