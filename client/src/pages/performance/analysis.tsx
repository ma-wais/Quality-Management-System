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
import type { PerformanceAnalysis, InsertPerformanceAnalysis } from "@shared/schema";

export default function PerformanceAnalysisPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PerformanceAnalysis | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: items = [], isLoading } = useQuery<PerformanceAnalysis[]>({
    queryKey: ["/api/performance-analysis"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertPerformanceAnalysis) =>
      apiRequest("POST", "/api/performance-analysis", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-analysis"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertPerformanceAnalysis> }) =>
      apiRequest("PATCH", `/api/performance-analysis/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-analysis"] });
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
      apiRequest("PATCH", `/api/performance-analysis/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-analysis"] });
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
      indicator: formData.get("indicator") as string,
      value: formData.get("value") as string,
      target: formData.get("target") as string,
      status: formData.get("status") as string,
      action: formData.get("action") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        indicator: formData.get("indicator") as string,
        value: formData.get("value") as string,
        target: formData.get("target") as string,
        status: formData.get("status") as string,
        action: formData.get("action") as string,
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
        reviewDescription2: formData.get("reviewDescription2") as string,
        reviewedById: user?.id,
        reviewedByName: user?.fullName || "Unknown",
        reviewedByRole: userRole,
        reviewCompletedAt: new Date().toISOString(),
        status: "completed",
      },
    });
  };

  const getExportHeaders = () => [
    t('performanceAnalysis.indicator'),
    t('performanceAnalysis.value'),
    t('performanceAnalysis.target'),
    t('common.status'),
    t('performanceAnalysis.action'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    items.map((p) => [
      p.indicator || "-",
      p.value || "-",
      p.target || "-",
      t(`status.${p.status}`),
      p.action || "-",
      p.createdByName || "-",
      p.reviewedByName || "-",
      p.reviewDescription2 || "-",
    ]);

  const exportConfig = {
    title: t('performanceAnalysis.title'),
    clause: "9.1",
    description: t('performanceAnalysis.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "9.1_Performance_Analysis",
  };

  const columns = [
    { key: "indicator", header: t('performanceAnalysis.indicator') },
    { key: "value", header: t('performanceAnalysis.value') },
    { key: "target", header: t('performanceAnalysis.target') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: PerformanceAnalysis) => (
        <Badge className={statusColors[item.status] || ""} data-testid={`badge-status-${item.id}`}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "action",
      header: t('performanceAnalysis.action'),
      className: "min-w-[200px]",
      render: (item: PerformanceAnalysis) => (
        <span className="whitespace-pre-wrap break-words" data-testid={`text-action-${item.id}`}>
          {item.action || "-"}
        </span>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: PerformanceAnalysis) => (
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
                  {item.reviewDescription2 && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground block mb-1">{t('issues.reviewDescription')}:</span>
                      <p className="text-sm">{item.reviewDescription2}</p>
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
      render: (item: PerformanceAnalysis) => {
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
        title={t('performanceAnalysis.title')}
        description={t('performanceAnalysis.description')}
        clause="9.1"
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
                <Button data-testid="button-add-indicator">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('performanceAnalysis.addIndicator')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('performanceAnalysis.addIndicator')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="indicator">{t('performanceAnalysis.indicator')}</Label>
                    <Input id="indicator" name="indicator" required data-testid="input-indicator" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="value">{t('performanceAnalysis.value')}</Label>
                      <Input id="value" name="value" required data-testid="input-value" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="target">{t('performanceAnalysis.target')}</Label>
                      <Input id="target" name="target" required data-testid="input-target" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('common.status')}</Label>
                    <Select name="status" defaultValue="on_track">
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_track">{t('status.on_track')}</SelectItem>
                        <SelectItem value="at_risk">{t('status.at_risk')}</SelectItem>
                        <SelectItem value="behind">{t('status.behind')}</SelectItem>
                        <SelectItem value="achieved">{t('status.achieved')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="action">{t('performanceAnalysis.action')}</Label>
                    <Textarea id="action" name="action" data-testid="input-action" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-create">
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-indicator">
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
          <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('performanceAnalysis.indicator')}</Label>
                <Input name="indicator" defaultValue={selectedItem.indicator || ""} required data-testid="input-edit-indicator" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('performanceAnalysis.value')}</Label>
                  <Input name="value" defaultValue={selectedItem.value || ""} required data-testid="input-edit-value" />
                </div>
                <div className="space-y-2">
                  <Label>{t('performanceAnalysis.target')}</Label>
                  <Input name="target" defaultValue={selectedItem.target || ""} required data-testid="input-edit-target" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select name="status" defaultValue={selectedItem.status}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on_track">{t('status.on_track')}</SelectItem>
                    <SelectItem value="at_risk">{t('status.at_risk')}</SelectItem>
                    <SelectItem value="behind">{t('status.behind')}</SelectItem>
                    <SelectItem value="achieved">{t('status.achieved')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('performanceAnalysis.action')}</Label>
                <Textarea name="action" defaultValue={selectedItem.action || ""} data-testid="input-edit-action" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-indicator">
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
                  <span className="text-muted-foreground">{t('performanceAnalysis.indicator')}:</span>
                  <span className="font-medium">{selectedItem.indicator}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                  <span className="font-medium">{selectedItem.createdByName || '-'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDescription2">{t('issues.remarks')}</Label>
                <Textarea id="reviewDescription2" name="reviewDescription2" required data-testid="input-review-description" />
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
