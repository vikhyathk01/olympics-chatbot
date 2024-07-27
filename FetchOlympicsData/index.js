const { CosmosClient } = require("@azure/cosmos");
const axios = require("axios");

module.exports = async function (context, myTimer) {
    const cosmosEndpoint = process.env.COSMOS_DB_ENDPOINT;
    const cosmosKey = process.env.COSMOS_DB_KEY;
    const databaseId = process.env.COSMOS_DB_DATABASE_ID;
    const containerId = process.env.COSMOS_DB_CONTAINER_ID;

    const client = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
    const container = client.database(databaseId).container(containerId);

    const apiUrl = "https://olympic-sports-api.p.rapidapi.com/schedule/sport?year=2024&sportId=2";
    const apiHeaders = {
        "X-RapidAPI-Host": "olympic-sports-api.p.rapidapi.com",
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY
    };

    try {
        const response = await axios.get(apiUrl, { headers: apiHeaders });
        const data = response.data;

        // Store data in Cosmos DB
        const { resource: item } = await container.items.create(data);
        context.log(`Data stored in Cosmos DB: ${JSON.stringify(item)}`);
    } catch (error) {
        context.log.error('Error fetching data from API or storing in Cosmos DB', error);
    }
};
