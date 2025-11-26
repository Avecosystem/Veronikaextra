
import Bytez from "bytez.js";

export default async function handler(req: any, res: any) {
  // 1. Handle CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Validate API Key from Server Environment
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("CRITICAL: API_KEY missing in server environment.");
    return res.status(500).json({ 
      message: 'Server Configuration Error: API Key is missing. Please add API_KEY to Vercel Project Settings.' 
    });
  }

  try {
    const { prompt, numberOfImages = 1 } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: 'Prompt is required' });
    }

    // Initialize Bytez SDK with NSFW-GEN-ANIME model
    // NOTE: For production you should load this key from environment instead of hardcoding.
    const sdk = new Bytez(apiKey);
    const model = sdk.model("UnfilteredAI/NSFW-GEN-ANIME");

    // Parallel processing for speed (up to 4 images)
    const count = Math.max(1, Math.min(4, numberOfImages));
    
    // Each request calls the Bytez model once
    const imageRequests = Array.from({ length: count }).map(async () => {
      const { error, output } = await model.run(prompt);

      if (error) {
        throw new Error(typeof error === "string" ? error : JSON.stringify(error));
      }

      return output;
    });

    // Use allSettled to ensure that if one image fails (e.g. safety), the others still succeed
    const results = await Promise.allSettled(imageRequests);
    
    const images: any[] = [];
    const errors: string[] = [];

    results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
            const output = result.value as any;

            // Try to normalize different possible output shapes from Bytez
            // 1) If it's already a string, assume it's a URL or data URI
            if (typeof output === "string") {
              images.push({
                id: `img-${Date.now()}-${index}`,
                url: output,
                prompt,
              });
            }
            // 2) If it's an object with a url field
            else if (output && typeof output === "object" && typeof (output as any).url === "string") {
              images.push({
                id: `img-${Date.now()}-${index}`,
                url: (output as any).url,
                prompt,
              });
            }
            // 3) If it's an array of URLs/objects, take the first
            else if (Array.isArray(output) && output.length > 0) {
              const first = output[0] as any;
              if (typeof first === "string") {
                images.push({
                  id: `img-${Date.now()}-${index}`,
                  url: first,
                  prompt,
                });
              } else if (first && typeof first === "object" && typeof first.url === "string") {
                images.push({
                  id: `img-${Date.now()}-${index}`,
                  url: first.url,
                  prompt,
                });
              }
            }
        } else {
            const errorMsg = result.reason?.message || "Unknown generation error";
            console.error(`Image generation ${index} failed:`, errorMsg);
            errors.push(errorMsg);
        }
    });

    // If we got NO images at all, throw an error
    if (images.length === 0) {
      const errorMessage = errors[0] || "No image generated. Please try a different prompt.";
      if (errorMessage.includes("429")) {
          throw new Error("System is busy. Please try again in a moment.");
      }
      throw new Error(errorMessage);
    }

    // Return whatever images we successfully generated
    return res.status(200).json({ images });

  } catch (error: any) {
    console.error("Backend Generation Error:", error);
    let message = error.message || 'Internal Server Error';
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
      message = "Quota exceeded. Please check billing or try again later.";
    }
    return res.status(500).json({ message });
  }
}
