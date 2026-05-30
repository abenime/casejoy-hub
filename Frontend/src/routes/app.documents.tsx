import { createFileRoute } from "@tanstack/react-router";
import {
  Upload,
  FileText,
  FileSignature,
  Download,
  Folder,
  Grid,
  List,
  MoreVertical,
  Pencil,
  Trash2,
  X,
  Eye,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

export const Route = createFileRoute("/app/documents")({
  component: DocumentsPage,
});

type DocumentItem = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  signed?: boolean;
  caseId?: string;
};

function DocumentsPage() {
  const { user, isClient } = useAuth();
  const { data: documents, loading } = useApi(() => api.getDocuments(user!), [user?.id]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentItem | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      toast.success(`${acceptedFiles.length} file(s) uploaded successfully.`);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  // Group documents by caseId for folders
  const folders = Array.from(new Set((documents ?? []).map((d: DocumentItem) => d.caseId))).filter(
    Boolean,
  );

  const displayedDocs = currentFolder
    ? (documents ?? []).filter((d: DocumentItem) => d.caseId === currentFolder)
    : (documents ?? []);

  const handleRename = () => {
    toast.success(`Document renamed to ${renameValue}`);
    setRenameDoc(null);
  };

  const handleDelete = () => {
    toast.success(`Document deleted`);
    setDeleteDoc(null);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={isClient ? "Document vault" : "Documents"}
        description={
          isClient
            ? "Securely upload, download, and sign documents."
            : "Templates, evidence, and case files."
        }
        actions={
          <div className="flex items-center gap-2">
            {!isClient && <Button variant="outline">Templates</Button>}
            <ToggleGroup
              type="single"
              value={viewMode}
              onValueChange={(v) => v && setViewMode(v as "list" | "grid")}
            >
              <ToggleGroupItem value="list" aria-label="Toggle list view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="grid" aria-label="Toggle grid view">
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <div {...getRootProps()}>
              <input {...getInputProps()} />
              <Button>
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </div>
        }
      />
      <div className="flex-1 p-6 flex flex-col gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {currentFolder ? (
                <BreadcrumbLink onClick={() => setCurrentFolder(null)} className="cursor-pointer">
                  All Documents
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>All Documents</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {currentFolder && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{currentFolder}</BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>

        <div
          {...getRootProps()}
          className={`flex-1 rounded-lg border-2 border-dashed p-4 transition-colors ${isDragActive ? "border-primary bg-primary/5" : "border-border bg-card"}`}
        >
          <input {...getInputProps()} />

          {!currentFolder && folders.length > 0 && (
            <div className="mb-8">
              <h3 className="mb-4 text-sm font-medium text-muted-foreground">Folders</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {folders.map((folderId) => (
                  <div
                    key={folderId as string}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentFolder(folderId as string);
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-border bg-card p-4 hover:border-primary hover:shadow-sm"
                  >
                    <Folder className="h-8 w-8 fill-blue-500/20 text-blue-500" />
                    <div>
                      <div className="font-medium">{folderId as string}</div>
                      <div className="text-xs text-muted-foreground">
                        {
                          (documents ?? []).filter((d: DocumentItem) => d.caseId === folderId)
                            .length
                        }{" "}
                        files
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="mb-4 text-sm font-medium text-muted-foreground">Files</h3>

            {loading ? (
              <div className="py-10 text-center text-muted-foreground">Loading…</div>
            ) : displayedDocs.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <FileText className="mx-auto h-8 w-8 mb-2 opacity-20" />
                No files found
              </div>
            ) : viewMode === "list" ? (
              <div className="overflow-hidden rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium">Name</th>
                      <th className="px-5 py-3 text-left font-medium">Type</th>
                      <th className="px-5 py-3 text-left font-medium">Size</th>
                      <th className="px-5 py-3 text-left font-medium">Uploaded by</th>
                      <th className="px-5 py-3 text-left font-medium">Date</th>
                      <th className="px-5 py-3 text-left font-medium">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {displayedDocs.map((d: DocumentItem) => (
                      <tr key={d.id} className="transition-colors hover:bg-secondary/40">
                        <td className="px-5 py-3.5">
                          <div
                            className="flex items-center gap-3 cursor-pointer hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(d);
                            }}
                          >
                            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-secondary text-primary">
                              <FileText className="h-4 w-4" />
                            </div>
                            <span className="font-medium text-foreground">{d.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className="capitalize">
                            {d.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-muted-foreground">{d.size}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{d.uploadedBy}</td>
                        <td className="px-5 py-3.5 text-muted-foreground">{d.uploadedAt}</td>
                        <td className="px-5 py-3.5">
                          {d.signed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                              <FileSignature className="h-3.5 w-3.5" /> Signed
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Awaiting signature
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDoc(d);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" /> Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open("#", "_blank");
                                }}
                              >
                                <Download className="mr-2 h-4 w-4" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameDoc(d);
                                  setRenameValue(d.name);
                                }}
                              >
                                <Pencil className="mr-2 h-4 w-4" /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:bg-destructive/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteDoc(d);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {displayedDocs.map((d: DocumentItem) => (
                  <div
                    key={d.id}
                    className="group relative rounded-lg border border-border bg-card p-4 hover:border-primary"
                  >
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="secondary" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewDoc(d);
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" /> Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open("#", "_blank");
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameDoc(d);
                              setRenameValue(d.name);
                            }}
                          >
                            <Pencil className="mr-2 h-4 w-4" /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteDoc(d);
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div
                      className="flex cursor-pointer flex-col items-center gap-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewDoc(d);
                      }}
                    >
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-secondary/50 text-primary">
                        <FileText className="h-8 w-8" />
                      </div>
                      <div>
                        <div className="line-clamp-2 text-sm font-medium" title={d.name}>
                          {d.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">{d.size}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={(o) => !o && setPreviewDoc(null)}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 bg-muted/30 rounded-md border flex items-center justify-center relative overflow-hidden">
            {/* Mock preview content */}
            <div className="text-center p-8 bg-card border rounded shadow-sm max-w-2xl w-full h-full m-4 flex flex-col items-center justify-center">
              <FileText className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">Document Preview</h3>
              <p className="text-sm text-muted-foreground mt-2">
                This is a mock preview of {previewDoc?.name}.<br />
                In a real application, this would render a PDF, Word document, or image using a file
                viewer component.
              </p>
              <div className="mt-8 p-4 bg-secondary/50 rounded-md text-left w-full max-w-md text-xs font-mono">
                <div>Type: {previewDoc?.type}</div>
                <div>Size: {previewDoc?.size}</div>
                <div>Uploaded by: {previewDoc?.uploadedBy}</div>
                <div>Date: {previewDoc?.uploadedAt}</div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDoc(null)}>
              Close
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={!!renameDoc} onOpenChange={(o) => !o && setRenameDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Document Name</Label>
            <Input
              id="name"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDoc(null)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteDoc} onOpenChange={(o) => !o && setDeleteDoc(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDoc?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
