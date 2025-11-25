import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function FarmerLanding() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center max-w-4xl"
      >
        {/* Floating Logo */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="mb-8"
        >
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-green-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <span className="text-6xl">🌾</span>
          </div>
        </motion.div>

        {/* Title with Gradient */}
        <motion.h1 
          className="text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent"
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          KhetFlow
        </motion.h1>

        <motion.p 
          className="text-2xl text-gray-300 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          From Food Waste to Farmer Wealth
        </motion.p>

        <motion.p 
          className="text-lg text-gray-400 mb-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          Turn your imperfect produce into instant income
        </motion.p>

        {/* Animated Stats */}
        <motion.div 
          className="grid grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          {[
            { label: "Income Increase", value: "20-30%" },
            { label: "Instant Payout", value: "< 24hrs" },
            { label: "Zero Waste", value: "100%" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="glass-card p-6"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="text-4xl font-bold text-green-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-300">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div 
          className="flex gap-6 justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <motion.button
            className="btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/register')}
          >
            Get Started 🚀
          </motion.button>
          
          <motion.button
            className="glass-card px-8 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/login')}
          >
            Login
          </motion.button>
        </motion.div>

        {/* Features Floating Icons */}
        <motion.div 
          className="mt-16 flex justify-center gap-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {['📦 QR Verified', '⚡ Flash Sales', '💰 Instant Pay', '🚚 Free Pickup'].map((feature, i) => (
            <motion.div
              key={i}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
              className="text-center"
            >
              <div className="text-3xl mb-2">{feature.split(' ')[0]}</div>
              <div className="text-xs text-gray-400">{feature.split(' ').slice(1).join(' ')}</div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
