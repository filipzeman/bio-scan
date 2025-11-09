export interface WikiInfo {
  title: string;
  extract: string;
  imageUrl?: string;
  scientificName?: string;
  nativeName?: string
  classification?: string[];
}

export type Discovery = {
  id: string;
  speciesName: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  confidence?: number;
  locations: Location[];
  wikiInfo?: WikiInfo
};


export type Location = {
  latitude: number;
  longitude: number;
  date: string;
}