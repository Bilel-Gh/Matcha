export interface User {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  age: number;
  birth_date?: string;
  city: string;
  country: string;
  profile_picture_url: string;
  biography: string;
  distance_km: number;
  fame_rating: number;
  common_interests: number;
  common_interests_count?: number;
  common_interests_names?: string[];
  is_online?: boolean;
  last_connection?: string;
  match_date?: string;
}
