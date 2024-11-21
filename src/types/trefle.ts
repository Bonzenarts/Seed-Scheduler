export interface TreflePlant {
  id: number;
  common_name: string;
  scientific_name: string;
  family_common_name?: string;
  family: string;
  genus: string;
  image_url?: string;
  year?: number;
  bibliography?: string;
  author?: string;
  status?: string;
  rank?: string;
  observations?: string;
  vegetable?: boolean;
  edible?: boolean;
  edible_part?: string[];
  distributions?: {
    id: number;
    name: string;
    tdwg_code: string;
    tdwg_level: number;
    species_count: number;
    created_at: string;
    updated_at: string;
  }[];
  growth?: {
    description?: string;
    sowing?: string;
    days_to_harvest?: number;
    row_spacing?: {
      cm: number;
    };
    spread?: {
      cm: number;
    };
    ph_maximum?: number;
    ph_minimum?: number;
    light?: number;
    atmospheric_humidity?: number;
    growth_months?: string[];
    bloom_months?: string[];
    fruit_months?: string[];
    minimum_precipitation?: {
      mm: number;
    };
    maximum_precipitation?: {
      mm: number;
    };
    minimum_temperature?: {
      deg_c: number;
    };
    maximum_temperature?: {
      deg_c: number;
    };
    soil_nutriments?: number;
    soil_salinity?: number;
    soil_texture?: number;
    soil_humidity?: number;
  };
}

export interface TrefleApiResponse<T> {
  data: T;
  meta: {
    total: number;
    last_page: number;
    current_page: number;
    per_page: number;
    total_pages: number;
  };
  links?: {
    self: string;
    first: string;
    next?: string;
    prev?: string;
    last: string;
  };
}