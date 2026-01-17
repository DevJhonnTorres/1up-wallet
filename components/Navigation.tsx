import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { getChainRpc } from '../config/networks';

const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS?.toLowerCase() || '';

const SUPPORTED_CHAINS = [
  { id: 8453, name: 'Base', logo: '/chains/base_logo.svg' },
  { id: 1, name: 'Ethereum', logo: '/chains/ethereum.png' },
  { id: 10, name: 'Optimism', logo: '/chains/op mainnet.png' },
  { id: 130, name: 'Unichain', logo: '/chains/unichain.png' },
];

interface NavigationProps {
  className?: string;
  currentChainId?: number;
  onChainChange?: (chainId: number) => void;
}

const Navigation: React.FC<NavigationProps> = ({
  className = '',
  currentChainId = 8453,
  onChainChange
}) => {
  const router = useRouter();
  const { authenticated, logout, user } = usePrivy();
  const { wallets } = useWallets();
  const [displayChainId, setDisplayChainId] = useState(currentChainId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync displayChainId with prop
  useEffect(() => {
    setDisplayChainId(currentChainId);
  }, [currentChainId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const userWallet = wallets?.[0];
  
  // Check if user is admin
  const isAdmin = wallets.some(w => w.address?.toLowerCase() === ADMIN_ADDRESS);

  const navItems = [
    { href: '/wallet', label: 'WALLET' },
    { href: '/faucet', label: 'FAUCET' },
    { href: '/sybil', label: 'IDENTITY' },
    { href: '/swag', label: 'SWAG' },
    ...(isAdmin ? [{ href: '/swag/admin', label: 'ADMIN' }] : []),
  ];

  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(href + '/');
  const currentChain = SUPPORTED_CHAINS.find(c => c.id === displayChainId) || SUPPORTED_CHAINS[0];

  // Chain configurations for adding new chains (uses centralized RPC config)
  const CHAIN_CONFIGS: Record<number, any> = {
    8453: {
      chainId: '0x2105',
      chainName: 'Base',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(8453)],
      blockExplorerUrls: ['https://basescan.org'],
    },
    1: {
      chainId: '0x1',
      chainName: 'Ethereum',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(1)],
      blockExplorerUrls: ['https://etherscan.io'],
    },
    10: {
      chainId: '0xa',
      chainName: 'Optimism',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(10)],
      blockExplorerUrls: ['https://optimistic.etherscan.io'],
    },
    130: {
      chainId: '0x82',
      chainName: 'Unichain',
      nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
      rpcUrls: [getChainRpc(130)],
      blockExplorerUrls: ['https://unichain.blockscout.com'],
    },
  };

  // Helper to check if error indicates chain needs to be added
  const isChainNotFoundError = (error: any): boolean => {
    if (!error) return false;
    // Check common error codes
    if (error.code === 4902 || error.code === -32603) return true;
    // Check error message for common patterns
    const message = (error.message || '').toLowerCase();
    return (
      message.includes('unsupported chainid') ||
      message.includes('unrecognized chain') ||
      message.includes('chain not found') ||
      message.includes('unknown chain') ||
      message.includes('not supported')
    );
  };

  // Switch wallet chain
  const handleChainSwitch = async (chainId: number) => {
    if (!userWallet || isSwitching) return;
    if (chainId === displayChainId) {
      setIsDropdownOpen(false);
      return;
    }

    setIsSwitching(true);
    setIsDropdownOpen(false);

    try {
      const provider = await userWallet.getEthereumProvider();
      const chainHex = `0x${chainId.toString(16)}`;
      const chainConfig = CHAIN_CONFIGS[chainId];

      // For less common chains like Unichain, try adding first
      if (chainId === 130 && chainConfig) {
        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [chainConfig],
          });
        } catch (addError: any) {
          // Ignore if chain already exists (some wallets throw, some don't)
          if (addError.code !== 4001) {
            console.log('Chain add attempt:', addError.message);
          }
        }
      }

      try {
        // Try to switch to the chain
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainHex }],
        });
      } catch (switchError: any) {
        // If chain doesn't exist, try adding it
        if (isChainNotFoundError(switchError)) {
          if (chainConfig) {
            await provider.request({
              method: 'wallet_addEthereumChain',
              params: [chainConfig],
            });
            // After adding, some wallets auto-switch, some don't - try switching again
            try {
              await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: chainHex }],
              });
            } catch {
              // Ignore - chain was added, user may need to switch manually
            }
          } else {
            throw new Error(`Chain configuration not found for chainId ${chainId}`);
          }
        } else {
          throw switchError;
        }
      }

      // Update state after successful switch
      setDisplayChainId(chainId);
      onChainChange?.(chainId);

    } catch (error: any) {
      console.error('Error switching chain:', error);
      // Only show alert for non-user-rejected errors
      if (error.code !== 4001) {
        const chainName = SUPPORTED_CHAINS.find(c => c.id === chainId)?.name || `Chain ${chainId}`;
        // Provide more helpful message for Unichain
        if (chainId === 130) {
          alert(`Unable to switch to Unichain. Your wallet may not support this network yet. Try adding it manually in your wallet settings with RPC: https://rpc.unichain.org`);
        } else {
          alert(`Failed to switch to ${chainName}: ${error.message || 'Unknown error'}`);
        }
      }
    } finally {
      setIsSwitching(false);
    }
  };

  if (!authenticated) return null;

  return (
    <nav className={`bg-black border-b border-cyan-500/30 ${className}`}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <img 
              src="/logotethcali.png" 
              alt="ETH CALI" 
              className="h-8 w-auto"
            />
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  px-3 py-1.5 rounded-lg font-mono text-xs transition-all
                  ${isActive(item.href)
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }
                `}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Chain Switcher + User */}
          <div className="flex items-center gap-2">
            
            {/* Chain Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isSwitching}
                className={`flex items-center gap-2 px-3 py-1.5 bg-gray-900 border rounded-lg text-xs font-mono transition-all duration-200 ${
                  isSwitching
                    ? 'border-yellow-500/50 text-yellow-400'
                    : isDropdownOpen
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-gray-700 text-gray-300 hover:border-cyan-500/50'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  {isSwitching ? (
                    <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <img src={currentChain.logo} alt={currentChain.name} className="w-5 h-5 rounded-full object-contain" />
                  )}
                </div>
                <span className="hidden sm:inline">{isSwitching ? 'Switching...' : currentChain.name}</span>
                <span className={`text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {/* Dropdown Menu */}
              <div
                className={`absolute right-0 top-full mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 min-w-[160px] overflow-hidden transition-all duration-200 origin-top ${
                  isDropdownOpen
                    ? 'opacity-100 scale-100 translate-y-0'
                    : 'opacity-0 scale-95 -translate-y-1 pointer-events-none'
                }`}
              >
                {SUPPORTED_CHAINS.map((chain) => (
                  <button
                    key={chain.id}
                    onClick={() => handleChainSwitch(chain.id)}
                    disabled={isSwitching}
                    className={`w-full px-3 py-2.5 text-left text-xs font-mono flex items-center gap-2 transition-all duration-150 ${
                      displayChainId === chain.id
                        ? 'text-cyan-400 bg-cyan-500/10'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    } ${isSwitching ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                      <img src={chain.logo} alt={chain.name} className="w-5 h-5 rounded-full object-contain" />
                    </div>
                    <span className="flex-1">{chain.name}</span>
                    {displayChainId === chain.id && (
                      <span className="text-cyan-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Address */}
            {userWallet && (
              <span className="text-xs text-gray-500 font-mono hidden md:block">
                {userWallet.address.slice(0, 4)}...{userWallet.address.slice(-3)}
              </span>
            )}

            {/* Logout */}
            <button
              onClick={logout}
              className="px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs font-mono transition-all"
            >
              EXIT
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
