import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle, ClipboardCheck, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { ServiceDeliveryRecord, InsertServiceDelivery } from "@shared/schema";

export default function ServiceDeliveryPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ServiceDeliveryRecord | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: deliveries = [], isLoading } = useQuery<ServiceDeliveryRecord[]>({
    queryKey: ["/api/service-delivery"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertServiceDelivery) =>
      apiRequest("POST", "/api/service-delivery", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-delivery"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertServiceDelivery> }) =>
      apiRequest("PATCH", `/api/service-delivery/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-delivery"] });
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
      apiRequest("PATCH", `/api/service-delivery/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-delivery"] });
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
      date: new Date(formData.get("date") as string),
      beneficiary: formData.get("beneficiary") as string,
      service: formData.get("service") as string,
      description: formData.get("description") as string,
      employee: formData.get("employee") as string,
      duration: formData.get("duration") as string,
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
        date: new Date(formData.get("date") as string),
        beneficiary: formData.get("beneficiary") as string,
        service: formData.get("service") as string,
        description: formData.get("description") as string,
        employee: formData.get("employee") as string,
        duration: formData.get("duration") as string,
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
    t('delivery.beneficiary'),
    t('delivery.service'),
    t('common.description'),
    t('delivery.employee'),
    t('delivery.duration'),
    t('common.notes'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    deliveries.map((d) => [
      d.date ? new Date(d.date).toLocaleDateString() : "-",
      d.beneficiary || "-",
      d.service || "-",
      d.description || "-",
      d.employee || "-",
      d.duration || "-",
      d.notes || "-",
      d.createdByName || "-",
      d.reviewedByName || "-",
      d.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('delivery.title'),
    clause: "8.5",
    description: t('delivery.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "8.5_Service_Delivery",
  };

  const columns = [
    {
      key: "date",
      header: t('common.date'),
      render: (item: ServiceDeliveryRecord) => item.date ? new Date(item.date).toLocaleDateString() : "-",
    },
    { key: "beneficiary", header: t('delivery.beneficiary') },
    { key: "service", header: t('delivery.service') },
    {
      key: "description",
      header: t('common.description'),
      className: "min-w-[200px]",
      render: (item: ServiceDeliveryRecord) => (
        <span className="whitespace-pre-wrap break-words">{item.description || "-"}</span>
      ),
    },
    { key: "employee", header: t('delivery.employee') },
    { key: "duration", header: t('delivery.duration') },
    {
      key: "notes",
      header: t('common.notes'),
      className: "min-w-[150px]",
      render: (item: ServiceDeliveryRecord) => (
        <span className="whitespace-pre-wrap break-words">{item.notes || "-"}</span>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: ServiceDeliveryRecord) => (
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
      render: (item: ServiceDeliveryRecord) => {
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
        title={t('delivery.title')}
        description={t('delivery.description')}
        clause="8.5"
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
                <Button data-testid="button-add-delivery">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('delivery.addDelivery')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('delivery.addDelivery')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">{t('common.date')}</Label>
                      <Input id="date" name="date" type="date" required data-testid="input-date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">{t('delivery.duration')}</Label>
                      <Input id="duration" name="duration" data-testid="input-duration" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="beneficiary">{t('delivery.beneficiary')}</Label>
                    <Input id="beneficiary" name="beneficiary" required data-testid="input-beneficiary" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service">{t('delivery.service')}</Label>
                    <Input id="service" name="service" required data-testid="input-service" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Textarea id="description" name="description" data-testid="input-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employee">{t('delivery.employee')}</Label>
                    <Input id="employee" name="employee" required data-testid="input-employee" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">{t('common.notes')}</Label>
                    <Textarea id="notes" name="notes" data-testid="input-notes" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-delivery">
                      {createMutation.isPending ? t('common.loading') : t('delivery.addDelivery')}
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
          <DataTable columns={columns} data={deliveries} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delivery.editDelivery')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.date')}</Label>
                  <Input name="date" type="date" defaultValue={selectedItem.date ? new Date(selectedItem.date).toISOString().split('T')[0] : ""} required data-testid="input-edit-date" />
                </div>
                <div className="space-y-2">
                  <Label>{t('delivery.duration')}</Label>
                  <Input name="duration" defaultValue={selectedItem.duration || ""} data-testid="input-edit-duration" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('delivery.beneficiary')}</Label>
                <Input name="beneficiary" defaultValue={selectedItem.beneficiary || ""} required data-testid="input-edit-beneficiary" />
              </div>
              <div className="space-y-2">
                <Label>{t('delivery.service')}</Label>
                <Input name="service" defaultValue={selectedItem.service || ""} required data-testid="input-edit-service" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea name="description" defaultValue={selectedItem.description || ""} data-testid="input-edit-description" />
              </div>
              <div className="space-y-2">
                <Label>{t('delivery.employee')}</Label>
                <Input name="employee" defaultValue={selectedItem.employee || ""} required data-testid="input-edit-employee" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.notes')}</Label>
                <Textarea name="notes" defaultValue={selectedItem.notes || ""} data-testid="input-edit-notes" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-delivery">
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
                  <span className="text-muted-foreground">{t('delivery.service')}:</span>
                  <span className="font-medium">{selectedItem.service}</span>
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
