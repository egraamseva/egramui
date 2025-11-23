/**
 * Forgot Password Component
 * Request password reset
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { toast } from "sonner";
import { authAPIEnhanced } from "../../services/api";
import { useTranslation } from "react-i18next";

export function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('validation.emailRequired'));
      return;
    }

    setLoading(true);
    try {
      await authAPIEnhanced.forgotPassword({ email });
      setSuccess(true);
      toast.success(t('forgotPassword.resetLinkSent'));
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
          <CardTitle className="text-2xl">{t('forgotPassword.title')}</CardTitle>
          <CardDescription>
            {t('forgotPassword.subtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                {t('forgotPassword.checkEmail')}
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('forgotPassword.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? t('forgotPassword.sending') : t('forgotPassword.sendResetLink')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

