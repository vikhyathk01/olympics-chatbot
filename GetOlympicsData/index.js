const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    const openAIEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const openAIKey = process.env.AZURE_OPENAI_KEY;
    const openAIDeploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

    const cosmosEndpoint = process.env.COSMOS_DB_ENDPOINT;
    const cosmosKey = process.env.COSMOS_DB_KEY;
    const cosmosDatabaseId = process.env.COSMOS_DB_DATABASE_ID;
    const cosmosContainerId = process.env.COSMOS_DB_CONTAINER_ID;

    const openAIClient = new OpenAIClient(openAIEndpoint, new AzureKeyCredential(openAIKey));
    const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
    const container = cosmosClient.database(cosmosDatabaseId).container(cosmosContainerId);

    try {
        // Fetch data from Cosmos DB
        const { resources: items } = await container.items.query("SELECT * FROM c").fetchAll();

        // Prepare messages for OpenAI
        const systemPrompt = "You are an Olympics commentator and chatbot designed to provide detailed information about the Olympic Games. Your primary role is to assist users by providing accurate and engaging updates on schedules, events, athletes, and results. You should maintain an enthusiastic and knowledgeable tone, akin to a professional sports commentator, making the information both informative and exciting for the audience.";

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "user", content: req.query.message || "What's happening in the Olympics?" }
        ];

        const result = await openAIClient.getChatCompletions(openAIDeploymentName, {
            messages: messages,
            maxResponseLength: 800,
            temperature: 0.7,
            topP: 0.95
        });

        const response = result.choices[0].message.content;
        context.res = {
            status: 200,
            body: response
        };
    } catch (error) {
        context.log.error('Error in GetOlympicsData function', error);
        context.res = {
            status: 500,
            body: "An error occurred while processing your request."
        };
    }
};
