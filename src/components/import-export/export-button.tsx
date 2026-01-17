"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { generateCompatibleExport, generateFullExport, downloadBlob } from "@/lib/xlsx-utils";

export function ExportButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleExport = async (format: "compatible" | "full") => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/library/export");
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Export failed");
      }

      if (!result.entries || result.entries.length === 0) {
        toast.error("No entries to export");
        return;
      }

      // Generate xlsx based on format
      const blob =
        format === "compatible"
          ? generateCompatibleExport(result.entries)
          : generateFullExport(result.entries);

      // Download the file
      const date = new Date().toISOString().split("T")[0];
      const filename = `soundmark-export-${date}${format === "full" ? "-full" : ""}.xlsx`;
      downloadBlob(blob, filename);

      toast.success(`Exported ${result.entries.length} albums`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={isLoading} className="cursor-pointer">
        <Download className="mr-2 h-4 w-4" />
        {isLoading ? "Exporting..." : "Export Library"}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem onClick={() => handleExport("compatible")} className="cursor-pointer">
          Compatible format
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("full")} className="cursor-pointer">
          Full export
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
