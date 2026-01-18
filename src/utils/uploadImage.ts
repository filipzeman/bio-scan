import { supabase } from "../lib/supabaseClient";

export async function uploadImage(
    uri: string,
    userId: string
): Promise<string | null> {
    try {
        console.log("☁️ Uploading image:", uri);

        // 1️⃣ Fetch the local file
        const response = await fetch(uri);
        if (!response.ok) {
            throw new Error("Failed to fetch local file");
        }

        // 2️⃣ Convert to ArrayBuffer (THIS is the key fix)
        const arrayBuffer = await response.arrayBuffer();

        // 3️⃣ Prepare filename
        const fileExt = uri.split(".").pop() || "jpg";
        const fileName = `${userId}/${Date.now()}.${fileExt}`;

        // 4️⃣ Upload to Supabase
        const { error } = await supabase.storage
            .from("discoveries-photos")
            .upload(fileName, arrayBuffer, {
                contentType: "image/jpeg",
                upsert: false,
            });

        if (error) {
            console.error("❌ Supabase upload error:", error);
            throw error;
        }

        // 5️⃣ Get public URL
        const { data } = supabase.storage
            .from("discoveries-photos")
            .getPublicUrl(fileName);

        console.log("✅ Uploaded image URL:", data.publicUrl);
        return data.publicUrl;
    } catch (err) {
        console.error("❌ uploadImage failed:", err);
        return null;
    }
}
