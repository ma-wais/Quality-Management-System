import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Target,
  ClipboardCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChartIcon,
  Users,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  Area,
  AreaChart,
} from "recharts";
import type { Risk, QualityObjective, CorrectiveAction, Audit, Supplier } from "@shared/schema";

export default function Dashboard() {
  const { t } = useTranslation();
  
  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: objectives = [], isLoading: objectivesLoading } = useQuery<QualityObjective[]>({
    queryKey: ["/api/objectives"],
  });

  const { data: cars = [], isLoading: carsLoading } = useQuery<CorrectiveAction[]>({
    queryKey: ["/api/corrective-actions"],
  });

  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
  });

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery<Supplier[]>({
    queryKey: ["/api/suppliers"],
  });

  const isLoading = risksLoading || objectivesLoading || carsLoading || auditsLoading || suppliersLoading;

  const openRisks = risks.filter((r) => r.status === "open" || r.status === "in_progress");
  const highRisks = risks.filter((r) => (r.likelihood || 1) * (r.impact || 1) >= 15);
  const openCars = cars.filter((c) => c.status !== "closed" && c.status !== "verified");
  const overdueCars = openCars.filter((c) => c.dueDate && new Date(c.dueDate) < new Date());
  const completedAudits = audits.filter((a) => a.status === "completed");
  const achievedObjectives = objectives.filter((o) => o.status === "achieved");
  const activeSuppliers = suppliers.filter((s) => s.status === "active");

  const riskDistribution = [
    { name: t('dashboard.low'), value: risks.filter((r) => (r.likelihood || 1) * (r.impact || 1) < 6).length, color: "#10b981" },
    { name: t('dashboard.medium'), value: risks.filter((r) => { const s = (r.likelihood || 1) * (r.impact || 1); return s >= 6 && s < 15; }).length, color: "#f59e0b" },
    { name: t('dashboard.high'), value: risks.filter((r) => (r.likelihood || 1) * (r.impact || 1) >= 15).length, color: "#ef4444" },
  ];

  const objectiveStatus = [
    { name: t('dashboard.onTrack'), count: objectives.filter((o) => o.status === "on_track").length, color: "#10b981" },
    { name: t('dashboard.atRisk'), count: objectives.filter((o) => o.status === "at_risk").length, color: "#f59e0b" },
    { name: t('dashboard.behind'), count: objectives.filter((o) => o.status === "behind").length, color: "#ef4444" },
    { name: t('cards.achieved'), count: objectives.filter((o) => o.status === "achieved").length, color: "#3b82f6" },
  ];

  const carStatusData = [
    { name: t('dashboard.open'), value: cars.filter((c) => c.status === "open").length, color: "#ef4444" },
    { name: t('dashboard.inProgress'), value: cars.filter((c) => c.status === "root_cause_analysis" || c.status === "action_planned" || c.status === "implemented").length, color: "#f59e0b" },
    { name: t('dashboard.closed'), value: cars.filter((c) => c.status === "closed" || c.status === "verified").length, color: "#10b981" },
  ];

  const auditCompliance = [
    { area: t('dashboard.areas.production'), score: 92 },
    { area: t('dashboard.areas.quality'), score: 88 },
    { area: t('dashboard.areas.warehouse'), score: 95 },
    { area: t('dashboard.areas.hr'), score: 85 },
    { area: t('dashboard.areas.it'), score: 90 },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-dashboard-title">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.subtitle')}</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          {t('dashboard.liveData')}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden" data-testid="card-risks-summary">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.activeRisks')}</CardTitle>
            <div className="rounded-full bg-orange-100 dark:bg-orange-900/30 p-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openRisks.length}</div>
            <div className="flex items-center gap-2 mt-2">
              {highRisks.length > 0 ? (
                <>
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500 font-medium">{highRisks.length} {t('dashboard.highPriority')}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{t('dashboard.noHighPriority')}</span>
              )}
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-objectives-summary">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.qualityObjectives')}</CardTitle>
            <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-2">
              <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{achievedObjectives.length}<span className="text-lg text-muted-foreground font-normal">/{objectives.length}</span></div>
            <div className="flex items-center gap-2 mt-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {objectives.length > 0 ? Math.round((achievedObjectives.length / objectives.length) * 100) : 0}% {t('cards.achieved')}
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-blue-600" />
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-cars-summary">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.openCARs')}</CardTitle>
            <div className="rounded-full bg-red-100 dark:bg-red-900/30 p-2">
              <ClipboardCheck className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{openCars.length}</div>
            <div className="flex items-center gap-2 mt-2">
              {overdueCars.length > 0 ? (
                <>
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-500 font-medium">{overdueCars.length} {t('dashboard.overdue')}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">{t('cards.allOnSchedule')}</span>
              )}
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 to-red-600" />
        </Card>

        <Card className="relative overflow-hidden" data-testid="card-audits-summary">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('cards.auditsComplete')}</CardTitle>
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-2">
              <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{completedAudits.length}<span className="text-lg text-muted-foreground font-normal">/{audits.length}</span></div>
            <div className="flex items-center gap-2 mt-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                {audits.filter((a) => a.status === "planned").length} {t('cards.scheduled')}
              </span>
            </div>
          </CardContent>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-risk-distribution">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t('dashboard.riskDistribution')}</CardTitle>
                <CardDescription>{t('dashboard.riskDistributionDesc')}</CardDescription>
              </div>
              <PieChartIcon className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center justify-center">
              {risks.length === 0 ? (
                <p className="text-muted-foreground">{t('dashboard.noRisks')}</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {riskDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-objective-status">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t('dashboard.objectiveProgress')}</CardTitle>
                <CardDescription>{t('dashboard.objectiveProgressDesc')}</CardDescription>
              </div>
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              {objectives.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <p className="text-muted-foreground">{t('dashboard.noObjectives')}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={objectiveStatus} layout="vertical" barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} className="stroke-muted/30" />
                    <XAxis type="number" className="text-xs" axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" width={70} className="text-xs" axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {objectiveStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card data-testid="card-recent-risks">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t('dashboard.highPriorityRisks')}</CardTitle>
              <Badge variant="destructive" className="text-xs">{highRisks.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {highRisks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noHighPriority')}</p>
                </div>
              ) : (
                highRisks.slice(0, 4).map((risk) => (
                  <div key={risk.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{risk.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{risk.owner}</p>
                    </div>
                    <Badge variant="destructive" className="ml-3 tabular-nums">
                      {(risk.likelihood || 1) * (risk.impact || 1)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-cars">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t('dashboard.openActions')}</CardTitle>
              <Badge variant="secondary" className="text-xs">{openCars.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {openCars.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.allActionsCompleted')}</p>
                </div>
              ) : (
                openCars.slice(0, 4).map((car) => (
                  <div key={car.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{car.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{car.carNumber}</p>
                    </div>
                    <Badge 
                      variant={car.priority === "high" || car.priority === "critical" ? "destructive" : "outline"} 
                      className="ltr:ml-3 rtl:mr-3 capitalize"
                    >
                      {t(`priority.${car.priority}`)}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-upcoming-audits">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{t('dashboard.upcomingAudits')}</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {audits.filter((a) => a.status === "planned").length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {audits.filter((a) => a.status === "planned").length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingAudits')}</p>
                </div>
              ) : (
                audits
                  .filter((a) => a.status === "planned")
                  .slice(0, 4)
                  .map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{audit.scope}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{audit.auditNumber}</p>
                      </div>
                      <Badge variant="outline" className="ml-3 tabular-nums">
                        {audit.plannedDate ? new Date(audit.plannedDate).toLocaleDateString() : "TBD"}
                      </Badge>
                    </div>
                  ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card data-testid="card-car-status">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t('dashboard.carStatus')}</CardTitle>
                <CardDescription>{t('dashboard.carStatusDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 flex items-center justify-center">
              {cars.length === 0 ? (
                <p className="text-muted-foreground">{t('dashboard.noCars')}</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={carStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {carStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex justify-center gap-6 mt-4">
              {carStatusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-muted-foreground">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-audit-compliance">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">{t('dashboard.auditCompliance')}</CardTitle>
                <CardDescription>{t('dashboard.auditComplianceDesc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={auditCompliance} barSize={32}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted/30" />
                  <XAxis dataKey="area" className="text-xs" axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} className="text-xs" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    formatter={(value: number) => [`${value}%`, t('dashboard.compliance')]}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('dashboard.totalSuppliers')}</p>
                <p className="text-2xl font-bold mt-1">{suppliers.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-2">{activeSuppliers.length} {t('status.active')}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/50 dark:to-green-900/30 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">{t('dashboard.totalRisks')}</p>
                <p className="text-2xl font-bold mt-1">{risks.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-green-600/70 dark:text-green-400/70 mt-2">{risks.filter(r => r.status === "closed").length} {t('status.closed')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('dashboard.totalCars')}</p>
                <p className="text-2xl font-bold mt-1">{cars.length}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-purple-600/70 dark:text-purple-400/70 mt-2">{cars.filter(c => c.status === "closed" || c.status === "verified").length} {t('dashboard.resolved')}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/30 border-amber-200 dark:border-amber-800">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400">{t('dashboard.totalAudits')}</p>
                <p className="text-2xl font-bold mt-1">{audits.length}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-2">{completedAudits.length} {t('status.completed')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
