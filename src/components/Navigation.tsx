"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggleButton } from "@/components/ThemeToggleButton";
import { UploadSpreadsheetDialog } from "@/components/UploadSpreadsheetDialog";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Draft Board", href: "/" },
  { label: "QB Draft", href: "/qb-draft" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/dglffl-logo.png"
              alt="DGLFFL logo"
              width={28}
              height={28}
              className="size-7 object-contain"
              priority
            />
            <span className="hidden text-sm font-semibold tracking-tight sm:inline">
              DGLFFL Draft Dashboard
            </span>
          </Link>
          <Separator orientation="vertical" className="hidden h-5 md:block" />
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground",
                  pathname === item.href &&
                    "border-foreground text-foreground"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <UploadSpreadsheetDialog compact />
          <ThemeToggleButton />
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggleButton />
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open navigation">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle>DGLFFL Draft Dashboard</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground",
                      pathname === item.href && "bg-muted text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6">
                <UploadSpreadsheetDialog />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
