import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, MessageSquare, AlertTriangle, CheckCircle, ClipboardCheck, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { Complaint, Nonconformity, InsertComplaint, InsertNonconformity } from "@shared/schema";

export default function NonconformingOutputsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const [complaintOpen, setComplaintOpen] = useState(false);
  const [ncOpen, setNcOpen] = useState(false);
  const [editComplaintOpen, setEditComplaintOpen] = useState(false);
  const [editNcOpen, setEditNcOpen] = useState(false);
  const [reviewComplaintOpen, setReviewComplaintOpen] = useState(false);
  const [reviewNcOpen, setReviewNcOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [selectedNc, setSelectedNc] = useState<Nonconformity | null>(null);
  const { toast } = useToast();

  const { data: complaints = [], isLoading: complaintsLoading } = useQuery<Complaint[]>({
    queryKey: ["/api/complaints"],
  });

  const { data: nonconformities = [], isLoading: ncLoading } = useQuery<Nonconformity[]>({
    queryKey: ["/api/nonconformities"],
  });

  const createComplaintMutation = useMutation({
    mutationFn: (data: InsertComplaint) => apiRequest("POST", "/api/complaints", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      setComplaintOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editComplaintMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertComplaint> }) =>
      apiRequest("PATCH", `/api/complaints/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      setEditComplaintOpen(false);
      setSelectedComplaint(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewComplaintMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/complaints/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/complaints"] });
      setReviewComplaintOpen(false);
      setSelectedComplaint(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const createNcMutation = useMutation({
    mutationFn: (data: InsertNonconformity) => apiRequest("POST", "/api/nonconformities", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nonconformities"] });
      setNcOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editNcMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertNonconformity> }) =>
      apiRequest("PATCH", `/api/nonconformities/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nonconformities"] });
      setEditNcOpen(false);
      setSelectedNc(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewNcMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/nonconformities/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nonconformities"] });
      setReviewNcOpen(false);
      setSelectedNc(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleComplaintSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createComplaintMutation.mutate({
      number: formData.get("number") as string,
      date: new Date(formData.get("date") as string),
      complainant: formData.get("complainant") as string,
      complaint: formData.get("complaint") as string,
      action: formData.get("action") as string,
      responsible: formData.get("responsible") as string,
      status: formData.get("status") as string,
    });
  };

  const handleEditComplaintSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    const formData = new FormData(e.currentTarget);
    editComplaintMutation.mutate({
      id: selectedComplaint.id,
      updates: {
        number: formData.get("number") as string,
        date: new Date(formData.get("date") as string),
        complainant: formData.get("complainant") as string,
        complaint: formData.get("complaint") as string,
        action: formData.get("action") as string,
        responsible: formData.get("responsible") as string,
        status: formData.get("status") as string,
      },
    });
  };

  const handleReviewComplaintSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    const formData = new FormData(e.currentTarget);
    reviewComplaintMutation.mutate({
      id: selectedComplaint.id,
      reviewData: {
        reviewDescription: formData.get("reviewDescription") as string,
        reviewedById: user?.id,
        reviewedByName: user?.fullName || "Unknown",
        reviewedByRole: userRole,
        reviewCompletedAt: new Date().toISOString(),
      },
    });
  };

  const handleNcSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createNcMutation.mutate({
      date: new Date(formData.get("date") as string),
      description: formData.get("description") as string,
      cause: formData.get("cause") as string,
      action: formData.get("action") as string,
      closure: formData.get("closure") as string,
      status: formData.get("status") as string,
    });
  };

  const handleEditNcSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedNc) return;
    const formData = new FormData(e.currentTarget);
    editNcMutation.mutate({
      id: selectedNc.id,
      updates: {
        date: new Date(formData.get("date") as string),
        description: formData.get("description") as string,
        cause: formData.get("cause") as string,
        action: formData.get("action") as string,
        closure: formData.get("closure") as string,
        status: formData.get("status") as string,
      },
    });
  };

  const handleReviewNcSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedNc) return;
    const formData = new FormData(e.currentTarget);
    reviewNcMutation.mutate({
      id: selectedNc.id,
      reviewData: {
        reviewDescription: formData.get("reviewDescription") as string,
        reviewedById: user?.id,
        reviewedByName: user?.fullName || "Unknown",
        reviewedByRole: userRole,
        reviewCompletedAt: new Date().toISOString(),
      },
    });
  };

  const getComplaintExportHeaders = () => [
    "#",
    t('common.date'),
    t('nonconforming.complainant'),
    t('nonconforming.complaint'),
    t('resources.action'),
    t('common.responsible'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getComplaintExportRows = () =>
    complaints.map((c) => [
      c.number || "-",
      c.date ? new Date(c.date).toLocaleDateString() : "-",
      c.complainant || "-",
      c.complaint || "-",
      c.action || "-",
      c.responsible || "-",
      t(`status.${c.status}`),
      c.createdByName || "-",
      c.reviewedByName || "-",
      c.reviewDescription || "-",
    ]);

  const complaintExportConfig = {
    title: t('nonconforming.complaints'),
    clause: "8.7",
    description: t('nonconforming.description'),
    headers: getComplaintExportHeaders(),
    rows: getComplaintExportRows(),
    isRtl,
    filename: "8.7_Complaints",
  };

  const getNcExportHeaders = () => [
    t('common.date'),
    t('common.description'),
    t('nonconforming.cause'),
    t('resources.action'),
    t('nonconforming.closure'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getNcExportRows = () =>
    nonconformities.map((n) => [
      n.date ? new Date(n.date).toLocaleDateString() : "-",
      n.description || "-",
      n.cause || "-",
      n.action || "-",
      n.closure || "-",
      t(`status.${n.status}`),
      n.createdByName || "-",
      n.reviewedByName || "-",
      n.reviewDescription || "-",
    ]);

  const ncExportConfig = {
    title: t('nonconforming.nonconformities'),
    clause: "8.7",
    description: t('nonconforming.description'),
    headers: getNcExportHeaders(),
    rows: getNcExportRows(),
    isRtl,
    filename: "8.7_Nonconformities",
  };

  const renderReviewPopover = (item: Complaint | Nonconformity) => (
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
  );

  const complaintColumns = [
    { key: "number", header: "#" },
    {
      key: "date",
      header: t('common.date'),
      render: (item: Complaint) => item.date ? new Date(item.date).toLocaleDateString() : "-",
    },
    { key: "complainant", header: t('nonconforming.complainant') },
    {
      key: "complaint",
      header: t('nonconforming.complaint'),
      className: "min-w-[200px]",
      render: (item: Complaint) => (
        <span className="whitespace-pre-wrap break-words">{item.complaint || "-"}</span>
      ),
    },
    {
      key: "action",
      header: t('resources.action'),
      className: "min-w-[150px]",
      render: (item: Complaint) => (
        <span className="whitespace-pre-wrap break-words">{item.action || "-"}</span>
      ),
    },
    { key: "responsible", header: t('common.responsible') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Complaint) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Complaint) => renderReviewPopover(item),
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: Complaint) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedComplaint(item); setEditComplaintOpen(true); }} data-testid={`button-edit-complaint-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showReview && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedComplaint(item); setReviewComplaintOpen(true); }} data-testid={`button-review-complaint-${item.id}`}>
                <ClipboardCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.review')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const ncColumns = [
    {
      key: "date",
      header: t('common.date'),
      render: (item: Nonconformity) => item.date ? new Date(item.date).toLocaleDateString() : "-",
    },
    {
      key: "description",
      header: t('common.description'),
      className: "min-w-[200px]",
      render: (item: Nonconformity) => (
        <span className="whitespace-pre-wrap break-words">{item.description || "-"}</span>
      ),
    },
    {
      key: "cause",
      header: t('nonconforming.cause'),
      className: "min-w-[150px]",
      render: (item: Nonconformity) => (
        <span className="whitespace-pre-wrap break-words">{item.cause || "-"}</span>
      ),
    },
    {
      key: "action",
      header: t('resources.action'),
      className: "min-w-[150px]",
      render: (item: Nonconformity) => (
        <span className="whitespace-pre-wrap break-words">{item.action || "-"}</span>
      ),
    },
    { key: "closure", header: t('nonconforming.closure') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Nonconformity) => <Badge className={statusColors[item.status] || ""}>{t(`status.${item.status}`)}</Badge>,
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Nonconformity) => renderReviewPopover(item),
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: Nonconformity) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedNc(item); setEditNcOpen(true); }} data-testid={`button-edit-nc-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showReview && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedNc(item); setReviewNcOpen(true); }} data-testid={`button-review-nc-${item.id}`}>
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
        title={t('nonconforming.title')}
        description={t('nonconforming.description')}
        clause="8.7"
      >
        <div className="flex gap-2">
          {canExport && (
            <>
              <Button variant="outline" size="sm" onClick={() => exportToWord(complaintExportConfig)} data-testid="button-export-word">
                <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.exportWord')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToExcel(complaintExportConfig)} data-testid="button-export-excel">
                <FileSpreadsheet className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.exportExcel')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportToPdf(complaintExportConfig)} data-testid="button-export-pdf">
                <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.exportPdf')}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      <Tabs defaultValue="complaints" className="space-y-4">
        <TabsList>
          <TabsTrigger value="complaints" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {t('nonconforming.complaints')}
          </TabsTrigger>
          <TabsTrigger value="nonconformities" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('nonconforming.nonconformities')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="complaints">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('nonconforming.complaints')}</CardTitle>
              {canCreate && (
                <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-complaint">
                      <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('nonconforming.addComplaint')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('nonconforming.addComplaint')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleComplaintSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="number">#</Label>
                          <Input id="number" name="number" required data-testid="input-number" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="date">{t('common.date')}</Label>
                          <Input id="date" name="date" type="date" required data-testid="input-date" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complainant">{t('nonconforming.complainant')}</Label>
                        <Input id="complainant" name="complainant" data-testid="input-complainant" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="complaint">{t('nonconforming.complaint')}</Label>
                        <Textarea id="complaint" name="complaint" required data-testid="input-complaint" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="action">{t('resources.action')}</Label>
                        <Textarea id="action" name="action" data-testid="input-action" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="responsible">{t('common.responsible')}</Label>
                          <Input id="responsible" name="responsible" data-testid="input-responsible" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">{t('common.status')}</Label>
                          <Select name="status" defaultValue="open">
                            <SelectTrigger data-testid="select-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">{t('status.open')}</SelectItem>
                              <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                              <SelectItem value="closed">{t('status.closed')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setComplaintOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" disabled={createComplaintMutation.isPending} data-testid="button-submit-complaint">
                          {createComplaintMutation.isPending ? t('common.loading') : t('nonconforming.addComplaint')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={complaintColumns} data={complaints} isLoading={complaintsLoading} emptyMessage={t('common.noData')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nonconformities">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('nonconforming.nonconformities')}</CardTitle>
              {canCreate && (
                <Dialog open={ncOpen} onOpenChange={setNcOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-nc">
                      <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('nonconforming.addNc')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('nonconforming.addNc')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleNcSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="date">{t('common.date')}</Label>
                        <Input id="date" name="date" type="date" required data-testid="input-nc-date" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{t('common.description')}</Label>
                        <Textarea id="description" name="description" required data-testid="input-nc-description" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cause">{t('nonconforming.cause')}</Label>
                        <Textarea id="cause" name="cause" data-testid="input-nc-cause" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="action">{t('resources.action')}</Label>
                        <Textarea id="action" name="action" data-testid="input-nc-action" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="closure">{t('nonconforming.closure')}</Label>
                          <Input id="closure" name="closure" data-testid="input-nc-closure" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="status">{t('common.status')}</Label>
                          <Select name="status" defaultValue="open">
                            <SelectTrigger data-testid="select-nc-status">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">{t('status.open')}</SelectItem>
                              <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                              <SelectItem value="closed">{t('status.closed')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setNcOpen(false)}>{t('common.cancel')}</Button>
                        <Button type="submit" disabled={createNcMutation.isPending} data-testid="button-submit-nc">
                          {createNcMutation.isPending ? t('common.loading') : t('nonconforming.addNc')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={ncColumns} data={nonconformities} isLoading={ncLoading} emptyMessage={t('common.noData')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editComplaintOpen} onOpenChange={setEditComplaintOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('nonconforming.editComplaint')}</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <form onSubmit={handleEditComplaintSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>#</Label>
                  <Input name="number" defaultValue={selectedComplaint.number || ""} required data-testid="input-edit-number" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.date')}</Label>
                  <Input name="date" type="date" defaultValue={selectedComplaint.date ? new Date(selectedComplaint.date).toISOString().split('T')[0] : ""} required data-testid="input-edit-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('nonconforming.complainant')}</Label>
                <Input name="complainant" defaultValue={selectedComplaint.complainant || ""} data-testid="input-edit-complainant" />
              </div>
              <div className="space-y-2">
                <Label>{t('nonconforming.complaint')}</Label>
                <Textarea name="complaint" defaultValue={selectedComplaint.complaint || ""} required data-testid="input-edit-complaint" />
              </div>
              <div className="space-y-2">
                <Label>{t('resources.action')}</Label>
                <Textarea name="action" defaultValue={selectedComplaint.action || ""} data-testid="input-edit-action" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.responsible')}</Label>
                  <Input name="responsible" defaultValue={selectedComplaint.responsible || ""} data-testid="input-edit-responsible" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedComplaint.status || "open"}>
                    <SelectTrigger data-testid="select-edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('status.open')}</SelectItem>
                      <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                      <SelectItem value="closed">{t('status.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditComplaintOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editComplaintMutation.isPending} data-testid="button-update-complaint">
                  {editComplaintMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reviewComplaintOpen} onOpenChange={setReviewComplaintOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('issues.reviewRecord')}</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <form onSubmit={handleReviewComplaintSubmit} className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('nonconforming.complaint')}:</span>
                  <span className="font-medium">{selectedComplaint.complaint}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                  <span className="font-medium">{selectedComplaint.createdByName || '-'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDescription">{t('issues.remarks')}</Label>
                <Textarea id="reviewDescription" name="reviewDescription" required data-testid="input-review-complaint-description" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReviewComplaintOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={reviewComplaintMutation.isPending} data-testid="button-submit-review-complaint">
                  {reviewComplaintMutation.isPending ? t('common.loading') : t('issues.submitReview')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editNcOpen} onOpenChange={setEditNcOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('nonconforming.editNc')}</DialogTitle>
          </DialogHeader>
          {selectedNc && (
            <form onSubmit={handleEditNcSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common.date')}</Label>
                <Input name="date" type="date" defaultValue={selectedNc.date ? new Date(selectedNc.date).toISOString().split('T')[0] : ""} required data-testid="input-edit-nc-date" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea name="description" defaultValue={selectedNc.description || ""} required data-testid="input-edit-nc-description" />
              </div>
              <div className="space-y-2">
                <Label>{t('nonconforming.cause')}</Label>
                <Textarea name="cause" defaultValue={selectedNc.cause || ""} data-testid="input-edit-nc-cause" />
              </div>
              <div className="space-y-2">
                <Label>{t('resources.action')}</Label>
                <Textarea name="action" defaultValue={selectedNc.action || ""} data-testid="input-edit-nc-action" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('nonconforming.closure')}</Label>
                  <Input name="closure" defaultValue={selectedNc.closure || ""} data-testid="input-edit-nc-closure" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.status')}</Label>
                  <Select name="status" defaultValue={selectedNc.status || "open"}>
                    <SelectTrigger data-testid="select-edit-nc-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t('status.open')}</SelectItem>
                      <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                      <SelectItem value="closed">{t('status.closed')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditNcOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editNcMutation.isPending} data-testid="button-update-nc">
                  {editNcMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reviewNcOpen} onOpenChange={setReviewNcOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('issues.reviewRecord')}</DialogTitle>
          </DialogHeader>
          {selectedNc && (
            <form onSubmit={handleReviewNcSubmit} className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('common.description')}:</span>
                  <span className="font-medium">{selectedNc.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                  <span className="font-medium">{selectedNc.createdByName || '-'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDescription">{t('issues.remarks')}</Label>
                <Textarea id="reviewDescription" name="reviewDescription" required data-testid="input-review-nc-description" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setReviewNcOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={reviewNcMutation.isPending} data-testid="button-submit-review-nc">
                  {reviewNcMutation.isPending ? t('common.loading') : t('issues.submitReview')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
