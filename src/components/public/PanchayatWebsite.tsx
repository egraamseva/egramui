import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Phone, Mail, MapPin, Calendar, Users, TrendingUp, Download, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { ImageModal } from "../ui/image-modal";
import { PostCard } from "../sachiv/PostCard";
import { panchayatAPI, publicAPI } from "../../services/api";
import { publicNewsletterApi, galleryApi } from "../../routes/api";
import type { Post, Scheme, Announcement, PanchayatMember, GalleryItem, PanchayatDetails, Album } from "../../types";
import { formatTimeAgo } from "../../utils/format";
import { usePresignedUrlRefresh } from "../../hooks/usePresignedUrlRefresh";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css';


export function PanchayatWebsite() {
  const { subdomain } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const [panchayat, setPanchayat] = useState<PanchayatDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<PanchayatMember[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [newsletters, setNewsletters] = useState<any[]>([]);
  const [selectedNewsletter, setSelectedNewsletter] = useState<any | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumImages, setAlbumImages] = useState<GalleryItem[]>([]);
  const [loadingAlbumImages, setLoadingAlbumImages] = useState(false);

  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [modalImages, setModalImages] = useState<string[]>([]); // Array of image URLs for modal carousel
  const [modalImageTitles, setModalImageTitles] = useState<string[]>([]); // Array of image titles for modal
  const [isNewsletterImageModalOpen, setIsNewsletterImageModalOpen] = useState(false);
  const [selectedNewsletterImageUrl, setSelectedNewsletterImageUrl] = useState<string>("");

  // Scroll to top when component mounts or subdomain changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [subdomain]);

  useEffect(() => {
    fetchPanchayatData();
  }, [subdomain]);

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
    if (!coordString) return [22.9734, 78.6569]; // Default India center
    const [latStr, lngStr] = coordString.split(',');
    const lat = Number(latStr.trim());
    const lng = Number(lngStr.trim());
    if (isNaN(lat) || isNaN(lng)) return [22.9734, 78.6569];
    return [lat, lng];
  };

  const fetchPanchayatData = async () => {
    setLoading(true);
    try {
      const subdomainToUse = subdomain || '';
      const panchayatData = await panchayatAPI.getBySubdomain(subdomainToUse);
      setPanchayat(panchayatData);

      // Fetch all data using public APIs with slug
      const [postsResult, schemesResult, announcementsResult, membersResult, galleryResult, newslettersResult, albumsResult] = await Promise.all([
        publicAPI.getPublicPosts(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicSchemes(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicAnnouncements(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicMembers(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicGallery(subdomainToUse, { page: 0, size: 50 }),
        publicNewsletterApi.list(subdomainToUse, { page: 0, size: 50 }).catch(() => ({ items: [], page: 0, size: 0, totalItems: 0, totalPages: 0, isFirst: true, isLast: true })),
        publicAPI.getPublicAlbum(subdomainToUse, { page: 0, size: 50 }).catch(() => ({ items: [], page: 0, size: 0, totalItems: 0, totalPages: 0, isFirst: true, isLast: true })),
      ]);

      // Map posts
      const mappedPosts = postsResult.content
        .filter((post: any) => post.bodyText) // Only include posts with content
        .map((post: any) => ({
          id: post.postId.toString(),
          panchayatId: post.panchayatId?.toString(),
          author: post.authorName || 'Panchayat Sachiv',
          authorRole: post.authorRole || 'Sachiv',
          timestamp: post.publishedAt || post.createdAt || new Date().toISOString(),
          content: post.bodyText || '',
          media: post.mediaUrl ? [{ type: 'image' as const, url: post.mediaUrl }] : [],
          likes: post.likesCount || 0,
          comments: post.commentsCount || 0,
          shares: post.viewCount || 0,
        }));

      // Map schemes
      const mappedSchemes = schemesResult.content
        .filter((scheme: any) => scheme.title) // Only include schemes with titles
        .map((scheme: any) => {
          // Calculate progress based on status
          let progress = 0;
          if (scheme.status === 'ACTIVE') progress = 50;
          else if (scheme.status === 'ONGOING') progress = 75;
          else if (scheme.status === 'COMPLETED') progress = 100;

          // Map status
          let status: "Active" | "Completed" | "Pending" = "Pending";
          if (scheme.status === 'ACTIVE' || scheme.status === 'ONGOING') status = "Active";
          else if (scheme.status === 'COMPLETED') status = "Completed";

          // Format budget
          const budget = scheme.budgetAmount
            ? `₹${scheme.budgetAmount.toLocaleString("en-IN")}`
            : "₹0";

          // Use description as category, truncate if too long
          const category = scheme.description
            ? scheme.description.length > 50
              ? scheme.description.substring(0, 50) + "..."
              : scheme.description
            : "General";

          return {
            id: scheme.schemeId.toString(),
            panchayatId: scheme.panchayatId?.toString(),
            name: scheme.title || 'Untitled Scheme',
            category: category,
            budget: budget,
            beneficiaries: scheme.beneficiaryCount || 0,
            progress: progress,
            status: status,
          };
        });

      // Map announcements
      const mappedAnnouncements = announcementsResult.content.map((announcement: any) => ({
        id: announcement.announcementId.toString(),
        panchayatId: announcement.panchayatId?.toString(),
        title: announcement.title || 'Announcement',
        description: announcement.bodyText || announcement.title || 'No description available',
        date: announcement.createdAt
          ? new Date(announcement.createdAt).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
          : new Date().toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
        status: (announcement.isActive ? "Published" : "Draft") as "Published" | "Draft",
        views: 0,
      }));

      // Map members (users)
      const mappedMembers = membersResult.content
        .filter((member: any) => member.status === 'ACTIVE') // Only show active members
        .map((member: any) => {
          // Format role name properly
          const roleName = member.role
            ? member.role.replace(/_/g, ' ')
              .split(' ')
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
            : 'Member';

          return {
            id: member.userId.toString(),
            panchayatId: member.panchayatId?.toString(),
            name: member.name || 'Unknown',
            role: roleName,
            ward: 'Ward ' + ((member.userId % 8) + 1), // Placeholder - backend doesn't have ward
            phone: member.phone || 'Not available',
            email: member.email || undefined,
            image: member.imageUrl || undefined,
            imageKey: member.imageKey || undefined,
            hasImage: member.hasImage || false,
            initials: member.initials || (member.name ? member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2) : ''),
            designation: member.designation || undefined,
          };
        });

      // Map gallery
      const mappedGallery = galleryResult.content
        .filter((image: any) => image.imageUrl) // Only include images with URLs
        .map((image: any) => ({
          id: image.imageId.toString(),
          panchayatId: image.panchayatId?.toString(),
          title: image.caption || 'Gallery Image',
          image: image.imageUrl,
          description: image.caption || undefined,
          category: image.albumName || undefined,
          date: image.createdAt
            ? new Date(image.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })
            : undefined,
        }));

      setPosts(mappedPosts);
      setSchemes(mappedSchemes);
      setAnnouncements(mappedAnnouncements);
      setMembers(mappedMembers);
      setGallery(mappedGallery);
      setNewsletters(newslettersResult.items || []);
      setAlbums((albumsResult as any).items || (albumsResult as any).content || []);
    } catch (error) {
      console.error("Error fetching panchayat data:", error);
      // Use default data if API fails
      setPanchayat({
        id: 'panchayat-1',
        name: subdomain ? subdomain.charAt(0).toUpperCase() + subdomain.slice(1) : 'Ramnagar',
        district: 'Varanasi',
        state: 'Uttar Pradesh',
        block: '',
        population: 0,
        aboutText: '',
        area: '0',
        wards: 0,
        subdomain: subdomain || 'ramnagar',
        established: new Date().getFullYear(),
        description: '',
        contactInfo: {
          address: '',
          phone: '',
          email: '',
          officeHours: '',
        },
      });
      // Set empty arrays for failed data
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

    if (!contactForm.name.trim()) {
      errors.name = "Name is required";
    }

    if (!contactForm.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!contactForm.subject.trim()) {
      errors.subject = "Subject is required";
    }

    if (!contactForm.message.trim()) {
      errors.message = "Message is required";
    } else if (contactForm.message.trim().length < 10) {
      errors.message = "Message must be at least 10 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateContactForm()) {
      // TODO: Implement actual form submission

      setFormSubmitted(true);
      setContactForm({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setFormSubmitted(false), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] relative">
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#E31E24]" />
            <div className="text-center">
              <p className="text-lg font-semibold text-[#1B2B5E]">Loading Panchayat Information</p>
              <p className="mt-1 text-sm text-[#666]">Please wait while we fetch the data...</p>
            </div>
          </div>
        </div>
      )}

      {/* Skip to Content Link for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-[#E31E24] focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg"
        aria-label="Skip to main content"
      >
        Skip to main content
      </a>

      {/* Clean Banner with Panchayat Name + Breadcrumb */}
      <section className="border-b border-[#E5E5E5] bg-white">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 text-sm text-[#666]" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2">
              <li>
                <Link to="/" className="hover:text-[#E31E24] transition-colors">Home</Link>
              </li>
              <li>/</li>
              <li>
                <Link to="/panchayats" className="hover:text-[#E31E24] transition-colors">Panchayats</Link>
              </li>
              <li>/</li>
              <li className="text-[#1B2B5E] font-medium">
                {panchayat?.name || ''}
              </li>
            </ol>
          </nav>

          {/* Panchayat Name and Info */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-[#1B2B5E] sm:text-4xl">
                {panchayat?.name || 'Ramnagar'} Gram Panchayat
              </h1>
              <p className="text-[#666]">
                {panchayat?.district || 'Varanasi'} District, {panchayat?.state || 'Uttar Pradesh'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://www.india.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-[#666] hover:text-[#E31E24] transition-colors"
                aria-label="Visit India.gov.in - Opens in new tab"
              >
                <span>India.gov.in</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>


      {/* Quick Stats - Mobile Responsive Grid */}
      <section
        className="border-b border-[#E5E5E5] bg-white py-6 sm:py-8"
        aria-label="Panchayat statistics"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 lg:grid-cols-4" role="list">
            <Card role="listitem" className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 sm:p-4 md:p-6">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#FF9933]/10" aria-hidden="true">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF9933]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground text-xs sm:text-sm">Population</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold" aria-label={`Population: ${panchayat?.population?.toLocaleString() || '5,200'}`}>
                    {panchayat?.population?.toLocaleString() || '5,200'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card role="listitem" className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 sm:p-4 md:p-6">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#138808]/10" aria-hidden="true">
                  <MapPin className="h-5 w-5 sm:h-6 sm:w-6 text-[#138808]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground text-xs sm:text-sm">Area</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold" aria-label={`Area: ${panchayat?.area || '12.5'} square kilometers`}>
                    {panchayat?.area || '12.5'} km²
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card role="listitem" className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 sm:p-4 md:p-6">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#FF9933]/10" aria-hidden="true">
                  <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-[#FF9933]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground text-xs sm:text-sm">Wards</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold" aria-label={`Number of wards: ${panchayat?.wards || '8'}`}>
                    {panchayat?.wards || '8'}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card role="listitem" className="transition-shadow hover:shadow-md">
              <CardContent className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 p-3 sm:p-4 md:p-6">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-lg bg-[#138808]/10" aria-hidden="true">
                  <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-[#138808]" />
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-muted-foreground text-xs sm:text-sm">Established</p>
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold" aria-label={`Established in year: ${panchayat?.established || '1995'}`}>
                    {panchayat?.established || '1995'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      {/* Sticky Navigation Bar - Outside Tabs for proper sticky behavior */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#E5E5E5] shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex sm:grid grid-cols-3 lg:grid-cols-6 w-full h-14 sm:h-16 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab("home")}
              className={`text-sm px-6 h-full rounded-t-lg transition-colors flex-shrink-0 flex items-center justify-center ${activeTab === "home"
                  ? "bg-[#E31E24] text-white font-semibold"
                  : "text-[#666] hover:text-[#1B2B5E]"
                }`}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("about")}
              className={`text-sm px-6 h-full rounded-t-lg transition-colors flex-shrink-0 flex items-center justify-center ${activeTab === "about"
                  ? "bg-[#E31E24] text-white font-semibold"
                  : "text-[#666] hover:text-[#1B2B5E]"
                }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab("schemes")}
              className={`text-sm px-6 h-full rounded-t-lg transition-colors flex-shrink-0 flex items-center justify-center ${activeTab === "schemes"
                  ? "bg-[#E31E24] text-white font-semibold"
                  : "text-[#666] hover:text-[#1B2B5E]"
                }`}
            >
              Schemes
            </button>
            <button
              onClick={() => setActiveTab("gallery")}
              className={`text-sm px-6 h-full rounded-t-lg transition-colors flex-shrink-0 flex items-center justify-center ${activeTab === "gallery"
                  ? "bg-[#E31E24] text-white font-semibold"
                  : "text-[#666] hover:text-[#1B2B5E]"
                }`}
            >
              Gallery
            </button>
            <button
              onClick={() => setActiveTab("newsletters")}
              className={`text-sm px-6 h-full rounded-t-lg transition-colors flex-shrink-0 flex items-center justify-center ${activeTab === "newsletters"
                  ? "bg-[#E31E24] text-white font-semibold"
                  : "text-[#666] hover:text-[#1B2B5E]"
                }`}
            >
              Newsletter
            </button>
            <button
              onClick={() => setActiveTab("contact")}
              className={`text-sm px-6 h-full rounded-t-lg transition-colors flex-shrink-0 flex items-center justify-center ${activeTab === "contact"
                  ? "bg-[#E31E24] text-white font-semibold"
                  : "text-[#666] hover:text-[#1B2B5E]"
                }`}
            >
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Responsive */}
      <main id="main-content" className="bg-[#F5F5F5]" role="main">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12">
            <div className="space-y-6 sm:space-y-8">


              {/* Home Tab */}
              <TabsContent value="home" className="space-y-6 sm:space-y-8">
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
                  {/* Left Sidebar - Stack on mobile, sidebar on desktop */}
                  <aside className="space-y-4 sm:space-y-6 lg:col-span-1 order-2 lg:order-1" aria-label="Sidebar content">
                    {/* Latest Announcements */}
                    <section>
                      <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold">Latest Announcements</h3>
                      <div className="space-y-3">
                        {announcements.length === 0 ? (
                          <Card>
                            <CardContent className="p-3 sm:p-4">
                              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                                No announcements available
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          announcements.slice(0, 3).map((announcement) => (
                            <Card key={announcement.id} className="border-l-4 border-l-[#FF9933]">
                              <CardContent className="p-3 sm:p-4">
                                <div className="mb-2 flex flex-wrap items-center gap-2">
                                  <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-[#FF9933]" />
                                  <Badge variant="secondary" className="text-xs">
                                    {announcement.date}
                                  </Badge>
                                </div>
                                <h4 className="mb-2 text-sm sm:text-base">{announcement.title}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                                  {announcement.description}
                                </p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </section>


                    {/* Featured Schemes */}
                    <section>
                      <div className="mb-3 sm:mb-4 flex items-center justify-between">
                        <h3 className="text-lg sm:text-xl font-semibold">Active Schemes</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab("schemes")}
                          className="text-xs sm:text-sm"
                        >
                          View All
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {schemes.length === 0 ? (
                          <Card>
                            <CardContent className="p-3 sm:p-4">
                              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                                No active schemes
                              </p>
                            </CardContent>
                          </Card>
                        ) : (
                          schemes.slice(0, 2).map((scheme) => (
                            <Card key={scheme.id}>
                              <CardContent className="p-3 sm:p-4">
                                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                  <Badge className="bg-[#138808] text-white text-xs">
                                    {scheme.category}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {scheme.status}
                                  </Badge>
                                </div>
                                <h4 className="mb-2 text-sm sm:text-base">{scheme.name}</h4>
                                <div className="mb-2">
                                  <div className="mb-1 flex justify-between text-xs">
                                    <span className="text-muted-foreground">Progress</span>
                                    <span>{scheme.progress}%</span>
                                  </div>
                                  <Progress value={scheme.progress} className="h-1" />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {scheme.beneficiaries} beneficiaries
                                </p>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </section>
                  </aside>


                  {/* Main Feed */}
                  <section className="space-y-4 sm:space-y-6 lg:col-span-2 order-1 lg:order-2" aria-label="Community feed">
                    <div>
                      <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Community Feed</h2>
                      <div className="space-y-4 sm:space-y-6">
                        {loading ? (
                          <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">Loading posts...</div>
                        ) : posts.length === 0 ? (
                          <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">No posts yet</div>
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
                    </div>
                  </section>
                </div>
              </TabsContent>


              {/* About Tab */}
              <TabsContent value="about" className="space-y-6 sm:space-y-8">
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                  <section>
                    <h2 className="mb-3 sm:mb-4 text-xl sm:text-2xl font-bold">About {panchayat?.name || 'Ramnagar'}</h2>
                    {panchayat?.aboutText ? (
                      <p className="mb-4 text-sm sm:text-base text-muted-foreground whitespace-pre-line">
                        {panchayat.aboutText}
                      </p>
                    ) : (
                      <>
                        <p className="mb-4 text-sm sm:text-base text-muted-foreground">
                          {panchayat?.name || 'Ramnagar'} Gram Panchayat is a vibrant rural community located in {panchayat?.district || 'Varanasi'}
                          district. Established in {panchayat?.established || '1995'}, our village has a rich history and cultural
                          heritage spanning several centuries.
                        </p>
                        <p className="mb-4 text-sm sm:text-base text-muted-foreground">
                          With a population of over {panchayat?.population?.toLocaleString() || '5,200'} residents spread across {panchayat?.wards || '8'} wards, we are
                          committed to sustainable development, preserving our traditions while embracing
                          modern governance practices.
                        </p>
                      </>
                    )}
                    {panchayat?.features && panchayat.features.length > 0 && (
                      <>
                        <h3 className="mb-3 text-lg sm:text-xl">Key Features</h3>
                        <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                          {panchayat.features.map((feature, index) => (
                            <li key={index}>• {feature}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </section>
                  <section>
                    <h3 className="mb-3 sm:mb-4 text-lg sm:text-xl font-semibold">Elected Members</h3>
                    {loading ? (
                      <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">Loading members...</div>
                    ) : members.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">No members available</div>
                    ) : (
                      <div className="space-y-4">
                        {members.map((member) => (
                          <Card key={member.id}>
                            <CardContent className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 p-3 sm:p-4">
                              <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                                {member.hasImage && member.image ? (
                                  <TeamMemberImageWithRefresh src={member.image} alt={member.name} />
                                ) : (
                                  <AvatarFallback className="bg-[#FF9933]/10 text-[#FF9933]">
                                    {member.initials || member.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                      .toUpperCase()
                                      .substring(0, 2)}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div className="flex-1 text-center sm:text-left">
                                <h4 className="text-sm sm:text-base">{member.name}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">{member.designation}</p>
                                <div className="mt-1 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                                  <span className="text-[#138808]">{member.ward}</span>
                                  <span className="text-muted-foreground">{member.phone}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </TabsContent>


              {/* Schemes Tab */}
              <TabsContent value="schemes" className="space-y-6 sm:space-y-8">
                <section>
                  <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Government Schemes</h2>
                  <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                    {schemes.map((scheme) => (
                      <Card key={scheme.id} className="transition-shadow hover:shadow-lg">
                        <CardHeader className="p-4 sm:p-6">
                          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <Badge className="bg-[#138808] text-white text-xs">{scheme.category}</Badge>
                            <Badge variant="outline" className="text-xs">{scheme.status}</Badge>
                          </div>
                          <CardTitle className="text-base sm:text-lg">{scheme.name}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">Allocated Budget: {scheme.budget}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <div className="space-y-4">
                            <div>
                              <div className="mb-2 flex justify-between text-xs sm:text-sm">
                                <span className="text-muted-foreground">Implementation Progress</span>
                                <span>{scheme.progress}%</span>
                              </div>
                              <Progress value={scheme.progress} className="h-2" />
                            </div>
                            <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                              <span className="text-xs sm:text-sm text-muted-foreground">Beneficiaries</span>
                              <span className="text-sm sm:text-base text-[#FF9933]">
                                {scheme.beneficiaries} families
                              </span>
                            </div>
                            <Button variant="outline" className="w-full text-xs sm:text-sm">
                              <Download className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                              Download Details
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              </TabsContent>




              {/* Gallery Tab */}
              <TabsContent value="gallery" className="space-y-6 sm:space-y-8">
                {selectedAlbum ? (
                  <section>
                    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          setSelectedAlbum(null);
                          setAlbumImages([]);
                        }}
                        className="flex items-center gap-2"
                      >
                        ← Back to Albums
                      </Button>
                      <div className="flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold">{selectedAlbum.title}</h2>
                        {selectedAlbum.description && (
                          <p className="mt-1 text-sm text-muted-foreground">{selectedAlbum.description}</p>
                        )}
                        {albumImages.length > 0 && (
                          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                            {albumImages.length} {albumImages.length === 1 ? 'image' : 'images'}
                          </p>
                        )}
                      </div>
                    </div>
                    {loadingAlbumImages ? (
                      <div className="text-center text-muted-foreground py-12">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-[#E31E24]" />
                        <p className="text-sm sm:text-base">Loading images...</p>
                      </div>
                    ) : (
                      <>
                        {albumImages.length === 0 ? (
                          <Card>
                            <CardContent className="p-12 text-center">
                              <p className="text-muted-foreground text-sm sm:text-base">No images in this album</p>
                            </CardContent>
                          </Card>
                        ) : (
                          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                            {albumImages.map((item, index) => (
                              <Card 
                                key={item.id} 
                                className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 hover:border-[#E31E24]/50"
                                onClick={() => {
                                  const imageUrls = albumImages.map(img => img.image || "").filter(Boolean);
                                  const titles = albumImages.map(img => img.title || "Image");
                                  setModalImages(imageUrls);
                                  setModalImageTitles(titles);
                                  setSelectedImageIndex(index);
                                  setIsImageModalOpen(true);
                                }}
                              >
                                <div className="relative  overflow-hidden bg-muted">
                                  <AlbumImageWithRefresh 
                                    src={item.image} 
                                    alt={item.title}
                                    entityType="gallery"
                                    entityId={item.id}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                  {item.title && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <p className="text-white text-xs sm:text-sm font-medium line-clamp-2">{item.title}</p>
                                    </div>
                                  )}
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </section>
                ) : (
                  <section>
                    <div className="mb-4 sm:mb-6">
                      <h2 className="text-xl sm:text-2xl font-bold">Photo Gallery</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Browse through our collection of photos and albums
                      </p>
                    </div>
                    
                    {albums.length > 0 && (
                      <div className="mb-8 sm:mb-10">
                        <div className="mb-3 sm:mb-4 flex items-center justify-between">
                          <h3 className="text-lg sm:text-xl font-semibold">Albums</h3>
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {albums.length} {albums.length === 1 ? 'album' : 'albums'}
                          </Badge>
                        </div>
                        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                                    <div className="text-center p-4">
                                      <div className="text-4xl mb-2">📷</div>
                                      <p className="text-xs text-muted-foreground">No cover image</p>
                                    </div>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Badge className="bg-white/90 text-[#1B2B5E] hover:bg-white">
                                    View Album
                                  </Badge>
                                </div>
                              </div>
                              <CardContent className="p-3 sm:p-4">
                                <h4 className="font-semibold text-sm sm:text-base mb-1 line-clamp-1">{album.title}</h4>
                                {album.description && (
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">{album.description}</p>
                                )}
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                  <span>{album.imageCount || 0} {album.imageCount === 1 ? 'image' : 'images'}</span>
                                  {album.createdAt && !isNaN(new Date(album.createdAt).getTime()) && (
                                    <span>{new Date(album.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {gallery.length > 0 && (
                      <div>
                        <div className="mb-3 sm:mb-4 flex items-center justify-between">
                          <h3 className="text-lg sm:text-xl font-semibold">All Images</h3>
                          <Badge variant="secondary" className="text-xs sm:text-sm">
                            {gallery.length} {gallery.length === 1 ? 'image' : 'images'}
                          </Badge>
                        </div>
                        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                          {gallery.map((item, index) => (
                            <Card 
                              key={item.id} 
                              className="group overflow-hidden transition-all hover:shadow-lg cursor-pointer border-2 hover:border-[#E31E24]/50"
                              onClick={() => {
                                const imageUrls = gallery.map(img => img.image || "").filter(Boolean);
                                const titles = gallery.map(img => img.title || "Image");
                                setModalImages(imageUrls);
                                setModalImageTitles(titles);
                                setSelectedImageIndex(index);
                                setIsImageModalOpen(true);
                              }}
                            >
                              <div className="relative overflow-hidden bg-muted">
                                <AlbumImageWithRefresh 
                                  src={item.image} 
                                  alt={item.title}
                                  entityType="gallery"
                                  entityId={item.id}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                {item.title && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <p className="text-white text-xs sm:text-sm font-medium line-clamp-2">{item.title}</p>
                                    {item.date && (
                                      <p className="text-white/80 text-xs mt-1">{item.date}</p>
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
                          <div className="text-5xl mb-4">📸</div>
                          <p className="text-muted-foreground text-sm sm:text-base mb-2">No gallery items available</p>
                          <p className="text-muted-foreground text-xs">Check back later for updates</p>
                        </CardContent>
                      </Card>
                    )}
                  </section>
                )}
              </TabsContent>

              {/* Newsletter Tab */}
              <TabsContent value="newsletters" className="space-y-6 sm:space-y-8">
                {selectedNewsletter ? (
                  <NewsletterDetailView 
                    newsletter={selectedNewsletter} 
                    onBack={() => setSelectedNewsletter(null)}
                    onImageClick={(imageUrl) => {
                      setSelectedNewsletterImageUrl(imageUrl);
                      setIsNewsletterImageModalOpen(true);
                    }}
                  />
                ) : (
                  <section>
                    <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Newsletters</h2>
                    {loading ? (
                      <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">Loading newsletters...</div>
                    ) : newsletters.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">No newsletters available</div>
                    ) : (
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                        {newsletters.map((newsletter) => (
                          <Card
                            key={newsletter.id}
                            className="overflow-hidden transition-transform hover:scale-105 cursor-pointer"
                            onClick={() => setSelectedNewsletter(newsletter)}
                          >
                            {newsletter.coverImageUrl && (
                              <div 
                                className="h-48 w-full overflow-hidden cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedNewsletterImageUrl(newsletter.coverImageUrl || "");
                                  setIsNewsletterImageModalOpen(true);
                                }}
                              >
                                <NewsletterCoverImage fileKey={newsletter.coverImageFileKey} url={newsletter.coverImageUrl} />
                              </div>
                            )}
                            <CardContent className="p-4 sm:p-6">
                              <h3 className="font-semibold text-base sm:text-lg mb-2">{newsletter.title}</h3>
                              {newsletter.subtitle && (
                                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{newsletter.subtitle}</p>
                              )}
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>{newsletter.publishedOn ? new Date(newsletter.publishedOn).toLocaleDateString() : "Draft"}</span>
                                {newsletter.authorName && <span>By {newsletter.authorName}</span>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </TabsContent>


              {/* Contact Tab */}
              <TabsContent value="contact" className="space-y-6 sm:space-y-8">
                <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                  <section>
                    <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Contact Information</h2>
                    {(panchayat?.mapCoordinates) && (
                      <div className="mb-6 relative z-0">
                      <h3 className="mb-2 sm:mb-4 text-base sm:text-lg font-semibold">Location</h3>
                      <div style={{ height: '300px', width: '100%' }} className="sm:h-96 lg:h-[400px] rounded-lg overflow-hidden border border-[#E5E5E5]">
                        <MapContainer
                        center={parseCoordinates(panchayat.mapCoordinates || '') as LatLngExpression}
                        zoom={15}
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                        >
                        <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={parseCoordinates(panchayat.mapCoordinates || '')}>
                        <Popup>
                        <strong>{panchayat?.name}</strong><br />
                        Gram Panchayat Office
                        </Popup>
                        </Marker>
                        </MapContainer>
                      </div>
                      </div>
                    )}
                    <Card>
                      <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                        {panchayat?.contactInfo && (
                          panchayat.contactInfo.address || panchayat.contactInfo.phone || panchayat.contactInfo.email ? (
                            <>
                              {panchayat.contactInfo.address && (
                                <div className="flex items-start gap-3">
                                  <MapPin className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                                  <div>
                                    <h4 className="text-sm sm:text-base font-semibold">Address</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line">
                                      {panchayat.contactInfo.address}
                                    </p>
                                  </div>
                                </div>
                              )}
                              {panchayat.contactInfo.phone && (
                                <div className="flex items-start gap-3">
                                  <Phone className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                                  <div>
                                    <h4 className="text-sm sm:text-base font-semibold">Phone</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-all">{panchayat.contactInfo.phone}</p>
                                  </div>
                                </div>
                              )}
                              {panchayat.contactInfo.email && (
                                <div className="flex items-start gap-3">
                                  <Mail className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                                  <div>
                                    <h4 className="text-sm sm:text-base font-semibold">Email</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground break-all">{panchayat.contactInfo.email}</p>
                                  </div>
                                </div>
                              )}
                              {panchayat.contactInfo.officeHours && (
                                <div className="flex items-start gap-3">
                                  <Calendar className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                                  <div>
                                    <h4 className="text-sm sm:text-base font-semibold">Office Hours</h4>
                                    <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-line">
                                      {panchayat.contactInfo.officeHours}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </>
                          ) : null
                        )}
                        {(!panchayat?.contactInfo || (!panchayat.contactInfo.address && !panchayat.contactInfo.phone && !panchayat.contactInfo.email)) && (
                          <>
                            <div className="flex items-start gap-3">
                              <MapPin className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                              <div>
                                <h4 className="text-sm sm:text-base font-semibold">Address</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {panchayat?.name || 'Ramnagar'} Gram Panchayat Bhawan
                                  <br />
                                  {panchayat?.district || 'Varanasi'}, {panchayat?.state || 'Uttar Pradesh'} - 221001
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Phone className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                              <div>
                                <h4 className="text-sm sm:text-base font-semibold">Phone</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">+91 542-XXXXXX</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Mail className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                              <div>
                                <h4 className="text-sm sm:text-base font-semibold">Email</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground break-all">
                                  {panchayat?.subdomain || 'ramnagar'}@egramseva.gov.in
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <Calendar className="mt-1 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-[#FF9933]" />
                              <div>
                                <h4 className="text-sm sm:text-base font-semibold">Office Hours</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  Monday - Friday: 10:00 AM - 5:00 PM
                                  <br />
                                  Saturday: 10:00 AM - 2:00 PM
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </section>
                  <section>
                    <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Send us a Message</h2>
                    <Card>
                      <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                        {formSubmitted && (
                          <div className="rounded-lg bg-[#138808]/10 border border-[#138808] p-3 text-sm text-[#138808]">
                            Thank you! Your message has been sent successfully. We will get back to you soon.
                          </div>
                        )}
                        <form onSubmit={handleContactSubmit} noValidate>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="name" className="text-xs sm:text-sm">
                                Name <span className="text-destructive" aria-label="required">*</span>
                              </Label>
                              <Input
                                id="name"
                                placeholder="Your name"
                                className={`text-sm ${formErrors.name ? 'border-destructive' : ''}`}
                                value={contactForm.name}
                                onChange={(e) => {
                                  setContactForm({ ...contactForm, name: e.target.value });
                                  if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                                }}
                                aria-invalid={!!formErrors.name}
                                aria-describedby={formErrors.name ? 'name-error' : undefined}
                                required
                              />
                              {formErrors.name && (
                                <p id="name-error" className="text-xs text-destructive" role="alert">
                                  {formErrors.name}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="email" className="text-xs sm:text-sm">
                                Email <span className="text-destructive" aria-label="required">*</span>
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                className={`text-sm ${formErrors.email ? 'border-destructive' : ''}`}
                                value={contactForm.email}
                                onChange={(e) => {
                                  setContactForm({ ...contactForm, email: e.target.value });
                                  if (formErrors.email) setFormErrors({ ...formErrors, email: '' });
                                }}
                                aria-invalid={!!formErrors.email}
                                aria-describedby={formErrors.email ? 'email-error' : undefined}
                                required
                              />
                              {formErrors.email && (
                                <p id="email-error" className="text-xs text-destructive" role="alert">
                                  {formErrors.email}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="subject" className="text-xs sm:text-sm">
                                Subject <span className="text-destructive" aria-label="required">*</span>
                              </Label>
                              <Input
                                id="subject"
                                placeholder="What is this about?"
                                className={`text-sm ${formErrors.subject ? 'border-destructive' : ''}`}
                                value={contactForm.subject}
                                onChange={(e) => {
                                  setContactForm({ ...contactForm, subject: e.target.value });
                                  if (formErrors.subject) setFormErrors({ ...formErrors, subject: '' });
                                }}
                                aria-invalid={!!formErrors.subject}
                                aria-describedby={formErrors.subject ? 'subject-error' : undefined}
                                required
                              />
                              {formErrors.subject && (
                                <p id="subject-error" className="text-xs text-destructive" role="alert">
                                  {formErrors.subject}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="message" className="text-xs sm:text-sm">
                                Message <span className="text-destructive" aria-label="required">*</span>
                              </Label>
                              <Textarea
                                id="message"
                                placeholder="Your message..."
                                rows={5}
                                className={`text-sm ${formErrors.message ? 'border-destructive' : ''}`}
                                value={contactForm.message}
                                onChange={(e) => {
                                  setContactForm({ ...contactForm, message: e.target.value });
                                  if (formErrors.message) setFormErrors({ ...formErrors, message: '' });
                                }}
                                aria-invalid={!!formErrors.message}
                                aria-describedby={formErrors.message ? 'message-error' : undefined}
                                required
                              />
                              {formErrors.message && (
                                <p id="message-error" className="text-xs text-destructive" role="alert">
                                  {formErrors.message}
                                </p>
                              )}
                            </div>
                            <Button
                              type="submit"
                              className="w-full bg-[#FF9933] hover:bg-[#FF9933]/90 text-sm sm:text-base"
                              aria-label="Submit contact form"
                            >
                              Send Message
                            </Button>
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  </section>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </main>

      {/* Image Modal for Gallery/Album Images */}
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

      {/* Image Modal for Newsletter Cover Images */}
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
function TeamMemberImageWithRefresh({ src, alt }: { src?: string; alt: string }) {
  const { presignedUrl } = usePresignedUrlRefresh({
    fileKey: src || undefined,
    initialPresignedUrl: src || undefined,
  });

  if (!presignedUrl) {
    return null;
  }

  return (
    <AvatarImage src={presignedUrl} alt={alt} />
  );
}

// Helper component for newsletter cover image with presigned URL refresh
function NewsletterCoverImage({ fileKey, url }: { fileKey?: string; url?: string }) {
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
  entityId 
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
      <div className="h-40 sm:h-48 w-full bg-muted flex items-center justify-center">
        <span className="text-muted-foreground text-sm">No image</span>
      </div>
    );
  }

  return (
    <ImageWithFallback
      src={presignedUrl}
      alt={alt}
      className="h-40 sm:h-48 w-full object-cover"
      entityType={entityType}
      entityId={entityId}
    />
  );
}

// Newsletter Detail View Component
function NewsletterDetailView({ 
  newsletter, 
  onBack,
  onImageClick 
}: { 
  newsletter: any; 
  onBack: () => void;
  onImageClick: (imageUrl: string) => void;
}) {
  return (
    <article className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back to Newsletters
      </Button>

      {newsletter.coverImageUrl && (
        <div 
          className="w-full h-64 sm:h-96 rounded-lg overflow-hidden cursor-pointer transition-transform hover:scale-[1.02]"
          onClick={() => onImageClick(newsletter.coverImageUrl || "")}
        >
          <NewsletterCoverImage fileKey={newsletter.coverImageFileKey} url={newsletter.coverImageUrl} />
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{newsletter.title}</h1>
          {newsletter.subtitle && (
            <p className="text-lg text-muted-foreground mb-4">{newsletter.subtitle}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {newsletter.authorName && <span>By {newsletter.authorName}</span>}
            {newsletter.publishedOn && (
              <span>{new Date(newsletter.publishedOn).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            )}
          </div>
        </div>

        {newsletter.content && (
          <div
            className="prose prose-sm sm:prose-base max-w-none"
            dangerouslySetInnerHTML={{ __html: newsletter.content }}
          />
        )}

        {newsletter.bulletPoints && newsletter.bulletPoints.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Key Points</h2>
            <ul className="list-disc list-inside space-y-2">
              {newsletter.bulletPoints.map((point: string, index: number) => (
                <li key={index} className="text-sm sm:text-base">{point}</li>
              ))}
            </ul>
          </div>
        )}

        {newsletter.attachments && newsletter.attachments.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Attachments</h2>
            <div className="space-y-2">
              {newsletter.attachments.map((attachment: string, index: number) => (
                <Button key={index} variant="outline" asChild>
                  <a href={attachment} target="_blank" rel="noopener noreferrer">
                    <Download className="mr-2 h-4 w-4" />
                    Download Attachment {index + 1}
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
