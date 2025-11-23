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
import { useTranslation } from "react-i18next";

export function AllPanchayatsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [panchayats, setPanchayats] = useState<ActivePanchayat[]>([]);
  const [filteredPanchayats, setFilteredPanchayats] = useState<ActivePanchayat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

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
        toast.error(t('notifications.loadPanchayatsError'));
        setPanchayats([]);
        setFilteredPanchayats([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPanchayats();
  }, [searchParams, t]);

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
            {t('common.backToHome')}
          </Button>
          <h1 className="mb-2 text-3xl font-bold text-[#1B2B5E] sm:text-4xl">
            {t('allPanchayats.title')}
          </h1>
          <p className="text-[#666]">
            {t('allPanchayats.subtitle')}
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
                  placeholder={t('allPanchayats.searchPlaceholder')}
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
              t('allPanchayats.loading')
            ) : (
              <>
                {t('allPanchayats.showing')} <span className="font-semibold text-[#1B2B5E]">{filteredPanchayats.length}</span>{" "}
                {filteredPanchayats.length === 1 ? t('allPanchayats.panchayat') : t('allPanchayats.panchayats')}
                {searchQuery && ` ${t('allPanchayats.matching')} "${searchQuery}"`}
              </>
            )}
          </p>
        </div>

        {/* Panchayats Grid */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#E31E24] mb-4" />
            <p className="text-[#666]">{t('allPanchayats.loading')}</p>
          </div>
        ) : filteredPanchayats.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-16 w-16 text-[#666] mb-4 opacity-50" />
            <p className="text-lg font-semibold text-[#1B2B5E] mb-2">
              {searchQuery ? t('allPanchayats.noResults') : t('allPanchayats.noAvailable')}
            </p>
            <p className="text-[#666]">
              {searchQuery
                ? t('allPanchayats.tryAdjusting')
                : t('allPanchayats.checkBack')}
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
                {t('allPanchayats.clearSearch')}
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
                    {t('allPanchayats.gramPanchayat')}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-[#138808]" />
                        <span className="text-sm text-[#666]">{t('allPanchayats.activeSchemes')}</span>
                      </div>
                      <span className="font-semibold text-[#138808]">{panchayat.schemes || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-[#E31E24]" />
                        <span className="text-sm text-[#666]">{t('allPanchayats.population')}</span>
                      </div>
                      <span className="font-semibold text-[#1B2B5E]">
                        {panchayat.population > 0 ? panchayat.population.toLocaleString() : t('common.notAvailable')}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-[#E5E5E5]">
                      <p className="text-xs text-[#666]">
                        {t('allPanchayats.visit')}: <span className="font-medium text-[#1B2B5E]">{panchayat.subdomain}.egramseva.gov.in</span>
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

