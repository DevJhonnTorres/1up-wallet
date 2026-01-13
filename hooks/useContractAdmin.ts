import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { useWallets } from '@privy-io/react-auth';
import Swag1155ABI from '../frontend/abis/Swag1155.json';
import { useSwagAddresses } from '../utils/network';
import { getChainRpc } from '../config/networks';

/**
 * Check if the connected wallet is an admin of the Swag1155 contract
 */
export function useContractAdmin() {
  const { wallets } = useWallets();
  const { swag1155, chainId } = useSwagAddresses();
  const activeWallet = wallets?.[0];
  const walletAddress = activeWallet?.address;

  const query = useQuery({
    queryKey: ['contract-admin', swag1155, chainId, walletAddress],
    queryFn: async () => {
      if (!swag1155 || !chainId || !walletAddress) {
        return false;
      }

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      try {
        const isAdmin = await client.readContract({
          address: swag1155 as `0x${string}`,
          abi: Swag1155ABI as any,
          functionName: 'isAdmin',
          args: [walletAddress as `0x${string}`],
        });

        return Boolean(isAdmin);
      } catch {
        // Fallback: check if wallet is the owner
        try {
          const owner = await (client.readContract as any)({
            address: swag1155 as `0x${string}`,
            abi: Swag1155ABI as any,
            functionName: 'owner',
          });
          return (owner as string).toLowerCase() === walletAddress.toLowerCase();
        } catch {
          return false;
        }
      }
    },
    enabled: Boolean(swag1155 && chainId && walletAddress),
    staleTime: 1000 * 60,
  });

  return {
    isAdmin: query.data ?? false,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
    walletAddress,
  };
}
