import React, {
    useRef,
    useCallback,
    useEffect,
    useState,
    useMemo,
    ReactElement,
    FC, forwardRef,
} from 'react';
import { I18nManager, StyleSheet, View, ViewStyle } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  WithSpringConfig,
} from 'react-native-reanimated';
import {SwiperControlsProps, SwiperProps, SwiperRef} from '..';
import DefaultControls from './Controls';

const defaultSpring: WithSpringConfig = {
  damping: 20,
  stiffness: 120,
  mass: 0.4,
};

const Swiper: FC<SwiperProps> = forwardRef<SwiperRef, SwiperProps>(({
  children,
  vertical = false,
  from = 0,
  loop = false,
  timeout = 0,
  gesturesEnabled = () => true,
  springConfig = defaultSpring,
  minDistanceToCapture = 5,
  minDistanceForAction = 0.2,
  positionFixed = false,
  containerStyle,
  innerContainerStyle,
  swipeAreaStyle,
  slideWrapperStyle,
  controlsEnabled = true,
  controlsProps = {},
  Controls = DefaultControls,
  theme,
  onAnimationStart,
  onAnimationEnd,
  onIndexChanged,
}) => {
  const slides = useMemo(
    () =>
      React.Children.toArray(children) as ReactElement[],
    [children]
  );
  const count = slides.length;

  // Layout and state
  const [layout, setLayout] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [activeIndex, setActiveIndex] = useState(from);

  // Reanimated shared values
  const offset = useSharedValue(0); // X or Y offset depending on orientation
  const drag = useSharedValue(0);

  // Autoplay
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);

  // Util: Fix and go to index
  const fixAndGo = useCallback(
    (delta: number) => {
      fixOffset();
      onAnimationStart?.(activeIndex);
      changeIndex(delta);
    },
    [activeIndex, layout, vertical]
  );

  // Util: Fix offset to current slide
  const fixOffset = useCallback(() => {
    if (!layout.width || !layout.height) return;
    const pos =
      (vertical ? layout.height : layout.width) *
      activeIndex *
      (vertical ? -1 : I18nManager.isRTL ? 1 : -1);
    offset.value = pos;
    drag.value = 0;
  }, [activeIndex, layout, vertical]);

  // Autoplay logic
  const clearAutoplay = useCallback(() => {
    if (autoplayRef.current) clearTimeout(autoplayRef.current);
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    if (timeout) {
      autoplayRef.current = setTimeout(() => {
        goToNeighbor(timeout < 0);
      }, Math.abs(timeout) * 1000);
    }
  }, [timeout, activeIndex, count, layout.width, layout.height]);

  useEffect(() => {
    startAutoplay();
    return clearAutoplay;
  }, [startAutoplay]);

  // Move to prev/next
  const goToNeighbor = useCallback(
    (toPrev = false) => {
      fixAndGo(toPrev ? -1 : 1);
    },
    [fixAndGo]
  );

  // Go to specific index
  const goTo = useCallback(
    (index: number = 0) => {
      const delta = index - activeIndex;
      if (delta) fixAndGo(delta);
    },
    [activeIndex, fixAndGo]
  );

  // Animate to position
  const animateTo = useCallback(
    (value: number) => {
      drag.value = withSpring(
        value,
        springConfig,
        (finished) => {
          'worklet';
          if (finished) {
            drag.value = 0;
            if (onAnimationEnd) {
              runOnJS(onAnimationEnd)(activeIndex);
            }
          }
        }
      );
    },
    [activeIndex, onAnimationEnd, springConfig]
  );

  // Main index changer
  const changeIndex = useCallback(
    (delta: number) => {
      let newIndex = activeIndex + delta;
      let skip = false;

      if (activeIndex <= 0 && delta < 0) {
        skip = !loop;
        newIndex = loop ? count + delta : activeIndex;
      } else if (activeIndex + 1 >= count && delta > 0) {
        skip = !loop;
        newIndex = loop ? -1 * activeIndex + delta - 1 : activeIndex;
      }

      if (skip) {
        animateTo(0);
        return;
      }

      clearAutoplay();

      setActiveIndex((prev) => {
        const idx = Math.max(0, Math.min(count - 1, newIndex));
        onIndexChanged?.(idx);
        return idx;
      });

      const size = vertical ? layout.height : layout.width;
      const value =
        size * (vertical ? -1 : I18nManager.isRTL ? 1 : -1) * delta;
      animateTo(value);

      startAutoplay();
    },
    [
      activeIndex,
      count,
      loop,
      layout.height,
      layout.width,
      vertical,
      animateTo,
      clearAutoplay,
      onIndexChanged,
      startAutoplay,
    ]
  );

  // Gesture logic (Reanimated 3)
  const gesture = useMemo(() => {
    let panGesture = Gesture.Pan()
      .enabled(gesturesEnabled());

    if (vertical) {
      panGesture = panGesture.activeOffsetY(minDistanceToCapture);
    } else {
      panGesture = panGesture.activeOffsetX(minDistanceToCapture);
    }

    return panGesture
      .onStart(() => {
        fixOffset();
        clearAutoplay();
      })
      .onUpdate((e) => {
        drag.value = vertical ? e.translationY : e.translationX;
      })
      .onEnd((e) => {
        const size = vertical ? layout.height : layout.width;
        const correction = vertical ? e.translationY : e.translationX;

        if (
          Math.abs(correction) <
          size * (minDistanceForAction ?? 0.2)
        ) {
          // snap back
          animateTo(0);
        } else {
          // Decide direction
          const dir =
            correction > 0
              ? !vertical && I18nManager.isRTL
                ? 1
                : -1
              : !vertical && I18nManager.isRTL
                ? -1
                : 1;
          runOnJS(changeIndex)(dir);
        }
      })
      .onFinalize(() => {
        startAutoplay();
      });
  }, [
    gesturesEnabled,
    vertical,
    minDistanceToCapture,
    fixOffset,
    clearAutoplay,
    drag,
    layout.height,
    layout.width,
    animateTo,
    minDistanceForAction,
    changeIndex,
    startAutoplay,
  ]);

  // Animated style for the swipe area
  const animatedStyle = useAnimatedStyle(() => {
    if (vertical) {
      return {
        transform: [{ translateY: offset.value + drag.value }],
      };
    }
    return {
      transform: [{ translateX: offset.value + drag.value }],
    };
  });

  // Layout effect: fix offset on index/layout change
  useEffect(() => {
    fixOffset();
  }, [activeIndex, layout.width, layout.height, vertical, fixOffset]);

  const renderItem = useCallback((el: React.ReactElement, i: number) => (
    <View
      key={i}
      style={StyleSheet.flatten([
        { width: layout.width, height: layout.height },
        slideWrapperStyle,
      ])}
    >
      {el}
    </View>
  ), [layout.width, layout.height, slideWrapperStyle]);

  // Render
  return (
    <View
      style={StyleSheet.flatten([styles.root, containerStyle])}
      onLayout={(e) => {
        const { x, y, width, height } = e.nativeEvent.layout;
        setLayout({ x, y, width, height });
      }}
    >
      <View
        style={StyleSheet.flatten([
          styles.container(positionFixed, layout.x, layout.y, layout.width, layout.height),
          innerContainerStyle,
        ])}
      >
        <GestureDetector gesture={gesture}>
          <Animated.View
            style={StyleSheet.flatten([
              styles.swipeArea(vertical, count, layout.width, layout.height),
              swipeAreaStyle,
              animatedStyle,
            ])}
          >
            {slides.map(renderItem)}
          </Animated.View>
        </GestureDetector>
        {controlsEnabled && Controls && (
          <Controls
            {...(controlsProps as SwiperControlsProps)}
            theme={theme}
            vertical={vertical}
            count={count}
            activeIndex={activeIndex}
            isFirst={!loop && !activeIndex}
            isLast={!loop && activeIndex + 1 >= count}
            goToPrev={() => goToNeighbor(true)}
            goToNext={() => goToNeighbor(false)}
            goTo={goTo}
          />
        )}
      </View>
    </View>
  );
});

type SwiperStyleProps = {
  root: ViewStyle;
  container: (positionFixed: boolean, x: number, y: number, width: number, height: number) => ViewStyle;
  swipeArea: (vertical: boolean, count: number, width: number, height: number) => ViewStyle;
};

const styles: SwiperStyleProps = {
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Fix web vertical scaling (like expo v33-34)
  container: (positionFixed, x, y, width, height) => ({
    backgroundColor: 'transparent',
    // Fix safari vertical bounces
    // @ts-expect-error - WebKit bug
    position: positionFixed ? 'fixed' : 'relative',
    overflow: 'hidden',
    top: positionFixed ? y : 0,
    left: positionFixed ? x : 0,
    width,
    height,
    justifyContent: 'space-between',
  }),
  swipeArea: (vertical, count, width, height) => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: vertical ? width : width * count,
    height: vertical ? height * count : height,
    flexDirection: vertical ? 'column' : 'row',
  }),
};

export { Swiper };
