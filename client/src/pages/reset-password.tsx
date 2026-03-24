import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearch } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const token = params.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError(t("resetPassword.mismatch", "Passwords do not match"));
      return;
    }
    if (newPassword.length < 6) {
      setError(t("resetPassword.tooShort", "Password must be at least 6 characters"));
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("resetPassword.error", "Failed to reset password"));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t("resetPassword.error", "Failed to reset password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4" dir={isRtl ? "rtl" : "ltr"}>
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="text-center py-8 space-y-4">
            <p className="text-destructive">{t("resetPassword.invalidLink", "Invalid or missing reset link")}</p>
            <Link href="/">
              <Button variant="outline" data-testid="link-back-to-login">
                <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                {t("forgotPassword.backToLogin", "Back to Login")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("resetPassword.title", "Reset Password")}
          </CardTitle>
          <CardDescription>
            {t("resetPassword.description", "Enter your new password below")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-reset-success">
                {t("resetPassword.success", "Your password has been reset successfully. You can now log in with your new password.")}
              </p>
              <Link href="/">
                <Button className="mt-4" data-testid="link-go-to-login">
                  <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t("resetPassword.goToLogin", "Go to Login")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t("resetPassword.newPassword", "New Password")}</Label>
                <div className="relative">
                  <Lock className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("resetPassword.newPasswordPlaceholder", "Enter new password")}
                    required
                    className="ltr:pl-10 ltr:pr-10 rtl:pr-10 rtl:pl-10"
                    data-testid="input-new-password"
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t("resetPassword.confirmPassword", "Confirm Password")}</Label>
                <div className="relative">
                  <Lock className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("resetPassword.confirmPasswordPlaceholder", "Confirm new password")}
                    required
                    className="ltr:pl-10 rtl:pr-10"
                    data-testid="input-confirm-password"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3" data-testid="text-reset-error">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-reset-password">
                {isSubmitting
                  ? t("resetPassword.resetting", "Resetting...")
                  : t("resetPassword.resetButton", "Reset Password")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
