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
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 w-full max-w-md"
      >
        <motion.h2 
          className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent"
          layoutId="title"
        >
          {isLogin ? 'Welcome Back' : 'Join KhetFlow'}
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.input
            type="email"
            placeholder="Email"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            whileFocus={{ scale: 1.02 }}
            required
          />

          <motion.input
            type="password"
            placeholder="Password"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            whileFocus={{ scale: 1.02 }}
            required
          />

          <AnimatePresence mode="wait">
            {!isLogin && (
              <>
                <motion.input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  required={!isLogin}
                />
                
                <motion.input
                  type="text"
                  placeholder="Farm Location"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 transition-all"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  required={!isLogin}
                />
              </>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            className="w-full btn-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? '⏳ Processing...' : (isLogin ? '🔑 Login' : '🚀 Create Account')}
          </motion.button>
        </form>

        <motion.p 
          className="text-center mt-6 text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-400 hover:text-green-300 font-semibold"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
