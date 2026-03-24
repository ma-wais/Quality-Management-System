import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Upload, X, FileText, Image, Download } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { EvidenceFile } from "@shared/schema";

interface EvidenceUploadProps {
  module: string;
  entityId: string;
  readOnly?: boolean;
}

export function EvidenceUpload({ module, entityId, readOnly = false }: EvidenceUploadProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files = [] } = useQuery<EvidenceFile[]>({
    queryKey: ["/api/evidence-files", module, entityId],
    queryFn: async () => {
      const res = await fetch(`/api/evidence-files/${module}/${entityId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!entityId,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      return new Promise<void>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            await apiRequest("POST", "/api/evidence-files", {
              module,
              entityId,
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              fileData: reader.result as string,
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-files", module, entityId] });
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/evidence-files/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/evidence-files", module, entityId] });
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    setUploading(true);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        await uploadMutation.mutateAsync(selectedFiles[i]);
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (file: EvidenceFile) => {
    if (!file.fileData) return;
    const link = document.createElement("a");
    link.href = file.fileData;
    link.download = file.fileName;
    link.click();
  };

  const isImage = (fileType: string | null) => fileType?.startsWith("image/");

  return (
    <div className="space-y-2">
      {!readOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="input-evidence-file"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            data-testid="button-upload-evidence"
          >
            <Upload className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {uploading ? t('common.loading') : t('evidence.upload')}
          </Button>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-1">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm"
              data-testid={`evidence-file-${file.id}`}
            >
              {isImage(file.fileType) ? (
                <Image className="h-4 w-4 text-blue-500 flex-shrink-0" />
              ) : (
                <FileText className="h-4 w-4 text-orange-500 flex-shrink-0" />
              )}
              <span className="truncate flex-1">{file.fileName}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleDownload(file)}
                data-testid={`button-download-evidence-${file.id}`}
              >
                <Download className="h-3 w-3" />
              </Button>
              {!readOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={() => deleteMutation.mutate(file.id)}
                  data-testid={`button-delete-evidence-${file.id}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
