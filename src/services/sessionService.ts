import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@agenda_session';
const DRAFT_SCHEDULE_KEY = '@agenda_draft_schedule';

export interface SessionData {
  lastRoute?:  string;
  lastParams?: Record<string, any>;
  timestamp: number;
}

export const sessionService = {
  async saveCurrentRoute(route: string, params?: Record<string, any>) {
    try {
      const sessionData: SessionData = {
        lastRoute: route,
        lastParams: params,
        timestamp: Date.now(),
      };
      
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  },

  async getLastRoute(): Promise<SessionData | null> {
    try {
      const data = await AsyncStorage.getItem(SESSION_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar sessão:', error);
      return null;
    }
  },

  async clearSession() {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Erro ao limpar sessão:', error);
    }
  },

  isSessionValid(session:  SessionData): boolean {
    const MAX_SESSION_TIME = 24 * 60 * 60 * 1000; // 24 horas
    return Date.now() - session.timestamp < MAX_SESSION_TIME;
  },


  async saveDraftSchedule(scheduleData: any) {
    try {
      await AsyncStorage.setItem(DRAFT_SCHEDULE_KEY, JSON.stringify(scheduleData));
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
    }
  },

  async getDraftSchedule() {
    try {
      const data = await AsyncStorage.getItem(DRAFT_SCHEDULE_KEY);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Erro ao recuperar rascunho:', error);
      return null;
    }
  },

  async clearDraftSchedule() {
    try {
      await AsyncStorage.removeItem(DRAFT_SCHEDULE_KEY);
    } catch (error) {
      console.error('Erro ao limpar rascunho:', error);
    }
  },


  async clearAllData() {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      await AsyncStorage.removeItem(DRAFT_SCHEDULE_KEY);
    } catch (error) {
      console.error('Erro ao limpar todos os dados:', error);
    }
  },
};
