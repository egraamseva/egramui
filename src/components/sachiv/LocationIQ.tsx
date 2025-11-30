import { useState, useEffect, useRef } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { Label } from "recharts";
import { Input } from "../ui/input";


interface LocationResult {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

interface LocationIQAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  label?: React.ReactNode;
  id: string;
  placeholder?: string;
}

export function LocationIQAutocomplete({
  value,
  onChange,
  label,
  id,
  placeholder = "Search for location..."
}: LocationIQAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Get API key from environment variable
  const API_KEY = import.meta.env.VITE_LOCATIONIQ_API_KEY || "";

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // If value prop changes externally, update display
    if (value && !query) {
      setQuery(value);
    }
  }, [value]);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.locationiq.com/v1/autocomplete.php?key=${API_KEY}&q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=5&countrycodes=in`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch locations");
      }

      const data: LocationResult[] = await response.json();
      setResults(data);
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching locations:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search by 500ms
    debounceTimer.current = setTimeout(() => {
      searchLocations(newQuery);
    }, 500);
  };

  const handleSelectLocation = (location: LocationResult) => {
    const coordinates = `${location.lat},${location.lon}`;
    setQuery(location.display_name);
    onChange(coordinates);
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pr-10"
          autoComplete="off"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <MapPin className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
            {results.map((result) => (
              <button
                key={result.place_id}
                type="button"
                className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none transition-colors"
                onClick={() => handleSelectLocation(result)}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">
                      {result.display_name}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && !loading && results.length === 0 && query.length >= 3 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4">
            <p className="text-sm text-gray-500 text-center">No locations found</p>
          </div>
        )}
      </div>
      {value && (
        <p className="text-xs text-gray-500">
          Selected coordinates: {value}
        </p>
      )}
    </div>
  );
}
