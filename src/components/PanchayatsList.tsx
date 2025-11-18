/**
 * Panchayats List Page Component
 * Displays all registered panchayats with search functionality
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, FileText, Loader2, Building2 } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { panchayatAPI } from '../services/api';
import type { ActivePanchayat } from '../types';
import { toast } from 'sonner';

export function PanchayatsList() {
  const [panchayats, setPanchayats] = useState<ActivePanchayat[]>([]);
  const [filteredPanchayats, setFilteredPanchayats] = useState<ActivePanchayat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPanchayats();
  }, []);

  useEffect(() => {
    // Filter panchayats based on search query
    if (searchQuery.trim() === '') {
      setFilteredPanchayats(panchayats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = panchayats.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.district.toLowerCase().includes(query)
      );
      setFilteredPanchayats(filtered);
    }
  }, [searchQuery, panchayats]);

  const fetchPanchayats = async () => {
    try {
      setLoading(true);
      const data = await panchayatAPI.getAll();
      setPanchayats(data);
      setFilteredPanchayats(data);
    } catch (error) {
      console.error('Error fetching panchayats:', error);
      toast.error('Failed to load panchayats');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF9933]/5 via-white to-[#138808]/5">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#FF9933] to-[#FF9933]/80 py-16 text-white">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="mb-4 text-4xl font-bold md:text-5xl">
              All Registered Panchayats
            </h1>
            <p className="text-lg text-white/90">
              Explore digital panchayats across India empowered by e-GramSeva
            </p>
          </div>
        </div>
      </section>

      {/* Search and Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-6 lg:px-8">
          {/* Search Bar */}
          <div className="mb-10">
            <div className="mx-auto max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by panchayat name or district..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-14 pl-12 pr-4 text-base shadow-md"
                />
              </div>
              {searchQuery && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Found {filteredPanchayats.length} panchayat{filteredPanchayats.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-[#FF9933]" />
              <p className="mt-4 text-muted-foreground">Loading panchayats...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && filteredPanchayats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <Building2 className="h-16 w-16 text-muted-foreground/50" />
              <h3 className="mt-4 text-xl font-semibold text-foreground">
                {searchQuery ? 'No panchayats found' : 'No panchayats registered yet'}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Be the first to register your panchayat'}
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-6"
                >
                  Clear Search
                </Button>
              )}
            </div>
          )}

          {/* Panchayats Grid */}
          {!loading && filteredPanchayats.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPanchayats.map((panchayat, index) => (
                <Card
                  key={index}
                  className="group cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02]"
                  onClick={() => navigate('/')}
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-[#FF9933] to-[#FF9933]/70 text-white shadow-md">
                        <Building2 className="h-6 w-6" />
                      </div>
                    </div>

                    <h3 className="mb-2 text-xl font-bold text-[#138808] group-hover:text-[#FF9933] transition-colors">
                      {panchayat.name}
                    </h3>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 text-[#FF9933]" />
                        <span>{panchayat.district}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4 text-[#138808]" />
                        <span>Population: {panchayat.population.toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <FileText className="h-4 w-4 text-[#FF9933]" />
                        <span>{panchayat.schemes} Active Schemes</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full text-[#FF9933] hover:bg-[#FF9933]/10 hover:text-[#FF9933] font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/');
                        }}
                      >
                        View Details →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Stats Summary */}
          {!loading && filteredPanchayats.length > 0 && (
            <div className="mt-12 rounded-lg border-2 border-[#FF9933]/20 bg-gradient-to-r from-[#FF9933]/5 to-[#138808]/5 p-8">
              <div className="grid gap-6 sm:grid-cols-3 text-center">
                <div>
                  <p className="text-3xl font-bold text-[#FF9933]">
                    {filteredPanchayats.length}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Total Panchayats
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#138808]">
                    {filteredPanchayats.reduce((sum, p) => sum + p.population, 0).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Total Population
                  </p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#FF9933]">
                    {filteredPanchayats.reduce((sum, p) => sum + p.schemes, 0)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Active Schemes
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}


