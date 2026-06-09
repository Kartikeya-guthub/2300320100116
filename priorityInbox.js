require("dotenv").config({ override: true });
const axios = require("axios");

const API_URL = "http://4.224.186.213/evaluation-service/notifications";
const TYPE_WEIGHT = { Placement: 3, Result: 2, Event: 1 };

function score(n) {
  const ageMs = Date.now() - new Date(n.Timestamp).getTime();
  return TYPE_WEIGHT[n.Type] + (1 / (1 + ageMs / 60000));
}

async function main() {
  try {
    const res = await axios.get(API_URL, {
      headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN.trim()}` }
    });
    
    const notifications = res.data.notifications || [];
    
    // For large scale continuous updates, a Min-Heap is better (as explained in markdown).
    // For fetching and evaluating the initial batch, sort is very fast and compact!
    const top10 = notifications
      .map(n => ({ ...n, score: score(n) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    console.log(`\n🔔 Top 10 Priority Notifications\n`);
    console.log("Rank | Type      | Score  | Message                          | Timestamp");
    console.log("-----|-----------|--------|----------------------------------|--------------------");
    top10.forEach((n, i) => {
      console.log(`  ${String(i + 1).padStart(2, "0")} | ${n.Type.padEnd(9)} | ${n.score.toFixed(4)} | ${n.Message.padEnd(32)} | ${n.Timestamp}`);
    });
  } catch (err) {
    console.error("API error:", err.response?.data || err.message);
  }
}

main();
