require("dotenv").config();
const axios = require("axios");

const LOG_URL = "http://4.224.186.213/evaluation-service/logs";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

async function Log(stack, level, packageName, message) {
    try {
        const response = await axios.post(
            LOG_URL,
            {
                stack,
                level,
                package: packageName,
                message
            },
            {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data;
    } catch (err) {
        console.error("Logging failed:", err.response?.data || err.message);
    }
}

module.exports = Log;
