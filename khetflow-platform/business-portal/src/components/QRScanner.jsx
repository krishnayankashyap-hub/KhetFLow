import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import QrScanner from 'qr-scanner';

export default function QRScanner({ onClose }) {
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const [scannedResult, setScannedResult] = useState('');
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    if (videoRef.current && !scannerRef.current) {
      scannerRef.current = new QrScanner(
        videoRef.current,
        (result) => {
          setScannedResult(result.data);
          verifyProduct(result.data);
        },
        {
          preferredCamera: 'environment',
          highlightScanRegion: true,
          highlightCodeOutline: true,
        }
      );

      scannerRef.current.start();
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  const verifyProduct = async (qrCode) => {
    
    setTimeout(() => {
      setVerificationStatus({
        verified: true,
        product: 'Fresh Tomatoes',
        quality: 'Grade A',
        farmer: 'Ramesh Kumar',
        location: 'Guwahati, Assam'
      });
    }, 1000);
  };

  return (
    <motion.div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="glass-card-blue p-8 max-w-2xl w-full"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-500 bg-clip-text text-transparent">
            📱 Scan QR Code
          </h2>
          <motion.button
            className="text-3xl hover:text-red-400 transition-colors"
            whileHover={{ scale: 1.2, rotate: 90 }}
            onClick={onClose}
          >
            ✕
          </motion.button>
        </div>

        {/* Video Scanner */}
        <div className="relative mb-6 rounded-2xl overflow-hidden">
          <video 
            ref={videoRef} 
            className="w-full h-96 object-cover"
          />
          
          {/* Scanning Overlay */}
          <motion.div 
            className="absolute inset-0 border-4 border-cyan-400"
            animate={{ 
              boxShadow: [
                '0 0 0px rgba(6,182,212,0.5)',
                '0 0 30px rgba(6,182,212,0.8)',
                '0 0 0px rgba(6,182,212,0.5)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* Scan Line Animation */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />
        </div>

        {/* Scanned Result */}
        {scannedResult && (
          <motion.div
            className="bg-green-500/20 border border-green-500/50 rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div 
                className="text-4xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                ✅
              </motion.div>
              <h3 className="text-2xl font-bold text-green-400">QR Code Verified!</h3>
            </div>

            {verificationStatus && (
              <div className="space-y-2 text-gray-300">
                <p><strong>🥬 Product:</strong> {verificationStatus.product}</p>
                <p><strong>⭐ Quality:</strong> {verificationStatus.quality}</p>
                <p><strong>👨‍🌾 Farmer:</strong> {verificationStatus.farmer}</p>
                <p><strong>📍 Location:</strong> {verificationStatus.location}</p>
                <p className="text-xs text-gray-500 mt-4">QR Code: {scannedResult}</p>
              </div>
            )}

            <motion.button
              className="w-full btn-business mt-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
            >
              👍 Looks Good!
            </motion.button>
          </motion.div>
        )}

        <p className="text-center text-gray-400 text-sm mt-4">
          Position the QR code within the frame to scan
        </p>
      </motion.div>
    </motion.div>
  );
}
