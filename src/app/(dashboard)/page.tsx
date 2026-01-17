import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/album-card";
import { Music } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { OrderBySelect, type OrderByValue } from "@/components/library/order-by-select";
import { SearchBar } from "@/components/library/search-bar";

interface PageProps {
  searchParams: Promise<{ status?: string; orderBy?: OrderByValue; q?: string }>;
}

interface LibraryEntry {
  id: string;
  title: string;
  artist: string;
  cover_image_url: string | null;
  status: string | null;
  rating: number | null;
  release_year: number | null;
  genre: string | null;
  created_at: string;
}

function filterEntries(entries: LibraryEntry[], query: string): LibraryEntry[] {
  if (!query.trim()) return entries;
  const searchTerm = query.toUpperCase();
  return entries.filter(
    (entry) =>
      entry.artist.toUpperCase().includes(searchTerm) ||
      entry.title.toUpperCase().includes(searchTerm) ||
      (entry.genre && entry.genre.toUpperCase().includes(searchTerm))
  );
}

function sortEntries(entries: LibraryEntry[], orderBy: OrderByValue): LibraryEntry[] {
  return [...entries].sort((a, b) => {
    switch (orderBy) {
      case "artist": {
        const aVal = (a.artist || "").toUpperCase();
        const bVal = (b.artist || "").toUpperCase();
        return aVal.localeCompare(bVal);
      }
      case "title": {
        const aVal = (a.title || "").toUpperCase();
        const bVal = (b.title || "").toUpperCase();
        return aVal.localeCompare(bVal);
      }
      case "release_year": {
        const aVal = a.release_year ?? 0;
        const bVal = b.release_year ?? 0;
        return bVal - aVal; // Newest first
      }
      case "genre": {
        const aVal = (a.genre || "").toUpperCase();
        const bVal = (b.genre || "").toUpperCase();
        return aVal.localeCompare(bVal);
      }
      case "created_at":
      default: {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    }
  });
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { status, orderBy = "created_at", q = "" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("music_library").select("*");

  if (status) {
    query = query.eq("status", status);
  }

  const { data: rawEntries } = await query;
  const filteredEntries = rawEntries ? filterEntries(rawEntries as LibraryEntry[], q) : null;
  const entries = filteredEntries ? sortEntries(filteredEntries, orderBy) : null;

  const title = status ? status : "Your Library";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex items-center gap-4">
          <SearchBar />
          <p className="text-muted-foreground">
            {entries ? entries.length : 0} albums
          </p>
          <OrderBySelect />
        </div>
      </div>

      {entries && entries.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {entries.map((entry) => (
            <AlbumCard
              key={entry.id}
              id={entry.id}
              title={entry.title}
              artist={entry.artist}
              coverUrl={entry.cover_image_url}
              status={entry.status || "Queued"}
              rating={entry.rating}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Music className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground mb-4">
            {q
              ? `No results for "${q}"`
              : status
                ? `No ${status.toLowerCase()} albums`
                : "Your library is empty"}
          </p>
          {!q && (
            <Link href="/add">
              <Button>Add your first album</Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
