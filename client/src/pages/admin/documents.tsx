import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Image, FileText, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { PersonalDocument, InsertPersonalDocument } from "@shared/schema";

export default function PersonalDocumentsPage() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [fileType, setFileType] = useState<string>("");
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<PersonalDocument[]>({
    queryKey: ["/api/personal-documents"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPersonalDocument) =>
      apiRequest("POST", "/api/personal-documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      setOpen(false);
      setFileData(null);
      setFileName("");
      setFileType("");
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/personal-documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personal-documents"] });
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setFileType(file.type);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileData(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (!fileData) {
      toast({ title: t('personalDocs.selectFile'), variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      fileName: fileName,
      fileType: fileType,
      fileData: fileData,
      category: formData.get("category") as string,
    });
  };

  const isImage = (type: string | null) => type?.startsWith("image/");

  return (
    <div className="p-6">
      <PageHeader
        title={t('personalDocs.title')}
        description={t('personalDocs.description')}
        clause=""
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">{t('personalDocs.myDocuments')}</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="button-add-document">
                <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('personalDocs.upload')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('personalDocs.upload')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t('formTitles.document')}</Label>
                  <Input id="title" name="title" required data-testid="input-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t('common.description')}</Label>
                  <Textarea id="description" name="description" data-testid="input-description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('personalDocs.category')}</Label>
                  <Select name="category">
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder={t('personalDocs.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate">{t('personalDocs.categories.certificate')}</SelectItem>
                      <SelectItem value="photo">{t('personalDocs.categories.photo')}</SelectItem>
                      <SelectItem value="report">{t('personalDocs.categories.report')}</SelectItem>
                      <SelectItem value="other">{t('personalDocs.categories.other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">{t('personalDocs.file')}</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    required
                    data-testid="input-file"
                  />
                  {fileName && (
                    <p className="text-sm text-muted-foreground">{t('personalDocs.selected')}: {fileName}</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                  <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-document">
                    {createMutation.isPending ? t('common.loading') : t('personalDocs.upload')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">{t('common.loading')}</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t('common.noData')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {documents.map((doc) => (
                <Card key={doc.id} className="overflow-hidden">
                  <div className="aspect-video bg-muted flex items-center justify-center">
                    {isImage(doc.fileType) && doc.fileData ? (
                      <img
                        src={doc.fileData}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{doc.title}</h3>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground truncate">{doc.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.category && <span className="capitalize">{t(`personalDocs.categories.${doc.category}`)}</span>}
                          {doc.fileName && <span> - {doc.fileName}</span>}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {doc.fileData && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              const link = document.createElement("a");
                              link.href = doc.fileData!;
                              link.download = doc.fileName || "download";
                              link.click();
                            }}
                            data-testid={`button-download-${doc.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => deleteMutation.mutate(doc.id)}
                          data-testid={`button-delete-${doc.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
