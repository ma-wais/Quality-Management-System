import { useQuery, useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Notification } from "@shared/schema";

const clauseRouteMap: Record<string, string> = {
  "4.1": "/context/issues",
  "4.2": "/context/parties",
  "4.3": "/context/scope",
  "4.4": "/context/processes",
  "5.1": "/leadership/commitment",
  "5.2": "/leadership/policy",
  "5.3": "/leadership/roles",
  "6.1": "/planning/risks",
  "6.2": "/planning/objectives",
  "6.3": "/planning/changes",
  "7.1": "/support/resources",
  "7.2": "/support/competence",
  "7.3": "/support/awareness",
  "7.4": "/support/communication",
  "7.5": "/support/documents",
  "8.1": "/operation/planning",
  "8.2": "/operation/requirements",
  "8.4": "/operation/suppliers",
  "8.5": "/operation/delivery",
  "8.6": "/operation/release",
  "8.7": "/operation/nonconforming",
  "9.1": "/performance/kpis",
  "9.2": "/performance/audits",
  "9.3": "/performance/reviews",
  "10.1": "/improvement/framework",
  "10.2": "/improvement/car",
  "10.3": "/improvement/ideas",
};

function timeAgo(dateStr: string | Date, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t("notifications.justNow");
  if (diffMins < 60) return t("notifications.minutesAgo", { count: diffMins });
  if (diffHours < 24) return t("notifications.hoursAgo", { count: diffHours });
  return t("notifications.daysAgo", { count: diffDays });
}

export function NotificationBell() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }
    const route = clauseRouteMap[notification.clauseRef];
    if (route) {
      setLocation(route);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 ltr:-right-1 rtl:-left-1 h-5 min-w-[20px] flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-0 rounded-full"
              data-testid="badge-notification-count"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80" data-testid="dropdown-notifications">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-semibold text-sm">{t("notifications.title")}</span>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-auto py-1 px-2"
              onClick={() => markAllReadMutation.mutate()}
              data-testid="button-mark-all-read"
            >
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-muted-foreground" data-testid="text-no-notifications">
              {t("notifications.noNotifications")}
            </div>
          ) : (
            notifications.slice(0, 50).map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start gap-1 px-3 py-2.5 cursor-pointer ${
                  !notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
                data-testid={`notification-item-${notification.id}`}
              >
                <div className="flex items-center gap-2 w-full">
                  {!notification.isRead && (
                    <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                  )}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                    {notification.clauseRef}
                  </Badge>
                  <span className="text-sm font-medium truncate flex-1">{notification.title}</span>
                </div>
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xs text-muted-foreground ltr:ml-4 rtl:mr-4">
                    {t(`clauses.${notification.clauseRef}`, { defaultValue: notification.module })}
                  </span>
                  <span className="text-xs text-muted-foreground ltr:ml-auto rtl:mr-auto">
                    {notification.createdAt && timeAgo(notification.createdAt, t)}
                  </span>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
