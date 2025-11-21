"use client";

import { useState, useEffect } from "react";
import { debounce } from "bytepad-utils";

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export function SearchBar({
  onSearch,
  placeholder = "Search notes...",
  debounceMs = 300,
}: SearchBarProps) {
  const [query, setQuery] = useState("");

  // Debounce search to avoid too many updates
  const debouncedSearch = debounce((searchQuery: string) => {
    onSearch(searchQuery);
  }, debounceMs);

  useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

