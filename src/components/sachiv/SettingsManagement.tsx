/**
 * Settings Management Component
 * Manage panchayat website settings (hero, about, contact, logo)
 */

import { useState, useEffect } from "react";
import { Upload, Save, Mail, Phone, MapPin, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { toast } from "sonner";
import { settingsAPI } from "../../services/api";
import type { PanchayatSettings } from "../../types";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ImageModal } from "../ui/image-modal";
import { LocationIQAutocomplete } from "./LocationIQ";
import { ThemeSelector } from "./ThemeSelector";

interface SettingsManagementProps {
  panchayatId: string;
}

export function SettingsManagement({ panchayatId }: SettingsManagementProps) {
  const [settings, setSettings] = useState<PanchayatSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  useEffect(() => {
    fetchSettings();
  }, [panchayatId]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await settingsAPI.get();
      setSettings(data);
    } catch (error) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHero = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.updateHero(settings.hero);
      setSettings(updated);
      toast.success("Hero section updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update hero section");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAbout = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.updateAbout(settings.about);
      setSettings(updated);
      toast.success("About section updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update about section");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContact = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.updateContact(settings.contact);
      setSettings(updated);
      toast.success("Contact information updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update contact information");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBasicInfo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      // TODO: Implement API call for basic info update
      // For now, we'll use a generic update method
      // console.log(settings.basicInfo);
      const updated = await settingsAPI.updateBasicInfo(settings.basicInfo);
      setSettings(updated);
      toast.success("Basic information updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update basic information");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.uploadLogo(file);
      setSettings(updated);
      toast.success("Logo uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload logo");
    } finally {
      setSaving(false);
    }
  };

  const handleHeroImageUpload = async (file: File) => {
    if (!file) return;
    setSaving(true);
    try {
      const updated = await settingsAPI.uploadHeroImage(file);
      setSettings(updated);
      toast.success("Hero image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload hero image");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveHeroImage = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updatedHero = {
        ...settings.hero,
        image: undefined,
      };
      const updated = await settingsAPI.updateHero(updatedHero);
      setSettings(updated);
      toast.success("Hero image removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove hero image");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF9933] mx-auto"></div>
          <p className="mt-4 text-[#666]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-[#1B2B5E]">
          Website Settings
        </h2>
        <p className="text-sm sm:text-base text-[#666] mt-1">
          Customize your panchayat website appearance and content
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-auto justify-start overflow-x-auto overflow-y-hidden scrollbar-hide md:flex-wrap md:justify-start">
          <TabsTrigger
            value="basic"
            className="whitespace-nowrap text-xs sm:text-sm"
          >
            Basic Info
          </TabsTrigger>
          <TabsTrigger
            value="hero"
            className="whitespace-nowrap text-xs sm:text-sm"
          >
            Hero
          </TabsTrigger>
          <TabsTrigger
            value="about"
            className="whitespace-nowrap text-xs sm:text-sm"
          >
            About
          </TabsTrigger>
          <TabsTrigger
            value="contact"
            className="whitespace-nowrap text-xs sm:text-sm"
          >
            Contact
          </TabsTrigger>
          <TabsTrigger
            value="branding"
            className="whitespace-nowrap text-xs sm:text-sm"
          >
            Branding
          </TabsTrigger>
          <TabsTrigger
            value="theme"
            className="whitespace-nowrap text-xs sm:text-sm"
          >
            Theme
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Panchayat demographics and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="population">Population</Label>
                  <Input
                    id="population"
                    type="number"
                    value={settings.basicInfo?.population || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        basicInfo: {
                          ...settings.basicInfo,
                          population: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    placeholder="Enter population"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area">Area (km²)</Label>
                  <Input
                    id="area"
                    value={settings.basicInfo?.area || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        basicInfo: {
                          ...settings.basicInfo,
                          area: e.target.value,
                        },
                      })
                    }
                    placeholder="e.g., 12.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wards">Number of Wards</Label>
                  <Input
                    id="wards"
                    type="number"
                    value={settings.basicInfo?.wards || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        basicInfo: {
                          ...settings.basicInfo,
                          wards: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    placeholder="Enter number of wards"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="establishedYear">Established Year</Label>
                  <Input
                    id="establishedYear"
                    type="number"
                    value={settings.basicInfo?.establishedYear || ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        basicInfo: {
                          ...settings.basicInfo,
                          establishedYear: e.target.value
                            ? parseInt(e.target.value)
                            : undefined,
                        },
                      })
                    }
                    placeholder="e.g., 1995"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
              <LocationIQAutocomplete
                value={settings.basicInfo?.mapCoordinates || ""}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    basicInfo: {
                      ...settings.basicInfo,
                      mapCoordinates: value,
                    },
                  })
                }
                label={
                  <>
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Map Location
                  </>
                }
                id="basic-mapCoordinates"
                placeholder="Search for your panchayat office location..."
              />
              <Button
                type="button"
                onClick={(e) => handleSaveBasicInfo(e)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
              <CardDescription>
                Main banner section of your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="hero-title">Title</Label>
                <Input
                  id="hero-title"
                  value={settings.hero.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, title: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-subtitle">Subtitle</Label>
                <Input
                  id="hero-subtitle"
                  value={settings.hero.subtitle}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, subtitle: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hero-description">Description</Label>
                <Textarea
                  id="hero-description"
                  value={settings.hero.description}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      hero: { ...settings.hero, description: e.target.value },
                    })
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Hero Image</Label>
                <div className="flex items-center gap-4">
                  {settings.hero.image && (
                    <div className="relative">
                      <div
                        className="relative w-32 h-32 rounded-lg overflow-hidden border cursor-pointer"
                        onClick={() => {
                          setSelectedImageUrl(settings.hero.image || "");
                          setIsImageModalOpen(true);
                        }}
                      >
                        <ImageWithFallback
                          src={settings.hero.image}
                          alt="Hero"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveHeroImage();
                        }}
                        disabled={saving}
                        title="Remove hero image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleHeroImageUpload(file);
                      }}
                      className="hidden"
                      id="hero-image-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("hero-image-upload")?.click()
                      }
                      disabled={saving}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {settings.hero.image ? "Change Image" : "Upload Image"}
                    </Button>
                  </div>
                </div>
              </div>
              <Button
                type="button"
                onClick={(e) => handleSaveHero(e)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>About Section</CardTitle>
              <CardDescription>
                Information about your panchayat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="about-title">Title</Label>
                <Input
                  id="about-title"
                  value={settings.about.title}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, title: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="about-content">Content</Label>
                <Textarea
                  id="about-content"
                  value={settings.about.content}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      about: { ...settings.about, content: e.target.value },
                    })
                  }
                  rows={6}
                />
              </div>
              <div className="space-y-2">
                <Label>Features</Label>
                <div className="space-y-2">
                  {settings.about.features.map((feature, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={feature}
                        onChange={(e) => {
                          const newFeatures = [...settings.about.features];
                          newFeatures[index] = e.target.value;
                          setSettings({
                            ...settings,
                            about: { ...settings.about, features: newFeatures },
                          });
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newFeatures = settings.about.features.filter(
                            (_, i) => i !== index
                          );
                          setSettings({
                            ...settings,
                            about: { ...settings.about, features: newFeatures },
                          });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        about: {
                          ...settings.about,
                          features: [...settings.about.features, ""],
                        },
                      });
                    }}
                  >
                    Add Feature
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                onClick={(e) => handleSaveAbout(e)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Update contact details for your panchayat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact-address">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Address
                </Label>
                <Textarea
                  id="contact-address"
                  value={settings.contact.address}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, address: e.target.value },
                    })
                  }
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">
                  <Phone className="h-4 w-4 inline mr-2" />
                  Phone
                </Label>
                <Input
                  id="contact-phone"
                  value={settings.contact.phone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, phone: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.contact.email}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: { ...settings.contact, email: e.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-hours">Office Hours</Label>
                <Textarea
                  id="contact-hours"
                  value={settings.contact.officeHours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      contact: {
                        ...settings.contact,
                        officeHours: e.target.value,
                      },
                    })
                  }
                  rows={3}
                />
              </div>
              <LocationIQAutocomplete
                value={settings.contact?.mapCoordinates || ""}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    contact: {
                      ...settings.contact,
                      mapCoordinates: value,
                    },
                  })
                }
                label={
                  <>
                    <MapPin className="h-4 w-4 inline mr-2" />
                    Map Location
                  </>
                }
                id="contact-mapCoordinates"
                placeholder="Search for your panchayat office location..."
              />
              <Button
                type="button"
                onClick={(e) => handleSaveContact(e)}
                disabled={saving}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
              <CardDescription>Upload logo and brand assets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {settings.logo && (
                    <div
                      className="relative w-32 h-32 rounded-lg overflow-hidden border border-[#E5E5E5] flex items-center justify-center bg-[#F5F5F5] cursor-pointer"
                      onClick={() => {
                        setSelectedImageUrl(settings.logo || "");
                        setIsImageModalOpen(true);
                      }}
                    >
                      <ImageWithFallback
                        src={settings.logo}
                        alt="Logo"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      variant="outline"
                      onClick={() =>
                        document.getElementById("logo-upload")?.click()
                      }
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {settings.logo ? "Change Logo" : "Upload Logo"}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Website Theme</CardTitle>
              <CardDescription>
                Choose a color theme for your panchayat website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector
                currentThemeId={settings.themeId}
                onThemeChange={(themeId) => {
                  setSettings({ ...settings, themeId });
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={selectedImageUrl}
        alt="Image preview"
      />
    </div>
  );
}
