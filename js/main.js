// js/main.js
game.initializeMap();

//Give player 500 coins every day
setInterval(() => {
  game.coinCount += config.coinPerDay;
  game.updateDashboard();
}, config.dayDuration);

// Admin button functionality
document.getElementById('admin-button').addEventListener('click', () => {
  document.getElementById('admin-panel').style.display = 'block';
});

document.getElementById('login-button').addEventListener('click', () => {
  const password = document.getElementById('password').value;
  if (password === config.adminPassword) {
    document.getElementById('admin-controls').style.display = 'block';
    document.getElementById('password').style.display = 'none';
    document.getElementById('login-button').style.display = 'none';
  } else {
    alert('Incorrect password!');
  }
});

// Close Admin Panel
document.getElementById('close-admin-panel').addEventListener('click', () => {
  document.getElementById('admin-panel').style.display = 'none';
  // Reset the admin panel for next use
  document.getElementById('admin-controls').style.display = 'none';
  document.getElementById('password').style.display = 'block';
  document.getElementById('login-button').style.display = 'block';
  document.getElementById('password').value = ''; // Clear the password field
});

// Outbreak button functionality
document.getElementById('outbreak-button').addEventListener('click', () => {
  game.startOutbreak();
  document.getElementById('outbreak-button').disabled = true; // Disable the button after outbreak starts
});

// Quarantine button functionality
document.getElementById('quarantine-button').addEventListener('click', () => {
  game.startQuarantine();
});
