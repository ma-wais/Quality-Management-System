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
import { Plus, ClipboardCheck, AlertCircle, CheckCircle, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { Audit, AuditFinding, InsertAudit, InsertAuditFinding } from "@shared/schema";

export default function AuditsPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [auditOpen, setAuditOpen] = useState(false);
  const [findingOpen, setFindingOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Audit | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
  });

  const { data: findings = [], isLoading: findingsLoading } = useQuery<AuditFinding[]>({
    queryKey: ["/api/audit-findings"],
  });

  const createAuditMutation = useMutation({
    mutationFn: (data: InsertAudit) => apiRequest("POST", "/api/audits", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setAuditOpen(false);
      toast({ title: t('audits.auditCreated') });
    },
    onError: () => {
      toast({ title: t('audits.auditFailed'), variant: "destructive" });
    },
  });

  const createFindingMutation = useMutation({
    mutationFn: (data: InsertAuditFinding) =>
      apiRequest("POST", "/api/audit-findings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audit-findings"] });
      setFindingOpen(false);
      toast({ title: t('audits.findingCreated') });
    },
    onError: () => {
      toast({ title: t('audits.findingFailed'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertAudit> }) =>
      apiRequest("PATCH", `/api/audits/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
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
      apiRequest("PATCH", `/api/audits/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setReviewOpen(false);
      setSelectedItem(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleAuditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAuditMutation.mutate({
      auditNumber: formData.get("auditNumber") as string,
      auditType: formData.get("auditType") as string,
      scope: formData.get("scope") as string,
      department: formData.get("department") as string,
      plannedDate: new Date(formData.get("plannedDate") as string),
      leadAuditor: formData.get("leadAuditor") as string,
      auditTeam: formData.get("auditTeam") as string,
      status: "planned",
    });
  };

  const handleFindingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createFindingMutation.mutate({
      auditId: formData.get("auditId") as string,
      findingNumber: formData.get("findingNumber") as string,
      findingType: formData.get("findingType") as string,
      clauseReference: formData.get("clauseReference") as string,
      description: formData.get("description") as string,
      evidence: formData.get("evidence") as string,
      assignedTo: formData.get("assignedTo") as string,
      status: "open",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        auditNumber: formData.get("auditNumber") as string,
        auditType: formData.get("auditType") as string,
        scope: formData.get("scope") as string,
        department: formData.get("department") as string,
        leadAuditor: formData.get("leadAuditor") as string,
        auditTeam: formData.get("auditTeam") as string,
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
    t('audits.auditNumber'),
    t('common.type'),
    t('audits.scope'),
    t('common.department'),
    t('audits.leadAuditor'),
    t('audits.plannedDate'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    audits.map((a) => [
      a.auditNumber || "-",
      a.auditType || "-",
      a.scope || "-",
      a.department || "-",
      a.leadAuditor || "-",
      a.plannedDate ? new Date(a.plannedDate).toLocaleDateString() : "-",
      t(`status.${a.status}`),
      a.createdByName || "-",
      a.reviewedByName || "-",
      a.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('audits.title'),
    clause: "9.2",
    description: t('audits.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "9.2_Audits",
  };

  const auditColumns = [
    { key: "auditNumber", header: t('audits.auditNumber') },
    {
      key: "auditType",
      header: t('common.type'),
      render: (item: Audit) => (
        <Badge variant="outline" className="capitalize">
          {t(`audits.${item.auditType}`)}
        </Badge>
      ),
    },
    {
      key: "scope",
      header: t('audits.scope'),
      className: "min-w-[200px]",
      render: (item: Audit) => (
        <span className="whitespace-pre-wrap break-words">{item.scope || "-"}</span>
      ),
    },
    { key: "department", header: t('common.department') },
    { key: "leadAuditor", header: t('audits.leadAuditor') },
    {
      key: "plannedDate",
      header: t('audits.plannedDate'),
      render: (item: Audit) =>
        item.plannedDate ? new Date(item.plannedDate).toLocaleDateString() : "-",
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Audit) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Audit) => (
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
      render: (item: Audit) => {
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

  const findingColumns = [
    { key: "findingNumber", header: t('audits.findingNumber') },
    {
      key: "auditId",
      header: t('audits.audits'),
      render: (item: AuditFinding) => {
        const audit = audits.find((a) => a.id === item.auditId);
        return audit?.auditNumber || "-";
      },
    },
    {
      key: "findingType",
      header: t('common.type'),
      render: (item: AuditFinding) => (
        <Badge className={statusColors[item.findingType] || ""}>
          {t(`audits.${item.findingType.replace("_", "")}`)}
        </Badge>
      ),
    },
    { key: "clauseReference", header: t('audits.clauseReference') },
    {
      key: "description",
      header: t('common.description'),
      className: "max-w-xs",
      render: (item: AuditFinding) => (
        <span className="whitespace-pre-wrap break-words line-clamp-2">{item.description}</span>
      ),
    },
    { key: "assignedTo", header: t('audits.assignedTo') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: AuditFinding) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
  ];

  return (
    <div className="p-6">
      <PageHeader
        title={t('audits.title')}
        description={t('audits.description')}
        clause="9.2"
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
        </div>
      </PageHeader>

      <Tabs defaultValue="audits" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audits" className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            {t('audits.audits')}
          </TabsTrigger>
          <TabsTrigger value="findings" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t('audits.findings')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="audits">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('audits.auditSchedule')}</CardTitle>
              {canCreate && (
                <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-audit">
                      <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('audits.planAudit')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('audits.planAudit')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAuditSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="auditNumber">{t('audits.auditNumber')}</Label>
                          <Input
                            id="auditNumber"
                            name="auditNumber"
                            placeholder="AUD-2024-001"
                            required
                            data-testid="input-audit-number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auditType">{t('common.type')}</Label>
                          <Select name="auditType" required>
                            <SelectTrigger data-testid="select-audit-type">
                              <SelectValue placeholder={t('audits.selectType')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="internal">{t('audits.internal')}</SelectItem>
                              <SelectItem value="external">{t('audits.external')}</SelectItem>
                              <SelectItem value="supplier">{t('audits.supplier')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="scope">{t('audits.scope')}</Label>
                        <Textarea
                          id="scope"
                          name="scope"
                          placeholder={t('audits.scopePlaceholder')}
                          required
                          data-testid="input-scope"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="department">{t('common.department')}</Label>
                          <Input
                            id="department"
                            name="department"
                            placeholder={t('common.department')}
                            data-testid="input-department"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="plannedDate">{t('audits.plannedDate')}</Label>
                          <Input
                            id="plannedDate"
                            name="plannedDate"
                            type="date"
                            required
                            data-testid="input-planned-date"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="leadAuditor">{t('audits.leadAuditor')}</Label>
                          <Input
                            id="leadAuditor"
                            name="leadAuditor"
                            placeholder={t('audits.leadAuditorPlaceholder')}
                            required
                            data-testid="input-lead-auditor"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="auditTeam">{t('audits.auditTeam')}</Label>
                          <Input
                            id="auditTeam"
                            name="auditTeam"
                            placeholder={t('audits.auditTeamPlaceholder')}
                            data-testid="input-audit-team"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setAuditOpen(false)}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={createAuditMutation.isPending}
                          data-testid="button-submit-audit"
                        >
                          {createAuditMutation.isPending ? t('audits.creating') : t('audits.planAudit')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={auditColumns}
                data={audits}
                isLoading={auditsLoading}
                emptyMessage={t('audits.noAudits')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="findings">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('audits.auditFindings')}</CardTitle>
              {canCreate && (
                <Dialog open={findingOpen} onOpenChange={setFindingOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" data-testid="button-add-finding">
                      <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('audits.recordFinding')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>{t('audits.recordFinding')}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleFindingSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="auditId">{t('audits.audits')}</Label>
                          <Select name="auditId" required>
                            <SelectTrigger data-testid="select-audit">
                              <SelectValue placeholder={t('audits.selectAudit')} />
                            </SelectTrigger>
                            <SelectContent>
                              {audits.map((audit) => (
                                <SelectItem key={audit.id} value={audit.id}>
                                  {audit.auditNumber}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="findingNumber">{t('audits.findingNumber')}</Label>
                          <Input
                            id="findingNumber"
                            name="findingNumber"
                            placeholder="F-001"
                            required
                            data-testid="input-finding-number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="findingType">{t('common.type')}</Label>
                          <Select name="findingType" required>
                            <SelectTrigger data-testid="select-finding-type">
                              <SelectValue placeholder={t('audits.selectType')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="major_nc">{t('audits.majorNc')}</SelectItem>
                              <SelectItem value="minor_nc">{t('audits.minorNc')}</SelectItem>
                              <SelectItem value="observation">{t('audits.observation')}</SelectItem>
                              <SelectItem value="opportunity">{t('audits.opportunity')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clauseReference">{t('audits.clauseReference')}</Label>
                          <Input
                            id="clauseReference"
                            name="clauseReference"
                            placeholder={t('audits.clausePlaceholder')}
                            data-testid="input-clause-ref"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">{t('common.description')}</Label>
                        <Textarea
                          id="description"
                          name="description"
                          placeholder={t('audits.findingDescPlaceholder')}
                          required
                          data-testid="input-finding-description"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="evidence">{t('audits.evidence')}</Label>
                        <Textarea
                          id="evidence"
                          name="evidence"
                          placeholder={t('audits.evidencePlaceholder')}
                          data-testid="input-evidence"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="assignedTo">{t('audits.assignedTo')}</Label>
                        <Input
                          id="assignedTo"
                          name="assignedTo"
                          placeholder={t('audits.assignedToPlaceholder')}
                          data-testid="input-assigned-to"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setFindingOpen(false)}
                        >
                          {t('common.cancel')}
                        </Button>
                        <Button
                          type="submit"
                          disabled={createFindingMutation.isPending}
                          data-testid="button-submit-finding"
                        >
                          {createFindingMutation.isPending ? t('audits.recording') : t('audits.recordFinding')}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <DataTable
                columns={findingColumns}
                data={findings}
                isLoading={findingsLoading}
                emptyMessage={t('audits.noFindings')}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('audits.auditNumber')}</Label>
                  <Input name="auditNumber" defaultValue={selectedItem.auditNumber || ""} required data-testid="input-edit-audit-number" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.type')}</Label>
                  <Select name="auditType" defaultValue={selectedItem.auditType || ""}>
                    <SelectTrigger data-testid="select-edit-audit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">{t('audits.internal')}</SelectItem>
                      <SelectItem value="external">{t('audits.external')}</SelectItem>
                      <SelectItem value="supplier">{t('audits.supplier')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('audits.scope')}</Label>
                <Textarea name="scope" defaultValue={selectedItem.scope || ""} required data-testid="input-edit-scope" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.department')}</Label>
                  <Input name="department" defaultValue={selectedItem.department || ""} data-testid="input-edit-department" />
                </div>
                <div className="space-y-2">
                  <Label>{t('audits.leadAuditor')}</Label>
                  <Input name="leadAuditor" defaultValue={selectedItem.leadAuditor || ""} required data-testid="input-edit-lead-auditor" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('audits.auditTeam')}</Label>
                <Input name="auditTeam" defaultValue={selectedItem.auditTeam || ""} data-testid="input-edit-audit-team" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-audit">
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
                  <span className="text-muted-foreground">{t('audits.auditNumber')}:</span>
                  <span className="font-medium">{selectedItem.auditNumber}</span>
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
