// js/utils.js
const utils = {
  getAdjacentCells(index, rows, cols) {
    const adjacent = [];
    const row = Math.floor(index / cols);
    const col = index % cols;

    for (let i = -config.spreadRadius; i <= config.spreadRadius; i++) {
      for (let j = -config.spreadRadius; j <= config.spreadRadius; j++) {
        if (row + i >= 0 && row + i < rows && col + j >= 0 && col + j < cols) {
          if (i !== 0 || j !== 0) {
            if (Math.abs(i) + Math.abs(j) <= config.spreadRadius) {
              adjacent.push(index + i * cols + j);
            }
          }
        }
      }
    }

    return adjacent;
  },

  showTooltip(cellIndex, city) {
    const cellData = city[cellIndex];
    const tooltip = document.getElementById(`cell-${cellIndex}`).querySelector('.tooltip');
    let tooltipContent = '';

    if (cellData.type === 'residential') {
      tooltipContent += `<b>Loại:</b> Khu dân cư<br>`;
      tooltipContent += `<b>Mật độ dân số:</b> ${cellData.populationDensity} người/khu<br>`;
      tooltipContent += `<b>Độ ẩm:</b> ${cellData.humidity}%<br>`;
      tooltipContent += `<b>Nhiệt độ:</b> ${cellData.temperature}°C<br>`;
      tooltipContent += `<b>Tỷ lệ di chuyển:</b> ${cellData.movementRate}%/ngày<br>`;
      tooltipContent += `<b>Ca nhiễm:</b> ${cellData.infected}<br>`;
      tooltipContent += `<b>Miễn dịch:</b> ${cellData.immune}<br>`;
      tooltipContent += `<b>Tỉ lệ lây nhiễm:</b> ${(cellData.infected / cellData.population * 100).toFixed(2)}%<br>`;
      tooltipContent += `<b>Bệnh viện:</b> ${cellData.hospitals} 🏥<br>`;
      tooltipContent += `<b>Phòng lab:</b> ${cellData.labs} 🧪<br>`;
      tooltipContent += `<b>Khoanh vùng:</b> ${cellData.isQuarantined ? 'Rồi' : 'Chưa'}<br>`;
    } else if (cellData.type === 'hospital') {
      tooltipContent += `<b>Loại:</b> Bệnh viện<br>`;
    } else if (cellData.type === 'lab') {
      tooltipContent += `<b>Loại:</b> Phòng thí nghiệm<br>`;
    }

    tooltip.innerHTML = tooltipContent;
    tooltip.style.opacity = 1;
  },

  hideTooltip(event) {
    const tooltip = event.target.querySelector('.tooltip');
    if (tooltip) {
      tooltip.style.opacity = 0;
    }
  },

  addNotification(type, message) {
    const notificationsContainer = document.getElementById('notifications-container');
    const notification = document.createElement('div');
    notification.classList.add('notification', type);
    notification.innerText = message;
    notificationsContainer.appendChild(notification);

    // Automatically remove the notification after a few seconds
    setTimeout(() => {
      notificationsContainer.removeChild(notification);
    }, 5000);
  },

  updateCellColor(cell, infectionRate) {
    cell.classList.remove('low-risk', 'medium-risk', 'high-risk');
    if (infectionRate > 0.5) {
      cell.classList.add('high-risk');
    } else if (infectionRate > 0.2) {
      cell.classList.add('medium-risk');
    } else if (infectionRate > 0) {
      cell.classList.add('low-risk');
    }
  },

  triggerVirusAlert(message) {
    const alert = document.querySelector('.virus-alert');
    alert.innerText = message;
    alert.style.display = 'none';
    setTimeout(() => {
      alert.style.display = 'flex';
    }, 100);
  }
};
