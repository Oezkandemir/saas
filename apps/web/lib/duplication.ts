/**
 * Shared utilities for duplication logic
 * Provides reusable patterns for duplicating entities
 */

import { getSupabaseServer } from "@/lib/supabase-server";
import { logger } from "@/lib/logger";

export interface DuplicationOptions<T> {
  /**
   * The original entity to duplicate
   */
  original: T;
  
  /**
   * Function to get the next identifier (e.g., document number, slug)
   */
  getNextIdentifier: (original: T) => Promise<string>;
  
  /**
   * Function to create the duplicate entity
   */
  createDuplicate: (data: Partial<T> & { identifier: string }) => Promise<T>;
  
  /**
   * Function to copy related items/children
   */
  copyRelatedItems?: (originalId: string, duplicateId: string) => Promise<void>;
  
  /**
   * Function to update totals or calculated fields
   */
  updateTotals?: (duplicateId: string) => Promise<void>;
  
  /**
   * Transform function to modify the duplicate data
   */
  transform?: (original: T) => Partial<T>;
  
  /**
   * Post-duplication callback
   */
  onComplete?: (duplicate: T) => Promise<void>;
}

/**
 * Generic duplication function
 */
export async function duplicateEntity<T extends { id: string }>(
  options: DuplicationOptions<T>
): Promise<T> {
  const {
    original,
    getNextIdentifier,
    createDuplicate,
    copyRelatedItems,
    updateTotals,
    transform,
    onComplete,
  } = options;

  try {
    // Get next identifier
    const identifier = await getNextIdentifier(original);

    // Transform original data if needed
    const duplicateData = transform ? transform(original) : {};

    // Create duplicate entity
    const duplicate = await createDuplicate({
      ...duplicateData,
      identifier,
    });

    // Copy related items if provided
    if (copyRelatedItems) {
      await copyRelatedItems(original.id, duplicate.id);
    }

    // Update totals if provided
    if (updateTotals) {
      await updateTotals(duplicate.id);
    }

    // Execute post-duplication callback
    if (onComplete) {
      await onComplete(duplicate);
    }

    return duplicate;
  } catch (error) {
    logger.error("Error duplicating entity:", error);
    throw error;
  }
}

/**
 * Generate unique slug by appending "-copy" and incrementing if needed
 */
export async function generateUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
  maxAttempts: number = 100
): Promise<string> {
  let slug = `${baseSlug}-copy`;
  let counter = 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const exists = await checkExists(slug);
    if (!exists) {
      return slug;
    }
    counter++;
    slug = `${baseSlug}-copy-${counter}`;
  }

  throw new Error(`Failed to generate unique slug after ${maxAttempts} attempts`);
}

/**
 * Copy items from one entity to another
 */
export async function copyItems<T extends { id: string }>(
  sourceId: string,
  targetId: string,
  tableName: string,
  itemMapper?: (item: any, index: number) => any
): Promise<void> {
  const supabase = await getSupabaseServer();

  // Fetch source items
  const { data: sourceItems, error: fetchError } = await supabase
    .from(tableName)
    .select("*")
    .eq(getParentIdColumn(tableName), sourceId)
    .order("position", { ascending: true });

  if (fetchError) {
    throw new Error(`Failed to fetch source items: ${fetchError.message}`);
  }

  if (!sourceItems || sourceItems.length === 0) {
    return; // No items to copy
  }

  // Map items for insertion
  const items = sourceItems.map((item, index) => {
    const mappedItem = itemMapper
      ? itemMapper(item, index)
      : {
          ...item,
          id: undefined, // Remove ID to create new record
          [getParentIdColumn(tableName)]: targetId,
        };
    return mappedItem;
  });

  // Insert items
  const { error: insertError } = await supabase.from(tableName).insert(items);

  if (insertError) {
    throw new Error(`Failed to copy items: ${insertError.message}`);
  }
}

/**
 * Get parent ID column name based on table name
 */
function getParentIdColumn(tableName: string): string {
  const columnMap: Record<string, string> = {
    document_items: "document_id",
    event_type_availability: "event_type_id",
    // Add more mappings as needed
  };

  return columnMap[tableName] || `${tableName.slice(0, -1)}_id`;
}

/**
 * Common duplication patterns
 */
export const duplicationPatterns = {
  /**
   * Duplicate with status reset to draft
   */
  duplicateAsDraft: <T extends { status?: string }>(original: T): Partial<T> => ({
    ...original,
    status: "draft" as any,
  }),

  /**
   * Duplicate with inactive status
   */
  duplicateAsInactive: <T extends { is_active?: boolean }>(original: T): Partial<T> => ({
    ...original,
    is_active: false,
  }),

  /**
   * Duplicate with title suffix
   */
  duplicateWithSuffix: <T extends { title?: string }>(
    original: T,
    suffix: string = " (Copy)"
  ): Partial<T> => ({
    ...original,
    title: original.title ? `${original.title}${suffix}` : undefined,
  }),
};


