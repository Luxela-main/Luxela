import { Listing } from "@/types/listing";

interface ProductDescriptionProps {
  product: Listing;
}

export default function ProductDescription({
  product,
}: ProductDescriptionProps) {
  return (
    <div className="bg-[#1a1a1a] rounded-2xl text-sm p-8 mb-8">
      <h2 className="text-base font-medium mb-6">Product description</h2>
      <hr className="text-[#858585]" />
      <div className="space-y-1 mt-4">
        <div>
          <h3 className="text-[#858585] font-medium ">
            Name: <span className="text-white">{product.title} </span>
          </h3>
          {/* Material */}
          {product.material_composition && (
            <div>
              <h3 className="text-[#858585]">
                Material:{" "}
                <span className="text-white capitalize">
                  {product.material_composition}
                </span>
              </h3>
            </div>
          )}

          {/* Additional Details */}
          <div>
            <ul className="text-[#858585]">
              {product.supply_capacity && (
                <li>
                  Supply capacity:{" "}
                  <span className="text-white capitalize">
                    {product.supply_capacity}
                  </span>
                </li>
              )}
              {product.release_duration && (
                <li>
                  Release duration:{" "}
                  <span className="text-white">{product.release_duration}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Placeholder Content */}
        <div className="space-y-4 text-[#858585] text-sm">
          <p>{product.description} </p>
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
        </div>
      </div>
    </div>
  );
}
