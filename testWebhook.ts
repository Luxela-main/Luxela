import fetch from "node-fetch";
import crypto from "crypto";

const WEBHOOK_URL = "http://localhost:3000/api/webhooks/tsara";
const SECRET = process.env.TSARA_WEBHOOK_SECRET || "test_secret";

const testEvent = {
  event: "payment.updated",
  data: { status: "success", reference: "tx_success_001", amountCents: 5000 },
  id: "evt_success_001"
};

const rawBody = JSON.stringify(testEvent);

const signature = crypto.createHmac("sha256", SECRET).update(Buffer.from(rawBody, "utf8")).digest("hex");

fetch(WEBHOOK_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-tsara-signature": signature
  },
  body: rawBody
})
.then(res => res.json().then(json => {
  console.log("Status:", res.status);
  console.log("Response:", json);
}))
.catch(console.error);