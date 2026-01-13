import Navigation from '../../components/Navigation';
import Layout from '../../components/shared/Layout';
import { AdminProductForm } from '../../components/swag/AdminProductForm';
import { useSwagAddresses } from '../../utils/network';

export default function SwagAdminPage() {
  const { chainId } = useSwagAddresses();

  return (
    <div className="min-h-screen bg-gray-950">
      <Navigation currentChainId={chainId} />
      <Layout>
        <section className="space-y-4 py-10 text-white">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/40 bg-purple-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-purple-200">
            Swag1155 Admin
          </div>
          <h1 className="text-4xl font-bold">Launch a Drop</h1>
          <p className="max-w-2xl text-slate-400">
            Upload metadata, set size allocations, and publish ERC-1155 variants across Base, Ethereum, or Unichain.
          </p>
        </section>
        <AdminProductForm />
      </Layout>
    </div>
  );
}
