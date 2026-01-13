import { useState } from 'react';
import { useSendTransaction, useWallets } from '@privy-io/react-auth';
import { usePrivy } from '@privy-io/react-auth';
import { encodeFunctionData } from 'viem';
import Swag1155ABI from '../frontend/abis/Swag1155.json';
import { pinMetadataToIPFS } from '../lib/pinata';
import { ProductFormData, SizeOption } from '../types/swag';
import { useSwagAddresses } from '../utils/network';
import {
  calculateSupplyPerSize,
  generateMetadata,
  generateTokenId,
  priceToBaseUnits,
} from '../utils/tokenGeneration';

type CreationState = {
  isLoading: boolean;
  error: string | null;
  progress: number;
  currentStep: 'idle' | 'creating-variants' | 'complete';
};

const INITIAL_STATE: CreationState = {
  isLoading: false,
  error: null,
  progress: 0,
  currentStep: 'idle',
};

export function useProductCreation() {
  const { swag1155, chainId: expectedChainId, label: chainLabel } = useSwagAddresses();
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const [state, setState] = useState<CreationState>(INITIAL_STATE);

  // Get the first wallet (the one the user logged in with)
  const activeWallet = wallets?.[0];

  // Helper to ensure wallet is on the correct chain
  const ensureCorrectChain = async () => {
    if (!activeWallet) return false;
    
    const walletChainId = typeof activeWallet.chainId === 'string' 
      ? parseInt(activeWallet.chainId, 10) 
      : activeWallet.chainId;
    
    if (walletChainId !== expectedChainId) {
      try {
        await activeWallet.switchChain(expectedChainId);
        return true;
      } catch (error) {
        throw new Error(`Please switch your wallet to ${chainLabel} (chain ID: ${expectedChainId})`);
      }
    }
    return true;
  };

  const createProduct = async (product: ProductFormData) => {
    if (!swag1155) {
      throw new Error('Missing Swag1155 address for the selected chain');
    }

    if (!user || !activeWallet) {
      throw new Error('Connect your wallet to create a product');
    }

    await ensureCorrectChain();

    if (!product.sizes.length) {
      throw new Error('Select at least one size');
    }

    setState({ isLoading: true, error: null, progress: 0, currentStep: 'creating-variants' });

    try {
      const baseId = Date.now() % 1_000_000;
      const supplyPerSize = calculateSupplyPerSize(product.totalSupply, product.sizes);
      const priceBaseUnits = priceToBaseUnits(product.price);

      if (!supplyPerSize) {
        throw new Error('Total supply must be greater than zero');
      }

      for (let i = 0; i < product.sizes.length; i += 1) {
        const size: SizeOption = product.sizes[i];
        const tokenId = generateTokenId(baseId, size);
        const metadata = generateMetadata(product, size);
        const metadataUri = await pinMetadataToIPFS(metadata);

        const data = encodeFunctionData({
          abi: Swag1155ABI as any,
          functionName: 'setVariantWithURI',
          args: [tokenId, priceBaseUnits, BigInt(supplyPerSize), true, metadataUri],
        });

        const isEmbedded = activeWallet.walletClientType === 'privy';
        
        await sendTransaction({
          to: swag1155 as `0x${string}`,
          data,
          chainId: expectedChainId,
        }, {
          address: activeWallet.address,
          sponsor: isEmbedded,
        } as any);

        setState((prev) => ({
          ...prev,
          progress: Math.min(100, Math.round(((i + 1) / product.sizes.length) * 100)),
        }));
      }

      setState({ isLoading: false, error: null, progress: 100, currentStep: 'complete' });
      return { baseId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error while creating product';
      setState({ isLoading: false, error: message, progress: 0, currentStep: 'idle' });
      throw error;
    }
  };

  return {
    createProduct,
    canCreate: Boolean(user && swag1155 && activeWallet),
    walletAddress: activeWallet?.address,
    expectedChainId,
    chainLabel,
    ...state,
  };
}
