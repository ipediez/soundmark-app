import Link from "next/link";
import { Music } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AlbumCardProps {
  id: string;
  title: string;
  artist: string;
  coverUrl: string | null;
  status: string;
  rating: number | null;
}

export function AlbumCard({ id, title, artist, coverUrl, status, rating }: AlbumCardProps) {
  const statusColors: Record<string, string> = {
    Queued: "bg-muted text-muted-foreground",
    Listening: "bg-primary/20 text-primary",
    Finished: "bg-green-500/20 text-green-500",
  };

  return (
    <Link href={`/album/${id}`} className="group">
      <div className="aspect-square rounded-lg overflow-hidden bg-card mb-3 relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-12 w-12 text-muted-foreground" />
          </div>
        )}
        <Badge className={`absolute top-2 right-2 ${statusColors[status] || statusColors.Queued}`}>
          {status}
        </Badge>
      </div>
      <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground truncate">{artist}</p>
      {rating && (
        <div className="flex gap-0.5 mt-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={star <= rating ? "text-primary" : "text-muted-foreground/30"}
            >
              ★
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
