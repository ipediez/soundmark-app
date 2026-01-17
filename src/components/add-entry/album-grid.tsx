"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Music } from "lucide-react";

interface Album {
  name: string;
  artist: string;
  image: string;
}

interface AlbumGridProps {
  artist: string;
  onSelectAlbum: (album: string) => void;
  onBack: () => void;
  onManualEntry: () => void;
}

export function AlbumGrid({ artist, onSelectAlbum, onBack, onManualEntry }: AlbumGridProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        const res = await fetch(`/api/lastfm/artist-albums?artist=${encodeURIComponent(artist)}`);
        const data = await res.json();
        setAlbums(data);
      } catch (error) {
        console.error("Failed to fetch albums:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, [artist]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h3 className="font-semibold">{artist}</h3>
          <p className="text-sm text-muted-foreground">Select an album</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading albums...</p>
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {albums.map((album) => (
            <button
              key={album.name}
              onClick={() => onSelectAlbum(album.name)}
              className="group text-left"
            >
              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 group-hover:ring-2 ring-primary transition-all">
                {album.image ? (
                  <img
                    src={album.image}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-sm font-medium truncate">{album.name}</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">No albums found</p>
        </div>
      )}

      <div className="text-center pt-4 border-t border-border">
        <Button variant="link" onClick={onManualEntry}>
          Album not listed? Add manually
        </Button>
      </div>
    </div>
  );
}
