import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, User, MapPin } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { panchayatAPI } from "../../services/api";
import { toast } from "sonner";
import type { RegistrationFormData } from "../../types";
import { useTranslation } from "react-i18next";

export function RegistrationFlow() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<RegistrationFormData>({
    // Personal Details
    sachivName: "",
    email: "",
    phone: "",
    designation: "",
    password: "",
    confirmPassword: "",
    // Panchayat Details
    panchayatName: "",
    district: "",
    state: "",
    block: "",
    population: "",
    area: "",
    wards: "",
    subdomain: "",
    // Documents
    idProof: null,
    appointmentLetter: null,
    panchayatCertificate: null,
    // Terms
    acceptTerms: false,
  });

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const steps = [
    { number: 1, title: t('registration.step1Title'), icon: User },
    { number: 2, title: t('registration.step2Title'), icon: MapPin },
    { number: 3, title: t('registration.step3Title'), icon: Check },
  ];

  // Validation for each step
  const isStep1Valid = () => {
    const phoneDigits = formData.phone?.replace(/\D/g, '') || '';
    return (
      formData.sachivName.trim() !== "" &&
      formData.designation !== "" &&
      formData.email.trim() !== "" &&
      phoneDigits.length === 10 &&
      formData.password.trim() !== "" &&
      formData.confirmPassword.trim() !== "" &&
      formData.password === formData.confirmPassword
    );
  };

  const isStep2Valid = () => {
    return (
      formData.panchayatName.trim() !== "" &&
      formData.state !== "" &&
      formData.district.trim() !== "" &&
      formData.block.trim() !== "" &&
      formData.subdomain.trim() !== ""
    );
  };

  const isCurrentStepValid = () => {
    if (step === 1) return isStep1Valid();
    if (step === 2) return isStep2Valid();
    return true;
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.sachivName.trim()) {
      toast.error(t('validation.nameRequired'));
      return;
    }

    if (!formData.designation) {
      toast.error(t('validation.designationRequired'));
      return;
    }

    if (!formData.email.trim()) {
      toast.error(t('validation.emailRequired'));
      return;
    }

    // Validate phone number (should be 10 digits)
    const phoneDigits = formData.phone?.replace(/\D/g, '') || '';
    if (!phoneDigits || phoneDigits.length !== 10) {
      toast.error(t('validation.phoneInvalid'));
      return;
    }

    if (!formData.panchayatName.trim()) {
      toast.error(t('validation.panchayatNameRequired'));
      return;
    }

    if (!formData.district.trim()) {
      toast.error(t('validation.districtRequired'));
      return;
    }

    if (!formData.state) {
      toast.error(t('validation.stateRequired'));
      return;
    }

    if (!formData.subdomain.trim()) {
      toast.error(t('validation.subdomainRequired'));
      return;
    }

    // Validate subdomain format (lowercase, alphanumeric, hyphens only)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain.toLowerCase())) {
      toast.error(t('validation.subdomainInvalid'));
      return;
    }

    if (!formData.acceptTerms) {
      toast.error(t('validation.termsRequired'));
      return;
    }

    // Validate password
    if (!formData.password || formData.password.length < 8) {
      toast.error(t('validation.passwordMinLength'));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('validation.passwordMismatch'));
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      toast.error(t('validation.passwordWeak'));
      return;
    }

    setIsSubmitting(true);
    try {
      // Clean phone number before sending
      const cleanedFormData = {
        ...formData,
        phone: phoneDigits,
        subdomain: formData.subdomain.toLowerCase().trim(),
      };
      await panchayatAPI.register(cleanedFormData);
      toast.success(t('notifications.registrationSuccess'));
      navigate("/success");
    } catch (error) {
      const message = error instanceof Error ? error.message : t('notifications.registrationError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] py-8">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-[#666] hover:text-[#1B2B5E]">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.backToHome')}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1B2B5E]">{t('registration.title')}</h2>
            <Badge variant="secondary" className="bg-[#F5F5F5] text-[#666]">
              {t('registration.stepProgress', { current: step, total: totalSteps })}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Form Content */}
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>{steps[step - 1].title}</CardTitle>
            <CardDescription>
              {step === 1 && t('registration.step1Description')}
              {step === 2 && t('registration.step2Description')}
              {step === 3 && t('registration.step3Description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sachivName">{t('registration.fullName')} *</Label>
                    <Input
                      id="sachivName"
                      placeholder={t('registration.fullNamePlaceholder')}
                      value={formData.sachivName}
                      onChange={(e) =>
                        setFormData({ ...formData, sachivName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">{t('registration.designation')} *</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={(value) =>
                        setFormData({ ...formData, designation: value })
                      }
                    >
                      <SelectTrigger id="designation">
                        <SelectValue placeholder={t('registration.designationPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sachiv">{t('registration.sachiv')}</SelectItem>
                        <SelectItem value="sarpanch">{t('registration.sarpanch')}</SelectItem>
                        <SelectItem value="upsarpanch">{t('registration.upSarpanch')}</SelectItem>
                        <SelectItem value="ward-member">{t('registration.wardMember')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('registration.email')} *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t('registration.emailPlaceholder')}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t('registration.phone')} *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t('registration.phonePlaceholder')}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">{t('registration.password')} *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder={t('registration.passwordPlaceholder')}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      {t('registration.passwordHint')}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('registration.confirmPassword')} *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder={t('registration.confirmPasswordPlaceholder')}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Panchayat Details */}
            {step === 2 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="panchayatName">{t('registration.panchayatName')} *</Label>
                    <Input
                      id="panchayatName"
                      placeholder={t('registration.panchayatNamePlaceholder')}
                      value={formData.panchayatName}
                      onChange={(e) =>
                        setFormData({ ...formData, panchayatName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">{t('registration.state')} *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder={t('registration.statePlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UP">{t('registration.uttarPradesh')}</SelectItem>
                        <SelectItem value="MH">{t('registration.maharashtra')}</SelectItem>
                        <SelectItem value="RJ">{t('registration.rajasthan')}</SelectItem>
                        <SelectItem value="GJ">{t('registration.gujarat')}</SelectItem>
                        <SelectItem value="BR">{t('registration.bihar')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="district">{t('registration.district')} *</Label>
                    <Input
                      id="district"
                      placeholder={t('registration.districtPlaceholder')}
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block">{t('registration.block')} *</Label>
                    <Input
                      id="block"
                      placeholder={t('registration.blockPlaceholder')}
                      value={formData.block}
                      onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subdomain">{t('registration.subdomain')} *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      placeholder={t('registration.subdomainPlaceholder')}
                      value={formData.subdomain}
                      onChange={(e) =>
                        setFormData({ ...formData, subdomain: e.target.value })
                      }
                    />
                    <span className="whitespace-nowrap text-muted-foreground">
                      .egramseva.gov.in
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t('registration.subdomainHint', { subdomain: formData.subdomain || t('registration.subdomainPlaceholder') })}
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-4 sm:space-y-6">
                <div className="rounded-lg border bg-muted/50 p-4 sm:p-6">
                  <h4 className="mb-4">{t('registration.personalInfo')}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('common.name')}</p>
                      <p>{formData.sachivName || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.designation')}</p>
                      <p>{formData.designation || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.email')}</p>
                      <p>{formData.email || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.phone')}</p>
                      <p>{formData.phone || t('registration.notProvided')}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 sm:p-6">
                  <h4 className="mb-4">{t('registration.panchayatInfo')}</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.panchayatName')}</p>
                      <p>{formData.panchayatName || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.state')}</p>
                      <p>{formData.state || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.district')}</p>
                      <p>{formData.district || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.block')}</p>
                      <p>{formData.block || t('registration.notProvided')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t('registration.subdomain')}</p>
                      <p className="text-[#FF9933]">
                        {formData.subdomain || t('registration.subdomainPlaceholder')}.egramseva.gov.in
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, acceptTerms: checked as boolean })
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t('registration.acceptTerms')} *
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {t('registration.certifyInfo')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t('common.previous')}
              </Button>
              {step < totalSteps ? (
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  className="bg-[#FF9933] hover:bg-[#FF9933]/90 w-full sm:w-auto order-1 sm:order-2"
                >
                  {t('common.next')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.acceptTerms || isSubmitting}
                  className="bg-[#138808] hover:bg-[#138808]/90 w-full sm:w-auto order-1 sm:order-2"
                >
                  {isSubmitting ? t('registration.submitting') : t('registration.submitButton')}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
