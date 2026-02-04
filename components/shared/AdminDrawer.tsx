import { useState, useEffect } from 'react';
import { useAdminStatus } from '../../hooks/useAdminStatus';
import { AdminProductList } from '../swag/AdminProductList';
import { VaultList } from '../faucet/VaultList';
import { ZKPassportMetadataAdmin } from '../zkpassport/ZKPassportMetadataAdmin';

type AdminTab = 'swag' | 'faucet' | 'identity';

const tabConfig: Record<AdminTab, { label: string; color: string; activeColor: string }> = {
  swag: {
    label: 'SWAG',
    color: 'text-pink-400/60 border-pink-500/30',
    activeColor: 'text-pink-400 border-pink-500 bg-pink-500/10',
  },
  faucet: {
    label: 'FAUCET',
    color: 'text-orange-400/60 border-orange-500/30',
    activeColor: 'text-orange-400 border-orange-500 bg-orange-500/10',
  },
  identity: {
    label: 'IDENTITY',
    color: 'text-purple-400/60 border-purple-500/30',
    activeColor: 'text-purple-400 border-purple-500 bg-purple-500/10',
  },
};

export function AdminDrawer() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('swag');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Single combined query for all admin status
  const {
    isSwagAdmin,
    isFaucetAdmin,
    isZKPassportOwner: isIdentityAdmin,
    hasAnyAdmin,
    isLoading,
  } = useAdminStatus();

  // Listen for mobile menu open state (set by Navigation component)
  useEffect(() => {
    const checkMobileMenu = () => {
      setIsMobileMenuOpen(document.body.hasAttribute('data-mobile-menu-open'));
    };

    // Check initially
    checkMobileMenu();

    // Use MutationObserver to detect attribute changes
    const observer = new MutationObserver(checkMobileMenu);
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-mobile-menu-open'] });

    return () => observer.disconnect();
  }, []);

  // Don't render if not an admin, or if mobile menu is open
  if (isLoading || !hasAnyAdmin || isMobileMenuOpen) {
    return null;
  }

  // Available tabs based on permissions
  const availableTabs: AdminTab[] = [];
  if (isSwagAdmin) availableTabs.push('swag');
  if (isFaucetAdmin) availableTabs.push('faucet');
  if (isIdentityAdmin) availableTabs.push('identity');

  // Ensure active tab is available
  if (!availableTabs.includes(activeTab) && availableTabs.length > 0) {
    setActiveTab(availableTabs[0]);
  }

  return (
    <>
      {/* Overlay when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
          isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-48px)]'
        }`}
      >
        {/* Collapsed Bar / Header */}
        <div
          className="h-12 border-t border-cyan-500/30 bg-black/95 backdrop-blur-lg flex items-center justify-between px-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
            </span>
            <span className="text-sm font-medium text-cyan-400 tracking-wider">ADMIN PANEL</span>
          </div>
          <button
            className="p-1.5 rounded-lg hover:bg-slate-800 transition"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        {/* Expanded Content */}
        <div className="h-[70vh] bg-black/95 backdrop-blur-lg border-t border-slate-800 overflow-hidden flex flex-col">
          {/* Tabs */}
          <div className="flex gap-2 px-4 py-3 border-b border-slate-800">
            {availableTabs.map((tab) => {
              const config = tabConfig[tab];
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-full border text-xs font-medium tracking-wider transition ${
                    isActive ? config.activeColor : `${config.color} hover:opacity-80`
                  }`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'swag' && isSwagAdmin && <AdminProductList />}
            {activeTab === 'faucet' && isFaucetAdmin && <VaultList />}
            {activeTab === 'identity' && isIdentityAdmin && <ZKPassportMetadataAdmin />}
          </div>
        </div>
      </div>
    </>
  );
}
