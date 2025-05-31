import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import AccessibilityWrapper from './AccessibilityWrapper';

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const MedicineReminder = ({ medicine, onSave }) => {
  const { t } = useTranslation();
  const [schedules, setSchedules] = useState([{
    time: new Date(),
    days: []
  }]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedScheduleIndex, setSelectedScheduleIndex] = useState(0);
  const [preferences, setPreferences] = useState({
    sound: true,
    vibration: true,
    reminderBefore: 15
  });

  const addSchedule = () => {
    setSchedules([...schedules, {
      time: new Date(),
      days: []
    }]);
  };

  const removeSchedule = (index) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const toggleDay = (scheduleIndex, day) => {
    const newSchedules = [...schedules];
    const schedule = newSchedules[scheduleIndex];
    const dayIndex = schedule.days.indexOf(day);

    if (dayIndex === -1) {
      schedule.days.push(day);
    } else {
      schedule.days.splice(dayIndex, 1);
    }

    setSchedules(newSchedules);
  };

  const handleTimeChange = (event, selectedTime) => {
    if (selectedTime) {
      const newSchedules = [...schedules];
      newSchedules[selectedScheduleIndex].time = selectedTime;
      setSchedules(newSchedules);
    }
    setShowTimePicker(false);
  };

  const handleSave = () => {
    const reminderData = {
      medicineId: medicine.id,
      medicineName: medicine.name,
      dosage: medicine.dosage,
      schedule: schedules.map(schedule => ({
        time: schedule.time.toLocaleTimeString('en-US', { hour12: false }),
        days: schedule.days
      })),
      startDate,
      endDate,
      notificationPreferences: preferences
    };

    onSave(reminderData);
  };

  return (
    <AccessibilityWrapper
      accessibilityRole="form"
      accessibilityLabel={t('reminder.title')}
    >
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('reminder.title')}</Text>
          <Text style={styles.subtitle}>{medicine.name}</Text>
        </View>

        {schedules.map((schedule, index) => (
          <View key={index} style={styles.scheduleContainer}>
            <View style={styles.scheduleHeader}>
              <Text style={styles.scheduleTitle}>
                {t('reminder.schedule')} {index + 1}
              </Text>
              {schedules.length > 1 && (
                <TouchableOpacity
                  onPress={() => removeSchedule(index)}
                  accessibilityRole="button"
                  accessibilityLabel={t('reminder.removeSchedule')}
                >
                  <MaterialIcons name="delete" size={24} color="#ff4757" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => {
                setSelectedScheduleIndex(index);
                setShowTimePicker(true);
              }}
              accessibilityRole="button"
              accessibilityLabel={t('reminder.selectTime')}
            >
              <MaterialIcons name="access-time" size={24} color="#00b386" />
              <Text style={styles.timeText}>
                {schedule.time.toLocaleTimeString()}
              </Text>
            </TouchableOpacity>

            <View style={styles.daysContainer}>
              {DAYS.map(day => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    schedule.days.includes(day) && styles.dayButtonSelected
                  ]}
                  onPress={() => toggleDay(index, day)}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('reminder.toggleDay')} ${day}`}
                  accessibilityState={{ selected: schedule.days.includes(day) }}
                >
                  <Text style={[
                    styles.dayText,
                    schedule.days.includes(day) && styles.dayTextSelected
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addButton}
          onPress={addSchedule}
          accessibilityRole="button"
          accessibilityLabel={t('reminder.addSchedule')}
        >
          <MaterialIcons name="add" size={24} color="#00b386" />
          <Text style={styles.addButtonText}>{t('reminder.addSchedule')}</Text>
        </TouchableOpacity>

        <View style={styles.dateContainer}>
          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>{t('reminder.startDate')}</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel={t('reminder.selectStartDate')}
            >
              <Text>{startDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateField}>
            <Text style={styles.dateLabel}>{t('reminder.endDate')}</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndDatePicker(true)}
              accessibilityRole="button"
              accessibilityLabel={t('reminder.selectEndDate')}
            >
              <Text>{endDate.toLocaleDateString()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.preferencesContainer}>
          <Text style={styles.preferencesTitle}>{t('reminder.preferences')}</Text>
          
          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>{t('reminder.sound')}</Text>
            <Switch
              value={preferences.sound}
              onValueChange={(value) => setPreferences({ ...preferences, sound: value })}
              accessibilityRole="switch"
              accessibilityLabel={t('reminder.toggleSound')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>{t('reminder.vibration')}</Text>
            <Switch
              value={preferences.vibration}
              onValueChange={(value) => setPreferences({ ...preferences, vibration: value })}
              accessibilityRole="switch"
              accessibilityLabel={t('reminder.toggleVibration')}
            />
          </View>

          <View style={styles.preferenceItem}>
            <Text style={styles.preferenceLabel}>{t('reminder.reminderBefore')}</Text>
            <View style={styles.reminderBeforeContainer}>
              <TouchableOpacity
                style={styles.reminderBeforeButton}
                onPress={() => setPreferences({
                  ...preferences,
                  reminderBefore: Math.max(0, preferences.reminderBefore - 5)
                })}
                accessibilityRole="button"
                accessibilityLabel={t('reminder.decreaseTime')}
              >
                <MaterialIcons name="remove" size={24} color="#00b386" />
              </TouchableOpacity>
              <Text style={styles.reminderBeforeText}>
                {preferences.reminderBefore} {t('reminder.minutes')}
              </Text>
              <TouchableOpacity
                style={styles.reminderBeforeButton}
                onPress={() => setPreferences({
                  ...preferences,
                  reminderBefore: Math.min(60, preferences.reminderBefore + 5)
                })}
                accessibilityRole="button"
                accessibilityLabel={t('reminder.increaseTime')}
              >
                <MaterialIcons name="add" size={24} color="#00b386" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel={t('reminder.save')}
        >
          <Text style={styles.saveButtonText}>{t('reminder.save')}</Text>
        </TouchableOpacity>

        {showTimePicker && (
          <DateTimePicker
            value={schedules[selectedScheduleIndex].time}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={handleTimeChange}
          />
        )}

        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowStartDatePicker(false);
              if (date) setStartDate(date);
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, date) => {
              setShowEndDatePicker(false);
              if (date) setEndDate(date);
            }}
          />
        )}
      </ScrollView>
    </AccessibilityWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  scheduleContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 16,
  },
  timeText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  dayButtonSelected: {
    backgroundColor: '#00b386',
  },
  dayText: {
    color: '#666',
  },
  dayTextSelected: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#00b386',
    fontWeight: '500',
  },
  dateContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 16,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  preferencesContainer: {
    padding: 20,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  preferenceLabel: {
    fontSize: 16,
    color: '#333',
  },
  reminderBeforeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reminderBeforeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reminderBeforeText: {
    fontSize: 16,
    color: '#333',
    minWidth: 80,
    textAlign: 'center',
  },
  saveButton: {
    margin: 20,
    padding: 16,
    backgroundColor: '#00b386',
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MedicineReminder; 