import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { 
  ArrowRight, Users, Zap, TrendingUp, MapPin, 
  Search, FileText, Building2, Globe, Award, 
  Calendar, Phone, BarChart3, Target, 
  Heart, Lightbulb, BookOpen, Users2, Briefcase
} from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { panchayatAPI } from "../../services/api";
import type { ActivePanchayat } from "../../types";

export function LandingPage() {
  const navigate = useNavigate();
  const [activePanchayats, setActivePanchayats] = useState<ActivePanchayat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanchayats = async () => {
      try {
        const data = await panchayatAPI.getAll();
        setActivePanchayats(data.slice(0, 4)); // Show first 4
      } catch (error) {
        console.error("Error fetching panchayats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPanchayats();
  }, []);
  const features = [
    {
      icon: Users,
      title: "Easy Management",
      description: "Intuitive dashboard for Panchayat Sachivs to manage content, schemes, and updates effortlessly.",
    },
  
    {
      icon: Zap,
      title: "Quick Setup",
      description: "Get your Panchayat website live in minutes with custom subdomain and ready-to-use templates.",
    },
    {
      icon: TrendingUp,
      title: "Real-time Analytics",
      description: "Track visitor engagement, scheme reach, and citizen interaction with comprehensive analytics.",
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
      <section className="relative min-h-[500px] overflow-hidden bg-gradient-to-br from-[#1B2B5E] via-[#2A3F6F] to-[#6C5CE7]">
        <div className="absolute inset-0 bg-black/30" />
        <div className="container relative mx-auto px-4 py-20 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-6 bg-white/20 text-white backdrop-blur-sm">
              Government of India Initiative
            </Badge>
            <h1 className="mb-6 text-4xl font-bold text-white lg:text-5xl">
              Empowering <span className="text-[#FF9933]">Gram Panchayats</span> for{" "}
              <span className="text-[#138808]">Digital India</span>
            </h1>
            <p className="mb-8 text-lg text-white/90">
              Create your Panchayat's digital presence in minutes. Showcase schemes, projects,
              and achievements with a professional website tailored for rural governance.
            </p>
            
            {/* Search Bar */}
            <div className="mx-auto mb-8 max-w-2xl">
              <div className="flex gap-2 rounded-lg bg-white p-2 shadow-lg">
                <div className="flex flex-1 items-center gap-2">
                  <Search className="h-5 w-5 text-[#666]" />
                  <Input
                    type="search"
                    placeholder="Search schemes, services, or information..."
                    className="border-0 bg-transparent text-[#333] focus-visible:ring-0"
                  />
                </div>
                <Button className="bg-[#E31E24] text-white hover:bg-[#C91A20]">
                  Search
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                className="bg-[#E31E24] text-white hover:bg-[#C91A20]"
                onClick={() => navigate("/registration")}
              >
                Register Your Panchayat
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20"
                onClick={() => navigate("/panchayat-demo")}
              >
                View Demo
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
              { icon: Building2, value: "500+", label: "Active Panchayats", color: "#E31E24" },
              { icon: Users, value: "2.5M+", label: "Citizens Reached", color: "#FF9933" },
              { icon: FileText, value: "8,500+", label: "Schemes Implemented", color: "#138808" },
              { icon: Award, value: "98%", label: "Satisfaction Rate", color: "#6C5CE7" },
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
              Why Choose <span className="text-[#138808]">e-GramSeva</span>?
            </h2>
            <p className="mx-auto max-w-2xl text-[#666]">
              Built specifically for Indian Gram Panchayats with features that matter most for
              rural governance and citizen engagement.
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
      <section className="bg-[#DC143C] py-16 text-white lg:py-24" style={{ backgroundColor: '#DC143C' }}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Government Schemes</h2>
            <p className="mx-auto max-w-2xl text-white/90">
              Explore and apply for various government schemes available for rural development
            </p>
          </div>
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="flex gap-2 rounded-lg bg-white/10 p-2 backdrop-blur-sm">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-5 w-5 text-white" />
                <Input
                  type="search"
                  placeholder="Search schemes..."
                  className="border-0 bg-white/20 text-white placeholder:text-white/70 focus-visible:ring-0"
                />
              </div>
              <Button className="bg-white text-[#DC143C] hover:bg-white/90">
                Search
              </Button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { title: "PM Awas Yojana", description: "Housing for all by 2024", icon: Building2 },
              { title: "MGNREGA", description: "Employment guarantee scheme", icon: Briefcase },
              { title: "PM Kisan", description: "Direct income support", icon: Heart },
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
      </section>

      {/* News & Updates Section */}
      <section className="bg-white py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12">
            <h2 className="section-title inline-block">News & Updates</h2>
            <p className="text-[#666]">Latest announcements and updates from the platform</p>
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
                  <Badge className="w-fit bg-[#E31E24] text-white">Press Release</Badge>
                  <CardTitle className="text-[#1B2B5E]">New Digital Initiatives Launched</CardTitle>
                  <CardDescription className="text-[#666]">
                    Government announces new digital initiatives for rural development...
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-[#666]">
                    <Calendar className="h-4 w-4" />
                    <span>January 15, 2025</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Directories Section */}
      <section className="bg-white py-16 lg:py-24" id="panchayats">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12">
            <h2 className="section-title inline-block">Directories</h2>
            <p className="text-[#666]">Quick access to important information and services</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users2, title: "Who's Who", description: "Key personnel", color: "#E31E24" },
              { icon: Phone, title: "Contact Directory", description: "Important contacts", color: "#FF9933" },
              { icon: Globe, title: "Web Directory", description: "Related websites", color: "#138808" },
              { icon: BookOpen, title: "Resources", description: "Documents & guides", color: "#6C5CE7" },
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
      </section>

      {/* Active Panchayats */}
      <section className="bg-[#F5F5F5] py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="section-title inline-block">
              Active <span className="text-[#FF9933]">Panchayats</span>
            </h2>
            <p className="mx-auto max-w-2xl text-[#666]">
              Explore Gram Panchayats that are already using our platform to serve their communities better.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <div className="col-span-4 text-center text-[#666]">Loading panchayats...</div>
            ) : activePanchayats.length === 0 ? (
              <div className="col-span-4 text-center text-[#666]">No panchayats available</div>
            ) : (
              activePanchayats.map((panchayat, index) => (
              <Card key={index} className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer">
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FF9933]" />
                    <Badge variant="secondary" className="bg-[#F5F5F5] text-[#666]">{panchayat.district}</Badge>
                  </div>
                  <CardTitle className="text-[#1B2B5E]">{panchayat.name}</CardTitle>
                  <CardDescription className="text-[#666]">Gram Panchayat</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-sm">
                    <div>
                      <p className="text-[#666]">Active Schemes</p>
                      <p className="font-semibold text-[#138808]">{panchayat.schemes}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[#666]">Population</p>
                      <p className="font-semibold text-[#138808]">{panchayat.population.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              ))
            )}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" className="border-[#E5E5E5] text-[#1B2B5E] hover:bg-[#F5F5F5]">
              View All Panchayats
            </Button>
          </div>
        </div>
      </section>

      {/* Explore India Section - Purple Gradient */}
      <section className="bg-gradient-to-br from-[#6C5CE7] to-[#5B4B9D] py-16 text-white lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">Explore India</h2>
            <p className="mx-auto max-w-2xl text-white/90">
              Discover various categories of government services and information
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-6">
            {[
              { icon: Building2, label: "Governance" },
              { icon: FileText, label: "Schemes" },
              { icon: Users, label: "Citizens" },
              { icon: Globe, label: "Services" },
              { icon: BookOpen, label: "Resources" },
              { icon: BarChart3, label: "Data" },
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
      </section>

      {/* MyGov Connect Section - Red/Gradient */}
      <section className="bg-gradient-to-r from-[#E31E24] to-[#DC143C] py-16 text-white lg:py-24">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold text-white">MyGov Connect</h2>
            <p className="mx-auto max-w-2xl text-white/90">
              Participate in governance and share your ideas with the government
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              { icon: Lightbulb, title: "Share Ideas", description: "Contribute your suggestions" },
              { icon: Target, title: "Participate", description: "Join discussions and polls" },
              { icon: Heart, title: "Engage", description: "Connect with government initiatives" },
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
      </section>

      {/* CTA Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4 text-center lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-[#1B2B5E]">
            Ready to Get Started?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-[#666]">
            Register your Gram Panchayat today and create a digital presence that empowers your
            community and promotes transparent governance.
          </p>
          <Button
            size="lg"
            className="bg-[#E31E24] text-white hover:bg-[#C91A20]"
            onClick={() => navigate("/registration")}
          >
            Register Now - It's Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
}
