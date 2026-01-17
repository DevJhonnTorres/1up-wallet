import { useQuery } from '@tanstack/react-query';
import { useSendTransaction, usePrivy, useWallets } from '@privy-io/react-auth';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import ERC20ABI from '../frontend/abis/ERC20.json';
import Swag1155ABI from '../frontend/abis/Swag1155.json';
import type { Swag1155Metadata } from '../types/swag';
import { getIPFSGatewayUrl } from '../lib/pinata';
import { baseUnitsToPrice } from '../utils/tokenGeneration';
import { useSwagAddresses } from '../utils/network';
import { getChainRpc } from '../config/networks';
import { getChainConfig } from '../utils/network';

export function useActiveTokenIds() {
  const { swag1155, chainId } = useSwagAddresses();

  const query = useQuery({
    queryKey: ['swag-token-ids', swag1155, chainId],
    queryFn: async () => {
      if (!swag1155 || !chainId) throw new Error('Missing contract address or chain ID');

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      const tokenIds = await (client.readContract as any)({
        address: swag1155 as `0x${string}`,
        abi: Swag1155ABI as any,
        functionName: 'listTokenIds',
      });

      return tokenIds as bigint[];
    },
    enabled: Boolean(swag1155 && chainId),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  return {
    tokenIds: (query.data || []) as bigint[],
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}

export function useVariantState(tokenId: bigint) {
  const { swag1155, chainId } = useSwagAddresses();
  const tokenIdStr = tokenId.toString();

  const query = useQuery({
    queryKey: ['swag-variant-state', swag1155, chainId, tokenIdStr],
    queryFn: async () => {
      if (!swag1155 || !chainId) throw new Error('Missing contract address or chain ID');

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      const variantData = await client.readContract({
        address: swag1155 as `0x${string}`,
        abi: Swag1155ABI as any,
        functionName: 'variants',
        args: [tokenId],
      });

      const [price, maxSupply, minted, active] = variantData as [bigint, bigint, bigint, boolean];
      return { price, maxSupply, minted, active };
    },
    enabled: Boolean(swag1155 && chainId),
    staleTime: 0, // Always refetch on chain change
    gcTime: 1000 * 60 * 5,
  });

  const data = query.data || { price: 0n, maxSupply: 0n, minted: 0n, active: false };

  return {
    price: baseUnitsToPrice(data.price),
    maxSupply: Number(data.maxSupply),
    minted: Number(data.minted),
    available: Number(data.maxSupply - data.minted),
    active: data.active,
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error.message : null,
  };
}

export function useVariantMetadata(tokenId: bigint) {
  const { swag1155, chainId } = useSwagAddresses();
  const tokenIdStr = tokenId.toString();

  const uriQuery = useQuery({
    queryKey: ['swag-variant-uri', swag1155, chainId, tokenIdStr],
    queryFn: async () => {
      if (!swag1155 || !chainId) throw new Error('Missing contract address or chain ID');

      const rpcUrl = getChainRpc(chainId);
      const client = createPublicClient({
        transport: http(rpcUrl),
      });

      const uri = await (client.readContract as any)({
        address: swag1155 as `0x${string}`,
        abi: Swag1155ABI as any,
        functionName: 'uri',
        args: [tokenId],
      });

      return uri as unknown as string;
    },
    enabled: Boolean(swag1155 && chainId),
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  });

  const gatewayUrl = uriQuery.data ? getIPFSGatewayUrl(uriQuery.data) : '';

  const metadataQuery = useQuery({
    queryKey: ['swag-metadata', chainId, tokenIdStr, gatewayUrl],
    queryFn: async () => {
      if (!gatewayUrl) return null;

      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(gatewayUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch metadata: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Validate response has required fields
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid metadata format');
        }

        return data;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Request timeout - IPFS gateway took too long');
        }
        throw err;
      }
    },
    enabled: Boolean(gatewayUrl),
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });

  return {
    uri: uriQuery.data,
    metadata: metadataQuery.data as Swag1155Metadata | null,
    isLoading: uriQuery.isLoading || metadataQuery.isLoading,
    error: metadataQuery.error instanceof Error ? metadataQuery.error.message : null,
  };
}

export function useBuyVariant() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();

  const activeWallet = wallets?.[0];
  const isEmbedded = activeWallet?.walletClientType === 'privy';

  // Helper to get chainId from wallet
  const getWalletChainId = (): number => {
    if (!activeWallet?.chainId) return 8453; // fallback to Base
    if (typeof activeWallet.chainId === 'string') {
      const parts = activeWallet.chainId.split(':');
      return parseInt(parts[parts.length - 1], 10);
    }
    return activeWallet.chainId;
  };

  const buy = async (tokenId: bigint, quantity: number, price: number) => {
    if (!user || !activeWallet) {
      throw new Error('Connect your wallet to continue');
    }

    // Get fresh chainId from wallet at transaction time
    const walletChainId = getWalletChainId();
    const config = getChainConfig(walletChainId);
    const { swag1155, usdc } = config;
    const chainId = config.id;

    if (!swag1155 || !usdc) {
      throw new Error(`Missing contract addresses for chain ${chainId}. Please ensure SWAG1155 is deployed on this network.`);
    }

    const totalPrice = BigInt(Math.round(price * quantity * 1_000_000));

    // Create public client with correct chain RPC from env vars
    const rpcUrl = getChainRpc(chainId);
    console.log(`[Swag Buy] Using RPC for chain ${chainId}:`, rpcUrl.includes('infura') ? 'Infura' : rpcUrl.substring(0, 30) + '...');

    const publicClient = createPublicClient({
      transport: http(rpcUrl),
    });

    // Step 1: Check current allowance first
    const currentAllowance = await publicClient.readContract({
      address: usdc as `0x${string}`,
      abi: ERC20ABI as any,
      functionName: 'allowance',
      args: [activeWallet.address as `0x${string}`, swag1155 as `0x${string}`],
    }) as unknown as bigint;

    // Only approve if current allowance is less than needed
    if (currentAllowance < totalPrice) {
      const approveData = encodeFunctionData({
        abi: ERC20ABI as any,
        functionName: 'approve',
        args: [swag1155 as `0x${string}`, totalPrice],
      });

      const approveResult = await sendTransaction({
        to: usdc as `0x${string}`,
        data: approveData,
        chainId,
      }, {
        address: activeWallet.address,
        sponsor: isEmbedded,
      } as any);

      // Wait for approval transaction to be confirmed before proceeding
      if (approveResult?.hash) {
        await publicClient.waitForTransactionReceipt({
          hash: approveResult.hash as `0x${string}`,
          confirmations: 1,
        });
      } else {
        // If no hash returned, wait a bit and verify allowance was set
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const newAllowance = await publicClient.readContract({
          address: usdc as `0x${string}`,
          abi: ERC20ABI as any,
          functionName: 'allowance',
          args: [activeWallet.address as `0x${string}`, swag1155 as `0x${string}`],
        }) as unknown as bigint;

        if (newAllowance < totalPrice) {
          throw new Error('Approval failed - please try again');
        }
      }
    }

    // Step 2: Buy tokens (only after approval is confirmed)
    const buyData = encodeFunctionData({
      abi: Swag1155ABI as any,
      functionName: 'buy',
      args: [tokenId, BigInt(quantity)],
    });

    return sendTransaction({
      to: swag1155 as `0x${string}`,
      data: buyData,
      chainId,
    }, {
      address: activeWallet.address,
      sponsor: isEmbedded,
    } as any);
  };

  // Check if buy is possible based on wallet connection
  const walletChainId = getWalletChainId();
  const currentConfig = getChainConfig(walletChainId);

  return {
    buy,
    canBuy: Boolean(user && activeWallet && currentConfig.swag1155 && currentConfig.usdc),
  };
}
