import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumDetail } from "@/components/album-detail";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AlbumPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: entry } = await supabase
    .from("music_library")
    .select("*")
    .eq("id", id)
    .single();

  if (!entry) {
    notFound();
  }

  return <AlbumDetail entry={entry} />;
}
