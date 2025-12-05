import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Download,
  AlertCircle,
  Loader2,
  Building2,
  Award,
  Image as ImageIcon,
  Newspaper,
  MessageCircle,
  ArrowRight,
  Clock,
  Home,
  Rss,
  UserCircle,
  Images,
  FileText,
  Contact,
  Globe,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Language } from "../../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ImageModal } from "../ui/image-modal";
import { PostCard } from "../sachiv/PostCard";
import { panchayatAPI, publicAPI } from "../../services/api";
import {
  publicNewsletterApi,
  galleryApi,
  publicPanchayatWebsiteApi,
} from "../../routes/api";
import type {
  Post,
  Scheme,
  Announcement,
  PanchayatMember,
  GalleryItem,
  PanchayatDetails,
  Album,
  PanchayatWebsiteSection,
} from "../../types";
import { formatTimeAgo } from "../../utils/format";
import { usePresignedUrlRefresh } from "../../hooks/usePresignedUrlRefresh";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { DynamicSectionRenderer } from "../main/DynamicSectionRenderer";
import {
  getThemeById,
  applyTheme,
  type WebsiteTheme,
} from "../../types/themes";

type PageType =
  | "home"
  | "feed"
  | "about"
  | "gallery"
  | "newsletter"
  | "contact";

export function PanchayatWebsite() {
  const { subdomain } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Track language to force re-render when it changes
  // useTranslation should auto-update, but this ensures navItems and other computed values update
  const currentLanguage = i18n.language;

  // Force re-render when language changes
  useEffect(() => {
    console.log("🌐 Language changed to:", currentLanguage);
    console.log("🏠 Home translation:", t("panchayatWebsite.home"));
  }, [currentLanguage, t]);

  const [activePage, setActivePage] = useState<PageType>("home");
  const [panchayat, setPanchayat] = useState<PanchayatDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<PanchayatMember[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [selectedNewsletter, setSelectedNewsletter] = useState<any | null>(
    null
  );
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumImages, setAlbumImages] = useState<GalleryItem[]>([]);
  const [loadingAlbumImages, setLoadingAlbumImages] = useState(false);
  const [sections, setSections] = useState<PanchayatWebsiteSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [theme, setTheme] = useState<WebsiteTheme | null>(null);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Image modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]);
  const [modalImageTitles, setModalImageTitles] = useState<string[]>([]);
  const [isNewsletterImageModalOpen, setIsNewsletterImageModalOpen] =
    useState(false);
  const [selectedNewsletterImageUrl, setSelectedNewsletterImageUrl] =
    useState<string>("");

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activePage]);

  // Handle scroll for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    fetchPanchayatData();
    fetchWebsiteSections();
  }, [subdomain]);

  const fetchWebsiteSections = async () => {
    if (!subdomain) return;
    try {
      setLoadingSections(true);
      const sectionsData = await publicPanchayatWebsiteApi.getSections(
        subdomain
      );
      if (sectionsData && sectionsData.length > 0) {
        setSections(sectionsData);
      } else {
        setSections([]);
      }
    } catch (error) {
      console.error("Error fetching website sections:", error);
      setSections([]);
    } finally {
      setLoadingSections(false);
    }
  };

  useEffect(() => {
    if (selectedAlbum) {
      fetchAlbumImages(selectedAlbum.id);
    } else {
      setAlbumImages([]);
    }
  }, [selectedAlbum]);

  const fetchAlbumImages = async (albumId: string) => {
    setLoadingAlbumImages(true);
    try {
      const result = await galleryApi.list(albumId);
      setAlbumImages(result.items);
    } catch (error) {
      console.error("Error fetching album images:", error);
      setAlbumImages([]);
    } finally {
      setLoadingAlbumImages(false);
    }
  };

  const parseCoordinates = (coordString: string): [number, number] => {
    if (!coordString) return [22.9734, 78.6569];
    const [latStr, lngStr] = coordString.split(",");
    const lat = Number(latStr.trim());
    const lng = Number(lngStr.trim());
    if (isNaN(lat) || isNaN(lng)) return [22.9734, 78.6569];
    return [lat, lng];
  };

  const fetchPanchayatData = async () => {
    setLoading(true);
    try {
      const subdomainToUse = subdomain || "";
      const panchayatData = await panchayatAPI.getBySubdomain(subdomainToUse);
      setPanchayat(panchayatData);

      // Apply theme if available
      if (panchayatData.themeId) {
        const selectedTheme = getThemeById(panchayatData.themeId);
        setTheme(selectedTheme);
        applyTheme(selectedTheme);
      } else {
        // Use default theme
        const defaultTheme = getThemeById("default");
        setTheme(defaultTheme);
        applyTheme(defaultTheme);
      }

      const [
        postsResult,
        schemesResult,
        announcementsResult,
        membersResult,
        galleryResult,
        newslettersResult,
        albumsResult,
      ] = await Promise.all([
        publicAPI.getPublicPosts(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicSchemes(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicAnnouncements(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicMembers(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicGallery(subdomainToUse, { page: 0, size: 50 }),
        publicNewsletterApi
          .list(subdomainToUse, { page: 0, size: 50 })
          .catch(() => ({
            items: [],
            page: 0,
            size: 0,
            totalItems: 0,
            totalPages: 0,
            isFirst: true,
            isLast: true,
          })),
        publicAPI
          .getPublicAlbum(subdomainToUse, { page: 0, size: 50 })
          .catch(() => ({
            items: [],
            page: 0,
            size: 0,
            totalItems: 0,
            totalPages: 0,
            isFirst: true,
            isLast: true,
          })),
      ]);

      // Map posts
      const mappedPosts = postsResult.content
        .filter((post: any) => post.bodyText)
        .map((post: any) => ({
          id: post.postId.toString(),
          panchayatId: post.panchayatId?.toString(),
          author: post.authorName || "Panchayat Sachiv",
          authorRole: post.authorRole || "Sachiv",
          timestamp:
            post.publishedAt || post.createdAt || new Date().toISOString(),
          content: post.bodyText || "",
          media: post.mediaUrl
            ? [{ type: "image" as const, url: post.mediaUrl }]
            : [],
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          shares: post.viewCount || 0,
        }));

      // Map schemes
      const mappedSchemes = schemesResult.content
        .filter((scheme: any) => scheme.title)
        .map((scheme: any) => {
          let progress = 0;
          if (scheme.status === "ACTIVE") progress = 50;
          else if (scheme.status === "ONGOING") progress = 75;
          else if (scheme.status === "COMPLETED") progress = 100;

          let status: "Active" | "Completed" | "Pending" = t(
            "panchayatWebsite.status.pending"
          ) as any;
          if (scheme.status === "ACTIVE" || scheme.status === "ONGOING")
            status = t("panchayatWebsite.status.active") as any;
          else if (scheme.status === "COMPLETED")
            status = t("panchayatWebsite.status.completed") as any;

          const budget = scheme.budgetAmount
            ? `₹${scheme.budgetAmount.toLocaleString("en-IN")}`
            : "₹0";

          const category = scheme.description
            ? scheme.description.length > 50
              ? scheme.description.substring(0, 50) + "..."
              : scheme.description
            : t("panchayatWebsite.common.general");

          return {
            id: scheme.schemeId.toString(),
            panchayatId: scheme.panchayatId?.toString(),
            name: scheme.title || t("panchayatWebsite.common.untitledScheme"),
            category: category,
            budget: budget,
            beneficiaries: scheme.beneficiaryCount || 0,
            progress: progress,
            status: status,
          };
        });

      // Map announcements
      const mappedAnnouncements = announcementsResult.content.map(
        (announcement: any) => ({
          id: announcement.announcementId.toString(),
          panchayatId: announcement.panchayatId?.toString(),
          title: announcement.title || t("panchayatWebsite.announcements"),
          description:
            announcement.bodyText ||
            announcement.title ||
            t("panchayatWebsite.common.noDescriptionAvailable"),
          date: announcement.createdAt
            ? new Date(announcement.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : new Date().toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              }),
          status: (announcement.isActive
            ? t("panchayatWebsite.status.published")
            : t("panchayatWebsite.status.draft")) as "Published" | "Draft",
          views: 0,
        })
      );

      // Map members
      const mappedMembers = membersResult.content
        .filter((member: any) => member.status === "ACTIVE")
        .map((member: any) => {
          const roleName = member.role
            ? member.role
                .replace(/_/g, " ")
                .split(" ")
                .map(
                  (word: string) =>
                    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                )
                .join(" ")
            : "Member";

          return {
            id: member.userId.toString(),
            panchayatId: member.panchayatId?.toString(),
            name: member.name || t("panchayatWebsite.common.unknown"),
            role: roleName,
            ward:
              t("panchayatWebsite.common.ward") +
              " " +
              ((member.userId % 8) + 1),
            phone: member.phone || t("panchayatWebsite.common.notAvailable"),
            email: member.email || undefined,
            image: member.imageUrl || undefined,
            imageKey: member.imageKey || undefined,
            hasImage: member.hasImage || false,
            initials:
              member.initials ||
              (member.name
                ? member.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)
                : ""),
            designation: member.designation || undefined,
          };
        });

      // Map gallery
      const mappedGallery = galleryResult.content
        .filter((image: any) => image.imageUrl)
        .map((image: any) => ({
          id: image.imageId.toString(),
          panchayatId: image.panchayatId?.toString(),
          title: image.caption || "Gallery Image",
          image: image.imageUrl,
          description: image.caption || undefined,
          category: image.albumName || undefined,
          date: image.createdAt
            ? new Date(image.createdAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : undefined,
        }));

      setPosts(mappedPosts);
      setSchemes(mappedSchemes);
      setAnnouncements(mappedAnnouncements);
      setMembers(mappedMembers);
      setGallery(mappedGallery);
      setNewsletters(newslettersResult.items || []);
      setAlbums(
        (albumsResult as any).items || (albumsResult as any).content || []
      );
    } catch (error) {
      console.error("Error fetching panchayat data:", error);
      setPanchayat({
        id: "panchayat-1",
        name: subdomain
          ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1)
          : "Ramnagar",
        district: "Varanasi",
        state: "Uttar Pradesh",
        block: "",
        population: 0,
        aboutText: "",
        area: "0",
        wards: 0,
        subdomain: subdomain || "ramnagar",
        established: new Date().getFullYear(),
        description: "",
        contactInfo: {
          address: "",
          phone: "",
          email: "",
          officeHours: "",
        },
      });
      setPosts([]);
      setSchemes([]);
      setAnnouncements([]);
      setMembers([]);
      setGallery([]);
    } finally {
      setLoading(false);
    }
  };

  const validateContactForm = () => {
    const errors: Record<string, string> = {};
    if (!contactForm.name.trim())
      errors.name = t("panchayatWebsite.nameRequired");
    if (!contactForm.email.trim()) {
      errors.email = t("panchayatWebsite.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      errors.email = t("panchayatWebsite.emailInvalid");
    }
    if (!contactForm.subject.trim())
      errors.subject = t("panchayatWebsite.subjectRequired");
    if (!contactForm.message.trim()) {
      errors.message = t("panchayatWebsite.messageRequired");
    } else if (contactForm.message.trim().length < 10) {
      errors.message = t("panchayatWebsite.messageMinLength");
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateContactForm()) {
      setFormSubmitted(true);
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  // Render dynamic sections with data injection
  const renderDynamicSections = () => {
    if (sections.length === 0) return null;

    return sections.map((section) => {
      let sectionContent = section.content;

      if (section.sectionType === "STATS" && panchayat) {
        sectionContent = {
          ...sectionContent,
          items: [
            {
              title: t("panchayatWebsite.statsLabels.population"),
              value:
                panchayat.population?.toLocaleString() ||
                t("panchayatWebsite.common.na"),
              icon: "users",
            },
            {
              title: t("panchayatWebsite.statsLabels.area"),
              value: `${panchayat.area || t("panchayatWebsite.common.na")} km²`,
              icon: "map",
            },
            {
              title: t("panchayatWebsite.statsLabels.wards"),
              value:
                panchayat.wards?.toString() || t("panchayatWebsite.common.na"),
              icon: "building",
            },
            {
              title: t("panchayatWebsite.statsLabels.established"),
              value:
                panchayat.established?.toString() ||
                t("panchayatWebsite.common.na"),
              icon: "calendar",
            },
          ],
        };
      } else if (
        section.sectionType === "ANNOUNCEMENTS" &&
        announcements.length > 0
      ) {
        sectionContent = {
          ...sectionContent,
          items: announcements
            .slice(0, section.metadata?.limit || 5)
            .map((a) => ({
              title: a.title,
              description: a.description,
              date: a.date,
            })),
        };
      } else if (section.sectionType === "SCHEMES" && schemes.length > 0) {
        sectionContent = {
          ...sectionContent,
          items: schemes.slice(0, section.metadata?.limit || 6).map((s) => ({
            title: s.name,
            description: s.category,
            progress: s.progress,
            status: s.status,
          })),
        };
      } else if (section.sectionType === "GALLERY" && gallery.length > 0) {
        sectionContent = {
          ...sectionContent,
          items: gallery.slice(0, section.metadata?.limit || 12).map((g) => ({
            title: g.title,
            image: g.image,
            description: g.description,
          })),
        };
      } else if (section.sectionType === "MEMBERS" && members.length > 0) {
        sectionContent = {
          ...sectionContent,
          items: members.map((m) => ({
            title: m.name,
            subtitle: m.role,
            description: m.designation,
            image: m.image,
          })),
        };
      } else if (section.sectionType === "CONTACT" && panchayat) {
        sectionContent = {
          ...sectionContent,
          items: [
            ...(sectionContent.items || []),
            ...(panchayat.contactInfo?.address
              ? [
                  {
                    title: t("panchayatWebsite.contactLabels.address"),
                    description: panchayat.contactInfo.address,
                    icon: "map-pin",
                  },
                ]
              : []),
            ...(panchayat.contactInfo?.phone
              ? [
                  {
                    title: t("panchayatWebsite.contactLabels.phone"),
                    description: panchayat.contactInfo.phone,
                    icon: "phone",
                  },
                ]
              : []),
            ...(panchayat.contactInfo?.email
              ? [
                  {
                    title: t("panchayatWebsite.contactLabels.email"),
                    description: panchayat.contactInfo.email,
                    icon: "mail",
                  },
                ]
              : []),
          ],
        };
      }

      return (
        <DynamicSectionRenderer
          key={section.id}
          section={{ ...section, content: sectionContent }}
        />
      );
    });
  };

  // Navigation items - useMemo ensures they update when language changes
  const navItems = useMemo(
    () => [
      { id: "home" as PageType, label: t("panchayatWebsite.home"), icon: Home },
      { id: "feed" as PageType, label: t("panchayatWebsite.feed"), icon: Rss },
      {
        id: "about" as PageType,
        label: t("panchayatWebsite.about"),
        icon: UserCircle,
      },
      {
        id: "gallery" as PageType,
        label: t("panchayatWebsite.gallery"),
        icon: Images,
      },
      {
        id: "newsletter" as PageType,
        label: t("panchayatWebsite.newsletters"),
        icon: FileText,
      },
      {
        id: "contact" as PageType,
        label: t("panchayatWebsite.contact"),
        icon: Contact,
      },
    ],
    [currentLanguage, t]
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 
              className="h-12 w-12 animate-spin" 
              style={{ color: theme?.colors.primary || "#E31E24" }}
            />
            <div className="text-center">
              <p 
                className="text-lg font-semibold"
                style={{ color: theme?.colors.text || "#1B2B5E" }}
              >
                {t("panchayatWebsite.loadingPanchayatInfo")}
              </p>
              <p 
                className="mt-1 text-sm"
                style={{ color: theme?.colors.textSecondary || "#666" }}
              >
                {t("panchayatWebsite.pleaseWait")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Navbar */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white shadow-lg" : "bg-white/95 backdrop-blur-sm"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navbar - Centered */}
          <div className="hidden lg:flex items-center justify-between h-20">
            {/* Logo and Name - Left */}
            <button
              onClick={() => setActivePage("home")}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0"
            >
              {panchayat?.logoUrl && (
                <ImageWithFallback
                  src={panchayat.logoUrl}
                  alt={`${panchayat.name} Logo`}
                  className="h-12 w-12 object-contain"
                />
              )}
              <div className="text-left">
                <h1 
                  className="text-xl font-bold leading-tight"
                  style={{ color: theme?.colors.text || "#1B2B5E" }}
                >
                  {panchayat?.name || t("panchayatWebsite.gramPanchayat")}
                </h1>
                <p 
                  className="text-xs"
                  style={{ color: theme?.colors.textSecondary || "#666" }}
                >
                  {panchayat?.district || ""} {t("panchayatWebsite.district")}
                </p>
              </div>
            </button>

            {/* Navigation - Centered */}
            <div className="flex items-center gap-1 justify-center flex-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => setActivePage(item.id)}
                    style={{
                      color: activePage === item.id 
                        ? theme?.colors.primary || "#E31E24"
                        : theme?.colors.text || "#1B2B5E",
                      backgroundColor: activePage === item.id 
                        ? `${theme?.colors.primary || "#E31E24"}1A`
                        : "transparent",
                    }}
                    className={`hover:bg-opacity-10 transition-colors ${
                      activePage === item.id ? "" : ""
                    }`}
                    onMouseEnter={(e) => {
                      if (activePage !== item.id) {
                        e.currentTarget.style.color = theme?.colors.primary || "#E31E24";
                        e.currentTarget.style.backgroundColor = `${theme?.colors.primary || "#E31E24"}1A`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activePage !== item.id) {
                        e.currentTarget.style.color = theme?.colors.text || "#1B2B5E";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="text-base">{item.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Right Actions - Main Platform Link, Language */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Main Platform Link */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                style={{
                  color: theme?.colors.text || "#1B2B5E",
                }}
                className="flex items-center gap-2 hover:bg-opacity-10 transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = theme?.colors.primary || "#E31E24";
                  e.currentTarget.style.backgroundColor = `${theme?.colors.primary || "#E31E24"}1A`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = theme?.colors.text || "#1B2B5E";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
                title={t("panchayatWebsite.goToMainPlatform")}
              >
                <ExternalLink className="h-4 w-4" />
                <span className="text-sm">
                  {t("panchayatWebsite.mainPlatform")}
                </span>
              </Button>

              {/* Language Selector */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Globe 
                      className="h-5 w-5" 
                      style={{ color: theme?.colors.text || "#1B2B5E" }}
                    />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("en");
                    }}
                  >
                    {t("panchayatWebsite.languages.english")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("mr");
                    }}
                  >
                    {t("panchayatWebsite.languages.marathi")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("hi");
                    }}
                  >
                    {t("panchayatWebsite.languages.hindi")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      i18n.changeLanguage("regional");
                    }}
                  >
                    {t("panchayatWebsite.languages.regional")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Mobile Navbar - New Design */}
          <div className="lg:hidden">
            {/* Top Row - Logo, Language, Platform Link */}
            <div className="flex items-center justify-between h-16 border-b border-[#E5E5E5]">
              {/* Logo and Name */}
              <button
                onClick={() => setActivePage("home")}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-1 min-w-0"
              >
                {panchayat?.logoUrl && (
                  <ImageWithFallback
                    src={panchayat.logoUrl}
                    alt={`${panchayat.name} Logo`}
                    className="h-10 w-10 object-contain flex-shrink-0"
                  />
                )}
                <div className="text-left min-w-0">
                  <h1 
                    className="text-base font-bold leading-tight truncate"
                    style={{ color: theme?.colors.text || "#1B2B5E" }}
                  >
                    {panchayat?.name || t("panchayatWebsite.gramPanchayat")}
                  </h1>
                  <p 
                    className="text-xs truncate"
                    style={{ color: theme?.colors.textSecondary || "#666" }}
                  >
                    {panchayat?.district || ""} {t("panchayatWebsite.district")}
                  </p>
                </div>
              </button>

              {/* Right Actions - Platform Link and Language */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/")}
                  className="h-9 w-9"
                  title={t("panchayatWebsite.goToMainPlatform")}
                >
                  <ExternalLink 
                    className="h-4 w-4" 
                    style={{ color: theme?.colors.text || "#1B2B5E" }}
                  />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9">
                      <Globe 
                      className="h-5 w-5" 
                      style={{ color: theme?.colors.text || "#1B2B5E" }}
                    />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        i18n.changeLanguage("en");
                      }}
                    >
                      {t("panchayatWebsite.languages.english")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        i18n.changeLanguage("mr");
                      }}
                    >
                      {t("panchayatWebsite.languages.marathi")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        i18n.changeLanguage("hi");
                      }}
                    >
                      {t("panchayatWebsite.languages.hindi")}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        i18n.changeLanguage("regional");
                      }}
                    >
                      {t("panchayatWebsite.languages.regional")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Bottom Row - Navigation Items */}
            <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide px-2 py-2 bg-[#F9F9F9]">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    onClick={() => setActivePage(item.id)}
                    className={`flex-1 min-w-0 flex flex-col items-center gap-1 h-auto py-2 px-2 rounded-lg transition-all ${
                      activePage === item.id
                        ? "text-[#E31E24] bg-[#E31E24]/10"
                        : "text-[#1B2B5E] hover:text-[#E31E24] hover:bg-[#E31E24]/5"
                    }`}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-[10px] font-medium leading-tight text-center">
                      {item.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className="h-[88px] lg:h-20" />

      {/* Page Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {/* Home Page */}
        {activePage === "home" && (
          <div className="space-y-0">
            {/* Hero Section - Enhanced with Theme Support */}
            <section className="relative min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] overflow-hidden">
              {panchayat?.heroImage ? (
                <>
                  {/* Hero Image Background */}
                  <div className="absolute inset-0">
                    <ImageWithFallback
                      src={panchayat.heroImage}
                      alt={`${panchayat.name} Hero`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Black Overlay */}
                  <div className="absolute inset-0 bg-black/50" />
                </>
              ) : (
                <>
                  {/* Gradient Background Fallback */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        theme?.hero.backgroundGradient ||
                        "linear-gradient(to bottom right, #1B2B5E, #2A3F6F, #6C5CE7)",
                    }}
                  >
                    {panchayat?.logoUrl && (
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-[url('/pattern.svg')] bg-repeat opacity-20"></div>
                      </div>
                    )}
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundColor: theme?.hero.overlay || "rgba(0, 0, 0, 0.2)",
                    }}
                  />
                </>
              )}

              <div className="container relative mx-auto px-4 py-12 sm:py-16 lg:py-20 lg:px-8 lg:py-32">
                <div className="mx-auto max-w-4xl text-center">
                  {panchayat?.logoUrl && (
                    <div className="mb-4 sm:mb-6 lg:mb-8 flex justify-center">
                      <div className="rounded-full bg-white/20 p-2 sm:p-3 lg:p-4 backdrop-blur-sm">
                        <ImageWithFallback
                          src={panchayat.logoUrl}
                          alt={`${panchayat.name} Logo`}
                          className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 xl:h-24 xl:w-24 object-contain"
                        />
                      </div>
                    </div>
                  )}
                  <h1
                    className="mb-3 sm:mb-4 lg:mb-6 text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight px-2 drop-shadow-lg"
                    style={{ color: theme?.hero.textColor || "#FFFFFF" }}
                  >
                    {panchayat?.name || t("panchayatWebsite.gramPanchayat")}
                  </h1>
                  <p
                    className="mb-2 sm:mb-3 lg:mb-4 text-base sm:text-lg md:text-xl lg:text-2xl px-2 drop-shadow-md"
                    style={{
                      color: theme?.hero.textColor
                        ? `${theme.hero.textColor}E6`
                        : "rgba(255, 255, 255, 0.9)",
                    }}
                  >
                    {panchayat?.district || ""} {t("panchayatWebsite.district")}
                    , {panchayat?.state || ""}
                  </p>
                  <p
                    className="mb-4 sm:mb-6 lg:mb-8 text-sm sm:text-base lg:text-lg max-w-2xl mx-auto px-4 drop-shadow-sm"
                    style={{
                      color: theme?.hero.textColor
                        ? `${theme.hero.textColor}CC`
                        : "rgba(255, 255, 255, 0.8)",
                    }}
                  >
                    {panchayat?.aboutText ||
                      panchayat?.description ||
                      t("panchayatWebsite.defaultDescription")}
                  </p>

                  {/* Quick Stats - Enhanced Design */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mt-8 sm:mt-10 lg:mt-16 max-w-4xl mx-auto px-2">
                    <div
                      className="bg-white/15 backdrop-blur-md rounded-xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: theme?.hero.textColor
                          ? `${theme.hero.textColor}4D`
                          : "rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 mx-auto mb-2 sm:mb-3 text-white drop-shadow-md" />
                      <p
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 drop-shadow-lg"
                        style={{ color: theme?.hero.textColor || "#FFFFFF" }}
                      >
                        {panchayat?.population?.toLocaleString() ||
                          t("panchayatWebsite.common.na")}
                      </p>
                      <p
                        className="text-[10px] sm:text-xs lg:text-sm font-medium"
                        style={{
                          color: theme?.hero.textColor
                            ? `${theme.hero.textColor}CC`
                            : "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {t("panchayatWebsite.population")}
                      </p>
                    </div>
                    <div
                      className="bg-white/15 backdrop-blur-md rounded-xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: theme?.hero.textColor
                          ? `${theme.hero.textColor}4D`
                          : "rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <MapPin className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 mx-auto mb-2 sm:mb-3 text-white drop-shadow-md" />
                      <p
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 drop-shadow-lg"
                        style={{ color: theme?.hero.textColor || "#FFFFFF" }}
                      >
                        {panchayat?.area || t("panchayatWebsite.common.na")}
                      </p>
                      <p
                        className="text-[10px] sm:text-xs lg:text-sm font-medium"
                        style={{
                          color: theme?.hero.textColor
                            ? `${theme.hero.textColor}CC`
                            : "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {t("panchayatWebsite.area")}
                      </p>
                    </div>
                    <div
                      className="bg-white/15 backdrop-blur-md rounded-xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: theme?.hero.textColor
                          ? `${theme.hero.textColor}4D`
                          : "rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <Building2 className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 mx-auto mb-2 sm:mb-3 text-white drop-shadow-md" />
                      <p
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 drop-shadow-lg"
                        style={{ color: theme?.hero.textColor || "#FFFFFF" }}
                      >
                        {panchayat?.wards || t("panchayatWebsite.common.na")}
                      </p>
                      <p
                        className="text-[10px] sm:text-xs lg:text-sm font-medium"
                        style={{
                          color: theme?.hero.textColor
                            ? `${theme.hero.textColor}CC`
                            : "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {t("panchayatWebsite.wards")}
                      </p>
                    </div>
                    <div
                      className="bg-white/15 backdrop-blur-md rounded-xl p-3 sm:p-4 lg:p-5 border border-white/30 shadow-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
                      style={{
                        borderColor: theme?.hero.textColor
                          ? `${theme.hero.textColor}4D`
                          : "rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <Calendar className="h-6 w-6 sm:h-7 sm:w-7 lg:h-9 lg:w-9 mx-auto mb-2 sm:mb-3 text-white drop-shadow-md" />
                      <p
                        className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-1 drop-shadow-lg"
                        style={{ color: theme?.hero.textColor || "#FFFFFF" }}
                      >
                        {panchayat?.established ||
                          t("panchayatWebsite.common.na")}
                      </p>
                      <p
                        className="text-[10px] sm:text-xs lg:text-sm font-medium"
                        style={{
                          color: theme?.hero.textColor
                            ? `${theme.hero.textColor}CC`
                            : "rgba(255, 255, 255, 0.8)",
                        }}
                      >
                        {t("panchayatWebsite.established")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Dynamic Sections from Admin */}
            {loadingSections ? (
              <div className="py-16 text-center">
                <Loader2 
                  className="h-8 w-8 animate-spin mx-auto" 
                  style={{ color: theme?.colors.primary || "#E31E24" }}
                />
                <p className="mt-2 text-[#666]">
                  {t("panchayatWebsite.loadingSections")}
                </p>
              </div>
            ) : (
              <div className="bg-white">{renderDynamicSections()}</div>
            )}
          </div>
        )}

        {/* Feed Page */}
        {activePage === "feed" && (
          <div className="pt-10 pb-4 sm:pt-8 sm:pb-6 lg:pt-16 lg:pb-12 bg-[#F5F5F5] min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto">
                <div className="mb-6 sm:mb-8">
                  <h2 
                    className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 scroll-mt-24"
                    style={{ color: theme?.colors.text || "#1B2B5E" }}
                  >
                    {t("panchayatWebsite.communityFeed")}
                  </h2>
                  <div 
                    className="w-16 sm:w-24 h-1"
                    style={{ backgroundColor: theme?.colors.primary || "#E31E24" }}
                  ></div>
                </div>

                {/* Feed Layout - Main feed first on mobile, sidebar on desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                  {/* Main Feed - Order 1 on mobile, order 2 on desktop */}
                  <div className="lg:col-span-2 lg:order-2 space-y-4 sm:space-y-6">
                    {loading ? (
                      <div className="text-center py-8 sm:py-12">
                        <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin mx-auto text-[#E31E24]" />
                        <p className="mt-2 text-sm sm:text-base text-[#666]">
                          {t("panchayatWebsite.loadingPosts")}
                        </p>
                      </div>
                    ) : posts.length === 0 ? (
                      <Card className="border-[#E5E5E5]">
                        <CardContent className="p-8 sm:p-12 text-center">
                          <Rss className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-4 text-[#666] opacity-50" />
                          <p className="text-sm sm:text-base text-[#666]">
                            {t("panchayatWebsite.noPostsYet")}
                          </p>
                          <p className="text-xs sm:text-sm text-[#999] mt-2">
                            {t("panchayatWebsite.checkBackLater")}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      posts.map((post) => (
                        <PostCard
                          key={post.id}
                          post={{
                            ...post,
                            timestamp: formatTimeAgo(new Date(post.timestamp)),
                          }}
                        />
                      ))
                    )}
                  </div>

                  {/* Sidebar - Order 2 on mobile, order 1 on desktop */}
                  <aside className="lg:col-span-1 lg:order-1 space-y-4 sm:space-y-6">
                    <Card className="border-[#E5E5E5]">
                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                          {t("panchayatWebsite.latestAnnouncements")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                        {announcements.length === 0 ? (
                          <p className="text-xs sm:text-sm text-[#666] text-center py-4">
                            {t("panchayatWebsite.noAnnouncements")}
                          </p>
                        ) : (
                          announcements.slice(0, 5).map((announcement) => (
                            <Card
                              key={announcement.id}
                              className="border-l-4 border-l-[#FF9933]"
                            >
                              <CardContent className="p-2.5 sm:p-3">
                                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#FF9933] flex-shrink-0" />
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {announcement.date}
                                  </Badge>
                                </div>
                                <h4 className="text-xs sm:text-sm font-semibold mb-1 line-clamp-2">
                                  {announcement.title}
                                </h4>
                                <p className="text-[10px] sm:text-xs text-[#666] line-clamp-2">
                                  {announcement.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-[#E5E5E5]">
                      <CardHeader className="p-4 sm:p-6">
                        <CardTitle className="text-base sm:text-lg">
                          {t("panchayatWebsite.activeSchemes")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                        {schemes.length === 0 ? (
                          <p className="text-xs sm:text-sm text-[#666] text-center py-4">
                            {t("panchayatWebsite.noActiveSchemes")}
                          </p>
                        ) : (
                          schemes.slice(0, 3).map((scheme) => (
                            <Card key={scheme.id} className="border-[#E5E5E5]">
                              <CardContent className="p-2.5 sm:p-3">
                                <div className="flex items-center justify-between mb-1.5 sm:mb-2 flex-wrap gap-1">
                                  <Badge className="bg-[#138808] text-white text-[10px] sm:text-xs">
                                    {scheme.category}
                                  </Badge>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {scheme.status}
                                  </Badge>
                                </div>
                                <h4 className="text-xs sm:text-sm font-semibold mb-1.5 sm:mb-2 line-clamp-2">
                                  {scheme.name}
                                </h4>
                                <div className="mb-1.5 sm:mb-2">
                                  <div className="mb-1 flex justify-between text-[10px] sm:text-xs">
                                    <span className="text-[#666]">
                                      {t("panchayatWebsite.progress")}
                                    </span>
                                    <span>{scheme.progress}%</span>
                                  </div>
                                  <Progress
                                    value={scheme.progress}
                                    className="h-1"
                                  />
                                </div>
                                <p className="text-[10px] sm:text-xs text-[#666]">
                                  {scheme.beneficiaries}{" "}
                                  {t("panchayatWebsite.beneficiaries")}
                                </p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </CardContent>
                    </Card>
                  </aside>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* About Page */}
        {activePage === "about" && (
          <div className="pt-12 pb-8 lg:pt-20 lg:pb-16 bg-white min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl lg:text-4xl font-bold mb-4 scroll-mt-24"
                  style={{ color: theme?.colors.text || "#1B2B5E" }}
                >
                  {t("panchayatWebsite.about")}{" "}
                  <span style={{ color: theme?.colors.primary || "#E31E24" }}>
                    {panchayat?.name || t("panchayatWebsite.ourPanchayat")}
                  </span>
                </h2>
                <div 
                  className="w-24 h-1 mx-auto"
                  style={{ backgroundColor: theme?.colors.primary || "#E31E24" }}
                ></div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-start">
                {/* About Text */}
                <div>
                  <h3 
                    className="text-2xl font-semibold mb-6 scroll-mt-24"
                    style={{ color: theme?.colors.text || "#1B2B5E" }}
                  >
                    {t("panchayatWebsite.ourStory")}
                  </h3>
                  {panchayat?.aboutText ? (
                    <div className="prose prose-lg max-w-none text-[#666] whitespace-pre-line">
                      {panchayat.aboutText}
                    </div>
                  ) : (
                    <div className="space-y-4 text-[#666]">
                      <p>
                        {panchayat?.name || t("panchayatWebsite.gramPanchayat")}{" "}
                        {t("panchayatWebsite.aboutText.vibrantCommunity")}{" "}
                        {panchayat?.district || ""}
                        {t("panchayatWebsite.district")},{" "}
                        {panchayat?.state || ""}.{" "}
                        {t("panchayatWebsite.aboutText.establishedIn")}{" "}
                        {panchayat?.established || ""},{" "}
                        {t("panchayatWebsite.aboutText.richHistory")}
                      </p>
                      <p>
                        {t("panchayatWebsite.aboutText.withPopulation")}{" "}
                        {panchayat?.population?.toLocaleString() || ""}{" "}
                        {t("panchayatWebsite.aboutText.spreadAcross")}{" "}
                        {panchayat?.wards || ""} {t("panchayatWebsite.wards")},{" "}
                        {t("panchayatWebsite.aboutText.committedTo")}
                      </p>
                      {panchayat?.features && panchayat.features.length > 0 && (
                        <div>
                          <h4 
                            className="text-lg font-semibold mb-3"
                            style={{ color: theme?.colors.text || "#1B2B5E" }}
                          >
                            {t("panchayatWebsite.keyFeatures")}
                          </h4>
                          <ul className="space-y-2">
                            {panchayat.features.map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2"
                              >
                                <Award className="h-5 w-5 text-[#FF9933] mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Panchayat Details */}
                  <div className="mt-8 grid grid-cols-2 gap-4">
                    <Card className="border-[#E5E5E5]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-[#FF9933]/10 rounded-lg">
                            <Users className="h-5 w-5 text-[#FF9933]" />
                          </div>
                          <div>
                            <p className="text-sm text-[#666]">
                              {t("panchayatWebsite.population")}
                            </p>
                            <p 
                              className="text-xl font-bold"
                              style={{ color: theme?.colors.text || "#1B2B5E" }}
                            >
                              {panchayat?.population?.toLocaleString() ||
                                t("panchayatWebsite.common.na")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-[#E5E5E5]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-[#138808]/10 rounded-lg">
                            <MapPin className="h-5 w-5 text-[#138808]" />
                          </div>
                          <div>
                            <p className="text-sm text-[#666]">
                              {t("panchayatWebsite.area")}
                            </p>
                            <p 
                              className="text-xl font-bold"
                              style={{ color: theme?.colors.text || "#1B2B5E" }}
                            >
                              {panchayat?.area ||
                                t("panchayatWebsite.common.na")}{" "}
                              km²
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-[#E5E5E5]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div 
                            className="p-2 rounded-lg"
                            style={{ 
                              backgroundColor: `${theme?.colors.primary || "#E31E24"}1A`,
                            }}
                          >
                            <Building2 
                              className="h-5 w-5" 
                              style={{ color: theme?.colors.primary || "#E31E24" }}
                            />
                          </div>
                          <div>
                            <p className="text-sm text-[#666]">
                              {t("panchayatWebsite.wards")}
                            </p>
                            <p 
                              className="text-xl font-bold"
                              style={{ color: theme?.colors.text || "#1B2B5E" }}
                            >
                              {panchayat?.wards ||
                                t("panchayatWebsite.common.na")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-[#E5E5E5]">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="p-2 bg-[#6C5CE7]/10 rounded-lg">
                            <Calendar className="h-5 w-5 text-[#6C5CE7]" />
                          </div>
                          <div>
                            <p className="text-sm text-[#666]">
                              {t("panchayatWebsite.established")}
                            </p>
                            <p 
                              className="text-xl font-bold"
                              style={{ color: theme?.colors.text || "#1B2B5E" }}
                            >
                              {panchayat?.established ||
                                t("panchayatWebsite.common.na")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Members Section */}
                <div>
                  <h3 
                    className="text-2xl font-semibold mb-6 scroll-mt-24"
                    style={{ color: theme?.colors.text || "#1B2B5E" }}
                  >
                    {t("panchayatWebsite.electedMembers")}
                  </h3>
                  {loading ? (
                    <div className="text-center py-12">
                      <Loader2 
                  className="h-8 w-8 animate-spin mx-auto" 
                  style={{ color: theme?.colors.primary || "#E31E24" }}
                />
                      <p className="mt-2 text-[#666]">
                        {t("panchayatWebsite.loadingMembers")}
                      </p>
                    </div>
                  ) : members.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Users className="h-12 w-12 mx-auto mb-4 text-[#666] opacity-50" />
                        <p className="text-[#666]">
                          {t("panchayatWebsite.noMembersAvailable")}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {members.map((member) => (
                        <Card
                          key={member.id}
                          className="border-[#E5E5E5] hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-14 w-14">
                                {member.hasImage && member.image ? (
                                  <TeamMemberImageWithRefresh
                                    src={member.image}
                                    alt={member.name}
                                  />
                                ) : (
                                  <AvatarFallback className="bg-[#FF9933]/10 text-[#FF9933] text-lg">
                                    {member.initials ||
                                      member.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()
                                        .substring(0, 2)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <h4 
                                  className="font-semibold truncate"
                                  style={{ color: theme?.colors.text || "#1B2B5E" }}
                                >
                                  {member.name}
                                </h4>
                                <p className="text-sm text-[#FF9933] font-medium">
                                  {member.role}
                                </p>
                                {member.designation && (
                                  <p className="text-xs text-[#666] mt-1">
                                    {member.designation}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-2 text-xs text-[#666]">
                                  <span className="flex items-center gap-1">
                                    <Building2 className="h-3 w-3" />
                                    {member.ward}
                                  </span>
                                  {member.phone && (
                                    <span className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {member.phone}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gallery Page */}
        {activePage === "gallery" && (
          <div className="pt-12 pb-8 lg:pt-20 lg:pb-16 bg-white min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl lg:text-4xl font-bold mb-4 scroll-mt-24"
                  style={{ color: theme?.colors.text || "#1B2B5E" }}
                >
                  {t("panchayatWebsite.photoGallery")}{" "}
                  <span style={{ color: theme?.colors.primary || "#E31E24" }}>
                    {t("panchayatWebsite.gallery")}
                  </span>
                </h2>
                <div 
                  className="w-24 h-1 mx-auto mb-4"
                  style={{ backgroundColor: theme?.colors.primary || "#E31E24" }}
                ></div>
                <p className="text-[#666] max-w-2xl mx-auto">
                  {t("panchayatWebsite.galleryDescription")}
                </p>
              </div>

              {selectedAlbum ? (
                <div>
                  <div className="mb-6 flex items-center gap-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSelectedAlbum(null);
                        setAlbumImages([]);
                      }}
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      {t("panchayatWebsite.backToAlbums")}
                    </Button>
                    <div>
                      <h3 
                        className="text-2xl font-bold scroll-mt-24"
                        style={{ color: theme?.colors.text || "#1B2B5E" }}
                      >
                        {selectedAlbum.title}
                      </h3>
                      {selectedAlbum.description && (
                        <p className="text-[#666] mt-1">
                          {selectedAlbum.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {loadingAlbumImages ? (
                    <div className="text-center py-12">
                      <Loader2 
                  className="h-8 w-8 animate-spin mx-auto" 
                  style={{ color: theme?.colors.primary || "#E31E24" }}
                />
                      <p className="mt-2 text-[#666]">
                        {t("panchayatWebsite.loadingImages")}
                      </p>
                    </div>
                  ) : albumImages.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[#666] opacity-50" />
                        <p className="text-[#666]">
                          {t("panchayatWebsite.noImagesInAlbum")}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {albumImages.map((item, index) => (
                        <Card
                          key={item.id}
                          className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 hover:border-[#E31E24]/50"
                          onClick={() => {
                            const imageUrls = albumImages
                              .map((img) => img.image || "")
                              .filter(Boolean);
                            const titles = albumImages.map(
                              (img) => img.title || "Image"
                            );
                            setModalImages(imageUrls);
                            setModalImageTitles(titles);
                            setSelectedImageIndex(index);
                            setIsImageModalOpen(true);
                          }}
                        >
                          <div className="relative aspect-square overflow-hidden bg-muted">
                            <AlbumImageWithRefresh
                              src={item.image}
                              alt={item.title}
                              entityType="gallery"
                              entityId={item.id}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                              <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                                View
                              </span>
                            </div>
                            {item.title && (
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-medium line-clamp-1">
                                  {item.title}
                                </p>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Albums */}
                  {albums.length > 0 && (
                    <div className="mb-12">
                      <h3 
                        className="text-xl font-semibold mb-6 scroll-mt-24"
                        style={{ color: theme?.colors.text || "#1B2B5E" }}
                      >
                        {t("panchayatWebsite.albums")}
                      </h3>
                      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {albums.map((album) => (
                          <Card
                            key={album.id}
                            className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 hover:border-[#E31E24]/50"
                            onClick={() => setSelectedAlbum(album)}
                          >
                            <div className="relative aspect-video overflow-hidden bg-muted">
                              {album.coverImage ? (
                                <AlbumImageWithRefresh
                                  src={album.coverImage}
                                  alt={album.title}
                                  entityType="album"
                                  entityId={album.id}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FF9933]/20 to-[#138808]/20">
                                  <ImageIcon className="h-12 w-12 text-[#666] opacity-50" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <Badge className="opacity-0 group-hover:opacity-100 bg-white/90 text-[#1B2B5E]">
                                  {t("panchayatWebsite.viewAlbum")}
                                </Badge>
                              </div>
                            </div>
                            <CardContent className="p-4">
                              <h4 
                                className="font-semibold mb-1 line-clamp-1"
                                style={{ color: theme?.colors.text || "#1B2B5E" }}
                              >
                                {album.title}
                              </h4>
                              {album.description && (
                                <p className="text-sm text-[#666] line-clamp-2 mb-2">
                                  {album.description}
                                </p>
                              )}
                              <div className="flex items-center justify-between text-xs text-[#999]">
                                <span>
                                  {album.imageCount || 0}{" "}
                                  {album.imageCount === 1
                                    ? t("panchayatWebsite.image")
                                    : t("panchayatWebsite.images")}
                                </span>
                                {album.createdAt &&
                                  !isNaN(
                                    new Date(album.createdAt).getTime()
                                  ) && (
                                    <span>
                                      {new Date(
                                        album.createdAt
                                      ).toLocaleDateString("en-IN", {
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Images Grid */}
                  {gallery.length > 0 && (
                    <div>
                      <h3 
                        className="text-xl font-semibold mb-6 scroll-mt-24"
                        style={{ color: theme?.colors.text || "#1B2B5E" }}
                      >
                        {t("panchayatWebsite.allPhotos")}
                      </h3>
                      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {gallery.map((item, index) => (
                          <Card
                            key={item.id}
                            className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 hover:border-[#E31E24]/50"
                            onClick={() => {
                              const imageUrls = gallery
                                .map((img) => img.image || "")
                                .filter(Boolean);
                              const titles = gallery.map(
                                (img) => img.title || "Image"
                              );
                              setModalImages(imageUrls);
                              setModalImageTitles(titles);
                              setSelectedImageIndex(index);
                              setIsImageModalOpen(true);
                            }}
                          >
                            <div className="relative aspect-square overflow-hidden bg-muted">
                              <AlbumImageWithRefresh
                                src={item.image}
                                alt={item.title}
                                entityType="gallery"
                                entityId={item.id}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                                  {t("panchayatWebsite.view")}
                                </span>
                              </div>
                              {item.title && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <p className="text-white text-xs font-medium line-clamp-1">
                                    {item.title}
                                  </p>
                                  {item.date && (
                                    <p className="text-white/80 text-xs mt-1">
                                      {item.date}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {albums.length === 0 && gallery.length === 0 && !loading && (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-[#666] opacity-50" />
                        <p className="text-[#666]">
                          {t("panchayatWebsite.noGalleryItems")}
                        </p>
                        <p className="text-sm text-[#999] mt-2">
                          {t("panchayatWebsite.checkBackLater")}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Newsletter Page */}
        {activePage === "newsletter" && (
          <div className="pt-12 pb-8 lg:pt-20 lg:pb-16 bg-gradient-to-br from-[#F5F5F5] to-white min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl lg:text-4xl font-bold mb-4 scroll-mt-24"
                  style={{ color: theme?.colors.text || "#1B2B5E" }}
                >
                  {t("panchayatWebsite.newsletters")} &{" "}
                  <span style={{ color: theme?.colors.primary || "#E31E24" }}>
                    {t("panchayatWebsite.updates")}
                  </span>
                </h2>
                <div 
                  className="w-24 h-1 mx-auto mb-4"
                  style={{ backgroundColor: theme?.colors.primary || "#E31E24" }}
                ></div>
                <p className="text-[#666] max-w-2xl mx-auto">
                  {t("panchayatWebsite.newsletterDescription")}
                </p>
              </div>

              {selectedNewsletter ? (
                <NewsletterDetailView
                  newsletter={selectedNewsletter}
                  theme={theme}
                  onBack={() => setSelectedNewsletter(null)}
                  onImageClick={(imageUrl) => {
                    setSelectedNewsletterImageUrl(imageUrl);
                    setIsNewsletterImageModalOpen(true);
                  }}
                />
              ) : (
                <>
                  {loading ? (
                    <div className="text-center py-12">
                      <Loader2 
                  className="h-8 w-8 animate-spin mx-auto" 
                  style={{ color: theme?.colors.primary || "#E31E24" }}
                />
                      <p className="mt-2 text-[#666]">
                        {t("panchayatWebsite.loadingNewsletters")}
                      </p>
                    </div>
                  ) : newsletters.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Newspaper className="h-12 w-12 mx-auto mb-4 text-[#666] opacity-50" />
                        <p className="text-[#666]">
                          {t("panchayatWebsite.noNewslettersAvailable")}
                        </p>
                        <p className="text-sm text-[#999] mt-2">
                          {t("panchayatWebsite.checkBackLater")}
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {newsletters.map((newsletter) => (
                        <Card
                          key={newsletter.id}
                          className="overflow-hidden transition-all hover:shadow-xl hover:scale-[1.02] cursor-pointer border-2 border-[#E5E5E5] hover:border-[#1B2B5E] bg-white group"
                          onClick={() => setSelectedNewsletter(newsletter)}
                        >
                          {newsletter.coverImageUrl && (
                            <div
                              className="h-56 w-full overflow-hidden relative group/cover"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNewsletterImageUrl(
                                  newsletter.coverImageUrl || ""
                                );
                                setIsNewsletterImageModalOpen(true);
                              }}
                            >
                              <NewsletterCoverImage
                                fileKey={newsletter.coverImageFileKey}
                                url={newsletter.coverImageUrl}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 group-hover/cover:opacity-100 transition-opacity" />
                              <div className="absolute top-3 right-3 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                                <Badge className="bg-white/90 text-[#1B2B5E] border-0 shadow-md">
                                  <ImageIcon className="h-3 w-3 mr-1" />
                                  View Image
                                </Badge>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover/cover:opacity-100 transition-opacity">
                                <p className="text-white text-xs font-medium">
                                  {t("panchayatWebsite.clickToView")}
                                </p>
                              </div>
                            </div>
                          )}
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <Badge 
                                variant="secondary" 
                                className="text-xs font-medium bg-[#F5F5F5] text-[#666] border border-[#E5E5E5]"
                              >
                                <Calendar className="h-3 w-3 mr-1" />
                                {newsletter.publishedOn
                                  ? new Date(
                                      newsletter.publishedOn
                                    ).toLocaleDateString("en-IN", {
                                      month: "short",
                                      year: "numeric",
                                    })
                                  : t("panchayatWebsite.status.draft")}
                              </Badge>
                            </div>
                            <h3 
                              className="font-bold text-xl mb-2 line-clamp-2 transition-colors"
                              style={{ 
                                color: theme?.colors.text || "#1B2B5E",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = theme?.colors.primary || "#E31E24";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = theme?.colors.text || "#1B2B5E";
                              }}
                            >
                              {newsletter.title}
                            </h3>
                            {newsletter.subtitle && (
                              <p className="text-sm text-[#666] mb-4 line-clamp-2 leading-relaxed">
                                {newsletter.subtitle}
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
                              {newsletter.authorName && (
                                <div className="flex items-center gap-2 text-xs text-[#666]">
                                  <UserCircle className="h-3.5 w-3.5" />
                                  <span>
                                    {t("panchayatWebsite.by")}{" "}
                                    <span 
                                      className="font-medium"
                                      style={{ color: theme?.colors.text || "#1B2B5E" }}
                                    >
                                      {newsletter.authorName}
                                    </span>
                                  </span>
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                style={{
                                  color: theme?.colors.text || "#1B2B5E",
                                }}
                                className="font-medium transition-colors"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = theme?.colors.primary || "#E31E24";
                                  e.currentTarget.style.backgroundColor = `${theme?.colors.primary || "#E31E24"}1A`;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color = theme?.colors.text || "#1B2B5E";
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNewsletter(newsletter);
                                }}
                              >
                                {t("panchayatWebsite.readMore")}{" "}
                                <ArrowRight className="ml-1 h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Contact Page */}
        {activePage === "contact" && (
          <div className="pt-12 pb-8 lg:pt-20 lg:pb-16 bg-gradient-to-br from-[#F5F5F5] to-white min-h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 lg:px-8">
              <div className="text-center mb-12">
                <h2 
                  className="text-3xl lg:text-4xl font-bold mb-4 scroll-mt-24"
                  style={{ color: theme?.colors.text || "#1B2B5E" }}
                >
                  {t("panchayatWebsite.getInTouch")}{" "}
                  <span style={{ color: theme?.colors.primary || "#E31E24" }}>
                    {t("panchayatWebsite.touch")}
                  </span>
                </h2>
                <div 
                  className="w-24 h-1 mx-auto mb-4"
                  style={{ backgroundColor: theme?.colors.primary || "#E31E24" }}
                ></div>
                <p className="text-[#666] max-w-2xl mx-auto">
                  {t("panchayatWebsite.contactDescription")}
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12">
                {/* Contact Information */}
                <div className="space-y-6">
                  <Card className="border-[#E5E5E5]">
                    <CardContent className="p-6">
                      <h3 
                        className="text-xl font-semibold mb-6 scroll-mt-24"
                        style={{ color: theme?.colors.text || "#1B2B5E" }}
                      >
                        {t("panchayatWebsite.contactInformation")}
                      </h3>
                      <div className="space-y-6">
                        {panchayat?.contactInfo?.address && (
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#FF9933]/10 rounded-lg">
                              <MapPin className="h-6 w-6 text-[#FF9933]" />
                            </div>
                            <div>
                              <h4 
                                className="font-semibold mb-1"
                                style={{ color: theme?.colors.text || "#1B2B5E" }}
                              >
                                {t("panchayatWebsite.address")}
                              </h4>
                              <p className="text-[#666] whitespace-pre-line">
                                {panchayat.contactInfo.address}
                              </p>
                            </div>
                          </div>
                        )}
                        {panchayat?.contactInfo?.phone && (
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#138808]/10 rounded-lg">
                              <Phone className="h-6 w-6 text-[#138808]" />
                            </div>
                            <div>
                              <h4 
                                className="font-semibold mb-1"
                                style={{ color: theme?.colors.text || "#1B2B5E" }}
                              >
                                {t("panchayatWebsite.phone")}
                              </h4>
                              <a
                                href={`tel:${panchayat.contactInfo.phone}`}
                                style={{ color: theme?.colors.primary || "#E31E24" }}
                                className="hover:underline"
                              >
                                {panchayat.contactInfo.phone}
                              </a>
                            </div>
                          </div>
                        )}
                        {panchayat?.contactInfo?.email && (
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#E31E24]/10 rounded-lg">
                              <Mail className="h-6 w-6 text-[#E31E24]" />
                            </div>
                            <div>
                              <h4 
                                className="font-semibold mb-1"
                                style={{ color: theme?.colors.text || "#1B2B5E" }}
                              >
                                {t("panchayatWebsite.email")}
                              </h4>
                              <a
                                href={`mailto:${panchayat.contactInfo.email}`}
                                style={{ color: theme?.colors.primary || "#E31E24" }}
                                className="hover:underline break-all"
                              >
                                {panchayat.contactInfo.email}
                              </a>
                            </div>
                          </div>
                        )}
                        {panchayat?.contactInfo?.officeHours && (
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-[#6C5CE7]/10 rounded-lg">
                              <Clock className="h-6 w-6 text-[#6C5CE7]" />
                            </div>
                            <div>
                              <h4 
                                className="font-semibold mb-1"
                                style={{ color: theme?.colors.text || "#1B2B5E" }}
                              >
                                {t("panchayatWebsite.officeHours")}
                              </h4>
                              <p className="text-[#666] whitespace-pre-line">
                                {panchayat.contactInfo.officeHours}
                              </p>
                            </div>
                          </div>
                        )}
                        {(!panchayat?.contactInfo ||
                          (!panchayat.contactInfo.address &&
                            !panchayat.contactInfo.phone &&
                            !panchayat.contactInfo.email)) && (
                          <div className="text-center py-8 text-[#666]">
                            <p>
                              {t("panchayatWebsite.contactInfoWillBeUpdated")}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Map */}
                  {panchayat?.mapCoordinates && (
                    <Card className="border-[#E5E5E5] overflow-hidden">
                      <CardContent className="p-0">
                        <div className="h-64 lg:h-80 w-full">
                          <MapContainer
                            center={
                              parseCoordinates(
                                panchayat.mapCoordinates || ""
                              ) as LatLngExpression
                            }
                            zoom={15}
                            style={{ height: "100%", width: "100%" }}
                            scrollWheelZoom={false}
                          >
                            <TileLayer
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            />
                            <Marker
                              position={parseCoordinates(
                                panchayat.mapCoordinates || ""
                              )}
                            >
                              <Popup>
                                <strong>{panchayat?.name}</strong>
                                <br />
                                {t("panchayatWebsite.gramPanchayatOffice")}
                              </Popup>
                            </Marker>
                          </MapContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Contact Form */}
                <Card className="border-[#E5E5E5]">
                  <CardContent className="p-6">
                    <h3 
                      className="text-xl font-semibold mb-6 scroll-mt-24"
                      style={{ color: theme?.colors.text || "#1B2B5E" }}
                    >
                      {t("panchayatWebsite.sendUsMessage")}
                    </h3>
                    {formSubmitted && (
                      <div className="mb-6 rounded-lg bg-[#138808]/10 border border-[#138808] p-4 text-sm text-[#138808]">
                        {t("panchayatWebsite.messageSentSuccess")}
                      </div>
                    )}
                    <form
                      onSubmit={handleContactSubmit}
                      noValidate
                      className="space-y-4"
                    >
                      <div>
                        <Label 
                          htmlFor="name"
                          style={{ color: theme?.colors.text || "#1B2B5E" }}
                        >
                          {t("panchayatWebsite.name")}{" "}
                          <span style={{ color: theme?.colors.primary || "#E31E24" }}>*</span>
                        </Label>
                        <Input
                          id="name"
                          placeholder={t("panchayatWebsite.namePlaceholder")}
                          className={`mt-1 ${
                            formErrors.name ? "border-[#E31E24]" : ""
                          }`}
                          value={contactForm.name}
                          onChange={(e) => {
                            setContactForm({
                              ...contactForm,
                              name: e.target.value,
                            });
                            if (formErrors.name)
                              setFormErrors({ ...formErrors, name: "" });
                          }}
                        />
                        {formErrors.name && (
                          <p 
                            className="text-xs mt-1"
                            style={{ color: theme?.colors.error || theme?.colors.primary || "#E31E24" }}
                          >
                            {formErrors.name}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label 
                          htmlFor="email"
                          style={{ color: theme?.colors.text || "#1B2B5E" }}
                        >
                          {t("panchayatWebsite.email")}{" "}
                          <span style={{ color: theme?.colors.primary || "#E31E24" }}>*</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder={t("panchayatWebsite.emailPlaceholder")}
                          className={`mt-1 ${
                            formErrors.email ? "border-[#E31E24]" : ""
                          }`}
                          value={contactForm.email}
                          onChange={(e) => {
                            setContactForm({
                              ...contactForm,
                              email: e.target.value,
                            });
                            if (formErrors.email)
                              setFormErrors({ ...formErrors, email: "" });
                          }}
                        />
                        {formErrors.email && (
                          <p 
                            className="text-xs mt-1"
                            style={{ color: theme?.colors.error || theme?.colors.primary || "#E31E24" }}
                          >
                            {formErrors.email}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label 
                          htmlFor="subject"
                          style={{ color: theme?.colors.text || "#1B2B5E" }}
                        >
                          {t("panchayatWebsite.subject")}{" "}
                          <span style={{ color: theme?.colors.primary || "#E31E24" }}>*</span>
                        </Label>
                        <Input
                          id="subject"
                          placeholder={t("panchayatWebsite.subjectPlaceholder")}
                          className={`mt-1 ${
                            formErrors.subject ? "border-[#E31E24]" : ""
                          }`}
                          value={contactForm.subject}
                          onChange={(e) => {
                            setContactForm({
                              ...contactForm,
                              subject: e.target.value,
                            });
                            if (formErrors.subject)
                              setFormErrors({ ...formErrors, subject: "" });
                          }}
                        />
                        {formErrors.subject && (
                          <p 
                            className="text-xs mt-1"
                            style={{ color: theme?.colors.error || theme?.colors.primary || "#E31E24" }}
                          >
                            {formErrors.subject}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label 
                          htmlFor="message"
                          style={{ color: theme?.colors.text || "#1B2B5E" }}
                        >
                          {t("panchayatWebsite.message")}{" "}
                          <span style={{ color: theme?.colors.primary || "#E31E24" }}>*</span>
                        </Label>
                        <Textarea
                          id="message"
                          placeholder={t("panchayatWebsite.messagePlaceholder")}
                          rows={5}
                          className={`mt-1 ${
                            formErrors.message ? "border-[#E31E24]" : ""
                          }`}
                          value={contactForm.message}
                          onChange={(e) => {
                            setContactForm({
                              ...contactForm,
                              message: e.target.value,
                            });
                            if (formErrors.message)
                              setFormErrors({ ...formErrors, message: "" });
                          }}
                        />
                        {formErrors.message && (
                          <p 
                            className="text-xs mt-1"
                            style={{ color: theme?.colors.error || theme?.colors.primary || "#E31E24" }}
                          >
                            {formErrors.message}
                          </p>
                        )}
                      </div>
                      <Button
                        type="submit"
                        className="w-full text-white"
                        style={{
                          backgroundColor: theme?.colors.primary || "#E31E24",
                        }}
                        onMouseEnter={(e) => {
                          // Darken the color on hover
                          const color = theme?.colors.primary || "#E31E24";
                          e.currentTarget.style.backgroundColor = color === "#E31E24" ? "#C91A20" : color;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = theme?.colors.primary || "#E31E24";
                        }}
                      >
                        {t("panchayatWebsite.sendMessage")}
                        <MessageCircle className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#1B2B5E] text-white py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold mb-4">
                {panchayat?.name || t("panchayatWebsite.gramPanchayat")}
              </h3>
              <p className="text-white/80 text-sm">
                {panchayat?.district || ""} {t("panchayatWebsite.district")},{" "}
                {panchayat?.state || ""}
              </p>
              {panchayat?.contactInfo?.address && (
                <p className="text-white/80 text-sm mt-2">
                  {panchayat.contactInfo.address}
                </p>
              )}
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {t("panchayatWebsite.quickLinks")}
              </h4>
              <div className="space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className="block text-white/80 hover:text-white text-sm transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">
                {t("panchayatWebsite.contact")}
              </h4>
              <div className="space-y-2 text-sm text-white/80">
                {panchayat?.contactInfo?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a
                      href={`tel:${panchayat.contactInfo.phone}`}
                      className="hover:text-white transition-colors"
                    >
                      {panchayat.contactInfo.phone}
                    </a>
                  </div>
                )}
                {panchayat?.contactInfo?.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a
                      href={`mailto:${panchayat.contactInfo.email}`}
                      className="hover:text-white transition-colors break-all"
                    >
                      {panchayat.contactInfo.email}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 pt-8 text-center text-sm text-white/60">
            <p>
              © {new Date().getFullYear()}{" "}
              {panchayat?.name || t("panchayatWebsite.gramPanchayat")}.{" "}
              {t("panchayatWebsite.allRightsReserved")}
            </p>
          </div>
        </div>
      </footer>

      {/* Image Modals */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => {
          setIsImageModalOpen(false);
          setModalImages([]);
          setModalImageTitles([]);
        }}
        imageUrl={modalImages[selectedImageIndex] || ""}
        alt={modalImageTitles[selectedImageIndex] || "Gallery image"}
        images={modalImages.length > 0 ? modalImages : undefined}
        currentIndex={selectedImageIndex}
        onIndexChange={(newIndex) => {
          if (newIndex >= 0 && newIndex < modalImages.length) {
            setSelectedImageIndex(newIndex);
          }
        }}
      />

      <ImageModal
        isOpen={isNewsletterImageModalOpen}
        onClose={() => setIsNewsletterImageModalOpen(false)}
        imageUrl={selectedNewsletterImageUrl}
        alt="Newsletter cover"
      />
    </div>
  );
}

// Helper component for team member image with presigned URL refresh
function TeamMemberImageWithRefresh({
  src,
  alt,
}: {
  src?: string;
  alt: string;
}) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: src || undefined,
    initialPresignedUrl: src || undefined,
  });

  if (!presignedUrl) {
    return null;
  }

  return <AvatarImage src={presignedUrl} alt={alt} />;
}

// Helper component for newsletter cover image with presigned URL refresh
function NewsletterCoverImage({
  fileKey,
  url,
}: {
  fileKey?: string;
  url?: string;
}) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: fileKey || undefined,
    initialPresignedUrl: url || undefined,
  });

  if (!presignedUrl) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={presignedUrl}
      alt="Newsletter cover"
      className="w-full h-full object-cover"
    />
  );
}

// Helper component for album images with presigned URL refresh
function AlbumImageWithRefresh({
  src,
  alt,
  entityType,
  entityId,
}: {
  src?: string;
  alt: string;
  entityType?: string | null;
  entityId?: string | number | null;
}) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: src || undefined,
    initialPresignedUrl: src || undefined,
    entityType,
    entityId,
  });

  if (!presignedUrl) {
    return (
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={presignedUrl}
      alt={alt}
      className="h-full w-full object-cover"
      entityType={entityType}
      entityId={entityId}
    />
  );
}

// Newsletter Detail View Component
function NewsletterDetailView({
  newsletter,
  theme,
  onBack,
  onImageClick,
}: {
  newsletter: any;
  theme: WebsiteTheme | null;
  onBack: () => void;
  onImageClick: (imageUrl: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <article className="max-w-5xl mx-auto space-y-8">
      <Button 
        variant="ghost" 
        onClick={onBack} 
        className="mb-2 text-[#1B2B5E] hover:text-[#E31E24] hover:bg-[#E31E24]/10"
      >
        <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
        {t("panchayatWebsite.backToNewsletters")}
      </Button>

      {newsletter.coverImageUrl && (
        <div
          className="w-full h-80 sm:h-[500px] rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.01] shadow-xl border-2 border-[#E5E5E5] group relative"
          onClick={() => onImageClick(newsletter.coverImageUrl || "")}
        >
          <NewsletterCoverImage
            fileKey={newsletter.coverImageFileKey}
            url={newsletter.coverImageUrl}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
            <Badge className="opacity-0 group-hover:opacity-100 bg-white/90 text-[#1B2B5E] border-0 shadow-lg transition-opacity">
              <ImageIcon className="h-4 w-4 mr-2" />
              Click to view full image
            </Badge>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-8 sm:p-12">
        <div className="space-y-6">
          <div className="border-b border-[#E5E5E5] pb-6">
            <div className="flex items-center gap-3 mb-4">
              <Badge className="bg-[#1B2B5E] text-white border-0">
                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                {newsletter.publishedOn
                  ? new Date(newsletter.publishedOn).toLocaleDateString("en-IN", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : t("panchayatWebsite.status.draft")}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1B2B5E] mb-4 leading-tight">
              {newsletter.title}
            </h1>
            {newsletter.subtitle && (
              <p className="text-xl sm:text-2xl text-[#666] mb-6 leading-relaxed">
                {newsletter.subtitle}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#666]">
              {newsletter.authorName && (
                <div className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4" />
                  <span>
                    {t("panchayatWebsite.by")}{" "}
                    <span className="font-semibold text-[#1B2B5E]">{newsletter.authorName}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {newsletter.content && (
            <div className="prose prose-lg sm:prose-xl max-w-none prose-headings:text-[#1B2B5E] prose-p:text-[#333] prose-p:leading-relaxed prose-a:text-[#E31E24] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#1B2B5E] prose-img:rounded-lg prose-img:shadow-md">
              <div dangerouslySetInnerHTML={{ __html: newsletter.content }} />
            </div>
          )}

          {newsletter.bulletPoints && newsletter.bulletPoints.length > 0 && (
            <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
              <h2 
                className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
                style={{ color: theme?.colors.text || "#1B2B5E" }}
              >
                <Award 
                  className="h-6 w-6" 
                  style={{ color: theme?.colors.primary || "#E31E24" }}
                />
                {t("panchayatWebsite.keyPoints")}
              </h2>
              <div className="grid gap-4 sm:grid-cols-1">
                {newsletter.bulletPoints.map((point: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-[#F9FAFB] rounded-lg border border-[#E5E5E5] hover:border-[#1B2B5E] transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1B2B5E] text-white text-sm font-bold flex items-center justify-center mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-base text-[#333] leading-relaxed pt-1">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {newsletter.attachments && newsletter.attachments.length > 0 && (
            <div className="mt-8 pt-8 border-t border-[#E5E5E5]">
              <h2 
                className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3"
                style={{ color: theme?.colors.text || "#1B2B5E" }}
              >
                <Download 
                  className="h-6 w-6" 
                  style={{ color: theme?.colors.primary || "#E31E24" }}
                />
                {t("panchayatWebsite.attachments")}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {newsletter.attachments.map(
                  (attachment: string, index: number) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      asChild
                      className="justify-start h-auto p-4 border-2 border-[#E5E5E5] hover:border-[#1B2B5E] hover:bg-[#1B2B5E] hover:text-white transition-all"
                    >
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3"
                      >
                        <div className="p-2 bg-[#F5F5F5] rounded-lg">
                          <Download className="h-5 w-5 text-[#1B2B5E]" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">
                            {t("panchayatWebsite.downloadAttachment")} {index + 1}
                          </p>
                          <p className="text-xs text-[#666]">Click to download</p>
                        </div>
                      </a>
                    </Button>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
