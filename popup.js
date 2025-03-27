document.getElementById('set-reminder').addEventListener('click', () => {
    const reminderText = document.getElementById('reminder').value;
    const isTimer = document.querySelector('.time-option[data-option="timer"]').classList.contains('active');
    let reminderTime;

    if (isTimer) {
      const timeInMinutes = parseInt(document.getElementById('time').value);
      if (!reminderText || timeInMinutes <= 0) return;
      reminderTime = Date.now() + timeInMinutes * 60 * 1000;
    } else {
      const selectedDate = document.getElementById('selected-date');
      const selectedTime = document.getElementById('selected-time');
      
      if (!reminderText || !selectedDate.dataset.value || !selectedTime.dataset.value) {
        alert('Please select both date and time');
        return;
      }

      // Combine date and time into a single timestamp
      const [year, month, day] = selectedDate.dataset.value.split('-');
      const [hours, minutes] = selectedTime.dataset.value.split(':');
      reminderTime = new Date(year, month - 1, day, hours, minutes).getTime();
      
      // Check if the selected time is in the past
      if (reminderTime <= Date.now()) {
        alert('Please select a future date and time');
        return;
      }
    }

    const isRecurring = document.getElementById('recurring').checked;
    const recurringInterval = isRecurring ? parseInt(document.getElementById('recurring-interval').value) : null;

    const reminder = { 
      text: reminderText, 
      time: reminderTime,
      isRecurring: isRecurring,
      recurringInterval: recurringInterval,
      id: Date.now().toString(),
      type: isTimer ? 'timer' : 'datetime'
    };

    chrome.storage.local.get(['reminders'], (result) => {
      const reminders = result.reminders || [];
      reminders.push(reminder);
      chrome.storage.local.set({ reminders });

      // Set Chrome alarm
      chrome.alarms.create(reminder.id, { when: reminderTime });
      displayReminders();
    });
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
        
        const typeBadge = document.createElement('div');
        typeBadge.className = 'type-badge';
        typeBadge.textContent = reminder.type === 'timer' ? 'Timer' : 'Calendar';
        
        const recurringBadge = document.createElement('div');
        recurringBadge.className = 'recurring-badge';
        recurringBadge.textContent = reminder.isRecurring ? 'Recurring' : '';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'X';
        deleteBtn.onclick = () => deleteReminder(reminder.id);
        
        reminderContent.appendChild(title);
        reminderContent.appendChild(countdown);
        reminderContent.appendChild(typeBadge);
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
  