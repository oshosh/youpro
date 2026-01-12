import { useState, useCallback, useEffect } from 'react';
import pipedService from '../services/piped';

export function useInvidiousInstance() {
  const [instanceUrl, setInstanceUrl] = useState('api.invidious.io');
  const [isHealthy, setIsHealthy] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const checkHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const success = await pipedService.checkHealth();
      setIsHealthy(success);
      setInstanceUrl(success ? pipedService.getCurrentInstanceName() : '연결 실패');
    } catch {
      setIsHealthy(false);
      setInstanceUrl('연결 실패');
    } finally {
      setIsChecking(false);
    }
  }, []);

  // 초기 헬스체크
  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return {
    instanceUrl,
    isHealthy,
    isChecking,
    checkHealth,
  };
}

export default useInvidiousInstance;
