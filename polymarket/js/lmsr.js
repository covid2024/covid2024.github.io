/**
 * Logarithmic Market Scoring Rule (LMSR) Math Module
 * Used for automated market making in prediction markets.
 */

const LMSR = {
    // Tùy chọn để tránh tràn ranh giới số thực khi q lớn.
    calculateCost: function(sharesMap, b) {
        let maxQ = -Infinity;
        for (let candidate in sharesMap) {
            if (sharesMap[candidate] > maxQ) {
                maxQ = sharesMap[candidate];
            }
        }

        let sumExp = 0;
        for (let candidate in sharesMap) {
            sumExp += Math.exp((sharesMap[candidate] - maxQ) / b);
        }
        
        return maxQ + b * Math.log(sumExp);
    },

    calculateProbabilities: function(sharesMap, b) {
        let maxQ = -Infinity;
        for (let candidate in sharesMap) {
            if (sharesMap[candidate] > maxQ) {
                maxQ = sharesMap[candidate];
            }
        }

        let sumExp = 0;
        let probs = {};
        
        for (let candidate in sharesMap) {
            sumExp += Math.exp((sharesMap[candidate] - maxQ) / b);
        }
        
        for (let candidate in sharesMap) {
            probs[candidate] = Math.exp((sharesMap[candidate] - maxQ) / b) / sumExp;
        }
        
        return probs;
    },

    getTradeCost: function(sharesMap, b, targetCandidate, amount) {
        let oldCost = this.calculateCost(sharesMap, b);
        let newSharesMap = { ...sharesMap };
        newSharesMap[targetCandidate] += amount;
        let newCost = this.calculateCost(newSharesMap, b);
        return newCost - oldCost;
    }
};
