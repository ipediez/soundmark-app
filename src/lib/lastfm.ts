const LASTFM_API_URL = "https://ws.audioscrobbler.com/2.0/";

interface LastFmArtist {
  name: string;
  listeners: string;
  url: string;
  image: { "#text": string; size: string }[];
}

interface LastFmAlbum {
  name: string;
  artist: { name: string; url: string };
  url: string;
  image: { "#text": string; size: string }[];
  playcount?: number;
}

interface LastFmAlbumInfo {
  name: string;
  artist: string;
  url: string;
  image: { "#text": string; size: string }[];
  listeners: string;
  playcount: string;
  tracks?: { track: { name: string; duration: string }[] };
  tags?: { tag: { name: string }[] };
  wiki?: { summary: string; content: string };
}

async function lastfmFetch(method: string, params: Record<string, string>) {
  const url = new URL(LASTFM_API_URL);
  url.searchParams.set("method", method);
  url.searchParams.set("api_key", process.env.LASTFM_API_KEY!);
  url.searchParams.set("format", "json");

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status}`);
  }
  return response.json();
}

export async function searchArtist(query: string): Promise<LastFmArtist[]> {
  const data = await lastfmFetch("artist.search", { artist: query, limit: "5" });
  return data.results?.artistmatches?.artist || [];
}

interface LastFmAlbumSearchResult {
  name: string;
  artist: string;
  url: string;
  image: { "#text": string; size: string }[];
}

export async function searchAlbum(query: string): Promise<LastFmAlbumSearchResult[]> {
  const data = await lastfmFetch("album.search", { album: query, limit: "5" });
  return data.results?.albummatches?.album || [];
}

export async function getArtistAlbums(artist: string): Promise<LastFmAlbum[]> {
  const data = await lastfmFetch("artist.gettopalbums", { artist, limit: "50" });
  return data.topalbums?.album || [];
}

export async function getAlbumInfo(artist: string, album: string): Promise<LastFmAlbumInfo | null> {
  try {
    const data = await lastfmFetch("album.getinfo", { artist, album });
    return data.album || null;
  } catch {
    return null;
  }
}

export async function getArtistInfo(artist: string): Promise<{ similar: { name: string; url: string }[] }> {
  try {
    const data = await lastfmFetch("artist.getinfo", { artist });
    const similar = data.artist?.similar?.artist || [];
    return {
      similar: similar.slice(0, 5).map((a: { name: string; url: string }) => ({
        name: a.name,
        url: a.url,
      })),
    };
  } catch {
    return { similar: [] };
  }
}

export function getLargestImage(images: { "#text": string; size: string }[]): string {
  const sizes = ["extralarge", "large", "medium", "small"];
  for (const size of sizes) {
    const img = images.find((i) => i.size === size);
    if (img && img["#text"]) return img["#text"];
  }
  return "";
}

export function extractTags(tags?: { tag: { name: string }[] }): { genre: string; subgenre: string } {
  const tagList = tags?.tag?.map((t) => t.name) || [];
  return {
    genre: tagList[0] || "",
    subgenre: tagList[1] || "",
  };
}

export function extractYear(wiki?: { summary: string }): number | null {
  if (!wiki?.summary) return null;
  const match = wiki.summary.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0]) : null;
}
