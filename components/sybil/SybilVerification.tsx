import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useWallets, useSendTransaction } from '@privy-io/react-auth';
import { encodeFunctionData, createPublicClient, http, decodeEventLog } from 'viem';
import {
  hasNFTByAddress,
  hasNFT,
  getContractAddresses,
  getExplorerUrl,
  getNetworkName,
  getTokenIdByAddress,
  getTokenData,
  getTokenURI,
} from '../../utils/contracts';
import { getChainRpc } from '../../config/networks';
import ZKPassportNFTABI from '../../frontend/abis/ZKPassportNFT.json';

// Dynamic imports for ZKPassport (client-side only)
let requestPersonhoodVerification: any;

interface SybilVerificationProps {
  chainId: number;
  onMintSuccess?: () => void;
  onVerificationStatusChange?: (
    status: 'idle' | 'verified' | 'minting' | 'minted' | 'failed' | 'rejected' | 'duplicate',
    data?: {
      uniqueIdentifier?: string | null;
      faceMatchPassed?: boolean;
      personhoodVerified?: boolean;
    }
  ) => void;
}

type VerificationStatus = 
  | 'idle'
  | 'awaiting_scan'
  | 'request_received'
  | 'generating_proof'
  | 'verified'
  | 'minting'
  | 'minted'
  | 'failed'
  | 'rejected'
  | 'duplicate';

interface MintData {
  signature: string;
  mintRequest: {
    to: string;
    uniqueIdentifier: string;
    faceMatchPassed: boolean;
    personhoodVerified: boolean;
    nonce: string;
    deadline: string;
  };
  sponsorAddress: string;
}

// Helper to mask unique identifier for privacy (used in verification flow)
const maskIdentifier = (uid: string): string => {
  if (!uid || uid.length < 12) return '***';
  return `${uid.slice(0, 6)}...${uid.slice(-4)}`;
};

const SybilVerification: React.FC<SybilVerificationProps> = ({ chainId, onMintSuccess, onVerificationStatusChange }) => {
  const { wallets } = useWallets();
  const { sendTransaction } = useSendTransaction();
  const userWallet = wallets?.[0];

  const [isClient, setIsClient] = useState(false);
  
  // Verification state
  const [status, setStatus] = useState<VerificationStatus>('idle');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  const [uniqueIdentifier, setUniqueIdentifier] = useState<string | null>(null);
  const [faceMatchPassed, setFaceMatchPassed] = useState(false);
  const [personhoodVerified, setPersonhoodVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Progress tracking
  const [requestReceived, setRequestReceived] = useState(false);
  const [generatingProof, setGeneratingProof] = useState(false);
  const [proofsGenerated, setProofsGenerated] = useState(0);
  
  // Minting state
  const [mintTxHash, setMintTxHash] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  const addresses = getContractAddresses(chainId);

  // Load ZKPassport SDK and check NFT ownership
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsClient(true);
      import('../../utils/zkpassport').then((module) => {
        requestPersonhoodVerification = module.requestPersonhoodVerification;
      });
    }
  }, []);

  // Notify parent of status changes (only for relevant statuses)
  useEffect(() => {
    if (onVerificationStatusChange && ['idle', 'verified', 'minting', 'minted', 'failed', 'rejected', 'duplicate'].includes(status)) {
      onVerificationStatusChange(status as 'idle' | 'verified' | 'minting' | 'minted' | 'failed' | 'rejected' | 'duplicate', {
        uniqueIdentifier,
        faceMatchPassed,
        personhoodVerified,
      });
    }
  }, [status, uniqueIdentifier, faceMatchPassed, personhoodVerified, onVerificationStatusChange]);

  // User clicks mint - direct mint with Privy sponsorship (no backend signature needed)
  const mintNFT = async () => {
    // Check what's missing and show specific error
    if (!userWallet) {
      setErrorMessage('Wallet not connected. Please connect your wallet first.');
      return;
    }
    if (!uniqueIdentifier) {
      setErrorMessage('Missing unique identifier from verification. Please verify again.');
      console.error('Mint failed - uniqueIdentifier is:', uniqueIdentifier);
      return;
    }

    // Check if unique identifier already has an NFT (prevent duplicate unique identifier usage)
    try {
      const identifierHasNFT = await hasNFT(chainId, uniqueIdentifier);
      if (identifierHasNFT) {
        setErrorMessage('This unique identifier has already been used to mint an NFT. Each identity can only mint once.');
        setStatus('duplicate');
        return;
      }
    } catch (error) {
      console.error('Error checking unique identifier NFT ownership:', error);
      // Continue with mint attempt if check fails (contract will enforce it)
    }

    // Check if address already has an NFT (prevent duplicate minting per address)
    try {
      const addressHasNFT = await hasNFTByAddress(chainId, userWallet.address);
      if (addressHasNFT) {
        setErrorMessage('This address already has an NFT. Only one NFT per address is allowed.');
        setStatus('duplicate');
        return;
      }
    } catch (error) {
      console.error('Error checking address NFT ownership:', error);
      // Continue with mint attempt if check fails (contract will enforce it)
    }

    setIsMinting(true);
    setStatus('minting');
    setErrorMessage(null);

    try {
      // Step 1: Ensure wallet is on the correct chain
      const currentChainId = userWallet.chainId;
      if (currentChainId && Number(currentChainId.replace('eip155:', '')) !== chainId) {
        await userWallet.switchChain(chainId);
      }

      // Step 2: Get contract address for direct minting
      const addresses = getContractAddresses(chainId);
      const nftContractAddress = addresses.ZKPassportNFT;
      
      console.log('Minting directly to NFT contract:', nftContractAddress);

      // Step 3: Prepare direct mint transaction data
      const mintTxData = encodeFunctionData({
        abi: ZKPassportNFTABI,
        functionName: 'mintWithVerification',
          args: [uniqueIdentifier, faceMatchPassed, personhoodVerified || true],
      });

      // Step 4: Send sponsored transaction directly to NFT contract
      console.log('Sending sponsored transaction...');
      const result = await sendTransaction(
        {
          to: nftContractAddress as `0x${string}`,
          data: mintTxData,
        },
        {
          sponsor: true, // Enable Privy's native gas sponsorship
        } as any // Type assertion for compatibility
      );

      console.log('Sponsored transaction sent:', result.hash);
      setMintTxHash(result.hash);
      setStatus('minted');
      
      onMintSuccess?.();

    } catch (error: any) {
      console.error('Mint error:', error);
      setStatus('verified'); // Go back to verified state so user can retry
      setErrorMessage(error.message || 'Failed to mint NFT. Please try again.');
    } finally {
      setIsMinting(false);
    }
  };

  const startVerification = async () => {
    if (!isClient || !requestPersonhoodVerification) {
      setErrorMessage('Please wait for the page to load completely.');
      return;
    }

    setStatus('awaiting_scan');
    setErrorMessage(null);
    setRequestReceived(false);
    setGeneratingProof(false);
    setProofsGenerated(0);
    setUniqueIdentifier(null);
    setFaceMatchPassed(false);
    setPersonhoodVerified(false);

    try {
      const result = await requestPersonhoodVerification();
      
      const {
        url,
        onRequestReceived,
        onGeneratingProof,
        onProofGenerated,
        onResult,
        onReject,
        onError,
      } = result;

      setVerificationUrl(url);

      onRequestReceived(() => {
        setRequestReceived(true);
        setStatus('request_received');
      });

      onGeneratingProof(() => {
        setGeneratingProof(true);
        setStatus('generating_proof');
      });

      onProofGenerated(() => {
        setProofsGenerated(prev => prev + 1);
      });

      // Verification complete - show results and let user mint
      onResult(async (resultData: any) => {
        // Log the full result to understand the structure
        console.log('ZKPassport full result:', JSON.stringify(resultData, null, 2));
        
        const { verified, uniqueIdentifier: uid, result: verificationResult } = resultData || {};
        
        // Try to extract unique identifier from multiple possible locations
        const extractedUid = uid 
          || verificationResult?.uniqueIdentifier 
          || resultData?.result?.uniqueIdentifier
          || resultData?.uniqueId
          || resultData?.id;
        
        console.log('Extracted data:', { verified, extractedUid, verificationResult });
        
        if (!verified) {
          setStatus('failed');
          setErrorMessage('Verification failed. Please try again.');
          return;
        }

        // Extract face match result from various possible locations
        const faceMatch = verificationResult?.facematch?.passed 
          ?? verificationResult?.faceMatch?.passed
          ?? resultData?.facematch?.passed
          ?? true;

        // Set verification results
        setUniqueIdentifier(extractedUid || null);
        setFaceMatchPassed(faceMatch);
        setPersonhoodVerified(true);

        if (extractedUid) {
          // Check if this identifier already has an NFT
          try {
            const identifierHasNFT = await hasNFT(chainId, extractedUid);
            
            if (identifierHasNFT) {
              setStatus('duplicate');
              setErrorMessage('This identity already has an NFT on this network.');
            } else {
              // Show verified state - user can now mint
              setStatus('verified');
            }
          } catch (err) {
            console.error('Error checking existing NFT:', err);
            // Still show verified state even if check fails
            setStatus('verified');
          }
        } else {
          setStatus('failed');
          setErrorMessage(`No unique identifier found in verification response. Check console for full response.`);
        }
      });

      onReject(() => {
        setStatus('rejected');
        setErrorMessage('Verification was rejected by user.');
      });

      onError((error: any) => {
        setStatus('failed');
        setErrorMessage(`Verification error: ${error.message || error}`);
      });

    } catch (error: any) {
      setStatus('failed');
      setErrorMessage(`Error starting verification: ${error.message || 'Unknown error'}`);
    }
  };

  const resetVerification = () => {
    setStatus('idle');
    setVerificationUrl(null);
    setUniqueIdentifier(null);
    setFaceMatchPassed(false);
    setPersonhoodVerified(false);
    setErrorMessage(null);
    setRequestReceived(false);
    setGeneratingProof(false);
    setProofsGenerated(0);
    setMintTxHash(null);
    setIsMinting(false);
  };




  return (
    <div className="space-y-4">
      {/* Verification Flow */}
      <div className="bg-black/60 border border-cyan-500/30 rounded-lg p-4 space-y-4">
          {/* Minimal Header */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
            <h2 className="text-xs font-bold text-cyan-400 font-mono tracking-wider">VERIFY_IDENTITY</h2>
          </div>

      {/* Idle State */}
      {status === 'idle' && (
        <div className="space-y-3">
          {/* Compact Steps */}
          <div className="grid grid-cols-4 gap-1 text-[9px] font-mono text-gray-500">
            <div className="text-center p-2 bg-gray-900/50 rounded">
              <div className="text-cyan-500 text-lg mb-1">1</div>
              <span>SCAN</span>
            </div>
            <div className="text-center p-2 bg-gray-900/50 rounded">
              <div className="text-cyan-500 text-lg mb-1">2</div>
              <span>NFC</span>
            </div>
            <div className="text-center p-2 bg-gray-900/50 rounded">
              <div className="text-cyan-500 text-lg mb-1">3</div>
              <span>FACE</span>
            </div>
            <div className="text-center p-2 bg-gray-900/50 rounded">
              <div className="text-cyan-500 text-lg mb-1">4</div>
              <span>MINT</span>
            </div>
          </div>

          <button
            onClick={startVerification}
            disabled={!isClient}
            className="w-full py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded text-cyan-400 font-mono font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {!isClient ? 'INIT...' : 'START →'}
          </button>
        </div>
      )}

      {/* QR Code */}
      {status === 'awaiting_scan' && verificationUrl && (
        <div className="space-y-3">
          <div className="bg-black/40 rounded p-4 text-center">
            <p className="text-[10px] text-gray-500 font-mono mb-3 tracking-wider">SCAN_QR</p>
            <div className="bg-white p-3 rounded inline-block">
              <QRCodeSVG
                value={verificationUrl}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] text-gray-600 font-mono">WAITING...</span>
            </div>
            <a
              href={verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-cyan-500/70 hover:text-cyan-400 font-mono mt-2 block"
            >
              open_app →
            </a>
          </div>

          <button
            onClick={resetVerification}
            className="w-full py-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 rounded text-gray-500 font-mono text-[10px]"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Progress States */}
      {(['request_received', 'generating_proof'].includes(status)) && (
        <div className="bg-black/40 rounded p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider">PROCESSING</span>
          </div>
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${requestReceived ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span className={requestReceived ? 'text-green-400' : 'text-gray-600'}>REQUEST</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${generatingProof ? 'bg-cyan-500 animate-pulse' : 'bg-gray-600'}`}></div>
              <span className={generatingProof ? 'text-cyan-400' : 'text-gray-600'}>
                PROOF {proofsGenerated > 0 && `[${proofsGenerated}/4]`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Verified - Show NFT Preview & Mint Button */}
      {status === 'verified' && uniqueIdentifier && (
        <div className="space-y-3">
          {/* Success Badge */}
          <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-[10px] text-green-400 font-mono tracking-wider">VERIFIED</span>
          </div>

          {/* NFT Preview - Compact */}
          <div className="bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border border-purple-500/20 rounded p-3">
            <div className="text-[10px] text-gray-500 font-mono mb-2 tracking-wider">NFT_TRAITS</div>

            <div className="space-y-1.5 text-[11px] font-mono">
              <div className="flex justify-between items-center py-1.5 border-b border-gray-800">
                <span className="text-gray-500">uid</span>
                <span className="text-cyan-400">{maskIdentifier(uniqueIdentifier)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-800">
                <span className="text-gray-500">face</span>
                <span className={faceMatchPassed ? 'text-green-400' : 'text-gray-600'}>
                  {faceMatchPassed ? 'PASS' : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-gray-500">human</span>
                <span className={personhoodVerified ? 'text-green-400' : 'text-gray-600'}>
                  {personhoodVerified ? 'TRUE' : 'FALSE'}
                </span>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-gray-800">
              <span className="text-[9px] text-gray-600 font-mono">
                {getNetworkName(chainId).toUpperCase()} • SOULBOUND
              </span>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <div className="text-[10px] text-red-400 font-mono p-2 bg-red-500/10 border border-red-500/20 rounded">
              {errorMessage}
            </div>
          )}

          {/* Mint Button */}
          <button
            onClick={mintNFT}
            disabled={isMinting}
            className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded text-green-400 font-mono font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isMinting ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                MINTING...
              </span>
            ) : (
              'MINT →'
            )}
          </button>

          <button
            onClick={resetVerification}
            disabled={isMinting}
            className="w-full py-2 text-[10px] text-gray-600 hover:text-gray-400 font-mono disabled:opacity-50"
          >
            RESTART
          </button>
        </div>
      )}

      {/* Minting */}
      {status === 'minting' && (
        <div className="bg-black/40 rounded p-4 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider">MINTING...</span>
          </div>
          <p className="text-[9px] text-gray-600 font-mono mt-2">CONFIRM_TX</p>
        </div>
      )}

      {/* Transaction Link - Show after minting */}
      {status === 'minted' && mintTxHash && (
        <div className="bg-black/40 rounded p-3 border border-cyan-500/20">
          <div className="text-[10px] text-gray-500 font-mono mb-2 tracking-wider">TRANSACTION</div>
          <a
            href={getExplorerUrl(chainId, mintTxHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] text-cyan-400 hover:text-cyan-300 font-mono block"
          >
            tx: {mintTxHash.slice(0, 10)}...{mintTxHash.slice(-6)} →
          </a>
        </div>
      )}

      {/* Duplicate */}
      {status === 'duplicate' && (
        <div className="space-y-3">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-[10px] text-yellow-400 font-mono tracking-wider">DUPLICATE</span>
            </div>
            <p className="text-[10px] text-yellow-400/70 font-mono">
              {uniqueIdentifier && `ID: ${maskIdentifier(uniqueIdentifier)}`}
            </p>
          </div>
          <button
            onClick={resetVerification}
            className="w-full py-2 text-[10px] text-gray-500 hover:text-gray-400 font-mono"
          >
            RETRY
          </button>
        </div>
      )}

      {/* Failed/Rejected */}
      {(['failed', 'rejected'].includes(status)) && (
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-[10px] text-red-400 font-mono tracking-wider">
                {status === 'rejected' ? 'REJECTED' : 'ERROR'}
              </span>
            </div>
            {errorMessage && (
              <p className="text-[9px] text-red-400/70 font-mono">{errorMessage}</p>
            )}
          </div>
          <button
            onClick={resetVerification}
            className="w-full py-2.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 rounded text-cyan-400 font-mono text-[10px] font-bold transition-all"
          >
            RETRY →
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

export default SybilVerification;
