export type SizeOption = 'S' | 'M' | 'L' | 'XL' | 'NA';
export type GenderOption = 'Male' | 'Female' | 'Unisex';

export interface ProductTraits {
  gender: GenderOption;
  color: string;
  style: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  imageUri: string;
  price: number;
  totalSupply: number;
  traits: ProductTraits;
  sizes: SizeOption[];
}

export interface Swag1155MetadataAttribute {
  trait_type: 'Product' | 'Color' | 'Gender' | 'Style' | 'Size';
  value: string;
}

export interface Swag1155Metadata {
  name: string;
  description: string;
  image: string;
  attributes?: Swag1155MetadataAttribute[];
}

export interface VariantState {
  price: bigint;
  maxSupply: bigint;
  minted: bigint;
  active: boolean;
  uri: string;
}
