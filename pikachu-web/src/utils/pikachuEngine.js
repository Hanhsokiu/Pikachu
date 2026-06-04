export function isCellEmpty(matrix, r, c, row, col) {
  if (r === 0 || r === row - 1 || c === 0 || c === col - 1) {
    return true; // Rìa biên luôn luôn được xem là trống
  }
  if (r >= 0 && r < row && c >= 0 && c < col) {
    return matrix[r][c] === 0;
  }
  return false;
}

export function checkLineX(matrix, y1, y2, x, col) {
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  for (let y = minY + 1; y < maxY; y++) {
    if (y >= 0 && y < col) {
      if (matrix[x][y] !== 0) {
        return false;
      }
    }
  }
  return true;
}

export function checkLineY(matrix, x1, x2, y, row) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  for (let x = minX + 1; x < maxX; x++) {
    if (x >= 0 && x < row) {
      if (matrix[x][y] !== 0) {
        return false;
      }
    }
  }
  return true;
}

export function getPathLength(path) {
  if (!path || path.length < 2) return Infinity;
  let len = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const p1 = path[i];
    const p2 = path[i + 1];
    len += Math.abs(p1.r - p2.r) + Math.abs(p1.c - p2.c);
  }
  return len;
}

export function isBetterPath(pathA, pathB) {
  if (!pathB || pathB.length === 0) return true;
  if (!pathA || pathA.length === 0) return false;
  const lenA = getPathLength(pathA);
  const lenB = getPathLength(pathB);
  if (lenA !== lenB) {
    return lenA < lenB;
  }
  return pathA.length < pathB.length;
}

export function getConnectionPath(matrix, row, col, p1, p2) {
  let bestPath = [];

  if ((p1.r === p2.r && p1.c === p2.c) || matrix[p1.r][p1.c] !== matrix[p2.r][p2.c] || matrix[p1.r][p1.c] === 0) {
    return bestPath;
  }

  // 1. Kiểm tra hàng ngang
  if (p1.r === p2.r && checkLineX(matrix, p1.c, p2.c, p1.r, col)) {
    const path = [p1, p2];
    if (isBetterPath(path, bestPath)) bestPath = path;
  }

  // 2. Kiểm tra cột dọc
  if (p1.c === p2.c && checkLineY(matrix, p1.r, p2.r, p1.c, row)) {
    const path = [p1, p2];
    if (isBetterPath(path, bestPath)) bestPath = path;
  }

  // 3. Đường chữ L
  const corner1 = { r: p1.r, c: p2.c };
  if (isCellEmpty(matrix, corner1.r, corner1.c, row, col) && 
      checkLineX(matrix, p1.c, p2.c, p1.r, col) && 
      checkLineY(matrix, p1.r, p2.r, p2.c, row)) {
    const path = [p1, corner1, p2];
    if (isBetterPath(path, bestPath)) bestPath = path;
  }

  const corner2 = { r: p2.r, c: p1.c };
  if (isCellEmpty(matrix, corner2.r, corner2.c, row, col) && 
      checkLineY(matrix, p1.r, p2.r, p1.c, row) && 
      checkLineX(matrix, p1.c, p2.c, p2.r, col)) {
    const path = [p1, corner2, p2];
    if (isBetterPath(path, bestPath)) bestPath = path;
  }

  // 4. Đường chữ U/Z qua cột trung gian
  for (let c = 0; c < col; c++) {
    if (c === p1.c || c === p2.c) continue;
    if (isCellEmpty(matrix, p1.r, c, row, col) && isCellEmpty(matrix, p2.r, c, row, col)) {
      if (checkLineX(matrix, p1.c, c, p1.r, col) && 
          checkLineX(matrix, p2.c, c, p2.r, col) && 
          checkLineY(matrix, p1.r, p2.r, c, row)) {
        const path = [p1, { r: p1.r, c }, { r: p2.r, c }, p2];
        if (isBetterPath(path, bestPath)) bestPath = path;
      }
    }
  }

  // 5. Đường chữ U/Z qua hàng trung gian
  for (let r = 0; r < row; r++) {
    if (r === p1.r || r === p2.r) continue;
    if (isCellEmpty(matrix, r, p1.c, row, col) && isCellEmpty(matrix, r, p2.c, row, col)) {
      if (checkLineY(matrix, p1.r, r, p1.c, row) && 
          checkLineY(matrix, p2.r, r, p2.c, row) && 
          checkLineX(matrix, p1.c, p2.c, r, col)) {
        const path = [p1, { r, c: p1.c }, { r, c: p2.c }, p2];
        if (isBetterPath(path, bestPath)) bestPath = path;
      }
    }
  }

  return bestPath;
}

export function createMatrix(row, col, difficulty) {
  const matrix = Array(row).fill(null).map(() => Array(col).fill(0));
  const spawnTime = Array(row).fill(null).map(() => Array(col).fill(0));
  const specialType = Array(row).fill(null).map(() => Array(col).fill(0));

  let imgCount = 15;
  if (difficulty === 0) imgCount = 5;
  else if (difficulty === 1) imgCount = 15;
  else if (difficulty === 2) imgCount = 21;

  const availablePositions = [];
  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      availablePositions.push({ r, c });
    }
  }

  const pairsNeeded = Math.floor(availablePositions.length / 2);
  const pairs = [];
  for (let i = 0; i < pairsNeeded; i++) {
    const imageIndex = Math.floor(Math.random() * imgCount) + 1;
    pairs.push(imageIndex, imageIndex);
  }

  const now = Date.now();
  for (const imageIndex of pairs) {
    if (availablePositions.length === 0) break;
    const posIndex = Math.floor(Math.random() * availablePositions.length);
    const p = availablePositions.splice(posIndex, 1)[0];
    matrix[p.r][p.c] = imageIndex;
    spawnTime[p.r][p.c] = now;
    specialType[p.r][p.c] = 0;
  }

  if (pairsNeeded > 1 && !hasAvailableMoves(matrix, row, col)) {
    shuffleMatrix(matrix, row, col);
  }

  return { matrix, spawnTime, specialType };
}

export function hasAvailableMoves(matrix, row, col) {
  for (let r1 = 1; r1 < row - 1; r1++) {
    for (let c1 = 1; c1 < col - 1; c1++) {
      if (matrix[r1][c1] === 0) continue;
      for (let r2 = 1; r2 < row - 1; r2++) {
        for (let c2 = 1; c2 < col - 1; c2++) {
          if (r1 === r2 && c1 === c2) continue;
          if (matrix[r2][c2] === matrix[r1][c1]) {
            const path = getConnectionPath(matrix, row, col, { r: r1, c: c1 }, { r: r2, c: c2 });
            if (path.length > 0) {
              return true;
            }
          }
        }
      }
    }
  }
  return false;
}

export function shuffleMatrix(matrix, row, col) {
  const values = [];
  const positions = [];

  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      if (matrix[r][c] !== 0) {
        values.push(matrix[r][c]);
        positions.push({ r, c });
      }
    }
  }

  if (values.length <= 2) return;

  let success = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = values[i];
      values[i] = values[j];
      values[j] = temp;
    }

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      matrix[p.r][p.c] = values[i];
    }

    if (hasAvailableMoves(matrix, row, col)) {
      success = true;
      break;
    }
  }

  if (!success) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = values[i];
      values[i] = values[j];
      values[j] = temp;
    }
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      matrix[p.r][p.c] = values[i];
    }
  }
}

export function dfsMark(matrix, specialType, r, c, visited, row, col) {
  visited[r][c] = true;
  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];
  for (let i = 0; i < 4; i++) {
    const nr = r + dr[i];
    const nc = c + dc[i];
    if (nr >= 1 && nr < row - 1 && nc >= 1 && nc < col - 1) {
      if (matrix[nr][nc] !== 0 && (specialType[nr][nc] === 4 || specialType[nr][nc] === 5)) {
        if (!visited[nr][nc]) {
          dfsMark(matrix, specialType, nr, nc, visited, row, col);
        }
      }
    }
  }
}

export function getInfectedClustersCount(matrix, specialType, row, col) {
  const visited = Array(row).fill(null).map(() => Array(col).fill(false));
  let count = 0;
  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      if (matrix[r][c] !== 0 && (specialType[r][c] === 4 || specialType[r][c] === 5)) {
        if (!visited[r][c]) {
          count++;
          dfsMark(matrix, specialType, r, c, visited, row, col);
        }
      }
    }
  }
  return count;
}

export function spreadFrom(matrix, specialType, spawnTime, r, c, tempSpecial, row, col) {
  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];
  for (let i = 0; i < 4; i++) {
    const nr = r + dr[i];
    const nc = c + dc[i];
    if (nr >= 1 && nr < row - 1 && nc >= 1 && nc < col - 1) {
      if (matrix[nr][nc] !== 0 && specialType[nr][nc] === 0 && tempSpecial[nr][nc] === 0) {
        tempSpecial[nr][nc] = 5;
        spawnTime[nr][nc] = Date.now();
      }
    }
  }
}

export function decayTiles(
  matrix,
  specialType,
  spawnTime,
  corruptedThreshold,
  spreadInterval,
  spawnCount,
  infectionState,
  row,
  col
) {
  const now = Date.now();
  const tempSpecial = specialType.map(r => [...r]);

  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      if (matrix[r][c] !== 0) {
        const type = specialType[r][c];
        if (type === 5) {
          const age = Math.floor((now - spawnTime[r][c]) / 1000);
          if (age >= corruptedThreshold) {
            tempSpecial[r][c] = 4;
            spawnTime[r][c] = now;
          } else if (age > 0 && age % spreadInterval === 0) {
            spreadFrom(matrix, specialType, spawnTime, r, c, tempSpecial, row, col);
          }
        } else if (type === 4) {
          const age = Math.floor((now - spawnTime[r][c]) / 1000);
          if (age > 0 && age % spreadInterval === 0) {
            spreadFrom(matrix, specialType, spawnTime, r, c, tempSpecial, row, col);
          }
        }
      }
    }
  }

  for (let r = 0; r < row; r++) {
    for (let c = 0; c < col; c++) {
      specialType[r][c] = tempSpecial[r][c];
    }
  }

  const infectedClustersCount = getInfectedClustersCount(matrix, specialType, row, col);

  let nextInfectionStartTime = infectionState.nextInfectionStartTime || 0;
  let nextInfectionReplenishTime = infectionState.nextInfectionReplenishTime || 0;

  if (infectedClustersCount === 0) {
    nextInfectionReplenishTime = 0;
    if (nextInfectionStartTime === 0) {
      nextInfectionStartTime = now + 10000;
    } else if (now >= nextInfectionStartTime) {
      spawnNewInfection(matrix, specialType, spawnTime, spawnCount, row, col);
      nextInfectionStartTime = 0;
    }
  } else if (infectedClustersCount < spawnCount) {
    nextInfectionStartTime = 0;
    if (nextInfectionReplenishTime === 0) {
      nextInfectionReplenishTime = now + 10000;
    } else if (now >= nextInfectionReplenishTime) {
      spawnNewInfection(matrix, specialType, spawnTime, spawnCount - infectedClustersCount, row, col);
      nextInfectionReplenishTime = 0;
    }
  } else {
    nextInfectionStartTime = 0;
    nextInfectionReplenishTime = 0;
  }

  return {
    nextInfectionStartTime,
    nextInfectionReplenishTime
  };
}

export function spawnNewInfection(matrix, specialType, spawnTime, count, row, col) {
  const dr = [-1, 1, 0, 0];
  const dc = [0, 0, -1, 1];

  for (let step = 0; step < count; step++) {
    const farTiles = [];
    const adjacentTiles = [];

    for (let r = 1; r < row - 1; r++) {
      for (let c = 1; c < col - 1; c++) {
        if (matrix[r][c] !== 0 && specialType[r][c] === 0) {
          let isAdjacent = false;
          for (let i = 0; i < 4; i++) {
            const nr = r + dr[i];
            const nc = c + dc[i];
            if (nr >= 1 && nr < row - 1 && nc >= 1 && nc < col - 1) {
              if (matrix[nr][nc] !== 0 && (specialType[nr][nc] === 4 || specialType[nr][nc] === 5)) {
                isAdjacent = true;
                break;
              }
            }
          }
          if (isAdjacent) {
            adjacentTiles.push({ r, c });
          } else {
            farTiles.push({ r, c });
          }
        }
      }
    }

    const candidates = farTiles.length === 0 ? adjacentTiles : farTiles;
    if (candidates.length > 0) {
      const index = Math.floor(Math.random() * candidates.length);
      const p = candidates[index];
      specialType[p.r][p.c] = 5;
      spawnTime[p.r][p.c] = Date.now();
    } else {
      break;
    }
  }
}

export function spawnOverloadWave(matrix, specialType, spawnTime, pairCount, row, col) {
  const tileCount = pairCount * 2;
  const emptyCells = [];
  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      if (matrix[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }

  if (emptyCells.length < 24 || emptyCells.length < tileCount) {
    return false;
  }

  for (let i = emptyCells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = emptyCells[i];
    emptyCells[i] = emptyCells[j];
    emptyCells[j] = temp;
  }

  const spawnPoints = emptyCells.slice(0, tileCount);
  const icons = [];
  for (let i = 0; i < pairCount; i++) {
    icons.push(Math.floor(Math.random() * 15) + 1);
  }

  const backupMatrix = matrix.map(r => [...r]);
  let validSpawnFound = false;

  for (let attempt = 0; attempt < 10; attempt++) {
    const now = Date.now();
    for (let i = 0; i < pairCount; i++) {
      const p1 = spawnPoints[i * 2];
      const p2 = spawnPoints[i * 2 + 1];

      matrix[p1.r][p1.c] = icons[i];
      matrix[p2.r][p2.c] = icons[i];

      spawnTime[p1.r][p1.c] = now;
      spawnTime[p2.r][p2.c] = now;

      const randSpecial = Math.floor(Math.random() * 100);
      if (randSpecial < 3) {
        specialType[p1.r][p1.c] = 1;
        specialType[p2.r][p2.c] = 1;
      } else if (randSpecial < 6) {
        specialType[p1.r][p1.c] = 2;
        specialType[p2.r][p2.c] = 2;
      } else if (randSpecial < 8) {
        specialType[p1.r][p1.c] = 3;
        specialType[p2.r][p2.c] = 3;
      } else {
        specialType[p1.r][p1.c] = 0;
        specialType[p2.r][p2.c] = 0;
      }
    }

    if (hasAvailableMoves(matrix, row, col)) {
      validSpawnFound = true;
      break;
    } else {
      for (let r = 0; r < row; r++) {
        matrix[r] = [...backupMatrix[r]];
      }
      for (let i = emptyCells.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = emptyCells[i];
        emptyCells[i] = emptyCells[j];
        emptyCells[j] = temp;
      }
      spawnPoints.splice(0, tileCount, ...emptyCells.slice(0, tileCount));
      for (let i = 0; i < pairCount; i++) {
        icons[i] = Math.floor(Math.random() * 15) + 1;
      }
    }
  }

  if (!validSpawnFound) {
    const now = Date.now();
    for (let i = 0; i < pairCount; i++) {
      const p1 = spawnPoints[i * 2];
      const p2 = spawnPoints[i * 2 + 1];
      matrix[p1.r][p1.c] = icons[i];
      matrix[p2.r][p2.c] = icons[i];
      spawnTime[p1.r][p1.c] = now;
      spawnTime[p2.r][p2.c] = now;
      specialType[p1.r][p1.c] = 0;
      specialType[p2.r][p2.c] = 0;
    }
    shuffleMatrix(matrix, row, col);
  }

  return true;
}

export function cleanseUnstableTiles(matrix, specialType, spawnTime, row, col) {
  let cleansedCount = 0;
  const now = Date.now();
  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      if (matrix[r][c] !== 0 && specialType[r][c] === 5) {
        specialType[r][c] = 0;
        spawnTime[r][c] = now;
        cleansedCount++;
      }
    }
  }
  return cleansedCount;
}

export function getEmptyCellsCount(matrix, row, col) {
  let count = 0;
  for (let r = 1; r < row - 1; r++) {
    for (let c = 1; c < col - 1; c++) {
      if (matrix[r][c] === 0) count++;
    }
  }
  return count;
}
