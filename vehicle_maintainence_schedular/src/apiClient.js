require('dotenv').config({ path: '../.env', override: true });
const axios = require('axios');

const BASE_URL = 'http://4.224.186.213/evaluation-service';
const getHeaders = () => ({ Authorization: `Bearer ${process.env.API_TOKEN}` });

async function fetchDepots() {
  const { data } = await axios.get(`${BASE_URL}/depots`, { headers: getHeaders() });
  return data.depots; // [{ ID, MechanicHours }]
}

async function fetchVehicles() {
  const { data } = await axios.get(`${BASE_URL}/vehicles`, { headers: getHeaders() });
  return data.vehicles; // [{ TaskID, Duration, Impact }]
}

module.exports = { fetchDepots, fetchVehicles };
