"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Library, Clock, Headphones, CheckCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Library", icon: Library, status: null },
  { href: "/?status=Queued", label: "Queued", icon: Clock, status: "Queued" },
  { href: "/?status=Listening", label: "Listening", icon: Headphones, status: "Listening" },
  { href: "/?status=Finished", label: "Finished", icon: CheckCircle, status: "Finished" },
];

export function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status");

  return (
    <aside className="w-64 border-r border-border h-[calc(100vh-4rem)] p-4 flex flex-col">
      <Link href="/add">
        <Button className="w-full mb-6">
          <Plus className="mr-2 h-4 w-4" />
          Add Album
        </Button>
      </Link>
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === "/" && item.status === currentStatus;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
