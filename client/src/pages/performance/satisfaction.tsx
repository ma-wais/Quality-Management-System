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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, CheckCircle, ClipboardCheck, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { CustomerSatisfaction, InsertCustomerSatisfaction } from "@shared/schema";

export default function CustomerSatisfactionPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CustomerSatisfaction | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: records = [], isLoading } = useQuery<CustomerSatisfaction[]>({
    queryKey: ["/api/customer-satisfaction"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomerSatisfaction) =>
      apiRequest("POST", "/api/customer-satisfaction", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-satisfaction"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertCustomerSatisfaction> }) =>
      apiRequest("PATCH", `/api/customer-satisfaction/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-satisfaction"] });
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
      apiRequest("PATCH", `/api/customer-satisfaction/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-satisfaction"] });
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
      timePeriod: formData.get("timePeriod") as string,
      tool: formData.get("tool") as string,
      outcome: formData.get("outcome") as string,
      improvement: formData.get("improvement") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        timePeriod: formData.get("timePeriod") as string,
        tool: formData.get("tool") as string,
        outcome: formData.get("outcome") as string,
        improvement: formData.get("improvement") as string,
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
    t('customerSatisfaction.timePeriod'),
    t('customerSatisfaction.tool'),
    t('customerSatisfaction.outcome'),
    t('customerSatisfaction.improvement'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    records.map((r) => [
      r.timePeriod || "-",
      r.tool || "-",
      r.outcome || "-",
      r.improvement || "-",
      r.createdByName || "-",
      r.reviewedByName || "-",
      r.reviewDescription2 || "-",
    ]);

  const exportConfig = {
    title: t('customerSatisfaction.title'),
    clause: "9.4",
    description: t('customerSatisfaction.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "9.4_Customer_Satisfaction",
  };

  const columns = [
    { key: "timePeriod", header: t('customerSatisfaction.timePeriod') },
    { key: "tool", header: t('customerSatisfaction.tool') },
    {
      key: "outcome",
      header: t('customerSatisfaction.outcome'),
      className: "min-w-[200px]",
      render: (item: CustomerSatisfaction) => (
        <span className="whitespace-pre-wrap break-words">
          {item.outcome || "-"}
        </span>
      ),
    },
    {
      key: "improvement",
      header: t('customerSatisfaction.improvement'),
      className: "min-w-[200px]",
      render: (item: CustomerSatisfaction) => (
        <span className="whitespace-pre-wrap break-words">
          {item.improvement || "-"}
        </span>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: CustomerSatisfaction) => (
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
      render: (item: CustomerSatisfaction) => {
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
        title={t('customerSatisfaction.title')}
        description={t('customerSatisfaction.description')}
        clause="9.4"
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
                <Button data-testid="button-add-record">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('customerSatisfaction.addRecord')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('customerSatisfaction.addRecord')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="timePeriod">{t('customerSatisfaction.timePeriod')}</Label>
                    <Input
                      id="timePeriod"
                      name="timePeriod"
                      placeholder="Q1 2026"
                      required
                      data-testid="input-time-period"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tool">{t('customerSatisfaction.tool')}</Label>
                    <Input
                      id="tool"
                      name="tool"
                      required
                      data-testid="input-tool"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="outcome">{t('customerSatisfaction.outcome')}</Label>
                    <Textarea
                      id="outcome"
                      name="outcome"
                      required
                      data-testid="input-outcome"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="improvement">{t('customerSatisfaction.improvement')}</Label>
                    <Textarea
                      id="improvement"
                      name="improvement"
                      data-testid="input-improvement"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-add">
                      {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-record">
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
          <DataTable columns={columns} data={records} isLoading={isLoading} emptyMessage={t('common.noData')} />
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
                <Label>{t('customerSatisfaction.timePeriod')}</Label>
                <Input name="timePeriod" defaultValue={selectedItem.timePeriod || ""} required data-testid="input-edit-time-period" />
              </div>
              <div className="space-y-2">
                <Label>{t('customerSatisfaction.tool')}</Label>
                <Input name="tool" defaultValue={selectedItem.tool || ""} required data-testid="input-edit-tool" />
              </div>
              <div className="space-y-2">
                <Label>{t('customerSatisfaction.outcome')}</Label>
                <Textarea name="outcome" defaultValue={selectedItem.outcome || ""} required data-testid="input-edit-outcome" />
              </div>
              <div className="space-y-2">
                <Label>{t('customerSatisfaction.improvement')}</Label>
                <Textarea name="improvement" defaultValue={selectedItem.improvement || ""} data-testid="input-edit-improvement" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-record">
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
                  <span className="text-muted-foreground">{t('customerSatisfaction.timePeriod')}:</span>
                  <span className="font-medium">{selectedItem.timePeriod}</span>
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
