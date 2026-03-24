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
import type { ServiceRelease, InsertServiceRelease } from "@shared/schema";

export default function ServiceReleasePage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceRelease | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: releases = [], isLoading } = useQuery<ServiceRelease[]>({
    queryKey: ["/api/service-releases"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertServiceRelease) =>
      apiRequest("POST", "/api/service-releases", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-releases"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertServiceRelease> }) =>
      apiRequest("PATCH", `/api/service-releases/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-releases"] });
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
      apiRequest("PATCH", `/api/service-releases/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-releases"] });
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
      releaseDate: new Date(formData.get("releaseDate") as string),
      approvedBy: formData.get("approvedBy") as string,
      criteria: formData.get("criteria") as string,
      verificationResult: formData.get("verificationResult") as string,
      status: formData.get("status") as string,
      notes: formData.get("notes") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        releaseDate: new Date(formData.get("releaseDate") as string),
        approvedBy: formData.get("approvedBy") as string,
        criteria: formData.get("criteria") as string,
        verificationResult: formData.get("verificationResult") as string,
        status: formData.get("status") as string,
        notes: formData.get("notes") as string,
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
      },
    });
  };

  const getExportHeaders = () => [
    t('common.date'),
    t('release.approvedBy'),
    t('requirements.acceptance'),
    t('release.verificationResult'),
    t('common.status'),
    t('common.notes'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    releases.map((r) => [
      r.releaseDate ? new Date(r.releaseDate).toLocaleDateString() : "-",
      r.approvedBy || "-",
      r.criteria || "-",
      r.verificationResult || "-",
      t(`status.${r.status}`),
      r.notes || "-",
      r.createdByName || "-",
      r.reviewedByName || "-",
      r.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('release.title'),
    clause: "8.6",
    description: t('release.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "8.6_Service_Release",
  };

  const columns = [
    {
      key: "releaseDate",
      header: t('common.date'),
      render: (item: ServiceRelease) => item.releaseDate ? new Date(item.releaseDate).toLocaleDateString() : "-",
    },
    { key: "approvedBy", header: t('release.approvedBy') },
    {
      key: "criteria",
      header: t('requirements.acceptance'),
      className: "min-w-[200px]",
      render: (item: ServiceRelease) => (
        <span className="whitespace-pre-wrap break-words">{item.criteria || "-"}</span>
      ),
    },
    {
      key: "verificationResult",
      header: t('release.verificationResult'),
      className: "min-w-[150px]",
      render: (item: ServiceRelease) => (
        <span className="whitespace-pre-wrap break-words">{item.verificationResult || "-"}</span>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: ServiceRelease) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "notes",
      header: t('common.notes'),
      className: "min-w-[150px]",
      render: (item: ServiceRelease) => (
        <span className="whitespace-pre-wrap break-words">{item.notes || "-"}</span>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: ServiceRelease) => (
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
      render: (item: ServiceRelease) => {
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
        title={t('release.title')}
        description={t('release.description')}
        clause="8.6"
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
                <Button data-testid="button-add-release">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('release.addRelease')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('release.addRelease')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="releaseDate">{t('common.date')}</Label>
                      <Input id="releaseDate" name="releaseDate" type="date" required data-testid="input-date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">{t('common.status')}</Label>
                      <Select name="status" defaultValue="approved">
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">{t('status.approved')}</SelectItem>
                          <SelectItem value="conditional">{t('status.conditional')}</SelectItem>
                          <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="approvedBy">{t('release.approvedBy')}</Label>
                    <Input id="approvedBy" name="approvedBy" required data-testid="input-approver" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="criteria">{t('requirements.acceptance')}</Label>
                    <Textarea id="criteria" name="criteria" data-testid="input-criteria" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="verificationResult">{t('release.verificationResult')}</Label>
                    <Textarea id="verificationResult" name="verificationResult" data-testid="input-verification" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('common.notes')}</Label>
                    <Textarea id="notes" name="notes" data-testid="input-notes" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-release">
                      {createMutation.isPending ? t('common.loading') : t('release.addRelease')}
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
          <DataTable columns={columns} data={releases} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('release.editRelease')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.date')}</Label>
                  <Input name="releaseDate" type="date" defaultValue={selectedItem.releaseDate ? new Date(selectedItem.releaseDate).toISOString().split('T')[0] : ""} required data-testid="input-edit-date" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedItem.status || "approved"}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="approved">{t('status.approved')}</SelectItem>
                      <SelectItem value="conditional">{t('status.conditional')}</SelectItem>
                      <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('release.approvedBy')}</Label>
                <Input name="approvedBy" defaultValue={selectedItem.approvedBy || ""} required data-testid="input-edit-approver" />
              </div>
              <div className="space-y-2">
                <Label>{t('requirements.acceptance')}</Label>
                <Textarea name="criteria" defaultValue={selectedItem.criteria || ""} data-testid="input-edit-criteria" />
              </div>
              <div className="space-y-2">
                <Label>{t('release.verificationResult')}</Label>
                <Textarea name="verificationResult" defaultValue={selectedItem.verificationResult || ""} data-testid="input-edit-verification" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.notes')}</Label>
                <Textarea name="notes" defaultValue={selectedItem.notes || ""} data-testid="input-edit-notes" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-release">
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
                  <span className="text-muted-foreground">{t('release.approvedBy')}:</span>
                  <span className="font-medium">{selectedItem.approvedBy}</span>
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
