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
import type { ImprovementFramework, InsertImprovementFramework } from "@shared/schema";

export default function ImprovementFrameworkPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ImprovementFramework | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: items = [], isLoading } = useQuery<ImprovementFramework[]>({
    queryKey: ["/api/improvement-framework"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertImprovementFramework) =>
      apiRequest("POST", "/api/improvement-framework", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvement-framework"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertImprovementFramework> }) =>
      apiRequest("PATCH", `/api/improvement-framework/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvement-framework"] });
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
      apiRequest("PATCH", `/api/improvement-framework/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvement-framework"] });
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
      area: formData.get("area") as string,
      currentState: formData.get("currentState") as string,
      targetState: formData.get("targetState") as string,
      actions: formData.get("actions") as string,
      metrics: formData.get("metrics") as string,
      responsible: formData.get("responsible") as string,
      status: formData.get("status") as string,
      priority: formData.get("priority") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        area: formData.get("area") as string,
        currentState: formData.get("currentState") as string,
        targetState: formData.get("targetState") as string,
        actions: formData.get("actions") as string,
        metrics: formData.get("metrics") as string,
        responsible: formData.get("responsible") as string,
        status: formData.get("status") as string,
        priority: formData.get("priority") as string,
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
    t('framework.area'),
    t('framework.currentState'),
    t('framework.targetState'),
    t('common.actions'),
    t('framework.metrics'),
    t('common.responsible'),
    t('common.priority'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    items.map((p) => [
      p.area || "-",
      p.currentState || "-",
      p.targetState || "-",
      p.actions || "-",
      p.metrics || "-",
      p.responsible || "-",
      t(`priority.${p.priority}`),
      t(`status.${p.status}`),
      (p as any).createdByName || "-",
      (p as any).reviewedByName || "-",
      (p as any).reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('framework.title'),
    clause: "10.1",
    description: t('framework.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "10.1_Improvement_Framework",
  };

  const columns = [
    { key: "area", header: t('framework.area') },
    {
      key: "currentState",
      header: t('framework.currentState'),
      className: "min-w-[200px]",
      render: (item: ImprovementFramework) => (
        <span className="whitespace-pre-wrap break-words">{item.currentState || "-"}</span>
      ),
    },
    {
      key: "targetState",
      header: t('framework.targetState'),
      className: "min-w-[200px]",
      render: (item: ImprovementFramework) => (
        <span className="whitespace-pre-wrap break-words">{item.targetState || "-"}</span>
      ),
    },
    {
      key: "actions",
      header: t('common.actions'),
      className: "min-w-[150px]",
      render: (item: ImprovementFramework) => (
        <span className="whitespace-pre-wrap break-words">{item.actions || "-"}</span>
      ),
    },
    { key: "responsible", header: t('common.responsible') },
    {
      key: "priority",
      header: t('common.priority'),
      render: (item: ImprovementFramework) => <Badge className={priorityColors[item.priority] || ""}>{t(`priority.${item.priority}`)}</Badge>,
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: ImprovementFramework) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: ImprovementFramework) => (
        (item as any).reviewCompletedAt ? (
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
                    <span className="font-medium">{(item as any).createdByName || '-'}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('issues.reviewedBy')}:</span>
                      <span className="font-medium">{(item as any).reviewedByName}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('issues.reviewerRole')}:</span>
                    <span className="font-medium">{(item as any).reviewedByRole ? t(`roles.${(item as any).reviewedByRole}`) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('issues.reviewDate')}:</span>
                    <span className="font-medium">
                      {(item as any).reviewCompletedAt ? new Date((item as any).reviewCompletedAt).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  {(item as any).reviewDescription && (
                    <div className="pt-2 border-t">
                      <span className="text-muted-foreground block mb-1">{t('issues.reviewDescription')}:</span>
                      <p className="text-sm">{(item as any).reviewDescription}</p>
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
      key: "actionsCol",
      header: t('common.actions'),
      render: (item: ImprovementFramework) => {
        const isCreator = user?.id === (item as any).createdBy;
        const canEdit = isCreator && !(item as any).reviewCompletedAt;
        const showReview = canReview && !(item as any).reviewCompletedAt;
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
      <PageHeader title={t('framework.title')} description={t('framework.description')} clause="10.1">
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
                <Button data-testid="button-add-improvement">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('framework.addItem')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{t('framework.addItem')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="area">{t('framework.area')}</Label>
                    <Input id="area" name="area" required data-testid="input-area" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentState">{t('framework.currentState')}</Label>
                      <Textarea id="currentState" name="currentState" required data-testid="input-current" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetState">{t('framework.targetState')}</Label>
                      <Textarea id="targetState" name="targetState" data-testid="input-target" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="actions">{t('framework.actionsRequired')}</Label>
                    <Textarea id="actions" name="actions" data-testid="input-actions" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="metrics">{t('framework.metrics')}</Label>
                      <Input id="metrics" name="metrics" data-testid="input-metrics" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="responsible">{t('common.responsible')}</Label>
                      <Input id="responsible" name="responsible" data-testid="input-responsible" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
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
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">{t('common.status')}</Label>
                      <Select name="status" defaultValue="identified">
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="identified">{t('status.identified')}</SelectItem>
                          <SelectItem value="planning">{t('status.planning')}</SelectItem>
                          <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                          <SelectItem value="completed">{t('status.completed')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-improvement">
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
          <DataTable columns={columns} data={items} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('framework.editItem')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('framework.area')}</Label>
                <Input name="area" defaultValue={selectedItem.area || ""} required data-testid="input-edit-area" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('framework.currentState')}</Label>
                  <Textarea name="currentState" defaultValue={selectedItem.currentState || ""} required data-testid="input-edit-current" />
                </div>
                <div className="space-y-2">
                  <Label>{t('framework.targetState')}</Label>
                  <Textarea name="targetState" defaultValue={selectedItem.targetState || ""} data-testid="input-edit-target" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('framework.actionsRequired')}</Label>
                <Textarea name="actions" defaultValue={selectedItem.actions || ""} data-testid="input-edit-actions" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('framework.metrics')}</Label>
                  <Input name="metrics" defaultValue={selectedItem.metrics || ""} data-testid="input-edit-metrics" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.responsible')}</Label>
                  <Input name="responsible" defaultValue={selectedItem.responsible || ""} data-testid="input-edit-responsible" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.priority')}</Label>
                  <Select name="priority" defaultValue={selectedItem.priority || "medium"}>
                    <SelectTrigger data-testid="select-edit-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedItem.status || "identified"}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identified">{t('status.identified')}</SelectItem>
                      <SelectItem value="planning">{t('status.planning')}</SelectItem>
                      <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-improvement">
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
                  <span className="text-muted-foreground">{t('framework.area')}:</span>
                  <span className="font-medium">{selectedItem.area}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                  <span className="font-medium">{(selectedItem as any).createdByName || '-'}</span>
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
