"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ORDER_OPTIONS = [
  { value: "created_at", label: "Date Added" },
  { value: "artist", label: "Artist Name" },
  { value: "title", label: "Album Name" },
  { value: "release_year", label: "Release Year" },
  { value: "genre", label: "Genre" },
] as const;

export type OrderByValue = (typeof ORDER_OPTIONS)[number]["value"];

export function OrderBySelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentOrder = (searchParams.get("orderBy") as OrderByValue) || "created_at";

  const handleChange = (value: OrderByValue) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "created_at") {
      params.delete("orderBy");
    } else {
      params.set("orderBy", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <Select value={currentOrder} onValueChange={handleChange}>
      <SelectTrigger className="w-40">
        <SelectValue placeholder="Sort by" />
      </SelectTrigger>
      <SelectContent>
        {ORDER_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
