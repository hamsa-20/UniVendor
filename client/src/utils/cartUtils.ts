import { LocalCartItem } from "@/hooks/useLocalCart";

/**
 * Converts a local cart item to server format
 */
export function localToServerCartItem(item: LocalCartItem) {
  return {
    productId: item.productId,
    quantity: item.quantity,
    variant: item.variant,
    vendorId: item.vendorId
  };
}

/**
 * Converts server cart items to local format
 */
export function serverToLocalCartItems(serverItems: any[]): Omit<LocalCartItem, "id">[] {
  return serverItems.map(item => ({
    productId: item.productId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    imageUrl: item.imageUrl,
    variant: item.variant,
    colorHex: null, // Server doesn't store this separately
    size: null, // Server doesn't store this separately
    vendorId: item.vendorId || 1
  }));
}

/**
 * Merges cart data when user logs in
 * @param localItems Local cart items
 * @param serverItems Server cart items
 */
export function mergeCartItems(localItems: LocalCartItem[], serverItems: any[]): LocalCartItem[] {
  // Create a map to easily look up server items by productId and variant
  const serverItemMap = new Map();
  serverItems.forEach(item => {
    const key = `${item.productId}-${item.variant || ''}`;
    serverItemMap.set(key, item);
  });
  
  // Start with all server items
  const serverItemsConverted = serverToLocalCartItems(serverItems).map(item => ({
    ...item,
    id: `server-${item.productId}-${Date.now()}`
  }));
  
  // Add local items, merging quantities where there's overlap
  const result = [...serverItemsConverted];
  
  localItems.forEach(localItem => {
    const key = `${localItem.productId}-${localItem.variant || ''}`;
    const serverItem = serverItemMap.get(key);
    
    if (serverItem) {
      // Item exists in server cart, find it in our result and update quantity
      const index = result.findIndex(item => 
        item.productId === localItem.productId && item.variant === localItem.variant
      );
      
      if (index !== -1) {
        result[index].quantity += localItem.quantity;
      }
    } else {
      // Item doesn't exist in server cart, add it
      result.push(localItem);
    }
  });
  
  return result;
}
