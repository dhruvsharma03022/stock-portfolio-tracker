const {
    DynamoDBClient
} = require("@aws-sdk/client-dynamodb");

const {
    DynamoDBDocumentClient,
    PutCommand
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
    region: "eu-north-1"
});

const db = DynamoDBDocumentClient.from(client);

const TABLE_NAME = "StockPortfolio";

const addInvestment = async (investment) => {

    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: investment
    });

    await db.send(command);
};

module.exports = {
    addInvestment
};