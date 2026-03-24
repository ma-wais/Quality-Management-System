import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import type { QualityObjective, Risk, CorrectiveAction, Audit } from "@shared/schema";

type DateFilterType = "all" | "7d" | "30d" | "90d" | "1y" | "custom";

const getDateRange = (filter: DateFilterType, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date = now;

  switch (filter) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case "custom":
      startDate = customStart ? new Date(customStart) : null;
      endDate = customEnd ? new Date(customEnd) : now;
      break;
    default:
      startDate = null;
  }
  return { startDate, endDate };
};

export default function KpisPage() {
  const { t } = useTranslation();
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: objectives = [], isLoading: objectivesLoading } = useQuery<QualityObjective[]>({
    queryKey: ["/api/objectives"],
  });

  const { data: risks = [], isLoading: risksLoading } = useQuery<Risk[]>({
    queryKey: ["/api/risks"],
  });

  const { data: cars = [], isLoading: carsLoading } = useQuery<CorrectiveAction[]>({
    queryKey: ["/api/corrective-actions"],
  });

  const { data: audits = [], isLoading: auditsLoading } = useQuery<Audit[]>({
    queryKey: ["/api/audits"],
  });

  const isLoading = objectivesLoading || risksLoading || carsLoading || auditsLoading;

  const { startDate, endDate } = useMemo(() => {
    return getDateRange(dateFilter, customStartDate, customEndDate);
  }, [dateFilter, customStartDate, customEndDate]);

  const filterByDate = <T extends { createdAt?: string | Date | null }>(items: T[]): T[] => {
    if (!startDate) return items;
    return items.filter((item) => {
      if (!item.createdAt) return true;
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const filteredObjectives = useMemo(() => filterByDate(objectives), [objectives, startDate, endDate]);
  const filteredRisks = useMemo(() => filterByDate(risks), [risks, startDate, endDate]);
  const filteredCars = useMemo(() => filterByDate(cars), [cars, startDate, endDate]);
  const filteredAudits = useMemo(() => filterByDate(audits), [audits, startDate, endDate]);

  const getTrendIcon = (trend: string | null) => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const objectivesAchieved = filteredObjectives.filter((o) => o.status === "achieved").length;
  const objectivesOnTrack = filteredObjectives.filter((o) => o.status === "on_track").length;
  const objectivesAtRisk = filteredObjectives.filter((o) => o.status === "at_risk" || o.status === "behind").length;
  
  const openRisks = filteredRisks.filter((r) => r.status === "open" || r.status === "in_progress").length;
  const highRisks = filteredRisks.filter((r) => (r.likelihood || 1) * (r.impact || 1) >= 15).length;
  
  const openCars = filteredCars.filter((c) => c.status !== "closed" && c.status !== "verified").length;
  const overdueCars = filteredCars.filter((c) => {
    if (c.status === "closed" || c.status === "verified") return false;
    if (!c.dueDate) return false;
    return new Date(c.dueDate) < new Date();
  }).length;

  const completedAudits = filteredAudits.filter((a) => a.status === "completed").length;
  const plannedAudits = filteredAudits.filter((a) => a.status === "planned").length;

  const monthlyTrend = [
    { month: "Jul", objectives: 75, cars: 5, risks: 12 },
    { month: "Aug", objectives: 78, cars: 4, risks: 10 },
    { month: "Sep", objectives: 82, cars: 6, risks: 11 },
    { month: "Oct", objectives: 80, cars: 3, risks: 9 },
    { month: "Nov", objectives: 85, cars: 4, risks: 8 },
    { month: "Dec", objectives: 88, cars: 2, risks: 7 },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader
        title={t('kpis.title')}
        description={t('kpis.description')}
        clause="9.1"
      />

      <Card className="mb-6" data-testid="card-filters">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{t('kpis.dateFilters')}</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              data-testid="button-toggle-filters"
            >
              {showFilters ? t('kpis.hideFilters') : t('kpis.showFilters')}
            </Button>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label htmlFor="date-filter">{t('kpis.timePeriod')}</Label>
                <Select
                  value={dateFilter}
                  onValueChange={(value) => setDateFilter(value as DateFilterType)}
                >
                  <SelectTrigger id="date-filter" className="w-40" data-testid="select-date-filter">
                    <SelectValue placeholder={t('kpis.selectPeriod')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('kpis.allTime')}</SelectItem>
                    <SelectItem value="7d">{t('kpis.last7Days')}</SelectItem>
                    <SelectItem value="30d">{t('kpis.last30Days')}</SelectItem>
                    <SelectItem value="90d">{t('kpis.last90Days')}</SelectItem>
                    <SelectItem value="1y">{t('kpis.lastYear')}</SelectItem>
                    <SelectItem value="custom">{t('kpis.customRange')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {dateFilter === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="start-date">{t('kpis.startDate')}</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="start-date"
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-40"
                        data-testid="input-start-date"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">{t('kpis.endDate')}</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="end-date"
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-40"
                        data-testid="input-end-date"
                      />
                    </div>
                  </div>
                </>
              )}
              
              {dateFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateFilter("all");
                    setCustomStartDate("");
                    setCustomEndDate("");
                  }}
                  data-testid="button-clear-filters"
                >
                  {t('kpis.clearFilters')}
                </Button>
              )}
            </div>
            
            {dateFilter !== "all" && (
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">
                  {t('kpis.showingData')}{" "}
                  {dateFilter === "custom"
                    ? `${t('kpis.from')} ${customStartDate || "start"} ${t('kpis.to')} ${customEndDate || "now"}`
                    : `${t('kpis.forThe')} ${dateFilter === "7d" ? t('kpis.last7Days').toLowerCase() : dateFilter === "30d" ? t('kpis.last30Days').toLowerCase() : dateFilter === "90d" ? t('kpis.last90Days').toLowerCase() : t('kpis.lastYear').toLowerCase()}`}
                </Badge>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card data-testid="card-kpi-objectives">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('kpis.qualityObjectives')}</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredObjectives.length > 0
                ? Math.round((objectivesAchieved / filteredObjectives.length) * 100)
                : 0}%
            </div>
            <Progress
              value={filteredObjectives.length > 0 ? (objectivesAchieved / filteredObjectives.length) * 100 : 0}
              className="h-2 mt-2"
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{objectivesAchieved} {t('kpis.achieved')}</Badge>
              <Badge variant="outline" className="text-xs">{objectivesOnTrack} {t('kpis.onTrack')}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-risks">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('kpis.riskStatus')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openRisks}</div>
            <p className="text-xs text-muted-foreground">{t('kpis.openRisks')}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="destructive" className="text-xs">{highRisks} {t('kpis.highPriority')}</Badge>
              {getTrendIcon(openRisks > 10 ? "up" : "down")}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-cars">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('kpis.correctiveActions')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCars}</div>
            <p className="text-xs text-muted-foreground">{t('kpis.openCars')}</p>
            <div className="flex items-center gap-2 mt-2">
              {overdueCars > 0 && (
                <Badge variant="destructive" className="text-xs">{overdueCars} {t('kpis.overdue')}</Badge>
              )}
              {overdueCars === 0 && (
                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                  {t('kpis.allOnTime')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-kpi-audits">
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">{t('kpis.auditCompletion')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredAudits.length > 0
                ? Math.round((completedAudits / filteredAudits.length) * 100)
                : 0}%
            </div>
            <Progress
              value={filteredAudits.length > 0 ? (completedAudits / filteredAudits.length) * 100 : 0}
              className="h-2 mt-2"
            />
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{completedAudits} {t('kpis.completed')}</Badge>
              <Badge variant="outline" className="text-xs">{plannedAudits} {t('kpis.planned')}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card data-testid="card-objective-trend">
          <CardHeader>
            <CardTitle className="text-base">{t('kpis.objectiveTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="objectives"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-car-risk-trend">
          <CardHeader>
            <CardTitle className="text-base">{t('kpis.carRiskTrend')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cars"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="CARs"
                  />
                  <Line
                    type="monotone"
                    dataKey="risks"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Risks"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6" data-testid="card-objectives-detail">
        <CardHeader>
          <CardTitle className="text-base">{t('kpis.objectivesStatus')}</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredObjectives.length > 0 ? (
            <div className="space-y-4">
              {filteredObjectives.map((obj) => {
                const current = parseFloat(obj.currentValue || "0");
                const target = parseFloat(obj.targetValue);
                const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0;
                
                return (
                  <div key={obj.id} className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {obj.objectiveTitle}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {obj.currentValue || 0} / {obj.targetValue} {obj.unit}
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <Badge
                      className={
                        obj.status === "achieved"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : obj.status === "on_track"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }
                    >
                      {t(`status.${obj.status}`)}
                    </Badge>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('kpis.noObjectives')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
