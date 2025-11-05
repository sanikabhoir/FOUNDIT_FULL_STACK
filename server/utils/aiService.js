const fetch = require('node-fetch');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent';
const MATCH_THRESHOLD = 65; 

const enhancedPrompt = (item1, item2) => `
You are an intelligent AI assistant for a Lost & Found matching system. Your goal is to determine the likelihood that two items represent THE SAME PHYSICAL OBJECT.

ITEM 1 (${item1.type}):
Name: ${item1.itemName}
Description: ${item1.description || 'No description provided'}
Location: ${item1.locationShort || 'Unknown'}
Date: ${item1.date}
${item1.time ? `Time: ${item1.time}` : ''}

ITEM 2 (${item2.type}):
Name: ${item2.itemName}
Description: ${item2.description || 'No description provided'}
Location: ${item2.locationShort || 'Unknown'}
Date: ${item2.date}
${item2.time ? `Time: ${item2.time}` : ''}

INTELLIGENT ANALYSIS GUIDELINES:

1. SEMANTIC UNDERSTANDING:
   - "iPhone" = "Apple phone" = "iOS device" = "mobile phone (Apple brand)"
   - "Wallet" = "purse" (context-dependent) = "card holder" = "billfold"
   - "Keys" could be "car keys" or "house keys" or "key ring"
   - "Bag" = "backpack" = "handbag" = "purse" = "satchel"
   - Consider abbreviations, slang, and informal naming

2. CATEGORY LOGIC:
   - Items in the same BROAD category can match (all "electronics", all "accessories", all "documents")
   - Items in COMPLETELY different categories cannot match (electronics vs food, clothing vs animals)
   - When in doubt, consider if a reasonable person could describe the same object differently

3. DESCRIPTION FLEXIBILITY:
   - "Black iPhone 13" vs "Dark colored Apple phone" → HIGH match (90+)
   - "Blue backpack" vs "Navy bag" → HIGH match (85+)
   - Missing descriptions don't mean NO match - base score on what's available
   - Partial matches are valuable: "Phone" vs "iPhone 13 Pro Max Black" → MEDIUM-HIGH (70-80)

4. REAL-WORLD SCENARIOS:
   - People describe things differently when lost vs found
   - Finder might see more details than loser remembered
   - Colors can be subjective ("dark blue" vs "black" in low light)
   - Brand names might be unknown to finder ("laptop" vs "MacBook")

5. SCORING PHILOSOPHY:
   - 90-100: Almost certain match (specific details align perfectly)
   - 75-89: Strong match (key attributes match, minor differences explainable)
   - 60-74: Probable match (same category, reasonable overlap)
   - 40-59: Possible match (same category, vague descriptions)
   - 20-39: Weak match (same broad category, little detail overlap)
   - 0-19: No match (incompatible categories or contradictory details)

6. RED FLAGS (force low scores):
   - Completely different categories (Phone vs Fruit → 0-5)
   - Contradictory specific details (Red vs Blue when both specify color → 10-20)
   - Impossible timeline (found before lost → 0)

7. GREEN FLAGS (boost scores):
   - Specific unique identifiers match (serial numbers, custom engravings)
   - Rare/unusual items with matching descriptions
   - Multiple attribute matches (brand + color + model)

Respond with ONLY valid JSON (no markdown, no extra text):
{
  "step1_category1": "broad category of item 1",
  "step1_category2": "broad category of item 2",
  "step2_sameCategory": true,
  "score": 85,
  "reasoning": "concise explanation of your scoring decision"
}
`;

const callGeminiAPI = async (prompt) => {
  if (!GEMINI_API_KEY) {
     console.error("❌ GEMINI API KEY MISSING! Cannot run external AI matching.");
     return { score: 0, reasoning: 'API Key Missing on Server.', step2_sameCategory: true };
  }
    
  const MAX_RETRIES = 2;
  let lastError = null;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
        console.log(`[Gemini] Attempt ${i + 1}/${MAX_RETRIES}...`);
        
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { 
              temperature: 0.3,
              maxOutputTokens: 512,
              topP: 0.9,
              topK: 40
            }
          })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            console.error(`❌ GEMINI API HTTP Error ${response.status}:`, JSON.stringify(errorData, null, 2));
            throw new Error(`Gemini API HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        console.log('[Gemini] Raw Response:', JSON.stringify(data, null, 2));
        
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!resultText) {
            console.error('❌ No text content in Gemini response');
            throw new Error("No text content in Gemini response.");
        }

        console.log('[Gemini] Raw Text:', resultText);

        // Try to extract JSON from the response
        let jsonText = resultText.trim();
        
        // Remove markdown code blocks if present
        jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        
        // Find JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('❌ No JSON found in response:', resultText);
            throw new Error("No JSON object found in response");
        }
        
        const result = JSON.parse(jsonMatch[0]);
        console.log('[Gemini] Parsed Result:', result);
        
        // Apply safety rules for obvious mismatches
        if (result.step2_sameCategory === false && result.score > 10) {
           console.log(`[Gemini] ⚠️ Different categories detected, capping score at 10`);
           result.score = Math.min(result.score, 10); 
        }
        
        // Ensure score is within bounds
        result.score = Math.max(0, Math.min(100, result.score));
        
        return result;

    } catch (error) {
        lastError = error;
        console.error(`[Gemini] ❌ Attempt ${i + 1} failed:`, error.message);
        
        if (i < MAX_RETRIES - 1) {
            const delay = 1000 * (i + 1);
            console.log(`[Gemini] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
  }
  
  console.error('❌ [Gemini] All attempts failed. Last error:', lastError?.message);
  // Return a low score on failure instead of 40
  return { 
    score: 0, 
    reasoning: `API call failed: ${lastError?.message || 'Unknown error'}`,
    step2_sameCategory: true 
  };
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

const calculateLocationTimeScore = (item1, item2) => {
    let locationScore = 0;
    if (item1.actualLocation?.latitude && item2.actualLocation?.latitude) {
        const distance = calculateDistance(
            item1.actualLocation.latitude, item1.actualLocation.longitude,
            item2.actualLocation.latitude, item2.actualLocation.longitude
        );
        
        if (distance <= 0.5) locationScore = 100;
        else if (distance <= 5) locationScore = 85;
        else if (distance <= 20) locationScore = 60;
        else if (distance <= 50) locationScore = 30;
        else locationScore = 10;
        
        console.log(`[GeoTime] Distance: ${distance.toFixed(2)}km, Score: ${locationScore.toFixed(1)}%`);

    } else {
        locationScore = 40; 
        console.log(`[GeoTime] No GPS data, using default location score: ${locationScore}%`);
    }
    
    let timeScore = 0;
    try {
        const datetime1 = new Date(`${item1.date}T${item1.time || '12:00:00'}`).getTime();
        const datetime2 = new Date(`${item2.date}T${item2.time || '12:00:00'}`).getTime();
        const hoursDiff = Math.abs(datetime1 - datetime2) / (1000 * 60 * 60);

        if (hoursDiff <= 12) timeScore = 100;
        else if (hoursDiff <= 48) timeScore = 90;
        else if (hoursDiff <= 168) timeScore = 70;
        else if (hoursDiff <= 720) timeScore = 40;
        else timeScore = 15;
        
        console.log(`[GeoTime] Time Diff: ${hoursDiff.toFixed(1)}h, Score: ${timeScore.toFixed(1)}%`);

    } catch (e) {
        timeScore = 50;
        console.log(`[GeoTime] Time parse error, using default: ${timeScore}%`);
    }

    return (locationScore * 0.6 + timeScore * 0.4);
};

const calculateMatchScore = async (item1, item2) => {
    console.log('\n🔍 ============ MATCH CALCULATION START ============');
    console.log(`Item 1: ${item1.itemName} - ${item1.description}`);
    console.log(`Item 2: ${item2.itemName} - ${item2.description}`);
    
    // 1. Gemini AI check (for semantic, category, brand match)
    const geminiResult = await callGeminiAPI(enhancedPrompt(item1, item2));
    
    let aiScore = geminiResult.score || 0;
    console.log(`[AI Match] Gemini Score: ${aiScore}%, Category Match: ${geminiResult.step2_sameCategory}`);
    
    // Only completely reject if categories are fundamentally incompatible
    if (geminiResult.step2_sameCategory === false && aiScore < 5) {
         console.log(`[AI Match] ❌ Incompatible Categories: ${geminiResult.step1_category1} vs ${geminiResult.step1_category2}. FINAL SCORE: ${aiScore}`);
         console.log('🔍 ============ MATCH CALCULATION END ============\n');
         return aiScore; 
    }
    
    if (aiScore === 0) {
        console.log(`[AI Match] ❌ Gemini score is 0, FINAL SCORE: 0`);
        console.log('🔍 ============ MATCH CALCULATION END ============\n');
        return 0; 
    }
    
    // 2. Location and Time Check (objective factors)
    const geoTimeScore = calculateLocationTimeScore(item1, item2);
    
    // 3. Final Weighted Score with intelligent blending
    // If AI is very confident (>85), increase its weight
    // If AI is uncertain (40-60), rely more on geo/time
    let aiWeight, geoWeight;
    
    if (aiScore >= 85) {
        aiWeight = 0.70;  // Very confident AI gets more weight
        geoWeight = 0.30;
    } else if (aiScore >= 60) {
        aiWeight = 0.60;  // Normal case
        geoWeight = 0.40;
    } else {
        aiWeight = 0.50;  // Uncertain AI, balance with geo
        geoWeight = 0.50;
    }
    
    const finalScore = (aiScore * aiWeight) + (geoTimeScore * geoWeight);
    
    console.log(`[Final] ✅ AI=${aiScore.toFixed(1)}% (weight: ${aiWeight}), GeoTime=${geoTimeScore.toFixed(1)}% (weight: ${geoWeight}), FINAL=${finalScore.toFixed(1)}%`);
    console.log(`[Final] Reasoning: ${geminiResult.reasoning || 'N/A'}`);
    console.log('🔍 ============ MATCH CALCULATION END ============\n');

    return Math.round(Math.min(100, Math.max(0, finalScore)));
};

module.exports = { calculateMatchScore, MATCH_THRESHOLD };