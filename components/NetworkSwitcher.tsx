import React from 'react';
import { getNetworkLogoUrl } from '../utils/tokenUtils';

interface NetworkSwitcherProps {
  currentChainId: number;
  onNetworkChange: (chainId: number) => void;
}

const NETWORKS = [
  {
    id: 8453,
    name: 'Base',
    logoUrl: getNetworkLogoUrl(8453),
    activeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    inactiveColor: 'bg-gray-800 text-gray-500 border-gray-700'
  },
  {
    id: 1,
    name: 'Ethereum',
    logoUrl: getNetworkLogoUrl(1),
    activeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
    inactiveColor: 'bg-gray-800 text-gray-500 border-gray-700'
  }
];

export default function NetworkSwitcher({ currentChainId, onNetworkChange }: NetworkSwitcherProps) {
  const handleClick = (networkId: number) => {
    console.log(`🔘 Network button clicked: ${networkId}`);
    onNetworkChange(networkId);
  };

  return (
    <div className="flex gap-3 p-1 bg-gray-900 rounded-xl border border-cyan-500/20">
      {NETWORKS.map((network) => {
        const isActive = currentChainId === network.id;
        return (
          <button
            key={network.id}
            onClick={() => handleClick(network.id)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-lg border-2 font-mono font-bold transition-all
              ${isActive ? network.activeColor : network.inactiveColor}
              hover:scale-105
            `}
          >
            <img 
              src={network.logoUrl} 
              alt={`${network.name} logo`}
              className={`w-6 h-6 object-contain ${network.logoUrl.includes('.svg') ? '' : 'rounded-full'}`}
              onError={(e) => {
                // Fallback to emoji if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const emoji = network.id === 8453 ? '🔵' : '💎';
                if (!target.parentElement?.querySelector('.fallback-emoji')) {
                  target.parentElement?.insertAdjacentHTML('beforeend', `<span class="text-xl fallback-emoji">${emoji}</span>`);
                }
              }}
            />
            <span className="text-sm">{network.name.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

