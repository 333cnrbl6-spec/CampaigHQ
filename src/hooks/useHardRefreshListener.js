import React, { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export const useHardRefreshListener = () => {
  const versionRef = useRef(null);

  useEffect(() => {
    const checkRefresh = async () => {
      try {
        const configs = await base44.entities.SystemConfig.filter({ key: 'refresh_version' });
        const newVersion = configs.length > 0 ? configs[0].value : '0';

        if (versionRef.current === null) {
          versionRef.current = newVersion;
        } else if (versionRef.current !== newVersion) {
          // Version changed, perform hard refresh
          window.location.reload();
        }
      } catch (error) {
        console.error('Hard refresh check failed:', error);
      }
    };

    checkRefresh();
    const interval = setInterval(checkRefresh, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);
};