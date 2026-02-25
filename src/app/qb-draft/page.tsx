import { QbDraftTable } from "@/components/QbDraftTable";

export default function QbDraftPage() {
  return (
    <div className="flex h-full flex-col overflow-y-auto py-4">
      <h1 className="shrink-0 text-2xl font-semibold tracking-tight">QB Draft</h1>
      <div className="mt-4 min-h-0 flex-1">
        <QbDraftTable />
      </div>
    </div>
  );
}
