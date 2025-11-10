// src/api/plantApi.ts
import { API_KEY, API_ENDPOINT } from "../constants/keys";

export async function identifyMultiplePhotos(base64Images: string[]) {
  try {
    console.log('🧪  Real plantID request sent')
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Api-Key": API_KEY,
      },
      body: JSON.stringify({
        images: base64Images,
        similar_images: true, // optional, useful for debugging
        classification_level: "species",
        // optionally add: 'modifiers': ['similar_images'], 'plant_language': 'en', etc.
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API request failed: ${response.status} ${errText}`);
    }

    const json = await response.json();

    return json;
  } catch (error) {
    // console.error("identifyMultiplePhotos error:", error);
    console.error("identifyMultiplePhotos error:");
    throw error;
  }
}

export const mockIdentifyPlant = async (base64Images: string[]) => {
  console.log("🧪  Mock identifyPlant called");
  await new Promise((r) => setTimeout(r, 1500)); // simulate network delay
  return {
    speciesName: "Quercus robur (English Oak)",
    confidence: 0.92,
  };
};