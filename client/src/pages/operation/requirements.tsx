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
import type { CustomerRequirement, InsertCustomerRequirement } from "@shared/schema";

export default function CustomerRequirementsPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<CustomerRequirement | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: requirements = [], isLoading } = useQuery<CustomerRequirement[]>({
    queryKey: ["/api/customer-requirements"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertCustomerRequirement) =>
      apiRequest("POST", "/api/customer-requirements", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-requirements"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertCustomerRequirement> }) =>
      apiRequest("PATCH", `/api/customer-requirements/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-requirements"] });
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
      apiRequest("PATCH", `/api/customer-requirements/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customer-requirements"] });
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
      beneficiary: formData.get("beneficiary") as string,
      objective: formData.get("objective") as string,
      plan: formData.get("plan") as string,
      duration: formData.get("duration") as string,
      evaluation: formData.get("evaluation") as string,
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
        beneficiary: formData.get("beneficiary") as string,
        objective: formData.get("objective") as string,
        plan: formData.get("plan") as string,
        duration: formData.get("duration") as string,
        evaluation: formData.get("evaluation") as string,
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
    t('requirements.customer'),
    t('planning.objective'),
    t('planning.addPlan'),
    t('delivery.duration'),
    t('suppliers.evaluation'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    requirements.map((r) => [
      r.beneficiary || "-",
      r.objective || "-",
      r.plan || "-",
      r.duration || "-",
      r.evaluation || "-",
      t(`status.${r.status}`),
      r.createdByName || "-",
      r.reviewedByName || "-",
      r.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('requirements.title'),
    clause: "8.2",
    description: t('requirements.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "8.2_Customer_Requirements",
  };

  const columns = [
    { key: "beneficiary", header: t('requirements.customer') },
    {
      key: "objective",
      header: t('planning.objective'),
      className: "min-w-[200px]",
      render: (item: CustomerRequirement) => (
        <span className="whitespace-pre-wrap break-words">{item.objective || "-"}</span>
      ),
    },
    {
      key: "plan",
      header: t('planning.addPlan'),
      className: "min-w-[150px]",
      render: (item: CustomerRequirement) => (
        <span className="whitespace-pre-wrap break-words">{item.plan || "-"}</span>
      ),
    },
    { key: "duration", header: t('delivery.duration') },
    {
      key: "evaluation",
      header: t('suppliers.evaluation'),
      className: "min-w-[150px]",
      render: (item: CustomerRequirement) => (
        <span className="whitespace-pre-wrap break-words">{item.evaluation || "-"}</span>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: CustomerRequirement) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: CustomerRequirement) => (
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
      render: (item: CustomerRequirement) => {
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
        title={t('requirements.title')}
        description={t('requirements.description')}
        clause="8.2"
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
                <Button data-testid="button-add-requirement">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('requirements.addRequirement')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('requirements.addRequirement')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="beneficiary">{t('requirements.customer')}</Label>
                    <Input id="beneficiary" name="beneficiary" required data-testid="input-beneficiary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="objective">{t('planning.objective')}</Label>
                    <Textarea id="objective" name="objective" required data-testid="input-objective" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plan">{t('planning.addPlan')}</Label>
                    <Textarea id="plan" name="plan" required data-testid="input-plan" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duration">{t('delivery.duration')}</Label>
                      <Input id="duration" name="duration" placeholder="e.g., 3 months" data-testid="input-duration" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">{t('common.status')}</Label>
                      <Select name="status" defaultValue="active">
                        <SelectTrigger data-testid="select-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">{t('status.active')}</SelectItem>
                          <SelectItem value="completed">{t('status.completed')}</SelectItem>
                          <SelectItem value="on_hold">{t('status.on_hold')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="evaluation">{t('suppliers.evaluation')}</Label>
                    <Textarea id="evaluation" name="evaluation" data-testid="input-evaluation" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-requirement">
                      {createMutation.isPending ? t('common.loading') : t('requirements.addRequirement')}
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
          <DataTable columns={columns} data={requirements} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('requirements.editRequirement')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('requirements.customer')}</Label>
                <Input name="beneficiary" defaultValue={selectedItem.beneficiary || ""} required data-testid="input-edit-beneficiary" />
              </div>
              <div className="space-y-2">
                <Label>{t('planning.objective')}</Label>
                <Textarea name="objective" defaultValue={selectedItem.objective || ""} required data-testid="input-edit-objective" />
              </div>
              <div className="space-y-2">
                <Label>{t('planning.addPlan')}</Label>
                <Textarea name="plan" defaultValue={selectedItem.plan || ""} required data-testid="input-edit-plan" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('delivery.duration')}</Label>
                  <Input name="duration" defaultValue={selectedItem.duration || ""} data-testid="input-edit-duration" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedItem.status || "active"}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{t('status.active')}</SelectItem>
                      <SelectItem value="completed">{t('status.completed')}</SelectItem>
                      <SelectItem value="on_hold">{t('status.on_hold')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('suppliers.evaluation')}</Label>
                <Textarea name="evaluation" defaultValue={selectedItem.evaluation || ""} data-testid="input-edit-evaluation" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-requirement">
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
                  <span className="text-muted-foreground">{t('requirements.customer')}:</span>
                  <span className="font-medium">{selectedItem.beneficiary}</span>
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
