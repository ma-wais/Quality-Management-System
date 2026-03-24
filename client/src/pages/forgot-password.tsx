import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === "ar";
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || t("forgotPassword.error", "Failed to process request"));
      } else {
        setSubmitted(true);
      }
    } catch {
      setError(t("forgotPassword.error", "Failed to process request"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4" dir={isRtl ? "rtl" : "ltr"}>
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {t("forgotPassword.title", "Forgot Password")}
          </CardTitle>
          <CardDescription>
            {t("forgotPassword.description", "Enter your email address and we'll send you a link to reset your password")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm text-muted-foreground" data-testid="text-reset-sent">
                {t("forgotPassword.sent", "If an account with that email exists, a password reset link has been sent. Please check your inbox.")}
              </p>
              <Link href="/">
                <Button variant="outline" className="mt-4" data-testid="link-back-to-login">
                  <ArrowLeft className="h-4 w-4 ltr:mr-2 rtl:ml-2" />
                  {t("forgotPassword.backToLogin", "Back to Login")}
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email", "Email")}</Label>
                <div className="relative">
                  <Mail className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("login.emailPlaceholder", "Enter your email")}
                    required
                    className="ltr:pl-10 rtl:pr-10"
                    data-testid="input-forgot-email"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 rounded-md p-3" data-testid="text-forgot-error">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-send-reset">
                {isSubmitting
                  ? t("forgotPassword.sending", "Sending...")
                  : t("forgotPassword.sendLink", "Send Reset Link")}
              </Button>

              <div className="text-center">
                <Link href="/">
                  <span className="text-sm text-blue-600 hover:underline cursor-pointer" data-testid="link-back-to-login-2">
                    {t("forgotPassword.backToLogin", "Back to Login")}
                  </span>
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
