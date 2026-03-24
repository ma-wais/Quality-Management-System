import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  Building2,
  Users,
  Target,
  TrendingUp,
  LayoutDashboard,
  Settings,
  ChevronDown,
  Shield,
  UserCheck,
  Briefcase,
  Lightbulb,
  FolderOpen,
  FileText,
  Mail,
} from "lucide-react";
import type { RolePermission } from "@shared/schema";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SubItem {
  clause: string;
  url: string;
}

interface MenuItem {
  titleKey: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  clauseNumber?: string;
  subItems?: SubItem[];
}

export function AppSidebar() {
  const [location] = useLocation();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRtl = i18n.language === 'ar';
  const currentRole = user?.role || 'user';

  const { data: permissions = [] } = useQuery<RolePermission[]>({
    queryKey: ["/api/role-permissions", currentRole],
    queryFn: async () => {
      const res = await fetch(`/api/role-permissions/${currentRole}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const canAccess = (url: string): boolean => {
    if (permissions.length === 0) return true;
    const submenuKey = url.startsWith("/") ? url.substring(1) : url;
    const perm = permissions.find(p => p.submenu === submenuKey);
    return perm ? perm.canAccess : true;
  };

  const menuItems: MenuItem[] = [
    {
      titleKey: "nav.dashboard",
      url: "/",
      icon: LayoutDashboard,
    },
    {
      titleKey: "nav.context",
      url: "/context",
      icon: Building2,
      clauseNumber: "4",
      subItems: [
        { clause: "4.1", url: "/context/issues" },
        { clause: "4.2", url: "/context/parties" },
        { clause: "4.3", url: "/context/scope" },
        { clause: "4.4", url: "/context/processes" },
        { clause: "4.kpis", url: "/context/kpis" },
      ],
    },
    {
      titleKey: "nav.leadership",
      url: "/leadership",
      icon: Shield,
      clauseNumber: "5",
      subItems: [
        { clause: "5.1", url: "/leadership/commitment" },
        { clause: "5.2", url: "/leadership/policy" },
        { clause: "5.3", url: "/leadership/roles" },
        { clause: "5.kpis", url: "/leadership/kpis" },
      ],
    },
    {
      titleKey: "nav.planning",
      url: "/planning",
      icon: Target,
      clauseNumber: "6",
      subItems: [
        { clause: "6.1", url: "/planning/risks" },
        { clause: "6.2", url: "/planning/objectives" },
        { clause: "6.3", url: "/planning/changes" },
        { clause: "6.kpis", url: "/planning/kpis" },
      ],
    },
    {
      titleKey: "nav.support",
      url: "/support",
      icon: Users,
      clauseNumber: "7",
      subItems: [
        { clause: "7.1", url: "/support/resources" },
        { clause: "7.2", url: "/support/competence" },
        { clause: "7.5", url: "/support/documents" },
        { clause: "7.kpis", url: "/support/kpis" },
      ],
    },
    {
      titleKey: "nav.operation",
      url: "/operation",
      icon: Briefcase,
      clauseNumber: "8",
      subItems: [
        { clause: "8.1", url: "/operation/planning" },
        { clause: "8.2", url: "/operation/requirements" },
        { clause: "8.4", url: "/operation/suppliers" },
        { clause: "8.5", url: "/operation/delivery" },
        { clause: "8.6", url: "/operation/release" },
        { clause: "8.7", url: "/operation/nonconforming" },
        { clause: "8.kpis", url: "/operation/kpis" },
      ],
    },
    {
      titleKey: "nav.performance",
      url: "/performance",
      icon: TrendingUp,
      clauseNumber: "9",
      subItems: [
        { clause: "9.1", url: "/performance/analysis" },
        { clause: "9.2", url: "/performance/audits" },
        { clause: "9.3", url: "/performance/reviews" },
        { clause: "9.4", url: "/performance/satisfaction" },
        { clause: "9.kpis", url: "/performance/section-kpis" },
      ],
    },
    {
      titleKey: "nav.improvement",
      url: "/improvement",
      icon: Lightbulb,
      clauseNumber: "10",
      subItems: [
        { clause: "10.1", url: "/improvement/framework" },
        { clause: "10.2", url: "/improvement/car" },
        { clause: "10.3", url: "/improvement/ideas" },
        { clause: "10.4", url: "/improvement/innovation" },
        { clause: "10.kpis", url: "/improvement/kpis" },
      ],
    },
  ];

  const adminItems: MenuItem[] = [
    {
      titleKey: "admin.users",
      url: "/admin/users",
      icon: Settings,
    },
    {
      titleKey: "admin.personalDocs",
      url: "/admin/documents",
      icon: FolderOpen,
    },
    {
      titleKey: "admin.reviewLog",
      url: "/admin/review-log",
      icon: FileText,
    },
    {
      titleKey: "admin.smtpSettings",
      url: "/admin/smtp-settings",
      icon: Mail,
    },
  ];

  const isActive = (url: string) => {
    if (url === "/") return location === "/";
    return location.startsWith(url);
  };

  return (
    <Sidebar side={isRtl ? "right" : "left"}>
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shield className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{t('app.title')}</span>
            <span className="text-xs text-muted-foreground">{t('app.isoStandard')}</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4 py-2">
            {t('app.navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) =>
                item.subItems ? (
                  <Collapsible
                    key={item.titleKey}
                    defaultOpen={isActive(item.url)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={isActive(item.url) ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}
                          data-testid={`menu-${item.clauseNumber}`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span className="flex-1">
                            {item.clauseNumber}. {t(item.titleKey)}
                          </span>
                          <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180 rtl:rotate-180 rtl:group-data-[state=open]/collapsible:rotate-0" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.subItems.filter(subItem => canAccess(subItem.url)).map((subItem) => (
                            <SidebarMenuSubItem key={subItem.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location === subItem.url}
                              >
                                <Link
                                  href={subItem.url}
                                  data-testid={`link-${subItem.clause.replace(".", "-")}`}
                                >
                                  <span className="text-xs font-mono text-muted-foreground ltr:mr-2 rtl:ml-2">
                                    {subItem.clause}
                                  </span>
                                  <span className="truncate">
                                    {t(`clauses.${subItem.clause}`)}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                    >
                      <Link
                        href={item.url}
                        data-testid="link-dashboard"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{t(item.titleKey)}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground px-4 py-2">
            {t('nav.administration')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.filter(item => canAccess(item.url)).map((item) => (
                <SidebarMenuItem key={item.titleKey}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                  >
                    <Link
                      href={item.url}
                      data-testid={`link-${item.titleKey.replace('.', '-')}`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{t(item.titleKey)}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate" data-testid="text-sidebar-user">{user?.fullName || ''}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email || ''}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
