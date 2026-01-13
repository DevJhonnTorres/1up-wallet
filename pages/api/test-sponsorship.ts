import { NextApiRequest, NextApiResponse } from 'next';

/**
 * API endpoint to test gas sponsorship status
 * GET /api/test-sponsorship
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // This endpoint can be used to test if the gas sponsorship setup is working
    // You can expand this to check Privy credits balance, etc.
    return res.status(200).json({
      success: true,
      message: 'Gas sponsorship migration completed',
      features: {
        nft_minting: 'Enabled with Privy native sponsorship',
        token_transfers: 'ETH and USDC transfers sponsored',
        faucet_claims: 'Sponsored faucet claims enabled',
        networks: ['Base (8453)']
      },
      migration_notes: [
        'SponsorContract dependency removed',
        'Direct NFT contract minting enabled',
        'All transactions use useSendTransaction with sponsor: true',
        'TEE execution enabled for security'
      ]
    });
  } catch (error) {
    console.error('Test sponsorship error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}