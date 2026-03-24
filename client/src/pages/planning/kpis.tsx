import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Target, Save, ImageIcon, FileDown, Plus, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";
import type { LeadershipKpiData } from "@shared/schema";

export default function PlanningKPIs() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const kpiRef = useRef<HTMLDivElement>(null);

  const { data: kpiData = [], isLoading } = useQuery<LeadershipKpiData[]>({
    queryKey: ["/api/leadership-kpi-data"],
  });

  const sectionData = kpiData.filter(d => d.section.startsWith("6."));

  useEffect(() => {
    if (!isLoading && sectionData.length === 0) {
      apiRequest("POST", "/api/leadership-kpi-data/seed-section", { prefix: "6" }).then(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/leadership-kpi-data"] });
      }).catch(() => {});
    }
  }, [sectionData.length, isLoading]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<LeadershipKpiData> }) => {
      return apiRequest("PATCH", `/api/leadership-kpi-data/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leadership-kpi-data"] });
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { section: string; indicator: string; measurementMethod: string; target: string }) => {
      return apiRequest("POST", "/api/leadership-kpi-data", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leadership-kpi-data"] });
      toast({ title: t('common.success') });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/leadership-kpi-data/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leadership-kpi-data"] });
    },
  });

  const section61 = sectionData.filter(d => d.section === "6.1");
  const section62 = sectionData.filter(d => d.section === "6.2");
  const section63 = sectionData.filter(d => d.section === "6.3");

  const parseNum = (val: string | null | undefined): number => {
    if (!val) return 0;
    const match = val.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : 0;
  };

  const getBarColor = (actual: number, target: number) => {
    if (target === 0) return "#94a3b8";
    const ratio = actual / target;
    if (ratio >= 1) return "#22c55e";
    if (ratio >= 0.7) return "#eab308";
    return "#ef4444";
  };

  const getStatusInfo = (actual: number, target: number) => {
    if (target === 0) return { label: "—", color: "bg-gray-100 text-gray-600", icon: Minus };
    const ratio = actual / target;
    if (ratio >= 1) return { label: t('status.achieved'), color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: TrendingUp };
    if (ratio >= 0.7) return { label: t('status.at_risk'), color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Minus };
    return { label: t('status.behind'), color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: TrendingDown };
  };

  const handleExportImage = async () => {
    if (!kpiRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(kpiRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const link = document.createElement("a");
    link.download = `planning-kpis-${new Date().toISOString().split("T")[0]}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleExportPDF = async () => {
    if (!kpiRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(kpiRef.current, { backgroundColor: "#ffffff", scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("landscape", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`planning-kpis-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const getChartData = (data: LeadershipKpiData[]) => {
    return data.map(item => ({
      name: item.indicator.length > 20 ? item.indicator.substring(0, 20) + "..." : item.indicator,
      fullName: item.indicator,
      target: parseNum(item.target),
      actual: parseNum(item.actualValue),
    }));
  };

  const renderKpiSection = (sectionId: string, sectionTitle: string, data: LeadershipKpiData[]) => {
    const chartData = getChartData(data);
    const hasActualValues = chartData.some(d => d.actual > 0);

    return (
      <Card className="mb-6" data-testid={`card-kpi-section-${sectionId}`}>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            {sectionTitle}
          </CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() => createMutation.mutate({ section: sectionId, indicator: "", measurementMethod: "", target: "" })}
            data-testid={`button-add-kpi-${sectionId}`}
          >
            <Plus className="h-4 w-4 ltr:mr-1 rtl:ml-1" />
            {t('common.add')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-start py-3 px-3 font-medium w-[35%]">{t('planningKpis.indicator')}</th>
                  <th className="text-start py-3 px-3 font-medium w-[30%]">{t('planningKpis.measurementMethod')}</th>
                  <th className="text-start py-3 px-3 font-medium w-[12%]">{t('planningKpis.targetLabel')}</th>
                  <th className="text-start py-3 px-3 font-medium w-[12%]">{t('planningKpis.actualValue')}</th>
                  <th className="text-center py-3 px-3 font-medium w-[11%]">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <KpiRow key={item.id} item={item} onUpdate={updateMutation.mutate} onDelete={deleteMutation.mutate} />
                ))}
              </tbody>
            </table>
          </div>

          {hasActualValues && (
            <div className="h-72 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={0} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name === "actual" ? t('planningKpis.actualValue') : t('planningKpis.targetLabel')]}
                    labelFormatter={(label) => { const entry = chartData.find(d => d.name === label); return entry?.fullName || label; }}
                  />
                  <Bar dataKey="target" fill="#cbd5e1" name={t('planningKpis.targetLabel')} barSize={28} radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="target" position="top" fontSize={10} fill="#64748b" />
                  </Bar>
                  <Bar dataKey="actual" name={t('planningKpis.actualValue')} barSize={28} radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (<Cell key={index} fill={getBarColor(entry.actual, entry.target)} />))}
                    <LabelList dataKey="actual" position="top" fontSize={10} fill="#334155" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {!hasActualValues && data.length > 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm" data-testid={`text-no-chart-${sectionId}`}>
              {t('planningKpis.fillActualValues')}
            </div>
          )}

          {data.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {data.filter(item => item.indicator).map((item) => {
                const actual = parseNum(item.actualValue);
                const target = parseNum(item.target);
                const status = getStatusInfo(actual, target);
                const StatusIcon = status.icon;
                return (
                  <Card key={item.id} className="border" data-testid={`card-indicator-${item.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-medium leading-tight flex-1">{item.indicator}</h4>
                        <Badge className={`${status.color} text-[10px] px-1.5 py-0.5 ltr:ml-2 rtl:mr-2 whitespace-nowrap`}>
                          <StatusIcon className="h-3 w-3 ltr:mr-0.5 rtl:ml-0.5" />
                          {status.label}
                        </Badge>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t('planningKpis.targetLabel')}:</span>
                          <span className="font-medium">{item.target || "—"}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t('planningKpis.actualValue')}:</span>
                          <span className="font-semibold">{item.actualValue || "—"}</span>
                        </div>
                        {target > 0 && (
                          <div className="mt-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((actual / target) * 100, 100)}%`, backgroundColor: getBarColor(actual, target) }} />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 text-end">{target > 0 ? `${Math.round((actual / target) * 100)}%` : "—"}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader title={t('planningKpis.title')} description={t('planningKpis.description')} clause="6" />
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title={t('planningKpis.title')} description={t('planningKpis.description')} clause="6" />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportImage} data-testid="button-export-image">
            <ImageIcon className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('planningKpis.exportImage')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} data-testid="button-export-pdf">
            <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
            {t('planningKpis.exportPDF')}
          </Button>
        </div>
      </div>

      <div ref={kpiRef}>
        {renderKpiSection("6.1", t('planningKpis.section61Title'), section61)}
        {renderKpiSection("6.2", t('planningKpis.section62Title'), section62)}
        {renderKpiSection("6.3", t('planningKpis.section63Title'), section63)}
      </div>
    </div>
  );
}

function KpiRow({ item, onUpdate, onDelete }: {
  item: LeadershipKpiData;
  onUpdate: (data: { id: string; data: Partial<LeadershipKpiData> }) => void;
  onDelete: (id: string) => void;
}) {
  const [indicator, setIndicator] = useState(item.indicator);
  const [method, setMethod] = useState(item.measurementMethod);
  const [target, setTarget] = useState(item.target);
  const [actual, setActual] = useState(item.actualValue || "");
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    onUpdate({ id: item.id, data: { indicator, measurementMethod: method, target, actualValue: actual } });
    setDirty(false);
  };

  const handleChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setDirty(true);
  };

  return (
    <tr className="border-b last:border-0 hover:bg-muted/30" data-testid={`row-kpi-${item.id}`}>
      <td className="py-2 px-3"><Input value={indicator} onChange={handleChange(setIndicator)} className="h-9 text-sm" data-testid={`input-indicator-${item.id}`} /></td>
      <td className="py-2 px-3"><Input value={method} onChange={handleChange(setMethod)} className="h-9 text-sm" data-testid={`input-method-${item.id}`} /></td>
      <td className="py-2 px-3"><Input value={target} onChange={handleChange(setTarget)} className="h-9 text-sm" data-testid={`input-target-${item.id}`} /></td>
      <td className="py-2 px-3"><Input value={actual} onChange={handleChange(setActual)} className="h-9 text-sm" placeholder="—" data-testid={`input-actual-${item.id}`} /></td>
      <td className="py-2 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
          {dirty && (<Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleSave} data-testid={`button-save-kpi-${item.id}`}><Save className="h-3.5 w-3.5 text-green-600" /></Button>)}
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDelete(item.id)} data-testid={`button-delete-kpi-${item.id}`}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      </td>
    </tr>
  );
}
