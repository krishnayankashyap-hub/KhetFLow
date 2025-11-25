import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import QRScanner from './QRScanner';

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [cart, setCart] = useState([]);
  const [filters, setFilters] = useState({ category: 'all', maxPrice: 100 });
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const q = query(collection(db, 'listings'), where('status', '==', 'active'));
    const snapshot = await getDocs(q);
    setListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const addToCart = (listing) => {
    setCart([...cart, listing]);
    alert('✅ Added to cart!');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const filteredListings = listings.filter(l => 
    (filters.category === 'all' || l.category === filters.category) &&
    l.pricePerKg <= filters.maxPrice
  );

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <motion.div 
        className="glass-card-blue p-6 mb-6 flex justify-between items-center"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            🏪
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold">Business Dashboard</h1>
            <p className="text-gray-400">Welcome, {auth.currentUser?.email}</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            className="glass-card-blue px-6 py-2 rounded-lg hover:bg-blue-500/20 transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            onClick={() => setShowScanner(true)}
          >
            📱 Scan QR
          </motion.button>
          
          <motion.div className="relative">
            <motion.button
              className="glass-card-blue px-6 py-2 rounded-lg hover:bg-cyan-500/20 transition-all"
              whileHover={{ scale: 1.05 }}
              onClick={() => setActiveTab('cart')}
            >
              🛒 Cart {cart.length > 0 && `(${cart.length})`}
            </motion.button>
            {cart.length > 0 && (
              <motion.span 
                className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {cart.length}
              </motion.span>
            )}
          </motion.div>

          <motion.button
            className="glass-card-blue px-6 py-2 rounded-lg hover:bg-red-500/20 transition-all"
            whileHover={{ scale: 1.05 }}
            onClick={handleLogout}
          >
            🚪 Logout
          </motion.button>
        </div>
      </motion.div>

      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner onClose={() => setShowScanner(false)} />
        )}
      </AnimatePresence>

      {/* Tabs */}
      <motion.div 
        className="glass-card-blue p-2 mb-6 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {['marketplace', 'flash-sales', 'group-buy', 'orders', 'cart'].map((tab) => (
          <motion.button
            key={tab}
            className={`flex-1 py-3 rounded-lg font-semibold capitalize transition-all ${
              activeTab === tab ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50' : 'hover:bg-blue-500/20'
            }`}
            onClick={() => setActiveTab(tab)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {tab === 'marketplace' && '🛒 '} 
            {tab === 'flash-sales' && '⚡ '}
            {tab === 'group-buy' && '🤝 '}
            {tab === 'orders' && '📦 '}
            {tab === 'cart' && '🛍️ '}
            {tab.replace('-', ' ')}
          </motion.button>
        ))}
      </motion.div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'marketplace' && (
            <MarketplaceView 
              listings={filteredListings} 
              addToCart={addToCart}
              filters={filters}
              setFilters={setFilters}
            />
          )}
          {activeTab === 'flash-sales' && <FlashSalesView listings={listings.filter(l => l.isFlashSale)} addToCart={addToCart} />}
          {activeTab === 'group-buy' && <GroupBuyView />}
          {activeTab === 'orders' && <OrdersView />}
          {activeTab === 'cart' && <CartView cart={cart} setCart={setCart} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Marketplace View Component
function MarketplaceView({ listings, addToCart, filters, setFilters }) {
  return (
    <div>
      {/* Filters */}
      <motion.div 
        className="glass-card-blue p-6 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-bold mb-4 text-cyan-400">🔍 Filters</h3>
        <div className="grid grid-cols-4 gap-4">
          <select
            className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500"
            value={filters.category}
            onChange={(e) => setFilters({...filters, category: e.target.value})}
          >
            <option value="all">All Categories</option>
            <option value="vegetables">🥬 Vegetables</option>
            <option value="fruits">🍎 Fruits</option>
            <option value="grains">🌾 Grains</option>
            <option value="dairy">🥛 Dairy</option>
          </select>

          <div>
            <label className="text-sm text-gray-400 block mb-2">Max Price: ₹{filters.maxPrice}/kg</label>
            <input
              type="range"
              min="10"
              max="200"
              value={filters.maxPrice}
              onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
              className="w-full accent-cyan-500"
            />
          </div>

          <button className="bg-blue-500/20 hover:bg-blue-500/30 rounded-xl px-4 py-3 transition-all">
            📍 Near Me
          </button>

          <button className="bg-cyan-500/20 hover:bg-cyan-500/30 rounded-xl px-4 py-3 transition-all">
            ⭐ Top Rated
          </button>
        </div>
      </motion.div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.length === 0 ? (
          <motion.div 
            className="col-span-full glass-card-blue p-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl text-gray-400">No listings found. Try adjusting filters!</p>
          </motion.div>
        ) : (
          listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              className="glass-card-blue p-6 group relative overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05, y: -8 }}
            >
              {/* Animated Background Gradient */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ 
                  background: [
                    'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))',
                    'linear-gradient(225deg, rgba(6,182,212,0.1), rgba(59,130,246,0.1))',
                    'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))'
                  ]
                }}
                transition={{ duration: 3, repeat: Infinity }}
              />

              <div className="relative z-10">
                {listing.isFlashSale && (
                  <motion.div 
                    className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-3"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    ⚡ FLASH SALE
                  </motion.div>
                )}
                
                <motion.div 
                  className="text-5xl mb-4"
                  whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2 }}
                  transition={{ duration: 0.5 }}
                >
                  {listing.category === 'vegetables' ? '🥬' : 
                   listing.category === 'fruits' ? '🍎' : 
                   listing.category === 'dairy' ? '🥛' : '🌾'}
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-2 text-cyan-400">{listing.productName}</h3>
                
                <div className="text-gray-400 space-y-1 mb-4">
                  <p>📦 Available: {listing.quantity} kg</p>
                  <p className="text-2xl font-bold text-green-400">₹{listing.pricePerKg}/kg</p>
                  <p className="text-xs text-gray-500">🔖 QR: {listing.qrCode}</p>
                </div>
                
                {listing.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{listing.description}</p>
                )}

                <div className="flex gap-2">
                  <motion.button 
                    className="flex-1 btn-business py-2 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(listing)}
                  >
                    🛒 Add to Cart
                  </motion.button>
                  
                  <motion.button 
                    className="bg-cyan-500/20 hover:bg-cyan-500/30 px-4 rounded-lg transition-all"
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                  >
                    ℹ️
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Flash Sales View
function FlashSalesView({ listings, addToCart }) {
  return (
    <div>
      <motion.div 
        className="glass-card-blue p-8 mb-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.div 
          className="text-6xl mb-4"
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⚡
        </motion.div>
        <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
          Flash Sales
        </h2>
        <p className="text-gray-400">Limited time offers - expires in 24 hours!</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.length === 0 ? (
          <div className="col-span-full glass-card-blue p-12 text-center">
            <div className="text-6xl mb-4">⚡</div>
            <p className="text-xl text-gray-400">No flash sales active right now!</p>
          </div>
        ) : (
          listings.map((listing, index) => (
            <motion.div
              key={listing.id}
              className="glass-card-blue p-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
            >
              <div className="text-4xl mb-3">
                {listing.category === 'vegetables' ? '🥬' : '🍎'}
              </div>
              <h3 className="text-xl font-bold mb-2">{listing.productName}</h3>
              <p className="text-2xl font-bold text-orange-400 mb-4">₹{listing.pricePerKg}/kg</p>
              
              <motion.button
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 py-2 rounded-lg font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => addToCart(listing)}
              >
                ⚡ Grab Now
              </motion.button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// Group Buy View
function GroupBuyView() {
  return (
    <motion.div 
      className="glass-card-blue p-12 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div 
        className="text-6xl mb-4"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        🤝
      </motion.div>
      <h2 className="text-3xl font-bold mb-4">Group Buy Coming Soon!</h2>
      <p className="text-gray-400">Team up with other businesses to get bulk discounts</p>
    </motion.div>
  );
}

// Orders View
function OrdersView() {
  return (
    <motion.div 
      className="glass-card-blue p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-2xl font-bold mb-4">📦 Your Orders</h2>
      <p className="text-gray-400">Order history will appear here</p>
    </motion.div>
  );
}

// Cart View with Razorpay
function CartView({ cart, setCart }) {
  const total = cart.reduce((sum, item) => sum + (item.pricePerKg * (item.orderQty || 10)), 0);

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }
    
    // Razorpay integration i will in future
    alert(`Processing payment of ₹${total}...`);
  };

  return (
    <div>
      <motion.div 
        className="glass-card-blue p-8 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-cyan-400">🛍️ Your Cart</h2>

        {cart.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🛒</div>
            <p className="text-xl text-gray-400">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 mb-6">
              {cart.map((item, index) => (
                <motion.div
                  key={index}
                  className="bg-blue-500/10 p-4 rounded-xl flex justify-between items-center"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-3xl">
                      {item.category === 'vegetables' ? '🥬' : '🍎'}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{item.productName}</h3>
                      <p className="text-gray-400">₹{item.pricePerKg}/kg</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      defaultValue={10}
                      min={1}
                      className="w-20 bg-blue-500/20 border border-blue-500/30 rounded-lg px-3 py-2"
                      onChange={(e) => item.orderQty = parseInt(e.target.value)}
                    />
                    <span className="text-xl font-bold">₹{item.pricePerKg * (item.orderQty || 10)}</span>
                    <motion.button
                      className="text-red-400 hover:text-red-300"
                      whileHover={{ scale: 1.2 }}
                      onClick={() => setCart(cart.filter((_, i) => i !== index))}
                    >
                      🗑️
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="border-t border-blue-500/30 pt-6">
              <div className="flex justify-between items-center mb-6">
                <span className="text-2xl font-bold">Total:</span>
                <span className="text-3xl font-bold text-cyan-400">₹{total}</span>
              </div>

              <motion.button
                className="w-full btn-business py-4 text-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCheckout}
              >
                💳 Proceed to Payment
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
