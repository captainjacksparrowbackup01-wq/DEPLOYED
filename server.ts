import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || 'MISSING_API_KEY',
});

// Helper function to retry Gemini API calls with fallback models
async function callGeminiWithRetry(aiClient: any, requestOptions: any, maxRetries = 2) {
  const modelsToTry = [
    requestOptions.model || 'gemini-3.6-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ];

  let lastError;
  for (const modelName of modelsToTry) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await aiClient.models.generateContent({
          ...requestOptions,
          model: modelName,
        });
      } catch (error: any) {
        lastError = error;
        // If it's a 503, wait and retry
        if (error?.status === 503 || error?.status === 'UNAVAILABLE' || error?.message?.includes('503')) {
          console.log(`Gemini API overloaded, retrying in background...`);
          await new Promise(resolve => setTimeout(resolve, 500));
          continue;
        }
        // If it's model not found (404), try next model in modelsToTry
        if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('not found') || error?.message?.includes('no longer available')) {
          console.warn(`Model ${modelName} not available, trying next model...`);
          break;
        }
        throw error;
      }
    }
  }
  throw lastError;
}

// API endpoint for generating product catalog
app.post('/api/generate-catalog', async (req, res) => {
  const { imageBase64, imageMimeType, voiceText } = req.body;

  // If Gemini API Key is available, use Gemini 2.5 Flash
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MISSING_API_KEY') {
    try {
      const parts: any[] = [];

      if (imageBase64 && imageMimeType) {
        parts.push({
          inlineData: {
            data: imageBase64,
            mimeType: imageMimeType
          }
        });
      }

      const prompt = `You are an expert in traditional Indian handicrafts and direct artisan market linkages.
Analyze the artisan's description and product details:
Artisan's description / voice notes: "${voiceText || 'Handcrafted Indian artisanal item.'}"

Generate an authentic, highly professional digital product listing in structured JSON format.
Highlight genuine materials, heritage craftsmanship, region, and fair trade quality.

Return ONLY a JSON object with this exact schema:
{
  "title": "Clear, appealing English title (e.g. Handwoven Pure Banarasi Silk Saree with Zari)",
  "category": "One of: Textiles, Pottery, Woodcraft, Metalcraft, Art, Leather, Jewellery, Baskets",
  "subcategory": "Specific craft subcategory",
  "material": "Genuine primary materials",
  "craftType": "Traditional craft technique",
  "color": "Dominant natural colors",
  "descriptionHindi": "A warm, compelling description in Hindi emphasizing tradition and craft.",
  "descriptionEnglish": "A refined, detailed description in English for conscious consumers.",
  "seoKeywords": ["array", "of", "relevant", "keywords"],
  "craftStory": "Short cultural lineage of this craft.",
  "region": "Authentic Indian city and state of origin"
}`;
      parts.push(prompt);

      const response = await callGeminiWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: parts,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '{}';
      return res.json(JSON.parse(text));
    } catch (error) {
      console.warn('Gemini generate-catalog fallback triggered:', error);
    }
  }

  // Smart heuristic fallback based on artisan's input
  const inputLower = (voiceText || '').toLowerCase();
  let category = 'Textiles';
  let craftType = 'Traditional Handloom';
  let material = 'Natural Handspun Fiber';
  let region = 'Varanasi, Uttar Pradesh';

  if (inputLower.includes('pot') || inputLower.includes('clay') || inputLower.includes('ceramic') || inputLower.includes('मिट्टी')) {
    category = 'Pottery';
    craftType = 'Jaipur Blue Pottery';
    material = 'Quartz Powder & Natural Mineral Slips';
    region = 'Jaipur, Rajasthan';
  } else if (inputLower.includes('wood') || inputLower.includes('लकड़ी') || inputLower.includes('carv') || inputLower.includes('box') || inputLower.includes('toy')) {
    category = 'Woodcraft';
    craftType = 'Hand-Carved Sheesham Woodwork';
    material = 'Seasoned Indian Rosewood (Sheesham)';
    region = 'Saharanpur, Uttar Pradesh';
  } else if (inputLower.includes('metal') || inputLower.includes('brass') || inputLower.includes('dhokra') || inputLower.includes('पीतल') || inputLower.includes('कांस्य')) {
    category = 'Metalcraft';
    craftType = 'Bastar Dhokra Lost-Wax Casting';
    material = 'Bell Metal Bronze & Brass Alloy';
    region = 'Bastar, Chhattisgarh';
  } else if (inputLower.includes('paint') || inputLower.includes('art') || inputLower.includes('मधुबनी') || inputLower.includes('वारली') || inputLower.includes('चित्र')) {
    category = 'Art';
    craftType = 'Mithila Madhubani Folk Art';
    material = 'Natural Vegetable Pigments on Handmade Paper';
    region = 'Madhubani, Bihar';
  } else if (inputLower.includes('leather') || inputLower.includes('chappal') || inputLower.includes('jutti') || inputLower.includes('चमड़ा')) {
    category = 'Leather';
    craftType = 'Kolhapuri Leather Craft';
    material = 'Vegetable Tanned Leather';
    region = 'Kolhapur, Maharashtra';
  } else if (inputLower.includes('basket') || inputLower.includes('grass') || inputLower.includes('डलिया')) {
    category = 'Baskets';
    craftType = 'Sikki Golden Grass Weaving';
    material = 'Wild Sikki Grass';
    region = 'Darbhanga, Bihar';
  } else if (inputLower.includes('jewel') || inputLower.includes('earring') || inputLower.includes('silver') || inputLower.includes('गहने')) {
    category = 'Jewellery';
    craftType = 'Tarakasi Silver Filigree';
    material = '92.5% Sterling Silver';
    region = 'Cuttack, Odisha';
  }

  const generatedTitle = voiceText && voiceText.length > 5 
    ? (voiceText.charAt(0).toUpperCase() + voiceText.slice(1)).slice(0, 65)
    : `Handcrafted ${craftType} Artisanal Creation`;

  return res.json({
    title: generatedTitle,
    category,
    subcategory: craftType,
    material,
    craftType,
    color: 'Earthy / Heritage Tones',
    descriptionHindi: `पारंपरिक कारीगरों द्वारा हस्तनिर्मित ${craftType}। इसमें प्राकृतिक सामग्रियों और पुश्तैनी कौशल का सुंदर उपयोग किया गया है।`,
    descriptionEnglish: `Authentic handcrafted ${craftType} created by master artisans using time-honored techniques. Ethically crafted with 100% fair artisan price linkage.`,
    seoKeywords: ['handicraft', craftType.toLowerCase(), category.toLowerCase(), 'artisan', 'indian heritage'],
    craftStory: `This piece represents ancestral craftsmanship passed down through generations in ${region}, embodying sustainable handmade Indian tradition.`,
    region
  });
});

// API endpoint for pricing assistant
app.post('/api/suggest-price', async (req, res) => {
  const { materialCost, laborCost, otherCost, catalogData } = req.body;
  const mat = Number(materialCost) || 0;
  const lab = Number(laborCost) || 0;
  const oth = Number(otherCost) || 0;
  const baseCost = mat + lab + oth;

  // Try Gemini 2.5 Flash if API key is present
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MISSING_API_KEY') {
    try {
      const prompt = `You are a fair-trade pricing advisor for traditional Indian artisans.
Base production costs:
- Material: ₹${mat}
- Labor: ₹${lab}
- Other/Packaging: ₹${oth}
- Total Base Cost: ₹${baseCost}

Product: "${catalogData?.title || 'Handcrafted Item'}" (${catalogData?.craftType || 'Artisan Craft'})

Provide fair trade market pricing for conscious buyers.
Ensure the artisan earns a minimum 35% to 65% markup over their direct costs.

Return ONLY a JSON object with this exact schema:
{
  "baseCost": ${baseCost},
  "suggestedMinPrice": number,
  "suggestedMaxPrice": number,
  "recommendedPrice": number,
  "explanation": "Brief encouraging explanation of why this pricing is fair for the artisan and competitive in the market."
}`;

      const response = await callGeminiWithRetry(ai, {
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        }
      });

      const text = response.text || '{}';
      return res.json(JSON.parse(text));
    } catch (err) {
      console.warn('Gemini suggest-price fallback triggered:', err);
    }
  }

  // Fair-trade standard pricing calculation
  const safeBase = baseCost > 0 ? baseCost : 500;
  const minPrice = Math.round(safeBase * 1.35);
  const maxPrice = Math.round(safeBase * 1.85);
  const recPrice = Math.round(safeBase * 1.50);

  return res.json({
    baseCost: safeBase,
    suggestedMinPrice: minPrice,
    suggestedMaxPrice: maxPrice,
    recommendedPrice: recPrice,
    explanation: `Calculated with a 50% fair artisan profit margin above your ₹${safeBase} production costs, ensuring fair wages while remaining highly competitive.`
  });
});

// Setup Vite in middleware mode for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API endpoint not found' });
      res.sendFile(join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running at http://0.0.0.0:${port}`);
  });
}

startServer();
