import AsyncStorage from "@react-native-async-storage/async-storage";
import { Discovery } from "../types/discovery";

const DISCOVERIES_KEY = "discoveries";

export async function saveDiscovery(discovery: Discovery) {
    const existing = await getDiscoveries();

    const existingDiscovery = existing.find((d) => d.speciesName.toLowerCase() === discovery.speciesName.toLocaleLowerCase());

    let updated: Discovery[];

    if (existingDiscovery) {
        const merged: Discovery = {
            ...existingDiscovery,
            confidence: discovery.confidence ?? existingDiscovery.confidence,
            photos: Array.from(new Set([...existingDiscovery.photos, ...discovery.photos])),
            locations: [...existingDiscovery.locations, ...discovery.locations],
            updatedAt: new Date().toISOString(),
        }

        updated = existing.map((d) => d.speciesName === merged.speciesName ? merged : d)
    } else {
        updated = [...existing, discovery]
    }

    // const updated = existing.some(d => d.id === discovery.id)
    //     ? existing.map(d => (d.id === discovery.id ? discovery : d))
    //     : [...existing, discovery];

    console.log('updated records', updated)

    await AsyncStorage.setItem('discoveries', JSON.stringify(updated));
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
