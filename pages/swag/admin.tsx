import { useWallets } from '@privy-io/react-auth';
import Navigation from '../../components/Navigation';
import Layout from '../../components/shared/Layout';
import { AdminProductForm } from '../../components/swag/AdminProductForm';
import { AdminManagement } from '../../components/swag/AdminManagement';
import { useSwagAddresses } from '../../utils/network';
import { useContractAdmin } from '../../hooks/useContractAdmin';

export default function SwagAdminPage() {
  const { chainId, swag1155 } = useSwagAddresses();
  const { ready } = useWallets();
  const { isAdmin, isLoading: isCheckingAdmin, walletAddress } = useContractAdmin();

  if (!ready || isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation currentChainId={chainId} />
        <Layout>
          <div className="flex items-center justify-center py-20">
            <div className="text-white">Verifying admin access...</div>
          </div>
        </Layout>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navigation currentChainId={chainId} />
        <Layout>
          <div className="flex flex-col items-center justify-center py-20">
            <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-6 py-4 text-center">
              <h1 className="mb-2 text-xl font-bold text-red-300">Access Denied</h1>
              <p className="text-red-200 mb-4">
                Only contract admins can access this page.
              </p>
              <p className="text-xs text-gray-400 mb-2">Contract: {swag1155}</p>
              <div className="mt-3 text-xs text-red-300/60">
                <p className="mb-1">Your wallet: {walletAddress || 'Not connected'}</p>
                <p className="text-gray-500">
                  Ask the contract owner to add your address as an admin.
                </p>
              </div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

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
        
        <div className="space-y-8">
          <AdminProductForm />
          <AdminManagement />
        </div>
      </Layout>
    </div>
  );
}
