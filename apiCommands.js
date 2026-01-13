/*
# Test API health
curl http://localhost:3000/health

# Create transaction
curl -X POST http://localhost:3000/v1/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "test_001",
    "amount": 10000,
    "currency": "USD",
    "type": "PAYMENT"
  }'

# Get transaction
curl http://localhost:3000/v1/transactions/1

# List transactions
curl "http://localhost:3000/v1/transactions?limit=10"

# Update transaction
curl -X PATCH http://localhost:3000/v1/transactions/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "PROCESSING"}'

# Delete transaction
curl -X DELETE http://localhost:3000/v1/transactions/1
*/
