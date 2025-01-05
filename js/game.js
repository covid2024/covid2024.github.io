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
  coinCount: 5000,
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

  initializeMap() {
    const map = document.querySelector('.map');
    map.innerHTML = ''; // Clear existing cells

    // Initialize all cells as residential with default values
    for (let i = 0; i < config.gridRows * config.gridCols; i++) {
      const cell = document.createElement('div');
      cell.className = 'cell residential';
      cell.id = `cell-${i}`;

      // Add tooltip div
      const tooltip = document.createElement('div');
      tooltip.className = 'tooltip';
      cell.appendChild(tooltip);

      cell.addEventListener('mouseover', () => utils.showTooltip(i, this.city));
      cell.addEventListener('mouseout', utils.hideTooltip);
      cell.addEventListener('click', () => this.handleCellClick(i));

      const cellData = {
        type: 'residential',
        infected: 0,
        immune: 0,
        population: 100,
        populationDensity: config.defaultPopulationDensity,
        humidity: config.defaultHumidity,
        temperature: config.defaultTemperature,
        movementRate: config.defaultMovementRate,
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

  startOutbreak() {
    if (!this.outbreakStarted) {
      this.outbreakStarted = true;
      this.introducePatientZero(); // Introduce patient zero when the outbreak starts
      // Simulation loop
      this.simulationInterval = setInterval(() => {
        this.simulateSpread();
      }, 2000);
      // Run simulation every 2 seconds
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
    this.city[patientZeroIndex].infected = 1;
    this.totalCases = 1;
    this.newCases = 1;

    // Update the visuals for the cell
    this.updateCellVisuals(patientZeroIndex, this.city);
    utils.addNotification('new-case', "Ca nhiễm đầu tiên xuất hiện tại ô " + patientZeroIndex);
  },

  simulateSpread() {
    let currentNewCases = 0;
    let currentRecovered = 0;
    let currentDeaths = 0;

    // Calculate research progress
    this.researchProgress += this.calculateResearchProgress();
    console.log("research: " + this.researchProgress);

    // Create a copy of the city array for this tick's simulation
    let cityCopy = JSON.parse(JSON.stringify(this.city));

    // Calculate total death rate reduction and spread rate reduction from measures
    let totalDeathRateReduction = 0;
    let totalSpreadRateReduction = 0;
    for (const key in this.measures) {
      if (this.measures[key].applied) {
        totalDeathRateReduction += this.measures[key].deathRateReduction;
        totalSpreadRateReduction += this.measures[key].spreadRateReduction;
      }
    }

    // Spread logic
    for (let i = 0; i < this.city.length; i++) {
      if (this.city[i].type === 'residential' && this.city[i].infected > 0) {
        const adjacentCells = utils.getAdjacentCells(i, config.gridRows, config.gridCols);
        for (const adjIndex of adjacentCells) {
          if (this.city[adjIndex].type === 'residential' && cityCopy[adjIndex].infected < cityCopy[adjIndex].population) {
            let hasLabEffect = false;
            // Check if a lab is nearby
            const neighborCells = utils.getAdjacentCells(adjIndex, config.gridRows, config.gridCols);
            for (const neighborIndex of neighborCells) {
              if (this.city[neighborIndex].type === 'lab') {
                hasLabEffect = true;
                break;
              }
            }

            let chanceOfSpreading = config.chanceOfSpreading;
            // Reduce chance of spreading if a lab is nearby
            if (hasLabEffect) {
              chanceOfSpreading *= (1 - config.labLocalSpreadReduction);
            }

            if (Math.random() < chanceOfSpreading) {
              // Gradual spread based on infection rate
              let transfer = Math.floor(
                (this.city[i].infected / this.city[i].population) * (config.spreadRate * (1 - totalSpreadRateReduction)) * cityCopy[adjIndex].population
              );

              // Research reduces the transfer amount
              transfer = Math.floor(transfer * (1 - this.researchProgress / 100));
              transfer = Math.min(transfer, cityCopy[adjIndex].population - cityCopy[adjIndex].infected);

              // Quarantine reduces the transfer amount
              if (this.city[adjIndex].isQuarantined) {
                transfer = Math.floor(transfer * 0.1); // Reduce transfer by 90% in quarantined cells
              }

              cityCopy[adjIndex].infected += transfer; // Update the copy
              currentNewCases += transfer; // Accumulate new cases

              if (transfer > 0) {
                this.updateCellVisuals(adjIndex, cityCopy); // Update cell color
                utils.addNotification('new-case', `+${transfer} Ca Nhiễm Mới ở ô ${adjIndex}`);
              }
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

      if (cityCopy[i].type === 'residential') { // Use cityCopy here
        let infectedBefore = cityCopy[i].infected; // Use cityCopy here

        // Mortality and recovery
        let recoveredToday = Math.floor(cityCopy[i].infected * config.recoveryRate); // Use cityCopy here
        if (hasHospitalEffect) {
          recoveredToday = Math.floor(cityCopy[i].infected * (config.recoveryRate + config.hospitalRecoveryBonus)); // Use cityCopy here
        }

        let deathsToday = Math.floor(cityCopy[i].infected * (config.deathRate * (1- totalDeathRateReduction) - this.researchProgress / config.researchImpactOnDeathRate)); // Use cityCopy here
        deathsToday = Math.max(0, deathsToday);

        cityCopy[i].infected -= (recoveredToday + deathsToday); // Update the copy
        cityCopy[i].immune += recoveredToday; // Update the copy
        cityCopy[i].infected = Math.max(0, cityCopy[i].infected); // Update the copy

        currentRecovered += recoveredToday; // Accumulate recovered cases
        currentDeaths += deathsToday; // Accumulate deaths

        if (recoveredToday > 0) {
          utils.addNotification('recovered', `+${recoveredToday} Ca Hồi Phục ở ô ${i}`);
        }
        if (deathsToday > 0) {
          utils.addNotification('death', `-${deathsToday} Ca Tử Vong ở ô ${i}`);
        }

        // Update cell color based on new infection numbers
        this.updateCellVisuals(i, cityCopy);

        // Update total stats
        this.totalCases += Math.max(0, (cityCopy[i].infected - infectedBefore)); // Use cityCopy and only add if positive
      }
      // Treat patient in hospital
      else if (cityCopy[i].type === 'hospital') { // Use cityCopy here
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
            let treatedToday = Math.floor(cityCopy[i].infected * (config.recoveryRate + config.hospitalRecoveryBonus * this.hospitalsBuilt));
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

    // Update dashboard
    this.updateDashboard();

    // Advance the day counter
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.gameStartTime;
    const daysPassed = Math.floor(elapsedTime / config.dayDuration);

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

  startQuarantine() {
    if (this.coinCount >= this.quarantineCost) {
        if (this.supplyCount >= this.quarantineSupplyCost){
            this.isQuarantining = true;
            this.quarantineRadius = parseInt(document.getElementById('quarantine-radius').value);

            // Highlight cells where quarantine can be started
            const cells = document.querySelectorAll('.cell');
            cells.forEach((cell, index) => {
            if (this.city[index].type === 'residential') {
                cell.style.cursor = 'crosshair';
            } else {
                cell.style.cursor = 'not-allowed';
            }
            });
        } else {
            alert("Không đủ vật tư để khoanh vùng!");
        }
    } else {
      alert("Không đủ coin để khoanh vùng!");
    }
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
    if(cellData.isQuarantined){
        cell.classList.add('quarantine');
    }

    // If it's residential, also update based on infection status
    if (cellData.type === 'residential') {
      const infectionRate = cellData.infected / cellData.population;

      if (infectionRate === 0) {
        cell.classList.remove('low-risk', 'medium-risk', 'high-risk');
      } else if (infectionRate < 0.2) {
        cell.classList.add('low-risk');
      } else if (infectionRate < 0.5) {
        cell.classList.add('medium-risk');
      } else {
        cell.classList.add('high-risk');
      }
    }
  },
};
