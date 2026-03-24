import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Label } from "@/components/ui/label";
import { Users, Shield, UserCheck, Eye, User as UserIcon, Edit2, RotateCcw, Plus, CheckCircle, ClipboardCheck, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { User, RolePermission, OrganizationRole, InsertOrganizationRole } from "@shared/schema";

const SUBMENU_KEYS = [
  "context/issues",
  "context/parties",
  "context/scope",
  "context/processes",
  "context/kpis",
  "leadership/commitment",
  "leadership/policy",
  "leadership/roles",
  "leadership/kpis",
  "planning/risks",
  "planning/objectives",
  "planning/changes",
  "planning/kpis",
  "support/resources",
  "support/competence",
  "support/awareness",
  "support/communication",
  "support/documents",
  "support/kpis",
  "operation/planning",
  "operation/requirements",
  "operation/suppliers",
  "operation/delivery",
  "operation/release",
  "operation/nonconforming",
  "operation/kpis",
  "performance/kpis",
  "performance/audits",
  "performance/reviews",
  "performance/section-kpis",
  "improvement/framework",
  "improvement/car",
  "improvement/ideas",
  "improvement/kpis",
  "admin/users",
  "admin/documents",
];

const ROLES = ["admin", "quality_manager", "auditor", "user"];

const SUBMENU_LABELS: Record<string, { en: string; ar: string }> = {
  "context/issues": { en: "4.1 Issues", ar: "4.1 القضايا" },
  "context/parties": { en: "4.2 Parties", ar: "4.2 الأطراف" },
  "context/scope": { en: "4.3 Scope", ar: "4.3 النطاق" },
  "context/processes": { en: "4.4 Processes", ar: "4.4 العمليات" },
  "context/kpis": { en: "4.KPIs", ar: "4.مؤشرات" },
  "leadership/commitment": { en: "5.1 Commitment", ar: "5.1 الالتزام" },
  "leadership/policy": { en: "5.2 Policy", ar: "5.2 السياسة" },
  "leadership/roles": { en: "5.3 Roles", ar: "5.3 الأدوار" },
  "leadership/kpis": { en: "5.KPIs", ar: "5.مؤشرات" },
  "planning/risks": { en: "6.1 Risks", ar: "6.1 المخاطر" },
  "planning/objectives": { en: "6.2 Objectives", ar: "6.2 الأهداف" },
  "planning/changes": { en: "6.3 Changes", ar: "6.3 التغييرات" },
  "planning/kpis": { en: "6.KPIs", ar: "6.مؤشرات" },
  "support/resources": { en: "7.1 Resources", ar: "7.1 الموارد" },
  "support/competence": { en: "7.2 Competence", ar: "7.2 الكفاءة" },
  "support/awareness": { en: "7.3 Awareness", ar: "7.3 الوعي" },
  "support/communication": { en: "7.4 Communication", ar: "7.4 التواصل" },
  "support/documents": { en: "7.5 Documents", ar: "7.5 المستندات" },
  "support/kpis": { en: "7.KPIs", ar: "7.مؤشرات" },
  "operation/planning": { en: "8.1 Planning", ar: "8.1 التخطيط" },
  "operation/requirements": { en: "8.2 Requirements", ar: "8.2 المتطلبات" },
  "operation/suppliers": { en: "8.4 Suppliers", ar: "8.4 الموردون" },
  "operation/delivery": { en: "8.5 Delivery", ar: "8.5 التسليم" },
  "operation/release": { en: "8.6 Release", ar: "8.6 الإصدار" },
  "operation/nonconforming": { en: "8.7 NC Outputs", ar: "8.7 المخرجات غير المطابقة" },
  "operation/kpis": { en: "8.KPIs", ar: "8.مؤشرات" },
  "performance/kpis": { en: "9.1 KPIs", ar: "9.1 مؤشرات" },
  "performance/audits": { en: "9.2 Audits", ar: "9.2 التدقيق" },
  "performance/reviews": { en: "9.3 Reviews", ar: "9.3 المراجعات" },
  "performance/section-kpis": { en: "9.KPIs", ar: "9.مؤشرات" },
  "improvement/framework": { en: "10.1 Framework", ar: "10.1 الإطار" },
  "improvement/car": { en: "10.2 CARs", ar: "10.2 إجراءات تصحيحية" },
  "improvement/ideas": { en: "10.3 Ideas", ar: "10.3 أفكار" },
  "improvement/kpis": { en: "10.KPIs", ar: "10.مؤشرات" },
  "admin/users": { en: "Admin Users", ar: "إدارة المستخدمين" },
  "admin/documents": { en: "Personal Docs", ar: "المستندات الشخصية" },
};

export default function RolesPage() {
  const [open, setOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrganizationRole | null>(null);
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const lang = i18n.language === "ar" ? "ar" : "en";

  const roleInfo = {
    admin: {
      title: t('roles.admin'),
      description: t('roles.adminDesc'),
      icon: Shield,
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    },
    quality_manager: {
      title: t('roles.quality_manager'),
      description: t('roles.quality_managerDesc'),
      icon: UserCheck,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    },
    auditor: {
      title: t('roles.auditor'),
      description: t('roles.auditorDesc'),
      icon: Eye,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
    },
    user: {
      title: t('roles.user'),
      description: t('roles.userDesc'),
      icon: UserIcon,
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
    },
  };

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: permissions = [], isLoading: permsLoading } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions"],
  });

  const { data: orgRoles = [], isLoading: orgRolesLoading } = useQuery<OrganizationRole[]>({
    queryKey: ["/api/organization-roles"],
  });

  useEffect(() => {
    if (!permsLoading && permissions.length === 0) {
      apiRequest("POST", "/api/role-permissions/seed").then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      });
    }
  }, [permissions, permsLoading]);

  const createMutation = useMutation({
    mutationFn: (data: InsertOrganizationRole) =>
      apiRequest("POST", "/api/organization-roles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization-roles"] });
      setOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertOrganizationRole> }) =>
      apiRequest("PATCH", `/api/organization-roles/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization-roles"] });
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
      apiRequest("PATCH", `/api/organization-roles/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/organization-roles"] });
      setReviewOpen(false);
      setSelectedItem(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: string; role: string }) => {
      return apiRequest("PATCH", `/api/users/${id}`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: t('common.success') });
      setEditingUser(null);
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const togglePermissionMutation = useMutation({
    mutationFn: async ({ id, canAccess }: { id: string; canAccess: boolean }) => {
      return apiRequest("PATCH", `/api/role-permissions/${id}`, { canAccess });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
    },
  });

  const seedPermissionsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/role-permissions/seed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/role-permissions"] });
      toast({ title: t('common.success') });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: formData.get("title") as string,
      responsibilities: formData.get("responsibilities") as string,
      authorities: formData.get("authorities") as string,
      reportingTo: formData.get("reportingTo") as string,
      department: formData.get("department") as string,
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
        title: formData.get("title") as string,
        responsibilities: formData.get("responsibilities") as string,
        authorities: formData.get("authorities") as string,
        reportingTo: formData.get("reportingTo") as string,
        department: formData.get("department") as string,
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

  const handleEditRole = (u: User) => {
    setEditingUser(u);
    setSelectedRole(u.role);
  };

  const handleSaveRole = () => {
    if (editingUser && selectedRole) {
      updateRoleMutation.mutate({ id: editingUser.id, role: selectedRole });
    }
  };

  const getPermission = (role: string, submenu: string): RolePermission | undefined => {
    return permissions.find(p => p.role === role && p.submenu === submenu);
  };

  const handleToggle = (role: string, submenu: string) => {
    const perm = getPermission(role, submenu);
    if (perm) {
      togglePermissionMutation.mutate({ id: perm.id, canAccess: !perm.canAccess });
    }
  };

  const getExportHeaders = () => [
    t('roles.roleTitle'),
    t('roles.responsibilities'),
    t('roles.authorities'),
    t('roles.reportingTo'),
    t('roles.department'),
    t('common.status'),
    t('issues.createdBy'),
    t('issues.reviewedBy'),
    t('issues.reviewDescription'),
  ];

  const getExportRows = () =>
    orgRoles.map((r) => [
      r.title || "-",
      r.responsibilities || "-",
      r.authorities || "-",
      r.reportingTo || "-",
      r.department || "-",
      t(`status.${r.reviewStatus}`),
      r.createdByName || "-",
      r.reviewedByName || "-",
      r.reviewDescription || "-",
    ]);

  const exportConfig = {
    title: t('roles.title'),
    clause: "5.3",
    description: t('roles.description'),
    headers: getExportHeaders(),
    rows: getExportRows(),
    isRtl,
    filename: "5.3_Organization_Roles",
  };

  const columns = [
    {
      key: "title",
      header: t('roles.roleTitle'),
      className: "min-w-[200px]",
      render: (item: OrganizationRole) => (
        <span className="whitespace-pre-wrap break-words">{item.title || "-"}</span>
      ),
    },
    {
      key: "responsibilities",
      header: t('roles.responsibilities'),
      className: "min-w-[200px]",
      render: (item: OrganizationRole) => (
        <span className="whitespace-pre-wrap break-words">{item.responsibilities || "-"}</span>
      ),
    },
    {
      key: "authorities",
      header: t('roles.authorities'),
      className: "min-w-[200px]",
      render: (item: OrganizationRole) => (
        <span className="whitespace-pre-wrap break-words">{item.authorities || "-"}</span>
      ),
    },
    {
      key: "department",
      header: t('roles.department'),
      render: (item: OrganizationRole) => (
        <Badge variant="outline" className="capitalize">
          {item.department || "-"}
        </Badge>
      ),
    },
    {
      key: "reviewStatus",
      header: t('common.status'),
      render: (item: OrganizationRole) => (
        <Badge className={statusColors[item.reviewStatus] || ""}>
          {t(`status.${item.reviewStatus}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: OrganizationRole) => (
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
      render: (item: OrganizationRole) => {
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

  const groupedUsers = Object.keys(roleInfo).reduce((acc, role) => {
    acc[role] = users.filter((u) => u.role === role);
    return acc;
  }, {} as Record<string, User[]>);

  const isLoading = usersLoading || permsLoading || orgRolesLoading;

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={t('roles.title')}
        description={t('roles.description')}
        clause="5.3"
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
                <Button data-testid="button-add-role">
                  <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t('roles.addRole')}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>{t('roles.addRole')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">{t('roles.roleTitle')}</Label>
                      <Input id="title" name="title" required data-testid="input-title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">{t('roles.department')}</Label>
                      <Input id="department" name="department" data-testid="input-department" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsibilities">{t('roles.responsibilities')}</Label>
                    <Textarea id="responsibilities" name="responsibilities" required data-testid="input-responsibilities" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="authorities">{t('roles.authorities')}</Label>
                    <Textarea id="authorities" name="authorities" data-testid="input-authorities" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reportingTo">{t('roles.reportingTo')}</Label>
                    <Input id="reportingTo" name="reportingTo" data-testid="input-reportingTo" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
                    <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-role">
                      {createMutation.isPending ? t('common.loading') : t('common.add')}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </PageHeader>

      <div className="space-y-6">
        <Card>
          <CardContent className="p-0">
            <DataTable columns={columns} data={orgRoles} isLoading={orgRolesLoading} emptyMessage={t('common.noData')} />
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {Object.entries(roleInfo).map(([role, info]) => {
            const Icon = info.icon;
            const roleUsers = groupedUsers[role] || [];

            return (
              <Card key={role} data-testid={`card-role-${role}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${info.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{info.title}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {info.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{roleUsers.length}</Badge>
                </CardHeader>
                <CardContent>
                  {roleUsers.length > 0 ? (
                    <div className="space-y-3">
                      {roleUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-3 p-2 rounded-md bg-muted/50"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {u.fullName
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {u.fullName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {u.email}
                            </p>
                          </div>
                          {u.department && (
                            <Badge variant="secondary" className="text-xs">
                              {u.department}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditRole(u)}
                            data-testid={`button-edit-role-${u.id}`}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      {t('common.noData')}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6" data-testid="card-permissions">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('roles.submenuAccess')}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedPermissionsMutation.mutate()}
              disabled={seedPermissionsMutation.isPending}
              data-testid="button-reset-permissions"
            >
              <RotateCcw className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
              {t('roles.seedPermissions')}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-start py-2 px-3 font-medium min-w-[180px]">{t('roles.permission')}</th>
                    {ROLES.map(role => (
                      <th key={role} className="text-center py-2 px-3 font-medium min-w-[100px]">
                        {t(`roles.${role}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SUBMENU_KEYS.map((submenu) => (
                    <tr key={submenu} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="py-2 px-3 text-xs">
                        {SUBMENU_LABELS[submenu]?.[lang] || submenu}
                      </td>
                      {ROLES.map(role => {
                        const perm = getPermission(role, submenu);
                        const hasAccess = perm?.canAccess ?? false;
                        return (
                          <td key={role} className="text-center py-2 px-3">
                            <Switch
                              checked={hasAccess}
                              onCheckedChange={() => handleToggle(role, submenu)}
                              disabled={!perm || togglePermissionMutation.isPending}
                              data-testid={`switch-perm-${role}-${submenu.replace("/", "-")}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('roles.roleTitle')}</Label>
                  <Input name="title" defaultValue={selectedItem.title || ""} required data-testid="input-edit-title" />
                </div>
                <div className="space-y-2">
                  <Label>{t('roles.department')}</Label>
                  <Input name="department" defaultValue={selectedItem.department || ""} data-testid="input-edit-department" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('roles.responsibilities')}</Label>
                <Textarea name="responsibilities" defaultValue={selectedItem.responsibilities || ""} required data-testid="input-edit-responsibilities" />
              </div>
              <div className="space-y-2">
                <Label>{t('roles.authorities')}</Label>
                <Textarea name="authorities" defaultValue={selectedItem.authorities || ""} data-testid="input-edit-authorities" />
              </div>
              <div className="space-y-2">
                <Label>{t('roles.reportingTo')}</Label>
                <Input name="reportingTo" defaultValue={selectedItem.reportingTo || ""} data-testid="input-edit-reportingTo" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editMutation.isPending} data-testid="button-update-role">
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
                  <span className="text-muted-foreground">{t('roles.roleTitle')}:</span>
                  <span className="font-medium">{selectedItem.title}</span>
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

      <Dialog open={!!editingUser} onOpenChange={(o) => !o && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('roles.editRole')}</DialogTitle>
            <DialogDescription>
              {editingUser?.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('roles.currentUser')}</Label>
              <div className="flex items-center gap-3 p-3 rounded-md bg-muted">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {editingUser?.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{editingUser?.fullName}</p>
                  <p className="text-sm text-muted-foreground">{editingUser?.email}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-select">{t('roles.selectNewRole')}</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role-select" data-testid="select-new-role">
                  <SelectValue placeholder={t('form.selectRole')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">{t('roles.admin')}</SelectItem>
                  <SelectItem value="quality_manager">{t('roles.quality_manager')}</SelectItem>
                  <SelectItem value="auditor">{t('roles.auditor')}</SelectItem>
                  <SelectItem value="user">{t('roles.user')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSaveRole}
              disabled={updateRoleMutation.isPending || selectedRole === editingUser?.role}
              data-testid="button-save-role"
            >
              {updateRoleMutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
