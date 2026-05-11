export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
  role: "host" | "guest";
  avatar?: string;
  bio?: string;
}

export const users: User[] = [
  {
    id: 1,
    name: "John Doe",
    email: "john@example.com",
    username: "john123",
    phone: "123456789",
    role: "host",
    avatar: "https://example.com/avatar1.jpg",
    bio: "Loves hosting guests"
  },
  {
    id: 2,
    name: "Jane Smith",
    email: "jane@example.com",
    username: "jane456",
    phone: "987654321",
    role: "guest"
  },
  {
    id: 3,
    name: "Mike Johnson",
    email: "mike@example.com",
    username: "mike789",
    phone: "456123789",
    role: "host"
  }
];