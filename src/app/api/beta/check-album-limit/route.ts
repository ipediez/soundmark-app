import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BETA_LIMITS } from "@/lib/beta-limits";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { count, error } = await supabase
      .from("music_library")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (error) {
      console.error("Error checking album count:", error);
      return NextResponse.json({ error: "Failed to check album limit" }, { status: 500 });
    }

    const albumCount = count || 0;

    return NextResponse.json({
      canAddAlbum: albumCount < BETA_LIMITS.MAX_ALBUMS_PER_USER,
      currentCount: albumCount,
      maxAlbums: BETA_LIMITS.MAX_ALBUMS_PER_USER,
      remaining: BETA_LIMITS.MAX_ALBUMS_PER_USER - albumCount,
    });
  } catch (error) {
    console.error("Error checking album limit:", error);
    return NextResponse.json({ error: "Failed to check album limit" }, { status: 500 });
  }
}
