const INITIAL_BALANCE = 1000.00;
const LMSR_B = 200; // Tham số thanh khoản (Liquidity)

let appState = {
    balance: INITIAL_BALANCE,
    portfolio: {}, // Key: candidate_market, Value: { shares, totalCost }
    currentMarket: "top1",
    candidates: [
        "Đỗ Trần Khánh Vinh", "Nguyễn Xuân Thiện Nhân", "Lê Đức Chính",
        "Võ Thừa Huy Hoàng", "Lê Anh Tú", "Hồ Minh Quân", "Văn Công Nam",
        "Huỳnh Thanh Hải Phong", "Phạm Minh Tuấn", "Đoàn Thảo Nhi",
        "Nguyễn Đình Khánh An", "Lê Minh Lộc"
    ],
    markets: {
        "top1": { title: "Giải Nhất", shares: {} },
        "top2": { title: "Giải Nhì", shares: {} },
        "top3": { title: "Giải Ba", shares: {} }
    },
    tradeCandidate: null,
    tradeType: 'buy'
};

function initApp() {
    appState.candidates.forEach(c => {
        appState.markets['top1'].shares[c] = 0;
        appState.markets['top2'].shares[c] = 0;
        appState.markets['top3'].shares[c] = 0;
    });
    renderUI();
}

function renderUI() {
    document.getElementById('balance-display').innerText = appState.balance.toFixed(2);
    renderCandidates();
    renderPortfolio();
}

function switchMarket(marketId) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-market="${marketId}"]`).classList.add('active');
    appState.currentMarket = marketId;
    renderCandidates();
}

function updateMarketStats() {
    let marketShares = appState.markets[appState.currentMarket].shares;
    let totalShares = 0;
    for (let c in marketShares) totalShares += marketShares[c];
    document.getElementById('market-volume').innerText = totalShares;
}

function renderCandidates() {
    const grid = document.getElementById('candidates-grid');
    grid.innerHTML = '';

    const market = appState.markets[appState.currentMarket];
    const probs = LMSR.calculateProbabilities(market.shares, LMSR_B);

    // Sort candidates by probability descending
    let sortedCandidates = [...appState.candidates].sort((a, b) => probs[b] - probs[a]);

    sortedCandidates.forEach(candidate => {
        const probDetails = probs[candidate];
        const percentage = (probDetails * 100).toFixed(1);
        const price = probDetails.toFixed(3);

        const card = document.createElement('div');
        card.className = 'candidate-card glass';
        card.innerHTML = `
            <div class="card-header">
                <h3>${candidate}</h3>
                <span class="percentage ${percentage > 15 ? 'text-success' : ''}">${percentage}%</span>
            </div>
            <div class="card-body">
                <div class="price-container">
                    <span class="price-label">Giá mua hiện tại:</span>
                    <span class="price-value text-primary">$${price}</span>
                </div>
                <div class="card-actions">
                    <button class="btn btn-success btn-sm" onclick="openTradeModal('${candidate}', 'buy')">Mua (Buy)</button>
                    ${portfolioHasShares(candidate, appState.currentMarket) ? `<button class="btn btn-outline btn-sm" onclick="openTradeModal('${candidate}', 'sell')">Bán</button>` : ''}
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
    updateMarketStats();
}

function portfolioHasShares(candidate, marketId) {
    const key = `${candidate}_${marketId}`;
    return appState.portfolio[key] && appState.portfolio[key].shares > 0;
}

// PORTFOLIO LOGIC
function renderPortfolio() {
    const tbody = document.getElementById('portfolio-body');
    const emptyState = document.getElementById('portfolio-empty');
    tbody.innerHTML = '';

    let totalPortfolioEst = 0;
    let hasItems = false;

    for (const key in appState.portfolio) {
        if (appState.portfolio[key].shares > 0) {
            hasItems = true;
            const item = appState.portfolio[key];
            const [candidate, marketId] = key.split('_');
            const marketTitle = appState.markets[marketId].title;

            // Get current price
            const marketDetails = appState.markets[marketId];
            const probs = LMSR.calculateProbabilities(marketDetails.shares, LMSR_B);
            const currentPrice = probs[candidate];

            const currentValue = currentPrice * item.shares;
            totalPortfolioEst += currentValue;

            const avgBuyPrice = item.totalCost / item.shares;
            const pnl = currentValue - item.totalCost;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="font-bold">${candidate}</td>
                <td><span class="text-muted">${marketTitle}</span></td>
                <td>${item.shares} <button class="btn btn-outline btn-sm" style="padding: 0.1rem 0.5rem; margin-left: 0.5rem" onclick="openTradeModal('${candidate}', 'sell', '${marketId}')">Bán</button></td>
                <td>$${avgBuyPrice.toFixed(3)}</td>
                <td>$${currentValue.toFixed(2)} ($${currentPrice.toFixed(3)}/sh)</td>
                <td class="${pnl >= 0 ? 'text-success' : 'text-danger'} font-bold">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        }
    }

    if (hasItems) {
        tbody.parentElement.style.display = 'table';
        emptyState.style.display = 'none';
    } else {
        tbody.parentElement.style.display = 'none';
        emptyState.style.display = 'block';
    }

    document.getElementById('portfolio-display').innerText = totalPortfolioEst.toFixed(2);
}


// MODAL & TRADE LOGIC
function openTradeModal(candidate, type, forceMarket = null) {
    if (forceMarket) {
        appState.currentMarket = forceMarket;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.tab[data-market="${forceMarket}"]`).classList.add('active');
        renderCandidates();
    }

    appState.tradeCandidate = candidate;
    setTradeType(type);

    document.getElementById('trade-modal-title').innerText = `Giao dịch: ${candidate}`;
    document.getElementById('trade-amount').value = 10;

    // Set owned shares
    const portKey = `${candidate}_${appState.currentMarket}`;
    const owned = appState.portfolio[portKey] ? appState.portfolio[portKey].shares : 0;
    document.getElementById('trade-owned-shares').innerText = `Bạn đang sở hữu: ${owned} Shares`;

    updateTradeCost();

    document.getElementById('trade-modal').classList.add('active');
}

function closeTradeModal() {
    document.getElementById('trade-modal').classList.remove('active');
    appState.tradeCandidate = null;
}

function setTradeType(type) {
    appState.tradeType = type;
    document.getElementById('btn-buy').classList.toggle('active', type === 'buy');
    document.getElementById('btn-sell').classList.toggle('active', type === 'sell');
    updateTradeCost();
}

function updateTradeCost() {
    if (!appState.tradeCandidate) return;
    const amount = parseInt(document.getElementById('trade-amount').value) || 0;
    const market = appState.markets[appState.currentMarket];

    const probs = LMSR.calculateProbabilities(market.shares, LMSR_B);
    const currProb = probs[appState.tradeCandidate];
    document.getElementById('trade-odds').innerText = (currProb * 100).toFixed(1) + '%';

    const btn = document.getElementById('btn-submit-trade');
    const errDiv = document.getElementById('trade-error');
    errDiv.style.display = 'none';

    if (amount <= 0) {
        document.getElementById('trade-cost').innerText = '$0.00';
        document.getElementById('trade-avg-price').innerText = '$0.00';
        btn.disabled = true;
        return;
    }

    let cost = 0;
    if (appState.tradeType === 'buy') {
        cost = LMSR.getTradeCost(market.shares, LMSR_B, appState.tradeCandidate, amount);
    } else {
        cost = LMSR.getTradeCost(market.shares, LMSR_B, appState.tradeCandidate, -amount);
    }

    const absCost = Math.abs(cost);
    document.getElementById('trade-cost').innerText = (appState.tradeType === 'buy' ? '$' : '+$') + absCost.toFixed(2);
    document.getElementById('trade-avg-price').innerText = '$' + (absCost / amount).toFixed(3);

    if (appState.tradeType === 'buy') {
        if (cost > appState.balance) {
            btn.disabled = true;
            errDiv.style.display = 'block';
            errDiv.innerText = 'Số dư không đủ để thực hiện giao dịch';
        } else {
            btn.disabled = false;
            btn.innerText = 'Chấp nhận Mua';
        }
    } else {
        const portKey = `${appState.tradeCandidate}_${appState.currentMarket}`;
        const owned = appState.portfolio[portKey] ? appState.portfolio[portKey].shares : 0;
        if (amount > owned) {
            btn.disabled = true;
            errDiv.style.display = 'block';
            errDiv.innerText = 'Bạn không có đủ Shares để bán';
        } else {
            btn.disabled = false;
            btn.innerText = 'Chấp nhận Bán (Chốt lời/Lỗ)';
        }
    }
}

function executeTrade() {
    const amount = parseInt(document.getElementById('trade-amount').value);
    const market = appState.markets[appState.currentMarket];
    const candidate = appState.tradeCandidate;

    if (!candidate || amount <= 0) return;

    let cost = 0;
    if (appState.tradeType === 'buy') {
        cost = LMSR.getTradeCost(market.shares, LMSR_B, candidate, amount);
        appState.balance -= cost;
        market.shares[candidate] += amount;

        // Update portfolio
        const key = `${candidate}_${appState.currentMarket}`;
        if (!appState.portfolio[key]) {
            appState.portfolio[key] = { shares: 0, totalCost: 0 };
        }
        appState.portfolio[key].shares += amount;
        appState.portfolio[key].totalCost += cost;
        showToast(`Đã MUA ${amount} shares của ${candidate}`);

    } else {
        cost = LMSR.getTradeCost(market.shares, LMSR_B, candidate, -amount);
        // Cost is negative here (money given back)
        appState.balance += Math.abs(cost);
        market.shares[candidate] -= amount;

        // Update portfolio (reduce average cost proportionally)
        const key = `${candidate}_${appState.currentMarket}`;
        const portf = appState.portfolio[key];
        const costRatio = amount / portf.shares;
        portf.totalCost -= (portf.totalCost * costRatio);
        portf.shares -= amount;
        showToast(`Đã BÁN ${amount} shares của ${candidate}`);
    }

    closeTradeModal();
    renderUI();
}

// ADD CANDIDATE LOGIC
function openAddCandidateModal() {
    document.getElementById('add-candidate-modal').classList.add('active');
    document.getElementById('new-candidate-name').value = '';
    document.getElementById('new-candidate-name').focus();
}

function closeAddCandidateModal() {
    document.getElementById('add-candidate-modal').classList.remove('active');
}

function addCandidate() {
    const name = document.getElementById('new-candidate-name').value.trim();
    if (!name) return;

    if (appState.candidates.includes(name)) {
        alert("Thí sinh này đã có trong danh sách!");
        return;
    }

    appState.candidates.push(name);
    // Initialize 0 shares in all markets
    for (let marketId in appState.markets) {
        appState.markets[marketId].shares[name] = 0;
    }

    closeAddCandidateModal();
    renderUI();
    showToast(`Đã thêm thí sinh: ${name}`);
}

// UTILS
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Run app
window.onload = initApp;
