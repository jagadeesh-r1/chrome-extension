document.getElementById('set-reminder').addEventListener('click', () => {
    const reminderText = document.getElementById('reminder').value;
    const timeInMinutes = parseInt(document.getElementById('time').value);
    const isRecurring = document.getElementById('recurring').checked;
    const recurringInterval = document.getElementById('recurring-interval').value;
  
    if (reminderText && timeInMinutes > 0) {
      const reminderTime = Date.now() + timeInMinutes * 60 * 1000;
      const reminder = { 
        text: reminderText, 
        time: reminderTime,
        isRecurring: isRecurring,
        recurringInterval: isRecurring ? parseInt(recurringInterval) : null,
        id: Date.now().toString()
      };
  
      chrome.storage.local.get(['reminders'], (result) => {
        const reminders = result.reminders || [];
        reminders.push(reminder);
        chrome.storage.local.set({ reminders });
  
        // Set Chrome alarm
        chrome.alarms.create(reminder.id, { when: reminderTime });
        displayReminders();
      });
    }
  });

  function formatTimeLeft(timeLeft) {
    const years = Math.floor(timeLeft / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((timeLeft % (1000 * 60 * 60 * 24 * 365)) / (1000 * 60 * 60 * 24 * 30));
    const days = Math.floor((timeLeft % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    return `${years}y ${months}m ${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

  function updateCountdown(reminderId, endTime) {
    const countdownElement = document.getElementById(`countdown-${reminderId}`);
    if (!countdownElement) return;

    const timeLeft = endTime - Date.now();
    if (timeLeft <= 0) {
      countdownElement.textContent = 'Time\'s up!';
      return;
    }

    countdownElement.textContent = formatTimeLeft(timeLeft);
  }
  
  function displayReminders() {
    chrome.storage.local.get(['reminders'], (result) => {
      const reminderList = document.getElementById('reminder-list');
      reminderList.innerHTML = '';
  
      (result.reminders || []).forEach(reminder => {
        const listItem = document.createElement('li');
        listItem.className = 'reminder-item';
        
        const reminderContent = document.createElement('div');
        reminderContent.className = 'reminder-content';
        
        const title = document.createElement('div');
        title.className = 'reminder-title';
        title.textContent = reminder.text;
        
        const countdown = document.createElement('div');
        countdown.id = `countdown-${reminder.id}`;
        countdown.className = 'countdown';
        updateCountdown(reminder.id, reminder.time);
        
        const recurringBadge = document.createElement('div');
        recurringBadge.className = 'recurring-badge';
        recurringBadge.textContent = reminder.isRecurring ? '🔄 Recurring' : '';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.onclick = () => deleteReminder(reminder.id);
        
        reminderContent.appendChild(title);
        reminderContent.appendChild(countdown);
        reminderContent.appendChild(recurringBadge);
        listItem.appendChild(reminderContent);
        listItem.appendChild(deleteBtn);
        reminderList.appendChild(listItem);
      });

      // Start countdown timers
      setInterval(() => {
        (result.reminders || []).forEach(reminder => {
          updateCountdown(reminder.id, reminder.time);
        });
      }, 1000);
    });
  }

  function deleteReminder(reminderId) {
    chrome.storage.local.get(['reminders'], (result) => {
      const reminders = result.reminders.filter(r => r.id !== reminderId);
      chrome.storage.local.set({ reminders });
      chrome.alarms.clear(reminderId);
      displayReminders();
    });
  }
  
  displayReminders();
  