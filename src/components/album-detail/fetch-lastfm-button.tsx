"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw, Loader2, Music, ArrowLeft } from "lucide-react";

interface AlbumSearchResult {
  name: string;
  artist: string;
  url: string;
  image: string;
}

interface AlbumInfo {
  title: string;
  artist: string;
  image: string;
  url: string;
  genre: string;
  subgenre: string;
  releaseYear: number | null;
  tracks: { name: string; duration: number }[];
  wiki: string;
  similarArtists: { name: string; url: string }[];
}

interface CurrentEntry {
  id: string;
  title: string;
  artist: string;
  cover_image_url: string | null;
  genre: string | null;
  subgenre: string | null;
  release_year: number | null;
  tracks: { name: string; duration: number }[] | null;
  album_wiki: string | null;
  similar_artists: { name: string; url: string }[] | null;
  lastfm_url: string | null;
}

interface FetchLastfmButtonProps {
  entry: CurrentEntry;
}

type FieldKey = "cover" | "genre" | "subgenre" | "year" | "tracks" | "wiki" | "similar" | "url";

interface FieldConfig {
  key: FieldKey;
  label: string;
  currentValue: unknown;
  newValue: unknown;
  displayCurrent: string;
  displayNew: string;
}

export function FetchLastfmButton({ entry }: FetchLastfmButtonProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [screen, setScreen] = useState<"search" | "preview">("search");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<AlbumSearchResult[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumInfo | null>(null);
  const [selectedFields, setSelectedFields] = useState<Set<FieldKey>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setIsOpen(true);
    setScreen("search");
    setError(null);
    setLoading(true);
    setSearchResults([]);

    try {
      const query = `${entry.artist} ${entry.title}`;
      const response = await fetch(`/api/lastfm/search-album?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const results = await response.json();
      setSearchResults(results);
    } catch (err) {
      setError("Failed to search Last.fm");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAlbum = async (result: AlbumSearchResult) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/lastfm/album-info?artist=${encodeURIComponent(result.artist)}&album=${encodeURIComponent(result.name)}`
      );
      if (!response.ok) throw new Error("Failed to fetch album info");
      const albumInfo: AlbumInfo = await response.json();
      setSelectedAlbum(albumInfo);

      // Initialize selected fields: check empty fields by default
      const initialSelected = new Set<FieldKey>();
      if (!entry.cover_image_url && albumInfo.image) initialSelected.add("cover");
      if (!entry.genre && albumInfo.genre) initialSelected.add("genre");
      if (!entry.subgenre && albumInfo.subgenre) initialSelected.add("subgenre");
      if (!entry.release_year && albumInfo.releaseYear) initialSelected.add("year");
      if ((!entry.tracks || entry.tracks.length === 0) && albumInfo.tracks.length > 0) initialSelected.add("tracks");
      if (!entry.album_wiki && albumInfo.wiki) initialSelected.add("wiki");
      if ((!entry.similar_artists || entry.similar_artists.length === 0) && albumInfo.similarArtists.length > 0) initialSelected.add("similar");
      if (!entry.lastfm_url && albumInfo.url) initialSelected.add("url");
      setSelectedFields(initialSelected);

      setScreen("preview");
    } catch (err) {
      setError("Failed to fetch album details");
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (field: FieldKey) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const handleApply = async () => {
    if (!selectedAlbum) return;

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};

      if (selectedFields.has("cover")) updates.cover_image_url = selectedAlbum.image;
      if (selectedFields.has("genre")) updates.genre = selectedAlbum.genre;
      if (selectedFields.has("subgenre")) updates.subgenre = selectedAlbum.subgenre;
      if (selectedFields.has("year")) updates.release_year = selectedAlbum.releaseYear;
      if (selectedFields.has("tracks")) updates.tracks = selectedAlbum.tracks;
      if (selectedFields.has("wiki")) updates.album_wiki = selectedAlbum.wiki;
      if (selectedFields.has("similar")) updates.similar_artists = selectedAlbum.similarArtists;
      if (selectedFields.has("url")) updates.lastfm_url = selectedAlbum.url;

      if (Object.keys(updates).length > 0) {
        await supabase.from("music_library").update(updates).eq("id", entry.id);
      }

      setIsOpen(false);
      router.refresh();
    } catch (err) {
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!loading && !saving) {
      setIsOpen(false);
      setScreen("search");
      setSelectedAlbum(null);
      setSearchResults([]);
      setError(null);
    }
  };

  const handleBack = () => {
    setScreen("search");
    setSelectedAlbum(null);
  };

  const getFieldConfigs = (): FieldConfig[] => {
    if (!selectedAlbum) return [];

    return [
      {
        key: "cover" as FieldKey,
        label: "Cover Image",
        currentValue: entry.cover_image_url,
        newValue: selectedAlbum.image,
        displayCurrent: entry.cover_image_url ? "Has image" : "(empty)",
        displayNew: selectedAlbum.image ? "New image" : "(none)",
      },
      {
        key: "genre" as FieldKey,
        label: "Genre",
        currentValue: entry.genre,
        newValue: selectedAlbum.genre,
        displayCurrent: entry.genre || "(empty)",
        displayNew: selectedAlbum.genre || "(none)",
      },
      {
        key: "subgenre" as FieldKey,
        label: "Subgenre",
        currentValue: entry.subgenre,
        newValue: selectedAlbum.subgenre,
        displayCurrent: entry.subgenre || "(empty)",
        displayNew: selectedAlbum.subgenre || "(none)",
      },
      {
        key: "year" as FieldKey,
        label: "Release Year",
        currentValue: entry.release_year,
        newValue: selectedAlbum.releaseYear,
        displayCurrent: entry.release_year?.toString() || "(empty)",
        displayNew: selectedAlbum.releaseYear?.toString() || "(none)",
      },
      {
        key: "tracks" as FieldKey,
        label: "Tracks",
        currentValue: entry.tracks,
        newValue: selectedAlbum.tracks,
        displayCurrent: entry.tracks?.length ? `${entry.tracks.length} tracks` : "(empty)",
        displayNew: selectedAlbum.tracks.length ? `${selectedAlbum.tracks.length} tracks` : "(none)",
      },
      {
        key: "wiki" as FieldKey,
        label: "Wiki",
        currentValue: entry.album_wiki,
        newValue: selectedAlbum.wiki,
        displayCurrent: entry.album_wiki ? `${entry.album_wiki.substring(0, 30)}...` : "(empty)",
        displayNew: selectedAlbum.wiki ? `${selectedAlbum.wiki.substring(0, 30)}...` : "(none)",
      },
      {
        key: "similar" as FieldKey,
        label: "Similar Artists",
        currentValue: entry.similar_artists,
        newValue: selectedAlbum.similarArtists,
        displayCurrent: entry.similar_artists?.length ? `${entry.similar_artists.length} artists` : "(empty)",
        displayNew: selectedAlbum.similarArtists.length ? `${selectedAlbum.similarArtists.length} artists` : "(none)",
      },
      {
        key: "url" as FieldKey,
        label: "Last.fm URL",
        currentValue: entry.lastfm_url,
        newValue: selectedAlbum.url,
        displayCurrent: entry.lastfm_url ? "Has link" : "(empty)",
        displayNew: selectedAlbum.url ? "New link" : "(none)",
      },
    ];
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={handleOpen} title="Fetch from Last.fm">
        <RefreshCw className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {screen === "search" ? "Search Last.fm" : "Review Changes"}
            </DialogTitle>
            <DialogDescription>
              {screen === "search"
                ? `Finding matches for "${entry.title}" by ${entry.artist}`
                : "Select which fields to update"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded">
              {error}
            </div>
          )}

          {screen === "search" && (
            <div className="space-y-2">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No results found</p>
              ) : (
                searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAlbum(result)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded bg-card flex-shrink-0 overflow-hidden">
                      {result.image ? (
                        <img src={result.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{result.artist}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}

          {screen === "preview" && selectedAlbum && (
            <div className="space-y-4">
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-3 w-3" />
                Back to results
              </button>

              <div className="flex items-center gap-3 p-3 bg-card rounded-lg">
                <div className="w-16 h-16 rounded bg-accent flex-shrink-0 overflow-hidden">
                  {selectedAlbum.image ? (
                    <img src={selectedAlbum.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedAlbum.title}</p>
                  <p className="text-sm text-muted-foreground">{selectedAlbum.artist}</p>
                </div>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {getFieldConfigs().map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-3 p-2 rounded hover:bg-accent/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedFields.has(field.key)}
                      onCheckedChange={() => toggleField(field.key)}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {field.displayCurrent} → {field.displayNew}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={handleApply}
                  disabled={saving || selectedFields.size === 0}
                  className="flex-1"
                >
                  {saving ? "Applying..." : `Apply ${selectedFields.size} Changes`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
