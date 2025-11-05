import React from 'react';
import { motion } from 'framer-motion';
import { getImageFromLocal } from '../utils/imageStorage';

// Lucide icons as inline SVG
const MapPin = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
  </svg>
);

const Calendar = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const User = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const MessageCircle = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const Target = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const Clock = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ItemCard = ({ item, showMatch = false, onChat, onViewMatches }) => {
  // Use client-side storage to retrieve the base64 image data
  const imageUrl = item.imageId ? getImageFromLocal(item.imageId) : null;
  
  const getMatchColor = (score) => {
    if (score >= 70) return 'from-green-400 to-emerald-500';
    if (score >= 50) return 'from-yellow-400 to-orange-400';
    return 'from-orange-400 to-red-400';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      {/* Image Section */}
      {imageUrl && (
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          <img
            src={imageUrl}
            alt={item.itemName}
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Type Badge */}
          <div className="absolute top-3 left-3">
            <div className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              item.type === 'lost' 
                ? 'bg-red-500 text-white' 
                : 'bg-green-500 text-white'
            } shadow-lg backdrop-blur-sm`}>
              {item.type === 'lost' ? '🔴 LOST' : '🟢 FOUND'}
            </div>
          </div>

          {/* Match Score Badge */}
          {showMatch && item.matchScore !== undefined && (
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="absolute top-3 right-3"
            >
              <div className={`px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getMatchColor(item.matchScore)} shadow-lg`}>
                {item.matchScore}% Match
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-5">
        {/* Title */}
        <div className="mb-3">
          <h3 className="text-xl font-semibold text-gray-900 mb-1 line-clamp-1">
            {item.itemName}
          </h3>
          {!imageUrl && (
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
              item.type === 'lost' 
                ? 'bg-red-100 text-red-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {item.type === 'lost' ? '🔴 LOST' : '🟢 FOUND'}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Info Grid */}
        <div className="space-y-2.5 mb-4">
          {/* Location */}
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700 font-medium line-clamp-1">
              {item.location}
            </span>
          </div>

          {/* Date & Time */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-600">
                {item.time}
              </span>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-sm text-gray-600 line-clamp-1">
              {item.userName || item.userEmail}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {showMatch && onChat && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChat(item)}
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              Chat to Verify
            </motion.button>
          )}

          {!showMatch && onViewMatches && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onViewMatches(item)}
              className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors shadow-md ${
                item.matchCount > 0
                  ? 'bg-[#f4d471] text-gray-900 hover:bg-yellow-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Target className="w-5 h-5" />
              {item.matchCount > 0 
                ? `View ${item.matchCount} Match${item.matchCount !== 1 ? 'es' : ''}`
                : 'Find Matches'
              }
            </motion.button>
          )}
        </div>

        {/* Match Count Indicator */}
        {!showMatch && item.matchCount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-500"
          >
            <div className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span>{item.matchCount} potential match{item.matchCount !== 1 ? 'es' : ''} found</span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ItemCard;