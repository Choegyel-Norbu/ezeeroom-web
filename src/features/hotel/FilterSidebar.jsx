import React from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Home } from "lucide-react";

import { Button } from "@/shared/components/button";
import { Input } from "@/shared/components/input";
import { Label } from "@/shared/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/select";
import { Separator } from "@/shared/components/separator";
import { SearchButton } from "@/shared/components";

const FilterSidebar = ({ searchParams, setSearchParams, onSearchClick }) => {
  const handleDistrictChange = (e) => {
    setSearchParams((prev) => ({
      ...prev,
      district: e.target.value,
    }));
  };

  const handleHotelTypeChange = (value) => {
    setSearchParams((prev) => ({
      ...prev,
      hotelType: value === "ALL_TYPES" ? "" : value,
    }));
  };

  return (
    <div className="flex flex-col space-y-6">
      {/* District Search */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="district">District</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="district"
            type="text"
            placeholder="e.g., Thimphu, Paro"
            className="pl-9"
            value={searchParams.district}
            onChange={handleDistrictChange}
          />
        </div>
      </div>

      {/* Hotel Type Select */}
      <div className="grid w-full items-center gap-1.5">
        <Label htmlFor="hotelType">Hotel Type</Label>
        <Select
          value={searchParams.hotelType}
          onValueChange={handleHotelTypeChange}
        >
          <SelectTrigger id="hotelType">
            <SelectValue placeholder="Select a type" />
          </SelectTrigger>
          <SelectContent>
            {/* The value "" here correctly represents "All Types" for the backend */}
            <SelectItem value="ALL_TYPES">Select Hotel Types</SelectItem>
            <SelectItem value="Resort">Resort</SelectItem>
            <SelectItem value="Hotel">Hotel</SelectItem>
            <SelectItem value="Guesthouse">Guesthouse</SelectItem>
            <SelectItem value="Homestay">Homestay</SelectItem>
            <SelectItem value="Boutique Hotel">Boutique Hotel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search Button */}
      <SearchButton onClick={onSearchClick} className="w-full">
        Search Stays
      </SearchButton>

      <Separator />

      {/* Home Link */}
      <Button variant="ghost" asChild>
        <Link to="/" className="w-full">
          <Home className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
      </Button>
    </div>
  );
};

export default FilterSidebar;
