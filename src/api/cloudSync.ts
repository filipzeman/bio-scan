import { supabase } from "../lib/supabaseClient";
import { Discovery } from "../types/discovery";
import { getOrCreateUserId } from "../utils/user";

// 🔼 Upload one discovery
export async function uploadDiscovery(discovery: Discovery) {
    try {
        const userId = await getOrCreateUserId()

        const { data, error } = await supabase
            .from("discoveries").upsert(
                [
                    {
                        id: discovery.id,
                        user_id: userId,
                        species_name: discovery.speciesName,
                        confidence: discovery.confidence,
                        photos: discovery.photos || [],
                        locations: discovery.locations || [],
                        created_at: discovery.createdAt,
                        updated_at: discovery.updatedAt ?? new Date().toISOString()
                    },
                ],
                { onConflict: "id" }
            )
            .select()

        if (error) throw error;
        console.log(`☁️ Synced discovery "${discovery.speciesName}"`);
        return data
    } catch (err) {
        console.error("❌ uploadDiscovery failed:", err);
        return null
    }
}

// 🔽 Fetch all user discoveries
export async function fetchDiscoveries(userId: string): Promise<Discovery[]> {
    try {
        const { data, error } = await supabase
            .from("discoveries")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) throw error;

        return (
            data?.map((d) => ({
                id: d.id,
                speciesName: d.species_name,
                confidence: d.confidence,
                photos: d.photos || [],
                locations: d.locations || [],
                createdAt: d.created_at,
                updatedAt: d.updated_at,
            })) || []
        );
    } catch (err) {
        console.error("❌ fetchDiscoveries failed:", err);
        return [];
    }
}