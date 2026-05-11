export interface Listing {
  id: number;
  title: string;
  description: string;
  location: string;
  pricePerNight: number;
  guests: number;
  type: "apartment" | "house" | "villa" | "cabin";
  amenities: string[];
  rating?: number;
  host: string;
}

export const listings: Listing[] = [
  {
    id: 1,
    title: "Modern Apartment",
    description: "Nice apartment in city center",
    location: "Kigali",
    pricePerNight: 80,
    guests: 2,
    type: "apartment",
    amenities: ["WiFi", "Kitchen"],
    rating: 4.5,
    host: "John Doe"
  },
  {
    id: 2,
    title: "Luxury Villa",
    description: "Beautiful villa with pool",
    location: "Musanze",
    pricePerNight: 200,
    guests: 6,
    type: "villa",
    amenities: ["Pool", "WiFi", "Parking"],
    host: "Mike Johnson"
  },
  {
    id: 3,
    title: "Cozy Cabin",
    description: "Relaxing cabin in nature",
    location: "Rubavu",
    pricePerNight: 120,
    guests: 4,
    type: "cabin",
    amenities: ["Fireplace", "Kitchen"],
    host: "Jane Smith"
  }
];