import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BETA_LIMITS } from "@/lib/beta-limits";

interface ImportEntry {
  artist: string;
  title: string;
  release_year: number | null;
  genre: string | null;
  subgenre: string | null;
  country: string | null;
  status: string;
  influence_notes: string | null;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { entries } = (await request.json()) as { entries: ImportEntry[] };

    if (!entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    // Filter valid entries
    const validEntries = entries.filter((e) => e.artist && e.title);
    const invalidCount = entries.length - validEntries.length;

    if (validEntries.length === 0) {
      return NextResponse.json({
        imported: 0,
        updated: 0,
        errors: invalidCount > 0 ? [`${invalidCount} entries missing artist or title`] : [],
      });
    }

    // Get all existing entries for this user in one query
    const { data: existingEntries, count: currentAlbumCount } = await supabase
      .from("music_library")
      .select("id, artist, title", { count: "exact" })
      .eq("user_id", user.id);

    // Create a map for quick lookup
    const existingMap = new Map<string, string>();
    for (const entry of existingEntries || []) {
      const key = `${entry.artist.toLowerCase()}|${entry.title.toLowerCase()}`;
      existingMap.set(key, entry.id);
    }

    // Check album limit
    const albumCount = currentAlbumCount || 0;
    const remainingSlots = BETA_LIMITS.MAX_ALBUMS_PER_USER - albumCount;

    // Separate entries into updates and inserts
    const toInsert: Array<{
      user_id: string;
      artist: string;
      title: string;
      release_year: number | null;
      genre: string | null;
      subgenre: string | null;
      country: string | null;
      status: string;
      influence_notes: string | null;
    }> = [];

    const toUpdate: Array<{
      id: string;
      release_year: number | null;
      genre: string | null;
      subgenre: string | null;
      country: string | null;
      status: string;
      influence_notes: string | null;
    }> = [];

    for (const entry of validEntries) {
      const key = `${entry.artist.toLowerCase()}|${entry.title.toLowerCase()}`;
      const existingId = existingMap.get(key);

      if (existingId) {
        toUpdate.push({
          id: existingId,
          release_year: entry.release_year,
          genre: entry.genre,
          subgenre: entry.subgenre,
          country: entry.country,
          status: entry.status,
          influence_notes: entry.influence_notes,
        });
      } else {
        toInsert.push({
          user_id: user.id,
          artist: entry.artist,
          title: entry.title,
          release_year: entry.release_year,
          genre: entry.genre,
          subgenre: entry.subgenre,
          country: entry.country,
          status: entry.status,
          influence_notes: entry.influence_notes,
        });
      }
    }

    const errors: string[] = [];
    let imported = 0;
    let updated = 0;
    let skippedDueToLimit = 0;

    // Check if we have room to insert new albums
    let albumsToInsert = toInsert;
    if (toInsert.length > remainingSlots) {
      skippedDueToLimit = toInsert.length - remainingSlots;
      albumsToInsert = toInsert.slice(0, Math.max(0, remainingSlots));
      if (remainingSlots <= 0) {
        errors.push(`Album limit reached (${BETA_LIMITS.MAX_ALBUMS_PER_USER} max). ${skippedDueToLimit} new albums skipped.`);
      } else {
        errors.push(`Album limit approaching. Only ${remainingSlots} of ${toInsert.length} new albums imported. ${skippedDueToLimit} skipped.`);
      }
    }

    // Batch insert new entries
    if (albumsToInsert.length > 0) {
      const { error } = await supabase.from("music_library").insert(albumsToInsert);
      if (error) {
        errors.push(`Insert error: ${error.message}`);
      } else {
        imported = albumsToInsert.length;
      }
    }

    // Update existing entries one by one (Supabase doesn't support batch update with different values)
    for (const entry of toUpdate) {
      const { error } = await supabase
        .from("music_library")
        .update({
          release_year: entry.release_year,
          genre: entry.genre,
          subgenre: entry.subgenre,
          country: entry.country,
          status: entry.status,
          influence_notes: entry.influence_notes,
        })
        .eq("id", entry.id);

      if (error) {
        errors.push(`Update error: ${error.message}`);
      } else {
        updated++;
      }
    }

    if (invalidCount > 0) {
      errors.push(`${invalidCount} entries skipped (missing artist or title)`);
    }

    return NextResponse.json({ imported, updated, errors, skippedDueToLimit });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
