import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowRight, Users, Zap, TrendingUp, MapPin,
  Search, FileText, Building2, Award,
  Calendar
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { panchayatAPI } from "../../services/api";
import { toast } from "sonner";
import type { ActivePanchayat } from "../../types";
import { useTranslation } from "react-i18next";

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activePanchayats, setActivePanchayats] = useState<ActivePanchayat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Scroll to top when component mounts (when navigating back to landing page)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const fetchPanchayats = async () => {
      try {
        setLoading(true);
        const data = await panchayatAPI.getAll();
        // Filter only ACTIVE panchayats and show first 4
        const active = data.filter(p => p.status === 'ACTIVE' || !p.status).slice(0, 4);
        setActivePanchayats(active);
      } catch (error) {
        console.error("Error fetching panchayats:", error);
        toast.error("Failed to load panchayats. Please try again later.");
        setActivePanchayats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPanchayats();
  }, []);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to panchayats page with search query
      navigate(`/panchayats?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const features = [
    {
      icon: Users,
      title: t('features.easyManagement.title'),
      description: t('features.easyManagement.description'),
    },

    {
      icon: Zap,
      title: t('features.quickSetup.title'),
      description: t('features.quickSetup.description'),
    },
    {
      icon: TrendingUp,
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
    },
  ];

  // const benefits = [
  //   "Complete transparency in governance",
  //   "Direct citizen engagement platform",
  //   "Showcase development projects",
  //   "Track scheme implementation",
  //   "Multi-language support",
  //   "Mobile-responsive design",
  // ];


  // const stats = [
  //   { value: "500+", label: "Active Panchayats" },
  //   { value: "2.5M+", label: "Citizens Reached" },
  //   { value: "8,500+", label: "Schemes Implemented" },
  //   { value: "98%", label: "Satisfaction Rate" },
  // ];

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Hero Section with Gradient Overlay */}
      <section id="home" className="relative min-h-[500px] overflow-hidden bg-gradient-to-br from-[#1B2B5E] via-[#2A3F6F] to-[#6C5CE7]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="container relative mx-auto px-4 py-20 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-white/20 text-white backdrop-blur-sm">
              {t('hero.badge')}
            </Badge>
            <h1 className="mb-6 text-4xl font-bold text-white lg:text-5xl">
              {t('hero.title')} <span className="text-[#FF9933]">{t('hero.titleHighlight1')}</span> {t('hero.titleFor')}{" "}
              <span className="text-[#138808]">{t('hero.titleHighlight2')}</span>
            </h1>
            <p className="mb-8 text-lg text-white/90">
              {t('hero.subtitle')}
            </p>

            {/* Search Bar */}
            <div className="mx-auto mb-8 max-w-2xl">
              <div className="flex gap-2 rounded-lg bg-white p-2 shadow-lg">
                <div className="flex flex-1 items-center gap-2">
                  <Search className="h-5 w-5 text-[#666]" />
                  <Input
                    type="search"
                    placeholder={t('hero.searchPlaceholder')}
                    className="border-0 bg-transparent text-[#333] focus-visible:ring-0"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />
                </div>
                <Button
                  className="bg-[#E31E24] text-white hover:bg-[#C91A20]"
                  onClick={handleSearch}
                >
                  {t('hero.searchButton')}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-[#E31E24] text-white hover:bg-[#C91A20]"
                onClick={() => navigate("/registration")}
              >
                {t('hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigate("/panchayat-demo")}
              >
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Icon Cards */}
      <section className="relative -mt-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Building2, value: "500+", label: t('stats.activePanchayats'), color: "#E31E24" },
              { icon: Users, value: "2.5M+", label: t('stats.citizensReached'), color: "#FF9933" },
              { icon: FileText, value: "8,500+", label: t('stats.schemesImplemented'), color: "#138808" },
              { icon: Award, value: "98%", label: t('stats.satisfactionRate'), color: "#6C5CE7" },
            ].map((stat, index) => (
              <Card key={index} className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-6">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${stat.color}15` }}
                  >
                    <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[#1B2B5E]">{stat.value}</div>
                    <p className="text-sm text-[#666]">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16 lg:py-24" id="features">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="section-title inline-block">
              {t('features.title')} <span className="text-[#138808]">{t('features.titleHighlight')}</span>?
            </h2>
            <p className="mx-auto max-w-2xl text-[#666]">
              {t('features.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md hover:scale-105">
                <CardHeader>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-[#138808]/10">
                    <feature.icon className="h-6 w-6 text-[#138808]" />
                  </div>
                  <CardTitle className="text-[#1B2B5E]">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-[#666]">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Government Schemes Section - Red Background */}
      {/* <section className="bg-[#DC143C] py-16 text-white lg:py-24" style={{ backgroundColor: '#DC143C' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">{t('schemes.title')}</h2>
            <p className="mx-auto max-w-2xl text-white/90">
              {t('schemes.subtitle')}
            </p>
          </div>
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="flex gap-2 rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-5 w-5 text-white" />
                <Input
                  type="search"
                  placeholder={t('schemes.searchPlaceholder')}
                  className="border-0 bg-white/20 text-white placeholder:text-white/70 focus-visible:ring-0"
                />
              </div>
              <Button className="bg-white text-[#DC143C] hover:bg-white/90">
                {t('schemes.searchButton')}
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: t('schemes.pmAwas.title'), description: t('schemes.pmAwas.description'), icon: Building2 },
              { title: t('schemes.mgnrega.title'), description: t('schemes.mgnrega.description'), icon: Briefcase },
              { title: t('schemes.pmKisan.title'), description: t('schemes.pmKisan.description'), icon: Heart },
            ].map((scheme, index) => (
              <Card key={index} className="border-0 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20">
                <CardContent className="p-6">
                  <scheme.icon className="mb-4 h-8 w-8 text-[#FF9933]" />
                  <h3 className="mb-2 text-lg font-semibold text-white">{scheme.title}</h3>
                  <p className="text-sm text-white/80">{scheme.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* News & Updates Section */}


      {/* Directories Section */}
      {/* <section className="bg-white py-16 lg:py-24" id="panchayats">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12">
            <h2 className="section-title inline-block">{t('directories.title')}</h2>
            <p className="text-[#666]">{t('directories.subtitle')}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users2, title: t('directories.whosWho.title'), description: t('directories.whosWho.description'), color: "#E31E24" },
              { icon: Phone, title: t('directories.contact.title'), description: t('directories.contact.description'), color: "#FF9933" },
              { icon: Globe, title: t('directories.web.title'), description: t('directories.web.description'), color: "#138808" },
              { icon: BookOpen, title: t('directories.resources.title'), description: t('directories.resources.description'), color: "#6C5CE7" },
            ].map((dir, index) => (
              <Card key={index} className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <div
                    className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${dir.color}15` }}
                  >
                    <dir.icon className="h-8 w-8" style={{ color: dir.color }} />
                  </div>
                  <h3 className="mb-2 font-semibold text-[#1B2B5E]">{dir.title}</h3>
                  <p className="text-sm text-[#666]">{dir.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* Active Panchayats */}
      <section className="bg-[#F5F5F5] py-16 lg:py-24" >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="section-title inline-block">
              {t('activePanchayats.title')} <span className="text-[#FF9933]">{t('activePanchayats.titleHighlight')}</span>
            </h2>
            <p className="mx-auto max-w-2xl text-[#666]">
              {t('activePanchayats.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <div className="col-span-4 text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#E31E24] border-r-transparent"></div>
                <p className="mt-2 text-[#666]">{t('activePanchayats.loading')}</p>
              </div>
            ) : activePanchayats.length === 0 ? (
              <div className="col-span-4 text-center py-8">
                <Building2 className="mx-auto h-12 w-12 text-[#666] mb-3 opacity-50" />
                <p className="text-[#666]">{t('activePanchayats.noData')}</p>
                <p className="mt-1 text-sm text-[#999]">{t('activePanchayats.checkBack')}</p>
              </div>
            ) : (
              activePanchayats.map((panchayat, index) => (
                <Card
                  key={panchayat.subdomain || index}
                  className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                  onClick={() => navigate(`/panchayat/${panchayat.subdomain}`)}
                >
                  <CardHeader>
                    <div className="mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-[#FF9933]" />
                      <Badge variant="secondary" className="bg-[#F5F5F5] text-[#666]">{panchayat.district}</Badge>
                    </div>
                    <CardTitle className="text-[#1B2B5E]">{panchayat.name}</CardTitle>
                    <CardDescription className="text-[#666]">{t('activePanchayats.gramPanchayat')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm">
                      <div>
                        <p className="text-[#666]">{t('activePanchayats.activeSchemes')}</p>
                        <p className="font-semibold text-[#138808]">{panchayat.schemes || 0}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[#666]">{t('activePanchayats.population')}</p>
                        <p className="font-semibold text-[#138808]">
                          {panchayat.population > 0 ? panchayat.population.toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <div className="mt-12 text-center">
            <Button
              variant="outline"
              size="lg"
              className="border-[#E5E5E5] text-[#1B2B5E] hover:bg-[#F5F5F5]"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                navigate("/panchayats");
              }}
            >
              {t('activePanchayats.viewAll')}
            </Button>
          </div>
        </div>
      </section>


      <section className="bg-white py-16 lg:py-24" id="news">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12">
            <h2 className="section-title inline-block">{t('news.title')}</h2>
            <p className="text-[#666]">{t('news.subtitle')}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md">
                <div className="aspect-video overflow-hidden rounded-t-lg bg-[#F5F5F5]">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1736914319111-d54ada582633?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjB2aWxsYWdlJTIwcGFuY2hheWF0fGVufDF8fHx8MTc2Mjc1MjM1N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="News"
                    className="h-full w-full object-cover"
                  />
                </div>
                <CardHeader>
                  <Badge className="w-fit bg-[#E31E24] text-white">{t('news.pressRelease')}</Badge>
                  <CardTitle className="text-[#1B2B5E]">{t('news.newsTitle')}</CardTitle>
                  <CardDescription className="text-[#666]">
                    {t('news.newsDescription')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-[#666]">
                    <Calendar className="h-4 w-4" />
                    <span>{t('news.date')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Explore India Section - Purple Gradient */}
      {/* <section className="bg-gradient-to-br from-[#6C5CE7] to-[#5B4B9D] py-16 text-white lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">{t('exploreIndia.title')}</h2>
            <p className="mx-auto max-w-2xl text-white/90">
              {t('exploreIndia.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Building2, label: t('exploreIndia.governance') },
              { icon: FileText, label: t('exploreIndia.schemes') },
              { icon: Users, label: t('exploreIndia.citizens') },
              { icon: Globe, label: t('exploreIndia.services') },
              { icon: BookOpen, label: t('exploreIndia.resources') },
              { icon: BarChart3, label: t('exploreIndia.data') },
            ].map((category, index) => (
              <Card key={index} className="border-0 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 cursor-pointer">
                <CardContent className="flex flex-col items-center p-6 text-center">
                  <category.icon className="mb-3 h-8 w-8 text-[#FF9933]" />
                  <span className="text-sm font-medium text-white">{category.label}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* MyGov Connect Section - Red/Gradient */}
      {/* <section id="about" className="bg-gradient-to-r from-[#E31E24] to-[#DC143C] py-16 text-white lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">{t('myGov.title')}</h2>
            <p className="mx-auto max-w-2xl text-white/90">
              {t('myGov.subtitle')}
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Lightbulb, title: t('myGov.shareIdeas.title'), description: t('myGov.shareIdeas.description') },
              { icon: Target, title: t('myGov.participate.title'), description: t('myGov.participate.description') },
              { icon: Heart, title: t('myGov.engage.title'), description: t('myGov.engage.description') },
            ].map((item, index) => (
              <Card key={index} className="border-0 bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20">
                <CardContent className="p-6 text-center">
                  <item.icon className="mx-auto mb-4 h-10 w-10 text-[#FF9933]" />
                  <h3 className="mb-2 text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-white/80">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section> */}

      {/* CTA Section */}
      <section id="contact" className="bg-[#F5F5F5] py-16">
        <div className="container mx-auto px-4 text-center lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-[#1B2B5E]">
            {t('cta.title')}
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-[#666]">
            {t('cta.subtitle')}
          </p>
          <Button
            size="lg"
            className="bg-[#E31E24] text-white hover:bg-[#C91A20]"
            onClick={() => navigate("/registration")}
          >
            {t('cta.button')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
