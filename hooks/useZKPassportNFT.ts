import { useState, useEffect, useRef } from 'react';
import { useWallets } from '@privy-io/react-auth';
import {
  hasNFTByAddress,
  getTokenData,
  getTokenURI,
} from '../utils/contracts';

export function useZKPassportNFT(chainId: number) {
  const { wallets } = useWallets();
  const userWallet = wallets?.[0];

  const [alreadyHasNFT, setAlreadyHasNFT] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tokenId, setTokenId] = useState<bigint | null>(null);
  const [tokenData, setTokenData] = useState<{
    uniqueIdentifier: string;
    faceMatchPassed: boolean;
    personhoodVerified: boolean;
  } | null>(null);
  const [nftMetadata, setNftMetadata] = useState<any>(null);

  const refreshNFTData = async () => {
    if (!userWallet?.address) {
      setIsLoading(false);
      setAlreadyHasNFT(false);
      return;
    }

    setIsLoading(true);
    try {
      // Simple check - does address have NFT?
      const hasToken = await hasNFTByAddress(chainId, userWallet.address);
      setAlreadyHasNFT(hasToken);
      
      if (!hasToken) {
        setTokenId(null);
        setTokenData(null);
        setNftMetadata(null);
        setIsLoading(false);
        return;
      }
    } catch (error: any) {
      // If RPC is rate limited or down, don't crash - just show loading state
      console.error('Error checking NFT ownership (RPC may be rate limited):', error?.message || error);
      // Don't set alreadyHasNFT to false on error - keep previous state
      setIsLoading(false);
      return;
    }

    // User has NFT - fetch details in background (non-blocking)
    // Card shows immediately, details load if RPC works
    const fetchDetails = async () => {
      try {
        const { getTokenIdByAddress } = await import('../utils/contracts');
        const fetchedTokenId = await getTokenIdByAddress(chainId, userWallet.address);
        
        if (fetchedTokenId) {
          setTokenId(fetchedTokenId);
          
          const [data, uri] = await Promise.all([
            getTokenData(chainId, fetchedTokenId),
            getTokenURI(chainId, fetchedTokenId),
          ]);
          
          setTokenData(data);
          
          if (uri) {
            try {
              if (uri.startsWith('data:application/json;base64,')) {
                const base64Data = uri.split(',')[1];
                const jsonData = JSON.parse(atob(base64Data));
                setNftMetadata(jsonData);
              } else if (uri.startsWith('http')) {
                const response = await fetch(uri);
                const jsonData = await response.json();
                setNftMetadata(jsonData);
              }
            } catch (err) {
              // Silent fail - metadata not critical
            }
          }
        }
      } catch (err) {
        // Silent fail - tokenId/metadata not critical, card still shows
      }
    };
    
    // Fetch details in background, don't block
    fetchDetails();
    setIsLoading(false);
  };

  // Track previous values to only fetch when they actually change
  const prevAddressRef = useRef<string | undefined>(undefined);
  const prevChainIdRef = useRef<number | undefined>(undefined);
  
  // Initial load - only when wallet/chain actually changes (not on every render)
  useEffect(() => {
    const addressChanged = userWallet?.address !== prevAddressRef.current;
    const chainChanged = chainId !== prevChainIdRef.current;
    
    if (userWallet?.address && (addressChanged || chainChanged)) {
      prevAddressRef.current = userWallet.address;
      prevChainIdRef.current = chainId;
      refreshNFTData();
    } else if (!userWallet?.address) {
      setIsLoading(false);
      prevAddressRef.current = undefined;
      prevChainIdRef.current = undefined;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, userWallet?.address]);

  return {
    alreadyHasNFT,
    isLoading,
    tokenId,
    tokenData,
    nftMetadata,
    refreshNFTData,
  };
}
