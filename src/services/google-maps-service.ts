export const getPlaceSuggestion = async (input: string, location: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?keyword=${encodeURIComponent(
      input
    )}&location=${encodeURIComponent(location)}&radius=100000&key=${
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

export const getPlaceDetails = async (placeId: string) => {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    const response = await fetch(url);
    const result = await response.json();

    console.log("Place Details API Response:", result);

    if (result.status === "OK") {
      const { lat, lng } = result.result.geometry.location;
      return { latitude: lat, longitude: lng };
    } else {
      console.error("Error:", result.status, result.error_message);
      return "Location not found";
    }
  } catch (e) {
    console.error("Fetch error:", e);
    return "Location not found";
  }
};
