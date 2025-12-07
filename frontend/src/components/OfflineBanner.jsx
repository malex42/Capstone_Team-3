import { useConnectivity } from '@/contexts/ConnectivityContext';

export default function OfflineBanner() {
  const { isOffline, justReconnected } = useConnectivity();

  if (isOffline) {
    return (
      <div style={{ background: 'red', color: 'white', padding: '8px' }}>
        You're offline. Editing is disabled.
      </div>
    );
  }

  if (justReconnected) {
    return (
      <div style={{ background: 'green', color: 'white', padding: '8px' }}>
        You're back online!
      </div>
    );
  }

  return null;
}
