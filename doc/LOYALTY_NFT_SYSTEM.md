# Loyalty NFT System Documentation

## Overview
The Loyalty NFT System automatically mints NFTs for buyers when they reach spending thresholds on Luxela. Each NFT tier (Bronze, Silver, Gold) unlocks at different spending levels.

## NFT Tiers & Thresholds

| Tier | Spending Threshold | Points Required | Description |
|------|-------------------|-----------------|-------------|
| Bronze | $100+ | 100 | Entry-level NFT for new loyal customers |
| Silver | $500+ | 500 | Mid-tier NFT for regular buyers |
| Gold | $1000+ | 1000 | Premium NFT for top-tier customers |

## Architecture

### Database Schema
- **loyaltyNFTs Table**: Stores all minted NFTs for buyers
  - `id`: Unique NFT identifier
  - `buyerId`: Reference to buyer
  - `tier`: NFT tier (Bronze, Silver, Gold)
  - `loyaltyPoints`: Points accumulated from purchases
  - `earnedDate`: When the NFT was minted
  - `image`: NFT image URL
  - `title`: NFT name/title
  - `rarity`: Rarity level based on tier
  - `property`: Category/property of the NFT

### Services
- **loyaltyService.ts**: Handles NFT minting logic
  - `processBuyerLoyalty()`: Main function called after successful payment
  - Checks buyer spending total
  - Creates NFTs for newly unlocked tiers
  - Updates loyalty points

### Payment Integration
- **tsara/route.ts**: Payment webhook
  - Listens for successful Tsara payments
  - Calls `processBuyerLoyalty()` after payment confirmation
  - Automatically mints NFTs without buyer interaction

## Implementation Flow

1. **Buyer Makes Purchase**
   - Payment processed through Tsara
   - Payment webhook receives callback

2. **Webhook Processing**
   - Confirms payment success
   - Creates order in database
   - Calls `processBuyerLoyalty(buyerId, totalPaid)`

3. **Loyalty Processing**
   - Calculates buyer's total spending
   - Checks against tier thresholds
   - Mints new NFTs for unlocked tiers
   - Updates loyalty points

4. **NFT Display**
   - Buyer views NFTs on profile → Loyalty tab
   - Shows tier, points, earned date
   - Displays rarity and property info

## API Endpoints

### Buyer Router
```
GET /trpc/buyer.getLoyaltyNFTs
  - Returns: Array of buyer's NFTs
  - Fields: id, image, title, loyaltyPoints, earnedDate, rarity, property
```

## Database Relations
- **Buyer → Loyalty NFTs**: One-to-Many
- Each buyer can have multiple NFTs (one per tier unlocked)

## Frontend Integration
- **Profile Page** (`app/buyer/profile/page.tsx`)
  - Loyalty tab shows all earned NFTs
  - Displays loyalty points total
  - Shows tier progression

## Key Features
- ✅ Automatic NFT minting on spending thresholds
- ✅ Real database storage (not mock data)
- ✅ Multiple tier support (Bronze, Silver, Gold)
- ✅ Loyalty points tracking
- ✅ Rarity classification
- ✅ Webhook-triggered (no manual intervention needed)

## Testing
To test the loyalty system:
1. Create a buyer account
2. Make purchases totaling $100+ (Bronze threshold)
3. Check Profile → Loyalty tab to see minted Bronze NFT
4. Continue purchasing to unlock Silver ($500) and Gold ($1000) tiers