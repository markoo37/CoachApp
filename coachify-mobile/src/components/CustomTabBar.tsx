import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkColors, lightColors } from '../styles/colors';

// Map route names to icon names
const routeIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'home',
  wellness: 'self-improvement',
  teams: 'groups',
  trainings: 'fitness-center',
};

function triggerTabHaptic() {
  // Avoid errors on web and don't block the press handler.
  if (Platform.OS === 'web') return;
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16),
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={80}
          tint={colorScheme === 'dark' ? 'dark' : 'light'}
          style={[styles.tabBarContainer, { width: '100%' }]}
        >
          <View style={styles.tabBarInner}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = state.index === index;

              const onPress = () => {
                triggerTabHaptic();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const iconName = routeIconMap[route.name] || 'circle';

              return (
                <TabButton
                  key={route.key}
                  label={label as string}
                  iconName={iconName}
                  isActive={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  colors={colors}
                  colorScheme={colorScheme ?? null}
                  routeCount={state.routes.length}
                />
              );
            })}
          </View>
        </BlurView>
      ) : (
        <View
          style={[
            styles.tabBarContainer,
            {
              backgroundColor: colorScheme === 'dark' 
                ? 'rgba(30, 41, 59, 0.95)' 
                : 'rgba(255, 255, 255, 0.95)',
            },
          ]}
        >
          <View style={styles.tabBarInner}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const label =
                options.tabBarLabel !== undefined
                  ? options.tabBarLabel
                  : options.title !== undefined
                  ? options.title
                  : route.name;

              const isFocused = state.index === index;

              const onPress = () => {
                triggerTabHaptic();
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(route.name, route.params);
                }
              };

              const onLongPress = () => {
                navigation.emit({
                  type: 'tabLongPress',
                  target: route.key,
                });
              };

              const iconName = routeIconMap[route.name] || 'circle';

              return (
                <TabButton
                  key={route.key}
                  label={label as string}
                  iconName={iconName}
                  isActive={isFocused}
                  onPress={onPress}
                  onLongPress={onLongPress}
                  colors={colors}
                  colorScheme={colorScheme ?? null}
                  routeCount={state.routes.length}
                />
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

interface TabButtonProps {
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
  isActive: boolean;
  onPress: () => void;
  onLongPress: () => void;
  colors: typeof lightColors;
  colorScheme: 'light' | 'dark' | null | undefined;
  routeCount: number;
}

function TabButton({
  label,
  iconName,
  isActive,
  onPress,
  onLongPress,
  colors,
  colorScheme,
  routeCount,
}: TabButtonProps) {
  const { width: screenWidth } = useWindowDimensions();

  // Give the active tab more horizontal space so longer labels can fit.
  // The exact ratios are tuned to look good with 4 tabs, but still behave for other counts.
  const ACTIVE_FLEX = 1.55;
  const INACTIVE_FLEX = 0.85;

  const flexAnim = useRef(new Animated.Value(isActive ? ACTIVE_FLEX : INACTIVE_FLEX)).current;
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.92)).current;
  const iconScale = useRef(new Animated.Value(isActive ? 1.15 : 1)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelWidth = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const backgroundOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(flexAnim, {
        toValue: isActive ? ACTIVE_FLEX : INACTIVE_FLEX,
        useNativeDriver: false,
        tension: 220,
        friction: 22,
      }),
      Animated.spring(scale, {
        toValue: isActive ? 1 : 0.92,
        useNativeDriver: true,
        tension: 200,
        friction: 20,
      }),
      Animated.spring(iconScale, {
        toValue: isActive ? 1.15 : 1,
        useNativeDriver: true,
        tension: 250,
        friction: 18,
      }),
      Animated.timing(labelOpacity, {
        toValue: isActive ? 1 : 0,
        duration: isActive ? 250 : 150,
        useNativeDriver: false,
      }),
      Animated.spring(labelWidth, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: false,
        tension: 200,
        friction: 20,
      }),
      Animated.spring(backgroundOpacity, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: false,
        tension: 200,
        friction: 20,
      }),
    ]).start();
  }, [isActive, flexAnim, scale, iconScale, labelOpacity, labelWidth, backgroundOpacity]);

  const animatedIconStyle = {
    transform: [{ scale: iconScale }],
  };

  // Estimate how much room the label can reasonably take based on screen width and tab count.
  // This prevents clipping on smaller devices and allows longer labels on larger devices.
  const containerHorizontalPadding = 20; // styles.container paddingHorizontal (10 * 2)
  const innerHorizontalPadding = 8; // styles.tabBarInner horizontal padding approximation (4 * 2)
  const approxAvailableWidth = Math.max(0, screenWidth - containerHorizontalPadding - innerHorizontalPadding);

  const totalFlex = ACTIVE_FLEX + INACTIVE_FLEX * Math.max(0, routeCount - 1);
  const activeTabWidth = totalFlex > 0 ? (approxAvailableWidth * ACTIVE_FLEX) / totalFlex : approxAvailableWidth;

  const tabInnerPaddingX = 28; // styles.tabButtonInner paddingHorizontal (14 * 2)
  const iconArea = 24 + 8; // iconWrapper (24) + spacing buffer
  const maxLabelWidth = Math.max(72, Math.floor(activeTabWidth - tabInnerPaddingX - iconArea));

  const animatedLabelStyle = {
    opacity: labelOpacity,
    maxWidth: labelWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, maxLabelWidth],
    }),
    marginLeft: labelWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
  };

  const animatedContainerStyle = {
    transform: [{ scale }],
  };

  const animatedBackgroundStyle = {
    opacity: backgroundOpacity,
  };

  const iconColor = isActive
    ? '#ffffff'
    : colorScheme === 'dark'
    ? '#94a3b8'
    : '#64748b';

  const iconSize = 22;

  return (
    <Animated.View style={[styles.tabButtonWrapper, { flex: flexAnim }]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
        style={styles.tabButton}
      >
        <Animated.View style={[styles.tabButtonInner, animatedContainerStyle]}>
          <Animated.View
            style={[
              styles.tabButtonBackground,
              animatedBackgroundStyle,
              {
                backgroundColor: colors.primary,
              },
            ]}
          />
          <Animated.View style={styles.iconWrapper}>
            <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
              <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
            </Animated.View>
          </Animated.View>
          <Animated.View style={[styles.labelContainer, animatedLabelStyle]}>
            <Animated.Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? '#ffffff' : 'transparent',
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {label}
            </Animated.Text>
          </Animated.View>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  tabBarContainer: {
    width: '100%',
    borderRadius: 32,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        shadowColor: '#000',
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarInner: {
    flexDirection: 'row',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    width: '100%',
  },
  tabButtonWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginHorizontal: 0,
    width: '100%',
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  tabButtonBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    flexShrink: 0,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: 20,
    flexShrink: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
    letterSpacing: 0.1,
  },
});

