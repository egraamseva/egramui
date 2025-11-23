/**
 * Reset Password Component
 * Reset password with token
 */

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { toast } from "sonner";
import { authAPIEnhanced } from "@/services/api";
import { useTranslation } from "react-i18next";

export function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error(t('validation.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      toast.error(t('resetPassword.passwordsDoNotMatch'));
      return;
    }
    if (password.length < 8) {
      toast.error(t('validation.passwordMinLength'));
      return;
    }

    if (!token) {
      toast.error(t('resetPassword.invalidToken'));
      return;
    }

    setLoading(true);
    try {
      await authAPIEnhanced.resetPassword({ token, password });
      toast.success(t('resetPassword.passwordResetSuccess'));
      navigate("/login");
    } catch (error) {
      toast.error(t('notifications.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5] px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/login")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('forgotPassword.backToLogin')}
          </Button>
          <CardTitle className="text-2xl">{t('resetPassword.title')}</CardTitle>
          <CardDescription>{t('resetPassword.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{t('resetPassword.newPassword')}</Label>
              <Input
                id="password"
                type="password"
                placeholder={t('resetPassword.newPassword')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('resetPassword.confirmPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t('resetPassword.confirmPassword')}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              <Lock className="h-4 w-4 mr-2" />
              {loading ? t('resetPassword.resetting') : t('resetPassword.resetButton')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

