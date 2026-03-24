import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { useTranslation } from "react-i18next";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import "@/lib/i18n";
import LoginPage from "@/pages/login";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import SmtpSettingsPage from "@/pages/admin/smtp-settings";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import ContextIssues from "@/pages/context/issues";
import InterestedParties from "@/pages/context/parties";
import QmsScopePage from "@/pages/context/scope";
import QmsProcesses from "@/pages/context/processes";
import ContextKpisPage from "@/pages/context/kpis";
import LeadershipKpisPage from "@/pages/leadership/kpis";
import LeadershipCommitmentPage from "@/pages/leadership/commitment";
import QualityPolicyPage from "@/pages/leadership/policy";
import RolesPage from "@/pages/leadership/roles";
import RisksPage from "@/pages/planning/risks";
import ObjectivesPage from "@/pages/planning/objectives";
import ChangesPage from "@/pages/planning/changes";
import PlanningKpisPage from "@/pages/planning/kpis";
import ResourcesPage from "@/pages/support/resources";
import CompetencePage from "@/pages/support/competence";
import DocumentsPage from "@/pages/support/documents";
import SupportKpisPage from "@/pages/support/kpis";
import OperationalPlanningPage from "@/pages/operation/planning";
import CustomerRequirementsPage from "@/pages/operation/requirements";
import SuppliersPage from "@/pages/operation/suppliers";
import ServiceDeliveryPage from "@/pages/operation/delivery";
import ServiceReleasePage from "@/pages/operation/release";
import NonconformingOutputsPage from "@/pages/operation/nonconforming";
import OperationKpisPage from "@/pages/operation/kpis";
import PerformanceAnalysisPage from "@/pages/performance/analysis";
import AuditsPage from "@/pages/performance/audits";
import ReviewsPage from "@/pages/performance/reviews";
import CustomerSatisfactionPage from "@/pages/performance/satisfaction";
import PerformanceSectionKpisPage from "@/pages/performance/section-kpis";
import ImprovementFrameworkPage from "@/pages/improvement/framework";
import CorrectiveActionsPage from "@/pages/improvement/car";
import ImprovementsPage from "@/pages/improvement/ideas";
import ImprovementKpisPage from "@/pages/improvement/kpis";
import InnovationInitiativesPage from "@/pages/improvement/innovation";
import UserManagementPage from "@/pages/admin/users";
import PersonalDocumentsPage from "@/pages/admin/documents";
import ReviewUpdateLogPage from "@/pages/admin/review-log";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/context/issues" component={ContextIssues} />
      <Route path="/context/parties" component={InterestedParties} />
      <Route path="/context/scope" component={QmsScopePage} />
      <Route path="/context/processes" component={QmsProcesses} />
      <Route path="/context/kpis" component={ContextKpisPage} />
      <Route path="/leadership/commitment" component={LeadershipCommitmentPage} />
      <Route path="/leadership/policy" component={QualityPolicyPage} />
      <Route path="/leadership/roles" component={RolesPage} />
      <Route path="/leadership/kpis" component={LeadershipKpisPage} />
      <Route path="/planning/risks" component={RisksPage} />
      <Route path="/planning/objectives" component={ObjectivesPage} />
      <Route path="/planning/changes" component={ChangesPage} />
      <Route path="/planning/kpis" component={PlanningKpisPage} />
      <Route path="/support/resources" component={ResourcesPage} />
      <Route path="/support/competence" component={CompetencePage} />
      <Route path="/support/documents" component={DocumentsPage} />
      <Route path="/support/kpis" component={SupportKpisPage} />
      <Route path="/operation/planning" component={OperationalPlanningPage} />
      <Route path="/operation/requirements" component={CustomerRequirementsPage} />
      <Route path="/operation/suppliers" component={SuppliersPage} />
      <Route path="/operation/delivery" component={ServiceDeliveryPage} />
      <Route path="/operation/release" component={ServiceReleasePage} />
      <Route path="/operation/nonconforming" component={NonconformingOutputsPage} />
      <Route path="/operation/kpis" component={OperationKpisPage} />
      <Route path="/performance/analysis" component={PerformanceAnalysisPage} />
      <Route path="/performance/audits" component={AuditsPage} />
      <Route path="/performance/reviews" component={ReviewsPage} />
      <Route path="/performance/satisfaction" component={CustomerSatisfactionPage} />
      <Route path="/performance/section-kpis" component={PerformanceSectionKpisPage} />
      <Route path="/improvement/framework" component={ImprovementFrameworkPage} />
      <Route path="/improvement/car" component={CorrectiveActionsPage} />
      <Route path="/improvement/ideas" component={ImprovementsPage} />
      <Route path="/improvement/kpis" component={ImprovementKpisPage} />
      <Route path="/improvement/innovation" component={InnovationInitiativesPage} />
      <Route path="/admin/users" component={UserManagementPage} />
      <Route path="/admin/documents" component={PersonalDocumentsPage} />
      <Route path="/admin/review-log" component={ReviewUpdateLogPage} />
      <Route path="/admin/smtp-settings" component={SmtpSettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();

  const roleLabels: Record<string, string> = {
    admin: t('roles.admin', 'Admin'),
    quality_manager: t('roles.quality_manager', 'Quality Manager'),
    auditor: t('roles.auditor', 'Auditor'),
    upper_management: t('roles.upper_management', 'Upper Management'),
    user: t('roles.user', 'User'),
  };

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-2 p-3 border-b bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground border-r ltr:pr-2 rtl:pl-2 ltr:mr-1 rtl:ml-1">
                <span className="font-medium text-foreground" data-testid="text-user-name">{user?.fullName}</span>
                <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]" data-testid="text-user-role">
                  {roleLabels[user?.role || 'user']}
                </span>
              </div>
              <NotificationBell />
              <LanguageToggle />
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => logout()}
                title={t('login.logout')}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  const { i18n } = useTranslation();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = savedLang;
    if (savedLang !== i18n.language) {
      i18n.changeLanguage(savedLang);
    }
  }, [i18n]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('userRole', user.role);
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/forgot-password" component={ForgotPasswordPage} />
        <Route path="/reset-password" component={ResetPasswordPage} />
        <Route><LoginPage /></Route>
      </Switch>
    );
  }

  return <AuthenticatedApp />;
}

function AppWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <App />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default AppWrapper;
