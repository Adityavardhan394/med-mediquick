const admin = require('firebase-admin');
const { Notification, Reminder } = require('../models/Notification');
const cron = require('node-cron');

class NotificationService {
  constructor() {
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      })
    });

    // Schedule reminder checks every minute
    this.scheduleReminderChecks();
  }

  // Send push notification
  async sendNotification(userId, notification) {
    try {
      // Get user's FCM token from database
      const user = await User.findById(userId);
      if (!user || !user.fcmToken) {
        throw new Error('User FCM token not found');
      }

      // Create notification in database
      const newNotification = await Notification.create({
        userId,
        ...notification
      });

      // Send FCM message
      const message = {
        token: user.fcmToken,
        notification: {
          title: notification.title,
          body: notification.body
        },
        data: {
          type: notification.type,
          ...notification.data
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'medicine_reminders'
          }
        },
        apns: {
          payload: {
            aps: {
              sound: 'default'
            }
          }
        }
      };

      await admin.messaging().send(message);
      return newNotification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  // Schedule medicine reminders
  async scheduleReminder(reminderData) {
    try {
      const reminder = await Reminder.create(reminderData);
      return reminder;
    } catch (error) {
      console.error('Error scheduling reminder:', error);
      throw error;
    }
  }

  // Check and send due reminders
  async checkDueReminders() {
    try {
      const now = new Date();
      const dueReminders = await Reminder.find({
        active: true,
        endDate: { $gte: now },
        $or: [
          { lastNotified: { $exists: false } },
          { lastNotified: { $lt: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
        ]
      });

      for (const reminder of dueReminders) {
        const isDue = this.isReminderDue(reminder, now);
        if (isDue) {
          await this.sendNotification(reminder.userId, {
            type: 'MEDICINE_REMINDER',
            title: 'Medicine Reminder',
            body: `Time to take ${reminder.medicineName} - ${reminder.dosage}`,
            data: {
              reminderId: reminder._id,
              medicineId: reminder.medicineId
            }
          });

          reminder.lastNotified = now;
          await reminder.save();
        }
      }
    } catch (error) {
      console.error('Error checking due reminders:', error);
    }
  }

  // Check if a reminder is due
  isReminderDue(reminder, now) {
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false });

    return reminder.schedule.some(schedule => {
      const isDayMatch = schedule.days.includes(currentDay);
      const isTimeMatch = this.isTimeDue(schedule.time, currentTime, reminder.notificationPreferences.reminderBefore);
      return isDayMatch && isTimeMatch;
    });
  }

  // Check if time is due considering reminder before time
  isTimeDue(scheduleTime, currentTime, reminderBefore) {
    const [scheduleHour, scheduleMinute] = scheduleTime.split(':').map(Number);
    const [currentHour, currentMinute] = currentTime.split(':').map(Number);

    const scheduleTotalMinutes = scheduleHour * 60 + scheduleMinute;
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const reminderBeforeMinutes = reminderBefore || 15;

    return currentTotalMinutes >= scheduleTotalMinutes - reminderBeforeMinutes &&
           currentTotalMinutes <= scheduleTotalMinutes;
  }

  // Schedule reminder checks
  scheduleReminderChecks() {
    // Check every minute
    cron.schedule('* * * * *', () => {
      this.checkDueReminders();
    });
  }

  // Update reminder preferences
  async updateReminderPreferences(reminderId, preferences) {
    try {
      const reminder = await Reminder.findById(reminderId);
      if (!reminder) {
        throw new Error('Reminder not found');
      }

      reminder.notificationPreferences = {
        ...reminder.notificationPreferences,
        ...preferences
      };

      await reminder.save();
      return reminder;
    } catch (error) {
      console.error('Error updating reminder preferences:', error);
      throw error;
    }
  }

  // Get user's notifications
  async getUserNotifications(userId, page = 1, limit = 20) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markNotificationAsRead(notificationId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        throw new Error('Notification not found');
      }

      notification.read = true;
      await notification.save();
      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 