import { useWallets } from '@privy-io/react-auth';
import { useMemo } from 'react';

/**
 * Hook to get the active embedded wallet
 * This app only supports embedded wallets (email + passkey auth)
 */
export function useActiveWallet() {
  const { wallets, ready } = useWallets();

  const wallet = useMemo(() => {
    if (!wallets || wallets.length === 0) return null;
    return wallets[0];
  }, [wallets]);

  return {
    wallet,
    wallets,
    ready,
    address: wallet?.address,
    walletClientType: wallet?.walletClientType,
  };
}

/**
 * Helper to check if an address matches any connected wallet
 */
export function useIsConnectedAddress(targetAddress: string | undefined) {
  const { wallets, ready } = useWallets();

  const isConnected = useMemo(() => {
    if (!targetAddress || !wallets || wallets.length === 0) return false;
    return wallets.some(
      w => w.address?.toLowerCase() === targetAddress.toLowerCase()
    );
  }, [wallets, targetAddress]);

  return { isConnected, ready };
}
