/**
 * Login Page Component
 * Handles authentication for Sachiv Dashboard
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || '/admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(t('validation.fillAllFields'));
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F5F5] px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] via-white to-[#138808] p-[2px] shadow-md">
              <div className="flex h-full w-full items-center justify-center rounded-md bg-white">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="drop-shadow-sm">
                  <circle cx="12" cy="12" r="10" fill="#138808" />
                  <path d="M12 4 L12 20 M4 12 L20 12" stroke="white" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" fill="#FF9933" />
                </svg>
              </div>
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-semibold text-[#1B2B5E] tracking-tight">e-GramSeva</h1>
          <p className="text-sm text-[#666]">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <Card className="border border-[#E5E5E5] shadow-md">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl text-[#1B2B5E]">
              <LogIn className="h-5 w-5 text-[#E31E24]" />
              {t('login.title')}
            </CardTitle>
            <CardDescription className="text-[#666]">
              {t('login.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t('login.email')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('login.emailPlaceholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t('login.password')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('login.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#1B2B5E] transition-colors focus:outline-none focus:ring-2 focus:ring-[#E31E24]/20 focus:ring-offset-0 rounded p-1 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isLoading}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-[#E5E5E5] bg-white text-[#E31E24] focus:ring-2 focus:ring-[#E31E24]/20 focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Label htmlFor="remember" className="text-sm cursor-pointer text-[#666]">
                    {t('login.rememberMe')}
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-[#E31E24] hover:underline transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate('/forgot-password');
                  }}
                  disabled={isLoading}
                >
                  {t('login.forgotPassword')}
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-[#E31E24] hover:bg-[#C91A20] text-white font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    {t('login.loggingIn')}
                  </span>
                ) : (
                  t('login.loginButton')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-[#666]">
          {t('login.noAccount')}{' '}
          <button
            type="button"
            className="text-[#E31E24] hover:underline font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#E31E24]/20 focus:ring-offset-1 rounded px-1"
            onClick={() => navigate('/registration')}
          >
            {t('login.registerHere')}
          </button>
        </p>
      </div>
    </div>
  );
}

