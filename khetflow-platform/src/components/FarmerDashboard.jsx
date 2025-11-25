import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, activeListing: 0, earnings: 0 });
  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();

useEffect(() => {
  fetchListings();
  fetchStats();
  fetchOrders(); 
}, []);

const fetchOrders = async () => {
  const q = query(collection(db, 'orders'), where('farmerId', '==', auth.currentUser.uid));
  const snapshot = await getDocs(q);
  setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
};


  const fetchStats = async () => {
    // Fetch real stats from Firestore
    setStats({ totalSales: 45, activeListing: 8, earnings: 12500 });
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div 
        className="glass-card p-6 mb-6 flex justify-between items-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center text-3xl">
            🌾
          </div>
          <div>
            <h1 className="text-2xl font-bold">Farmer Dashboard</h1>
            <p className="text-gray-400">Welcome back, {auth.currentUser?.email}</p>
          </div>
        </div>
        
        <motion.button
          className="glass-card px-6 py-2 rounded-lg hover:bg-red-500/20 transition-all"
          whileHover={{ scale: 1.05 }}
          onClick={handleLogout}
        >
          🚪 Logout
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {[
          { icon: '💰', label: 'Total Earnings', value: `₹${stats.earnings}`, color: 'from-green-500 to-emerald-600' },
          { icon: '📦', label: 'Active Listings', value: stats.activeListing, color: 'from-blue-500 to-cyan-600' },
          { icon: '📈', label: 'Total Sales', value: stats.totalSales, color: 'from-purple-500 to-pink-600' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            className="glass-card p-6 relative overflow-hidden group"
            whileHover={{ scale: 1.05, y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
            <div className="text-5xl mb-4">{stat.icon}</div>
            <div className="text-4xl font-bold mb-2">{stat.value}</div>
            <div className="text-gray-400">{stat.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div 
        className="glass-card p-2 mb-6 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        {['overview', 'listings', 'add-new', 'orders'].map((tab) => (
          <motion.button
            key={tab}
            className={`flex-1 py-3 rounded-lg font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-green-500 text-white' : 'hover:bg-white/10'
            }`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {tab.replace('-', ' ')}
          </motion.button>
        ))}
      </motion.div>

      {/* Content Area */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'add-new' && <AddListingForm fetchListings={fetchListings} />}
        {activeTab === 'listings' && <ListingsView listings={listings} />}
        {activeTab === 'overview' && <OverviewView />}
        {activeTab === 'orders' && <OrdersView orders={orders} />}

      </motion.div>
    </div>
  );
}

// Add Listing Form Component
function AddListingForm({ fetchListings }) {
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    pricePerKg: '',
    category: 'vegetables',
    isFlashSale: false,
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await addDoc(collection(db, 'listings'), {
        ...formData,
        farmerId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        status: 'active',
        qrCode: `KHET-${Date.now()}`
      });
      
      alert('✅ Listing added successfully!');
      fetchListings();
      setFormData({ productName: '', quantity: '', pricePerKg: '', category: 'vegetables', isFlashSale: false, description: '' });
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="glass-card p-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
        Add New Listing
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Product Name (e.g., Tomatoes)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
            value={formData.productName}
            onChange={(e) => setFormData({...formData, productName: e.target.value})}
            required
          />
          
          <select
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
          >
            <option value="vegetables">🥬 Vegetables</option>
            <option value="fruits">🍎 Fruits</option>
            <option value="grains">🌾 Grains</option>
            <option value="dairy">🥛 Dairy</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Quantity (in kg)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            required
          />
          
          <input
            type="number"
            placeholder="Price per kg (₹)"
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500"
            value={formData.pricePerKg}
            onChange={(e) => setFormData({...formData, pricePerKg: e.target.value})}
            required
          />
        </div>

        <textarea
          placeholder="Description (optional)"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 h-24"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
        ></textarea>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.isFlashSale}
            onChange={(e) => setFormData({...formData, isFlashSale: e.target.checked})}
            className="w-5 h-5 rounded"
          />
          <span className="text-lg">⚡ Mark as Flash Sale (24hr expiry)</span>
        </label>

        <motion.button
          type="submit"
          className="w-full btn-primary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? '⏳ Adding...' : '🚀 Add Listing'}
        </motion.button>
      </form>
    </motion.div>
  );
}

// Listings View Component
function ListingsView({ listings }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {listings.length === 0 ? (
        <motion.div 
          className="col-span-full glass-card p-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl text-gray-400">No listings yet. Add your first product!</p>
        </motion.div>
      ) : (
        listings.map((listing, index) => (
          <motion.div
            key={listing.id}
            className="glass-card p-6 group hover:shadow-2xl hover:shadow-green-500/20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            {listing.isFlashSale && (
              <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-3">
                ⚡ FLASH SALE
              </div>
            )}
            
            <div className="text-4xl mb-4">
              {listing.category === 'vegetables' ? '🥬' : listing.category === 'fruits' ? '🍎' : '🌾'}
            </div>
            
            <h3 className="text-2xl font-bold mb-2">{listing.productName}</h3>
            <div className="text-gray-400 space-y-1 mb-4">
              <p>📦 Quantity: {listing.quantity} kg</p>
              <p>💰 Price: ₹{listing.pricePerKg}/kg</p>
              <p className="text-xs">🔖 QR: {listing.qrCode}</p>
            </div>
            
            <div className="flex gap-2">
              <motion.button 
                className="flex-1 bg-green-500/20 hover:bg-green-500/30 py-2 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
              >
                📝 Edit
              </motion.button>
              <motion.button 
                className="flex-1 bg-red-500/20 hover:bg-red-500/30 py-2 rounded-lg transition-all"
                whileHover={{ scale: 1.05 }}
              >
                🗑️ Delete
              </motion.button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
}

// Overview & Orders views (simplified)
function OverviewView() {
  return (
    <div className="glass-card p-8">
      <h2 className="text-2xl font-bold mb-4">📊 Quick Overview</h2>
      <p className="text-gray-400">Your performance metrics and insights will appear here.</p>
    </div>
  );
}

function OrdersView() {
  return (
    <div className="glass-card p-8">
      <h2 className="text-2xl font-bold mb-4">📦 Recent Orders</h2>
      <p className="text-gray-400">Orders from businesses will appear here.</p>
    </div>
  );
}
