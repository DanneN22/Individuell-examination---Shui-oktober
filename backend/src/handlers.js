const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuid } = require("uuid");

const TABLE = process.env.TABLE_NAME;
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const ok = (body) => ({
  statusCode: 200,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  },
  body: JSON.stringify(body),
});

const bad = (code, msg) => ({
  statusCode: code,
  headers: { "Access-Control-Allow-Origin": "*" },
  body: JSON.stringify({ error: msg }),
});

exports.listMessages = async () => {
  const res = await ddb.send(new ScanCommand({ TableName: TABLE }));
  const items = (res.Items || []).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return ok(items);
};

exports.createMessage = async (event) => {
  const data = JSON.parse(event.body || "{}");
  if (!data.username || !data.text) return bad(400, "username och text krävs");

  const item = {
    id: uuid(),
    username: String(data.username).trim(),
    text: String(data.text).trim(),
    createdAt: Date.now(),
  };

  await ddb.send(new PutCommand({ TableName: TABLE, Item: item }));
  return ok(item);
};

exports.updateMessage = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) return bad(400, "id saknas");
  const data = JSON.parse(event.body || "{}");
  if (!("text" in data) && !("username" in data)) return bad(400, "inget att uppdatera");

  const sets = [];
  const names = {};
  const values = {};
  if (data.text !== undefined) { sets.push("#t = :t"); names["#t"] = "text"; values[":t"] = String(data.text).trim(); }
  if (data.username !== undefined) { sets.push("#u = :u"); names["#u"] = "username"; values[":u"] = String(data.username).trim(); }

  const res = await ddb.send(new UpdateCommand({
    TableName: TABLE,
    Key: { id },
    UpdateExpression: "SET " + sets.join(", "),
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return ok(res.Attributes);
};

exports.deleteMessage = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) return bad(400, "id saknas");
  await ddb.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
  return ok({ deleted: id });
};
