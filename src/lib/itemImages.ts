/**
 * Primary image lookup shared by the home rails and grid.
 * Returns { [itemId]: image_url } for the items that have one.
 */
import { supabase } from '../integrations/supabase/client';

export async function fetchPrimaryImages(itemIds: string[]): Promise<Record<string, string>> {
  if (itemIds.length === 0) return {};

  const { data } = await supabase
    .from('item_images')
    .select('item_id, image_url')
    .in('item_id', itemIds)
    .eq('is_primary', true);

  const map: Record<string, string> = {};
  for (const image of data ?? []) {
    if (image.item_id) map[image.item_id] = image.image_url;
  }
  return map;
}
