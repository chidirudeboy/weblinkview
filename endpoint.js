export const baseUrl = "https://api.africartz.com/api";

// Function to generate endpoint URLs dynamically
export const endpoint = (path) => `${baseUrl}/${path}`;

// Export the specific API function for fetching apartment details
export const getApartmentDetails = (apartmentId) => endpoint(`apartment/${apartmentId}`);