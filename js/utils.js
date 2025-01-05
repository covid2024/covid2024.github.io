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

    showCellInfo(cellIndex, city) {
        const cellData = city[cellIndex];
        const cellInfoPanel = document.getElementById('cell-info-panel');
        const cellInfoContent = document.getElementById('cell-info-content');

        let content = '';

        if (cellData.type === 'residential') {
            content += `<b>Loại:</b> Khu dân cư<br>`;
            content += `<b>Mật độ dân số:</b> ${cellData.populationDensity} người/khu<br>`;
            content += `<b>Độ ẩm:</b> ${cellData.humidity}%<br>`;
            content += `<b>Nhiệt độ:</b> ${cellData.temperature}°C<br>`;
            content += `<b>Tỷ lệ di chuyển:</b> ${cellData.movementRate}%/ngày<br>`;
            content += `<b>Ca nhiễm:</b> ${cellData.infected}<br>`;
            content += `<b>Miễn dịch:</b> ${cellData.immune}<br>`;
            content += `<b>Tỉ lệ lây nhiễm:</b> ${((cellData.infected / cellData.population) * 100).toFixed(2)}%<br>`;
            content += `<b>Bệnh viện:</b> ${cellData.hospitals} 🏥<br>`;
            content += `<b>Phòng lab:</b> ${cellData.labs} 🧪<br>`;
            content += `<b>Khoanh vùng:</b> ${cellData.isQuarantined ? 'Rồi' : 'Chưa'}<br>`;
        } else if (cellData.type === 'hospital') {
            content += `<b>Loại:</b> Bệnh viện<br>`;
        } else if (cellData.type === 'lab') {
            content += `<b>Loại:</b> Phòng thí nghiệm<br>`;
        }

        cellInfoContent.innerHTML = content;
        cellInfoPanel.style.display = 'block';
    },

    hideCellInfo() {
        document.getElementById('cell-info-panel').style.display = 'none';
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
