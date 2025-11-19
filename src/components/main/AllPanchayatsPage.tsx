import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, MapPin, Building2, Users, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { panchayatAPI } from "../../services/api";
import { toast } from "sonner";
import type { ActivePanchayat } from "../../types";

export function AllPanchayatsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [panchayats, setPanchayats] = useState<ActivePanchayat[]>([]);
  const [filteredPanchayats, setFilteredPanchayats] = useState<ActivePanchayat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanchayats = async () => {
      try {
        setLoading(true);
        const data = await panchayatAPI.getAll();
        // Filter only ACTIVE panchayats
        const active = data.filter(p => p.status === 'ACTIVE' || !p.status);
        setPanchayats(active);
        
        // Get search query from URL params and apply filter
        const urlSearch = searchParams.get('search');
        if (urlSearch) {
          setSearchQuery(urlSearch);
          const query = urlSearch.toLowerCase();
          const filtered = active.filter(
            (panchayat) =>
              panchayat.name.toLowerCase().includes(query) ||
              panchayat.district.toLowerCase().includes(query) ||
              panchayat.subdomain.toLowerCase().includes(query)
          );
          setFilteredPanchayats(filtered);
        } else {
          setFilteredPanchayats(active);
        }
      } catch (error) {
        console.error("Error fetching panchayats:", error);
        toast.error("Failed to load panchayats. Please try again later.");
        setPanchayats([]);
        setFilteredPanchayats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPanchayats();
  }, [searchParams]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredPanchayats(panchayats);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = panchayats.filter(
      (panchayat) =>
        panchayat.name.toLowerCase().includes(query) ||
        panchayat.district.toLowerCase().includes(query) ||
        panchayat.subdomain.toLowerCase().includes(query)
    );
    setFilteredPanchayats(filtered);
  }, [searchQuery, panchayats]);

  const handlePanchayatClick = (subdomain: string) => {
    navigate(`/panchayat/${subdomain}`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header Section */}
      <section className="border-b border-[#E5E5E5] bg-white">
        <div className="container mx-auto px-4 py-6 lg:px-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-4 text-[#666] hover:text-[#1B2B5E]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-[#1B2B5E] sm:text-4xl">
            All Active Panchayats
          </h1>
          <p className="text-[#666]">
            Explore and connect with Gram Panchayats across India
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:px-8">
        {/* Search Bar */}
        <div className="mb-8">
          <div className="mx-auto max-w-2xl">
            <div className="flex gap-2 rounded-lg bg-white p-2 shadow-sm border border-[#E5E5E5]">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-5 w-5 text-[#666]" />
                <Input
                  type="search"
                  placeholder="Search by name, district, or subdomain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent text-[#333] focus-visible:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-[#666]">
            {loading ? (
              "Loading panchayats..."
            ) : (
              <>
                Showing <span className="font-semibold text-[#1B2B5E]">{filteredPanchayats.length}</span>{" "}
                {filteredPanchayats.length === 1 ? "panchayat" : "panchayats"}
                {searchQuery && ` matching "${searchQuery}"`}
              </>
            )}
          </p>
        </div>

        {/* Panchayats Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#E31E24] mb-4" />
            <p className="text-[#666]">Loading panchayats...</p>
          </div>
        ) : filteredPanchayats.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-16 w-16 text-[#666] mb-4 opacity-50" />
            <p className="text-lg font-semibold text-[#1B2B5E] mb-2">
              {searchQuery ? "No panchayats found" : "No panchayats available"}
            </p>
            <p className="text-[#666]">
              {searchQuery
                ? "Try adjusting your search terms or clear the search"
                : "Check back later for active panchayats"}
            </p>
            {searchQuery && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  setFilteredPanchayats(panchayats);
                }}
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredPanchayats.map((panchayat, index) => (
              <Card
                key={panchayat.subdomain || index}
                className="border border-[#E5E5E5] bg-white shadow-sm transition-all hover:shadow-md hover:scale-105 cursor-pointer"
                onClick={() => handlePanchayatClick(panchayat.subdomain)}
              >
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#FF9933]" />
                    <Badge variant="secondary" className="bg-[#F5F5F5] text-[#666] text-xs">
                      {panchayat.district}
                    </Badge>
                  </div>
                  <CardTitle className="text-[#1B2B5E]">{panchayat.name}</CardTitle>
                  <CardDescription className="text-[#666]">
                    Gram Panchayat
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#138808]" />
                        <span className="text-sm text-[#666]">Active Schemes</span>
                      </div>
                      <span className="font-semibold text-[#138808]">{panchayat.schemes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#E31E24]" />
                        <span className="text-sm text-[#666]">Population</span>
                      </div>
                      <span className="font-semibold text-[#1B2B5E]">
                        {panchayat.population > 0 ? panchayat.population.toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <p className="text-xs text-[#666]">
                        Visit: <span className="font-medium text-[#1B2B5E]">{panchayat.subdomain}.egramseva.gov.in</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

