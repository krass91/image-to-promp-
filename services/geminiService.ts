
import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available in the environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Generates a descriptive prompt from a given image.
 * @param base64Image The base64 encoded image string.
 * @param mimeType The MIME type of the image (e.g., 'image/jpeg').
 * @returns A promise that resolves to the generated text prompt.
 */
export async function generatePromptFromImage(
  base64Image: string,
  mimeType: string
): Promise<string> {
  try {
    const model = 'gemini-2.5-flash';

    const textPart = {
      text: "Analyze this image and generate a highly detailed and creative descriptive prompt that an AI image generator could use to create a similar image. Focus on visual elements like subject, setting, composition, lighting, colors, and overall mood. Do not include any introductory text, just the prompt itself."
    };
    
    const imagePart = {
        inlineData: {
            mimeType: mimeType,
            data: base64Image,
        },
    };

    const response = await ai.models.generateContent({
        model,
        contents: { parts: [textPart, imagePart] },
    });

    const resultText = response.text;
    if (!resultText) {
        throw new Error("The API returned an empty response.");
    }

    return resultText.trim();

  } catch (error) {
    console.error("Error generating prompt from image:", error);
    // Re-throw a more user-friendly error
    throw new Error("Failed to communicate with the Gemini API. Please try again later.");
  }
}
