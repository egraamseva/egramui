import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Phone, Mail, MapPin, Calendar, Users, TrendingUp, Download, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Label } from "../ui/label";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { PostCard } from "../sachiv/PostCard";
import { panchayatAPI, publicAPI } from "../../services/api";
import type { Post, Scheme, Announcement, PanchayatMember, GalleryItem, Project, PanchayatDetails } from "../../types";
import { formatTimeAgo } from "../../utils/format";


export function PanchayatWebsite() {
  const { subdomain } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const [panchayat, setPanchayat] = useState<PanchayatDetails | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [members, setMembers] = useState<PanchayatMember[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    fetchPanchayatData();
  }, [subdomain]);


  const fetchPanchayatData = async () => {
    setLoading(true);
    try {
      const subdomainToUse = subdomain || 'ramnagar';
      const panchayatData = await panchayatAPI.getBySubdomain(subdomainToUse);
      setPanchayat(panchayatData);
      
      // Fetch all data using public APIs with slug
      const [postsResult, schemesResult, announcementsResult, membersResult, galleryResult] = await Promise.all([
        publicAPI.getPublicPosts(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicSchemes(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicAnnouncements(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicMembers(subdomainToUse, { page: 0, size: 50 }),
        publicAPI.getPublicGallery(subdomainToUse, { page: 0, size: 50 }),
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
            image: undefined, // Backend doesn't have image field yet
            designation: roleName,
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
      setProjects([]); // Projects not implemented in backend yet
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
      setProjects([]);
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
      console.log("Form submitted:", contactForm);
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
                {panchayat?.name || 'Ramnagar'}
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


      {/* Main Content - Mobile Responsive */}
      <main id="main-content" className="bg-[#F5F5F5] py-6 sm:py-8 md:py-12" role="main">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
            {/* Horizontal Tab Navigation - Modern Pills Style */}
            <div className="relative -mx-4 sm:mx-0 bg-white border-b border-[#E5E5E5]">
              <TabsList className="w-full inline-flex sm:grid grid-cols-3 lg:grid-cols-6 overflow-x-auto overflow-y-hidden whitespace-nowrap px-4 sm:px-0 scrollbar-hide gap-1 sm:gap-0 h-auto bg-transparent">
                <TabsTrigger 
                  value="home" 
                  className="text-sm px-4 py-3 rounded-t-lg data-[state=active]:bg-[#E31E24] data-[state=active]:text-white data-[state=active]:font-semibold text-[#666] hover:text-[#1B2B5E] transition-colors"
                >
                  Home
                </TabsTrigger>
                <TabsTrigger 
                  value="about" 
                  className="text-sm px-4 py-3 rounded-t-lg data-[state=active]:bg-[#E31E24] data-[state=active]:text-white data-[state=active]:font-semibold text-[#666] hover:text-[#1B2B5E] transition-colors"
                >
                  About
                </TabsTrigger>
                <TabsTrigger 
                  value="schemes" 
                  className="text-sm px-4 py-3 rounded-t-lg data-[state=active]:bg-[#E31E24] data-[state=active]:text-white data-[state=active]:font-semibold text-[#666] hover:text-[#1B2B5E] transition-colors"
                >
                  Schemes
                </TabsTrigger>
                <TabsTrigger 
                  value="projects" 
                  className="text-sm px-4 py-3 rounded-t-lg data-[state=active]:bg-[#E31E24] data-[state=active]:text-white data-[state=active]:font-semibold text-[#666] hover:text-[#1B2B5E] transition-colors"
                >
                  Projects
                </TabsTrigger>
                <TabsTrigger 
                  value="gallery" 
                  className="text-sm px-4 py-3 rounded-t-lg data-[state=active]:bg-[#E31E24] data-[state=active]:text-white data-[state=active]:font-semibold text-[#666] hover:text-[#1B2B5E] transition-colors"
                >
                  Gallery
                </TabsTrigger>
                <TabsTrigger 
                  value="contact" 
                  className="text-sm px-4 py-3 rounded-t-lg data-[state=active]:bg-[#E31E24] data-[state=active]:text-white data-[state=active]:font-semibold text-[#666] hover:text-[#1B2B5E] transition-colors"
                >
                  Contact
                </TabsTrigger>
              </TabsList>
            </div>


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
                              <AvatarImage src={member.image} />
                              <AvatarFallback className="bg-[#FF9933]/10 text-[#FF9933]">
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-center sm:text-left">
                              <h4 className="text-sm sm:text-base">{member.name}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">{member.role}</p>
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


            {/* Projects Tab */}
            <TabsContent value="projects" className="space-y-6 sm:space-y-8">
              <section>
                <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Development Projects</h2>
                {loading ? (
                  <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">Loading projects...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">No projects available</div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {projects.map((project) => (
                      <Card key={project.id} className="transition-shadow hover:shadow-lg">
                        <CardHeader className="p-4 sm:p-6">
                          <CardTitle className="text-base sm:text-lg">{project.title}</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">{project.wards}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-6 pt-0">
                          <p className="mb-4 text-xs sm:text-sm text-muted-foreground">{project.description}</p>
                          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                            <div className="rounded-lg border p-3">
                              <p className="text-xs sm:text-sm text-muted-foreground">Budget</p>
                              <p className="text-sm sm:text-base text-[#138808] font-medium">{project.budget}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-xs sm:text-sm text-muted-foreground">Timeline</p>
                              <p className="text-sm sm:text-base text-[#138808] font-medium">{project.timeline}</p>
                            </div>
                            <div className="rounded-lg border p-3">
                              <p className="text-xs sm:text-sm text-muted-foreground">Status</p>
                              <Badge 
                                className={
                                  project.status === 'Completed' 
                                    ? 'bg-[#138808] text-white'
                                    : project.status === 'In Progress'
                                    ? 'bg-[#FF9933] text-white'
                                    : 'bg-[#666] text-white'
                                }
                              >
                                {project.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="mt-4">
                            <Progress value={project.progress} />
                            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">{project.progress}% Completed</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>


            {/* Gallery Tab */}
            <TabsContent value="gallery" className="space-y-6 sm:space-y-8">
              <section>
                <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Photo Gallery</h2>
                {loading ? (
                  <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">Loading gallery...</div>
                ) : gallery.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8 text-sm sm:text-base">No gallery items available</div>
                ) : (
                  <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {gallery.map((item) => (
                      <Card key={item.id} className="overflow-hidden transition-transform hover:scale-105">
                        <ImageWithFallback
                          src={item.image}
                          alt={item.title}
                          className="h-40 sm:h-48 w-full object-cover"
                        />
                        <CardContent className="p-3 sm:p-4">
                          <p className="font-medium text-sm sm:text-base">{item.title}</p>
                          {item.description && (
                            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                          )}
                          {item.date && (
                            <p className="mt-1 text-xs text-muted-foreground">{item.date}</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>


            {/* Contact Tab */}
            <TabsContent value="contact" className="space-y-6 sm:space-y-8">
              <div className="grid gap-6 sm:gap-8 lg:grid-cols-2">
                <section>
                  <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold">Contact Information</h2>
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
          </Tabs>
        </div>
      </main>
    </div>
  );
}
