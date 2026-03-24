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
import { Progress } from "@/components/ui/progress";
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
import type { QualityObjective, InsertQualityObjective } from "@shared/schema";

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
  quarterly: 90,
  annually: 365,
};

function getDaysRemaining(createdAt: string | Date | null, frequency: string | null): number {
  if (!createdAt || !frequency) return 0;
  const created = new Date(createdAt);
  const periodDays = FREQUENCY_DAYS[frequency] || 30;
  const deadline = new Date(created.getTime() + periodDays * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDeadlineDate(createdAt: string | Date | null, frequency: string | null): Date | null {
  if (!createdAt || !frequency) return null;
  const created = new Date(createdAt);
  const periodDays = FREQUENCY_DAYS[frequency] || 30;
  return new Date(created.getTime() + periodDays * 24 * 60 * 60 * 1000);
}

export default function ObjectivesPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<QualityObjective | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: objectives = [], isLoading } = useQuery<QualityObjective[]>({
    queryKey: ["/api/objectives"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertQualityObjective) =>
      apiRequest("POST", "/api/objectives", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertQualityObjective> }) =>
      apiRequest("PATCH", `/api/objectives/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
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
      apiRequest("PATCH", `/api/objectives/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/objectives"] });
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
      objectiveTitle: formData.get("objectiveTitle") as string,
      description: formData.get("description") as string,
      targetValue: formData.get("targetValue") as string,
      currentValue: formData.get("currentValue") as string,
      unit: formData.get("unit") as string,
      owner: formData.get("owner") as string,
      department: formData.get("department") as string,
      frequency: formData.get("frequency") as string,
      status: "on_track",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    const lastReviewDateStr = formData.get("lastReviewDate") as string;
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        objectiveTitle: formData.get("objectiveTitle") as string,
        description: formData.get("description") as string,
        targetValue: formData.get("targetValue") as string,
        currentValue: formData.get("currentValue") as string,
        unit: formData.get("unit") as string,
        owner: formData.get("owner") as string,
        department: formData.get("department") as string,
        frequency: formData.get("frequency") as string,
        status: formData.get("status") as string,
        reviewComments: formData.get("reviewComments") as string,
        lastReviewDate: lastReviewDateStr ? new Date(lastReviewDateStr) : null,
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

  const getProgress = (current: string | null, target: string) => {
    const c = parseFloat(current || "0");
    const tVal = parseFloat(target);
    if (tVal === 0) return 0;
    return Math.min(100, Math.round((c / tVal) * 100));
  };

  const formatDateForInput = (date: string | Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    return d.toISOString().split("T")[0];
  };

  const getExportHeaders = () => [
    t('formTitles.qualityObjective'),
    t('objectives.progress'),
    t('objectives.currentTarget'),
    t('common.responsible'),
    t('common.department'),
    t('objectives.frequency'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    objectives.map((o) => [
      o.objectiveTitle || "-",
      `${getProgress(o.currentValue, o.targetValue)}%`,
      `${o.currentValue || "0"} / ${o.targetValue} ${o.unit || ""}`,
      o.owner || "-",
      o.department || "-",
      o.frequency ? t(`objectives.${o.frequency}`) : "-",
      t(`status.${o.status}`),
      o.createdByName || "-",
      o.reviewedByName || "-",
      o.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('objectives.title'),
    clause: "6.2",
    description: t('objectives.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "6.2_Quality_Objectives",
  };

  const columns = [
    { key: "objectiveTitle", header: t('formTitles.qualityObjective') },
    {
      key: "description",
      header: t('common.description'),
      className: "min-w-[200px]",
      render: (item: QualityObjective) => (
        <span className="whitespace-pre-wrap break-words">{item.description || "-"}</span>
      ),
    },
    {
      key: "progress",
      header: t('objectives.progress'),
      render: (item: QualityObjective) => {
        const progress = getProgress(item.currentValue, item.targetValue);
        return (
          <div className="flex items-center gap-2 min-w-[120px]">
            <Progress value={progress} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground w-10">{progress}%</span>
          </div>
        );
      },
    },
    {
      key: "values",
      header: t('objectives.currentTarget'),
      render: (item: QualityObjective) => (
        <span className="text-sm">
          {item.currentValue || "0"} / {item.targetValue} {item.unit}
        </span>
      ),
    },
    { key: "owner", header: t('common.responsible') },
    { key: "department", header: t('common.department') },
    {
      key: "frequency",
      header: t('objectives.frequency'),
      render: (item: QualityObjective) => (
        <Badge variant="outline" className="capitalize">
          {t(`objectives.${item.frequency}`)}
        </Badge>
      ),
    },
    {
      key: "daysRemaining",
      header: t('objectives.daysRemaining'),
      render: (item: QualityObjective) => {
        const days = getDaysRemaining(item.createdAt, item.frequency);
        let badgeClass = "";
        let label = "";
        if (days < 0) {
          badgeClass = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
          label = t('objectives.overdue');
        } else if (days <= 7) {
          badgeClass = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
          label = `${days} ${days === 1 ? t('objectives.day') : t('objectives.days')}`;
        } else {
          badgeClass = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
          label = `${days} ${t('objectives.days')}`;
        }
        return (
          <Badge className={badgeClass} data-testid={`badge-days-remaining-${item.id}`}>
            {label}
          </Badge>
        );
      },
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: QualityObjective) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewComments",
      header: t('objectives.reviewComments'),
      render: (item: QualityObjective) => (
        <div className="max-w-[200px]">
          {item.reviewComments && (
            <span className="text-sm text-muted-foreground truncate block">{item.reviewComments}</span>
          )}
          {item.lastReviewDate && (
            <span className="text-xs text-muted-foreground block">
              {t('objectives.lastReviewDate')}: {new Date(item.lastReviewDate).toLocaleDateString()}
            </span>
          )}
          {!item.reviewComments && !item.lastReviewDate && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: QualityObjective) => (
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
      render: (item: QualityObjective) => {
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

  const editDeadline = selectedItem ? getDeadlineDate(selectedItem.createdAt, selectedItem.frequency) : null;

  return (
    <div className="p-6">
      <PageHeader
        title={t('objectives.title')}
        description={t('objectives.description')}
        clause="6.2"
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
                <Button data-testid="button-add-objective">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('objectives.addObjective')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('objectives.addObjective')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="objectiveTitle">{t('formTitles.qualityObjective')}</Label>
                    <Input
                      id="objectiveTitle"
                      name="objectiveTitle"
                      required
                      data-testid="input-objective-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Textarea
                      id="description"
                      name="description"
                      data-testid="input-description"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetValue">{t('objectives.target')}</Label>
                      <Input
                        id="targetValue"
                        name="targetValue"
                        required
                        data-testid="input-target"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currentValue">{t('objectives.current')}</Label>
                      <Input
                        id="currentValue"
                        name="currentValue"
                        data-testid="input-current"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="unit">{t('objectives.unit')}</Label>
                      <Input
                        id="unit"
                        name="unit"
                        data-testid="input-unit"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="owner">{t('common.responsible')}</Label>
                      <Input
                        id="owner"
                        name="owner"
                        required
                        data-testid="input-owner"
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
                  <div className="space-y-2">
                    <Label htmlFor="frequency">{t('objectives.frequency')}</Label>
                    <Select name="frequency" defaultValue="monthly">
                      <SelectTrigger data-testid="select-frequency">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">{t('objectives.weekly')}</SelectItem>
                        <SelectItem value="monthly">{t('objectives.monthly')}</SelectItem>
                        <SelectItem value="quarterly">{t('objectives.quarterly')}</SelectItem>
                        <SelectItem value="annually">{t('objectives.annually')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                      data-testid="button-submit-objective"
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

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={objectives}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('objectives.addReview')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-objectiveTitle">{t('formTitles.qualityObjective')}</Label>
                <Input
                  id="edit-objectiveTitle"
                  name="objectiveTitle"
                  defaultValue={selectedItem.objectiveTitle}
                  required
                  data-testid="input-edit-objective-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('common.description')}</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedItem.description || ""}
                  data-testid="input-edit-description"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-targetValue">{t('objectives.target')}</Label>
                  <Input
                    id="edit-targetValue"
                    name="targetValue"
                    defaultValue={selectedItem.targetValue}
                    required
                    data-testid="input-edit-target"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-currentValue">{t('objectives.current')}</Label>
                  <Input
                    id="edit-currentValue"
                    name="currentValue"
                    defaultValue={selectedItem.currentValue || ""}
                    data-testid="input-edit-current"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-unit">{t('objectives.unit')}</Label>
                  <Input
                    id="edit-unit"
                    name="unit"
                    defaultValue={selectedItem.unit || ""}
                    data-testid="input-edit-unit"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-owner">{t('common.responsible')}</Label>
                  <Input
                    id="edit-owner"
                    name="owner"
                    defaultValue={selectedItem.owner}
                    required
                    data-testid="input-edit-owner"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-department">{t('common.department')}</Label>
                  <Input
                    id="edit-department"
                    name="department"
                    defaultValue={selectedItem.department || ""}
                    data-testid="input-edit-department"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-frequency">{t('objectives.frequency')}</Label>
                  <Select name="frequency" defaultValue={selectedItem.frequency || "monthly"}>
                    <SelectTrigger data-testid="select-edit-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">{t('objectives.weekly')}</SelectItem>
                      <SelectItem value="monthly">{t('objectives.monthly')}</SelectItem>
                      <SelectItem value="quarterly">{t('objectives.quarterly')}</SelectItem>
                      <SelectItem value="annually">{t('objectives.annually')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">{t('common.status')}</Label>
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-reviewComments">{t('objectives.reviewComments')}</Label>
                <Textarea
                  id="edit-reviewComments"
                  name="reviewComments"
                  defaultValue={selectedItem.reviewComments || ""}
                  data-testid="input-edit-review-comments"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastReviewDate">{t('objectives.reviewDate')}</Label>
                <Input
                  id="edit-lastReviewDate"
                  name="lastReviewDate"
                  type="date"
                  defaultValue={formatDateForInput(selectedItem.lastReviewDate)}
                  data-testid="input-edit-last-review-date"
                />
              </div>
              {editDeadline && (
                <p className="text-xs text-muted-foreground">
                  {t('objectives.canEditUntil')}: {editDeadline.toLocaleDateString()}
                </p>
              )}
              <div className="space-y-2">
                <EvidenceUpload module="objectives" entityId={selectedItem.id} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-save-edit-objective">
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
                  <span className="text-muted-foreground">{t('formTitles.qualityObjective')}:</span>
                  <span className="font-medium">{selectedItem.objectiveTitle}</span>
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
