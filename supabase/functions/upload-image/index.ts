// supabase/functions/upload-image/index.ts
// Deno + Supabase Edge Function
import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE")!; // service_role — keep it secret in env
const BUCKET = Deno.env.get("SUPABASE_BUCKET") || "discoveries-photos";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
    global: { headers: { "x-upstream": "edge-fn" } },
});

serve(async (req) => {
    try {
        if (req.method !== "POST") {
            return new Response("Method not allowed", { status: 405 });
        }

        const body = await req.json();
        const { fileName, base64 } = body ?? {};

        if (!fileName || !base64) {
            return new Response(JSON.stringify({ error: "fileName & base64 required" }), { status: 400 });
        }

        // decode base64 -> Uint8Array
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // upload to storage
        const { data, error: uploadErr } = await supabase.storage
            .from(BUCKET)
            .upload(fileName, bytes, {
                contentType: "image/jpeg",
                upsert: false,
            });

        if (uploadErr) {
            console.error("upload error:", uploadErr);
            return new Response(JSON.stringify({ error: uploadErr.message || uploadErr }), { status: 500 });
        }

        // get public URL
        const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        const publicUrl = publicData?.publicUrl ?? null;

        return new Response(JSON.stringify({ publicUrl, path: data.path }), {
            headers: { "Content-Type": "application/json" },
            status: 200,
        });
    } catch (err) {
        console.error("fn error:", err);
        return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
    }
});
