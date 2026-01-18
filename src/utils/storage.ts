import AsyncStorage from "@react-native-async-storage/async-storage";
import { Discovery } from "../types/discovery";
import { uploadImage } from "./uploadImage";
import { supabase } from "../lib/supabaseClient";

const DISCOVERIES_KEY = "discoveries";

export async function saveDiscovery(newDiscovery: Discovery) {
    // 1️⃣ Load local data
    const existingRaw = await AsyncStorage.getItem("discoveries");
    const existing: Discovery[] = existingRaw ? JSON.parse(existingRaw) : [];

    // 2️⃣ Find by speciesName (our merging strategy)
    const existingIndex = existing.findIndex(
        d => d.speciesName.toLowerCase() === newDiscovery.speciesName.toLowerCase()
    );

    let merged: Discovery;

    if (existingIndex !== -1) {
        // 3️⃣ Merge with the existing record
        const old = existing[existingIndex];

        merged = {
            ...old,
            updatedAt: new Date().toISOString(),
            photos: [...old.photos, ...newDiscovery.photos],
            locations: [...old.locations, ...newDiscovery.locations]
        };

        existing[existingIndex] = merged;
    } else {
        // 4️⃣ First-time discovery
        merged = {
            ...newDiscovery,
            updatedAt: new Date().toISOString(),
        };

        existing.push(merged);
    }

    // 5️⃣ Save updated list locally
    await AsyncStorage.setItem("discoveries", JSON.stringify(existing));

    // 6️⃣ Upload photos to Supabase storage
    const userId = "demo-user"; // replace later with real auth user id
    const uploadedUrls: string[] = [];

    for (const photo of merged.photos) {
        const remoteUrl = await uploadImage(photo, userId);
        if (remoteUrl) uploadedUrls.push(remoteUrl);
    }

    // 7️⃣ Upsert metadata into Supabase DB
    const { error } = await supabase.from("discoveries").upsert({
        species_name: merged.speciesName,
        confidence: merged.confidence,
        photos: uploadedUrls,
        locations: merged.locations,
        updated_at: merged.updatedAt,
        created_at: merged.createdAt,
        user_id: userId
    });

    if (error) {
        console.warn("⚠️ Supabase sync failed, but local save succeeded.", error);
    }

    return merged;
}

export const getDiscoveries = async (): Promise<Discovery[]> => {
    try {
        const data = await AsyncStorage.getItem(DISCOVERIES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error("❌ Error loading discoveries:", error);
        return [];
    }
};

export const deleteDiscovery = async (id: string): Promise<void> => {
    try {
        const raw = await AsyncStorage.getItem(DISCOVERIES_KEY)
        if (!raw) return
        const list: Discovery[] = JSON.parse(raw)
        const filtered = list.filter(item => item.id !== id)
        await AsyncStorage.setItem(DISCOVERIES_KEY, JSON.stringify(filtered))
    } catch (err) {
        console.error("Error deleting discovery", err)
        throw err
    }
}
