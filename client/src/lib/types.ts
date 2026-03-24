export type StatusType = "open" | "in_progress" | "closed" | "pending" | "completed" | "verified";

export interface DashboardStats {
  totalRisks: number;
  openRisks: number;
  totalObjectives: number;
  achievedObjectives: number;
  totalAudits: number;
  completedAudits: number;
  totalCARs: number;
  openCARs: number;
  totalDocuments: number;
  pendingDocuments: number;
  totalSuppliers: number;
  activeSuppliers: number;
}

export const statusColors: Record<string, string> = {
  open: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  closed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  pending: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  verified: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  draft: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-800 dark:bg-gray-800/30 dark:text-gray-400",
  on_track: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  at_risk: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  behind: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  achieved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  planned: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  under_review: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  implemented: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  major_nc: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  minor_nc: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  observation: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  opportunity: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  high: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export const priorityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};
