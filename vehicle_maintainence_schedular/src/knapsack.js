function knapsack(capacity, tasks) {
  const n = tasks.length;
  // build DP table
  const dp = Array.from({ length: n + 1 }, 
    () => new Array(capacity + 1).fill(0)
  );

  for (let i = 1; i <= n; i++) {
    const { Duration, Impact } = tasks[i - 1];
    for (let w = 0; w <= capacity; w++) {
      dp[i][w] = dp[i - 1][w];
      if (Duration <= w) {
        dp[i][w] = Math.max(dp[i][w], dp[i - 1][w - Duration] + Impact);
      }
    }
  }

  // backtrack to find selected tasks
  const selectedTasks = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedTasks.push(tasks[i - 1].TaskID);
      w -= tasks[i - 1].Duration;
    }
  }

  return {
    selectedTasks,
    totalImpact: dp[n][capacity],
    totalDuration: capacity - w,
  };
}

module.exports = { knapsack };
