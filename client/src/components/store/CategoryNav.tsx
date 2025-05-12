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
};

interface CategoryNavProps {
  vendorId: number;
  className?: string;
}

export default function CategoryNav({ vendorId, className }: CategoryNavProps) {
  const [location] = useLocation();
  const [hoveredCategory, setHoveredCategory] = useState<number | null>(null);

  // Fetch categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: [`/api/vendors/${vendorId}/product-categories`],
    enabled: !!vendorId,
  });

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
                <ChevronDown className="h-4 w-4" />
              </button>
            ) : (
              <Link href={`/category/${category.slug}`}>
                <a className={cn(
                  "text-gray-700 hover:text-indigo-600 font-medium px-3 py-2 text-sm whitespace-nowrap",
                  location === `/category/${category.slug}` && "text-indigo-600"
                )}>
                  {category.name}
                </a>
              </Link>
            )}

            {/* Dropdown for subcategories */}
            {hoveredCategory === category.id && hasSubcategories(category.id) && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-white shadow-lg rounded-md py-2 min-w-[180px]">
                {getSubcategories(category.id).map(subcategory => (
                  <Link key={subcategory.id} href={`/category/${subcategory.slug}`}>
                    <a className={cn(
                      "block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-indigo-600",
                      location === `/category/${subcategory.slug}` && "text-indigo-600 bg-gray-50"
                    )}>
                      {subcategory.name}
                    </a>
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