import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Shield, UserCheck, Eye, Users, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

export default function UserManagementPage() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const roleConfig = {
    admin: {
      label: t('roles.admin'),
      description: t('roles.adminDesc'),
      color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      icon: Shield,
    },
    quality_manager: {
      label: t('roles.quality_manager'),
      description: t('roles.quality_managerDesc'),
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      icon: UserCheck,
    },
    auditor: {
      label: t('roles.auditor'),
      description: t('roles.auditorDesc'),
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      icon: Eye,
    },
    user: {
      label: t('roles.user'),
      description: t('roles.userDesc'),
      color: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
      icon: Users,
    },
  };

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertUser) =>
      apiRequest("POST", "/api/users", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setOpen(false);
      toast({ title: t('users.title') });
    },
    onError: (error: Error) => {
      toast({ 
        title: t('common.error'), 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      username: formData.get("username") as string,
      password: formData.get("password") as string,
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as string,
      department: formData.get("department") as string || undefined,
    });
  };

  const columns = [
    { key: "username", header: t('table.username') },
    { key: "fullName", header: t('table.fullName') },
    { key: "email", header: t('table.email') },
    { key: "department", header: t('table.department') },
    {
      key: "role",
      header: t('table.role'),
      render: (item: User) => {
        const config = roleConfig[item.role as keyof typeof roleConfig] || roleConfig.user;
        return (
          <Badge className={config.color}>
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: "createdAt",
      header: t('table.created'),
      render: (item: User) => {
        if (!item.createdAt) return "-";
        return new Date(item.createdAt).toLocaleDateString();
      },
    },
  ];

  const adminCount = users.filter(u => u.role === "admin").length;
  const managerCount = users.filter(u => u.role === "quality_manager").length;
  const auditorCount = users.filter(u => u.role === "auditor").length;
  const upperMgmtCount = users.filter(u => u.role === "upper_management").length;
  const userCount = users.filter(u => u.role === "user").length;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        clause="5.3"
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-user">
              <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {t('users.addUser')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t('users.addUser')}</DialogTitle>
              <DialogDescription>{t('users.description')}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">{t('form.username')}</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder={t('form.username')}
                  required
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('form.password')}</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder={t('form.password')}
                  required
                  data-testid="input-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">{t('form.fullName')}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  placeholder={t('form.fullName')}
                  required
                  data-testid="input-fullname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder={t('form.email')}
                  required
                  data-testid="input-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t('form.role')}</Label>
                <Select name="role" defaultValue="user">
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder={t('form.selectRole')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>{t('roles.admin')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="quality_manager">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4" />
                        <span>{t('roles.quality_manager')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="auditor">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        <span>{t('roles.auditor')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="upper_management">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4" />
                        <span>{t('roles.upper_management')}</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{t('roles.user')}</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">{t('form.department')}</Label>
                <Input
                  id="department"
                  name="department"
                  placeholder={t('form.department')}
                  data-testid="input-department"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t('form.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  data-testid="button-submit-user"
                >
                  {createMutation.isPending ? t('common.loading') : t('form.create')}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.systemAdmins')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold">{adminCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.qualityManagers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold">{managerCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.auditors')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-2">
                <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-2xl font-bold">{auditorCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.upperManagement')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-2">
                <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-2xl font-bold">{upperMgmtCount}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.normalUsers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-gray-100 dark:bg-gray-800/30 p-2">
                <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-2xl font-bold">{userCount}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('users.title')}</CardTitle>
          <CardDescription>{t('table.total', { count: users.length })}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage={t('table.noData')}
          />
        </CardContent>
      </Card>
    </div>
  );
}
