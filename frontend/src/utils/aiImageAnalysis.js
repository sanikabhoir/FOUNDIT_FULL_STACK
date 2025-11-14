// ============ COMPLETE FIXED AI IMAGE DESCRIPTION GENERATOR ============
// File: frontend/src/utils/aiImageAnalysis.js
// Strategy: Use your centralized API service (api.js) to call backend

// Convert image to base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
  });
};

// ============ METHOD 1: USE BACKEND API VIA YOUR API SERVICE ============
const analyzeWithBackend = async (imageFile, apiDbService) => {
  try {
    console.log('🤖 Analyzing with backend Gemini API...');
    console.log('📁 Image file:', imageFile.name, 'Type:', imageFile.type, 'Size:', imageFile.size);
    
    const base64Image = await fileToBase64(imageFile);
    const mimeType = imageFile.type || 'image/jpeg';
    
    console.log('📡 Calling backend analyzeImage API...');
    
    // Use the API service method (added to api.js)
    const result = await apiDbService.analyzeImage({
      base64Image,
      mimeType
    });
    
    console.log('✅ Backend result:', result);
    
    if (result.success !== false) {
      console.log('✅ Backend analysis successful!');
      return result;
    } else {
      throw new Error(result.naturalDescription || 'Backend analysis failed');
    }
    
  } catch (error) {
    console.error('❌ Backend analysis failed:', error.message);
    throw error;
  }
};

// ============ METHOD 2: IMPROVED CLIENT-SIDE FALLBACK ============
const analyzeWithImprovedFallback = async (imageFile) => {
  try {
    console.log('🤖 Using improved client-side analysis...');
    
    const img = await loadImageElement(imageFile);
    const colors = await analyzeColors(img);
    const aspectRatio = img.width / img.height;
    
    // More conservative item detection - don't make wild guesses
    let hints = '';
    
    // Basic shape-based hints (conservative)
    if (aspectRatio > 0.35 && aspectRatio < 0.65) {
      hints = 'Rectangular shape detected. Common items: phone, wallet, small electronics, card holder, book';
    } else if (aspectRatio > 0.8 && aspectRatio < 1.2) {
      hints = 'Square/compact shape detected. Common items: wallet, jewelry box, square bag, folded item';
    } else if (aspectRatio > 1.5) {
      hints = 'Long/horizontal shape detected. Common items: pen, umbrella, scarf, tie, belt';
    } else if (aspectRatio < 0.35) {
      hints = 'Tall/vertical shape detected. Common items: bottle, thermos, umbrella, long item';
    } else {
      hints = 'Item detected. Please specify what type of item this is.';
    }
    
    return {
      structured: {
        itemType: 'Unknown item',
        colors: colors.join(', ') || 'See image',
        brand: 'Please specify if visible',
        material: 'Please specify',
        condition: 'Please specify',
        features: 'Please add any unique features'
      },
      naturalDescription: `Image uploaded successfully.\n\nDetected colors: ${colors.join(', ')}\nShape hint: ${hints}\n\n⚠️ AI analysis unavailable. Please help by providing:\n• What is this item? (water bottle, phone, wallet, bag, keys, etc.)\n• Brand name if visible\n• Material (plastic, metal, leather, fabric, etc.)\n• Any damage, scratches, or unique markings\n• Any text, logos, or engravings visible`,
      success: false,
      method: 'basic-fallback',
      requiresManualInput: true
    };
    
  } catch (error) {
    console.error('❌ Client-side analysis failed:', error.message);
    throw error;
  }
};

// ============ HELPER FUNCTIONS ============

const loadImageElement = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
};

const analyzeColors = async (img) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  const size = 150;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  
  const colorMap = {};
  
  for (let i = 0; i < pixels.length; i += 16) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];
    
    if (a < 128) continue;
    
    const brightness = (r + g + b) / 3;
    if (brightness < 20 || brightness > 235) continue;
    
    // Quantize colors
    const qr = Math.round(r / 30) * 30;
    const qg = Math.round(g / 30) * 30;
    const qb = Math.round(b / 30) * 30;
    
    const key = `${qr},${qg},${qb}`;
    colorMap[key] = (colorMap[key] || 0) + 1;
  }
  
  return Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([rgb]) => {
      const [r, g, b] = rgb.split(',').map(Number);
      return getColorName(r, g, b);
    })
    .filter((c, i, arr) => arr.indexOf(c) === i);
};

const getColorName = (r, g, b) => {
  const brightness = (r + g + b) / 3;
  
  if (brightness < 40) return 'black';
  if (brightness > 200) return 'white';
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  
  if (saturation < 0.15) {
    if (brightness < 80) return 'dark gray';
    if (brightness < 150) return 'gray';
    return 'light gray';
  }
  
  let hue = 0;
  if (max === r) hue = ((g - b) / (max - min)) % 6;
  else if (max === g) hue = (b - r) / (max - min) + 2;
  else hue = (r - g) / (max - min) + 4;
  
  hue = (hue * 60 + 360) % 360;
  
  if (hue < 20 || hue >= 340) return 'red';
  if (hue < 50) return 'orange';
  if (hue < 70) return 'yellow';
  if (hue < 160) return 'green';
  if (hue < 210) return 'cyan';
  if (hue < 270) return 'blue';
  if (hue < 300) return 'purple';
  if (hue < 330) return 'magenta';
  return 'pink';
};

// ============ MAIN EXPORT - USE YOUR API SERVICE ============
export const generateDescriptionFromImage = async (imageFile, apiDbService) => {
  console.log('🚀 Starting image analysis...');
  
  // Validate that apiDbService is provided
  if (!apiDbService || !apiDbService.analyzeImage) {
    console.error('❌ API service not provided or missing analyzeImage method');
    console.warn('⚠️ Falling back to client-side analysis...');
    
    try {
      const result = await analyzeWithImprovedFallback(imageFile);
      console.log('✅ Client-side Fallback Complete!');
      return result;
    } catch (error) {
      console.error('❌ Fallback analysis failed:', error);
      return getManualEntryFallback(error);
    }
  }
  
  // Try backend first (it has the better Gemini prompt with water bottle logic)
  try {
    const result = await analyzeWithBackend(imageFile, apiDbService);
    console.log('✅ Backend Analysis Success!');
    return result;
  } catch (error) {
    console.warn('⚠️ Backend failed, using client-side fallback...', error.message);
  }
  
  // Fallback to improved client-side analysis
  try {
    const result = await analyzeWithImprovedFallback(imageFile);
    console.log('✅ Client-side Fallback Complete!');
    return result;
  } catch (error) {
    console.error('❌ All analysis methods failed:', error);
    return getManualEntryFallback(error);
  }
};

// Helper function for manual entry fallback
const getManualEntryFallback = (error) => {
  return {
    structured: {
      itemType: 'Unable to identify',
      colors: 'See image',
      brand: 'Unknown',
      material: 'Unknown',
      condition: 'Unknown',
      features: 'N/A'
    },
    naturalDescription: '⚠️ Image uploaded but AI analysis failed.\n\nPlease manually describe:\n• Item type (water bottle, phone, wallet, bag, keys, etc.)\n• Colors visible\n• Brand name if any\n• Material (plastic, metal, leather, etc.)\n• Any damage or unique features\n• Any text, logos, or markings',
    success: false,
    method: 'manual-entry-required',
    error: error?.message || 'Unknown error'
  };
};

export const generateBasicDescription = generateDescriptionFromImage;

// ============ IMPROVED AUTOFILL FUNCTION ============
export const autoFillFormFromDescription = (aiResponse) => {
  if (!aiResponse?.structured) return null;
  
  const s = aiResponse.structured;
  const parts = [];
  
  // Build item name from available fields
  if (s.colors && s.colors !== 'Unknown' && s.colors !== 'See image' && s.colors !== 'Please specify') {
    const firstColor = s.colors.split(',')[0].trim();
    if (firstColor && !firstColor.includes('Please') && !firstColor.includes('Unknown')) {
      parts.push(firstColor);
    }
  }
  
  if (s.brand && 
      s.brand !== 'Unknown' && 
      s.brand !== 'Not visible' && 
      s.brand !== 'Not detected' &&
      s.brand !== 'Please specify if visible') {
    parts.push(s.brand);
  }
  
  if (s.itemType && 
      s.itemType !== 'Unknown' && 
      s.itemType !== 'Unable to identify' &&
      s.itemType !== 'Unknown item') {
    parts.push(s.itemType);
  }
  
  // Build enhanced description
  let enhancedDescription = '';
  
  // Only use AI-generated content if it's actually meaningful
  if (aiResponse.success !== false && !aiResponse.requiresManualInput) {
    // Start with item type and material if available
    if (s.itemType && s.itemType !== 'Unknown' && s.itemType !== 'Unable to identify' && s.itemType !== 'Unknown item') {
      enhancedDescription = s.itemType;
      
      if (s.material && 
          s.material !== 'Unknown' && 
          s.material !== 'Please specify' &&
          !s.material.includes('Unable to detect')) {
        enhancedDescription += ` (${s.material})`;
      }
    }
    
    // Build structured details section
    const details = [];
    
    if (s.colors && s.colors !== 'Unknown' && s.colors !== 'See image' && s.colors !== 'Please specify') {
      details.push(`Colors: ${s.colors}`);
    }
    
    if (s.brand && s.brand !== 'Unknown' && s.brand !== 'Not visible' && s.brand !== 'Not detected' && s.brand !== 'Please specify if visible') {
      details.push(`Brand: ${s.brand}`);
    }
    
    if (s.condition && s.condition !== 'Unknown' && s.condition !== 'Please specify') {
      details.push(`Condition: ${s.condition}`);
    }
    
    if (s.features && s.features !== 'N/A' && s.features !== 'Unknown' && !s.features.includes('Please add')) {
      details.push(`Features: ${s.features}`);
    }
    
    if (details.length > 0) {
      enhancedDescription += '\n\n' + details.join('. ') + '.';
    }
    
    // Add natural description if meaningful
    if (aiResponse.naturalDescription && 
        !aiResponse.naturalDescription.includes('Please help by providing') &&
        !aiResponse.naturalDescription.includes('AI analysis unavailable')) {
      const naturalDesc = aiResponse.naturalDescription.trim();
      if (!enhancedDescription.includes(naturalDesc.substring(0, 50))) {
        enhancedDescription += '\n\n' + naturalDesc;
      }
    }
  } else {
    // Fallback case - provide helpful template
    enhancedDescription = aiResponse.naturalDescription || 'Please describe this item in detail.';
  }
  
  return {
    itemName: parts.join(' ').trim() || 'Found Item',
    description: enhancedDescription.trim() || 'Please add description'
  };
};