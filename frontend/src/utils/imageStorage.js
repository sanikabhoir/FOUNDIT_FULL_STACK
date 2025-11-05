// src/utils/imageStorage.js
// Handles saving/retrieving base64 image strings using localStorage, 
// primarily for fast display on the client.

// Save image to localStorage
export const saveImageToLocal = (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageData = reader.result;
      const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      try {
        localStorage.setItem(imageId, imageData);
        // Returns the ID generated on the client and the base64 data
        resolve({ imageId, imageData }); 
      } catch (error) {
        reject(new Error('Failed to save image. Storage might be full.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(imageFile);
  });
};

// Get image from localStorage
export const getImageFromLocal = (imageId) => {
  if (!imageId) return null;
  try {
    return localStorage.getItem(imageId);
  } catch (error) {
    console.error('Error retrieving image:', error);
    return null;
  }
};

// Delete image from localStorage
export const deleteImageFromLocal = (imageId) => {
  if (imageId) {
    try {
      localStorage.removeItem(imageId);
    } catch (error) {
      console.error('Error deleting image:', error);
    }
  }
};