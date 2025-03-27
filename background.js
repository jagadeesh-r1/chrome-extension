chrome.alarms.onAlarm.addListener((alarm) => {
    chrome.storage.local.get(['reminders'], (result) => {
      const reminder = result.reminders.find(r => r.id === alarm.name);
      if (!reminder) return;

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icon.png',
        title: 'Reminder!',
        message: `It's time to: ${reminder.text}`,
        priority: 1
      });

      // Handle recurring reminders
      if (reminder.isRecurring && reminder.recurringInterval) {
        const nextTime = Date.now() + reminder.recurringInterval * 60 * 1000;
        const updatedReminder = {
          ...reminder,
          time: nextTime
        };
        
        // Update the reminder in storage
        const updatedReminders = result.reminders.map(r => 
          r.id === reminder.id ? updatedReminder : r
        );
        chrome.storage.local.set({ reminders: updatedReminders });
        
        // Set the next alarm
        chrome.alarms.create(reminder.id, { when: nextTime });
      } else {
        // Remove non-recurring reminder
        const reminders = result.reminders.filter(r => r.id !== reminder.id);
        chrome.storage.local.set({ reminders });
      }
    });
  });

  // Handle browser startup to restore alarms
  chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get(['reminders'], (result) => {
      const reminders = result.reminders || [];
      reminders.forEach(reminder => {
        if (reminder.time > Date.now()) {
          chrome.alarms.create(reminder.id, { when: reminder.time });
        } else if (reminder.isRecurring && reminder.recurringInterval) {
          // For recurring reminders that have passed, set next occurrence
          const nextTime = Date.now() + reminder.recurringInterval * 60 * 1000;
          const updatedReminder = {
            ...reminder,
            time: nextTime
          };
          chrome.alarms.create(reminder.id, { when: nextTime });
          
          // Update storage with new time
          const updatedReminders = reminders.map(r => 
            r.id === reminder.id ? updatedReminder : r
          );
          chrome.storage.local.set({ reminders: updatedReminders });
        }
      });
    });
  });
  