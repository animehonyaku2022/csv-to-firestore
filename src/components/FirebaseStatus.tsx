import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Loader2, WifiOff } from 'lucide-react';
import { checkFirebaseConnection } from '../lib/firebase';

interface ConnectionStatus {
  isConnected: boolean;
  message?: string;
}

const FirebaseStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | ConnectionStatus>('checking');

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const connectionStatus = await checkFirebaseConnection();
        setStatus(connectionStatus);
      } catch {
        setStatus({
          isConnected: false,
          message: 'Error checking Firebase connection'
        });
      }
    };

    // Initial check
    checkConnection();

    // Set up periodic connection checks
    const intervalId = setInterval(checkConnection, 30000); // Check every 30 seconds

    return () => clearInterval(intervalId);
  }, []);

  if (status === 'checking') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        <span className="text-gray-600">Checking Firebase connection...</span>
      </div>
    );
  }

  const { isConnected, message } = status;

  return (
    <div className="flex items-center gap-2 text-sm">
      {isConnected ? (
        <>
          <CheckCircle className="w-4 h-4 text-green-500" />
          <span className="text-green-700">{message || 'Firebase connected'}</span>
        </>
      ) : message?.includes('offline') ? (
        <>
          <WifiOff className="w-4 h-4 text-yellow-500" />
          <span className="text-yellow-700">{message}</span>
        </>
      ) : (
        <>
          <XCircle className="w-4 h-4 text-red-500" />
          <span className="text-red-700">{message}</span>
        </>
      )}
    </div>
  );
};

export default FirebaseStatus;