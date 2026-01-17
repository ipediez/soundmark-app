"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Music } from "lucide-react";

interface Artist {
  name: string;
  listeners: number;
  image: string;
}

interface ArtistSearchProps {
  onSelectArtist: (artist: string) => void;
  onManualEntry: () => void;
}

export function ArtistSearch({ onSelectArtist, onManualEntry }: ArtistSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchArtists = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const res = await fetch(`/api/lastfm/search-artist?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(searchArtists, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search for an artist..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading && <p className="text-sm text-muted-foreground">Searching...</p>}

      {results.length > 0 && (
        <div className="border border-border rounded-lg overflow-hidden">
          {results.map((artist) => (
            <button
              key={artist.name}
              onClick={() => onSelectArtist(artist.name)}
              className="w-full flex items-center gap-3 p-3 hover:bg-accent transition-colors text-left"
            >
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                {artist.image ? (
                  <img src={artist.image} alt={artist.name} className="w-full h-full object-cover" />
                ) : (
                  <Music className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium">{artist.name}</p>
                <p className="text-sm text-muted-foreground">
                  {artist.listeners.toLocaleString()} listeners
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="text-center py-4">
          <p className="text-muted-foreground mb-2">No artists found</p>
          <Button variant="outline" onClick={onManualEntry}>
            Enter album details manually
          </Button>
        </div>
      )}

      <div className="text-center">
        <Button variant="link" onClick={onManualEntry} className="text-muted-foreground">
          Or enter album details manually
        </Button>
      </div>
    </div>
  );
}
