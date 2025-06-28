export const getPlaceSuggestion = async (input: string, location: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(
      input
    )}&location=${encodeURIComponent(location)}&radius=10000&key=${
      process.env.GOOGLE_MAPS_API_KEY
    }`;
    const response = await fetch(url);
    const results = await response.json();

    if (results.status === "OK") {
      return results.results;
    } else {
      return "No results found";
    }
  } catch (e) {
    console.log("errx", e);
    return "No results found";
  }
};
