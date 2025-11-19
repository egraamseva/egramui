import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Upload, FileText, User, MapPin } from "lucide-react";
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

// Debug: Log panchayatAPI to verify register method exists
console.log('panchayatAPI:', panchayatAPI);
console.log('panchayatAPI.register:', panchayatAPI.register);

export function RegistrationFlow() {
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

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const steps = [
    { number: 1, title: "Personal Details", icon: User },
    { number: 2, title: "Panchayat Details", icon: MapPin },
    { number: 3, title: "Document Upload", icon: FileText },
    { number: 4, title: "Review & Submit", icon: Check },
  ];

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.sachivName.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!formData.designation) {
      toast.error("Please select your designation");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    // Validate phone number (should be 10 digits)
    const phoneDigits = formData.phone?.replace(/\D/g, '') || '';
    if (!phoneDigits || phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (!formData.panchayatName.trim()) {
      toast.error("Please enter panchayat name");
      return;
    }

    if (!formData.district.trim()) {
      toast.error("Please enter district");
      return;
    }

    if (!formData.state) {
      toast.error("Please select state");
      return;
    }

    if (!formData.subdomain.trim()) {
      toast.error("Please enter subdomain");
      return;
    }

    // Validate subdomain format (lowercase, alphanumeric, hyphens only)
    const subdomainRegex = /^[a-z0-9-]+$/;
    if (!subdomainRegex.test(formData.subdomain.toLowerCase())) {
      toast.error("Subdomain can only contain lowercase letters, numbers, and hyphens");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    // Validate password
    if (!formData.password || formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(formData.password)) {
      toast.error("Password must contain uppercase, lowercase, number, and special character");
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
      toast.success("Registration submitted successfully!");
      navigate("/success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed";
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
            Back to Home
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-[#1B2B5E]">Panchayat Registration</h2>
            <Badge variant="secondary" className="bg-[#F5F5F5] text-[#666]">
              Step {step} of {totalSteps}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {steps.map((s) => (
            <div
              key={s.number}
              className={`flex items-center gap-3 rounded-lg border p-4 ${
                s.number === step
                  ? "border-[#FF9933] bg-[#FF9933]/5"
                  : s.number < step
                  ? "border-[#138808] bg-[#138808]/5"
                  : "border-border bg-white"
              }`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
                  s.number === step
                    ? "bg-[#FF9933] text-white"
                    : s.number < step
                    ? "bg-[#138808] text-white"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {s.number < step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <div className="hidden lg:block">
                <p className="text-sm text-muted-foreground">Step {s.number}</p>
                <p style={{ fontSize: "0.875rem" }}>{s.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form Content */}
        <Card className="mx-auto max-w-3xl">
          <CardHeader>
            <CardTitle>{steps[step - 1].title}</CardTitle>
            <CardDescription>
              {step === 1 && "Please provide your personal information as Panchayat Sachiv"}
              {step === 2 && "Enter details about your Gram Panchayat"}
              {step === 3 && "Upload required documents for verification"}
              {step === 4 && "Review your information before submitting"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sachivName">Full Name *</Label>
                    <Input
                      id="sachivName"
                      placeholder="Enter your full name"
                      value={formData.sachivName}
                      onChange={(e) =>
                        setFormData({ ...formData, sachivName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Select
                      value={formData.designation}
                      onValueChange={(value) =>
                        setFormData({ ...formData, designation: value })
                      }
                    >
                      <SelectTrigger id="designation">
                        <SelectValue placeholder="Select designation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sachiv">Panchayat Sachiv</SelectItem>
                        <SelectItem value="sarpanch">Sarpanch</SelectItem>
                        <SelectItem value="upsarpanch">Up-Sarpanch</SelectItem>
                        <SelectItem value="ward-member">Ward Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="sachiv@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Mobile Number *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <p className="text-xs text-gray-500">
                      Must be 8+ characters with uppercase, lowercase, number & special character
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Panchayat Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="panchayatName">Gram Panchayat Name *</Label>
                    <Input
                      id="panchayatName"
                      placeholder="Enter panchayat name"
                      value={formData.panchayatName}
                      onChange={(e) =>
                        setFormData({ ...formData, panchayatName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select
                      value={formData.state}
                      onValueChange={(value) => setFormData({ ...formData, state: value })}
                    >
                      <SelectTrigger id="state">
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UP">Uttar Pradesh</SelectItem>
                        <SelectItem value="MH">Maharashtra</SelectItem>
                        <SelectItem value="RJ">Rajasthan</SelectItem>
                        <SelectItem value="GJ">Gujarat</SelectItem>
                        <SelectItem value="BR">Bihar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      placeholder="Enter district"
                      value={formData.district}
                      onChange={(e) =>
                        setFormData({ ...formData, district: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="block">Block/Tehsil *</Label>
                    <Input
                      id="block"
                      placeholder="Enter block/tehsil"
                      value={formData.block}
                      onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="population">Population</Label>
                    <Input
                      id="population"
                      type="number"
                      placeholder="5000"
                      value={formData.population}
                      onChange={(e) =>
                        setFormData({ ...formData, population: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (sq km)</Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder="25"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wards">Number of Wards</Label>
                    <Input
                      id="wards"
                      type="number"
                      placeholder="10"
                      value={formData.wards}
                      onChange={(e) => setFormData({ ...formData, wards: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdomain">Choose Your Subdomain *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="subdomain"
                      placeholder="yourpanchayat"
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
                    Your panchayat will be accessible at: {formData.subdomain || "yourpanchayat"}
                    .egramseva.gov.in
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Document Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idProof">Identity Proof (Aadhar/PAN) *</Label>
                  <div className="flex items-center gap-4">
                    <Input id="idProof" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    PDF, JPG or PNG. Max size: 2MB
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointmentLetter">Appointment Letter *</Label>
                  <div className="flex items-center gap-4">
                    <Input id="appointmentLetter" type="file" accept=".pdf" />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">PDF format. Max size: 5MB</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="panchayatCertificate">Panchayat Registration Certificate *</Label>
                  <div className="flex items-center gap-4">
                    <Input id="panchayatCertificate" type="file" accept=".pdf" />
                    <Upload className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">PDF format. Max size: 5MB</p>
                </div>
                <div className="rounded-lg border border-[#FF9933] bg-[#FF9933]/5 p-4">
                  <h4 className="mb-2 text-[#FF9933]">Document Guidelines</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• All documents must be clear and readable</li>
                    <li>• Documents should be certified/attested by appropriate authority</li>
                    <li>• Verification process may take 2-3 business days</li>
                    <li>• You will receive email notification once verified</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="rounded-lg border bg-muted/50 p-6">
                  <h4 className="mb-4">Personal Information</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p>{formData.sachivName || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Designation</p>
                      <p>{formData.designation || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p>{formData.email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p>{formData.phone || "Not provided"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-6">
                  <h4 className="mb-4">Panchayat Information</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Panchayat Name</p>
                      <p>{formData.panchayatName || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">State</p>
                      <p>{formData.state || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">District</p>
                      <p>{formData.district || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Block</p>
                      <p>{formData.block || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Subdomain</p>
                      <p className="text-[#FF9933]">
                        {formData.subdomain || "yourpanchayat"}.egramseva.gov.in
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
                      I accept the terms and conditions *
                    </label>
                    <p className="text-sm text-muted-foreground">
                      I certify that all information provided is accurate and I have the authority
                      to register this Gram Panchayat.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
              {step < totalSteps ? (
                <Button onClick={handleNext} className="bg-[#FF9933] hover:bg-[#FF9933]/90">
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.acceptTerms || isSubmitting}
                  className="bg-[#138808] hover:bg-[#138808]/90"
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
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
