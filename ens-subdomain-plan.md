# ENS Subdomain Display - Implementation Plan

## Current Situation

The `ethcali.eth` subdomains are registered on **Base L2** via a custom L2Registrar contract at `0x7103595fc32b4072b775e9f6b438921c8cf532ed`.

### The Problem
- Event-based queries have **block range limits** (~50k blocks = ~6 hours on Base)
- Indexed strings in events are stored as **keccak256 hashes** (can't retrieve actual label directly)
- No direct "reverse lookup" function exposed in the L2Registrar ABI

### Current L2Registrar Functions
```solidity
function available(label: string) -> bool      // Check if name is available
function register(label: string, owner: address) // Register a subdomain
function registry() -> address                   // Get L2Registry contract
```

---

## Key Insights from ENSv2 Documentation

### 1. Resolution Always Starts on Mainnet
> "Even if your application only operates on an L2 like Base, ENS resolution always starts on Ethereum Mainnet."

This means we need **two clients**:
- **Base client**: For transactions and L2 operations
- **Mainnet client**: For ENS resolution

### 2. Universal Resolver (ENSv2)
The new Universal Resolver at mainnet is the canonical entry point for all ENS resolution. Using viem >= v2.35.0 handles this automatically.

### 3. CCIP Read (ERC-3668) Support
ENSv2 uses CCIP Read to delegate resolution from Mainnet to L2s or offchain. This is essential for `ethcali.eth` subdomains stored on Base.

### 4. Chain-Specific Addresses
Names can resolve to different addresses per chain. Always specify `coinType` when resolving:
```typescript
const baseAddress = await mainnetClient.getEnsAddress({
  name: 'subdomain.ethcali.eth',
  coinType: toCoinType(base.id), // 8453 for Base
});
```

---

## Approach Options

### Option A: Use Official ENS Resolution via Mainnet (RECOMMENDED for ENSv2)

Per ENSv2 docs, this is the proper way to resolve ENS names on L2s.

**Prerequisites:**
- `ethcali.eth` must have a resolver configured that supports CCIP Read
- The resolver must be able to resolve subdomains registered on Base

**Implementation:**
```typescript
import { createPublicClient, http, toCoinType } from 'viem';
import { base, mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

// Client for ENS resolution (MUST be mainnet)
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

// Forward lookup: name -> address
const address = await mainnetClient.getEnsAddress({
  name: normalize('mysubdomain.ethcali.eth'),
  coinType: toCoinType(base.id), // Get Base address specifically
});

// Reverse lookup: address -> name (for showing user's subdomain)
const name = await mainnetClient.getEnsName({
  address: userAddress,
});
```

**Pros:**
- Official ENS infrastructure
- Works with ENSv2
- Reliable and standardized

**Cons:**
- Requires `ethcali.eth` to have proper resolver setup with CCIP Read
- Reverse lookup may not work if not configured

### Option B: Hybrid LocalStorage + Event Query (Current Implementation)

**Pros:**
- Works immediately for new mints
- No dependency on mainnet resolver configuration
- Fast (localStorage is instant)

**Cons:**
- Users who minted before caching won't see their subdomain
- Data lost if user clears browser storage

**Implementation (Already Done):**
1. On successful mint: Cache `{address -> subdomain}` in localStorage
2. On lookup: Check localStorage first
3. Fallback: Query recent events (last 45k blocks)

### Option C: Query L2Registry Contract Directly on Base

**Pros:**
- Reliable on-chain data from Base
- Works for all historical mints
- No mainnet dependency

**Cons:**
- Need to discover L2Registry ABI/interface
- Need to find the reverse lookup function

**Implementation:**
1. Call `registry()` on L2Registrar to get L2Registry address
2. Query L2Registry for ownership (need function like `ownerToLabel(address)`)

---

## Recommended Strategy: Hybrid Approach

Given the complexity of ENS L2 resolution, I recommend a **layered approach**:

### Layer 1: LocalStorage Cache (Instant)
```typescript
const cached = localStorage.getItem(`ens-subdomain-${address.toLowerCase()}`);
if (cached) return cached;
```

### Layer 2: Try Official ENS Resolution via Mainnet
```typescript
try {
  const mainnetClient = createPublicClient({
    chain: mainnet,
    transport: http(getRpcUrl(CHAIN_IDS.ETHEREUM)),
  });

  // Try reverse lookup
  const name = await mainnetClient.getEnsName({ address });
  if (name?.endsWith('.ethcali.eth')) {
    const subdomain = name.replace('.ethcali.eth', '');
    localStorage.setItem(`ens-subdomain-${address.toLowerCase()}`, subdomain);
    return subdomain;
  }
} catch {
  // Resolver not configured, fall through
}
```

### Layer 3: Query Base Events (Fallback)
```typescript
// Current implementation - query recent NameRegistered events
```

### Layer 4: Manual Link Option
For users who minted before any caching:
```typescript
// UI to manually enter subdomain, verify ownership, and cache
```

---

## Implementation Steps

### Step 1: Update useUserENS.ts to Try Mainnet Resolution First

```typescript
import { createPublicClient, http } from 'viem';
import { base, mainnet } from 'viem/chains';
import { getRpcUrl } from '../../config/constants';

export function useUserENS(address: string | undefined): UserENSResult {
  // ... existing state ...

  useEffect(() => {
    if (!address) {
      setSubdomain(null);
      return;
    }

    const fetchUserENS = async () => {
      setIsLoading(true);
      try {
        // Layer 1: Check localStorage
        const cacheKey = `ens-subdomain-${address.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          setSubdomain(cached);
          return;
        }

        // Layer 2: Try mainnet ENS resolution (ENSv2 approach)
        try {
          const mainnetClient = createPublicClient({
            chain: mainnet,
            transport: http(getRpcUrl(CHAIN_IDS.ETHEREUM)),
          });

          const name = await mainnetClient.getEnsName({ address: address as `0x${string}` });
          if (name && name.endsWith('.ethcali.eth')) {
            const label = name.replace('.ethcali.eth', '');
            localStorage.setItem(cacheKey, label);
            setSubdomain(label);
            return;
          }
        } catch {
          // Mainnet resolution failed, continue to fallback
        }

        // Layer 3: Query Base events (existing implementation)
        // ... existing event query code ...

      } catch (error) {
        logger.error('[useUserENS] Query failed', error);
        setSubdomain(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserENS();
  }, [address]);

  // ... rest of hook ...
}
```

### Step 2: Add Mainnet RPC to Constants

Ensure we have a mainnet RPC configured:
```typescript
// config/constants.ts - already has this:
export const CHAIN_IDS = {
  BASE: 8453,
  ETHEREUM: 1,
  // ...
};

export function getRpcUrl(chainId: ChainId): string {
  switch (chainId) {
    case CHAIN_IDS.ETHEREUM:
      return process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com';
    // ...
  }
}
```

### Step 3: Test ENS Resolution

Test if `ethcali.eth` has proper resolver setup:
```typescript
// Test script
const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

// Check resolver for ethcali.eth
const resolver = await mainnetClient.getEnsResolver({ name: 'ethcali.eth' });
console.log('Resolver:', resolver);

// Test forward resolution
const address = await mainnetClient.getEnsAddress({ name: 'test.ethcali.eth' });
console.log('Address:', address);
```

---

## Testing Checklist

1. **Test Universal Resolver**: Resolve `ur.gtest.eth` - should return `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`
2. **Test CCIP Read**: Resolve `test.offchaindemo.eth` - should return `0x779981590E7Ccc0CFAe8040Ce7151324747cDb97`
3. **Test ethcali.eth**: Check if `ethcali.eth` has a resolver configured
4. **Test subdomain**: Try resolving a known subdomain like `yourname.ethcali.eth`

---

## Questions to Resolve

1. **Is `ethcali.eth` configured with a CCIP-Read resolver?**
   - If yes: Mainnet resolution will work
   - If no: Need to configure resolver or rely on localStorage/events

2. **What is the L2Registry contract interface?**
   - Call `registry()` on L2Registrar and inspect on BaseScan
   - Look for reverse lookup functions

3. **Is there an ENS subgraph for Base?**
   - Could query historical data without block limits

---

## Summary

| Approach | Works For | Reliability | Speed | Dependencies |
|----------|-----------|-------------|-------|--------------|
| LocalStorage | New mints | High | Instant | None |
| Mainnet ENS | All (if configured) | High | ~500ms | Resolver setup |
| Base Events | Recent (~6hr) | Medium | ~1s | RPC availability |
| L2Registry | All | High | ~500ms | ABI discovery |

**Recommended**: Start with LocalStorage + Mainnet ENS, fall back to Base events. This follows ENSv2 best practices while maintaining reliability.
