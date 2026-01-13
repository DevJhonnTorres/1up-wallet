import { useState } from 'react';
import { useBuyVariant, useVariantMetadata, useVariantState } from '../../hooks/useSwagStore';
import { getIPFSGatewayUrl } from '../../lib/pinata';
import type { Swag1155MetadataAttribute } from '../../types/swag';

interface ProductCardProps {
  tokenId: bigint;
}

export function ProductCard({ tokenId }: ProductCardProps) {
  const { price, available, active, isLoading: isStateLoading } = useVariantState(tokenId);
  const { metadata, isLoading: isMetadataLoading } = useVariantMetadata(tokenId);
  const { buy, canBuy } = useBuyVariant();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  const isLoading = isStateLoading || isMetadataLoading;

  const handleBuy = async () => {
    if (!metadata || !active || !canBuy) return;
    setPending(true);
    try {
      await buy(tokenId, quantity, price);
    } catch (error) {
      console.error(error);
    } finally {
      setPending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-500">
        Loading variant {tokenId.toString()}...
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
        Missing metadata for token {tokenId.toString()}
      </div>
    );
  }

  const imageUrl = getIPFSGatewayUrl(metadata.image || '') || '/logo_eth_cali.png';

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-2xl">
      <div className="aspect-square w-full overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
        <img src={imageUrl} alt={metadata.name} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">{metadata.name}</h3>
          <span className="text-sm text-slate-400">#{tokenId.toString()}</span>
        </div>
        <p className="text-sm text-slate-400">{metadata.description}</p>
        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          {metadata.attributes?.map((attr: Swag1155MetadataAttribute) => (
            <span key={attr.trait_type} className="rounded-full border border-slate-800 px-3 py-1">
              {attr.trait_type}: {attr.value}
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-4">
        <div>
          <p className="text-sm text-slate-400">Price</p>
          <p className="text-2xl font-semibold text-white">{price.toFixed(2)} USDC</p>
        </div>
        <div>
          <p className="text-sm text-slate-400">Availability</p>
          <p className={`text-lg font-semibold ${available > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {available > 0 ? `${available} left` : 'Sold out'}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="number"
          min="1"
          max={available}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="h-12 w-20 rounded-xl border border-slate-700 bg-slate-900/80 p-2 text-center text-white focus:border-cyan-400 focus:outline-none"
          disabled={!active || pending}
        />
        <button
          type="button"
          onClick={handleBuy}
          disabled={!active || pending || !canBuy || available === 0}
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 p-3 text-center text-base font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? 'Processing...' : 'Buy now'}
        </button>
      </div>
    </article>
  );
}
