import { createFileRoute } from "@tanstack/react-router";
import { Upload, FileText, FileSignature, Download } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useApi } from "@/lib/use-api";
import { api } from "@/lib/api";
import { PageHeader } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/app/documents")({
  component: DocumentsPage,
});

function DocumentsPage() {
  const { user, isClient } = useAuth();
  const { data: documents, loading } = useApi(() => api.getDocuments(user!), [user?.id]);

  return (
    <div>
      <PageHeader
        title={isClient ? "Document vault" : "Documents"}
        description={
          isClient
            ? "Securely upload, download, and sign documents."
            : "Templates, evidence, and case files."
        }
        actions={
          <>
            {!isClient && <Button variant="outline">Templates</Button>}
            <Button>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          </>
        }
      />
      <div className="p-6">
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
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              )}
              {(documents ?? []).map((d: any) => (
                <tr key={d.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
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
                      <span className="text-xs text-muted-foreground">Awaiting signature</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
