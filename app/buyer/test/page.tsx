"use client";

import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

export default function TRPCTestPage() {
  const { user, loading: authLoading } = useAuth();
  const [testResults, setTestResults] = useState<string[]>([]);
  console.log('user: ', user)

  const addLog = (message: string) => {
    setTestResults((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  // ============ BUYER QUERIES (GET) ============
  // Note: Remove onSuccess/onError from useQuery - use data/error instead

  const accountQuery = trpc.buyer.getAccountDetails.useQuery(undefined, {
    enabled: false,
  });

  const favoritesQuery = trpc.buyer.getFavorites.useQuery(
    { page: 1, limit: 10 },
    { enabled: false }
  );

  const purchaseHistoryQuery = trpc.buyer.getPurchaseHistory.useQuery(
    { status: "all", page: 1, limit: 10 },
    { enabled: false }
  );

  const orderStatsQuery = trpc.buyer.getOrderStats.useQuery(undefined, {
    enabled: false,
  });

  // ============ LISTING QUERIES (GET) ============

  const listingsQuery = trpc.listing.getMyListings.useQuery(undefined, {
    enabled: false,
  });

  // ============ PAYMENT QUERIES (GET) ============

  const paymentLinksQuery = trpc.payment.listPaymentLinks.useQuery(
    { page: 1, limit: 20 },
    { enabled: false }
  );

  // ============ NOTIFICATION QUERIES (GET) ============

  const notificationsQuery = trpc.notification.getAll.useQuery(undefined, {
    enabled: false,
  });

  const starredNotificationsQuery = trpc.notification.getStarred.useQuery(undefined, {
    enabled: false,
  });

  // ============ SALES QUERIES (GET) ============

  const salesQuery = trpc.sales.getAllSales.useQuery(
    { status: "all" },
    { enabled: false }
  );

  // ============ BUYER MUTATIONS (POST/PUT/DELETE) ============

  const updateAccountMutation = trpc.buyer.updateAccountDetails.useMutation({
    onSuccess: (data) => addLog(`✅ Account Updated: ${JSON.stringify(data)}`),
    onError: (error) => addLog(`❌ Update Account Error: ${error.message}`),
  });

  const addFavoriteMutation = trpc.buyer.addFavorite.useMutation({
    onSuccess: (data) => addLog(`✅ Favorite Added: ${data.favoriteId}`),
    onError: (error) => addLog(`❌ Add Favorite Error: ${error.message}`),
  });

  const removeFavoriteMutation = trpc.buyer.removeFavorite.useMutation({
    onSuccess: () => addLog(`✅ Favorite Removed`),
    onError: (error) => addLog(`❌ Remove Favorite Error: ${error.message}`),
  });

  const createBillingAddressMutation = trpc.buyer.createBillingAddress.useMutation({
    onSuccess: (data) => addLog(`✅ Billing Address Created: ${data.id}`),
    onError: (error) => addLog(`❌ Create Billing Address Error: ${error.message}`),
  });

  // ============ PAYMENT MUTATIONS (POST) ============

  const createPaymentMutation = trpc.payment.createPayment.useMutation({
    onSuccess: (data) => addLog(`✅ Payment Created: ${JSON.stringify(data)}`),
    onError: (error) => addLog(`❌ Create Payment Error: ${error.message}`),
  });

  const disablePaymentLinkMutation = trpc.payment.disablePaymentLink.useMutation({
    onSuccess: (data) => addLog(`✅ Payment Link Disabled: ${JSON.stringify(data)}`),
    onError: (error) => addLog(`❌ Disable Payment Link Error: ${error.message}`),
  });

  // ============ NOTIFICATION MUTATIONS ============

  const markAsReadMutation = trpc.notification.markAsRead.useMutation({
    onSuccess: () => addLog(`✅ Notification Marked as Read`),
    onError: (error) => addLog(`❌ Mark as Read Error: ${error.message}`),
  });

  const toggleStarMutation = trpc.notification.toggleStar.useMutation({
    onSuccess: () => addLog(`✅ Notification Star Toggled`),
    onError: (error) => addLog(`❌ Toggle Star Error: ${error.message}`),
  });

  // ============ LISTING MUTATIONS ============

  const createListingMutation = trpc.listing.createSingle.useMutation({
    onSuccess: (data) => addLog(`✅ Listing Created: ${data.id}`),
    onError: (error) => addLog(`❌ Create Listing Error: ${error.message}`),
  });

  const deleteListingMutation = trpc.listing.deleteListing.useMutation({
    onSuccess: () => addLog(`✅ Listing Deleted`),
    onError: (error) => addLog(`❌ Delete Listing Error: ${error.message}`),
  });

  // ============ EFFECTS FOR QUERY LOGGING ============

  useEffect(() => {
    if (accountQuery.isSuccess && accountQuery.data) {
      addLog(`✅ Buyer Account: ${JSON.stringify(accountQuery.data)}`);
    }
    if (accountQuery.isError) {
      addLog(`❌ Buyer Account Error: ${accountQuery.error.message}`);
    }
  }, [accountQuery.isSuccess, accountQuery.isError]);

  useEffect(() => {
    if (favoritesQuery.isSuccess && favoritesQuery.data) {
      addLog(`✅ Favorites: Found ${favoritesQuery.data.total} favorites`);
    }
    if (favoritesQuery.isError) {
      addLog(`❌ Favorites Error: ${favoritesQuery.error.message}`);
    }
  }, [favoritesQuery.isSuccess, favoritesQuery.isError]);

  // ============ TEST FUNCTIONS ============

  const testQueries = () => {
    addLog("🔍 Testing QUERIES (GET operations)...");
    addLog("ℹ️ Refetching account details...");
    accountQuery.refetch();
    addLog("ℹ️ Refetching favorites...");
    favoritesQuery.refetch();
    addLog("ℹ️ Refetching purchase history...");
    purchaseHistoryQuery.refetch();
  };

  const testMutations = () => {
    addLog("🔧 Testing MUTATIONS (POST operations)...");
    addLog("ℹ️ Uncomment mutation examples in the code to test them");

    // Example: Update account details
    updateAccountMutation.mutate({
      username: "testuser",
      fullName: "Test User",
      country: "Nigeria",
      state: "Lagos",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">
          tRPC Test Page - Buyer Routes
        </h1>

        {/* Auth Status */}
        <div className={`rounded-lg shadow-md p-6 mb-6 ${user ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h2 className="text-xl font-semibold mb-3">
            {user ? '✅ Authenticated' : '⚠️ Not Authenticated'}
          </h2>
          {authLoading ? (
            <p className="text-gray-600">Loading authentication...</p>
          ) : user ? (
            <div className="space-y-2 text-sm">
              <p><strong>User ID:</strong> <code className="bg-white px-2 py-1 rounded">{user.id}</code></p>
              <p><strong>Email:</strong> <code className="bg-white px-2 py-1 rounded">{user.email}</code></p>
              <p className="text-green-700">You can now test all protected endpoints!</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-red-700">You need to be logged in to test these endpoints.</p>
              <p className="text-sm text-gray-600">Please sign in first, then return to this page.</p>
              <a
                href="/signin"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Understanding tRPC Patterns
          </h2>
          <div className="space-y-3 text-gray-700">
            <p className="font-mono text-sm bg-gray-100 p-3 rounded">
              <strong>GET (Queries):</strong> const query = trpc.buyer.getAccountDetails.useQuery()
            </p>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded">
              <strong>POST (Mutations):</strong> const mutation = trpc.buyer.updateAccountDetails.useMutation()
            </p>
            <p className="text-sm mt-4">
              <strong>Pattern:</strong> useQuery() returns {`{ data, error, isLoading }`}, useMutation() returns {`{ mutate, isLoading }`}
            </p>
          </div>
        </div>

        {/* Available Routes */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Available tRPC Routes
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BUYER Routes */}
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-blue-600 mb-2">BUYER (Queries)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.buyer.getAccountDetails.useQuery()</li>
                <li>• trpc.buyer.getFavorites.useQuery()</li>
                <li>• trpc.buyer.getPurchaseHistory.useQuery()</li>
                <li>• trpc.buyer.getOrderStats.useQuery()</li>
                <li>• trpc.buyer.getOrderDetails.useQuery()</li>
                <li>• trpc.buyer.isFavorited.useQuery()</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-green-600 mb-2">BUYER (Mutations)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.buyer.updateAccountDetails.useMutation()</li>
                <li>• trpc.buyer.uploadProfilePicture.useMutation()</li>
                <li>• trpc.buyer.addFavorite.useMutation()</li>
                <li>• trpc.buyer.removeFavorite.useMutation()</li>
                <li>• trpc.buyer.createBillingAddress.useMutation()</li>
                <li>• trpc.buyer.updateBillingAddress.useMutation()</li>
              </ul>
            </div>

            {/* LISTING Routes */}
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-blue-600 mb-2">LISTING (Queries)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.listing.getMyListings.useQuery()</li>
                <li>• trpc.listing.getMyListingsByCategory.useQuery()</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-green-600 mb-2">LISTING (Mutations)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.listing.createSingle.useMutation()</li>
                <li>• trpc.listing.createCollection.useMutation()</li>
                <li>• trpc.listing.deleteListing.useMutation()</li>
                <li>• trpc.listing.restockListing.useMutation()</li>
              </ul>
            </div>

            {/* PAYMENT Routes */}
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-blue-600 mb-2">PAYMENT (Queries)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.payment.getPaymentLink.useQuery()</li>
                <li>• trpc.payment.listPaymentLinks.useQuery()</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-green-600 mb-2">PAYMENT (Mutations)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.payment.createPayment.useMutation()</li>
                <li>• trpc.payment.disablePaymentLink.useMutation()</li>
              </ul>
            </div>

            {/* NOTIFICATION Routes */}
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-blue-600 mb-2">NOTIFICATION (Queries)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.notification.getAll.useQuery()</li>
                <li>• trpc.notification.getStarred.useQuery()</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-green-600 mb-2">NOTIFICATION (Mutations)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.notification.markAsRead.useMutation()</li>
                <li>• trpc.notification.toggleStar.useMutation()</li>
              </ul>
            </div>

            {/* SALES Routes */}
            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-blue-600 mb-2">SALES (Queries)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.sales.getAllSales.useQuery()</li>
                <li>• trpc.sales.getSaleById.useQuery()</li>
              </ul>
            </div>

            <div className="border border-gray-200 rounded p-4">
              <h3 className="font-semibold text-green-600 mb-2">SALES (Mutations)</h3>
              <ul className="text-sm space-y-1 font-mono text-gray-600">
                <li>• trpc.sales.updateSale.useMutation()</li>
                <li>• trpc.sales.deleteSale.useMutation()</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Code Examples */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Code Examples
          </h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Example 1: Using useQuery (GET)</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`// Fetch buyer account details
const { data, isLoading, error } = trpc.buyer.getAccountDetails.useQuery();

// Check data
if (data) {
  console.log('Account:', data);
}

// Fetch with parameters
const { data: favorites } = trpc.buyer.getFavorites.useQuery({
  page: 1,
  limit: 10
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Example 2: Using useMutation (POST)</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`// Define mutation
const updateAccount = trpc.buyer.updateAccountDetails.useMutation({
  onSuccess: (data) => console.log('Updated!', data),
  onError: (error) => console.error('Error:', error)
});

// Call mutation
updateAccount.mutate({
  username: "john_doe",
  fullName: "John Doe",
  country: "Nigeria"
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Example 3: Create Payment</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`const createPayment = trpc.payment.createPayment.useMutation();

createPayment.mutate({
  buyerId: user.id,
  listingId: "listing-uuid",
  amount: 10000, // Amount in cents
  currency: "NGN",
  description: "Purchase of product X",
  paymentMethod: "card"
});`}
              </pre>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Example 4: Mark Notification as Read</h3>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto text-xs">
{`const markRead = trpc.notification.markAsRead.useMutation();

markRead.mutate({
  notificationId: "notification-uuid"
});`}
              </pre>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Test Actions
          </h2>
          {!user && (
            <p className="text-amber-600 mb-4 text-sm">
              ⚠️ You must be logged in to test these endpoints
            </p>
          )}
          <div className="flex gap-4">
            <button
              onClick={testQueries}
              disabled={!user}
              className={`px-6 py-2 rounded-lg transition ${
                user
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Test Queries (GET)
            </button>
            <button
              onClick={testMutations}
              disabled={!user}
              className={`px-6 py-2 rounded-lg transition ${
                user
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Test Mutations (POST)
            </button>
          </div>
        </div>

        {/* Console Output */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Console Output
          </h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500">No tests run yet. Click a test button above.</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-3 text-yellow-900">
            ⚠️ Important Notes
          </h2>
          <ul className="space-y-2 text-yellow-800">
            <li>• <strong>Authentication Required:</strong> All endpoints shown here require you to be logged in first</li>
            <li>• <strong>userId:</strong> Automatically available as user.id when authenticated</li>
            <li>• <strong>Query Pattern:</strong> useQuery() returns {`{ data, error, isLoading }`}</li>
            <li>• <strong>Mutation Pattern:</strong> useMutation() returns {`{ mutate, isLoading }`}</li>
            <li>• <strong>No callbacks in useQuery:</strong> Use data/error directly, not onSuccess/onError (React Query v5)</li>
            <li>• <strong>Schema:</strong> All data structures in server/db/schema.ts</li>
            <li>• <strong>Server:</strong> Make sure backend is running on http://localhost:5000</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
