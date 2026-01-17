"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star, Trash2, ExternalLink, Music } from "lucide-react";
import Link from "next/link";
import { FetchLastfmButton } from "@/components/album-detail/fetch-lastfm-button";

interface Track {
  name: string;
  duration: number;
}

interface AlbumDetailProps {
  entry: {
    id: string;
    title: string;
    artist: string;
    cover_image_url: string | null;
    genre: string | null;
    subgenre: string | null;
    release_year: number | null;
    status: string;
    rating: number | null;
    influence_notes: string | null;
    lastfm_url: string | null;
    tracks: Track[] | null;
    album_wiki: string | null;
    similar_artists: { name: string; url: string }[] | null;
  };
}

export function AlbumDetail({ entry }: AlbumDetailProps) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(entry.status);
  const [rating, setRating] = useState(entry.rating || 0);
  const [notes, setNotes] = useState(entry.influence_notes || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase
      .from("music_library")
      .update({
        status,
        rating: rating || null,
        influence_notes: notes || null,
      })
      .eq("id", entry.id);
    setSaving(false);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this album from your library?")) return;
    setDeleting(true);
    await supabase.from("music_library").delete().eq("id", entry.id);
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" />
        Back to Library
      </Link>

      {/* Hero section */}
      <div className="flex gap-8 mb-8">
        <div className="w-64 h-64 rounded-lg overflow-hidden bg-card flex-shrink-0 shadow-2xl">
          {entry.cover_image_url ? (
            <img
              src={entry.cover_image_url}
              alt={entry.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Music className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="flex flex-col justify-end">
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-2">Album</p>
          <h1 className="text-4xl font-bold mb-2">{entry.title}</h1>
          <p className="text-xl text-muted-foreground mb-4">{entry.artist}</p>
          <div className="flex items-center gap-3">
            {entry.genre && <Badge variant="secondary">{entry.genre}</Badge>}
            {entry.subgenre && <Badge variant="outline">{entry.subgenre}</Badge>}
            {entry.release_year && (
              <span className="text-sm text-muted-foreground">{entry.release_year}</span>
            )}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-4 mb-8 p-4 bg-card rounded-lg">
        <div className="flex-1 flex items-center gap-4">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Queued">Queued</SelectItem>
              <SelectItem value="Listening">Listening</SelectItem>
              <SelectItem value="Finished">Finished</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(rating === star ? 0 : star)}>
                <Star
                  className={`h-5 w-5 ${
                    star <= rating ? "fill-primary text-primary" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>

        <Button variant="destructive" size="icon" onClick={handleDelete} disabled={deleting}>
          <Trash2 className="h-4 w-4" />
        </Button>

        <FetchLastfmButton entry={entry} />

        {entry.lastfm_url && (
          <a href={entry.lastfm_url} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="icon">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        )}
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Main content */}
        <div className="col-span-2 space-y-6">
          {/* Tracklist */}
          {entry.tracks && entry.tracks.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Tracklist</h2>
              <div className="bg-card rounded-lg overflow-hidden">
                {entry.tracks.map((track, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-accent/50 transition-colors"
                  >
                    <span className="text-muted-foreground w-6 text-right">{index + 1}</span>
                    <span className="flex-1">{track.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About */}
          {entry.album_wiki && (
            <div>
              <h2 className="text-lg font-semibold mb-4">About</h2>
              <p className="text-muted-foreground leading-relaxed">{entry.album_wiki}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Your notes */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Your Notes</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why do you like this album?"
              rows={6}
            />
          </div>

          {/* Similar artists */}
          {entry.similar_artists && entry.similar_artists.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4">Similar Artists</h2>
              <div className="flex flex-wrap gap-2">
                {entry.similar_artists.map((artist) => (
                  <a
                    key={artist.name}
                    href={artist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge variant="outline" className="hover:bg-accent cursor-pointer">
                      {artist.name}
                    </Badge>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
