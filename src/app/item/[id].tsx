/**
 * Deep-link alias: the web marketplace serves items at rentzor.uz/item/:id,
 * so app/universal links land here and forward to the product screen.
 */
import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ItemDeepLink() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) return <Redirect href="/(tabs)/home" />;
  return <Redirect href={`/product/${id}`} />;
}
