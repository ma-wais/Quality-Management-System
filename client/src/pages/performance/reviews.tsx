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
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { ManagementReview, InsertManagementReview } from "@shared/schema";

export default function ReviewsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ManagementReview | null>(null);
  const [selectedReview, setSelectedReview] = useState<ManagementReview | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: reviews = [], isLoading } = useQuery<ManagementReview[]>({
    queryKey: ["/api/management-reviews"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertManagementReview) =>
      apiRequest("POST", "/api/management-reviews", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
      setOpen(false);
      toast({ title: t('reviews.reviewCreated') });
    },
    onError: () => {
      toast({ title: t('reviews.reviewFailed'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertManagementReview> }) =>
      apiRequest("PATCH", `/api/management-reviews/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
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
      apiRequest("PATCH", `/api/management-reviews/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/management-reviews"] });
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
      reviewNumber: formData.get("reviewNumber") as string,
      reviewDate: new Date(formData.get("reviewDate") as string),
      attendees: formData.get("attendees") as string,
      agendaItems: formData.get("agendaItems") as string,
      conductedBy: formData.get("conductedBy") as string,
      status: "scheduled",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        reviewNumber: formData.get("reviewNumber") as string,
        reviewDate: new Date(formData.get("reviewDate") as string),
        attendees: formData.get("attendees") as string,
        agendaItems: formData.get("agendaItems") as string,
        conductedBy: formData.get("conductedBy") as string,
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

  const getExportHeaders = () => [
    t('reviews.reviewNumber'),
    t('common.date'),
    t('reviews.conductedBy'),
    t('reviews.attendees'),
    t('reviews.agendaItems'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    reviews.map((r) => [
      r.reviewNumber || "-",
      r.reviewDate ? new Date(r.reviewDate).toLocaleDateString() : "-",
      r.conductedBy || "-",
      r.attendees || "-",
      r.agendaItems || "-",
      t(`status.${r.status}`),
      r.createdByName || "-",
      r.reviewedByName || "-",
      r.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('reviews.title'),
    clause: "9.3",
    description: t('reviews.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "9.3_Management_Reviews",
  };

  const columns = [
    { key: "reviewNumber", header: t('reviews.reviewNumber') },
    {
      key: "reviewDate",
      header: t('common.date'),
      render: (item: ManagementReview) =>
        item.reviewDate ? new Date(item.reviewDate).toLocaleDateString() : "-",
    },
    { key: "conductedBy", header: t('reviews.conductedBy') },
    {
      key: "attendees",
      header: t('reviews.attendees'),
      className: "max-w-xs",
      render: (item: ManagementReview) => (
        <span className="whitespace-pre-wrap break-words line-clamp-1">{item.attendees || "-"}</span>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: ManagementReview) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: ManagementReview) => (
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
      render: (item: ManagementReview) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        return (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedReview(item);
              }}
              data-testid={`button-view-${item.id}`}
            >
              <FileText className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t('common.view')}
            </Button>
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
        title={t('reviews.title')}
        description={t('reviews.description')}
        clause="9.3"
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
                <Button data-testid="button-add-review">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('reviews.scheduleReview')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('reviews.scheduleReview')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reviewNumber">{t('reviews.reviewNumber')}</Label>
                      <Input
                        id="reviewNumber"
                        name="reviewNumber"
                        placeholder="MR-2024-01"
                        required
                        data-testid="input-review-number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reviewDate">{t('common.date')}</Label>
                      <Input
                        id="reviewDate"
                        name="reviewDate"
                        type="date"
                        required
                        data-testid="input-review-date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="conductedBy">{t('reviews.conductedBy')}</Label>
                    <Input
                      id="conductedBy"
                      name="conductedBy"
                      placeholder={t('reviews.conductedByPlaceholder')}
                      data-testid="input-conducted-by"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="attendees">{t('reviews.attendees')}</Label>
                    <Textarea
                      id="attendees"
                      name="attendees"
                      placeholder={t('reviews.attendeesPlaceholder')}
                      data-testid="input-attendees"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agendaItems">{t('reviews.agendaItems')}</Label>
                    <Textarea
                      id="agendaItems"
                      name="agendaItems"
                      placeholder={t('reviews.agendaPlaceholder')}
                      className="min-h-[100px]"
                      data-testid="input-agenda"
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
                      data-testid="button-submit-review"
                    >
                      {createMutation.isPending ? t('reviews.scheduling') : t('reviews.scheduleReview')}
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
            data={reviews}
            isLoading={isLoading}
            emptyMessage={t('reviews.noReviews')}
          />
        </CardContent>
      </Card>

      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('reviews.reviewDetails')}</DialogTitle>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">{t('reviews.reviewNumber')}</Label>
                  <p className="font-medium">{selectedReview.reviewNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">{t('common.date')}</Label>
                  <p className="font-medium">
                    {selectedReview.reviewDate
                      ? new Date(selectedReview.reviewDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('reviews.conductedBy')}</Label>
                <p className="font-medium">{selectedReview.conductedBy || "-"}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('reviews.attendees')}</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReview.attendees || t('reviews.notSpecified')}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">{t('reviews.agendaItems')}</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">
                  {selectedReview.agendaItems || t('reviews.noAgenda')}
                </p>
              </div>
              {selectedReview.inputs && (
                <div>
                  <Label className="text-muted-foreground">{t('reviews.inputs')}</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReview.inputs}</p>
                </div>
              )}
              {selectedReview.outputs && (
                <div>
                  <Label className="text-muted-foreground">{t('reviews.outputs')}</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReview.outputs}</p>
                </div>
              )}
              {selectedReview.decisions && (
                <div>
                  <Label className="text-muted-foreground">{t('reviews.decisions')}</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReview.decisions}</p>
                </div>
              )}
              {selectedReview.actionItems && (
                <div>
                  <Label className="text-muted-foreground">{t('reviews.actionItems')}</Label>
                  <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReview.actionItems}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('reviews.reviewNumber')}</Label>
                  <Input name="reviewNumber" defaultValue={selectedItem.reviewNumber || ""} required data-testid="input-edit-review-number" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.date')}</Label>
                  <Input
                    type="date"
                    name="reviewDate"
                    defaultValue={selectedItem.reviewDate ? new Date(selectedItem.reviewDate).toISOString().split("T")[0] : ""}
                    required
                    data-testid="input-edit-review-date"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('reviews.conductedBy')}</Label>
                <Input name="conductedBy" defaultValue={selectedItem.conductedBy || ""} data-testid="input-edit-conducted-by" />
              </div>
              <div className="space-y-2">
                <Label>{t('reviews.attendees')}</Label>
                <Textarea name="attendees" defaultValue={selectedItem.attendees || ""} data-testid="input-edit-attendees" />
              </div>
              <div className="space-y-2">
                <Label>{t('reviews.agendaItems')}</Label>
                <Textarea name="agendaItems" defaultValue={selectedItem.agendaItems || ""} className="min-h-[100px]" data-testid="input-edit-agenda" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-review">
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
                  <span className="text-muted-foreground">{t('reviews.reviewNumber')}:</span>
                  <span className="font-medium">{selectedItem.reviewNumber}</span>
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
                <Button type="submit" disabled={reviewMutation.isPending} data-testid="button-submit-admin-review">
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
