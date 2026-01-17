import * as XLSX from "xlsx";

interface ImportedEntry {
  artist: string;
  title: string;
  release_year: number | null;
  genre: string | null;
  subgenre: string | null;
  country: string | null;
  status: string;
  influence_notes: string | null;
}

interface ExportEntry {
  id: string;
  title: string;
  artist: string;
  genre: string | null;
  subgenre: string | null;
  country: string | null;
  release_year: number | null;
  status: string | null;
  rating: number | null;
  influence_notes: string | null;
  cover_image_url: string | null;
  lastfm_url: string | null;
  album_wiki: string | null;
  tracks: unknown;
  similar_artists: unknown;
  created_at: string;
}

export async function parseImportFile(file: File): Promise<ImportedEntry[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON with header row
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const entries: ImportedEntry[] = [];

  for (const row of rows) {
    const artist = row["BANDA"] as string;
    const title = row["BESTSELLER"] as string;

    // Skip rows without required fields
    if (!artist || !title) continue;

    // Parse ESCUCHADO - only accept boolean true, ignore strings like "A" or "E"
    const escuchado = row["ESCUCHADO"];
    const isListened = escuchado === true || escuchado === "TRUE" || escuchado === "true";
    const status = isListened ? "Finished" : "Queued";

    // Combine influence fields
    const pionera = row["PIONERA"] as string | undefined;
    const influenciadosPor = row["INFLUENCIADOS\nPOR"] as string | undefined;
    const influenceNotes = [pionera, influenciadosPor].filter(Boolean).join("\n\n") || null;

    // Parse year
    const yearRaw = row["AÑO BS"];
    const releaseYear = typeof yearRaw === "number" ? yearRaw : null;

    entries.push({
      artist: String(artist).trim(),
      title: String(title).trim(),
      release_year: releaseYear,
      genre: row["GÉNERO"] ? String(row["GÉNERO"]).trim() : null,
      subgenre: row["SUBGÉNERO"] ? String(row["SUBGÉNERO"]).trim() : null,
      country: row["PAÍS"] ? String(row["PAÍS"]).trim() : null,
      status,
      influence_notes: influenceNotes,
    });
  }

  return entries;
}

export function generateCompatibleExport(entries: ExportEntry[]): Blob {
  const data = entries.map((entry) => ({
    BANDA: entry.artist,
    BESTSELLER: entry.title,
    "AÑO BS": entry.release_year,
    GÉNERO: entry.genre,
    SUBGÉNERO: entry.subgenre,
    PAÍS: entry.country,
    ESCUCHADO: entry.status === "Finished",
    PIONERA: entry.influence_notes,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Library");

  const xlsxBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([xlsxBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function generateFullExport(entries: ExportEntry[]): Blob {
  const data = entries.map((entry) => ({
    Title: entry.title,
    Artist: entry.artist,
    Genre: entry.genre,
    Subgenre: entry.subgenre,
    Country: entry.country,
    "Release Year": entry.release_year,
    Status: entry.status,
    Rating: entry.rating,
    "Influence Notes": entry.influence_notes,
    "Cover URL": entry.cover_image_url,
    "Last.fm URL": entry.lastfm_url,
    Wiki: entry.album_wiki,
    Tracks: entry.tracks ? JSON.stringify(entry.tracks) : null,
    "Similar Artists": entry.similar_artists ? JSON.stringify(entry.similar_artists) : null,
    "Created At": entry.created_at,
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Library");

  const xlsxBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new Blob([xlsxBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
