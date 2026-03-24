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
import type { ContextIssue, InsertContextIssue } from "@shared/schema";
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, TextRun, AlignmentType, BorderStyle, HeadingLevel } from "docx";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ContextIssues() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<ContextIssue | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";

  const { data: issues = [], isLoading } = useQuery<ContextIssue[]>({
    queryKey: ["/api/context-issues"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertContextIssue) =>
      apiRequest("POST", "/api/context-issues", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/context-issues"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertContextIssue> }) =>
      apiRequest("PATCH", `/api/context-issues/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/context-issues"] });
      setEditOpen(false);
      setSelectedIssue(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/context-issues/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/context-issues"] });
      setReviewOpen(false);
      setSelectedIssue(null);
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
      issueType: formData.get("issueType") as string,
      category: formData.get("category") as string,
      description: formData.get("description") as string,
      impact: formData.get("impact") as string,
      action: formData.get("action") as string,
      status: "active",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedIssue) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedIssue.id,
      updates: {
        issueType: formData.get("issueType") as string,
        category: formData.get("category") as string,
        description: formData.get("description") as string,
        impact: formData.get("impact") as string,
        action: formData.get("action") as string,
      },
    });
  };

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedIssue) return;
    
    const formData = new FormData(e.currentTarget);
    const reviewData = {
      reviewDescription: formData.get("reviewDescription") as string,
      linkedToStrategicObjectives: formData.get("linkedToStrategicObjectives") as string,
      reviewedById: user?.id || "current-user",
      reviewedByName: user?.fullName || t('app.qualityManager'),
      reviewedByRole: userRole,
      reviewCompletedAt: new Date().toISOString(),
      status: "completed",
    };
    
    reviewMutation.mutate({ id: selectedIssue.id, reviewData });
  };

  const openReviewDialog = (issue: ContextIssue) => {
    setSelectedIssue(issue);
    setReviewOpen(true);
  };

  const openEditDialog = (issue: ContextIssue) => {
    setSelectedIssue(issue);
    setEditOpen(true);
  };

  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const exportToWord = async () => {
    const headerCellsLtr = [
      t('common.type'),
      t('issues.category'),
      t('common.description'),
      t('issues.impact'),
      t('issues.action'),
      t('common.status'),
      t('issues.createdBy'),
      t('common.createdAt'),
      t('issues.reviewedBy'),
      t('issues.reviewDescription'),
    ];
    const headerCells = isRtl ? [...headerCellsLtr].reverse() : headerCellsLtr;
    const textAlign = isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT;

    const borders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "999999" },
    };

    const headerRow = new DocxTableRow({
      tableHeader: true,
      children: headerCells.map((h) =>
        new DocxTableCell({
          borders,
          shading: { fill: "1e3a5f" },
          children: [new Paragraph({ alignment: textAlign, children: [new TextRun({ text: h, bold: true, color: "FFFFFF", size: 20, font: "Arial" })] })],
          width: { size: 10, type: WidthType.PERCENTAGE },
        })
      ),
    });

    const dataRows = filteredIssues.map((issue) => {
      const cellsLtr = [
        t(`issues.${issue.issueType}`),
        issue.category || "-",
        issue.description || "-",
        issue.impact || "-",
        issue.action || "-",
        t(`status.${issue.status}`),
        issue.createdByName || "-",
        issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-",
        issue.reviewedByName || "-",
        issue.reviewDescription || "-",
      ];
      const cells = isRtl ? [...cellsLtr].reverse() : cellsLtr;
      return new DocxTableRow({
        children: cells.map((c) =>
          new DocxTableCell({
            borders,
            children: [new Paragraph({ alignment: textAlign, children: [new TextRun({ text: c, size: 18, font: "Arial" })] })],
            width: { size: 10, type: WidthType.PERCENTAGE },
          })
        ),
      });
    });

    const doc = new Document({
      sections: [{
        properties: { page: { size: { orientation: "landscape" as const } } },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "4.1 - " + t('issues.title'), bold: true, size: 32, font: "Arial", color: "1e3a5f" })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
            children: [new TextRun({ text: t('issues.description'), size: 22, font: "Arial", color: "666666" })],
          }),
          new Paragraph({
            spacing: { after: 200 },
            children: [new TextRun({ text: `${t('issues.allTypes')}: ${filteredIssues.length} ${t('common.records', 'records')}`, size: 20, font: "Arial" })],
          }),
          new DocxTable({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [headerRow, ...dataRows],
          }),
          new Paragraph({ spacing: { before: 600 } }),
          new Paragraph({
            alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { after: 400 },
            children: [new TextRun({ text: isRtl ? "___________________________ :تمت الموافقة من قبل" : "Approved By: ___________________________", size: 24, font: "Arial" })],
          }),
          new Paragraph({
            alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { after: 400 },
            children: [new TextRun({ text: isRtl ? "___________________________ :التوقيع" : "Signature:    ___________________________", size: 24, font: "Arial" })],
          }),
          new Paragraph({
            alignment: isRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
            spacing: { after: 400 },
            children: [new TextRun({ text: isRtl ? "___________________________ :التاريخ" : "Date:            ___________________________", size: 24, font: "Arial" })],
          }),
        ],
      }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "4.1_Internal_External_Issues.docx");
    toast({ title: t('common.success') });
  };

  const getExportHeaders = () => {
    const headers = [
      t('common.type'),
      t('issues.category'),
      t('common.description'),
      t('issues.impact'),
      t('issues.action'),
      t('common.status'),
      t('issues.createdBy'),
      t('common.createdAt'),
      t('issues.reviewedBy'),
      t('issues.reviewDescription'),
    ];
    return isRtl ? [...headers].reverse() : headers;
  };

  const getExportRows = () =>
    filteredIssues.map((issue) => {
      const row = [
        t(`issues.${issue.issueType}`),
        issue.category || "-",
        issue.description || "-",
        issue.impact || "-",
        issue.action || "-",
        t(`status.${issue.status}`),
        issue.createdByName || "-",
        issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : "-",
        issue.reviewedByName || "-",
        issue.reviewDescription || "-",
      ];
      return isRtl ? [...row].reverse() : row;
    });

  const exportToExcel = () => {
    const headers = getExportHeaders();
    const rows = getExportRows();
    const wsData = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colWidths = headers.map((_h, i) => {
      const maxLen = Math.max(headers[i].length, ...rows.map((r) => (r[i] || "").length));
      return { wch: Math.min(Math.max(maxLen, 12), 50) };
    });
    ws["!cols"] = colWidths;
    if (isRtl) ws["!RTL"] = true;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "4.1 Issues");
    XLSX.writeFile(wb, "4.1_Internal_External_Issues.xlsx");
    toast({ title: t('common.success') });
  };

  const exportToPdf = () => {
    const headers = getExportHeaders();
    const rows = getExportRows();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    doc.setFontSize(18);
    doc.setTextColor(30, 58, 95);
    doc.text("4.1 - " + t('issues.title'), doc.internal.pageSize.getWidth() / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(t('issues.description'), doc.internal.pageSize.getWidth() / 2, 22, { align: "center" });

    const descColIndex = isRtl ? 7 : 2;
    const remarksColIndex = isRtl ? 0 : 9;
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 28,
      styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak", halign: isRtl ? "right" : "left" },
      headStyles: { fillColor: [30, 58, 95], textColor: 255, fontStyle: "bold", fontSize: 8, halign: isRtl ? "right" : "left" },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        [descColIndex]: { cellWidth: 40 },
        [remarksColIndex]: { cellWidth: 30 },
      },
    });

    const finalY = ((doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY) || doc.internal.pageSize.getHeight() - 50;
    const signY = Math.min(finalY + 15, doc.internal.pageSize.getHeight() - 35);
    const signX = isRtl ? doc.internal.pageSize.getWidth() - 14 : 14;
    const signAlign = isRtl ? "right" as const : "left" as const;
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(isRtl ? "___________________________ :تمت الموافقة من قبل" : "Approved By: ___________________________", signX, signY, { align: signAlign });
    doc.text(isRtl ? "___________________________ :التوقيع" : "Signature:    ___________________________", signX, signY + 10, { align: signAlign });
    doc.text(isRtl ? "___________________________ :التاريخ" : "Date:            ___________________________", signX, signY + 20, { align: signAlign });

    doc.save("4.1_Internal_External_Issues.pdf");
    toast({ title: t('common.success') });
  };

  const columns = [
    {
      key: "issueType",
      header: t('common.type'),
      render: (item: ContextIssue) => (
        <Badge variant="outline" className="capitalize">
          {t(`issues.${item.issueType}`)}
        </Badge>
      ),
    },
    { key: "category", header: t('issues.category') },
    {
      key: "description",
      header: t('common.description'),
      className: "min-w-[200px]",
      render: (item: ContextIssue) => (
        <span className="whitespace-pre-wrap break-words">{item.description}</span>
      ),
    },
    { key: "impact", header: t('issues.impact') },
    { key: "action", header: t('issues.action') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: ContextIssue) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: ContextIssue) => (
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
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('issues.linkedToStrategicObjectives')}:</span>
                    <Badge variant={item.linkedToStrategicObjectives === 'yes' ? 'default' : 'secondary'}>
                      {item.linkedToStrategicObjectives === 'yes' ? t('common.yes') : 'No'}
                    </Badge>
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
      render: (item: ContextIssue) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openEditDialog(item)}
                data-testid={`button-edit-${item.id}`}
              >
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showReview && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => openReviewDialog(item)}
                data-testid={`button-review-${item.id}`}
              >
                <ClipboardCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.review')}
              </Button>
            )}
          </div>
        );
      },
    },
    {
      key: "createdAt",
      header: t('common.createdAt'),
      render: (item: ContextIssue) =>
        item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "-",
    },
  ];

  const filteredIssues = typeFilter === "all"
    ? issues
    : issues.filter((issue) => issue.issueType === typeFilter);

  return (
    <div className="p-6">
      <PageHeader
        title={t('issues.title')}
        description={t('issues.description')}
        clause="4.1"
      >
        {canCreate && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-issue">
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('issues.addIssue')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{t('issues.addIssue')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="issueType">{t('common.type')}</Label>
                  <Select name="issueType" required>
                    <SelectTrigger data-testid="select-issue-type">
                      <SelectValue placeholder={t('issues.selectOption')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">{t('issues.internal')}</SelectItem>
                      <SelectItem value="external">{t('issues.external')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('issues.category')}</Label>
                  <Input
                    id="category"
                    name="category"
                    required
                    data-testid="input-category"
                  />
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impact">{t('issues.impact')}</Label>
                  <Input
                    id="impact"
                    name="impact"
                    data-testid="input-impact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="action">{t('issues.action')}</Label>
                  <Input
                    id="action"
                    name="action"
                    data-testid="input-action"
                  />
                </div>
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
                  data-testid="button-submit-issue"
                >
                  {createMutation.isPending ? t('common.loading') : t('common.add')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </PageHeader>

      <div className="flex items-center gap-2 mb-4">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-type-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('issues.allTypes', 'All Types')}</SelectItem>
            <SelectItem value="internal">{t('issues.internal')}</SelectItem>
            <SelectItem value="external">{t('issues.external')}</SelectItem>
          </SelectContent>
        </Select>
        {canExport && (
          <>
            <Button variant="outline" onClick={exportToWord} data-testid="button-export-word">
              <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('issues.exportWord')}
            </Button>
            <Button variant="outline" onClick={exportToExcel} data-testid="button-export-excel">
              <FileSpreadsheet className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('issues.exportExcel')}
            </Button>
            <Button variant="outline" onClick={exportToPdf} data-testid="button-export-pdf">
              <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('issues.exportPdf')}
            </Button>
          </>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={filteredIssues}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
          />
        </CardContent>
      </Card>

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('issues.reviewIssue')}</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">{selectedIssue.description}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{t(`issues.${selectedIssue.issueType}`)}</Badge>
                  <Badge variant="secondary">{selectedIssue.category}</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reviewDescription">{t('issues.reviewDescription')}</Label>
                <Textarea
                  id="reviewDescription"
                  name="reviewDescription"
                  placeholder={t('issues.reviewDescPlaceholder')}
                  required
                  data-testid="input-review-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedToStrategicObjectives">{t('issues.linkedToStrategicObjectives')}</Label>
                <Select name="linkedToStrategicObjectives" required>
                  <SelectTrigger data-testid="select-linked-objectives">
                    <SelectValue placeholder={t('issues.selectOption')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">{t('common.yes')}</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setReviewOpen(false);
                    setSelectedIssue(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={reviewMutation.isPending}
                  data-testid="button-submit-review"
                >
                  {reviewMutation.isPending ? t('common.loading') : t('issues.submitReview')}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(v) => { setEditOpen(v); if (!v) setSelectedIssue(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('issues.editIssue')}</DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-issueType">{t('common.type')}</Label>
                  <Select name="issueType" defaultValue={selectedIssue.issueType} required>
                    <SelectTrigger data-testid="select-edit-issue-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">{t('issues.internal')}</SelectItem>
                      <SelectItem value="external">{t('issues.external')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-category">{t('issues.category')}</Label>
                  <Input
                    id="edit-category"
                    name="category"
                    defaultValue={selectedIssue.category}
                    required
                    data-testid="input-edit-category"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">{t('common.description')}</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedIssue.description}
                  required
                  data-testid="input-edit-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-impact">{t('issues.impact')}</Label>
                  <Input
                    id="edit-impact"
                    name="impact"
                    defaultValue={selectedIssue.impact || ""}
                    data-testid="input-edit-impact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-action">{t('issues.action')}</Label>
                  <Input
                    id="edit-action"
                    name="action"
                    defaultValue={selectedIssue.action || ""}
                    data-testid="input-edit-action"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditOpen(false);
                    setSelectedIssue(null);
                  }}
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
    </div>
  );
}
