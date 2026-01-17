"use client";

import { useState } from "react";
import { ArtistSearch } from "@/components/add-entry/artist-search";
import { AlbumGrid } from "@/components/add-entry/album-grid";
import { EntryForm } from "@/components/add-entry/entry-form";

type Step = "search" | "albums" | "form";

export default function AddEntryPage() {
  const [step, setStep] = useState<Step>("search");
  const [selectedArtist, setSelectedArtist] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState("");
  const [isManual, setIsManual] = useState(false);

  const handleSelectArtist = (artist: string) => {
    setSelectedArtist(artist);
    setStep("albums");
  };

  const handleSelectAlbum = (album: string) => {
    setSelectedAlbum(album);
    setIsManual(false);
    setStep("form");
  };

  const handleManualEntry = () => {
    setIsManual(true);
    setStep("form");
  };

  const handleBack = () => {
    if (step === "form") {
      setStep(isManual ? "search" : "albums");
    } else if (step === "albums") {
      setStep("search");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Add Album</h2>

      {step === "search" && (
        <ArtistSearch
          onSelectArtist={handleSelectArtist}
          onManualEntry={handleManualEntry}
        />
      )}

      {step === "albums" && (
        <AlbumGrid
          artist={selectedArtist}
          onSelectAlbum={handleSelectAlbum}
          onBack={() => setStep("search")}
          onManualEntry={handleManualEntry}
        />
      )}

      {step === "form" && (
        <EntryForm
          artist={selectedArtist}
          album={selectedAlbum}
          onBack={handleBack}
          isManual={isManual}
        />
      )}
    </div>
  );
}
