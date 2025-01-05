// js/main.js
game.initializeMap();

// Cho người chơi 500 coin mỗi ngày
setInterval(() => {
  game.coinCount += config.coinPerDay;
  game.updateDashboard();
}, config.dayDuration);

// Nút Admin
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

// Đóng Admin Panel
document.getElementById('close-admin-panel').addEventListener('click', () => {
  document.getElementById('admin-panel').style.display = 'none';
  document.getElementById('admin-controls').style.display = 'none';
  document.getElementById('password').style.display = 'block';
  document.getElementById('login-button').style.display = 'block';
  document.getElementById('password').value = '';
});

// Nút Bùng Phát Dịch
document.getElementById('outbreak-button').addEventListener('click', () => {
  game.startOutbreak();
  document.getElementById('outbreak-button').disabled = true;
});

// Nút Khoanh Vùng
// js/main.js
document.getElementById('quarantine-button').addEventListener('click', () => {
  game.startQuarantine();
});

// Đóng panel thông tin chi tiết
document.getElementById('close-cell-info-panel').addEventListener('click', () => {
  utils.hideCellInfo();
});

// Nút Smart Filter
document.getElementById('smart-filter-button').addEventListener('click', () => {
  game.showTopRiskyAreas();
});
