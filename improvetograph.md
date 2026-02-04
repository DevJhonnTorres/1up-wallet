RPC Optimization & The Graph Integration Plan                           
                                                                         
 Overview                                               

 Comprehensive optimization to:
 1. Deploy The Graph subgraph for indexed blockchain data
 2. Reduce RPC calls by replacing event queries with GraphQL
 3. Fix ProductCard loading with proper caching
 4. Batch remaining RPC calls with multicall

 ---
 The Graph Strategy

 Contracts to Index
 Contract: Swag1155
 Events to Index: Purchased, PurchasedBatch, TransferSingle, Redeemed
 Use Cases: NFT ownership, minted items, redemption status
 ────────────────────────────────────────
 Contract: FaucetManager
 Events to Index: VaultCreated, Claimed, Returned
 Use Cases: Vault stats, user claims
 ────────────────────────────────────────
 Contract: ZKPassportNFT
 Events to Index: NFTMinted
 Use Cases: User passport data
 ────────────────────────────────────────
 Contract: L2Registrar
 Events to Index: NameRegistered
 Use Cases: ENS subdomain lookups
 Subgraph Benefits

 - No block limits - query entire history instantly
 - Pre-aggregated data - ownership maps, totals
 - Real-time updates - auto-syncs on new blocks
 - Single GraphQL call - replaces multiple RPC calls

 Deployment: Subgraph Studio

 - URL: https://thegraph.com/studio
 - Network: Base Mainnet (chain ID 8453)
 - Free tier: 100k queries/month
 - Steps: Create account -> Create subgraph -> Deploy -> Get API key

 ---
 Phase 1: Create Reusable Public Client Hook (Foundation)

 Problem: 15+ hooks each create new createPublicClient instances on
 every call.

 File to Create: hooks/usePublicClient.ts

 // Module-level cache for clients per chain
 const clientCache = new Map<number, PublicClient>();

 export function getPublicClient(chainId: number): PublicClient {
   if (!clientCache.has(chainId)) {
     clientCache.set(chainId, createPublicClient({
       chain: getChainForId(chainId),
       transport: http(getChainRpc(chainId)),
       batch: { multicall: true }, // Enable auto-batching
     }));
   }
   return clientCache.get(chainId)!;
 }

 export function usePublicClient(chainId: number): PublicClient {
   return useMemo(() => getPublicClient(chainId), [chainId]);
 }

 Export from: hooks/index.ts (if exists) or use directly

 ---
 Phase 2: Fix ProductCard Loading Flashes (Quick Wins)

 2A: Convert useVariantMetadata to React Query

 File: hooks/swag/useVariantQueries.ts (add new hook)

 Problem: ProductCard.tsx lines 18-32 fetch metadata in render body
 using setState.

 Solution: Add proper React Query hook:
 export function useVariantMetadata(uri: string) {
   return useQuery({
     queryKey: ['swag-variant-metadata', uri],
     queryFn: async () => {
       const url = getIPFSGatewayUrl(uri) || uri;
       const response = await fetch(url);
       return response.json() as Promise<Swag1155Metadata>;
     },
     enabled: Boolean(uri),
     staleTime: 1000 * 60 * 60, // 1 hour - metadata rarely changes
     gcTime: 1000 * 60 * 60 * 24, // 24 hours
   });
 }

 Update: components/swag/ProductCard.tsx to use the new hook.

 2B: Fix useVariantRemaining staleTime

 File: hooks/swag/useVariantQueries.ts (line ~105)

 Change:
 // OLD: staleTime: 0 - causes refetch every render
 // NEW:
 staleTime: 1000 * 10, // 10 seconds - inventory changes but not
 constantly

 2C: Update hooks/swag/index.ts barrel export

 Add useVariantMetadata to exports.

 ---
 Phase 4: Batch RPC Calls with Multicall

 4A: Fix useBuyBatch Sequential Price Fetching

 File: hooks/useSwagStore.ts (lines ~180-188)

 Problem: Loops sequentially through tokenIds fetching prices.

 Solution:
 // Batch all getDiscountedPrice calls in one multicall
 const priceResults = await client.multicall({
   contracts: tokenIds.map(tokenId => ({
     address: contractAddr,
     abi: Swag1155ABI,
     functionName: 'getDiscountedPrice',
     args: [BigInt(tokenId), walletAddress],
   })),
 });

 4B: Fix useMintedNFTs Sequential Redemption Status

 File: hooks/swag/useMintedNFTs.ts (lines ~107-135)

 Problem: Sequential readContract calls for each owner/token pair.

 Solution: Collect all pairs, batch with multicall:
 const statusResults = await client.multicall({
   contracts: statusCalls.map(({ tokenId, owner }) => ({
     address: designAddress,
     abi: Swag1155ABI,
     functionName: 'getDesignTokenRedemptionStatus',
     args: [tokenId, owner],
   })),
 });

 ---
 Phase 5: Convert useState Hooks to React Query

 5A: useTokenPrices

 File: hooks/useTokenPrices.ts

 Change: Replace useState/useEffect/setInterval with:
 const query = useQuery({
   queryKey: ['token-prices'],
   queryFn: async () => fetch(COINGECKO_URL).then(r => r.json()),
   staleTime: 1000 * 60 * 5, // 5 minutes
   refetchInterval: 1000 * 60 * 5, // Auto-refetch
   placeholderData: FALLBACK_PRICES,
 });

 5B: useENSAvailability

 File: hooks/ens/useENSAvailability.ts

 Change: Replace manual debounce with React Query:
 // Create useDebouncedValue utility hook
 const debouncedLabel = useDebouncedValue(label, 300);

 const query = useQuery({
   queryKey: ['ens-availability', debouncedLabel],
   queryFn: async () => { /* existing logic */ },
   enabled: Boolean(debouncedLabel),
   staleTime: 1000 * 30,
 });

 ---
 Phase 6: Create Batched Variant Loader (Advanced)

 File: hooks/swag/useVariantQueries.ts

 New Hook: Batch fetch all variant data for product list:
 export function useVariantsBatch(contractAddress: string, chainId:
 number, tokenIds: number[]) {
   return useQuery({
     queryKey: ['swag-variants-batch', contractAddress, chainId,
 tokenIds],
     queryFn: async () => {
       const client = getPublicClient(chainId);
       const results = await client.multicall({
         contracts: tokenIds.flatMap(tokenId => [
           { functionName: 'getVariant', args: [BigInt(tokenId)] },
           { functionName: 'uri', args: [BigInt(tokenId)] },
           { functionName: 'remaining', args: [BigInt(tokenId)] },
         ].map(call => ({ address: contractAddress, abi: Swag1155ABI,
 ...call }))),
       });
       // Parse results...
     },
     staleTime: 1000 * 30,
   });
 }

 ---
 Phase 7: The Graph Subgraph

 7A: Subgraph Structure

 Create: subgraph/ directory at project root

 subgraph/
 ├── subgraph.yaml          # Manifest - contracts, events, handlers
 ├── schema.graphql         # Entity definitions
 ├── src/
 │   ├── swag1155.ts        # Swag event handlers
 │   ├── faucet.ts          # Faucet event handlers
 │   ├── zkpassport.ts      # ZKPassport event handlers
 │   └── ens.ts             # ENS event handlers
 ├── abis/                  # Contract ABIs (copy from frontend/abis)
 └── package.json

 7B: Schema Design (schema.graphql)

 type Token @entity {
   id: ID!                    # contractAddress-tokenId
   tokenId: BigInt!
   contract: Bytes!
   uri: String
   totalMinted: BigInt!
   owners: [TokenBalance!]! @derivedFrom(field: "token")
 }

 type TokenBalance @entity {
   id: ID!                    # contractAddress-tokenId-owner
   token: Token!
   owner: Bytes!
   balance: BigInt!
   redemptionStatus: Int!
 }

 type Purchase @entity {
   id: ID!
   buyer: Bytes!
   tokenId: BigInt!
   price: BigInt!
   timestamp: BigInt!
   txHash: Bytes!
 }

 type Vault @entity {
   id: ID!
   name: String!
   balance: BigInt!
   totalClaimed: BigInt!
   claimCount: BigInt!
 }

 type ZKPassport @entity {
   id: ID!                    # owner address
   tokenId: BigInt!
   uniqueIdentifier: String!
   faceMatchPassed: Boolean!
   personhoodVerified: Boolean!
   mintedAt: BigInt!
 }

 type ENSRegistration @entity {
   id: ID!                    # label hash
   label: String!
   owner: Bytes!
   registeredAt: BigInt!
 }

 7C: Create GraphQL Hook

 File: hooks/useSubgraph.ts

 import { useQuery } from '@tanstack/react-query';

 const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL;

 export function useSubgraphQuery<T>(
   queryKey: string[],
   query: string,
   variables?: Record<string, any>
 ) {
   return useQuery({
     queryKey: ['subgraph', ...queryKey],
     queryFn: async () => {
       const response = await fetch(SUBGRAPH_URL!, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ query, variables }),
       });
       const { data, errors } = await response.json();
       if (errors) throw new Error(errors[0].message);
       return data as T;
     },
     enabled: Boolean(SUBGRAPH_URL),
     staleTime: 1000 * 10, // 10 seconds - subgraph updates on each
 block
   });
 }

 7D: Replace Event-Based Hooks
 Current Hook: useMintedNFTs
 Replace With: useSubgraphQuery
 GraphQL Query: tokenBalances(where: {token_: {contract: $contract}})
 ────────────────────────────────────────
 Current Hook: useUserNFTs (event part)
 Replace With: useSubgraphQuery
 GraphQL Query: tokenBalances(where: {owner: $address, balance_gt: 0})
 ────────────────────────────────────────
 Current Hook: useZKPassportNFT (event part)
 Replace With: useSubgraphQuery
 GraphQL Query: zkPassport(id: $address)
 ────────────────────────────────────────
 Current Hook: useUserENS (L3 layer)
 Replace With: useSubgraphQuery
 GraphQL Query: ensRegistration(where: {owner: $address})
 ---
 Implementation Order
 Step: 1
 Phase: Subgraph Setup
 Impact: Foundation for indexed data
 Effort: Medium
 ────────────────────────────────────────
 Step: 2
 Phase: useSubgraph Hook
 Impact: GraphQL integration
 Effort: Low
 ────────────────────────────────────────
 Step: 3
 Phase: Replace Event Hooks
 Impact: Major RPC reduction
 Effort: Medium
 ────────────────────────────────────────
 Step: 4
 Phase: usePublicClient (client caching)
 Impact: Remaining RPC optimization
 Effort: Low
 ────────────────────────────────────────
 Step: 5
 Phase: Metadata caching
 Impact: Fixes product flashing
 Effort: Low
 ────────────────────────────────────────
 Step: 6
 Phase: useBuyBatch multicall
 Impact: Batch price queries
 Effort: Medium
 Order: Subgraph -> Hook Migrations -> Remaining RPC Optimizations

 ---
 Files Summary
 File: subgraph/
 Action: Create - entire subgraph directory
 ────────────────────────────────────────
 File: hooks/useSubgraph.ts
 Action: Create - GraphQL query hook
 ────────────────────────────────────────
 File: hooks/usePublicClient.ts
 Action: Create - client caching
 ────────────────────────────────────────
 File: hooks/swag/useVariantQueries.ts
 Action: Modify - add useVariantMetadata, fix staleTime
 ────────────────────────────────────────
 File: hooks/swag/index.ts
 Action: Modify - export useVariantMetadata
 ────────────────────────────────────────
 File: components/swag/ProductCard.tsx
 Action: Modify - use useVariantMetadata
 ────────────────────────────────────────
 File: hooks/useSwagStore.ts
 Action: Modify - multicall for prices
 ────────────────────────────────────────
 File: hooks/swag/useMintedNFTs.ts
 Action: Replace - use subgraph instead of events
 ────────────────────────────────────────
 File: hooks/useZKPassportNFT.ts
 Action: Modify - use subgraph for event data
 ────────────────────────────────────────
 File: hooks/ens/useUserENS.ts
 Action: Modify - use subgraph for L3 layer
 ────────────────────────────────────────
 File: hooks/useTokenPrices.ts
 Action: Modify - convert to React Query
 ---
 Verification

 After each phase:
 1. npm run typecheck - no TypeScript errors
 2. Browser Network tab - verify RPC call reduction
 3. React Query Devtools - verify caching
 4. Subgraph Explorer - verify indexed data

 Test Scenarios

 - Subgraph: Deploy and verify events are indexed correctly
 - Swag Store: Load products, verify no flashing, single metadata fetch
 per product
 - Buy Batch: Add multiple items to cart, verify single price query
 - Collectibles: View user NFTs, verify loads from subgraph (no block
 limits)
 - ENS: Register subdomain, verify appears in subgraph query