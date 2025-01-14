// js/game.js
const game = {
    totalCases: 0,
    newCases: 0,
    recovered: 0,
    deaths: 0,
    day: 1,
    hospitalsBuilt: 0,
    labsBuilt: 0,
    measuresTaken: 0,
    coinCount: 0,
    supplyCount: 100,
    isBuilding: false,
    buildingType: null,
    nextMutationDay: 0,
    gameStartTime: Date.now(),
    researchProgress: 0,
    city: [],
    outbreakStarted: false,
    simulationInterval: null,
    isQuarantining: false,
    quarantineRadius: 1,
    quarantineCost: config.quarantineCost,
    quarantineSupplyCost: config.quarantineSupplyCost,
    measures: {
        socialDistancing: {
            name: 'Dãn Cách',
            cost: 500,
            supplyCost: 10,
            deathRateReduction: 0.2,
            spreadRateReduction: 0.3,
            applied: false,
        },
        maskSelling: {
            name: 'Bán Khẩu Trang',
            cost: 200,
            supplyCost: 50,
            deathRateReduction: 0.1,
            spreadRateReduction: 0.2,
            applied: false,
        },
        hygieneEducation: {
            name: 'Tuyên Truyền Vệ Sinh',
            cost: 300,
            supplyCost: 5,
            deathRateReduction: 0.15,
            spreadRateReduction: 0.1,
            applied: false,
        },
        travelRestriction: {
            name: 'Hạn Chế Đi Lại',
            cost: 800,
            supplyCost: 20,
            deathRateReduction: 0.1,
            spreadRateReduction: 0.5,
            applied: false,
        },
    },

    adjustCoins() {
        const adjustment = parseInt(document.getElementById('coin-adjustment').value);
        if (!isNaN(adjustment)) {
            this.coinCount += adjustment;
            this.updateDashboard();
            document.getElementById('coin-adjustment').value = 0; // Reset input
        } else {
            alert('Invalid coin adjustment value.');
        }
    },

    adjustSupplies() {
        const adjustment = parseInt(document.getElementById('supply-adjustment').value);
        if (!isNaN(adjustment)) {
            this.supplyCount += adjustment;
            this.updateDashboard();
            document.getElementById('supply-adjustment').value = 0; // Reset input
        } else {
            alert('Invalid supply adjustment value.');
        }
    },
	
	calculateRisk(cellIndex) {
        const cell = this.city[cellIndex];
        let risk = 0;

        // Tính toán nguy cơ dựa trên các đặc điểm
        risk += cell.populationDensity * 0.4; // Mật độ dân số
        risk += cell.humidity * 0.2; // Độ ẩm
        risk += cell.temperature * 0.2; // Nhiệt độ
        risk += cell.movementRate * 0.2; // Tỷ lệ di chuyển

        // Kiểm tra xem có bệnh viện hoặc phòng lab gần đó không
        const adjacentCells = utils.getAdjacentCells(cellIndex, config.gridRows, config.gridCols);
        let nearbyHospitals = 0;
        let nearbyLabs = 0;

        adjacentCells.forEach(adjIndex => {
            if (this.city[adjIndex].type === 'hospital') {
                nearbyHospitals++;
            } else if (this.city[adjIndex].type === 'lab') {
                nearbyLabs++;
            }
        });

        // Giảm nguy cơ nếu có bệnh viện hoặc phòng lab gần đó
        risk -= nearbyHospitals * 10;
        risk -= nearbyLabs * 5;

        return risk;
    },

    // Hàm hiển thị 5 khu dân cư có nguy cơ bùng dịch cao nhất
    showTopRiskyAreas() {
        const risks = this.city.map((cell, index) => ({
            index,
            risk: this.calculateRisk(index),
        }));

        // Sắp xếp theo nguy cơ giảm dần
        risks.sort((a, b) => b.risk - a.risk);

        // Chọn ngẫu nhiên 5 ô từ top 10 ô có nguy cơ cao nhất
        const top10 = risks.slice(0, 10);
        const top5 = [];
        while (top5.length < 5 && top10.length > 0) {
            const randomIndex = Math.floor(Math.random() * top10.length);
            top5.push(top10.splice(randomIndex, 1)[0]);
        }

        // Hiển thị thông báo
        let message = "Top 5 khu vực có nguy cơ bùng dịch cao nhất (ngẫu nhiên):\n";
        top5.forEach((area, i) => {
            message += `${i + 1}. Ô ${area.index} - Nguy cơ: ${area.risk.toFixed(2)}\n`;
        });

        alert(message);

        // Trả về danh sách các ô được chọn
        return top5.map(area => area.index);
    },


    initializeMap() {
        const map = document.querySelector('.map');
        map.innerHTML = ''; // Clear existing cells

        // Khởi tạo các ô với thông số random
        for (let i = 0; i < config.gridRows * config.gridCols; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell residential';
            cell.id = `cell-${i}`;

            // Thêm sự kiện click để hiển thị thông tin chi tiết
            cell.addEventListener('click', () => {
                utils.showCellInfo(i, this.city);
            });

            // Random các thông số của ô
            const cellData = {
                type: 'residential',
                infected: 0,
                immune: 0,
                population: 100, // Dân số cố định hoặc có thể random
                populationDensity: this.getRandomNumber(1000, 5000), // Mật độ dân số random từ 1000 đến 5000
                humidity: this.getRandomNumber(50, 90), // Độ ẩm random từ 50% đến 90%
                temperature: this.getRandomNumber(20, 35), // Nhiệt độ random từ 20°C đến 35°C
                movementRate: this.getRandomNumber(10, 40), // Tỷ lệ di chuyển random từ 10% đến 40%
                hospitals: 0,
                labs: 0,
                labLevel: 0,
                isQuarantined: false,
            };

            this.city.push(cellData);
            map.appendChild(cell);
        }

        // Set next day for mutation
        this.nextMutationDay = Math.floor(Math.random() * (config.initialMutationIn[1] - config.initialMutationIn[0] + 1)) + config.initialMutationIn[0];
        console.log("next mutation: " + this.nextMutationDay);
        this.updateDashboard();
    },

    // Hàm random số trong khoảng [min, max]
    getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    startOutbreak() {
        if (!this.outbreakStarted) {
            this.outbreakStarted = true;

            // Lấy danh sách các ô có nguy cơ cao từ Smart Filter
            const riskyAreas = this.showTopRiskyAreas();

            // Chọn ngẫu nhiên một ô từ danh sách để bắt đầu bùng phát
            const patientZeroIndex = riskyAreas[Math.floor(Math.random() * riskyAreas.length)];
            this.city[patientZeroIndex].infected = 10; // Bắt đầu với 10 ca nhiễm
            this.totalCases = 10;
            this.newCases = 10;

            // Update the visuals for the cell
            this.updateCellVisuals(patientZeroIndex, this.city);
            utils.addNotification('new-case', "Ca nhiễm đầu tiên xuất hiện tại ô " + patientZeroIndex);

            // Simulation loop
            this.simulationInterval = setInterval(() => {
                this.simulateSpread();
            }, config.dayDuration); // Chạy mỗi ngày
        }
    },


    // Introduce patient zero to a random cell
    introducePatientZero() {
        // Find all residential cells
        const residentialCells = this.city.reduce((acc, cell, index) => {
            if (cell.type === 'residential') {
                acc.push(index);
            }
            return acc;
        }, []);

        // Choose a random residential cell for patient zero
        const patientZeroIndex = residentialCells[Math.floor(Math.random() * residentialCells.length)];
        this.city[patientZeroIndex].infected = 10; // Increased from 1 to ensure spread
        this.totalCases = 10; // Updated to match the initial infected count
        this.newCases = 10; // Updated to match the initial infected count

        // Update the visuals for the cell
        this.updateCellVisuals(patientZeroIndex, this.city);
        utils.addNotification('new-case', "Ca nhiễm đầu tiên xuất hiện tại ô " + patientZeroIndex);
    },

    vaccineSuccessRate: 0, // Mức độ thành công của vaccine (0% - 100%)

    // Hàm áp dụng vaccine
    applyVaccine() {
        const vaccineRate = parseInt(document.getElementById('vaccine-success-rate').value);
        if (!isNaN(vaccineRate) && vaccineRate >= 0 && vaccineRate <= 100) {
            this.vaccineSuccessRate = vaccineRate;
            alert(`Vaccine đã được áp dụng với mức độ thành công ${vaccineRate}%`);

            // Áp dụng hiệu ứng vaccine ngay lập tức
            this.simulateVaccineEffects();
            this.updateDashboard(); // Cập nhật dashboard ngay lập tức
        } else {
            alert('Vui lòng nhập mức độ thành công của vaccine từ 0% đến 100%');
        }
    },

    // Hàm mô phỏng hiệu ứng của vaccine
    simulateVaccineEffects() {
        for (let i = 0; i < this.city.length; i++) {
            if (this.city[i].type === 'residential' && this.city[i].infected > 0) {
                // Tính toán số ca hồi phục và tử vong dựa trên vaccine
                let recoveredToday = Math.floor(this.city[i].infected * (this.vaccineSuccessRate / 100));
                let deathsToday = Math.floor(this.city[i].infected * (config.deathRate * (1 - this.vaccineSuccessRate / 100)));

                // Đảm bảo số ca hồi phục không vượt quá số ca nhiễm
                recoveredToday = Math.min(recoveredToday, this.city[i].infected);

                this.city[i].infected -= (recoveredToday + deathsToday);
                this.city[i].immune += recoveredToday;
                this.city[i].infected = Math.max(0, this.city[i].infected);

                this.recovered += recoveredToday;
                this.deaths += deathsToday;

                if (recoveredToday > 0) {
                    utils.addNotification('recovered', `+${recoveredToday} Ca Hồi Phục ở ô ${i} (Vaccine)`);
                }
                if (deathsToday > 0) {
                    utils.addNotification('death', `-${deathsToday} Ca Tử Vong ở ô ${i} (Vaccine)`);
                }

                // Cập nhật màu sắc của ô
                this.updateCellVisuals(i, this.city);
            }
        }
    },

    // js/game.js
	lastSpreadDay: 0, // Theo dõi ngày cuối cùng dịch lây lan

    simulateSpread() {
        let currentNewCases = 0;
        let currentRecovered = 0;
        let currentDeaths = 0;

        // Tính toán tiến độ nghiên cứu
        this.researchProgress += this.calculateResearchProgress();

        // Tạo bản sao của thành phố để mô phỏng
        let cityCopy = JSON.parse(JSON.stringify(this.city));

        // Tính toán tổng giảm tỷ lệ tử vong và tỷ lệ lây lan từ các biện pháp
        let totalDeathRateReduction = 0;
        let totalSpreadRateReduction = 0;
        for (const key in this.measures) {
            if (this.measures[key].applied) {
                totalDeathRateReduction += this.measures[key].deathRateReduction;
                totalSpreadRateReduction += this.measures[key].spreadRateReduction;
            }
        }

        // Logic lây lan
        for (let i = 0; i < this.city.length; i++) {
            if (this.city[i].type === 'residential' && this.city[i].infected > 0) {
                const adjacentCells = utils.getAdjacentCells(i, config.gridRows, config.gridCols);

                for (const adjIndex of adjacentCells) {
                    if (cityCopy[adjIndex].type === 'residential' && cityCopy[adjIndex].infected < cityCopy[adjIndex].population) {
                        let hasLabEffect = false;

                        // Kiểm tra xem có phòng lab gần đó không
                        const neighborCells = utils.getAdjacentCells(adjIndex, config.gridRows, config.gridCols);
                        for (const neighborIndex of neighborCells) {
                            if (this.city[neighborIndex].type === 'lab') {
                                hasLabEffect = true;
                                break;
                            }
                        }

                        let chanceOfSpreading = config.chanceOfSpreading;
                        // Giảm tỷ lệ lây lan nếu có phòng lab gần đó
                        if (hasLabEffect) {
                            chanceOfSpreading *= (1 - config.labLocalSpreadReduction);
                        }

                        // Giảm tỷ lệ lây lan rất nhiều nếu ô được khoanh vùng
                        if (cityCopy[adjIndex].isQuarantined) {
                            chanceOfSpreading *= 0.1; // Giảm 90%
                        }

                        // Kiểm tra xem dịch có lây lan sang ô kế bên không
                        if (Math.random() < chanceOfSpreading) {
                            // Tính toán số ca lây nhiễm
                            let transfer = Math.floor(
                                (cityCopy[i].infected / cityCopy[i].population) *
                                config.spreadRate *
                                (1 - totalSpreadRateReduction) *
                                cityCopy[adjIndex].population
                            );

                            // Nghiên cứu giảm số ca lây nhiễm
                            transfer = Math.floor(transfer * (1 - this.researchProgress / 100));
                            transfer = Math.min(transfer, cityCopy[adjIndex].population - cityCopy[adjIndex].infected);

                            if (transfer > 0) {
                                cityCopy[adjIndex].infected += transfer;
                                currentNewCases += transfer;
                                this.updateCellVisuals(adjIndex, cityCopy);
                                utils.addNotification('new-case', `+${transfer} Ca Nhiễm Mới ở ô ${adjIndex}`);
                            }
                            
                        }
                    }
                }
            }

            // Mortality, recovery, and hospital effects
            for (let i = 0; i < this.city.length; i++) {
                let cell = document.getElementById(`cell-${i}`);
                let hasHospitalEffect = false;

                // Check for nearby hospitals for each cell
                const adjacentCells = utils.getAdjacentCells(i, config.gridRows, config.gridCols);
                for (const adjIndex of adjacentCells) {
                    if (this.city[adjIndex].type === 'hospital') {
                        hasHospitalEffect = true;
                        break; // Found a hospital, no need to check further
                    }
                }

                if (cityCopy[i].type === 'residential') {
                    let infectedBefore = cityCopy[i].infected;

                    // Mortality and recovery
                    let recoveredToday = Math.floor(cityCopy[i].infected * (config.recoveryRate + (this.vaccineSuccessRate / 100)));
                    if (hasHospitalEffect) {
                        recoveredToday = Math.floor(cityCopy[i].infected * (config.recoveryRate + config.hospitalRecoveryBonus + (this.vaccineSuccessRate / 100)));
                    }

                    let deathsToday = Math.floor(cityCopy[i].infected * (config.deathRate * (1 - totalDeathRateReduction) - this.researchProgress / config.researchImpactOnDeathRate));
                    deathsToday = Math.max(0, deathsToday);

                    // Đảm bảo số ca hồi phục không vượt quá số ca nhiễm
                    recoveredToday = Math.min(recoveredToday, cityCopy[i].infected);

                    cityCopy[i].infected -= (recoveredToday + deathsToday);
                    cityCopy[i].immune += recoveredToday;
                    cityCopy[i].infected = Math.max(0, cityCopy[i].infected);

                    currentRecovered += recoveredToday;
                    currentDeaths += deathsToday;

                    if (recoveredToday > 0) {
                        utils.addNotification('recovered', `+${recoveredToday} Ca Hồi Phục ở ô ${i}`);
                    }
                    if (deathsToday > 0) {
                        utils.addNotification('death', `-${deathsToday} Ca Tử Vong ở ô ${i}`);
                    }
                    // Update cell color based on new infection numbers
                    this.updateCellVisuals(i, cityCopy);
                }
                // Treat patient in hospital
                else if (cityCopy[i].type === 'hospital') {
                    adjacentCells.forEach(adjIndex => {
                        if (
                            cityCopy[adjIndex].type === 'residential' &&
                            cityCopy[adjIndex].infected > 0
                        ) {
                            // Move infected from adjacent cells to hospital for treatment
                            let transfer = Math.floor(cityCopy[adjIndex].infected * 0.2); // 20% of infected in adjacent cells are moved to the hospital
                            transfer = Math.min(transfer, cityCopy[i].population - cityCopy[i].infected);

                            cityCopy[adjIndex].infected -= transfer;
                            cityCopy[i].infected += transfer;

                            // Apply increased treatment effect in hospital
                            let treatedToday = Math.floor(cityCopy[i].infected * (config.recoveryRate + config.hospitalRecoveryBonus * this.hospitalsBuilt + (this.vaccineSuccessRate / 100)));
                            cityCopy[i].infected -= treatedToday;
                            cityCopy[i].immune += treatedToday;
                            currentRecovered += treatedToday; // Accumulate recovered cases

                            if (transfer > 0) utils.addNotification('new-case', `+${transfer} Ca Nhiễm Mới ở ô ${i}`);
                            if (treatedToday > 0) utils.addNotification('recovered', `+${treatedToday} Ca Hồi Phục ở ô ${i}`);
                        }
                    });
                }
            }

            // Update the city with the changes from this tick
            this.city = cityCopy;

            // Update newCases, deaths, and recovered AFTER iterating through all cells
            this.newCases = currentNewCases;
            this.deaths += currentDeaths;
            this.recovered += currentRecovered;

            // Cập nhật tổng số ca nhiễm
            this.totalCases += currentNewCases;

            // Update dashboard
            this.updateDashboard();
        }

        // Advance the day counter
        if (daysPassed >= this.day) {
            this.day = daysPassed + 1;
            document.querySelector('.day').innerText = 'Ngày: ' + this.day;

            // Trigger mutation alert on specified days
            if (this.day === this.nextMutationDay) {
                utils.triggerVirusAlert("Phát hiện đột biến virus!");
                this.nextMutationDay = this.day + Math.floor(Math.random() * (config.mutationInterval[1] - config.mutationInterval[0] + 1)) + config.mutationInterval[0];
            }
        }
    },
	
    quarantineCells(centerIndex, radius) {
        const centerRow = Math.floor(centerIndex / config.gridCols);
        const centerCol = centerIndex % config.gridCols;

        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const row = centerRow + i;
                const col = centerCol + j;
                const index = row * config.gridCols + col;

                if (row >= 0 && row < config.gridRows && col >= 0 && col < config.gridCols && this.city[index].type === 'residential') {
                    this.city[index].isQuarantined = true;
                    document.getElementById(`cell-${index}`).classList.add('quarantine');
                }
            }
        }
    },

    updateDashboard() {
        document.getElementById('total-cases').innerText = this.totalCases;
        document.getElementById('new-cases').innerText = this.newCases;
        document.getElementById('death-rate').innerText = this.deaths === 0 ? "0%" : ((this.deaths / (this.deaths + this.recovered)) * 100).toFixed(2) + "%";
        document.getElementById('recovered-cases').innerText = this.recovered;
        document.getElementById('hospitals-built').innerText = this.hospitalsBuilt;
        document.getElementById('labs-built').innerText = this.labsBuilt;
        document.getElementById('coin-count').innerText = this.coinCount;
        document.getElementById('supply-count').innerText = this.supplyCount;
    },

    startBuilding(type) {
        if ((type === 'hospital' && this.coinCount >= config.hospitalCost) || (type === 'lab' && this.coinCount >= config.labCost)) {
            this.isBuilding = true;
            this.buildingType = type;

            // Highlight buildable cells (any residential cell)
            const cells = document.querySelectorAll('.cell');
            cells.forEach((cell, index) => {
                if (this.city[index].type === 'residential') {
                    cell.style.cursor = 'copy';
                } else {
                    cell.style.cursor = 'not-allowed';
                }
            });
        } else {
            alert("Not enough coins!");
        }
    },

    // Các thuộc tính khác giữ nguyên...
    quarantineCostPerCell: 200, // Mỗi ô tốn 200 coin
    maxQuarantineCells: 10, // Tối đa 10 ô được khoanh vùng
    selectedQuarantineCells: [], // Danh sách các ô được chọn để khoanh vùng

    startQuarantine() {
        if (this.coinCount >= this.quarantineCostPerCell) {
            this.isQuarantining = true;
            this.selectedQuarantineCells = []; // Reset danh sách ô được chọn

            // Thông báo cho người chơi
            alert(`Bạn có thể chọn tối đa ${this.maxQuarantineCells} ô để khoanh vùng. Mỗi ô tốn ${this.quarantineCostPerCell} coin.`);

            // Highlight các ô có thể khoanh vùng
            const cells = document.querySelectorAll('.cell');
            cells.forEach((cell, index) => {
                if (this.city[index].type === 'residential') {
                    cell.style.cursor = 'pointer';
                    cell.addEventListener('click', () => this.handleQuarantineSelection(index));
                } else {
                    cell.style.cursor = 'not-allowed';
                }
            });
        } else {
            alert("Không đủ coin để khoanh vùng!");
        }
    },

    handleQuarantineSelection(cellIndex) {
        if (this.isQuarantining && this.selectedQuarantineCells.length < this.maxQuarantineCells) {
            // Kiểm tra xem ô đã được chọn chưa
            if (!this.selectedQuarantineCells.includes(cellIndex)) {
                this.selectedQuarantineCells.push(cellIndex); // Thêm ô vào danh sách chọn
                document.getElementById(`cell-${cellIndex}`).classList.add('quarantine-selected'); // Đánh dấu ô được chọn
            }
        } else {
            alert(`Bạn đã chọn đủ ${this.maxQuarantineCells} ô.`);
        }
    },

    applyQuarantine() {
        if (this.selectedQuarantineCells.length > 0) {
            const totalCost = this.selectedQuarantineCells.length * this.quarantineCostPerCell;

            if (this.coinCount >= totalCost) {
                this.coinCount -= totalCost; // Trừ coin
                this.selectedQuarantineCells.forEach(cellIndex => {
                    this.city[cellIndex].isQuarantined = true;
                    document.getElementById(`cell-${cellIndex}`).classList.add('quarantine');
                });

                alert(`Khoanh vùng thành công ${this.selectedQuarantineCells.length} ô. Tổng chi phí: ${totalCost} coin.`);
                this.updateDashboard();
            } else {
                alert("Không đủ coin để khoanh vùng!");
            }
        } else {
            alert("Bạn chưa chọn ô nào để khoanh vùng.");
        }

        // Reset trạng thái khoanh vùng
        this.isQuarantining = false;
        this.selectedQuarantineCells = [];

        // Reset cursor và event listener
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.style.cursor = 'pointer';
            cell.removeEventListener('click', this.handleQuarantineSelection);
        });
    },

    handleCellClick(cellIndex) {
        if (this.isBuilding && this.city[cellIndex].type === 'residential') {
            if (this.buildingType === 'hospital') {
                this.coinCount -= config.hospitalCost;
                this.hospitalsBuilt++;
                this.city[cellIndex].type = 'hospital';
                this.city[cellIndex].population = 0; // Reset population when building
                this.city[cellIndex].infected = 0;   // Reset infected when building
                this.city[cellIndex].hospitals = 1;
                this.city[cellIndex].labs = 0; //Remove lab if exist
                document.getElementById(`cell-${cellIndex}`).className = 'cell hospital';
            } else if (this.buildingType === 'lab') {
                this.coinCount -= config.labCost;
                this.labsBuilt++;
                this.city[cellIndex].type = 'lab';
                this.city[cellIndex].population = 0; // Reset population when building
                this.city[cellIndex].infected = 0;   // Reset infected when building
                this.city[cellIndex].hospitals = 0; //Remove hospital if exist
                this.city[cellIndex].labs = 1;
                this.city[cellIndex].labLevel = 1;   // Set lab level to 1 (basic lab)
                document.getElementById(`cell-${cellIndex}`).className = 'cell lab';
            }

            this.isBuilding = false;
            this.buildingType = null;
            this.measuresTaken++;
            this.updateDashboard();

            // Reset cursor for all cells
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.style.cursor = 'pointer';
            });
        } else if (this.isQuarantining && this.city[cellIndex].type === 'residential') {
            this.coinCount -= this.quarantineCost;
            this.supplyCount -= this.quarantineSupplyCost;
            this.quarantineCells(cellIndex, this.quarantineRadius);
            this.isQuarantining = false;

            // Reset cursor for all cells
            const cells = document.querySelectorAll('.cell');
            cells.forEach(cell => {
                cell.style.cursor = 'pointer';
            });
            this.updateDashboard();
        }
    },

    quarantineCells(centerIndex, radius) {
        const centerRow = Math.floor(centerIndex / config.gridCols);
        const centerCol = centerIndex % config.gridCols;

        for (let i = -radius; i <= radius; i++) {
            for (let j = -radius; j <= radius; j++) {
                const row = centerRow + i;
                const col = centerCol + j;
                const index = row * config.gridCols + col;

                if (row >= 0 && row < config.gridRows && col >= 0 && col < config.gridCols && this.city[index].type === 'residential') {
                    this.city[index].isQuarantined = true;
                    document.getElementById(`cell-${index}`).classList.add('quarantine');
                }
            }
        }
    },

    applyMeasure(measureKey) {
        const measure = this.measures[measureKey];
        if (!measure.applied && this.coinCount >= measure.cost && this.supplyCount >= measure.supplyCost) {
            this.coinCount -= measure.cost;
            this.supplyCount -= measure.supplyCost;
            measure.applied = true;
            this.updateDashboard();
            document.getElementById(`${measureKey}-status`).innerText = 'Rồi';
        } else {
            alert(`Không đủ tài nguyên để thực hiện ${measure.name}!`);
        }
    },

    // Function to calculate research progress
    calculateResearchProgress() {
        let researchProgress = 0;
        for (let i = 0; i < this.city.length; i++) {
            if (this.city[i].type === 'lab') {
                // Base research rate per lab
                researchProgress += config.researchRate;

                // Add bonus research based on lab upgrades
                researchProgress += this.city[i].labLevel * config.labUpgradeResearchBonus;
            }
        }
        return researchProgress;
    },

    // Function to update a cell's appearance based on its type and infection level
    updateCellVisuals(cellIndex, cityCopy) {
        const cell = document.getElementById(`cell-${cellIndex}`);
        const cellData = cityCopy[cellIndex];

        // Update based on terrain type
        cell.className = `cell ${cellData.type}`;
        if (cellData.isQuarantined) {
            cell.classList.add('quarantine');
        }

        // If it's residential, also update based on infection status
        if (cellData.type === 'residential') {
            const infectionRate = cellData.infected / cellData.population;
            utils.updateCellColor(cell, infectionRate);
        }
    },
};
