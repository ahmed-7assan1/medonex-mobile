import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  PanResponder,
  Pressable,
  useWindowDimensions,
  View,
} from "react-native";

// Shared bottom sheet / centered dialog with the mobile site's motion:
// backdrop fades in 200ms while the sheet springs up (damping 32, stiffness
// 320), and both reverse together on close. The backdrop never appears
// before or without the sheet, and drag-down past the threshold closes.
export const SHEET_BACKDROP_DURATION_MS = 200;
export const SHEET_SPRING = { damping: 32, stiffness: 320, mass: 1 } as const;
export const SHEET_CLOSE_DRAG_PX = 120;
export const SHEET_BACKDROP_OPACITY = 0.4;

export function Sheet({
  visible,
  onClose,
  heightFraction = 0.7,
  center = false,
  testID,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  /** Mobile bottom-sheet height as a fraction of the window. */
  heightFraction?: number;
  /** Desktop presentation: centered dialog (opacity+scale) instead of a sheet. */
  center?: boolean;
  testID?: string;
  children: React.ReactNode;
}) {
  const { height: windowHeight, width } = useWindowDimensions();
  const sheetHeight = Math.round(windowHeight * heightFraction);
  const [rendered, setRendered] = useState(visible);
  const backdrop = useRef(new Animated.Value(visible ? 1 : 0)).current;
  // 0 = open, 1 = fully off-screen (fraction of the sheet height).
  const slide = useRef(new Animated.Value(visible ? 0 : 1)).current;
  const drag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    backdrop.stopAnimation();
    slide.stopAnimation();
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: SHEET_BACKDROP_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        center
          ? Animated.timing(slide, {
              toValue: 0,
              duration: SHEET_BACKDROP_DURATION_MS,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            })
          : Animated.spring(slide, {
              toValue: 0,
              ...SHEET_SPRING,
              useNativeDriver: true,
            }),
      ]).start();
    } else if (rendered) {
      drag.setValue(0);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 0,
          duration: SHEET_BACKDROP_DURATION_MS,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: 1,
          duration: SHEET_BACKDROP_DURATION_MS,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, center]);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 4,
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > SHEET_CLOSE_DRAG_PX) {
          closeRef.current();
        } else {
          Animated.spring(drag, { toValue: 0, ...SHEET_SPRING, useNativeDriver: true }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, ...SHEET_SPRING, useNativeDriver: true }).start();
      },
    })
  ).current;

  if (!rendered) return null;

  const translateY = Animated.add(
    slide.interpolate({ inputRange: [0, 1], outputRange: [0, sheetHeight] }),
    drag
  );
  const opacity = backdrop.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SHEET_BACKDROP_OPACITY],
  });
  const scale = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  const dialogOpacity = slide.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Modal
      visible
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: center ? "center" : "flex-end", alignItems: "center" }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          onPress={onClose}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          <Animated.View
            style={{ flex: 1, backgroundColor: "#000", opacity }}
          />
        </Pressable>
        <Animated.View
          testID={testID}
          style={
            center
              ? {
                  width: "100%",
                  maxWidth: 640,
                  maxHeight: Math.round(windowHeight * 0.86),
                  marginHorizontal: 24,
                  borderRadius: 28,
                  opacity: dialogOpacity,
                  transform: [{ scale }],
                }
              : {
                  width: "100%",
                  maxWidth: width >= 768 ? 640 : "100%",
                  height: sheetHeight,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  transform: [{ translateY }],
                }
          }
        >
          <View style={{ flex: 1, overflow: "hidden", borderRadius: center ? 28 : 0, borderTopLeftRadius: 28, borderTopRightRadius: 28 }}>
            {children}
          </View>
          {!center && (
            <View
              {...pan.panHandlers}
              style={{ position: "absolute", top: 0, left: 0, right: 0, height: 44 }}
            />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}
