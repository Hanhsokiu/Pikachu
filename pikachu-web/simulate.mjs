import { createMatrix, getInfectedClustersCount, spawnNewInfection, decayTiles } from './src/utils/pikachuEngine.js';

console.log("Starting Pikachu Overload Logic Simulation...");

const row = 16;
const col = 16;
const fresh = createMatrix(row, col, 1);

let matrix = fresh.matrix;
let specialType = fresh.specialType;
let spawnTime = fresh.spawnTime;

let nextInfectionStartTime = 0;
let nextInfectionReplenishTime = 0;
let spawnCount = 1;
let corruptedAge = 90;
let spreadInterval = 18;

let mockTime = Date.now();
Date.now = () => mockTime;

// Simulate 35 seconds
for (let sec = 1; sec <= 35; sec++) {
  mockTime += 1000;
  const currentTimestamp = mockTime;
  
  // 1. Decay tiles (includes cluster count and replenishment)
  const result = decayTiles(matrix, specialType, spawnTime, corruptedAge, spreadInterval, spawnCount, {
    nextInfectionStartTime,
    nextInfectionReplenishTime
  }, row, col);
  nextInfectionStartTime = result.nextInfectionStartTime;
  nextInfectionReplenishTime = result.nextInfectionReplenishTime;

  // Log active clusters
  const clusters = getInfectedClustersCount(matrix, specialType, row, col);
  if (clusters === 0) {
    if (nextInfectionStartTime > 0) {
      const waitTime = (nextInfectionStartTime - currentTimestamp) / 1000;
      console.log(`[Sec ${sec}] No infections. Waiting for infection spawn... (${waitTime}s left)`);
    }
  } else {
    console.log(`[Sec ${sec}] Active infected clusters count: ${clusters}`);
  }
}

// Print specialType matrix to see if anything is infected (value 5)
let infectedCount = 0;
for (let r = 0; r < row; r++) {
  for (let c = 0; c < col; c++) {
    if (specialType[r][c] === 5) {
      infectedCount++;
    }
  }
}
console.log(`Simulation finished. Total infected tiles (type 5): ${infectedCount}`);
