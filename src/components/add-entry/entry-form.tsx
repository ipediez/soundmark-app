"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, Music } from "lucide-react";

interface AlbumData {
  title: string;
  artist: string;
  image: string;
  genre: string;
  subgenre: string;
  releaseYear: number | null;
  tracks: { name: string; duration: number }[];
  wiki: string;
  url: string;
  similarArtists: { name: string; url: string }[];
}

interface EntryFormProps {
  artist?: string;
  album?: string;
  onBack: () => void;
  isManual?: boolean;
}

export function EntryForm({ artist, album, onBack, isManual }: EntryFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(!isManual);
  const [saving, setSaving] = useState(false);
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [artistName, setArtistName] = useState(artist || "");
  const [coverUrl, setCoverUrl] = useState("");
  const [genre, setGenre] = useState("");
  const [subgenre, setSubgenre] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [status, setStatus] = useState("Queued");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const fetchAlbumInfo = async () => {
      if (!artist || !album || isManual) return;

      try {
        const res = await fetch(
          `/api/lastfm/album-info?artist=${encodeURIComponent(artist)}&album=${encodeURIComponent(album)}`
        );
        const data = await res.json();

        setAlbumData(data);
        setTitle(data.title || album);
        setArtistName(data.artist || artist);
        setCoverUrl(data.image || "");
        setGenre(data.genre || "");
        setSubgenre(data.subgenre || "");
        setReleaseYear(data.releaseYear?.toString() || "");
      } catch (error) {
        console.error("Failed to fetch album info:", error);
        setTitle(album);
        setArtistName(artist);
      } finally {
        setLoading(false);
      }
    };

    fetchAlbumInfo();
  }, [artist, album, isManual]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    // Check album limit before adding
    try {
      const res = await fetch("/api/beta/check-album-limit");
      const limitData = await res.json();
      if (!limitData.canAddAlbum) {
        alert(`Album limit reached! Beta users can have up to ${limitData.maxAlbums} albums.`);
        setSaving(false);
        return;
      }
    } catch {
      // Continue if check fails
    }

    const entry = {
      user_id: user.id,
      title,
      artist: artistName,
      cover_image_url: coverUrl || null,
      genre: genre || null,
      subgenre: subgenre || null,
      release_year: releaseYear ? parseInt(releaseYear) : null,
      status,
      rating: rating || null,
      influence_notes: notes || null,
      lastfm_url: albumData?.url || null,
      tracks: albumData?.tracks || null,
      album_wiki: albumData?.wiki || null,
      similar_artists: albumData?.similarArtists || null,
    };

    const { error } = await supabase.from("music_library").insert(entry);

    if (error) {
      console.error("Failed to save:", error.message, error.details, error.hint);
      alert(`Failed to save entry: ${error.message}`);
      setSaving(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Loading album info...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {isManual ? "Add Album Manually" : "Add to Library"}
        </h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Album preview */}
        <div className="flex gap-4">
          <div className="w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
            {coverUrl ? (
              <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="space-y-2 flex-1">
            <div>
              <Label htmlFor="title">Album Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="artist">Artist</Label>
              <Input
                id="artist"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Metadata fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="genre">Genre</Label>
            <Input
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="e.g., Rock"
            />
          </div>
          <div>
            <Label htmlFor="subgenre">Subgenre</Label>
            <Input
              id="subgenre"
              value={subgenre}
              onChange={(e) => setSubgenre(e.target.value)}
              placeholder="e.g., Alternative"
            />
          </div>
          <div>
            <Label htmlFor="year">Release Year</Label>
            <Input
              id="year"
              type="number"
              value={releaseYear}
              onChange={(e) => setReleaseYear(e.target.value)}
              placeholder="e.g., 1997"
            />
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Queued">Queued</SelectItem>
                <SelectItem value="Listening">Listening</SelectItem>
                <SelectItem value="Finished">Finished</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rating */}
        <div>
          <Label>Rating</Label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? 0 : star)}
                className="p-1"
              >
                <Star
                  className={`h-6 w-6 ${
                    star <= rating
                      ? "fill-primary text-primary"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <button
                type="button"
                onClick={() => setRating(0)}
                className="text-sm text-muted-foreground ml-2"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Your Notes</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Why do you like this album? What makes it special?"
            rows={4}
          />
        </div>

        {/* Submit */}
        <Button type="submit" className="w-full" disabled={saving}>
          {saving ? "Saving..." : "Add to Library"}
        </Button>
      </form>
    </div>
  );
}
