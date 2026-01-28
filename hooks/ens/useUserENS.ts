/**
 * useUserENS - Hook for querying user's ENS subdomain
 *
 * Resolution Strategy (Layered Approach per ENSv2 best practices):
 * 1. Layer 1: Check localStorage cache (instant)
 * 2. Layer 2: Try mainnet ENS reverse resolution (ENSv2 standard)
 * 3. Layer 3: Query Base L2 events (fallback for recent mints)
 */
import { useState, useEffect } from 'react';
import { createPublicClient, http, parseAbiItem } from 'viem';
import { base, mainnet } from 'viem/chains';
import { ENS_REGISTRAR_ADDRESSES, ENS_CONFIG, CHAIN_IDS, getRpcUrl } from '../../config/constants';
import { logger } from '../../utils/logger';

interface UserENSResult {
  subdomain: string | null;
  fullName: string | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useUserENS(address: string | undefined): UserENSResult {
  const [subdomain, setSubdomain] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  useEffect(() => {
    if (!address) {
      setSubdomain(null);
      return;
    }

    const fetchUserENS = async () => {
      setIsLoading(true);
      const cacheKey = `ens-subdomain-${address.toLowerCase()}`;

      try {
        // ============================================
        // Layer 1: Check localStorage cache (instant)
        // ============================================
        const cachedSubdomain = localStorage.getItem(cacheKey);
        if (cachedSubdomain) {
          logger.info('[useUserENS] Layer 1: Found cached subdomain', { subdomain: cachedSubdomain });
          setSubdomain(cachedSubdomain);
          setIsLoading(false);
          return;
        }

        // ============================================
        // Layer 2: Try mainnet ENS reverse resolution
        // Per ENSv2: "Resolution always starts on Ethereum Mainnet"
        // ============================================
        try {
          const mainnetClient = createPublicClient({
            chain: mainnet,
            transport: http(getRpcUrl(CHAIN_IDS.ETHEREUM)),
          });

          // Reverse lookup: address -> name
          const ensName = await mainnetClient.getEnsName({
            address: address as `0x${string}`,
          });

          // Check if it's an ethcali.eth subdomain
          if (ensName && ensName.endsWith(`.${ENS_CONFIG.parentName}`)) {
            const label = ensName.replace(`.${ENS_CONFIG.parentName}`, '');

            // Cache for future lookups
            try {
              localStorage.setItem(cacheKey, label);
            } catch {
              // Ignore storage errors
            }

            logger.info('[useUserENS] Layer 2: Found subdomain via mainnet ENS', { label });
            setSubdomain(label);
            setIsLoading(false);
            return;
          }
        } catch (mainnetError) {
          // Mainnet resolution failed (resolver not configured or network error)
          // This is expected if ethcali.eth doesn't have CCIP-Read resolver set up
          logger.debug('[useUserENS] Layer 2: Mainnet resolution failed, trying Layer 3', mainnetError);
        }

        // ============================================
        // Layer 3: Query Base L2 events (fallback)
        // Limited to recent ~45k blocks due to RPC limits
        // ============================================
        const baseClient = createPublicClient({
          chain: base,
          transport: http(getRpcUrl(CHAIN_IDS.BASE)),
        });

        const registrarAddress = ENS_REGISTRAR_ADDRESSES[CHAIN_IDS.BASE];
        if (!registrarAddress) {
          logger.error('[useUserENS] No registrar address for Base');
          setSubdomain(null);
          return;
        }

        // Query recent blocks only (RPC limit ~50k blocks)
        const currentBlock = await baseClient.getBlockNumber();
        const fromBlock = currentBlock > 45000n ? currentBlock - 45000n : 0n;

        const logs = await baseClient.getLogs({
          address: registrarAddress as `0x${string}`,
          event: parseAbiItem('event NameRegistered(string indexed label, address indexed owner)'),
          args: {
            owner: address as `0x${string}`,
          },
          fromBlock,
          toBlock: 'latest',
        });

        if (logs.length > 0) {
          // Get the most recent registration
          const latestLog = logs[logs.length - 1];
          const txHash = latestLog.transactionHash;

          if (txHash) {
            const tx = await baseClient.getTransaction({ hash: txHash });
            if (tx && tx.input) {
              try {
                // Decode register(string label, address owner) call
                const inputData = tx.input.slice(10);
                const stringOffset = parseInt(inputData.slice(0, 64), 16);
                const stringLengthHex = inputData.slice(stringOffset * 2, stringOffset * 2 + 64);
                const stringLength = parseInt(stringLengthHex, 16);
                const stringDataHex = inputData.slice(stringOffset * 2 + 64, stringOffset * 2 + 64 + stringLength * 2);
                const label = Buffer.from(stringDataHex, 'hex').toString('utf8');

                // Cache for future lookups
                try {
                  localStorage.setItem(cacheKey, label);
                } catch {
                  // Ignore storage errors
                }

                logger.info('[useUserENS] Layer 3: Found subdomain from Base events', { label });
                setSubdomain(label);
                return;
              } catch (decodeError) {
                logger.error('[useUserENS] Layer 3: Failed to decode label from tx', decodeError);
              }
            }
          }
        }

        // No subdomain found in any layer
        setSubdomain(null);
      } catch (error) {
        logger.error('[useUserENS] Query failed', error);
        setSubdomain(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserENS();
  }, [address, fetchTrigger]);

  const refetch = () => setFetchTrigger(prev => prev + 1);

  return {
    subdomain,
    fullName: subdomain ? `${subdomain}.${ENS_CONFIG.parentName}` : null,
    isLoading,
    refetch,
  };
}
