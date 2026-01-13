# All commands:
#### Test API health
curl http://localhost:3000/health

#### Create transaction
curl -X POST http://localhost:3000/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "test_001",
    "amount": 10000,
    "currency": "USD",
    "type": "PAYMENT"
  }'

#### Get transaction
curl http://localhost:3000/v1/transactions/1

#### List transactions
curl "http://localhost:3000/v1/transactions?limit=10"

#### Update transaction
curl -X PATCH http://localhost:3000/v1/transactions/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "PROCESSING"}'

#### Delete transaction
curl -X DELETE http://localhost:3000/v1/transactions/1




## How to test the API
Copy and paste this into your browser/postman:

curl https://apex-finance-api-production.up.railway.app/health
Expected Result:
    json{
          "status": "healthy",
          "database": "connected"
        }
✅ If you see this on your console, the API is working!


#### Create Your First Transaction 
curl -X POST https://apex-finance-api-production.up.railway.app/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "my_first_order",
    "amount": 5000,
    "currency": "USD",
    "type": "PAYMENT"
  }'
What this does:

Creates a transaction for $50.00 USD
amount: 5000 = 5000 cents = $50.00
Status starts as PENDING

Response:
json{
  "success": true,
  "transaction": {
    "id": 1,
    "status": "PENDING",
    "amount": 5000,
    "currency": "USD"
  }
}
Save the id number! You'll need it for the next step.

#### Check Transaction Status (30 Seconds)
Replace 1 with your transaction ID:

curl https://apex-finance-api-production.up.railway.app/v1/transactions/1
Response shows current status:
json{
  "transaction": {
    "id": 1,
    "status": "PENDING",
    "amount": 5000
  }
}

#### See All Transactions 
curl https://apex-finance-api-production.up.railway.app/v1/transactions
Returns list of all transactions with pagination

#### What Happens Next?
Real-World Flow:

You create transaction → Status: PENDING
Payment gateway processes → Status: PROCESSING
Payment completes → Status: COMPLETE

##### Test This Flow:
bash# Step 1: Update to PROCESSING
curl -X PATCH https://apex-finance-api-production.up.railway.app/v1/transactions/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "PROCESSING"}'

##### Step 2: Update to COMPLETE
curl -X PATCH https://apex-finance-api-production.up.railway.app/v1/transactions/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "COMPLETE"}'

##### Step 3: Check final status
curl https://apex-finance-api-production.up.railway.app/v1/transactions/1

Key Concepts 
1. Amounts Are in Cents
$1.00  = 100
$10.00 = 1000
$50.00 = 5000
Why? Avoids decimal errors in financial calculations.
2. External IDs Prevent Duplicates
bash# First request - creates transaction
curl -X POST .../v1/transactions \
  -d '{"externalId": "order_123", "amount": 5000, ...}'
##### Returns: 201 Created

##### Second request - same externalId
curl -X POST .../v1/transactions \
  -d '{"externalId": "order_123", "amount": 5000, ...}'
##### Returns: 409 Conflict (existing transaction)
Why? Prevents charging customers twice if they retry.
3. Status Flow is One-Way
PENDING → PROCESSING → COMPLETE ✅
   ↓
FAILED ❌
Cannot go backwards:

❌ COMPLETE → PENDING (not allowed)
❌ FAILED → PENDING (not allowed)


##### Common Use Cases
E-Commerce Checkout
bash# Customer clicks "Pay Now"
curl -X POST https://apex-finance-api-production.up.railway.app/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "order_12345",
    "amount": 9900,
    "currency": "USD",
    "type": "PAYMENT",
    "metadata": {
      "customerId": "Collins senior dev",
      "orderId": "order_12345",
      "items": "Premium Plan"
    }
  }'

##### Poll for completion
while true; do
  STATUS=$(curl -s https://apex-finance-api-production.up.railway.app/v1/transactions/1 | \
           jq -r '.transaction.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "COMPLETE" ]; then
    echo "✅ Payment successful!"
    break
  fi
  sleep 2
done
##### Process Refund
bashcurl -X POST https://apexfin-ledger-api.onrender.com/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "refund_12345",
    "amount": 9900,
    "currency": "USD",
    "type": "REFUND",
    "metadata": {
      "originalTransactionId": 1,
      "reason": "customer_request"
    }
  }'
  
Dashboard: Show Recent Transactions
bash# Get last 10 completed transactions
curl "https://apexfin-ledger-api.onrender.com/v1/transactions?status=COMPLETE&limit=10"

Integration Code Snippets
JavaScript/Node.js
javascriptconst axios = require('axios');

async function createPayment(amount, orderId) {
  const response = await axios.post(
    'https://apexfin-ledger-api.onrender.com/v1/transactions',
    {
      externalId: `order_${orderId}`,
      amount: amount,
      currency: 'USD',
      type: 'PAYMENT'
    }
  );
  
  return response.data.transaction;
}


// Usage
const transaction = await createPayment(5000, 'ORD-123');
console.log('Transaction ID:', transaction.id);


#### Usage
transaction = create_payment(5000, 'ORD-123')
print(f"Transaction ID: {transaction['id']}")
PHP
php<?php
$data = [
    'externalId' => 'order_' . uniqid(),
    'amount' => 5000,
    'currency' => 'USD',
    'type' => 'PAYMENT'
];

$ch = curl_init('https://apexfin-ledger-api.onrender.com/v1/transactions');
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$transaction = json_decode($response, true)['transaction'];
echo "Transaction ID: " . $transaction['id'];
?>

#### Troubleshooting
Error: "Validation Error"
Problem:
json{
  "error": "Validation Error",
  "details": [{"field": "amount", "message": "must be positive"}]
}
Fix: Check your request format:

amount must be a positive integer (no decimals)
currency must be: USD, EUR, GBP, JPY, CAD, AUD, or CHF
type must be: PAYMENT, REFUND, or ADJUSTMENT
externalId is required

Error: "Duplicate Transaction"
Problem:
json{
  "error": "Duplicate Transaction",
  "existingTransaction": {"id": 1}
}


Happy testing !!!
