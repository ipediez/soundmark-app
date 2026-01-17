import { NextResponse } from "next/server";
import { searchArtist, getLargestImage } from "@/lib/lastfm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    const artists = await searchArtist(query);
    const results = artists.map((a) => ({
      name: a.name,
      listeners: parseInt(a.listeners || "0"),
      url: a.url,
      image: getLargestImage(a.image || []),
    }));
    return NextResponse.json(results);
  } catch (error) {
    console.error("Last.fm search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
