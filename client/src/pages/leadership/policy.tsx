import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, FileText, CheckCircle, Clock, ClipboardCheck, Pencil, FileDown, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { QualityPolicy, InsertQualityPolicy } from "@shared/schema";

export default function QualityPolicyPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QualityPolicy | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: policies = [], isLoading } = useQuery<QualityPolicy[]>({
    queryKey: ["/api/quality-policy"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertQualityPolicy) =>
      apiRequest("POST", "/api/quality-policy", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-policy"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("PATCH", `/api/quality-policy/${id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-policy"] });
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertQualityPolicy> }) =>
      apiRequest("PATCH", `/api/quality-policy/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-policy"] });
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
      apiRequest("PATCH", `/api/quality-policy/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quality-policy"] });
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
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      version: formData.get("version") as string,
      status: "draft",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        title: formData.get("title") as string,
        content: formData.get("content") as string,
        version: formData.get("version") as string,
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
    t('formTitles.qualityPolicy'),
    t('policy.policyStatement'),
    t('common.version'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    policies.map((p) => [
      p.title || "-",
      p.content || "-",
      p.version || "-",
      t(`status.${p.status}`),
      p.createdByName || "-",
      p.reviewedByName || "-",
      p.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('policy.title'),
    clause: "5.2",
    description: t('policy.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "5.2_Quality_Policy",
  };

  const currentPolicy = policies.find((p) => p.status === "approved");
  const draftPolicies = policies.filter((p) => p.status === "draft" || p.status === "pending_approval");

  const columns = [
    {
      key: "title",
      header: t('formTitles.qualityPolicy'),
      className: "min-w-[200px]",
      render: (item: QualityPolicy) => (
        <span className="whitespace-pre-wrap break-words">{item.title || "-"}</span>
      ),
    },
    {
      key: "content",
      header: t('policy.policyStatement'),
      className: "min-w-[200px]",
      render: (item: QualityPolicy) => (
        <span className="whitespace-pre-wrap break-words">{item.content || "-"}</span>
      ),
    },
    {
      key: "version",
      header: t('common.version'),
      render: (item: QualityPolicy) => (
        <Badge variant="outline">v{item.version}</Badge>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: QualityPolicy) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: QualityPolicy) => (
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
      render: (item: QualityPolicy) => {
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

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={t('policy.title')}
        description={t('policy.description')}
        clause="5.2"
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
                <Button data-testid="button-add-policy">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('policy.addPolicy')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('policy.addPolicy')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t('formTitles.qualityPolicy')}</Label>
                      <Input
                        id="title"
                        name="title"
                        defaultValue={t('policy.title')}
                        required
                        data-testid="input-title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="version">{t('common.version')}</Label>
                      <Input
                        id="version"
                        name="version"
                        placeholder="1.0"
                        required
                        data-testid="input-version"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">{t('policy.policyStatement')}</Label>
                    <Textarea
                      id="content"
                      name="content"
                      className="min-h-[200px]"
                      required
                      data-testid="input-content"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-policy"
                    >
                      {createMutation.isPending ? t('common.loading') : t('common.add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card data-testid="card-current-policy">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>{t('policy.title')}</CardTitle>
            </div>
            {currentPolicy && (
              <Badge className={statusColors.approved}>
                <CheckCircle className="h-3 w-3 ltr:mr-1 rtl:ml-1" />
                {t('status.approved')}
              </Badge>
            )}
          </CardHeader>
          <CardContent>
            {currentPolicy ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('common.version')}: {currentPolicy.version}</span>
                  <span className="text-muted-foreground">
                    {t('policy.effectiveDate')}: {currentPolicy.effectiveDate ? new Date(currentPolicy.effectiveDate).toLocaleDateString() : "-"}
                  </span>
                </div>
                <div className="p-4 rounded-md bg-muted/50 whitespace-pre-wrap">
                  {currentPolicy.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('common.noData')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {draftPolicies.length > 0 && (
          <Card data-testid="card-draft-policies">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t('status.pending')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {draftPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="p-4 rounded-md border flex items-start justify-between gap-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-medium">{policy.title}</span>
                        <Badge variant="outline">v{policy.version}</Badge>
                        <Badge className={statusColors[policy.status] || ""}>
                          {t(`status.${policy.status}`)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {policy.content}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(policy.id)}
                      disabled={approveMutation.isPending}
                      data-testid={`button-approve-${policy.id}`}
                    >
                      {t('status.approved')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-0">
            <DataTable columns={columns} data={policies} isLoading={isLoading} emptyMessage={t('common.noData')} />
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('formTitles.qualityPolicy')}</Label>
                  <Input name="title" defaultValue={selectedItem.title || ""} required data-testid="input-edit-title" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.version')}</Label>
                  <Input name="version" defaultValue={selectedItem.version || ""} required data-testid="input-edit-version" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('policy.policyStatement')}</Label>
                <Textarea name="content" defaultValue={selectedItem.content || ""} className="min-h-[200px]" required data-testid="input-edit-content" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-policy">
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
                  <span className="text-muted-foreground">{t('formTitles.qualityPolicy')}:</span>
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
