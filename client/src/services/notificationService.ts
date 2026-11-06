export const notificationService = {
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  },

  sendNotification(title: string, options?: NotificationOptions): boolean {
    if (!this.isSupported() || Notification.permission !== 'granted') {
      return false;
    }

    try {
      new Notification(title, {
        icon: '/pwa-icon.svg',
        badge: '/pwa-icon.svg',
        ...options,
      });
      return true;
    } catch (err) {
      console.warn('[NotificationService] Could not send notification:', err);
      return false;
    }
  },

  sendDailyBriefingReminder(streakCount: number, pendingTasks: number) {
    return this.sendNotification('☀️ Good Morning from DayPilot AI!', {
      body: `You have ${pendingTasks} task(s) on your radar today. Keep your ${streakCount}-day streak alive!`,
      tag: 'daily-briefing',
    });
  },

  sendTaskReminder(taskTitle: string, dueTime?: string) {
    return this.sendNotification('⏰ DayPilot Task Reminder', {
      body: `"${taskTitle}" is due ${dueTime ? `at ${dueTime}` : 'soon'}!`,
      tag: `task-${taskTitle}`,
    });
  },
};

