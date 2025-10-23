export interface WikiInfo {
    title: string;
    extract: string;
    imageUrl?: string;
    scientificName?: string;
    classification?: {
        kingdom?: string;
        family?: string;
        genus?: string;
    };
}