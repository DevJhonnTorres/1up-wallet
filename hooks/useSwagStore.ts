import { useQuery } from '@tanstack/react-query';
import { useSendTransaction, usePrivy } from '@privy-io/react-auth';
import { createPublicClient, http, encodeFunctionData } from 'viem';
import ERC20ABI from '../frontend/abis/ERC20.json';
import Swag1155ABI from '../frontend/abis/Swag1155.json';
import type { Swag1155Metadata } from '../types/swag';
import { getIPFSGatewayUrl } from '../lib/pinata';
import { baseUnitsToPrice } from '../utils/tokenGeneration';
import { useSwagAddresses } from '../utils/network';
import { getChainRpc } from '../config/networks';

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
    staleTime: 1000 * 60 * 5, // 5 min cache
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

  const query = useQuery({
    queryKey: ['swag-variant-state', swag1155, chainId, tokenId.toString()],
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
    staleTime: 1000 * 60, // 1 min cache
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

  const uriQuery = useQuery({
    queryKey: ['swag-variant-uri', swag1155, chainId, tokenId.toString()],
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
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const gatewayUrl = uriQuery.data ? getIPFSGatewayUrl(uriQuery.data) : '';

  const metadataQuery = useQuery({
    queryKey: ['swag-metadata', tokenId, gatewayUrl],
    queryFn: async () => {
      if (!gatewayUrl) return null;
      const response = await fetch(gatewayUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch metadata');
      }
      return response.json();
    },
    enabled: Boolean(gatewayUrl),
    staleTime: 1000 * 60 * 30, // 30 min cache
  });

  return {
    uri: uriQuery.data,
    metadata: metadataQuery.data as Swag1155Metadata | null,
    isLoading: uriQuery.isLoading || metadataQuery.isLoading,
    error: metadataQuery.error instanceof Error ? metadataQuery.error.message : null,
  };
}

export function useBuyVariant() {
  const { swag1155, usdc, chainId } = useSwagAddresses();
  const { user } = usePrivy();
  const { sendTransaction } = useSendTransaction();

  const buy = async (tokenId: bigint, quantity: number, price: number) => {
    if (!user) {
      throw new Error('Connect your wallet to continue');
    }
    if (!swag1155 || !usdc || !chainId) {
      throw new Error('Missing contract addresses for the selected network');
    }

    const totalPrice = BigInt(Math.round(price * quantity * 1_000_000));

    // Approve USDC spend
    const approveData = encodeFunctionData({
      abi: ERC20ABI as any,
      functionName: 'approve',
      args: [swag1155 as `0x${string}`, totalPrice],
    });

    await sendTransaction({
      to: usdc,
      data: approveData,
    }, {
      sponsor: true,
    } as any);

    // Buy tokens
    const buyData = encodeFunctionData({
      abi: Swag1155ABI as any,
      functionName: 'buy',
      args: [tokenId, BigInt(quantity)],
    });

    return sendTransaction({
      to: swag1155,
      data: buyData,
    }, {
      sponsor: true,
    } as any);
  };

  return {
    buy,
    canBuy: Boolean(user && swag1155 && usdc && chainId),
  };
}
