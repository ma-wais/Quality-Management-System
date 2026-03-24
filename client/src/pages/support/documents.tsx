import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, CheckCircle, ClipboardCheck, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { Document, InsertDocument } from "@shared/schema";

export default function DocumentsPage() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Document | null>(null);
  const { toast } = useToast();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertDocument) =>
      apiRequest("POST", "/api/documents", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/documents/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertDocument> }) =>
      apiRequest("PATCH", `/api/documents/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setEditOpen(false);
      setSelectedItem(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/documents/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setReviewOpen(false);
      setSelectedItem(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      documentNumber: formData.get("documentNumber") as string,
      title: formData.get("title") as string,
      documentType: formData.get("documentType") as string,
      category: formData.get("category") as string,
      version: formData.get("version") as string,
      content: "",
      department: formData.get("department") as string,
      owner: formData.get("owner") as string,
      status: (formData.get("docStatus") as string) || "draft",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        documentNumber: formData.get("documentNumber") as string,
        title: formData.get("title") as string,
        documentType: formData.get("documentType") as string,
        category: formData.get("category") as string,
        version: formData.get("version") as string,
        department: formData.get("department") as string,
        owner: formData.get("owner") as string,
      },
    });
  };

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    reviewMutation.mutate({
      id: selectedItem.id,
      reviewData: {
        reviewDescription: formData.get("reviewDescription") as string,
        reviewedById: user?.id,
        reviewedByName: user?.fullName || "Unknown",
        reviewedByRole: userRole,
        reviewCompletedAt: new Date().toISOString(),
        status: "completed",
      },
    });
  };

  const getExportHeaders = () => [
    t('documents.referenceNumber'),
    t('formTitles.document'),
    t('common.type'),
    t('common.version'),
    t('documents.owner'),
    t('common.department'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    documents.map((d) => [
      d.documentNumber || "-",
      d.title || "-",
      d.documentType || "-",
      d.version || "-",
      d.owner || "-",
      d.department || "-",
      t(`status.${d.status}`),
      d.createdByName || "-",
      d.reviewedByName || "-",
      d.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('documents.title'),
    clause: "7.5",
    description: t('documents.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "7.5_Documents",
  };

  const columns = [
    { key: "documentNumber", header: t('documents.referenceNumber') },
    { key: "title", header: t('formTitles.document') },
    {
      key: "documentType",
      header: t('common.type'),
      render: (item: Document) => (
        <Badge variant="outline" className="capitalize">
          {t(`documents.types.${item.documentType}`)}
        </Badge>
      ),
    },
    { key: "version", header: t('common.version') },
    { key: "owner", header: t('documents.owner') },
    { key: "department", header: t('common.department') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Document) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Document) => (
        item.reviewCompletedAt ? (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid={`button-review-details-${item.id}`}>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">{t('issues.reviewDetails')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                    <span className="font-medium">{item.createdByName || '-'}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('issues.reviewedBy')}:</span>
                      <span className="font-medium">{item.reviewedByName}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('issues.reviewerRole')}:</span>
                    <span className="font-medium">{item.reviewedByRole ? t(`roles.${item.reviewedByRole}`) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('issues.reviewDate')}:</span>
                    <span className="font-medium">
                      {item.reviewCompletedAt ? new Date(item.reviewCompletedAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  {item.reviewDescription && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground block mb-1">{t('issues.reviewDescription')}:</span>
                      <p className="text-sm">{item.reviewDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        )
      ),
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: Document) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        const showApprove = (item.status === "draft" || item.status === "pending_review") && canReview;
        if (!canEdit && !showReview && !showApprove) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedItem(item); setEditOpen(true); }} data-testid={`button-edit-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showApprove && (
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); approveMutation.mutate(item.id); }} data-testid={`button-approve-${item.id}`}>
                <CheckCircle className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
                {t('documents.approve')}
              </Button>
            )}
            {showReview && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedItem(item); setReviewOpen(true); }} data-testid={`button-review-${item.id}`}>
                <ClipboardCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.review')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={t('documents.title')}
        description={t('documents.description')}
        clause="7.5"
      >
        <div className="flex gap-2">
          {canExport && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportToWord(exportConfig)} data-testid="button-export-word">
                <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.exportWord')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(exportConfig)} data-testid="button-export-excel">
                <FileSpreadsheet className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.exportExcel')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToPdf(exportConfig)} data-testid="button-export-pdf">
                <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.exportPdf')}
              </Button>
            </>
          )}
          {canCreate && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-document">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('documents.addDocument')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('documents.createDocument')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="documentNumber">{t('documents.referenceNumber')}</Label>
                      <Input id="documentNumber" name="documentNumber" required data-testid="input-document-number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="version">{t('common.version')}</Label>
                      <Input id="version" name="version" required data-testid="input-version" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="documentType">{t('common.type')}</Label>
                      <Select name="documentType" required>
                        <SelectTrigger data-testid="select-document-type">
                          <SelectValue placeholder={t('documents.selectType')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="policy">{t('documents.types.policy')}</SelectItem>
                          <SelectItem value="procedure">{t('documents.types.procedure')}</SelectItem>
                          <SelectItem value="work_instruction">{t('documents.types.work_instruction')}</SelectItem>
                          <SelectItem value="form">{t('documents.types.form')}</SelectItem>
                          <SelectItem value="record">{t('documents.types.record')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('formTitles.document')}</Label>
                    <Input id="title" name="title" required data-testid="input-title" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{t('documents.category')}</Label>
                      <Input id="category" name="category" data-testid="input-category" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">{t('common.department')}</Label>
                      <Input id="department" name="department" data-testid="input-department" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="owner">{t('documents.owner')}</Label>
                      <Input id="owner" name="owner" required data-testid="input-owner" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docStatus">{t('common.status')}</Label>
                    <Select name="docStatus" defaultValue="draft">
                      <SelectTrigger data-testid="select-doc-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">{t('status.draft')}</SelectItem>
                        <SelectItem value="active">{t('status.active')}</SelectItem>
                        <SelectItem value="archived">{t('status.archived')}</SelectItem>
                        <SelectItem value="obsolete">{t('status.obsolete')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-document">
                      {createMutation.isPending ? t('common.loading') : t('documents.createDocument')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns} data={documents} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('documents.editDocument')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('documents.referenceNumber')}</Label>
                  <Input name="documentNumber" defaultValue={selectedItem.documentNumber || ""} required data-testid="input-edit-document-number" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.version')}</Label>
                  <Input name="version" defaultValue={selectedItem.version || ""} required data-testid="input-edit-version" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.type')}</Label>
                  <Select name="documentType" defaultValue={selectedItem.documentType || ""}>
                    <SelectTrigger data-testid="select-edit-document-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="policy">{t('documents.types.policy')}</SelectItem>
                      <SelectItem value="procedure">{t('documents.types.procedure')}</SelectItem>
                      <SelectItem value="work_instruction">{t('documents.types.work_instruction')}</SelectItem>
                      <SelectItem value="form">{t('documents.types.form')}</SelectItem>
                      <SelectItem value="record">{t('documents.types.record')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('formTitles.document')}</Label>
                <Input name="title" defaultValue={selectedItem.title || ""} required data-testid="input-edit-title" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('documents.category')}</Label>
                  <Input name="category" defaultValue={selectedItem.category || ""} data-testid="input-edit-category" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.department')}</Label>
                  <Input name="department" defaultValue={selectedItem.department || ""} data-testid="input-edit-department" />
                </div>
                <div className="space-y-2">
                  <Label>{t('documents.owner')}</Label>
                  <Input name="owner" defaultValue={selectedItem.owner || ""} required data-testid="input-edit-owner" />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-document">
                  {editMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('issues.reviewRecord')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('formTitles.document')}:</span>
                  <span className="font-medium">{selectedItem.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                  <span className="font-medium">{selectedItem.createdByName || '-'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDescription">{t('issues.remarks')}</Label>
                <Textarea id="reviewDescription" name="reviewDescription" required data-testid="input-review-description" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={reviewMutation.isPending} data-testid="button-submit-review">
                  {reviewMutation.isPending ? t('common.loading') : t('issues.submitReview')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
