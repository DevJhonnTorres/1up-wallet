import React, { useState } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import dynamic from 'next/dynamic';
import Layout from '../components/shared/Layout';
import Loading from '../components/shared/Loading';
import Button from '../components/shared/Button';
import WalletInfoCyber from '../components/wallet/WalletInfoCyber';
import NetworkSwitcher from '../components/NetworkSwitcher';
import { TokenBalance, Wallet } from '../types/index';
import { useTokenBalances } from '../hooks/useTokenBalances';

// Dynamic import for KYCVerification to avoid SSR issues
const KYCVerification = dynamic(() => import('../components/KYCVerification'), {
  ssr: false,
  loading: () => <Loading text="Loading verification..." />
});

export default function Home() {
  const { login, ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const [showKYC, setShowKYC] = useState(false);
  const [isKYCVerified, setIsKYCVerified] = useState(false);
  const [currentChainId, setCurrentChainId] = useState(8453); // Default to Base

  // Get embedded wallet from Privy
  const userWallet = wallets?.[0];
  
  // Use our custom hook to fetch real balances from selected network
  const { 
    balances, 
    isLoading: isBalanceLoading, 
    refetch: refreshBalances 
  } = useTokenBalances(userWallet?.address, currentChainId);

  // Handle KYC verification completion
  const handleKYCComplete = (verified: boolean, data?: any) => {
    if (verified) {
      setIsKYCVerified(true);
      console.log('Personhood verified:', data);
      localStorage.setItem('kyc_verified', 'true');
    }
  };

  // Show loading state while Privy initializes with timeout
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  React.useEffect(() => {
    // Set a timeout to show error if Privy doesn't initialize within 10 seconds
    const timer = setTimeout(() => {
      if (!ready) {
        setLoadingTimeout(true);
        console.error('Privy initialization timeout - check NEXT_PUBLIC_PRIVY_APP_ID environment variable');
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [ready]);

  if (!ready) {
    if (loadingTimeout) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4 text-red-400">Initialization Error</h2>
            <p className="text-gray-400 mb-4">
              The wallet is taking too long to initialize. Please check:
            </p>
            <ul className="text-left text-sm text-gray-500 space-y-2 mb-4">
              <li>• Environment variables are configured correctly</li>
              <li>• NEXT_PUBLIC_PRIVY_APP_ID is set in Vercel</li>
              <li>• Network connection is stable</li>
            </ul>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return <Loading fullScreen={true} text="Loading ETH CALI Wallet..." />;
  }

  return (
    <Layout>
      {!authenticated ? (
        // Login view
        <div className="text-center py-12 px-6 bg-gray-900 rounded-lg shadow-md border border-cyan-500/30">
          <h2 className="text-2xl font-semibold mb-6 text-cyan-400 font-mono">ETHCALI_WALLET_SYSTEM</h2>
          <p className="mb-8 text-gray-400 font-mono text-sm">AUTHENTICATE_TO_ACCESS</p>
          <Button 
            onClick={login} 
            variant="primary" 
            size="large"
          >
            CONNECT_EMAIL
          </Button>
        </div>
      ) : (
        // Authenticated view
        <div className="space-y-6">
          <div className="bg-gray-900 p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-2 text-white font-mono">WELCOME_BACK</h2>
            <p className="text-cyan-400 mb-6 font-mono text-sm">
              USER: {user?.email?.address || 'Anonymous'}
            </p>

            {/* Personhood Verification Section */}
            {!isKYCVerified && (
              <div className="mb-6">
                {!showKYC ? (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-2xl mr-3">🛡️</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-yellow-400 mb-2 font-mono">
                          VERIFY_PERSONHOOD
                        </h3>
                        <p className="text-yellow-400/80 text-sm mb-3 font-mono">
                          Prove you're a unique person. Zero data leakage.
                        </p>
                        <button
                          onClick={() => setShowKYC(true)}
                          className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 rounded-md hover:bg-yellow-500/30 font-mono text-sm"
                        >
                          START_VERIFICATION
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <KYCVerification 
                    userEmail={user?.email?.address}
                    onVerificationComplete={handleKYCComplete}
                  />
                )}
              </div>
            )}

            {isKYCVerified && (
              <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">✅</span>
                  <div>
                    <h3 className="font-semibold text-green-400 font-mono">
                      PERSONHOOD_VERIFIED
                    </h3>
                    <p className="text-green-400/80 text-sm font-mono">
                      STATUS: UNIQUE_HUMAN | ACCESS: GRANTED
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {userWallet ? (
              <div className="space-y-6">
                {/* Network Switcher */}
                {/* Embedded Wallet */}
                <div className="space-y-2" key={currentChainId}>
                  <WalletInfoCyber 
                    wallet={userWallet as unknown as Wallet} 
                    balances={balances}
                    isLoading={isBalanceLoading}
                    onRefresh={refreshBalances}
                    chainId={currentChainId}
                    onChainChange={(newChainId) => {
                      console.log(`🔄 Switching to chain ${newChainId}`);
                      setCurrentChainId(newChainId);
                      setTimeout(() => refreshBalances(), 100);
                    }}
                  />
                </div>
              </div>
            ) : (
              // Loading wallet
              <div className="bg-gray-900 p-8 rounded-lg text-center shadow border border-cyan-500/30">
                <p className="mb-4 text-cyan-400 font-mono">CREATING_WALLET...</p>
                <div className="flex justify-center">
                  <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
            )}
            
            {/* Logout button */}
            <div className="mt-8 text-center">
              <button 
                onClick={logout}
                className="px-6 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-md hover:bg-red-500/20 font-mono font-medium transition"
              >
                DISCONNECT
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
