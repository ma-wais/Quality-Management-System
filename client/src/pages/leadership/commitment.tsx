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
import { EvidenceUpload } from "@/components/evidence-upload";
import type { LeadershipCommitment, InsertLeadershipCommitment } from "@shared/schema";

export default function LeadershipCommitmentPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LeadershipCommitment | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: commitments = [], isLoading } = useQuery<LeadershipCommitment[]>({
    queryKey: ["/api/leadership-commitments"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertLeadershipCommitment) =>
      apiRequest("POST", "/api/leadership-commitments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leadership-commitments"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertLeadershipCommitment> }) =>
      apiRequest("PATCH", `/api/leadership-commitments/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leadership-commitments"] });
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
      apiRequest("PATCH", `/api/leadership-commitments/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leadership-commitments"] });
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
      commitmentType: formData.get("commitmentType") as string,
      description: formData.get("description") as string,
      responsibleLeader: formData.get("responsibleLeader") as string,
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
        commitmentType: formData.get("commitmentType") as string,
        description: formData.get("description") as string,
        responsibleLeader: formData.get("responsibleLeader") as string,
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
        status: "completed",
      },
    });
  };

  const getExportHeaders = () => [
    t('common.type'),
    t('common.description'),
    t('common.responsible'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    commitments.map((c) => [
      c.commitmentType || "-",
      c.description || "-",
      c.responsibleLeader || "-",
      t(`status.${c.status}`),
      c.createdByName || "-",
      c.reviewedByName || "-",
      c.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('commitment.title'),
    clause: "5.1",
    description: t('commitment.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "5.1_Leadership_Commitment",
  };

  const columns = [
    {
      key: "commitmentType",
      header: t('common.type'),
      render: (item: LeadershipCommitment) => {
        const typeLabels: Record<string, string> = {
          customer_focus: t('commitment.customerFocus'),
          policy_objectives: t('commitment.policyObjectives'),
          resource_provision: t('commitment.resourceProvision'),
          communication: t('communication.title'),
          continual_improvement: t('improvements.title'),
        };
        return typeLabels[item.commitmentType] || item.commitmentType;
      },
    },
    {
      key: "description",
      header: t('common.description'),
      className: "min-w-[200px]",
      render: (item: LeadershipCommitment) => (
        <span className="whitespace-pre-wrap break-words">{item.description || "-"}</span>
      ),
    },
    {
      key: "responsibleLeader",
      header: t('common.responsible'),
      className: "min-w-[200px]",
      render: (item: LeadershipCommitment) => (
        <span className="whitespace-pre-wrap break-words">{item.responsibleLeader || "-"}</span>
      ),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: LeadershipCommitment) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: LeadershipCommitment) => (
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
      render: (item: LeadershipCommitment) => {
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
        title={t('commitment.title')}
        description={t('commitment.description')}
        clause="5.1"
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
                <Button data-testid="button-add-commitment">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('commitment.addCommitment')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('commitment.addCommitment')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="commitmentType">{t('common.type')}</Label>
                    <Select name="commitmentType" required>
                      <SelectTrigger data-testid="select-commitment-type">
                        <SelectValue placeholder={t('form.selectRole')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="customer_focus">{t('commitment.customerFocus')}</SelectItem>
                        <SelectItem value="policy_objectives">{t('commitment.policyObjectives')}</SelectItem>
                        <SelectItem value="resource_provision">{t('commitment.resourceProvision')}</SelectItem>
                        <SelectItem value="communication">{t('communication.title')}</SelectItem>
                        <SelectItem value="continual_improvement">{t('improvements.title')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">{t('common.description')}</Label>
                    <Textarea id="description" name="description" required data-testid="input-description" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibleLeader">{t('common.responsible')}</Label>
                    <Input id="responsibleLeader" name="responsibleLeader" required data-testid="input-leader" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">{t('common.status')}</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('status.active')}</SelectItem>
                        <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-commitment">
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
          <DataTable columns={columns} data={commitments} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('commitment.editCommitment')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common.type')}</Label>
                <Select name="commitmentType" defaultValue={selectedItem.commitmentType || ""}>
                  <SelectTrigger data-testid="select-edit-commitment-type">
                    <SelectValue placeholder={t('form.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_focus">{t('commitment.customerFocus')}</SelectItem>
                    <SelectItem value="policy_objectives">{t('commitment.policyObjectives')}</SelectItem>
                    <SelectItem value="resource_provision">{t('commitment.resourceProvision')}</SelectItem>
                    <SelectItem value="communication">{t('communication.title')}</SelectItem>
                    <SelectItem value="continual_improvement">{t('improvements.title')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea name="description" defaultValue={selectedItem.description || ""} required data-testid="input-edit-description" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.responsible')}</Label>
                <Input name="responsibleLeader" defaultValue={selectedItem.responsibleLeader || ""} required data-testid="input-edit-leader" />
              </div>
              <div className="space-y-2">
                <Label>{t('commitment.evidence')}</Label>
                <EvidenceUpload module="leadership-commitments" entityId={selectedItem.id} />
              </div>
              <div className="space-y-2">
                <Label>{t('common.status')}</Label>
                <Select name="status" defaultValue={selectedItem.status || "active"}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t('status.active')}</SelectItem>
                    <SelectItem value="under_review">{t('status.under_review')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-commitment">
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
                  <span className="text-muted-foreground">{t('common.type')}:</span>
                  <span className="font-medium">{selectedItem.commitmentType}</span>
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
