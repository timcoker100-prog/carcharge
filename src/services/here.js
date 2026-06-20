const HERE_API_KEY = import.meta.env.VITE_HERE_API_KEY;
console.log("HERE key loaded:", HERE_API_KEY);

export async function geocodeWithHere(searchText) {
  if (!searchText?.trim()) {
    throw new Error("Please enter a place to search.");
  }

  if (!HERE_API_KEY) {
    throw new Error("Missing HERE API key.");
  }

  const url =
    `https://geocode.search.hereapi.com/v1/geocode` +
    `?q=${encodeURIComponent(searchText)}` +
    `&in=countryCode:GBR` +
    `&limit=1` +
    `&apiKey=${HERE_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("HERE geocoding failed.");
  }

  const data = await response.json();
  const first = data.items?.[0];

  if (!first?.position) {
    throw new Error("No matching place found.");
  }

  return {
    lat: first.position.lat,
    lng: first.position.lng,
    label: first.address?.label || first.title || searchText,
  };
}