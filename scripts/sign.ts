import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const secret = process.env.TSARA_WEBHOOK_SECRET!;
const payload = `{
  "id": "evt_test_001",
  "event": "payment.updated",
  "data": {
    "status": "success",
    "reference": "tx_test_001"
  }
}`;

const signature = crypto
  .createHmac("sha256", secret)
  .update(payload)
  .digest("hex");

console.log("Signature:", signature);