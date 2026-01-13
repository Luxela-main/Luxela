'use client'

import { useListings } from '@/context/ListingsContext'
import { useAuth } from '@/context/AuthContext'
import { useCartState } from '@/modules/cart/context'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Images, ShoppingCart, Loader2, Check, LogIn } from 'lucide-react'
import { toastSvc } from '@/services/toast'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

function ProductCard({ 
  item, 
  collectionId, 
  brandName,
  productId // Pass this if available in your item schema
}: { 
  item: any
  collectionId: string
  brandName?: string 
  productId?: string
}) {
  const { user } = useAuth()
  const { addToCart } = useCartState()
  const router = useRouter()

  const [isAdding, setIsAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      setShowAuthModal(true)
      return
    }

    // Logic for adding to cart
    // Note: Collection items usually need a specific productId or variantId
    const targetId = productId || item.id 
    if (!targetId || isAdding) return

    setIsAdding(true)
    try {
      await addToCart(targetId, 1)
      setAdded(true)
      toastSvc.success(`${item.title} added to cart`)
      setTimeout(() => setAdded(false), 2000)
    } catch (err) {
      toastSvc.error("Failed to add to cart")
    } finally {
      setIsAdding(false)
    }
  }

  // ... (Parsing logic remains the same)
  let colors: Array<{ colorName: string; colorHex: string }> = []
  try {
    colors = item.colors_available ? JSON.parse(item.colors_available) : []
  } catch (e) {}
    const LUXELA_PLACEHOLDER = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";


  const isValidImage =
    typeof item.image === 'string' &&
    item.image.length > 0 &&
  !item.image.includes("placeholder.com") &&
    item.image !== LUXELA_PLACEHOLDER



  return (
    <>
      <Link href={`/buyer/collection/${collectionId}`}>
        <div className="group bg-[#161616] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#9872DD]/50 transition-all min-w-[280px] w-[280px] flex-shrink-0">
          <div className="h-96 bg-[#222] p-0 flex relative overflow-hidden">
            {isValidImage ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Images className="w-12 h-12 text-gray-700" />
              </div>
            )}

            {item.limited_edition_badge === 'show_badge' && (
              <div className="absolute top-3 left-3 bg-purple-600 px-2.5 py-1 rounded">
                <span className="text-[#f2f2f2] text-[10px] font-bold uppercase tracking-widest">
                  Limited
                </span>
              </div>
            )}
          </div>

          <div className="p-4 bg-black">
            <p className="text-[#acacac] text-[10px] font-bold uppercase tracking-wider mb-1">
              {brandName || "Luxela"}
            </p>

            <div className="flex items-center justify-between gap-3 mb-3 min-h-[40px]">
              <h3 className="text-[#f2f2f2] capitalize font-medium text-sm line-clamp-2 leading-snug flex-1">
                {item.title}
              </h3>
              {colors.length > 0 && (
                <div className="flex -space-x-1">
                  {colors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-black"
                      style={{ backgroundColor: color.colorHex }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-[#f2f2f2] text-sm font-bold">
                  {item.currency || 'NGN'} {((item.price_cents || 0) / 100).toLocaleString()}
                </div>
                {item.quantity_available <= 5 && item.quantity_available > 0 && (
                  <p className="text-orange-500 text-[9px] mt-0.5 font-medium">
                    Only {item.quantity_available} left
                  </p>
                )}
              </div>

              <button 
                onClick={handleQuickAdd}
                disabled={isAdding}
                className={`p-2.5 rounded-lg transition-all duration-300 ${
                  added ? "bg-green-500" : "bg-purple-600 hover:bg-purple-500"
                }`}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : added ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <ShoppingCart className="w-4 h-4 text-[#f2f2f2]" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#111] border-[#222] text-white rounded-2xl">
          <DialogHeader className="items-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-purple-500" />
            </div>
            <DialogTitle>Sign in to Shop</DialogTitle>
            <DialogDescription className="text-center mt-6">
              Please sign in to add <span className="text-white font-medium">{item.title}</span> to your cart.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => router.push(`/signin?redirect=/buyer/collections`)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all"
            >
              Sign In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default function CollectionsPage() {
  const { listings, loading } = useListings()
  const collections = listings.filter(listing => listing.type === 'collection')

  if (loading) return <div className="bg-black min-h-screen flex items-center justify-center text-white">Loading collections...</div>

  return (
    <div className="bg-black min-h-screen px-6 py-8">
      {collections.map((collection) => {
        let items: any[] = []
        try {
          items = collection.items_json ? JSON.parse(collection.items_json) : []
        } catch (e) {
          console.error('Error parsing items_json:', e)
        }

        if (items.length === 0) return null
        const business = collection.sellers?.seller_business?.[0]

        return (
          <div key={collection.id} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl capitalize font-semibold tracking-tight">{collection.title}</h2>
              <Link 
                href={`/buyer/collection/${collection.id}`}
                className="flex items-center gap-1 text-[#9872DD] text-sm font-medium hover:text-purple-400 transition-colors"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-4">
                {items.slice(0, 4).map((item, index) => (
                  <ProductCard 
                    key={`${collection.id}-${index}`} 
                    item={item} 
                    collectionId={collection.id}
                    brandName={business?.brand_name}
                    productId={collection.product_id || undefined}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}