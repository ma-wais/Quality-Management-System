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
import type { InnovationInitiative, InsertInnovationInitiative } from "@shared/schema";

export default function InnovationInitiativesPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InnovationInitiative | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: items = [], isLoading } = useQuery<InnovationInitiative[]>({
    queryKey: ["/api/innovation-initiatives"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInnovationInitiative) =>
      apiRequest("POST", "/api/innovation-initiatives", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/innovation-initiatives"] });
      setCreateOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertInnovationInitiative> }) =>
      apiRequest("PATCH", `/api/innovation-initiatives/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/innovation-initiatives"] });
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
      apiRequest("PATCH", `/api/innovation-initiatives/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/innovation-initiatives"] });
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
    const dateStr = formData.get("date") as string;
    createMutation.mutate({
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      date: dateStr ? new Date(dateStr) : undefined,
      type: formData.get("type") as string,
      impact: formData.get("impact") as string,
      status: formData.get("status") as string,
      submittedBy: formData.get("submittedBy") as string,
      department: formData.get("department") as string,
      expectedOutcome: formData.get("expectedOutcome") as string,
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get("date") as string;
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        name: formData.get("name") as string,
        description: formData.get("description") as string,
        date: dateStr ? new Date(dateStr) : undefined,
        type: formData.get("type") as string,
        impact: formData.get("impact") as string,
        status: formData.get("status") as string,
        submittedBy: formData.get("submittedBy") as string,
        department: formData.get("department") as string,
        expectedOutcome: formData.get("expectedOutcome") as string,
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
    t('innovationInitiatives.name'),
    t('innovationInitiatives.type'),
    t('innovationInitiatives.impact'),
    t('innovationInitiatives.department'),
    t('innovationInitiatives.submittedBy'),
    t('innovationInitiatives.date'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    items.map((p) => [
      p.name || "-",
      p.type || "-",
      p.impact || "-",
      p.department || "-",
      p.submittedBy || "-",
      p.date ? new Date(p.date).toLocaleDateString() : "-",
      t(`status.${p.status}`),
      (p as any).createdByName || "-",
      (p as any).reviewedByName || "-",
      (p as any).reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('innovationInitiatives.title'),
    clause: "10.4",
    description: t('innovationInitiatives.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "10.4_Innovation_Initiatives",
  };

  const columns = [
    { key: "name", header: t('innovationInitiatives.name') },
    {
      key: "type",
      header: t('innovationInitiatives.type'),
      render: (item: InnovationInitiative) => (
        <Badge variant="outline" className="capitalize" data-testid={`badge-type-${item.id}`}>
          {t(`innovationInitiatives.types.${item.type}`)}
        </Badge>
      ),
    },
    {
      key: "impact",
      header: t('innovationInitiatives.impact'),
      render: (item: InnovationInitiative) => (
        <Badge className={statusColors[item.impact] || ""} data-testid={`badge-impact-${item.id}`}>
          {t(`innovationInitiatives.impacts.${item.impact}`)}
        </Badge>
      ),
    },
    { key: "department", header: t('innovationInitiatives.department') },
    { key: "submittedBy", header: t('innovationInitiatives.submittedBy') },
    {
      key: "date",
      header: t('innovationInitiatives.date'),
      render: (item: InnovationInitiative) => (
        <span data-testid={`text-date-${item.id}`}>
          {item.date ? new Date(item.date).toLocaleDateString() : "-"}
        </span>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: InnovationInitiative) => (
        <Badge className={statusColors[item.status] || ""} data-testid={`badge-status-${item.id}`}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: InnovationInitiative) => (
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
      render: (item: InnovationInitiative) => {
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

  const formFields = (defaults?: InnovationInitiative) => (
    <>
      <div className="space-y-2">
        <Label htmlFor={defaults ? "edit-name" : "name"}>{t('innovationInitiatives.name')}</Label>
        <Input
          id={defaults ? "edit-name" : "name"}
          name="name"
          required
          defaultValue={defaults?.name || ""}
          data-testid="input-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={defaults ? "edit-description" : "description"}>{t('innovationInitiatives.description')}</Label>
        <Textarea
          id={defaults ? "edit-description" : "description"}
          name="description"
          defaultValue={defaults?.description || ""}
          data-testid="input-description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={defaults ? "edit-date" : "date"}>{t('innovationInitiatives.date')}</Label>
          <Input
            id={defaults ? "edit-date" : "date"}
            name="date"
            type="date"
            defaultValue={defaults ? formatDateForInput(defaults.date) : ""}
            data-testid="input-date"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('innovationInitiatives.type')}</Label>
          <Select name="type" defaultValue={defaults?.type || "process"}>
            <SelectTrigger data-testid="select-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product">{t('innovationInitiatives.types.product')}</SelectItem>
              <SelectItem value="process">{t('innovationInitiatives.types.process')}</SelectItem>
              <SelectItem value="service">{t('innovationInitiatives.types.service')}</SelectItem>
              <SelectItem value="technology">{t('innovationInitiatives.types.technology')}</SelectItem>
              <SelectItem value="organizational">{t('innovationInitiatives.types.organizational')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('innovationInitiatives.impact')}</Label>
          <Select name="impact" defaultValue={defaults?.impact || "medium"}>
            <SelectTrigger data-testid="select-impact">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{t('innovationInitiatives.impacts.high')}</SelectItem>
              <SelectItem value="medium">{t('innovationInitiatives.impacts.medium')}</SelectItem>
              <SelectItem value="low">{t('innovationInitiatives.impacts.low')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('common.status')}</Label>
          <Select name="status" defaultValue={defaults?.status || "proposed"}>
            <SelectTrigger data-testid="select-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="proposed">{t('status.proposed')}</SelectItem>
              <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
              <SelectItem value="approved">{t('status.approved')}</SelectItem>
              <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
              <SelectItem value="implemented">{t('status.implemented')}</SelectItem>
              <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={defaults ? "edit-submittedBy" : "submittedBy"}>{t('innovationInitiatives.submittedBy')}</Label>
          <Input
            id={defaults ? "edit-submittedBy" : "submittedBy"}
            name="submittedBy"
            defaultValue={defaults?.submittedBy || ""}
            data-testid="input-submitted-by"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={defaults ? "edit-department" : "department"}>{t('innovationInitiatives.department')}</Label>
          <Input
            id={defaults ? "edit-department" : "department"}
            name="department"
            defaultValue={defaults?.department || ""}
            data-testid="input-department"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor={defaults ? "edit-expectedOutcome" : "expectedOutcome"}>{t('innovationInitiatives.expectedOutcome')}</Label>
        <Textarea
          id={defaults ? "edit-expectedOutcome" : "expectedOutcome"}
          name="expectedOutcome"
          defaultValue={defaults?.expectedOutcome || ""}
          data-testid="input-expected-outcome"
        />
      </div>
    </>
  );

  return (
    <div className="p-6">
      <PageHeader
        title={t('innovationInitiatives.title')}
        description={t('innovationInitiatives.description')}
        clause="10.4"
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
                <Button data-testid="button-add-initiative">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('innovationInitiatives.addInitiative')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{t('innovationInitiatives.addInitiative')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="space-y-4">
                  {formFields()}
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreateOpen(false)}
                      data-testid="button-cancel-create"
                    >
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-submit-initiative"
                    >
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
          <DataTable
            columns={columns}
            data={items}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('innovationInitiatives.editInitiative')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              {formFields(selectedItem)}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedItem(null);
                  }}
                  data-testid="button-cancel-edit"
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={editMutation.isPending}
                  data-testid="button-submit-edit"
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
                  <span className="text-muted-foreground">{t('innovationInitiatives.name')}:</span>
                  <span className="font-medium">{selectedItem.name}</span>
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
