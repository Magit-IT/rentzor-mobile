/**
 * ScrollView that only scrolls when its content is actually taller than the
 * viewport — pages sit still (no drag/bounce/overscroll) when everything fits.
 */
import React, { forwardRef, useRef, useState } from 'react';
import { ScrollView, ScrollViewProps } from 'react-native';

export const PageScrollView = forwardRef<ScrollView, ScrollViewProps>(function PageScrollView(
  { onLayout, onContentSizeChange, ...props },
  ref,
) {
  const [canScroll, setCanScroll] = useState(false);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
  const updateCanScroll = () =>
    setCanScroll(contentHeight.current > viewportHeight.current + 1);

  return (
    <ScrollView
      ref={ref}
      showsVerticalScrollIndicator={false}
      alwaysBounceVertical={false}
      overScrollMode="never"
      scrollEnabled={canScroll}
      onLayout={(e) => {
        viewportHeight.current = e.nativeEvent.layout.height;
        updateCanScroll();
        onLayout?.(e);
      }}
      onContentSizeChange={(w, h) => {
        contentHeight.current = h;
        updateCanScroll();
        onContentSizeChange?.(w, h);
      }}
      {...props}
    />
  );
});
