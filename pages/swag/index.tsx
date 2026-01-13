import Navigation from '../../components/Navigation';
import Layout from '../../components/shared/Layout';
import { ProductCard } from '../../components/swag/ProductCard';
import { useActiveTokenIds } from '../../hooks/useSwagStore';
import { getSupportedNetworks, useSwagAddresses } from '../../utils/network';

export default function SwagStorePage() {
  const { tokenIds, isLoading } = useActiveTokenIds();
  const networks = getSupportedNetworks();
  const { chainId } = useSwagAddresses();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-930 to-black">
      <Navigation currentChainId={chainId} />
      <Layout>
        <section className="py-10 text-center text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-400">ETH CALI</p>
          <h1 className="mt-3 text-4xl font-bold">Swag Store</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Multi-chain merch drops backed by the Swag1155 contract. Connect on Base, Ethereum, or Unichain to claim your gear with USDC.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            {networks.map((network) => (
              <span key={network.id} className="rounded-full border border-slate-700 px-4 py-1 uppercase tracking-wide">
                {network.name}
              </span>
            ))}
          </div>
        </section>

        {isLoading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center text-slate-400">
            Syncing on-chain catalog...
          </div>
        )}

        {!isLoading && tokenIds.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
            No active variants found. Ask the merch team to publish a drop.
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tokenIds.map((tokenId) => (
            <ProductCard key={tokenId.toString()} tokenId={tokenId} />
          ))}
        </div>
      </Layout>
    </div>
  );
}
