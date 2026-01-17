"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { parseImportFile } from "@/lib/xlsx-utils";

type ImportStatus = "idle" | "parsing" | "importing" | "success" | "error";

interface ImportResult {
  imported: number;
  updated: number;
  errors: string[];
}

export function ImportButton() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalEntries, setTotalEntries] = useState(0);
  const [processedEntries, setProcessedEntries] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetState = () => {
    setStatus("idle");
    setProgress(0);
    setTotalEntries(0);
    setProcessedEntries(0);
    setResult(null);
    setErrorMessage("");
  };

  const handleClick = (e: Event) => {
    e.preventDefault();
    // Small delay to ensure the dropdown has processed the event
    setTimeout(() => {
      fileInputRef.current?.click();
    }, 100);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!file.name.endsWith(".xlsx")) {
      setErrorMessage("Please select a valid .xlsx file");
      setStatus("error");
      setIsDialogOpen(true);
      return;
    }

    resetState();
    setIsDialogOpen(true);
    setStatus("parsing");

    try {
      const entries = await parseImportFile(file);

      if (entries.length === 0) {
        setErrorMessage("No valid entries found in the file");
        setStatus("error");
        return;
      }

      setTotalEntries(entries.length);
      setStatus("importing");

      // Process in batches of 50
      const BATCH_SIZE = 50;
      let totalImported = 0;
      let totalUpdated = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);

        const response = await fetch("/api/library/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ entries: batch }),
        });

        const batchResult = await response.json();

        if (!response.ok) {
          throw new Error(batchResult.error || "Import failed");
        }

        totalImported += batchResult.imported || 0;
        totalUpdated += batchResult.updated || 0;
        if (batchResult.errors?.length) {
          allErrors.push(...batchResult.errors);
        }

        const processed = Math.min(i + BATCH_SIZE, entries.length);
        setProcessedEntries(processed);
        setProgress((processed / entries.length) * 100);
      }

      setResult({
        imported: totalImported,
        updated: totalUpdated,
        errors: allErrors,
      });
      setStatus("success");
      router.refresh();
    } catch (error) {
      console.error("Import error:", error);
      setErrorMessage(error instanceof Error ? error.message : "Import failed");
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status !== "parsing" && status !== "importing") {
      setIsDialogOpen(false);
      resetState();
    }
  };

  return (
    <>
      <DropdownMenuItem onClick={handleClick} className="cursor-pointer">
        <Upload className="mr-2 h-4 w-4" />
        Import Library
      </DropdownMenuItem>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx"
        onChange={handleFileChange}
        className="hidden"
      />

      {mounted && <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent showCloseButton={status !== "parsing" && status !== "importing"}>
          <DialogHeader>
            <DialogTitle>
              {status === "parsing" && "Reading file..."}
              {status === "importing" && "Importing library"}
              {status === "success" && "Import complete"}
              {status === "error" && "Import failed"}
            </DialogTitle>
            <DialogDescription>
              {status === "parsing" && "Parsing your xlsx file..."}
              {status === "importing" && `Processing ${totalEntries} entries`}
              {status === "success" && "Your library has been updated"}
              {status === "error" && errorMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {(status === "parsing" || status === "importing") && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {status === "parsing"
                      ? "Reading entries from file..."
                      : `Importing ${processedEntries} of ${totalEntries} entries...`}
                  </span>
                </div>
                {status === "importing" && (
                  <Progress value={progress} max={100} />
                )}
              </div>
            )}

            {status === "success" && result && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Successfully imported!</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  {result.imported > 0 && <p>{result.imported} new albums added</p>}
                  {result.updated > 0 && <p>{result.updated} albums updated</p>}
                  {result.errors.length > 0 && (
                    <p className="text-yellow-500">{result.errors.length} entries had errors</p>
                  )}
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="flex items-center gap-3 text-red-500">
                <XCircle className="h-5 w-5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {(status === "success" || status === "error") && (
              <Button onClick={handleClose} className="w-full">
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>}
    </>
  );
}
