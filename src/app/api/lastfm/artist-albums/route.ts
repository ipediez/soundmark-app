import { NextResponse } from "next/server";
import { getArtistAlbums, getLargestImage } from "@/lib/lastfm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");

  if (!artist) {
    return NextResponse.json({ error: "Artist required" }, { status: 400 });
  }

  try {
    const albums = await getArtistAlbums(artist);
    const results = albums
      .filter((a) => a.name !== "(null)" && getLargestImage(a.image || []))
      .map((a) => ({
        name: a.name,
        artist: a.artist.name,
        url: a.url,
        image: getLargestImage(a.image || []),
        playcount: a.playcount || 0,
      }));
    return NextResponse.json(results);
  } catch (error) {
    console.error("Last.fm albums error:", error);
    return NextResponse.json({ error: "Failed to fetch albums" }, { status: 500 });
  }
}
