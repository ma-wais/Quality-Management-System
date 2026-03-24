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
import { Plus, Users, GraduationCap, ClipboardCheck, CheckCircle, Pencil, FileDown, FileSpreadsheet, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { statusColors } from "@/lib/types";
import { exportToWord, exportToExcel, exportToPdf } from "@/lib/export-utils";
import type { Employee, TrainingRecord, PerformanceEvaluation, JobDescription, InsertEmployee, InsertTrainingRecord, InsertPerformanceEvaluation } from "@shared/schema";

export default function CompetencePage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const { user } = useAuth();
  const userRole = localStorage.getItem("userRole") || "user";
  const canReview = userRole === "admin" || userRole === "upper_management";
  const canCreate = userRole !== "auditor";
  const canExport = userRole === "auditor" || userRole === "admin" || userRole === "upper_management" || userRole === "quality_manager";

  const [employeeOpen, setEmployeeOpen] = useState(false);
  const [trainingOpen, setTrainingOpen] = useState(false);
  const [appraisalOpen, setAppraisalOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<TrainingRecord | null>(null);
  const [selectedAppraisal, setSelectedAppraisal] = useState<PerformanceEvaluation | null>(null);
  const [reviewTarget, setReviewTarget] = useState<"employee" | "training" | "appraisal">("employee");
  const [editTarget, setEditTarget] = useState<"employee" | "training" | "appraisal">("employee");
  const { toast } = useToast();

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: trainings = [], isLoading: trainingsLoading } = useQuery<TrainingRecord[]>({
    queryKey: ["/api/training-records"],
  });

  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery<PerformanceEvaluation[]>({
    queryKey: ["/api/performance-evaluations"],
  });

  const { data: jobDescriptions = [] } = useQuery<JobDescription[]>({
    queryKey: ["/api/job-descriptions"],
  });

  const createEmployeeMutation = useMutation({
    mutationFn: (data: InsertEmployee) =>
      apiRequest("POST", "/api/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEmployeeOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const createTrainingMutation = useMutation({
    mutationFn: (data: InsertTrainingRecord) =>
      apiRequest("POST", "/api/training-records", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-records"] });
      setTrainingOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const createAppraisalMutation = useMutation({
    mutationFn: (data: InsertPerformanceEvaluation) =>
      apiRequest("POST", "/api/performance-evaluations", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-evaluations"] });
      setAppraisalOpen(false);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editEmployeeMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertEmployee> }) =>
      apiRequest("PATCH", `/api/employees/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setEditOpen(false);
      setSelectedEmployee(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editTrainingMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertTrainingRecord> }) =>
      apiRequest("PATCH", `/api/training-records/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-records"] });
      setEditOpen(false);
      setSelectedTraining(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const editAppraisalMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<InsertPerformanceEvaluation> }) =>
      apiRequest("PATCH", `/api/performance-evaluations/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-evaluations"] });
      setEditOpen(false);
      setSelectedAppraisal(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewEmployeeMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/employees/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setReviewOpen(false);
      setSelectedEmployee(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewTrainingMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/training-records/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/training-records"] });
      setReviewOpen(false);
      setSelectedTraining(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const reviewAppraisalMutation = useMutation({
    mutationFn: (data: { id: string; reviewData: Record<string, unknown> }) =>
      apiRequest("PATCH", `/api/performance-evaluations/${data.id}`, data.reviewData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/performance-evaluations"] });
      setReviewOpen(false);
      setSelectedAppraisal(null);
      toast({ title: t('common.success') });
    },
    onError: () => {
      toast({ title: t('common.error'), variant: "destructive" });
    },
  });

  const handleEmployeeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const hireDateVal = formData.get("hireDate") as string;
    createEmployeeMutation.mutate({
      employeeId: formData.get("employeeId") as string,
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      department: formData.get("department") as string,
      position: formData.get("position") as string,
      contractType: formData.get("contractType") as string,
      notes: formData.get("notes") as string,
      hireDate: hireDateVal ? new Date(hireDateVal) : null,
      status: "active",
    });
  };

  const handleTrainingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createTrainingMutation.mutate({
      employeeId: formData.get("employeeId") as string,
      trainingTitle: formData.get("trainingTitle") as string,
      trainingType: formData.get("trainingType") as string,
      trainer: formData.get("trainer") as string,
      trainingDate: new Date(formData.get("trainingDate") as string),
      effectiveness: formData.get("evaluation") as string,
      status: "completed",
    });
  };

  const handleAppraisalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createAppraisalMutation.mutate({
      employeeId: formData.get("employeeId") as string,
      objectives: formData.get("objectives") as string,
      evaluation: formData.get("evaluation") as string,
      improvement: formData.get("improvement") as string,
      decision: formData.get("decision") as string,
      duration: formData.get("duration") as string,
      evaluationDate: new Date(),
      status: "completed",
    });
  };

  const handleEditEmployeeSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    const formData = new FormData(e.currentTarget);
    const hireDateVal = formData.get("hireDate") as string;
    editEmployeeMutation.mutate({
      id: selectedEmployee.id,
      updates: {
        employeeId: formData.get("employeeId") as string,
        fullName: formData.get("fullName") as string,
        email: formData.get("email") as string,
        department: formData.get("department") as string,
        position: formData.get("position") as string,
        contractType: formData.get("contractType") as string,
        notes: formData.get("notes") as string,
        hireDate: hireDateVal ? new Date(hireDateVal) : null,
      },
    });
  };

  const handleEditTrainingSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedTraining) return;
    const formData = new FormData(e.currentTarget);
    editTrainingMutation.mutate({
      id: selectedTraining.id,
      updates: {
        trainingTitle: formData.get("trainingTitle") as string,
        trainingType: formData.get("trainingType") as string,
        trainer: formData.get("trainer") as string,
        trainingDate: new Date(formData.get("trainingDate") as string),
        effectiveness: formData.get("evaluation") as string,
      },
    });
  };

  const handleEditAppraisalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedAppraisal) return;
    const formData = new FormData(e.currentTarget);
    editAppraisalMutation.mutate({
      id: selectedAppraisal.id,
      updates: {
        objectives: formData.get("objectives") as string,
        evaluation: formData.get("evaluation") as string,
        improvement: formData.get("improvement") as string,
        decision: formData.get("decision") as string,
        duration: formData.get("duration") as string,
      },
    });
  };

  const handleReviewSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const reviewData = {
      reviewDescription: formData.get("reviewDescription") as string,
      reviewedById: user?.id,
      reviewedByName: user?.fullName || "Unknown",
      reviewedByRole: userRole,
      reviewCompletedAt: new Date().toISOString(),
      status: "completed",
    };

    if (reviewTarget === "employee" && selectedEmployee) {
      reviewEmployeeMutation.mutate({ id: selectedEmployee.id, reviewData });
    } else if (reviewTarget === "training" && selectedTraining) {
      reviewTrainingMutation.mutate({ id: selectedTraining.id, reviewData });
    } else if (reviewTarget === "appraisal" && selectedAppraisal) {
      reviewAppraisalMutation.mutate({ id: selectedAppraisal.id, reviewData });
    }
  };

  const renderReviewedColumn = (item: { id: string; reviewCompletedAt: Date | string | null; createdByName: string | null; reviewedByName: string | null; reviewedByRole: string | null; reviewDescription: string | null }) => (
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
  );

  const employeeColumns = [
    { key: "employeeId", header: t('competence.employeeId') },
    { key: "fullName", header: t('common.name') },
    { key: "department", header: t('common.department') },
    { key: "position", header: t('competence.position') },
    {
      key: "hireDate",
      header: t('competence.hireDate'),
      render: (item: Employee) =>
        item.hireDate ? new Date(item.hireDate).toLocaleDateString() : "—",
    },
    { key: "contractType", header: t('competence.contractType') },
    {
      key: "status",
      header: t('common.status'),
      render: (item: Employee) => (
        <Badge className={statusColors[item.status] || ""}>
          {t(`status.${item.status}`)}
        </Badge>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: Employee) => renderReviewedColumn(item),
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: Employee) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedEmployee(item); setEditTarget("employee"); setEditOpen(true); }} data-testid={`button-edit-employee-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showReview && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedEmployee(item); setReviewTarget("employee"); setReviewOpen(true); }} data-testid={`button-review-employee-${item.id}`}>
                <ClipboardCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.review')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const trainingColumns = [
    {
      key: "employeeId",
      header: t('competence.employee'),
      render: (item: TrainingRecord) => {
        const emp = employees.find((e) => e.id === item.employeeId);
        return emp?.fullName || item.employeeId;
      },
    },
    { key: "trainingTitle", header: t('competence.courseTitle') },
    {
      key: "trainingType",
      header: t('common.type'),
      render: (item: TrainingRecord) => (
        <Badge variant="outline" className="capitalize">
          {t(`competence.trainingTypes.${item.trainingType}`)}
        </Badge>
      ),
    },
    {
      key: "trainingDate",
      header: t('common.date'),
      render: (item: TrainingRecord) =>
        item.trainingDate ? new Date(item.trainingDate).toLocaleDateString() : "—",
    },
    { key: "trainer", header: t('competence.trainerCompany') },
    {
      key: "effectiveness",
      header: t('competence.evaluation'),
      className: "min-w-[150px]",
      render: (item: TrainingRecord) => (
        <span className="whitespace-pre-wrap break-words">{item.effectiveness || "-"}</span>
      ),
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: TrainingRecord) => renderReviewedColumn(item),
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: TrainingRecord) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedTraining(item); setEditTarget("training"); setEditOpen(true); }} data-testid={`button-edit-training-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showReview && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedTraining(item); setReviewTarget("training"); setReviewOpen(true); }} data-testid={`button-review-training-${item.id}`}>
                <ClipboardCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.review')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const appraisalColumns = [
    {
      key: "employeeId",
      header: t('competence.employee'),
      render: (item: PerformanceEvaluation) => {
        const emp = employees.find((e) => e.id === item.employeeId);
        return emp?.fullName || item.employeeId;
      },
    },
    {
      key: "objectives",
      header: t('competence.appraisalObjectives'),
      className: "min-w-[150px]",
      render: (item: PerformanceEvaluation) => (
        <span className="whitespace-pre-wrap break-words">{item.objectives || "-"}</span>
      ),
    },
    {
      key: "evaluation",
      header: t('competence.evaluation'),
      className: "min-w-[150px]",
      render: (item: PerformanceEvaluation) => (
        <span className="whitespace-pre-wrap break-words">{item.evaluation || "-"}</span>
      ),
    },
    { key: "decision", header: t('competence.appraisalDecision') },
    {
      key: "duration",
      header: t('competence.appraisalDuration'),
      render: (item: PerformanceEvaluation) => (
        <Badge variant="outline">
          {item.duration === "six_months" ? t('competence.sixMonths') : t('competence.annually')}
        </Badge>
      ),
    },
    {
      key: "evaluationDate",
      header: t('common.date'),
      render: (item: PerformanceEvaluation) =>
        item.evaluationDate ? new Date(item.evaluationDate).toLocaleDateString() : "—",
    },
    {
      key: "reviewed",
      header: t('issues.reviewed'),
      render: (item: PerformanceEvaluation) => renderReviewedColumn(item),
    },
    {
      key: "actions",
      header: t('common.actions'),
      render: (item: PerformanceEvaluation) => {
        const isCreator = user?.id === item.createdBy;
        const canEdit = isCreator && !item.reviewCompletedAt;
        const showReview = canReview && !item.reviewCompletedAt;
        if (!canEdit && !showReview) return null;
        return (
          <div className="flex gap-1">
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedAppraisal(item); setEditTarget("appraisal"); setEditOpen(true); }} data-testid={`button-edit-appraisal-${item.id}`}>
                <Pencil className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('common.edit')}
              </Button>
            )}
            {showReview && (
              <Button variant="outline" size="sm" onClick={() => { setSelectedAppraisal(item); setReviewTarget("appraisal"); setReviewOpen(true); }} data-testid={`button-review-appraisal-${item.id}`}>
                <ClipboardCheck className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t('issues.review')}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const employeeExportConfig = {
    title: t('competence.employees'),
    clause: "7.2",
    description: t('competence.description'),
    headers: [
      t('competence.employeeId'), t('common.name'), t('common.department'),
      t('competence.position'), t('competence.hireDate'), t('competence.contractType'),
      t('common.status'), t('issues.createdBy'), t('issues.reviewedBy'), t('issues.reviewDescription'),
    ],
    rows: employees.map((e) => [
      e.employeeId || "-", e.fullName || "-", e.department || "-",
      e.position || "-", e.hireDate ? new Date(e.hireDate).toLocaleDateString() : "-",
      e.contractType || "-", t(`status.${e.status}`),
      e.createdByName || "-", e.reviewedByName || "-", e.reviewDescription || "-",
    ]),
    isRtl,
    filename: "7.2_Employees",
  };

  const trainingExportConfig = {
    title: t('competence.training'),
    clause: "7.2",
    description: t('competence.description'),
    headers: [
      t('competence.employee'), t('competence.courseTitle'), t('common.type'),
      t('common.date'), t('competence.trainerCompany'), t('competence.evaluation'),
      t('issues.createdBy'), t('issues.reviewedBy'), t('issues.reviewDescription'),
    ],
    rows: trainings.map((tr) => {
      const emp = employees.find((e) => e.id === tr.employeeId);
      return [
        emp?.fullName || tr.employeeId || "-", tr.trainingTitle || "-", tr.trainingType || "-",
        tr.trainingDate ? new Date(tr.trainingDate).toLocaleDateString() : "-",
        tr.trainer || "-", tr.effectiveness || "-",
        tr.createdByName || "-", tr.reviewedByName || "-", tr.reviewDescription || "-",
      ];
    }),
    isRtl,
    filename: "7.2_Training_Records",
  };

  const appraisalExportConfig = {
    title: t('competence.performanceAppraisal'),
    clause: "7.2",
    description: t('competence.description'),
    headers: [
      t('competence.employee'), t('competence.appraisalObjectives'), t('competence.evaluation'),
      t('competence.appraisalDecision'), t('competence.appraisalDuration'), t('common.date'),
      t('issues.createdBy'), t('issues.reviewedBy'), t('issues.reviewDescription'),
    ],
    rows: evaluations.map((ev) => {
      const emp = employees.find((e) => e.id === ev.employeeId);
      return [
        emp?.fullName || ev.employeeId || "-", ev.objectives || "-", ev.evaluation || "-",
        ev.decision || "-", ev.duration || "-",
        ev.evaluationDate ? new Date(ev.evaluationDate).toLocaleDateString() : "-",
        ev.createdByName || "-", ev.reviewedByName || "-", ev.reviewDescription || "-",
      ];
    }),
    isRtl,
    filename: "7.2_Performance_Evaluations",
  };

  const getReviewItemName = () => {
    if (reviewTarget === "employee" && selectedEmployee) return selectedEmployee.fullName;
    if (reviewTarget === "training" && selectedTraining) return selectedTraining.trainingTitle;
    if (reviewTarget === "appraisal" && selectedAppraisal) {
      const emp = employees.find((e) => e.id === selectedAppraisal.employeeId);
      return emp?.fullName || selectedAppraisal.employeeId;
    }
    return "";
  };

  const getReviewCreatedBy = () => {
    if (reviewTarget === "employee" && selectedEmployee) return selectedEmployee.createdByName;
    if (reviewTarget === "training" && selectedTraining) return selectedTraining.createdByName;
    if (reviewTarget === "appraisal" && selectedAppraisal) return selectedAppraisal.createdByName;
    return "";
  };

  const isReviewPending = reviewEmployeeMutation.isPending || reviewTrainingMutation.isPending || reviewAppraisalMutation.isPending;

  return (
    <div className="p-6">
      <PageHeader
        title={t('competence.title')}
        description={t('competence.description')}
        clause="7.2"
      />

      <Tabs defaultValue="employees" className="space-y-4">
        <TabsList>
          <TabsTrigger value="employees" className="flex items-center gap-2" data-testid="tab-employees">
            <Users className="h-4 w-4" />
            {t('competence.employees')}
          </TabsTrigger>
          <TabsTrigger value="training" className="flex items-center gap-2" data-testid="tab-training">
            <GraduationCap className="h-4 w-4" />
            {t('competence.training')}
          </TabsTrigger>
          <TabsTrigger value="appraisal" className="flex items-center gap-2" data-testid="tab-appraisal">
            <ClipboardCheck className="h-4 w-4" />
            {t('competence.performanceAppraisal')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('competence.employeeDirectory')}</CardTitle>
              <div className="flex gap-2">
                {canExport && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => exportToWord(employeeExportConfig)} data-testid="button-export-employees-word">
                      <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportWord')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToExcel(employeeExportConfig)} data-testid="button-export-employees-excel">
                      <FileSpreadsheet className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportExcel')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPdf(employeeExportConfig)} data-testid="button-export-employees-pdf">
                      <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportPdf')}
                    </Button>
                  </>
                )}
                {canCreate && (
                  <Dialog open={employeeOpen} onOpenChange={setEmployeeOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-employee">
                        <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('competence.addEmployee')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('competence.addEmployee')}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleEmployeeSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="employeeId">{t('competence.employeeId')}</Label>
                            <Input id="employeeId" name="employeeId" required data-testid="input-employee-id" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="fullName">{t('common.name')}</Label>
                            <Input id="fullName" name="fullName" required data-testid="input-full-name" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">{t('common.email')}</Label>
                          <Input id="email" name="email" type="email" data-testid="input-email" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="department">{t('common.department')}</Label>
                            <Input id="department" name="department" required data-testid="input-department" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="position">{t('competence.position')}</Label>
                            <Select name="position" required>
                              <SelectTrigger data-testid="select-position">
                                <SelectValue placeholder={t('competence.selectPosition')} />
                              </SelectTrigger>
                              <SelectContent>
                                {jobDescriptions.map((jd) => (
                                  <SelectItem key={jd.id} value={jd.title}>
                                    {jd.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="hireDate">{t('competence.hireDate')}</Label>
                            <Input id="hireDate" name="hireDate" type="date" data-testid="input-hire-date" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contractType">{t('competence.contractType')}</Label>
                            <Select name="contractType">
                              <SelectTrigger data-testid="select-contract-type">
                                <SelectValue placeholder={t('competence.selectContractType')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full_time">{t('competence.contractTypes.full_time')}</SelectItem>
                                <SelectItem value="part_time">{t('competence.contractTypes.part_time')}</SelectItem>
                                <SelectItem value="contract">{t('competence.contractTypes.contract')}</SelectItem>
                                <SelectItem value="temporary">{t('competence.contractTypes.temporary')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="notes">{t('competence.notes')}</Label>
                          <Textarea id="notes" name="notes" data-testid="input-notes" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setEmployeeOpen(false)}>
                            {t('common.cancel')}
                          </Button>
                          <Button type="submit" disabled={createEmployeeMutation.isPending} data-testid="button-submit-employee">
                            {createEmployeeMutation.isPending ? t('common.loading') : t('common.add')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={employeeColumns} data={employees} isLoading={employeesLoading} emptyMessage={t('common.noData')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="training">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('competence.training')}</CardTitle>
              <div className="flex gap-2">
                {canExport && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => exportToWord(trainingExportConfig)} data-testid="button-export-training-word">
                      <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportWord')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToExcel(trainingExportConfig)} data-testid="button-export-training-excel">
                      <FileSpreadsheet className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportExcel')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPdf(trainingExportConfig)} data-testid="button-export-training-pdf">
                      <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportPdf')}
                    </Button>
                  </>
                )}
                {canCreate && (
                  <Dialog open={trainingOpen} onOpenChange={setTrainingOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-training">
                        <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('competence.addTraining')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('competence.addTraining')}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleTrainingSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t('competence.employee')}</Label>
                          <Select name="employeeId" required>
                            <SelectTrigger data-testid="select-training-employee">
                              <SelectValue placeholder={t('competence.selectEmployee')} />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('competence.courseTitle')}</Label>
                          <Input name="trainingTitle" required data-testid="input-course-title" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('common.type')}</Label>
                            <Select name="trainingType" required>
                              <SelectTrigger data-testid="select-training-type">
                                <SelectValue placeholder={t('competence.selectType')} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="internal">{t('competence.trainingTypes.internal')}</SelectItem>
                                <SelectItem value="external">{t('competence.trainingTypes.external')}</SelectItem>
                                <SelectItem value="online">{t('competence.trainingTypes.online')}</SelectItem>
                                <SelectItem value="on_the_job">{t('competence.trainingTypes.on_the_job')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>{t('common.date')}</Label>
                            <Input name="trainingDate" type="date" required data-testid="input-training-date" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('competence.trainerCompany')}</Label>
                          <Input name="trainer" data-testid="input-trainer" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('competence.evaluation')}</Label>
                          <Textarea name="evaluation" placeholder={t('competence.evaluationPlaceholder')} data-testid="input-evaluation" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setTrainingOpen(false)}>
                            {t('common.cancel')}
                          </Button>
                          <Button type="submit" disabled={createTrainingMutation.isPending} data-testid="button-submit-training">
                            {createTrainingMutation.isPending ? t('common.loading') : t('common.add')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={trainingColumns} data={trainings} isLoading={trainingsLoading} emptyMessage={t('common.noData')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appraisal">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-base">{t('competence.performanceAppraisal')}</CardTitle>
              <div className="flex gap-2">
                {canExport && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => exportToWord(appraisalExportConfig)} data-testid="button-export-appraisal-word">
                      <FileText className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportWord')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToExcel(appraisalExportConfig)} data-testid="button-export-appraisal-excel">
                      <FileSpreadsheet className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportExcel')}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => exportToPdf(appraisalExportConfig)} data-testid="button-export-appraisal-pdf">
                      <FileDown className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                      {t('issues.exportPdf')}
                    </Button>
                  </>
                )}
                {canCreate && (
                  <Dialog open={appraisalOpen} onOpenChange={setAppraisalOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-add-appraisal">
                        <Plus className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                        {t('competence.addAppraisal')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{t('competence.addAppraisal')}</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleAppraisalSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t('competence.employee')}</Label>
                          <Select name="employeeId" required>
                            <SelectTrigger data-testid="select-appraisal-employee">
                              <SelectValue placeholder={t('competence.selectEmployee')} />
                            </SelectTrigger>
                            <SelectContent>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('competence.appraisalObjectives')}</Label>
                          <Textarea name="objectives" required data-testid="input-appraisal-objectives" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('competence.evaluation')}</Label>
                          <Textarea name="evaluation" required data-testid="input-appraisal-evaluation" />
                        </div>
                        <div className="space-y-2">
                          <Label>{t('competence.appraisalImprovement')}</Label>
                          <Textarea name="improvement" data-testid="input-appraisal-improvement" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('competence.appraisalDecision')}</Label>
                            <Input name="decision" data-testid="input-appraisal-decision" />
                          </div>
                          <div className="space-y-2">
                            <Label>{t('competence.appraisalDuration')}</Label>
                            <Select name="duration" required>
                              <SelectTrigger data-testid="select-appraisal-duration">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="six_months">{t('competence.sixMonths')}</SelectItem>
                                <SelectItem value="annually">{t('competence.annually')}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setAppraisalOpen(false)}>
                            {t('common.cancel')}
                          </Button>
                          <Button type="submit" disabled={createAppraisalMutation.isPending} data-testid="button-submit-appraisal">
                            {createAppraisalMutation.isPending ? t('common.loading') : t('common.add')}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <DataTable columns={appraisalColumns} data={evaluations} isLoading={evaluationsLoading} emptyMessage={t('common.noData')} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('common.edit')}</DialogTitle>
          </DialogHeader>
          {editTarget === "employee" && selectedEmployee && (
            <form onSubmit={handleEditEmployeeSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('competence.employeeId')}</Label>
                  <Input name="employeeId" defaultValue={selectedEmployee.employeeId || ""} required data-testid="input-edit-employee-id" />
                </div>
                <div className="space-y-2">
                  <Label>{t('common.name')}</Label>
                  <Input name="fullName" defaultValue={selectedEmployee.fullName || ""} required data-testid="input-edit-full-name" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input name="email" type="email" defaultValue={selectedEmployee.email || ""} data-testid="input-edit-email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.department')}</Label>
                  <Input name="department" defaultValue={selectedEmployee.department || ""} required data-testid="input-edit-department" />
                </div>
                <div className="space-y-2">
                  <Label>{t('competence.position')}</Label>
                  <Select name="position" defaultValue={selectedEmployee.position || ""}>
                    <SelectTrigger data-testid="select-edit-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {jobDescriptions.map((jd) => (
                        <SelectItem key={jd.id} value={jd.title}>
                          {jd.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('competence.hireDate')}</Label>
                  <Input name="hireDate" type="date" defaultValue={selectedEmployee.hireDate ? new Date(selectedEmployee.hireDate).toISOString().split('T')[0] : ""} data-testid="input-edit-hire-date" />
                </div>
                <div className="space-y-2">
                  <Label>{t('competence.contractType')}</Label>
                  <Select name="contractType" defaultValue={selectedEmployee.contractType || ""}>
                    <SelectTrigger data-testid="select-edit-contract-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">{t('competence.contractTypes.full_time')}</SelectItem>
                      <SelectItem value="part_time">{t('competence.contractTypes.part_time')}</SelectItem>
                      <SelectItem value="contract">{t('competence.contractTypes.contract')}</SelectItem>
                      <SelectItem value="temporary">{t('competence.contractTypes.temporary')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('competence.notes')}</Label>
                <Textarea name="notes" defaultValue={selectedEmployee.notes || ""} data-testid="input-edit-notes" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editEmployeeMutation.isPending} data-testid="button-update-employee">
                  {editEmployeeMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          )}
          {editTarget === "training" && selectedTraining && (
            <form onSubmit={handleEditTrainingSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('competence.courseTitle')}</Label>
                <Input name="trainingTitle" defaultValue={selectedTraining.trainingTitle || ""} required data-testid="input-edit-course-title" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('common.type')}</Label>
                  <Select name="trainingType" defaultValue={selectedTraining.trainingType || ""}>
                    <SelectTrigger data-testid="select-edit-training-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal">{t('competence.trainingTypes.internal')}</SelectItem>
                      <SelectItem value="external">{t('competence.trainingTypes.external')}</SelectItem>
                      <SelectItem value="online">{t('competence.trainingTypes.online')}</SelectItem>
                      <SelectItem value="on_the_job">{t('competence.trainingTypes.on_the_job')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('common.date')}</Label>
                  <Input name="trainingDate" type="date" defaultValue={selectedTraining.trainingDate ? new Date(selectedTraining.trainingDate).toISOString().split('T')[0] : ""} required data-testid="input-edit-training-date" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t('competence.trainerCompany')}</Label>
                <Input name="trainer" defaultValue={selectedTraining.trainer || ""} data-testid="input-edit-trainer" />
              </div>
              <div className="space-y-2">
                <Label>{t('competence.evaluation')}</Label>
                <Textarea name="evaluation" defaultValue={selectedTraining.effectiveness || ""} data-testid="input-edit-evaluation" />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editTrainingMutation.isPending} data-testid="button-update-training">
                  {editTrainingMutation.isPending ? t('common.loading') : t('common.update')}
                </Button>
              </div>
            </form>
          )}
          {editTarget === "appraisal" && selectedAppraisal && (
            <form onSubmit={handleEditAppraisalSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('competence.appraisalObjectives')}</Label>
                <Textarea name="objectives" defaultValue={selectedAppraisal.objectives || ""} required data-testid="input-edit-objectives" />
              </div>
              <div className="space-y-2">
                <Label>{t('competence.evaluation')}</Label>
                <Textarea name="evaluation" defaultValue={selectedAppraisal.evaluation || ""} required data-testid="input-edit-evaluation" />
              </div>
              <div className="space-y-2">
                <Label>{t('competence.appraisalImprovement')}</Label>
                <Textarea name="improvement" defaultValue={selectedAppraisal.improvement || ""} data-testid="input-edit-improvement" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('competence.appraisalDecision')}</Label>
                  <Input name="decision" defaultValue={selectedAppraisal.decision || ""} data-testid="input-edit-decision" />
                </div>
                <div className="space-y-2">
                  <Label>{t('competence.appraisalDuration')}</Label>
                  <Select name="duration" defaultValue={selectedAppraisal.duration || ""}>
                    <SelectTrigger data-testid="select-edit-duration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="six_months">{t('competence.sixMonths')}</SelectItem>
                      <SelectItem value="annually">{t('competence.annually')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>{t('common.cancel')}</Button>
                <Button type="submit" disabled={editAppraisalMutation.isPending} data-testid="button-update-appraisal">
                  {editAppraisalMutation.isPending ? t('common.loading') : t('common.update')}
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
          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('common.name')}:</span>
                <span className="font-medium">{getReviewItemName()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('issues.createdBy')}:</span>
                <span className="font-medium">{getReviewCreatedBy() || '-'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reviewDescription">{t('issues.remarks')}</Label>
              <Textarea id="reviewDescription" name="reviewDescription" required data-testid="input-review-description" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReviewOpen(false)}>{t('common.cancel')}</Button>
              <Button type="submit" disabled={isReviewPending} data-testid="button-submit-review">
                {isReviewPending ? t('common.loading') : t('issues.submitReview')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
