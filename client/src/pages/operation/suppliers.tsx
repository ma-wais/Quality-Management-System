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
import { Plus, Star, CheckCircle, ClipboardCheck, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { Supplier, InsertSupplier } from "@shared/schema";

export default function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Supplier | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const { data: suppliers = [], isLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSupplier) =>
      apiRequest("POST", "/api/suppliers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertSupplier> }) =>
      apiRequest("PATCH", `/api/suppliers/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
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
      apiRequest("PATCH", `/api/suppliers/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
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
      supplierCode: formData.get("supplierCode") as string,
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      contactPerson: formData.get("contactPerson") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string,
      status: "active",
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;
    const formData = new FormData(e.currentTarget);
    editMutation.mutate({
      id: selectedItem.id,
      updates: {
        supplierCode: formData.get("supplierCode") as string,
        name: formData.get("name") as string,
        category: formData.get("category") as string,
        contactPerson: formData.get("contactPerson") as string,
        email: formData.get("email") as string,
        phone: formData.get("phone") as string,
        address: formData.get("address") as string,
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

  const renderRating = (rating: number | null) => {
    const stars = rating || 0;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${
              i <= stars
                ? "fill-yellow-400 text-yellow-400"
                : "text-muted-foreground"
            }`}
          />
        ))}
      </div>
    );
  };

  const getExportHeaders = () => [
    t('documents.documentNumber'),
    t('suppliers.supplier'),
    t('issues.category'),
    t('communication.party'),
    t('common.email'),
    t('suppliers.rating'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    suppliers.map((s) => [
      s.supplierCode || "-",
      s.name || "-",
      s.category || "-",
      s.contactPerson || "-",
      s.email || "-",
      String(s.rating || "-"),
      t(`status.${s.status}`),
      s.createdByName || "-",
      s.reviewedByName || "-",
      s.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('suppliers.title'),
    clause: "8.4",
    description: t('suppliers.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "8.4_Suppliers",
  };

  const columns = [
    { key: "supplierCode", header: t('documents.documentNumber') },
    { key: "name", header: t('suppliers.supplier') },
    { key: "category", header: t('issues.category') },
    { key: "contactPerson", header: t('communication.party') },
    { key: "email", header: t('common.email') },
    {
      key: "rating",
      header: t('suppliers.rating'),
      render: (item: Supplier) => renderRating(item.rating),
    },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Supplier) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Supplier) => (
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
      render: (item: Supplier) => {
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
        title={t('suppliers.title')}
        description={t('suppliers.description')}
        clause="8.4"
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
                <Button data-testid="button-add-supplier">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('suppliers.addSupplier')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('suppliers.addSupplier')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="supplierCode">{t('documents.documentNumber')}</Label>
                      <Input
                        id="supplierCode"
                        name="supplierCode"
                        placeholder="SUP-001"
                        required
                        data-testid="input-supplier-code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('suppliers.supplier')}</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        data-testid="input-name"
                      />
                    </div>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">{t('communication.party')}</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        data-testid="input-contact"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">{t('common.email')}</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        data-testid="input-email"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('communication.methods.phone')}</Label>
                    <Input
                      id="phone"
                      name="phone"
                      data-testid="input-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('common.description')}</Label>
                    <Textarea
                      id="address"
                      name="address"
                      data-testid="input-address"
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
                      data-testid="button-submit-supplier"
                    >
                      {createMutation.isPending ? t('common.loading') : t('suppliers.addSupplier')}
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
            data={suppliers}
            isLoading={isLoading}
            emptyMessage={t('common.noData')}
          />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('suppliers.editSupplier')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('documents.documentNumber')}</Label>
                  <Input name="supplierCode" defaultValue={selectedItem.supplierCode || ""} required data-testid="input-edit-supplier-code" />
                </div>
                <div className="space-y-2">
                  <Label>{t('suppliers.supplier')}</Label>
                  <Input name="name" defaultValue={selectedItem.name || ""} required data-testid="input-edit-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('issues.category')}</Label>
                <Input name="category" defaultValue={selectedItem.category || ""} required data-testid="input-edit-category" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('communication.party')}</Label>
                  <Input name="contactPerson" defaultValue={selectedItem.contactPerson || ""} data-testid="input-edit-contact" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.email')}</Label>
                  <Input name="email" type="email" defaultValue={selectedItem.email || ""} data-testid="input-edit-email" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('communication.methods.phone')}</Label>
                <Input name="phone" defaultValue={selectedItem.phone || ""} data-testid="input-edit-phone" />
              </div>
              <div className="space-y-2">
                <Label>{t('common.description')}</Label>
                <Textarea name="address" defaultValue={selectedItem.address || ""} data-testid="input-edit-address" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-supplier">
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
                  <span className="text-muted-foreground">{t('suppliers.supplier')}:</span>
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
