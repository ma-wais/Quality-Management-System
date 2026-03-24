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
  DialogDescription,
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
import type { CorrectiveAction, InsertCorrectiveAction } from "@shared/schema";

export default function CorrectiveActionsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CorrectiveAction | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: cars = [], isLoading } = useQuery<CorrectiveAction[]>({
    queryKey: ["/api/corrective-actions"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCorrectiveAction) =>
      apiRequest("POST", "/api/corrective-actions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
      setCreateOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertCorrectiveAction> }) =>
      apiRequest("PATCH", `/api/corrective-actions/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
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
      apiRequest("PATCH", `/api/corrective-actions/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/corrective-actions"] });
      setReviewOpen(false);
      setSelectedItem(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dueDateStr = formData.get("dueDate") as string;
    createMutation.mutate({
      carNumber: formData.get("carNumber") as string,
      title: formData.get("title") as string,
      source: formData.get("source") as string,
      description: formData.get("description") as string,
      responsiblePerson: formData.get("responsiblePerson") as string,
      department: formData.get("department") as string,
      priority: formData.get("priority") as string,
      dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
      status: "open",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    const dueDateStr = formData.get("dueDate") as string;
    const closedDateStr = formData.get("closedDate") as string;
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        title: formData.get("title") as string,
        source: formData.get("source") as string,
        description: formData.get("description") as string,
        rootCause: formData.get("rootCause") as string,
        rootCauseMethod: formData.get("rootCauseMethod") as string,
        immediateAction: formData.get("immediateAction") as string,
        correctiveAction: formData.get("correctiveAction") as string,
        preventiveAction: formData.get("preventiveAction") as string,
        responsiblePerson: formData.get("responsiblePerson") as string,
        department: formData.get("department") as string,
        priority: formData.get("priority") as string,
        status: formData.get("status") as string,
        dueDate: dueDateStr ? new Date(dueDateStr) : undefined,
        closedDate: closedDateStr ? new Date(closedDateStr) : undefined,
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

  const formatDateForInput = (date: Date | string | null | undefined) => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const getExportHeaders = () => [
    t('car.carNumber'),
    t('formTitles.correctiveAction'),
    t('car.source'),
    t('common.responsible'),
    t('common.department'),
    t('common.priority'),
    t('common.dueDate'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    cars.map((p) => [
      p.carNumber || "-",
      p.title || "-",
      p.source || "-",
      p.responsiblePerson || "-",
      p.department || "-",
      t(`priority.${p.priority}`),
      p.dueDate ? new Date(p.dueDate).toLocaleDateString() : "-",
      t(`status.${p.status}`),
      (p as any).createdByName || "-",
      (p as any).reviewedByName || "-",
      (p as any).reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('car.title'),
    clause: "10.2",
    description: t('car.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "10.2_Corrective_Actions",
  };

  const columns = [
    { key: "carNumber", header: t('car.carNumber') },
    { key: "title", header: t('formTitles.correctiveAction') },
    {
      key: "source",
      header: t('car.source'),
      render: (item: CorrectiveAction) => (
        <Badge variant="outline" className="capitalize">
          {t(`car.sources.${item.source}`)}
        </Badge>
      ),
    },
    { key: "responsiblePerson", header: t('common.responsible') },
    { key: "department", header: t('common.department') },
    {
      key: "priority",
      header: t('common.priority'),
      render: (item: CorrectiveAction) => (
        <Badge className={priorityColors[item.priority] || ""}>
          {t(`priority.${item.priority}`)}
        </Badge>
      ),
    },
    {
      key: "dueDate",
      header: t('common.dueDate'),
      render: (item: CorrectiveAction) => {
        if (!item.dueDate) return "-";
        const date = new Date(item.dueDate);
        const isOverdue = date < new Date() && item.status !== "closed" && item.status !== "verified";
        return (
          <span className={isOverdue ? "text-red-500 font-medium" : ""}>
            {date.toLocaleDateString()}
          </span>
        );
      },
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: CorrectiveAction) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: CorrectiveAction) => (
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
      key: "actions",
      header: t('common.actions'),
      render: (item: CorrectiveAction) => {
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
      <PageHeader
        title={t('car.title')}
        description={t('car.description')}
        clause="10.2"
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
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-car">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('car.addCar')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('car.createCar')}</DialogTitle>
                  <DialogDescription>{t('car.createCarDesc')}</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carNumber">{t('car.carNumber')}</Label>
                      <Input
                        id="carNumber"
                        name="carNumber"
                        placeholder="CAR-2024-001"
                        required
                        data-testid="input-car-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="source">{t('car.source')}</Label>
                      <Select name="source" required>
                        <SelectTrigger data-testid="select-source">
                          <SelectValue placeholder={t('car.selectSource')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="audit">{t('car.sources.audit')}</SelectItem>
                          <SelectItem value="customer_complaint">{t('car.sources.customer_complaint')}</SelectItem>
                          <SelectItem value="internal">{t('car.sources.internal')}</SelectItem>
                          <SelectItem value="supplier">{t('car.sources.supplier')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('formTitles.correctiveAction')}</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      data-testid="input-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Textarea
                      id="description"
                      name="description"
                      required
                      data-testid="input-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsiblePerson">{t('common.responsible')}</Label>
                      <Input
                        id="responsiblePerson"
                        name="responsiblePerson"
                        required
                        data-testid="input-responsible"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">{t('common.department')}</Label>
                      <Input
                        id="department"
                        name="department"
                        data-testid="input-department"
                      />
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
                          <SelectItem value="critical">{t('priority.critical')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">{t('common.dueDate')}</Label>
                      <Input
                        id="dueDate"
                        name="dueDate"
                        type="date"
                        data-testid="input-due-date"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-car"
                    >
                      {createMutation.isPending ? t('common.loading') : t('car.createCar')}
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
          <DataTable
            columns={columns}
            data={cars}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('car.editCar')} - {selectedItem?.carNumber}</DialogTitle>
            <DialogDescription>{t('car.editCarDesc')}</DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('car.source')}</Label>
                  <Select name="source" defaultValue={selectedItem.source}>
                    <SelectTrigger data-testid="edit-select-source">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="audit">{t('car.sources.audit')}</SelectItem>
                      <SelectItem value="customer_complaint">{t('car.sources.customer_complaint')}</SelectItem>
                      <SelectItem value="internal">{t('car.sources.internal')}</SelectItem>
                      <SelectItem value="supplier">{t('car.sources.supplier')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedItem.status}>
                    <SelectTrigger data-testid="edit-select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('status.open')}</SelectItem>
                      <SelectItem value="root_cause_analysis">{t('car.statuses.root_cause_analysis')}</SelectItem>
                      <SelectItem value="action_planned">{t('car.statuses.action_planned')}</SelectItem>
                      <SelectItem value="implemented">{t('car.statuses.implemented')}</SelectItem>
                      <SelectItem value="verified">{t('car.statuses.verified')}</SelectItem>
                      <SelectItem value="closed">{t('status.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('formTitles.correctiveAction')}</Label>
                <Input
                  name="title"
                  defaultValue={selectedItem.title}
                  required
                  data-testid="edit-input-title"
                />
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea
                  name="description"
                  defaultValue={selectedItem.description}
                  required
                  data-testid="edit-input-description"
                />
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">{t('car.rootCauseAnalysis')}</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>{t('car.analysisMethod')}</Label>
                    <Select name="rootCauseMethod" defaultValue={selectedItem.rootCauseMethod || ""}>
                      <SelectTrigger data-testid="edit-select-rca-method">
                        <SelectValue placeholder={t('car.selectMethod')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5_why">{t('car.methods.5_why')}</SelectItem>
                        <SelectItem value="fishbone">{t('car.methods.fishbone')}</SelectItem>
                        <SelectItem value="pareto">{t('car.methods.pareto')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t('car.rootCause')}</Label>
                  <Textarea
                    name="rootCause"
                    defaultValue={selectedItem.rootCause || ""}
                    data-testid="edit-input-root-cause"
                  />
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">{t('common.actions')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>{t('car.immediateAction')}</Label>
                    <Textarea
                      name="immediateAction"
                      defaultValue={selectedItem.immediateAction || ""}
                      data-testid="edit-input-immediate-action"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('car.correctiveAction')}</Label>
                    <Textarea
                      name="correctiveAction"
                      defaultValue={selectedItem.correctiveAction || ""}
                      data-testid="edit-input-corrective-action"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('car.preventiveAction')}</Label>
                    <Textarea
                      name="preventiveAction"
                      defaultValue={selectedItem.preventiveAction || ""}
                      data-testid="edit-input-preventive-action"
                    />
                  </div>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('common.responsible')}</Label>
                    <Input
                      name="responsiblePerson"
                      defaultValue={selectedItem.responsiblePerson}
                      required
                      data-testid="edit-input-responsible"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('common.department')}</Label>
                    <Input
                      name="department"
                      defaultValue={selectedItem.department || ""}
                      data-testid="edit-input-department"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>{t('common.priority')}</Label>
                    <Select name="priority" defaultValue={selectedItem.priority}>
                      <SelectTrigger data-testid="edit-select-priority">
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
                  <div className="space-y-2">
                    <Label>{t('common.dueDate')}</Label>
                    <Input
                      name="dueDate"
                      type="date"
                      defaultValue={formatDateForInput(selectedItem.dueDate)}
                      data-testid="edit-input-due-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('car.closedDate')}</Label>
                    <Input
                      name="closedDate"
                      type="date"
                      defaultValue={formatDateForInput(selectedItem.closedDate)}
                      data-testid="edit-input-closed-date"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Evidence</Label>
                <EvidenceUpload module="corrective-actions" entityId={selectedItem.id} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedItem(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={editMutation.isPending}
                  data-testid="button-update-car"
                >
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
                  <span className="text-muted-foreground">{t('car.carNumber')}:</span>
                  <span className="font-medium">{selectedItem.carNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('formTitles.correctiveAction')}:</span>
                  <span className="font-medium">{selectedItem.title}</span>
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
