import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, encodeFunctionData, parseAbiItem } from 'viem';
import { base, mainnet } from 'viem/chains';
import Swag1155ABI from '../frontend/abis/Swag1155.json';
import { useSwagAddresses } from '../utils/network';
import { getChainRpc } from '../config/networks';
import { getIPFSGatewayUrl } from '../lib/pinata';
import { baseUnitsToPrice, priceToBaseUnits } from '../utils/tokenGeneration';
import type { Swag1155Metadata } from '../types/swag';

export enum RedemptionStatus {
  NotRedeemed = 0,
  PendingFulfillment = 1,
  Fulfilled = 2,
}

export interface AdminVariant {
  tokenId: bigint;
  price: number;
  maxSupply: number;
  minted: number;
  active: boolean;
  uri: string;
  metadata: Swag1155Metadata | null;
}

export interface MintedNFT {
  tokenId: bigint;
  owner: string;
  balance: number;
  redemptionStatus: RedemptionStatus;
  metadata: Swag1155Metadata | null;
}

/**
 * Hook to fetch all product variants for admin management
 */
export function useAllVariants() {
  const { swag1155, chainId } = useSwagAddresses();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-all-variants', swag1155, chainId],
    queryFn: async () => {
      if (!swag1155 || !chainId) throw new Error('Missing contract address or chain ID');

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      // Get all token IDs
      const tokenIds = await (client.readContract as any)({
        address: swag1155 as `0x${string}`,
        abi: Swag1155ABI,
        functionName: 'listTokenIds',
      }) as bigint[];

      // Fetch variant data for each token ID
      const variants: AdminVariant[] = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const [variantData, uri] = await Promise.all([
            client.readContract({
              address: swag1155 as `0x${string}`,
              abi: Swag1155ABI as any,
              functionName: 'getVariant',
              args: [tokenId],
            }),
            client.readContract({
              address: swag1155 as `0x${string}`,
              abi: Swag1155ABI as any,
              functionName: 'uri',
              args: [tokenId],
            }),
          ]);

          // Handle both object and array return formats from viem
          let price: bigint, maxSupply: bigint, minted: bigint, active: boolean;
          if (Array.isArray(variantData)) {
            [price, maxSupply, minted, active] = variantData as [bigint, bigint, bigint, boolean];
          } else {
            // Struct returned as object with named properties
            const variant = variantData as { price: bigint; maxSupply: bigint; minted: bigint; active: boolean };
            price = variant.price;
            maxSupply = variant.maxSupply;
            minted = variant.minted;
            active = variant.active;
          }

          // Fetch metadata from IPFS
          let metadata: Swag1155Metadata | null = null;
          if (uri) {
            try {
              const gatewayUrl = getIPFSGatewayUrl(String(uri));
              const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(10000) });
              if (response.ok) {
                metadata = await response.json();
              }
            } catch {
              // Metadata fetch failed, continue without it
            }
          }

          return {
            tokenId,
            price: baseUnitsToPrice(price),
            maxSupply: Number(maxSupply),
            minted: Number(minted),
            active,
            uri: String(uri),
            metadata,
          };
        })
      );

      return variants;
    },
    enabled: Boolean(swag1155 && chainId),
    staleTime: 1000 * 60, // 1 minute
  });

  return {
    variants: query.data || [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

/**
 * Hook to update a variant (price, maxSupply, active status)
 */
export function useUpdateVariant() {
  const { swag1155, chainId } = useSwagAddresses();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const activeWallet = wallets?.[0];
  const isEmbedded = activeWallet?.walletClientType === 'privy';

  const updateVariant = async (
    tokenId: bigint,
    price: number,
    maxSupply: number,
    active: boolean
  ) => {
    if (!swag1155 || !chainId) {
      throw new Error('Missing contract address');
    }

    if (!activeWallet) {
      throw new Error('Wallet not connected');
    }

    const priceInUnits = priceToBaseUnits(price);

    const data = encodeFunctionData({
      abi: Swag1155ABI as any,
      functionName: 'setVariant',
      args: [tokenId, priceInUnits, BigInt(maxSupply), active],
    });

    const result = await sendTransaction({
      to: swag1155 as `0x${string}`,
      data,
      chainId,
    }, {
      address: activeWallet.address,
      sponsor: isEmbedded,
    } as any);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['admin-all-variants'] });
    queryClient.invalidateQueries({ queryKey: ['swag-variant-state'] });

    return result;
  };

  return {
    updateVariant,
    canUpdate: Boolean(swag1155 && activeWallet),
  };
}

/**
 * Hook to fetch all minted NFTs with owner information
 */
export function useAllMintedNFTs() {
  const { swag1155, chainId } = useSwagAddresses();

  const query = useQuery({
    queryKey: ['admin-minted-nfts', swag1155, chainId],
    queryFn: async () => {
      if (!swag1155 || !chainId) throw new Error('Missing contract address or chain ID');

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      // Get all token IDs first
      const tokenIds = await (client.readContract as any)({
        address: swag1155 as `0x${string}`,
        abi: Swag1155ABI,
        functionName: 'listTokenIds',
      }) as bigint[];

      // Query TransferSingle events to find all owners
      // This queries mint events (from = 0x0)
      const transferSingleEvent = parseAbiItem(
        'event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)'
      );

      const logs = await (client.getLogs as any)({
        address: swag1155 as `0x${string}`,
        event: transferSingleEvent,
        fromBlock: 0n,
        toBlock: 'latest',
      });

      // Build a map of owners per tokenId
      const ownershipMap = new Map<string, Map<string, bigint>>(); // tokenId -> (owner -> balance)

      for (const log of logs) {
        const { from, to, id, value } = log.args as {
          from: string;
          to: string;
          id: bigint;
          value: bigint;
        };

        const tokenKey = id.toString();

        if (!ownershipMap.has(tokenKey)) {
          ownershipMap.set(tokenKey, new Map());
        }

        const tokenOwners = ownershipMap.get(tokenKey)!;

        // Subtract from sender (unless mint)
        if (from !== '0x0000000000000000000000000000000000000000') {
          const currentFrom = tokenOwners.get(from.toLowerCase()) || 0n;
          tokenOwners.set(from.toLowerCase(), currentFrom - value);
        }

        // Add to receiver (unless burn)
        if (to !== '0x0000000000000000000000000000000000000000') {
          const currentTo = tokenOwners.get(to.toLowerCase()) || 0n;
          tokenOwners.set(to.toLowerCase(), currentTo + value);
        }
      }

      // Fetch metadata and redemption status for each owner/token combination
      const mintedNFTs: MintedNFT[] = [];

      for (const [tokenIdStr, owners] of ownershipMap) {
        const tokenId = BigInt(tokenIdStr);

        // Fetch URI once per token
        let metadata: Swag1155Metadata | null = null;
        try {
          const uri = await (client.readContract as any)({
            address: swag1155 as `0x${string}`,
            abi: Swag1155ABI,
            functionName: 'uri',
            args: [tokenId],
          });

          if (uri) {
            const gatewayUrl = getIPFSGatewayUrl(String(uri));
            const response = await fetch(gatewayUrl, { signal: AbortSignal.timeout(10000) });
            if (response.ok) {
              metadata = await response.json();
            }
          }
        } catch {
          // Continue without metadata
        }

        for (const [owner, balance] of owners) {
          if (balance <= 0n) continue; // Skip zero balances

          // Get redemption status
          let redemptionStatus = RedemptionStatus.NotRedeemed;
          try {
            const status = await (client.readContract as any)({
              address: swag1155 as `0x${string}`,
              abi: Swag1155ABI,
              functionName: 'getRedemptionStatus',
              args: [tokenId, owner as `0x${string}`],
            });
            redemptionStatus = Number(status) as RedemptionStatus;
          } catch {
            // Default to NotRedeemed if query fails
          }

          mintedNFTs.push({
            tokenId,
            owner,
            balance: Number(balance),
            redemptionStatus,
            metadata,
          });
        }
      }

      return mintedNFTs;
    },
    enabled: Boolean(swag1155 && chainId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  return {
    mintedNFTs: query.data || [],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

/**
 * Hook to mark a redemption as fulfilled
 */
export function useMarkFulfilled() {
  const { swag1155, chainId } = useSwagAddresses();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const activeWallet = wallets?.[0];
  const isEmbedded = activeWallet?.walletClientType === 'privy';

  const markFulfilled = async (tokenId: bigint, owner: string) => {
    if (!swag1155 || !chainId) {
      throw new Error('Missing contract address');
    }

    if (!activeWallet) {
      throw new Error('Wallet not connected');
    }

    // Check on-chain redemption status before attempting to fulfill
    const rpcUrl = getChainRpc(chainId);
    const client = createPublicClient({
      transport: http(rpcUrl),
    });

    try {
      const currentStatus = await (client.readContract as any)({
        address: swag1155 as `0x${string}`,
        abi: Swag1155ABI,
        functionName: 'getRedemptionStatus',
        args: [tokenId, owner as `0x${string}`],
      });

      const status = Number(currentStatus) as RedemptionStatus;
      
      if (status !== RedemptionStatus.PendingFulfillment) {
        const statusText = status === RedemptionStatus.Fulfilled 
          ? 'already fulfilled' 
          : status === RedemptionStatus.NotRedeemed 
            ? 'not yet redeemed' 
            : 'in an invalid state';
        throw new Error(`This redemption is ${statusText}. Current status: ${RedemptionStatus[status]}`);
      }
    } catch (error) {
      // If the error is already our custom error, rethrow it
      if (error instanceof Error && (
          error.message.includes('already fulfilled') || 
          error.message.includes('not yet redeemed') || 
          error.message.includes('invalid state')
      )) {
        throw error;
      }
      // Otherwise, log and continue - the contract will check anyway
      console.warn('Could not check redemption status before fulfillment:', error);
    }

    const data = encodeFunctionData({
      abi: Swag1155ABI as any,
      functionName: 'markFulfilled',
      args: [tokenId, owner as `0x${string}`],
    });

    const result = await sendTransaction({
      to: swag1155 as `0x${string}`,
      data,
      chainId,
    }, {
      address: activeWallet.address,
      sponsor: isEmbedded,
    } as any);

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['admin-minted-nfts'] });

    return result;
  };

  return {
    markFulfilled,
    canMarkFulfilled: Boolean(swag1155 && activeWallet),
  };
}

/**
 * Hook to get current contract settings (USDC address, Treasury address)
 */
export function useContractSettings() {
  const { swag1155, chainId } = useSwagAddresses();

  const query = useQuery({
    queryKey: ['contract-settings', swag1155, chainId],
    queryFn: async () => {
      if (!swag1155 || !chainId) throw new Error('Missing contract address or chain ID');

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      const [usdc, treasury] = await Promise.all([
        client.readContract({
          address: swag1155 as `0x${string}`,
          abi: Swag1155ABI as any,
          functionName: 'usdc',
        }) as Promise<string>,
        client.readContract({
          address: swag1155 as `0x${string}`,
          abi: Swag1155ABI as any,
          functionName: 'treasury',
        }) as Promise<string>,
      ]);

      return { usdc, treasury };
    },
    enabled: Boolean(swag1155 && chainId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    usdc: query.data?.usdc,
    treasury: query.data?.treasury,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

/**
 * Hook to set USDC payment token address
 */
export function useSetUSDC() {
  const { swag1155, chainId } = useSwagAddresses();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const activeWallet = wallets?.[0];
  const isEmbedded = activeWallet?.walletClientType === 'privy';

  const setUSDC = async (usdcAddress: string) => {
    if (!swag1155 || !chainId) {
      throw new Error('Missing contract address');
    }

    if (!activeWallet) {
      throw new Error('Wallet not connected');
    }

    const data = encodeFunctionData({
      abi: Swag1155ABI as any,
      functionName: 'setUSDC',
      args: [usdcAddress as `0x${string}`],
    });

    const result = await sendTransaction({
      to: swag1155 as `0x${string}`,
      data,
      chainId,
    }, {
      address: activeWallet.address,
      sponsor: isEmbedded,
    } as any);

    // Invalidate queries to refresh settings
    queryClient.invalidateQueries({ queryKey: ['contract-settings'] });

    return result;
  };

  return {
    setUSDC,
    canSetUSDC: Boolean(swag1155 && activeWallet),
  };
}

/**
 * Hook to set Treasury address
 */
export function useSetTreasury() {
  const { swag1155, chainId } = useSwagAddresses();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const queryClient = useQueryClient();

  const activeWallet = wallets?.[0];
  const isEmbedded = activeWallet?.walletClientType === 'privy';

  const setTreasury = async (treasuryAddress: string) => {
    if (!swag1155 || !chainId) {
      throw new Error('Missing contract address');
    }

    if (!activeWallet) {
      throw new Error('Wallet not connected');
    }

    const data = encodeFunctionData({
      abi: Swag1155ABI as any,
      functionName: 'setTreasury',
      args: [treasuryAddress as `0x${string}`],
    });

    const result = await sendTransaction({
      to: swag1155 as `0x${string}`,
      data,
      chainId,
    }, {
      address: activeWallet.address,
      sponsor: isEmbedded,
    } as any);

    // Invalidate queries to refresh settings
    queryClient.invalidateQueries({ queryKey: ['contract-settings'] });

    return result;
  };

  return {
    setTreasury,
    canSetTreasury: Boolean(swag1155 && activeWallet),
  };
}
