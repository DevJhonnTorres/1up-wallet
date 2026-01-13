import { ProductFormData, SizeOption, Swag1155Metadata } from '../types/swag';

const SIZE_TO_OFFSET: Record<SizeOption, number> = {
  S: 1,
  M: 2,
  L: 3,
  XL: 4,
  NA: 5,
};

const OFFSET_TO_SIZE: Record<number, SizeOption> = {
  1: 'S',
  2: 'M',
  3: 'L',
  4: 'XL',
  5: 'NA',
};

export function generateTokenId(baseId: number, size: SizeOption): bigint {
  return BigInt(baseId * 10 + (SIZE_TO_OFFSET[size] || 5));
}

export function parseTokenId(tokenId: bigint): { baseId: number; size: SizeOption } {
  const id = Number(tokenId);
  const sizeCode = id % 10;
  return {
    baseId: Math.floor(id / 10),
    size: OFFSET_TO_SIZE[sizeCode] || 'NA',
  };
}

export function generateMetadata(product: ProductFormData, size: SizeOption): Swag1155Metadata {
  const sizeLabel = size === 'NA' ? 'One Size' : size;
  return {
    name: `${product.name} - ${product.traits.color} - ${sizeLabel}`,
    description: product.description,
    image: product.imageUri,
    attributes: [
      { trait_type: 'Product', value: product.name },
      { trait_type: 'Color', value: product.traits.color || 'N/A' },
      { trait_type: 'Gender', value: product.traits.gender },
      { trait_type: 'Style', value: product.traits.style || 'N/A' },
      { trait_type: 'Size', value: sizeLabel },
    ],
  };
}

export function priceToBaseUnits(decimalPrice: number): bigint {
  return BigInt(Math.round(decimalPrice * 1e6));
}

export function baseUnitsToPrice(baseUnits: bigint): number {
  return Number(baseUnits) / 1e6;
}

export function calculateSupplyPerSize(totalSupply: number, sizes: SizeOption[]): number {
  if (sizes.length === 0) return 0;
  return Math.floor(totalSupply / sizes.length);
}
