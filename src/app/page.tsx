import { ReturningPlayersTable } from "@/components/ReturningPlayersTable";
import { SelectedPlayersPane } from "@/components/SelectedPlayersPane";
import { PositionSummaryPane } from "@/components/PositionSummaryPane";
import { RookiesTable } from "@/components/RookiesTable";

export default function Home() {
  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Fall 2025 Draft Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <ReturningPlayersTable />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <SelectedPlayersPane />
        </div>

        <div className="lg:col-span-8 space-y-4">
          <RookiesTable />
        </div>

        <div className="lg:col-span-4 space-y-4">
          <PositionSummaryPane />
        </div>
      </div>
    </div>
  );
}
