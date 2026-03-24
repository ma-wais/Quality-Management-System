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
import { statusColors, priorityColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import { EvidenceUpload } from "@/components/evidence-upload";
import type { ChangeRequest, InsertChangeRequest } from "@shared/schema";

export default function ChangesPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ChangeRequest | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: changes = [], isLoading } = useQuery<ChangeRequest[]>({
    queryKey: ["/api/change-requests"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertChangeRequest) =>
      apiRequest("POST", "/api/change-requests", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/change-requests/${id}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
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
      apiRequest("PATCH", `/api/change-requests/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/change-requests"] });
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
      changeTitle: formData.get("changeTitle") as string,
      description: formData.get("description") as string,
      changeType: formData.get("changeType") as string,
      impactAssessment: formData.get("impactAssessment") as string,
      affectedAreas: formData.get("affectedAreas") as string,
      priority: formData.get("priority") as string,
      status: "pending",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    const updates: Record<string, unknown> = {
      changeTitle: formData.get("changeTitle") as string,
      description: formData.get("description") as string,
      changeType: formData.get("changeType") as string,
      impactAssessment: formData.get("impactAssessment") as string,
      affectedAreas: formData.get("affectedAreas") as string,
      priority: formData.get("priority") as string,
      status: formData.get("status") as string,
      reviewComments: formData.get("reviewComments") as string,
    };
    const approvalDate = formData.get("approvalDate") as string;
    const implementationDate = formData.get("implementationDate") as string;
    if (approvalDate) updates.approvalDate = new Date(approvalDate).toISOString();
    if (implementationDate) updates.implementationDate = new Date(implementationDate).toISOString();
    editMutation.mutate({ id: selectedItem.id, updates });
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
    t('formTitles.changeRequest'),
    t('common.type'),
    t('common.priority'),
    t('common.status'),
    t('changes.impactAssessment'),
    t('changes.affectedAreas'),
    t('common.date'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    changes.map((c) => [
      c.changeTitle || "-",
      c.changeType || "-",
      c.priority ? t(`priority.${c.priority}`) : "-",
      t(`status.${c.status}`),
      c.impactAssessment || "-",
      c.affectedAreas || "-",
      c.requestDate ? new Date(c.requestDate).toLocaleDateString() : "-",
      c.createdByName || "-",
      c.reviewedByName || "-",
      c.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('changes.title'),
    clause: "6.3",
    description: t('changes.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "6.3_Change_Requests",
  };

  const columns = [
    { key: "changeTitle", header: t('formTitles.changeRequest') },
    {
      key: "changeType",
      header: t('common.type'),
      render: (item: ChangeRequest) => (
        <Badge variant="outline" className="capitalize">
          {item.changeType}
        </Badge>
      ),
    },
    {
      key: "description",
      header: t('common.description'),
      className: "min-w-[200px]",
      render: (item: ChangeRequest) => (
        <span className="whitespace-pre-wrap break-words">{item.description || "-"}</span>
      ),
    },
    {
      key: "priority",
      header: t('common.priority'),
      render: (item: ChangeRequest) => (
        <Badge className={priorityColors[item.priority] || ""}>
          {t(`priority.${item.priority}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: ChangeRequest) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewComments",
      header: t('changes.reviewComments'),
      className: "min-w-[200px]",
      render: (item: ChangeRequest) => (
        <span className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {item.reviewComments || "—"}
        </span>
      ),
    },
    {
      key: "requestDate",
      header: t('common.date'),
      render: (item: ChangeRequest) =>
        item.requestDate ? new Date(item.requestDate).toLocaleDateString() : "—",
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: ChangeRequest) => (
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
      render: (item: ChangeRequest) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedItem(item); setEditOpen(true); }} data-testid={`button-edit-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
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
        title={t('changes.title')}
        description={t('changes.description')}
        clause="6.3"
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
                <Button data-testid="button-add-change">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('changes.addChange')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('changes.addChange')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="changeTitle">{t('formTitles.changeRequest')}</Label>
                    <Input id="changeTitle" name="changeTitle" required data-testid="input-change-title" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="changeType">{t('common.type')}</Label>
                      <Select name="changeType" required>
                        <SelectTrigger data-testid="select-change-type">
                          <SelectValue placeholder={t('form.selectRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="process">{t('changes.process')}</SelectItem>
                          <SelectItem value="document">{t('changes.document')}</SelectItem>
                          <SelectItem value="system">{t('changes.system')}</SelectItem>
                          <SelectItem value="product">{t('changes.product')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="priority">{t('common.priority')}</Label>
                      <Select name="priority" defaultValue="medium">
                        <SelectTrigger data-testid="select-priority">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">{t('priority.low')}</SelectItem>
                          <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                          <SelectItem value="high">{t('priority.high')}</SelectItem>
                          <SelectItem value="critical">{t('priority.critical')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Textarea id="description" name="description" required data-testid="input-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="impactAssessment">{t('changes.impactAssessment')}</Label>
                    <Textarea id="impactAssessment" name="impactAssessment" data-testid="input-impact" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="affectedAreas">{t('changes.affectedAreas')}</Label>
                    <Input id="affectedAreas" name="affectedAreas" data-testid="input-affected-areas" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-change">
                      {createMutation.isPending ? t('common.loading') : t('common.submit')}
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
          <DataTable columns={columns} data={changes} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('changes.addReview')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('formTitles.changeRequest')}</Label>
                <Input name="changeTitle" defaultValue={selectedItem.changeTitle} required data-testid="input-edit-change-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.type')}</Label>
                  <Select name="changeType" defaultValue={selectedItem.changeType}>
                    <SelectTrigger data-testid="select-edit-change-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="process">{t('changes.process')}</SelectItem>
                      <SelectItem value="document">{t('changes.document')}</SelectItem>
                      <SelectItem value="system">{t('changes.system')}</SelectItem>
                      <SelectItem value="product">{t('changes.product')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('common.priority')}</Label>
                  <Select name="priority" defaultValue={selectedItem.priority}>
                    <SelectTrigger data-testid="select-edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('priority.high')}</SelectItem>
                      <SelectItem value="critical">{t('priority.critical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea name="description" defaultValue={selectedItem.description} required data-testid="input-edit-description" />
              </div>
              <div className="space-y-2">
                <Label>{t('changes.impactAssessment')}</Label>
                <Textarea name="impactAssessment" defaultValue={selectedItem.impactAssessment || ""} data-testid="input-edit-impact" />
              </div>
              <div className="space-y-2">
                <Label>{t('changes.affectedAreas')}</Label>
                <Input name="affectedAreas" defaultValue={selectedItem.affectedAreas || ""} data-testid="input-edit-affected-areas" />
              </div>
              <div className="space-y-2">
                <Label>{t('changes.reviewStatus')}</Label>
                <Select name="status" defaultValue={selectedItem.status}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t('status.pending')}</SelectItem>
                    <SelectItem value="approved">{t('status.approved')}</SelectItem>
                    <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                    <SelectItem value="implemented">{t('status.implemented')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('changes.approvalDate')}</Label>
                  <Input
                    type="date"
                    name="approvalDate"
                    defaultValue={selectedItem.approvalDate ? new Date(selectedItem.approvalDate).toISOString().split("T")[0] : ""}
                    data-testid="input-edit-approval-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('changes.implementationDate')}</Label>
                  <Input
                    type="date"
                    name="implementationDate"
                    defaultValue={selectedItem.implementationDate ? new Date(selectedItem.implementationDate).toISOString().split("T")[0] : ""}
                    data-testid="input-edit-implementation-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('changes.reviewComments')}</Label>
                <Textarea
                  name="reviewComments"
                  defaultValue={selectedItem.reviewComments || ""}
                  placeholder={t('changes.reviewComments')}
                  data-testid="input-edit-review-comments"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('evidence.upload')}</Label>
                <EvidenceUpload module="change-requests" entityId={selectedItem.id} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-submit-edit-change">
                  {editMutation.isPending ? t('common.loading') : t('common.save')}
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
                  <span className="text-muted-foreground">{t('formTitles.changeRequest')}:</span>
                  <span className="font-medium">{selectedItem.changeTitle}</span>
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
