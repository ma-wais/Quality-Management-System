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
import type { InterestedParty, InsertInterestedParty } from "@shared/schema";

export default function InterestedParties() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InterestedParty | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: parties = [], isLoading } = useQuery<InterestedParty[]>({
    queryKey: ["/api/interested-parties"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInterestedParty) =>
      apiRequest("POST", "/api/interested-parties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interested-parties"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertInterestedParty> }) =>
      apiRequest("PATCH", `/api/interested-parties/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interested-parties"] });
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
      apiRequest("PATCH", `/api/interested-parties/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/interested-parties"] });
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
      name: formData.get("name") as string,
      partyType: formData.get("partyType") as string,
      requirements: formData.get("requirements") as string,
      expectations: formData.get("expectations") as string,
      followUpMethod: formData.get("followUpMethod") as string,
      impact: formData.get("impact") as string,
      reviewStatus: "pending",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        name: formData.get("name") as string,
        partyType: formData.get("partyType") as string,
        requirements: formData.get("requirements") as string,
        expectations: formData.get("expectations") as string,
        followUpMethod: formData.get("followUpMethod") as string,
        impact: formData.get("impact") as string,
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
        reviewStatus: "completed",
      },
    });
  };

  const getExportHeaders = () => [
    t('formTitles.interestedParty'),
    t('common.type'),
    t('parties.requirements'),
    t('parties.expectations'),
    t('parties.followUpMethod'),
    t('issues.impact'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    parties.map((p) => [
      p.name || "-",
      p.partyType || "-",
      p.requirements || "-",
      p.expectations || "-",
      p.followUpMethod || "-",
      p.impact || "-",
      t(`status.${p.reviewStatus}`),
      p.createdByName || "-",
      p.reviewedByName || "-",
      p.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('parties.title'),
    clause: "4.2",
    description: t('parties.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "4.2_Interested_Parties",
  };

  const columns = [
    { key: "name", header: t('formTitles.interestedParty') },
    {
      key: "partyType",
      header: t('common.type'),
      render: (item: InterestedParty) => (
        <Badge variant="outline" className="capitalize">
          {item.partyType?.replace("_", " ")}
        </Badge>
      ),
    },
    {
      key: "requirements",
      header: t('parties.requirements'),
      className: "min-w-[200px]",
      render: (item: InterestedParty) => (
        <span className="whitespace-pre-wrap break-words">{item.requirements || "-"}</span>
      ),
    },
    {
      key: "expectations",
      header: t('parties.expectations'),
      className: "min-w-[150px]",
      render: (item: InterestedParty) => (
        <span className="whitespace-pre-wrap break-words">{item.expectations || "-"}</span>
      ),
    },
    {
      key: "impact",
      header: t('issues.impact'),
      render: (item: InterestedParty) => (
        <Badge className={statusColors[item.impact || "medium"] || ""}>
          {t(`priority.${item.impact || "medium"}`)}
        </Badge>
      ),
    },
    {
      key: "reviewStatus",
      header: t('common.status'),
      render: (item: InterestedParty) => (
        <Badge className={statusColors[item.reviewStatus] || ""}>
          {t(`status.${item.reviewStatus}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: InterestedParty) => (
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
      render: (item: InterestedParty) => {
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
        title={t('parties.title')}
        description={t('parties.description')}
        clause="4.2"
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
                <Button data-testid="button-add-party">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('parties.addParty')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('parties.addParty')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('formTitles.interestedParty')}</Label>
                      <Input id="name" name="name" required data-testid="input-name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="partyType">{t('common.type')}</Label>
                      <Select name="partyType" required>
                        <SelectTrigger data-testid="select-party-type">
                          <SelectValue placeholder={t('form.selectRole')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">{t('parties.customer')}</SelectItem>
                          <SelectItem value="supplier">{t('parties.supplier')}</SelectItem>
                          <SelectItem value="regulator">{t('parties.regulator')}</SelectItem>
                          <SelectItem value="employee">{t('parties.employee')}</SelectItem>
                          <SelectItem value="shareholder">{t('parties.shareholder')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="requirements">{t('parties.requirements')}</Label>
                    <Textarea id="requirements" name="requirements" data-testid="input-requirements" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expectations">{t('parties.expectations')}</Label>
                    <Textarea id="expectations" name="expectations" data-testid="input-expectations" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="followUpMethod">{t('parties.followUpMethod')}</Label>
                    <Input id="followUpMethod" name="followUpMethod" data-testid="input-followUpMethod" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="impact">{t('issues.impact')}</Label>
                    <Select name="impact" defaultValue="medium">
                      <SelectTrigger data-testid="select-impact">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">{t('priority.high')}</SelectItem>
                        <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                        <SelectItem value="low">{t('priority.low')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-party">
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
          <DataTable columns={columns} data={parties} isLoading={isLoading} emptyMessage={t('common.noData')} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('parties.editParty')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('formTitles.interestedParty')}</Label>
                  <Input name="name" defaultValue={selectedItem.name || ""} required data-testid="input-edit-name" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.type')}</Label>
                  <Select name="partyType" defaultValue={selectedItem.partyType || ""}>
                    <SelectTrigger data-testid="select-edit-party-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">{t('parties.customer')}</SelectItem>
                      <SelectItem value="supplier">{t('parties.supplier')}</SelectItem>
                      <SelectItem value="regulator">{t('parties.regulator')}</SelectItem>
                      <SelectItem value="employee">{t('parties.employee')}</SelectItem>
                      <SelectItem value="shareholder">{t('parties.shareholder')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('parties.requirements')}</Label>
                <Textarea name="requirements" defaultValue={selectedItem.requirements || ""} data-testid="input-edit-requirements" />
              </div>
              <div className="space-y-2">
                <Label>{t('parties.expectations')}</Label>
                <Textarea name="expectations" defaultValue={selectedItem.expectations || ""} data-testid="input-edit-expectations" />
              </div>
              <div className="space-y-2">
                <Label>{t('parties.followUpMethod')}</Label>
                <Input name="followUpMethod" defaultValue={selectedItem.followUpMethod || ""} data-testid="input-edit-followUpMethod" />
              </div>
              <div className="space-y-2">
                <Label>{t('issues.impact')}</Label>
                <Select name="impact" defaultValue={selectedItem.impact || "medium"}>
                  <SelectTrigger data-testid="select-edit-impact">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">{t('priority.high')}</SelectItem>
                    <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                    <SelectItem value="low">{t('priority.low')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-party">
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
                  <span className="text-muted-foreground">{t('formTitles.interestedParty')}:</span>
                  <span className="font-medium">{selectedItem.name}</span>
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
