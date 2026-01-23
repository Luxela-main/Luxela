"use client";

import React from "react";

export default function OrdersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No orders yet.</p>
      </div>
    </div>
  );
}