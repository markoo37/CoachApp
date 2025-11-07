// src/hooks/useAPI.ts
import { useEffect, useState } from 'react';

export function useAPI() {
  const [apiAvailable, setApiAvailable] = useState(false);
  const [PlayerAPI, setPlayerAPI] = useState<any>(null);
  const [TeamInfo, setTeamInfo] = useState<any>(null);
  const [TrainingPlan, setTrainingPlan] = useState<any>(null);

  useEffect(() => {
    try {
      const apiModule = require('../services/api');
      setPlayerAPI(apiModule.PlayerAPI);
      setTeamInfo(apiModule.TeamInfo);
      setTrainingPlan(apiModule.TrainingPlan);
      setApiAvailable(true);
    } catch (error) {
      console.warn('API module not available:', error);
      setApiAvailable(false);
    }
  }, []);

  return {
    apiAvailable,
    PlayerAPI,
    TeamInfo,
    TrainingPlan,
  };
}