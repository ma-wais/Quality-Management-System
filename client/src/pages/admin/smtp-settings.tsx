import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Mail, Save, Send, Eye, EyeOff, Server } from "lucide-react";

export default function SmtpSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    host: "",
    port: "587",
    secure: false,
    username: "",
    password: "",
    fromEmail: "",
    fromName: "QMS Pro",
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/smtp-settings"],
    queryFn: async () => {
      const res = await fetch("/api/smtp-settings", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const hasLoaded = settings !== undefined;
  if (hasLoaded && settings && form.host === "" && settings.host) {
    setForm({
      host: settings.host || "",
      port: String(settings.port || 587),
      secure: settings.secure || false,
      username: settings.username || "",
      password: "",
      fromEmail: settings.fromEmail || "",
      fromName: settings.fromName || "QMS Pro",
    });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/smtp-settings", {
        ...form,
        port: parseInt(form.port),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/smtp-settings"] });
      toast({ title: t("smtp.saved", "SMTP settings saved successfully") });
    },
    onError: (err: any) => {
      toast({ title: t("smtp.saveFailed", "Failed to save SMTP settings"), description: err.message, variant: "destructive" });
    },
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/smtp-settings/test", {});
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: data.message || t("smtp.testSuccess", "Test email sent successfully") });
    },
    onError: (err: any) => {
      toast({ title: t("smtp.testFailed", "Test failed"), description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return <div className="p-8"><div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-64 bg-muted rounded" /></div></div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title={t("smtp.title", "SMTP Email Settings")}
        description={t("smtp.description", "Configure the email server used for sending password reset emails and system notifications")}
        clause="Admin"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {t("smtp.serverConfig", "Mail Server Configuration")}
          </CardTitle>
          <CardDescription>
            {t("smtp.serverConfigDesc", "Enter your SMTP server details. These settings will be used to send all outgoing emails from the system.")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="host">{t("smtp.host", "SMTP Host")}</Label>
              <Input
                id="host"
                placeholder="smtp.gmail.com"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
                data-testid="input-smtp-host"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="port">{t("smtp.port", "Port")}</Label>
              <Input
                id="port"
                type="number"
                placeholder="587"
                value={form.port}
                onChange={(e) => setForm({ ...form, port: e.target.value })}
                data-testid="input-smtp-port"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="secure"
              checked={form.secure}
              onCheckedChange={(checked) => setForm({ ...form, secure: checked })}
              data-testid="switch-smtp-secure"
            />
            <Label htmlFor="secure">{t("smtp.secure", "Use SSL/TLS (port 465)")}</Label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">{t("smtp.username", "Username / Email")}</Label>
              <Input
                id="username"
                placeholder="noreply@yourdomain.com"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                data-testid="input-smtp-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPassword">{t("smtp.password", "Password / App Password")}</Label>
              <div className="relative">
                <Input
                  id="smtpPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={settings ? "••••••••" : t("smtp.passwordPlaceholder", "Enter password")}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="ltr:pr-10 rtl:pl-10"
                  data-testid="input-smtp-password"
                />
                <button
                  type="button"
                  className="absolute ltr:right-3 rtl:left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fromEmail">{t("smtp.fromEmail", "From Email Address")}</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="noreply@yourdomain.com"
                value={form.fromEmail}
                onChange={(e) => setForm({ ...form, fromEmail: e.target.value })}
                data-testid="input-smtp-from-email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fromName">{t("smtp.fromName", "From Display Name")}</Label>
              <Input
                id="fromName"
                placeholder="QMS Pro"
                value={form.fromName}
                onChange={(e) => setForm({ ...form, fromName: e.target.value })}
                data-testid="input-smtp-from-name"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.host || !form.username || !form.password || !form.fromEmail}
              data-testid="button-save-smtp"
            >
              <Save className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {saveMutation.isPending ? t("common.saving", "Saving...") : t("smtp.save", "Save Settings")}
            </Button>
            <Button
              variant="outline"
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending || !settings}
              data-testid="button-test-smtp"
            >
              <Send className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
              {testMutation.isPending ? t("smtp.sending", "Sending...") : t("smtp.test", "Send Test Email")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            {t("smtp.helpTitle", "Setup Guide")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>Gmail:</strong> {t("smtp.helpGmail", "Use smtp.gmail.com, port 587, and generate an App Password from your Google Account security settings.")}</p>
          <p><strong>Outlook/Office 365:</strong> {t("smtp.helpOutlook", "Use smtp.office365.com, port 587. Use your full email as username.")}</p>
          <p><strong>Custom SMTP:</strong> {t("smtp.helpCustom", "Use your mail server's SMTP host and port. Port 587 for STARTTLS, port 465 for SSL/TLS.")}</p>
        </CardContent>
      </Card>
    </div>
  );
}
