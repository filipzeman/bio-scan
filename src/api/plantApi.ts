// src/api/plantApi.ts
const API_KEY = 'SVBa9DOn4NXF9hHmVWwkukx9wZTUp578d3sG4ZBwp0TupKVwyB';
const ENDPOINT = 'https://plant.id/api/v3/identification';


export async function identifyPlant(imageBase64: string) {
    console.log("🧪 Base64 length:", imageBase64?.length);
    console.log("🧪 Starts with:", imageBase64?.substring(0, 30));
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Api-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      images: [imageBase64],
      similar_images: true,
    }),
  });

  const rawText = await response.text();
  console.log("Plant.id raw response text:", rawText);

  // ✅ safely parse JSON only if it's valid JSON
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error(`Plant.id returned non-JSON: ${rawText}`);
  }

  if (!response.ok) {
    throw new Error(
      `Plant.id API HTTP ${response.status}: ${data?.message || rawText}`
    );
  }

  return data;
}

export const mockIdentifyPlant = async (imageUri: string) => {
  console.log("🧪 Mock identifyPlant called with", imageUri);
  await new Promise((r) => setTimeout(r, 1500)); // simulate network delay
  return {
    speciesName: "Quercus robur (English Oak)",
    confidence: 0.92,
  };
};