"use client";

import { ReturningPlayersTable } from "@/components/ReturningPlayersTable";
import { SelectedPlayersPane } from "@/components/SelectedPlayersPane";
import { PositionSummaryPane } from "@/components/PositionSummaryPane";
import { RookiesTable } from "@/components/RookiesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [rightRailOpen, setRightRailOpen] = useState(true);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">DGLFFL Draft Dashboard</h1>
        <Button
          variant="outline"
          size="icon"
          aria-label={rightRailOpen ? "Collapse side rail" : "Expand side rail"}
          title={rightRailOpen ? "Collapse side rail" : "Expand side rail"}
          onClick={() => setRightRailOpen((prev) => !prev)}
        >
          {rightRailOpen ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 xl:flex-row">
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <Tabs defaultValue="returning" className="w-full">
            <TabsList
              variant="line"
              className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0"
            >
              <TabsTrigger
                value="returning"
                className="rounded-none border-0 border-b-2 border-transparent px-4 py-2 text-sm data-[state=active]:border-foreground dark:data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:hidden"
              >
                Returning Players
              </TabsTrigger>
              <TabsTrigger
                value="rookies"
                className="rounded-none border-0 border-b-2 border-transparent px-4 py-2 text-sm data-[state=active]:border-foreground dark:data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none after:hidden"
              >
                Rookies
              </TabsTrigger>
            </TabsList>
            <TabsContent value="returning" className="mt-3">
              <ReturningPlayersTable />
            </TabsContent>
            <TabsContent value="rookies" className="mt-3">
              <RookiesTable />
            </TabsContent>
          </Tabs>
        </div>

        <Collapsible
          open={rightRailOpen}
          onOpenChange={setRightRailOpen}
          className={`min-h-0 shrink-0 transition-[width] duration-300 ease-in-out xl:overflow-hidden ${
            rightRailOpen ? "w-full xl:w-[360px]" : "xl:w-0"
          }`}
        >
          <CollapsibleContent
            forceMount
            className="h-full transition-[max-height,opacity] duration-300 ease-in-out data-[state=closed]:max-h-0 data-[state=open]:max-h-[2000px] data-[state=closed]:opacity-0 data-[state=open]:opacity-100 xl:max-h-none xl:opacity-100"
          >
            <div className="h-full space-y-4 overflow-y-auto xl:w-[360px]">
              <PositionSummaryPane />
              <SelectedPlayersPane />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
