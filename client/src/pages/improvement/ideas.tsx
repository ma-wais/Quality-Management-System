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
import type { Improvement, InsertImprovement } from "@shared/schema";

export default function ImprovementsPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Improvement | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: improvements = [], isLoading } = useQuery<Improvement[]>({
    queryKey: ["/api/improvements"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertImprovement) =>
      apiRequest("POST", "/api/improvements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvements"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertImprovement> }) =>
      apiRequest("PATCH", `/api/improvements/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvements"] });
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
      apiRequest("PATCH", `/api/improvements/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/improvements"] });
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
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      department: formData.get("department") as string,
      expectedBenefit: formData.get("expectedBenefit") as string,
      priority: formData.get("priority") as string,
      status: "submitted",
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
        description: formData.get("description") as string,
        category: formData.get("category") as string,
        department: formData.get("department") as string,
        expectedBenefit: formData.get("expectedBenefit") as string,
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
    t('improvements.idea'),
    t('improvements.category'),
    t('common.description'),
    t('common.department'),
    t('improvements.expectedBenefit'),
    t('common.priority'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    improvements.map((p) => [
      p.title || "-",
      p.category || "-",
      p.description || "-",
      p.department || "-",
      p.expectedBenefit || "-",
      t(`priority.${p.priority}`),
      t(`status.${p.status}`),
      (p as any).createdByName || "-",
      (p as any).reviewedByName || "-",
      (p as any).reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('improvements.title'),
    clause: "10.3",
    description: t('improvements.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "10.3_Improvement_Ideas",
  };

  const columns = [
    { key: "title", header: t('improvements.idea') },
    {
      key: "category",
      header: t('improvements.category'),
      render: (item: Improvement) => (
        <Badge variant="outline" className="capitalize">
          {t(`improvements.categories.${item.category}`)}
        </Badge>
      ),
    },
    {
      key: "description",
      header: t('common.description'),
      className: "max-w-xs",
      render: (item: Improvement) => (
        <span className="whitespace-pre-wrap break-words line-clamp-2">{item.description}</span>
      ),
    },
    { key: "department", header: t('common.department') },
    {
      key: "priority",
      header: t('common.priority'),
      render: (item: Improvement) => (
        <Badge className={priorityColors[item.priority] || ""}>
          {t(`priority.${item.priority}`)}
        </Badge>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Improvement) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: t('improvements.submitted'),
      render: (item: Improvement) =>
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Improvement) => (
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
      render: (item: Improvement) => {
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
        title={t('improvements.title')}
        description={t('improvements.description')}
        clause="10.3"
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
                <Button data-testid="button-add-improvement">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('improvements.submitIdea')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('improvements.submitIdea')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('formTitles.improvement')}</Label>
                    <Input
                      id="title"
                      name="title"
                      required
                      data-testid="input-title"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category">{t('improvements.category')}</Label>
                      <Select name="category" required>
                        <SelectTrigger data-testid="select-category">
                          <SelectValue placeholder={t('improvements.selectCategory')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="process">{t('improvements.categories.process')}</SelectItem>
                          <SelectItem value="product">{t('improvements.categories.product')}</SelectItem>
                          <SelectItem value="service">{t('improvements.categories.service')}</SelectItem>
                          <SelectItem value="cost_reduction">{t('improvements.categories.cost_reduction')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                  <div className="space-y-2">
                    <Label htmlFor="department">{t('common.department')}</Label>
                    <Input
                      id="department"
                      name="department"
                      data-testid="input-department"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectedBenefit">{t('improvements.expectedBenefit')}</Label>
                    <Textarea
                      id="expectedBenefit"
                      name="expectedBenefit"
                      data-testid="input-benefit"
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
                      data-testid="button-submit-improvement"
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
            data={improvements}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
          />
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
                <Label>{t('formTitles.improvement')}</Label>
                <Input name="title" defaultValue={selectedItem.title || ""} required data-testid="input-edit-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('improvements.category')}</Label>
                  <Select name="category" defaultValue={selectedItem.category || ""}>
                    <SelectTrigger data-testid="select-edit-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="process">{t('improvements.categories.process')}</SelectItem>
                      <SelectItem value="product">{t('improvements.categories.product')}</SelectItem>
                      <SelectItem value="service">{t('improvements.categories.service')}</SelectItem>
                      <SelectItem value="cost_reduction">{t('improvements.categories.cost_reduction')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea name="description" defaultValue={selectedItem.description || ""} required data-testid="input-edit-description" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.department')}</Label>
                <Input name="department" defaultValue={selectedItem.department || ""} data-testid="input-edit-department" />
              </div>
              <div className="space-y-2">
                <Label>{t('improvements.expectedBenefit')}</Label>
                <Textarea name="expectedBenefit" defaultValue={selectedItem.expectedBenefit || ""} data-testid="input-edit-benefit" />
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
                  <span className="text-muted-foreground">{t('improvements.idea')}:</span>
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
