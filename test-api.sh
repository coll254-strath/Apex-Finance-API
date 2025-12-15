#!/bin/bash
# ============================================================================
# API TESTING SCRIPT
# ============================================================================
# Tests all ApexFin-Ledger API endpoints

API_URL="http://localhost:3000"

echo "=========================================="
echo "ApexFin-Ledger API Test Suite"
echo "=========================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
curl -X GET "$API_URL/health" | jq
echo -e "\n"

# Test 2: Create Transaction
echo "Test 2: Create Transaction"
TRANSACTION_ID=$(curl -s -X POST "$API_URL/v1/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "externalId": "test_order_'$(date +%s)'",
    "amount": 99900,
    "currency": "USD",
    "type": "PAYMENT",
    "metadata": {
      "customerId": "cust_123",
      "orderId": "order_456"
    }
  }' | jq -r '.transaction.id')
echo "Created Transaction ID: $TRANSACTION_ID"
echo ""

# Test 3: Get Single Transaction
echo "Test 3: Get Transaction by ID"
curl -X GET "$API_URL/v1/transactions/$TRANSACTION_ID" | jq
echo -e "\n"

# Test 4: List Transactions
echo "Test 4: List Transactions"
curl -X GET "$API_URL/v1/transactions?limit=5" | jq
echo -e "\n"

# Test 5: Update Transaction Status
echo "Test 5: Update Transaction Status"
curl -X PATCH "$API_URL/v1/transactions/$TRANSACTION_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PROCESSING"
  }' | jq
echo -e "\n"

# Test 6: Filter by Status
echo "Test 6: Filter Transactions by Status"
curl -X GET "$API_URL/v1/transactions?status=PROCESSING" | jq
echo -e "\n"

# Test 7: Webhook Event
echo "Test 7: Send Webhook Event"
curl -X POST "$API_URL/v1/webhooks/transaction-update" \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": "evt_'$(date +%s)'",
    "transactionId": '$TRANSACTION_ID',
    "status": "COMPLETE",
    "eventType": "transaction.completed"
  }' | jq
echo -e "\n"

# Test 8: Delete Transaction
echo "Test 8: Soft Delete Transaction"
curl -X DELETE "$API_URL/v1/transactions/$TRANSACTION_ID" | jq
echo -e "\n"

# Test 9: Verify Deletion
echo "Test 9: Verify Deleted Transaction Returns 404"
curl -X GET "$API_URL/v1/transactions/$TRANSACTION_ID"
echo -e "\n"

echo "=========================================="
echo "Test Suite Complete"
echo "=========================================="