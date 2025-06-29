export interface FilterParams {
  age_min?: number | string;
  age_max?: number | string;
  max_distance?: number | string;
  fame_min?: number | string;
  fame_max?: number | string;
  min_common_interests?: number | string;
  interests?: string[];
  location?: string;
  sort?: string;
}
