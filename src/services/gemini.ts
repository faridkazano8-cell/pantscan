import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface PlantAnalysis {
  plantName: string;
  healthStatus: "healthy" | "diseased" | "pest_infestation" | "nutrient_deficiency";
  diagnosis: string;
  symptoms: string[];
  treatment: string;
  prevention: string;
  confidence: number;
}

export async function analyzePlantImage(base64Image: string): Promise<PlantAnalysis> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Analyze this image of a plant or leaf. 
    Identify the plant, detect any diseases, pests, or nutrient deficiencies.
    Provide the response in Arabic.
    Return the data in the following JSON format:
    {
      "plantName": "اسم النبات",
      "healthStatus": "one of: healthy, diseased, pest_infestation, nutrient_deficiency",
      "diagnosis": "وصف التشخيص بالتفصيل",
      "symptoms": ["العرض 1", "العرض 2"],
      "treatment": "الحلول المقترحة والعلاج بالتفصيل",
      "prevention": "طرق الوقاية المستقبلية",
      "confidence": 0.95
    }
  `;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(",")[1] || base64Image,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          plantName: { type: Type.STRING },
          healthStatus: { type: Type.STRING },
          diagnosis: { type: Type.STRING },
          symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
          treatment: { type: Type.STRING },
          prevention: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
        required: ["plantName", "healthStatus", "diagnosis", "symptoms", "treatment", "prevention", "confidence"],
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as PlantAnalysis;
}

export async function generateHealthyPlantImage(plantName: string, size: "1K" | "2K" | "4K", aspectRatio: string): Promise<string> {
  const model = "gemini-3.1-flash-image-preview";
  
  const prompt = `A high-quality, realistic, professional agricultural photograph of a perfectly healthy ${plantName} plant. Vibrant green leaves, no diseases, no pests, natural sunlight, detailed texture.`;

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
        imageSize: size as any
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  
  throw new Error("Failed to generate image");
}
