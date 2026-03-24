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
import type { OperationalPlan, InsertOperationalPlan } from "@shared/schema";

export default function OperationalPlanningPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OperationalPlan | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: plans = [], isLoading } = useQuery<OperationalPlan[]>({
    queryKey: ["/api/operational-plans"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertOperationalPlan) =>
      apiRequest("POST", "/api/operational-plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operational-plans"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertOperationalPlan> }) =>
      apiRequest("PATCH", `/api/operational-plans/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operational-plans"] });
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
      apiRequest("PATCH", `/api/operational-plans/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/operational-plans"] });
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
      planTitle: formData.get("planTitle") as string,
      objectives: formData.get("objectives") as string,
      resources: formData.get("resources") as string,
      timeline: formData.get("timeline") as string,
      responsible: formData.get("responsible") as string,
      risks: formData.get("risks") as string,
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
        planTitle: formData.get("planTitle") as string,
        objectives: formData.get("objectives") as string,
        resources: formData.get("resources") as string,
        timeline: formData.get("timeline") as string,
        responsible: formData.get("responsible") as string,
        risks: formData.get("risks") as string,
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
      },
    });
  };

  const getExportHeaders = () => [
    t('formTitles.operationalPlan'),
    t('planning.objective'),
    t('planning.resources'),
    t('planning.timeline'),
    t('common.responsible'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    plans.map((p) => [
      p.planTitle || "-",
      p.objectives || "-",
      p.resources || "-",
      p.timeline || "-",
      p.responsible || "-",
      t(`status.${p.status}`),
      p.createdByName || "-",
      p.reviewedByName || "-",
      p.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('planning.title'),
    clause: "8.1",
    description: t('planning.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "8.1_Operational_Planning",
  };

  const columns = [
    { key: "planTitle", header: t('formTitles.operationalPlan') },
    {
      key: "objectives",
      header: t('planning.objective'),
      className: "min-w-[200px]",
      render: (item: OperationalPlan) => (
        <span className="whitespace-pre-wrap break-words">{item.objectives || "-"}</span>
      ),
    },
    {
      key: "resources",
      header: t('planning.resources'),
      className: "min-w-[150px]",
      render: (item: OperationalPlan) => (
        <span className="whitespace-pre-wrap break-words">{item.resources || "-"}</span>
      ),
    },
    { key: "timeline", header: t('planning.timeline') },
    { key: "responsible", header: t('common.responsible') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: OperationalPlan) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: OperationalPlan) => (
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
      render: (item: OperationalPlan) => {
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
        title={t('planning.title')}
        description={t('planning.description')}
        clause="8.1"
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
                <Button data-testid="button-add-plan">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('planning.addPlan')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('planning.addPlan')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="planTitle">{t('formTitles.operationalPlan')}</Label>
                    <Input id="planTitle" name="planTitle" required data-testid="input-title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objectives">{t('planning.objective')}</Label>
                    <Textarea id="objectives" name="objectives" required data-testid="input-objectives" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="resources">{t('planning.resources')}</Label>
                      <Textarea id="resources" name="resources" data-testid="input-resources" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="risks">{t('risks.risk')}</Label>
                      <Textarea id="risks" name="risks" data-testid="input-risks" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="timeline">{t('planning.timeline')}</Label>
                      <Input id="timeline" name="timeline" placeholder="e.g., Q1 2025" data-testid="input-timeline" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsible">{t('common.responsible')}</Label>
                      <Input id="responsible" name="responsible" data-testid="input-responsible" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('common.status')}</Label>
                    <Select name="status" defaultValue="planned">
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">{t('status.planned')}</SelectItem>
                        <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                        <SelectItem value="completed">{t('status.completed')}</SelectItem>
                        <SelectItem value="on_hold">{t('status.on_hold')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-plan">
                      {createMutation.isPending ? t('common.loading') : t('planning.addPlan')}
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
          <DataTable columns={columns} data={plans} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('planning.editPlan')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('formTitles.operationalPlan')}</Label>
                <Input name="planTitle" defaultValue={selectedItem.planTitle || ""} required data-testid="input-edit-title" />
              </div>
              <div className="space-y-2">
                <Label>{t('planning.objective')}</Label>
                <Textarea name="objectives" defaultValue={selectedItem.objectives || ""} required data-testid="input-edit-objectives" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('planning.resources')}</Label>
                  <Textarea name="resources" defaultValue={selectedItem.resources || ""} data-testid="input-edit-resources" />
                </div>
                <div className="space-y-2">
                  <Label>{t('risks.risk')}</Label>
                  <Textarea name="risks" defaultValue={selectedItem.risks || ""} data-testid="input-edit-risks" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('planning.timeline')}</Label>
                  <Input name="timeline" defaultValue={selectedItem.timeline || ""} data-testid="input-edit-timeline" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.responsible')}</Label>
                  <Input name="responsible" defaultValue={selectedItem.responsible || ""} data-testid="input-edit-responsible" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select name="status" defaultValue={selectedItem.status || "planned"}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">{t('status.planned')}</SelectItem>
                    <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                    <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    <SelectItem value="on_hold">{t('status.on_hold')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-plan">
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
                  <span className="text-muted-foreground">{t('formTitles.operationalPlan')}:</span>
                  <span className="font-medium">{selectedItem.planTitle}</span>
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
