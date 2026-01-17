import { NextResponse } from "next/server";
import { getAlbumInfo, getArtistInfo, getLargestImage, extractTags, extractYear } from "@/lib/lastfm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const artist = searchParams.get("artist");
  const album = searchParams.get("album");

  if (!artist || !album) {
    return NextResponse.json({ error: "Artist and album required" }, { status: 400 });
  }

  try {
    const [albumInfo, artistInfo] = await Promise.all([
      getAlbumInfo(artist, album),
      getArtistInfo(artist),
    ]);

    if (!albumInfo) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const { genre, subgenre } = extractTags(albumInfo.tags);
    const tracks = albumInfo.tracks?.track?.map((t) => ({
      name: t.name,
      duration: parseInt(t.duration || "0"),
    })) || [];

    return NextResponse.json({
      title: albumInfo.name,
      artist: albumInfo.artist,
      image: getLargestImage(albumInfo.image || []),
      url: albumInfo.url,
      genre,
      subgenre,
      releaseYear: extractYear(albumInfo.wiki),
      tracks,
      wiki: albumInfo.wiki?.summary?.replace(/<[^>]*>/g, "") || "",
      similarArtists: artistInfo.similar,
      listeners: parseInt(albumInfo.listeners || "0"),
      playcount: parseInt(albumInfo.playcount || "0"),
    });
  } catch (error) {
    console.error("Last.fm album info error:", error);
    return NextResponse.json({ error: "Failed to fetch album info" }, { status: 500 });
  }
}
