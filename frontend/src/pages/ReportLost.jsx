import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// --- MODIFIED IMPORTS ---
import { apiDb } from '../services/api';
import { saveImageToLocal } from '../utils/imageStorage'; 
import { 
  getCurrentLocation, 
  reverseGeocode,
  MATCH_THRESHOLD, // Constant only for UI display
} from '../utils/clientUtils';
import { 
  generateDescriptionFromImage, 
  generateBasicDescription,
  autoFillFormFromDescription 
} from '../utils/aiImageAnalysis';
import { 
  validateWithGuidance,
  prepareSafeSubmission,
  getAlertMessage
} from '../utils/documentProtection';
import { motion } from 'framer-motion';
import { MapPin, Upload, Sparkles, ArrowRight, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ReportLost = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    itemName: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  
  const [locationLoading, setLocationLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAddress, setLocationAddress] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiDescription, setAiDescription] = useState(null);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);
  
  // Document protection states
  const [dataAlert, setDataAlert] = useState(null);
  const [showDataAlert, setShowDataAlert] = useState(false);
  
  // Fetch user data and initial location
  useEffect(() => {
    const initializeData = async () => {
      try {
        // --- API Call: Get User Profile ---
        const profile = await apiDb.getUserProfile();
        setUserData(profile);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
      
      try {
        setLocationLoading(true);
        setLocationError(null);
        
        const coords = await getCurrentLocation();
        setUserLocation(coords);
        
        const address = await reverseGeocode(coords.latitude, coords.longitude);
        setLocationAddress(address);
        
        setLocationLoading(false);
      } catch (err) {
        setLocationError(err.message);
        setLocationLoading(false);
      }
    };
    
    initializeData();
  }, [user]);
  
  // Logic to handle image upload and AI analysis
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      alert('⚠️ Image size should be less than 5MB');
      return;
    }
    
    setImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
    
    setAiAnalyzing(true);
    try {
      let aiResult = await generateDescriptionFromImage(file);
      
      if (!aiResult.success) {
        aiResult = await generateBasicDescription(file);
      }
      
      setAiDescription(aiResult);
      setShowAiSuggestion(true);
      
      if (aiResult.success) {
        alert(
          '🤖 AI Analysis Complete!\n\n' +
          'The AI has analyzed your image and generated a detailed description.\n\n' +
          'Click "Use AI Description" to auto-fill the form!'
        );
      }
      
    } catch (error) {
      console.error('❌ AI Analysis Error:', error);
    } finally {
      setAiAnalyzing(false);
    }
  };
  
  const applyAiDescription = () => {
    if (!aiDescription || !aiDescription.success) return;
    
    const autoFilled = autoFillFormFromDescription(aiDescription);
    if (autoFilled) {
      setFormData({
        ...formData,
        itemName: autoFilled.itemName,
        description: autoFilled.description
      });
      setShowAiSuggestion(false);
      alert('✅ Form auto-filled with AI description! You can edit it if needed.');
    }
  };
  
  const retryLocation = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      const coords = await getCurrentLocation();
      setUserLocation(coords);
      
      const address = await reverseGeocode(coords.latitude, coords.longitude);
      setLocationAddress(address);
      
      setLocationLoading(false);
      alert('✅ Location access granted!');
    } catch (err) {
      setLocationError(err.message);
      setLocationLoading(false);
    }
  };
  
  // Check for sensitive data when form changes
  useEffect(() => {
    const validation = validateWithGuidance(
      formData.itemName,
      formData.description,
      aiDescription
    );
    
    const alert = getAlertMessage(validation);
    setDataAlert({ ...alert, validation });
    setShowDataAlert(alert.canProceed);
  }, [formData.itemName, formData.description, aiDescription]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userLocation) {
      alert('❌ LOCATION REQUIRED! Please allow location access to report items.');
      return;
    }
    
    // Check if description is missing and prompt AI fill
    if (!formData.description.trim()) {
      if (aiDescription && aiDescription.success) {
        const useAi = window.confirm(
          '📝 Description is empty! The AI has generated one. Use it?'
        );
        if (useAi) {
          applyAiDescription();
          return;
        }
      } else {
         alert('❌ Please provide a detailed description of the item.');
         return;
      }
    }
    
    setLoading(true);
    
    try {
      if (!user || !user.uid) {
        throw new Error('You must be logged in to report items');
      }
      
      const safeData = prepareSafeSubmission(
        formData.itemName,
        formData.description,
        aiDescription,
        true
      );
      
      let imageId = null;
      let imageData = null;
      
      // Save image locally (to maintain UI consistency) and get base64 data to send to server
      if (image) {
        try {
          const result = await saveImageToLocal(image);
          imageId = result.imageId;
          imageData = result.imageData; // Base64 string for server analysis
        } catch (imgError) {
          console.error('⚠️ Image save error:', imgError);
          alert('⚠️ Warning: Image could not be saved locally. Continuing...');
        }
      }
      
      const itemData = {
        itemName: safeData.itemName,
        description: safeData.description,
        location: locationAddress?.formatted || `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`,
        locationShort: locationAddress?.short || 'Unknown',
        date: formData.date,
        time: formData.time,
        type: 'lost',
        imageId, 
        imageData, 
        // Server will set userId, userEmail, userName from JWT
        actualLocation: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          accuracy: userLocation.accuracy,
          timestamp: userLocation.timestamp
        },
        addressDetails: locationAddress || null,
        aiGenerated: aiDescription?.success || false,
        aiAnalysis: aiDescription?.structured || null,
        dataRedacted: safeData.wasRedacted,
        sensitivityLevel: safeData.sensitivityLevel
      };
      
      console.log('📦 Submitting item data and triggering server-side matching...');
      
      // --- API Call: Submit item and retrieve matches from server ---
      const response = await apiDb.addItem(itemData);
      
      const finalMatches = response.matches || [];
      
      const alertMsg = finalMatches.length > 0
        ? `✅ Lost item reported successfully!\n\n🎯 AI found ${finalMatches.length} high-confidence match${finalMatches.length !== 1 ? 'es' : ''} (${MATCH_THRESHOLD}%+ similarity)!\n\nView matches now?`
        : `✅ Lost item reported successfully!\n\n📍 Location: ${locationAddress?.short || 'Recorded'}\n\nNo matches found yet. We'll notify you if someone reports a matching found item.`;
      
      const viewMatches = finalMatches.length > 0 && window.confirm(alertMsg);
      
      if (viewMatches) {
        // Use MongoDB _id for item ID
        navigate('/matches', { state: { item: { ...response.item, id: response.item._id }, matches: finalMatches } });
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('❌ Error submitting report:', err);
      alert('❌ Error: ' + (err.message || 'Network Error'));
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };
  
  return (
    <div className="min-h-screen bg-[#e8e5dc]">
      {/* Navigation */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-xl shadow-lg"
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                <ArrowRight className="w-5 h-5 text-[#f4d471] rotate-180" />
              </div>
              <span className="text-xl font-semibold text-gray-900">Back</span>
            </motion.button>
            
            <h1 className="text-2xl font-semibold text-gray-900">Report Lost Item</h1>
            
            <div className="w-10" />
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#f4d471] rounded-full mb-6"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">AI-Assisted Reporting</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-4 leading-tight">
              Report Your <span className="font-semibold">Lost Item</span>
            </h2>
            
            <p className="text-lg text-gray-600 font-light">
              Let AI help you find your belongings faster with intelligent matching
            </p>
          </motion.div>

          {/* Data Protection Alert */}
          {showDataAlert && dataAlert && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-8 rounded-2xl p-6 shadow-lg border-2 ${
                dataAlert.color === 'yellow' 
                  ? 'bg-yellow-50 border-yellow-300' 
                  : dataAlert.color === 'blue'
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-green-50 border-green-300'
              }`}
            >
              <div className="flex items-start gap-4">
                {dataAlert.color === 'yellow' ? (
                  <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                ) : dataAlert.color === 'blue' ? (
                  <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                ) : (
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1">
                  <p className={`font-semibold mb-2 ${
                    dataAlert.color === 'yellow' 
                      ? 'text-yellow-900' 
                      : dataAlert.color === 'blue'
                      ? 'text-blue-900'
                      : 'text-green-900'
                  }`}>
                    {dataAlert.title}
                  </p>
                  <p className={`text-sm whitespace-pre-line ${
                    dataAlert.color === 'yellow' 
                      ? 'text-yellow-800' 
                      : dataAlert.color === 'blue'
                      ? 'text-blue-800'
                      : 'text-green-800'
                  }`}>
                    {dataAlert.message}
                  </p>
                  {dataAlert.note && (
                    <p className={`text-xs mt-2 font-medium ${
                      dataAlert.color === 'yellow' 
                        ? 'text-yellow-700' 
                        : dataAlert.color === 'blue'
                        ? 'text-blue-700'
                        : 'text-green-700'
                    }`}>
                      {dataAlert.note}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Location Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            {locationLoading && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                  <div>
                    <p className="text-gray-900 font-semibold">Accessing your location...</p>
                    <p className="text-gray-600 text-sm">Please allow location access when prompted</p>
                  </div>
                </div>
              </div>
            )}
            
            {locationError && (
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">Location Access Required</p>
                <p className="text-gray-600 text-sm mb-4">{locationError}</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={retryLocation}
                  className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition font-medium text-sm"
                >
                  Allow Location Access
                </motion.button>
              </div>
            )}
            
            {userLocation && locationAddress && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-gradient-to-r from-[#f4d471] to-yellow-300 rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <MapPin className="w-6 h-6 text-gray-900 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-gray-900 font-semibold">Location Verified</p>
                    <p className="text-gray-800 text-sm mt-1">{locationAddress.formatted}</p>
                    <p className="text-gray-700 text-xs mt-2">Accuracy: ±{userLocation.accuracy.toFixed(0)}m</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* AI Analysis Section */}
          {aiAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-center gap-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
                <div>
                  <p className="text-gray-900 font-semibold">AI is analyzing your image...</p>
                  <p className="text-gray-600 text-sm">Identifying item details from photo</p>
                </div>
              </div>
            </motion.div>
          )}
          
          {showAiSuggestion && aiDescription && aiDescription.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 bg-white rounded-2xl p-6 shadow-lg border border-gray-200"
            >
              <div className="flex items-start justify-between mb-4">
                <p className="text-gray-900 font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Analysis Complete
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setShowAiSuggestion(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </motion.button>
              </div>
              
              {aiDescription.structured && (
                <div className="bg-gray-50 p-4 rounded-xl mb-4 text-sm border border-gray-200">
                  <p className="text-gray-900 font-semibold mb-3">Detected Details:</p>
                  <div className="space-y-2">
                    {aiDescription.structured.itemType !== 'Unknown' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Type:</span>
                        <span>{aiDescription.structured.itemType}</span>
                      </div>
                    )}
                    {aiDescription.structured.brand !== 'Unknown' && aiDescription.structured.brand !== 'N/A' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Brand:</span>
                        <span>{aiDescription.structured.brand}</span>
                      </div>
                    )}
                    {aiDescription.structured.colors !== 'Unknown' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Colors:</span>
                        <span>{aiDescription.structured.colors}</span>
                      </div>
                    )}
                    {aiDescription.structured.material !== 'Unknown' && (
                      <div className="flex justify-between text-gray-700">
                        <span className="font-medium">Material:</span>
                        <span>{aiDescription.structured.material}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={applyAiDescription}
                className="w-full bg-gray-900 text-white py-3 rounded-xl hover:bg-gray-800 font-semibold transition shadow-md"
              >
                Use AI Description
              </motion.button>
              <p className="text-xs text-gray-600 mt-3 text-center">
                Or write your own description below
              </p>
            </motion.div>
          )}

          {/* Main Form */}
          <motion.form
            onSubmit={handleSubmit}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 space-y-6"
          >
            {/* Item Name */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Item Name <span className="text-gray-500 font-normal text-xs">(Be specific)</span>
              </label>
              <input
                type="text"
                placeholder="e.g., iPhone 15 Pro, Black Leather Wallet, Blue Backpack"
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
                required
                disabled={!userLocation}
              />
            </motion.div>

            {/* Description */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Detailed Description
                {aiDescription && aiDescription.success && (
                  <span className="text-xs text-gray-600 font-normal ml-2">(AI-assisted)</span>
                )}
              </label>
              <textarea
                placeholder="If you have a photo, AI can generate this! Or describe: brand, model, color, unique features, etc. Note: Personal numbers will be masked for privacy."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-xl h-36 focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition resize-none"
                required
                disabled={!userLocation}
              />
              <p className="text-xs text-gray-600 mt-2">
                Pro Tip: Upload a photo and let AI generate the description automatically
              </p>
            </motion.div>

            {/* Date and Time */}
            <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Date Lost</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  disabled={!userLocation}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Time Lost</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition"
                  required
                  disabled={!userLocation}
                />
              </div>
            </motion.div>

            {/* Image Upload */}
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Upload Image <span className="text-gray-500 font-normal text-xs">(Optional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full p-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-900 file:text-white hover:file:bg-gray-800 transition"
                disabled={!userLocation}
              />
              <p className="text-xs text-gray-600 mt-1">
                Upload a photo and AI will analyze it to generate a detailed description
              </p>
              
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-4 relative"
                >
                  <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover rounded-xl border border-gray-300 shadow-md" />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    type="button"
                    onClick={() => { 
                      setImage(null); 
                      setImagePreview(null);
                      setAiDescription(null);
                      setShowAiSuggestion(false);
                    }}
                    className="absolute top-3 right-3 bg-gray-900 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800 shadow-lg transition font-bold text-lg"
                  >
                    ×
                  </motion.button>
                  {aiDescription && aiDescription.success && (
                    <div className="absolute bottom-3 left-3 bg-gray-900 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      AI Analyzed
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>

            {/* Info Box */}
            <motion.div
              variants={itemVariants}
              className="bg-gray-50 border-l-4 border-gray-900 p-6 rounded-xl"
            >
              <p className="text-sm text-gray-900 font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                How AI-Powered Matching Works
              </p>
              <ul className="text-xs text-gray-700 space-y-2">
                <li className="flex items-start gap-3">
                  <span className="font-bold text-gray-900 min-w-fit">1.</span>
                  <span>Optional AI Analysis: Upload photo to auto-generate description</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-gray-900 min-w-fit">2.</span>
                  <span>Location First: Only matches items within 50km</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-gray-900 min-w-fit">3.</span>
                  <span>Smart Description: Understands colors, brands, and features</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-bold text-gray-900 min-w-fit">4.</span>
                  <span>High Confidence Only: Shows matches above {MATCH_THRESHOLD}% similarity</span>
                </li>
              </ul>
            </motion.div>

            {/* Submit Button */}
            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading || !userLocation}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-4 rounded-xl hover:from-gray-800 hover:to-gray-700 font-semibold text-lg transition-all shadow-lg disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transform"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></span>
                  <span>AI Matching in Progress...</span>
                </span>
              ) : !userLocation ? (
                'Waiting for Location Access...'
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Upload className="w-5 h-5" />
                  Submit and Run AI Match
                </span>
              )}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default ReportLost;