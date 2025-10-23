import AsyncStorage from "@react-native-async-storage/async-storage";
import { Discovery } from "../types/discovery";

const DISCOVERIES_KEY = "discoveries";

export async function saveDiscovery(discovery: Discovery) {
    const existing = await getDiscoveries();

    const updated = existing.some(d => d.id === discovery.id)
        ? existing.map(d => (d.id === discovery.id ? discovery : d))
        : [...existing, discovery];

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
