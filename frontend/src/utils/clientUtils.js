// src/utils/clientUtils.js
// Contains constants and functions that rely on browser/client capabilities (like Geolocation)

/**
 * Calculates the distance between two geographical points using the Haversine formula (in km).
 * @param {number} lat1 Latitude of point 1.
 * @param {number} lon1 Longitude of point 1.
 * @param {number} lat2 Latitude of point 2.
 * @param {number} lon2 Longitude of point 2.
 * @returns {number} Distance in kilometers.
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// ============ AUTOMATIC GEOLOCATION (REQUIRED) ============
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('❌ Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage = '❌ Location access denied';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '❌ Please allow location access to report items. This prevents fraud.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '❌ Location information unavailable. Please check your GPS.';
            break;
          case error.TIMEOUT:
            errorMessage = '❌ Location request timed out. Please try again.';
            break;
          default:
            errorMessage = '❌ Location access error. Please try again.';
            break;
        }
        reject(new Error(errorMessage));
      },
      { 
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
};

// ============ REVERSE GEOCODING (GPS → ADDRESS) ============
export const reverseGeocode = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'FoundIT-LostFoundApp/1.0'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }
    
    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      
      const parts = [
        addr.road || addr.neighbourhood || addr.suburb || addr.hamlet,
        addr.city || addr.town || addr.village,
        addr.state || addr.state_district,
        addr.country
      ].filter(Boolean);
      
      return {
        formatted: parts.join(', '),
        short: `${addr.city || addr.town || addr.village || 'Unknown'}, ${addr.state || addr.country || ''}`,
        city: addr.city || addr.town || addr.village || 'Unknown',
        state: addr.state || addr.state_district || '',
        country: addr.country || '',
        postcode: addr.postcode || '',
        full: data.display_name,
        coordinates: {
          latitude,
          longitude
        }
      };
    }
    
    throw new Error('Address not found');
  } catch (err) {
    console.error('❌ Reverse geocoding error:', err);
    return {
      formatted: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      short: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
      city: 'Unknown',
      state: '',
      country: '',
      postcode: '',
      full: `Coordinates: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      coordinates: {
        latitude,
        longitude
      }
    };
  }
};

// ============ Match Filtering Constants (Used for UI) ============
export const MATCH_THRESHOLD = 65; 

// Reusing existing filter function (now filtering server-provided scores)
export const filterMatches = (matches) => {
  return matches
    .filter(match => match.matchScore >= MATCH_THRESHOLD)
    .sort((a, b) => b.matchScore - a.matchScore);
};

// NOTE: All logic for calculating scores is now on the server.