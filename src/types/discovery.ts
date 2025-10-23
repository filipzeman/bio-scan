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
  photoUri: string;
  createdAt: string;
  confidence?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  wikiInfo?: WikiInfo
};