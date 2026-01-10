import AsyncStorage from '@react-native-async-storage/async-storage';

// App usage time limit feature (U022 - Hẹn giờ giới hạn sử dụng app)

const USAGE_KEY = 'app_usage_data';
const LIMIT_KEY = 'app_time_limit';

interface UsageData {
  date: string; // YYYY-MM-DD format
  totalMinutes: number;
  sessions: { start: number; end?: number }[];
}

export interface TimeLimitSettings {
  enabled: boolean;
  limitMinutes: number; // Daily limit in minutes
  reminderMinutes: number; // Reminder before limit
}

// Get current date string
const getDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Get usage data for today
export const getTodayUsage = async (): Promise<UsageData> => {
  try {
    const today = getDateString();
    const data = await AsyncStorage.getItem(`${USAGE_KEY}_${today}`);
    
    if (data) {
      return JSON.parse(data);
    }
    
    return {
      date: today,
      totalMinutes: 0,
      sessions: []
    };
  } catch (error) {
    console.error('Error getting usage data:', error);
    return {
      date: getDateString(),
      totalMinutes: 0,
      sessions: []
    };
  }
};

// Start session tracking
export const startSession = async (): Promise<void> => {
  try {
    const usage = await getTodayUsage();
    usage.sessions.push({ start: Date.now() });
    
    await AsyncStorage.setItem(`${USAGE_KEY}_${usage.date}`, JSON.stringify(usage));
  } catch (error) {
    console.error('Error starting session:', error);
  }
};

// End session and calculate time
export const endSession = async (): Promise<number> => {
  try {
    const usage = await getTodayUsage();
    const lastSession = usage.sessions[usage.sessions.length - 1];
    
    if (lastSession && !lastSession.end) {
      lastSession.end = Date.now();
      const sessionMinutes = Math.floor((lastSession.end - lastSession.start) / 60000);
      usage.totalMinutes += sessionMinutes;
      
      await AsyncStorage.setItem(`${USAGE_KEY}_${usage.date}`, JSON.stringify(usage));
      return usage.totalMinutes;
    }
    
    return usage.totalMinutes;
  } catch (error) {
    console.error('Error ending session:', error);
    return 0;
  }
};

// Get current session duration in minutes
export const getCurrentSessionDuration = async (): Promise<number> => {
  try {
    const usage = await getTodayUsage();
    const lastSession = usage.sessions[usage.sessions.length - 1];
    
    if (lastSession && !lastSession.end) {
      return Math.floor((Date.now() - lastSession.start) / 60000);
    }
    
    return 0;
  } catch (error) {
    return 0;
  }
};

// Get total usage for today including current session
export const getTotalUsageMinutes = async (): Promise<number> => {
  try {
    const usage = await getTodayUsage();
    const currentSession = await getCurrentSessionDuration();
    return usage.totalMinutes + currentSession;
  } catch (error) {
    return 0;
  }
};

// Set time limit settings
export const setTimeLimit = async (settings: TimeLimitSettings): Promise<void> => {
  try {
    await AsyncStorage.setItem(LIMIT_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error setting time limit:', error);
  }
};

// Get time limit settings
export const getTimeLimit = async (): Promise<TimeLimitSettings> => {
  try {
    const data = await AsyncStorage.getItem(LIMIT_KEY);
    
    if (data) {
      return JSON.parse(data);
    }
    
    // Default settings
    return {
      enabled: false,
      limitMinutes: 60, // 1 hour default
      reminderMinutes: 10 // 10 minutes before limit
    };
  } catch (error) {
    return {
      enabled: false,
      limitMinutes: 60,
      reminderMinutes: 10
    };
  }
};

// Check if limit exceeded
export const isLimitExceeded = async (): Promise<boolean> => {
  try {
    const settings = await getTimeLimit();
    
    if (!settings.enabled) {
      return false;
    }
    
    const totalUsage = await getTotalUsageMinutes();
    return totalUsage >= settings.limitMinutes;
  } catch (error) {
    return false;
  }
};

// Check if should show reminder
export const shouldShowReminder = async (): Promise<boolean> => {
  try {
    const settings = await getTimeLimit();
    
    if (!settings.enabled) {
      return false;
    }
    
    const totalUsage = await getTotalUsageMinutes();
    const remainingMinutes = settings.limitMinutes - totalUsage;
    
    return remainingMinutes > 0 && remainingMinutes <= settings.reminderMinutes;
  } catch (error) {
    return false;
  }
};

// Get remaining time in minutes
export const getRemainingTime = async (): Promise<number> => {
  try {
    const settings = await getTimeLimit();
    
    if (!settings.enabled) {
      return -1; // -1 means no limit
    }
    
    const totalUsage = await getTotalUsageMinutes();
    return Math.max(0, settings.limitMinutes - totalUsage);
  } catch (error) {
    return -1;
  }
};

// Format minutes to readable string
export const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} giờ`;
  }
  
  return `${hours} giờ ${mins} phút`;
};

// Clear usage data (for testing)
export const clearUsageData = async (): Promise<void> => {
  try {
    const today = getDateString();
    await AsyncStorage.removeItem(`${USAGE_KEY}_${today}`);
  } catch (error) {
    console.error('Error clearing usage data:', error);
  }
};
