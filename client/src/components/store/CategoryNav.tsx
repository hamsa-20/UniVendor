import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type Category = {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  level: number;
  isGlobal?: boolean;
  vendorId?: number | null;
};

interface CategoryNavProps {
  vendorId: number;
  className?: string;
}

export default function CategoryNav({ vendorId, className }: CategoryNavProps) {
  const [location] = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  // Fetch vendor-specific categories
  const { data: vendorCategories = [], isLoading: isLoadingVendorCategories } = useQuery<Category[]>({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });
  
  // Fetch global categories (available to all)
  const { data: globalCategories = [], isLoading: isLoadingGlobalCategories } = useQuery<Category[]>({
    queryKey: [`/api/global-product-categories`],
  });
  
  // Combine vendor and global categories
  const categories = [...vendorCategories, ...globalCategories];
  
  // Combined loading state
  const isLoading = isLoadingVendorCategories || isLoadingGlobalCategories;

  // Filter for main categories (level 1 or parentId is null)
  const mainCategories = categories.filter(c => !c.parentId);

  // Get subcategories for a specific parent
  const getSubcategories = (parentId: number) => {
    return categories.filter(c => c.parentId === parentId);
  };

  // Check if a category has subcategories
  const hasSubcategories = (categoryId: number) => {
    return categories.some(c => c.parentId === categoryId);
  };

  // Handle category hover
  const handleCategoryHover = (categoryId: number) => {
    if (hasSubcategories(categoryId)) {
      setHoveredCategory(categoryId);
    }
  };

  // Handle category leave
  const handleCategoryLeave = () => {
    setHoveredCategory(null);
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide", className)}>
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <nav className={cn("relative", className)}>
      <div className="flex items-center gap-4 py-2 overflow-x-auto scrollbar-hide">
        {mainCategories.map(category => (
          <div
            key={category.id}
            className="relative"
            onMouseEnter={() => handleCategoryHover(category.id)}
            onMouseLeave={handleCategoryLeave}
          >
            {hasSubcategories(category.id) ? (
              <button className="text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap flex items-center gap-1">
                {category.name}
                {category.isGlobal && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-full">Global</span>
                )}
                <ChevronDown className="h-4 w-4" />
              </button>
            ) : (
              <Link href={`/category/${category.slug}`} className={cn(
                "text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap inline-flex items-center",
                location === `/category/${category.slug}` && "text-indigo-600"
              )}>
                {category.name}
                {category.isGlobal && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-full">Global</span>
                )}
              </Link>
            )}

            {/* Dropdown for subcategories */}
            {hoveredCategory === category.id && hasSubcategories(category.id) && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-md py-2 min-w-[180px]">
                {getSubcategories(category.id).map(subcategory => (
                  <Link 
                    key={subcategory.id} 
                    href={`/category/${subcategory.slug}`}
                    className={cn(
                      "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600 flex items-center",
                      location === `/category/${subcategory.slug}` && "text-indigo-600 bg-gray-50"
                    )}
                  >
                    {subcategory.name}
                    {subcategory.isGlobal && (
                      <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-blue-100 text-blue-800 rounded-full">Global</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}