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
import { EvidenceUpload } from "@/components/evidence-upload";
import type { QmsScope, InsertQmsScope } from "@shared/schema";

export default function QmsScopePage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QmsScope | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: scopes = [], isLoading } = useQuery<QmsScope[]>({
    queryKey: ["/api/qms-scope"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertQmsScope) =>
      apiRequest("POST", "/api/qms-scope", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qms-scope"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertQmsScope> }) =>
      apiRequest("PATCH", `/api/qms-scope/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qms-scope"] });
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
      apiRequest("PATCH", `/api/qms-scope/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/qms-scope"] });
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
      scopeStatement: formData.get("scopeStatement") as string,
      applicableProcesses: formData.get("applicableProcesses") as string,
      exclusions: formData.get("exclusions") as string,
      justification: formData.get("justification") as string,
      version: formData.get("version") as string,
      status: formData.get("status") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        scopeStatement: formData.get("scopeStatement") as string,
        applicableProcesses: formData.get("applicableProcesses") as string,
        exclusions: formData.get("exclusions") as string,
        justification: formData.get("justification") as string,
        version: formData.get("version") as string,
        status: formData.get("status") as string,
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
        status: "approved",
      },
    });
  };

  const getExportHeaders = () => [
    t('common.version'),
    t('scope.scopeStatement'),
    t('scope.applicableProcesses'),
    t('scope.exclusions'),
    t('scope.justification'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    scopes.map((s) => [
      s.version || "-",
      s.scopeStatement || "-",
      s.applicableProcesses || "-",
      s.exclusions || "-",
      s.justification || "-",
      t(`status.${s.status}`),
      s.createdByName || "-",
      s.reviewedByName || "-",
      s.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('scope.title'),
    clause: "4.3",
    description: t('scope.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "4.3_QMS_Scope",
  };

  const columns = [
    { key: "version", header: t('common.version') },
    {
      key: "scopeStatement",
      header: t('scope.scopeStatement'),
      className: "min-w-[200px]",
      render: (item: QmsScope) => (
        <span className="whitespace-pre-wrap break-words">{item.scopeStatement || "-"}</span>
      ),
    },
    {
      key: "applicableProcesses",
      header: t('scope.applicableProcesses'),
      className: "min-w-[150px]",
      render: (item: QmsScope) => (
        <span className="whitespace-pre-wrap break-words">{item.applicableProcesses || "-"}</span>
      ),
    },
    {
      key: "exclusions",
      header: t('scope.exclusions'),
      render: (item: QmsScope) => (
        <span className="whitespace-pre-wrap break-words">{item.exclusions || "-"}</span>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: QmsScope) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: QmsScope) => (
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
      render: (item: QmsScope) => {
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
        title={t('scope.title')}
        description={t('scope.description')}
        clause="4.3"
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
                <Button data-testid="button-add-scope">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('scope.addScope')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('scope.addScope')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="version">{t('common.version')}</Label>
                      <Input id="version" name="version" placeholder="1.0" required data-testid="input-version" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">{t('common.status')}</Label>
                      <Select name="status" defaultValue="draft">
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">{t('status.draft')}</SelectItem>
                          <SelectItem value="approved">{t('status.approved')}</SelectItem>
                          <SelectItem value="archived">{t('status.archived')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="scopeStatement">{t('scope.scopeStatement')}</Label>
                    <Textarea id="scopeStatement" name="scopeStatement" required data-testid="input-scope-statement" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicableProcesses">{t('scope.applicableProcesses')}</Label>
                    <Textarea id="applicableProcesses" name="applicableProcesses" data-testid="input-applicable-processes" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exclusions">{t('scope.exclusions')}</Label>
                    <Textarea id="exclusions" name="exclusions" data-testid="input-exclusions" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="justification">{t('scope.justification')}</Label>
                    <Textarea id="justification" name="justification" data-testid="input-justification" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-scope">
                      {createMutation.isPending ? t('common.loading') : t('common.add')}
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
          <DataTable columns={columns} data={scopes} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('scope.editScope')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.version')}</Label>
                  <Input name="version" defaultValue={selectedItem.version || ""} required data-testid="input-edit-version" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedItem.status || "draft"}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">{t('status.draft')}</SelectItem>
                      <SelectItem value="approved">{t('status.approved')}</SelectItem>
                      <SelectItem value="archived">{t('status.archived')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('scope.scopeStatement')}</Label>
                <Textarea name="scopeStatement" defaultValue={selectedItem.scopeStatement || ""} required data-testid="input-edit-scope-statement" />
              </div>
              <div className="space-y-2">
                <Label>{t('scope.applicableProcesses')}</Label>
                <Textarea name="applicableProcesses" defaultValue={selectedItem.applicableProcesses || ""} data-testid="input-edit-applicable-processes" />
              </div>
              <div className="space-y-2">
                <Label>{t('scope.exclusions')}</Label>
                <Textarea name="exclusions" defaultValue={selectedItem.exclusions || ""} data-testid="input-edit-exclusions" />
              </div>
              <div className="space-y-2">
                <Label>{t('scope.justification')}</Label>
                <Textarea name="justification" defaultValue={selectedItem.justification || ""} data-testid="input-edit-justification" />
              </div>
              <div className="space-y-2">
                <Label>Evidence</Label>
                <EvidenceUpload module="qms-scope" entityId={selectedItem.id} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-scope">
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
                  <span className="text-muted-foreground">{t('scope.scopeStatement')}:</span>
                  <span className="font-medium truncate max-w-[200px]">{selectedItem.scopeStatement}</span>
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
