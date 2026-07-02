import { useState, useEffect } from "react";

/**
 * useMediaQuery - React hook to check if a media query matches
 * @param {string} query - CSS media query string (e.g., '(max-width: 640px)')
 * @returns {boolean} - true if the query matches, false otherwise
 */
export default function useMediaQuery(query) {
  const getMatches = (q) => {
    if (typeof window !== "undefined") {
      return window.matchMedia(q).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState(getMatches(query));

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    setMatches(media.matches);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
} 