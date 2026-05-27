const { Client } = require("@elastic/elasticsearch");
const env = require("./env");
const logger = require("../utils/logger");

let client = null;

function getElasticClient() {
  if (!env.elastic.enabled) return null;
  if (!client) {
    client = new Client({ node: env.elastic.url });
  }
  return client;
}

async function pingElastic() {
  const es = getElasticClient();
  if (!es) return { enabled: false, status: "disabled" };
  try {
    const result = await es.ping();
    return { enabled: true, status: result ? "ok" : "down" };
  } catch (err) {
    logger.warn("Elasticsearch ping failed", { error: err.message });
    return { enabled: true, status: "down", error: err.message };
  }
}

module.exports = { getElasticClient, pingElastic };
