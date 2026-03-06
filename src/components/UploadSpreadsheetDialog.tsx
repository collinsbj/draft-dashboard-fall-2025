"use client";

import { useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type UploadTableType = "qbs" | "players";

type UploadSpreadsheetDialogProps = {
  defaultTableType?: UploadTableType;
  onUploaded?: () => void;
  compact?: boolean;
};

const TABLE_OPTIONS: Array<{ value: UploadTableType; label: string }> = [
  { value: "qbs", label: "QBs" },
  { value: "players", label: "Returning Players / Rookies" },
];

export function UploadSpreadsheetDialog({
  defaultTableType = "qbs",
  onUploaded,
  compact = false,
}: UploadSpreadsheetDialogProps) {
  const [open, setOpen] = useState(false);
  const [tableType, setTableType] = useState<UploadTableType>(defaultTableType);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select an .xlsx file.");
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    try {
      const payload = new FormData();
      payload.set("tableType", tableType);
      payload.set("file", file);

      const response = await fetch("/api/upload", { method: "POST", body: payload });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error ?? "Upload failed");
      }

      if (data.returning && data.rookies) {
        toast.success(
          `Upload complete: ${data.returning.addedOrUpdated} returning + ${data.rookies.addedOrUpdated} rookies synced.`,
        );
      } else {
        toast.success(
          `Upload complete: ${data.addedOrUpdated} rows synced, ${data.removed} removed.`,
        );
      }
      setOpen(false);
      setFile(null);
      onUploaded?.();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to upload spreadsheet.";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={compact ? "sm" : "default"} variant="outline">
          <Upload className="mr-2 size-4" />
          Upload
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Spreadsheet</DialogTitle>
          <DialogDescription>
            Choose which table to sync, then upload an `.xlsx` spreadsheet.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Table</p>
            <Select
              value={tableType}
              onValueChange={(value) => setTableType(value as UploadTableType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select table" />
              </SelectTrigger>
              <SelectContent>
                {TABLE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Spreadsheet (.xlsx)</p>
            <Input
              type="file"
              accept=".xlsx"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </div>

          {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {isUploading ? "Uploading..." : "Upload and Sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
