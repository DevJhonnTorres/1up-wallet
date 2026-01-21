import { useMemo, useState, useEffect } from 'react';
import { useWallets } from '@privy-io/react-auth';
// Import addresses from frontend folder (single source of truth from deployments)
import { ADDRESSES } from '../frontend/contracts';

type ChainLabel = 'base' | 'ethereum' | 'unichain' | 'optimism';

type ChainConfig = {
  id: number;
  label: ChainLabel;
  name: string;
  swag1155: string;
  faucetManager: string;
  zkpassport: string;
  usdc: string;
  explorerUrl: string;
};

const FALLBACK_CHAIN_ID = Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID || 8453);

// Token addresses (standard tokens, not part of our deployed contracts)
// These can be overridden via .env if needed
const TOKEN_ADDRESSES: Record<ChainLabel, {
  USDC: string;
  USDT: string;
  EURC: string;
}> = {
  base: {
    USDC: process.env.NEXT_PUBLIC_USDC_BASE || '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: process.env.NEXT_PUBLIC_USDT_BASE || '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    EURC: process.env.NEXT_PUBLIC_EURC_BASE || '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42',
  },
  ethereum: {
    USDC: process.env.NEXT_PUBLIC_USDC_ETHEREUM || '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    USDT: process.env.NEXT_PUBLIC_USDT_ETHEREUM || '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    EURC: process.env.NEXT_PUBLIC_EURC_ETHEREUM || '0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c',
  },
  unichain: {
    USDC: process.env.NEXT_PUBLIC_USDC_UNICHAIN || '0x078D782b760474a361dDA0AF3839290b0EF57AD6',
    USDT: '', // Not available on Unichain
    EURC: '', // Not available on Unichain
  },
  optimism: {
    USDC: process.env.NEXT_PUBLIC_USDC_OPTIMISM || '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
    USDT: process.env.NEXT_PUBLIC_USDT_OPTIMISM || '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    EURC: '', // Not available on Optimism
  },
};

// Legacy USDC addresses for backward compatibility
const USDC_ADDRESSES: Record<ChainLabel, string> = {
  base: TOKEN_ADDRESSES.base.USDC,
  ethereum: TOKEN_ADDRESSES.ethereum.USDC,
  unichain: TOKEN_ADDRESSES.unichain.USDC,
  optimism: TOKEN_ADDRESSES.optimism.USDC,
};

// Explorer URLs per chain
const EXPLORER_URLS: Record<ChainLabel, string> = {
  base: 'https://basescan.org',
  ethereum: 'https://etherscan.io',
  unichain: 'https://explorer.unichain.org',
  optimism: 'https://optimistic.etherscan.io',
};

// Build chain configs from frontend/addresses.json (single source of truth)
const CHAIN_CONFIGS: Record<ChainLabel, ChainConfig> = {
  base: {
    id: ADDRESSES.base.chainId,
    label: 'base',
    name: 'Base',
    swag1155: ADDRESSES.base.addresses.Swag1155,
    faucetManager: ADDRESSES.base.addresses.FaucetManager,
    zkpassport: ADDRESSES.base.addresses.ZKPassportNFT,
    usdc: USDC_ADDRESSES.base,
    explorerUrl: EXPLORER_URLS.base,
  },
  ethereum: {
    id: ADDRESSES.ethereum.chainId,
    label: 'ethereum',
    name: 'Ethereum',
    swag1155: ADDRESSES.ethereum.addresses.Swag1155,
    faucetManager: ADDRESSES.ethereum.addresses.FaucetManager,
    zkpassport: ADDRESSES.ethereum.addresses.ZKPassportNFT,
    usdc: USDC_ADDRESSES.ethereum,
    explorerUrl: EXPLORER_URLS.ethereum,
  },
  unichain: {
    id: ADDRESSES.unichain.chainId,
    label: 'unichain',
    name: 'Unichain',
    swag1155: ADDRESSES.unichain.addresses.Swag1155,
    faucetManager: ADDRESSES.unichain.addresses.FaucetManager,
    zkpassport: ADDRESSES.unichain.addresses.ZKPassportNFT,
    usdc: USDC_ADDRESSES.unichain,
    explorerUrl: EXPLORER_URLS.unichain,
  },
  // Optimism not yet deployed - empty addresses
  optimism: {
    id: 10,
    label: 'optimism',
    name: 'Optimism',
    swag1155: '',
    faucetManager: '',
    zkpassport: '',
    usdc: USDC_ADDRESSES.optimism,
    explorerUrl: EXPLORER_URLS.optimism,
  },
};

const CHAIN_ID_TO_LABEL: Record<number, ChainLabel> = {
  [CHAIN_CONFIGS.base.id]: 'base',
  [CHAIN_CONFIGS.ethereum.id]: 'ethereum',
  [CHAIN_CONFIGS.unichain.id]: 'unichain',
  [CHAIN_CONFIGS.optimism.id]: 'optimism',
};

function getLabelByChainId(chainId?: number): ChainLabel {
  return chainId ? CHAIN_ID_TO_LABEL[chainId] || 'base' : 'base';
}

export function getChainConfig(chainId?: number): ChainConfig {
  const label = getLabelByChainId(chainId || FALLBACK_CHAIN_ID);
  return CHAIN_CONFIGS[label];
}

export function getSupportedNetworks(): ChainConfig[] {
  return Object.values(CHAIN_CONFIGS);
}

export function getExplorerUrl(chainId?: number): string {
  return getChainConfig(chainId).explorerUrl;
}

export function useSwagAddresses() {
  const { wallets } = useWallets();
  const activeWallet = wallets?.[0];
  const [currentChainId, setCurrentChainId] = useState<number>(FALLBACK_CHAIN_ID);

  // Parse chainId from wallet (can be string like "eip155:8453" or number)
  useEffect(() => {
    if (!activeWallet?.chainId) {
      setCurrentChainId(FALLBACK_CHAIN_ID);
      return;
    }

    let chainId: number;
    if (typeof activeWallet.chainId === 'string') {
      // Handle "eip155:8453" format
      const parts = activeWallet.chainId.split(':');
      chainId = parseInt(parts[parts.length - 1], 10);
    } else {
      chainId = activeWallet.chainId;
    }

    if (!isNaN(chainId) && chainId !== currentChainId) {
      setCurrentChainId(chainId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWallet?.chainId]);

  const config = useMemo(() => getChainConfig(currentChainId), [currentChainId]);

  return {
    chainId: config.id,
    swag1155: config.swag1155,
    faucetManager: config.faucetManager,
    zkpassport: config.zkpassport,
    usdc: config.usdc,
    explorerUrl: config.explorerUrl,
    label: config.label,
  };
}

// Get all contract addresses for a chain
export function getContractAddresses(chainId?: number) {
  const config = getChainConfig(chainId);
  return {
    swag1155: config.swag1155,
    faucetManager: config.faucetManager,
    zkpassport: config.zkpassport,
    usdc: config.usdc,
  };
}

// Get token addresses for a chain (USDC, USDT, EURC)
export function getTokenAddresses(chainId?: number): {
  USDC: string;
  USDT: string;
  EURC: string;
} {
  const label = getLabelByChainId(chainId || FALLBACK_CHAIN_ID);
  return TOKEN_ADDRESSES[label];
}
