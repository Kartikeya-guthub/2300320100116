const { fetchDepots, fetchVehicles } = require('./apiClient');
const { knapsack } = require('./knapsack');

async function buildSchedule() {
  const [depots, vehicles] = await Promise.all([fetchDepots(), fetchVehicles()]);

  return depots.map(depot => {
    const { selectedTasks, totalImpact, totalDuration } = knapsack(depot.MechanicHours, vehicles);
    return {
      depotID: depot.ID,
      mechanicHoursAvailable: depot.MechanicHours,
      totalDurationScheduled: totalDuration,
      totalImpact,
      selectedTasks,
    };
  });
}

module.exports = { buildSchedule };
