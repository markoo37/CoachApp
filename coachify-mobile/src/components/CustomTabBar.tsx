import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '../styles/colors';

// Map route names to icon names
const routeIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: 'home',
  wellness: 'self-improvement',
  teams: 'groups',
  trainings: 'fitness-center',
};

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'transparent',
          paddingBottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 10),
        },
      ]}
    >
      <View
        style={[
          styles.tabBarContainer,
          {
            backgroundColor: colorScheme === 'dark' 
              ? 'rgba(30, 41, 59, 0.75)' 
              : Platform.OS === 'ios' 
                ? 'rgba(255, 255, 255, 0.8)' 
                : 'rgba(255, 255, 255, 0.8)',
            shadowColor: '#000',
          },
        ]}
      >
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

          // Get icon name from route name
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
            />
          );
        })}
      </View>
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
}

function TabButton({
  label,
  iconName,
  isActive,
  onPress,
  onLongPress,
  colors,
  colorScheme,
}: TabButtonProps) {
  const scale = useRef(new Animated.Value(isActive ? 1 : 0.95)).current;
  const iconScale = useRef(new Animated.Value(isActive ? 1.1 : 1)).current;
  const labelOpacity = useRef(new Animated.Value(isActive ? 1 : 0)).current;
  const labelWidth = useRef(new Animated.Value(isActive ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: isActive ? 1 : 0.95,
        useNativeDriver: true,
        tension: 180,
        friction: 18,
      }),
      Animated.spring(iconScale, {
        toValue: isActive ? 1.1 : 1,
        useNativeDriver: true,
        tension: 200,
        friction: 15,
      }),
      Animated.timing(labelOpacity, {
        toValue: isActive ? 1 : 0,
        duration: isActive ? 300 : 150,
        useNativeDriver: false,
      }),
      Animated.spring(labelWidth, {
        toValue: isActive ? 1 : 0,
        useNativeDriver: false,
        tension: 180,
        friction: 18,
      }),
    ]).start();
  }, [isActive]);

  const animatedIconStyle = {
    transform: [{ scale: iconScale }],
  };

  const animatedLabelStyle = {
    opacity: labelOpacity,
    maxWidth: labelWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 100],
    }),
    marginLeft: labelWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 6],
    }),
  };

  const animatedContainerStyle = {
    transform: [{ scale }],
  };

  const iconColor = isActive
    ? '#ffffff'
    : colorScheme === 'dark'
    ? '#94a3b8'
    : '#64748b';

  const iconSize = 22;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={styles.tabButton}
    >
      <Animated.View
        style={[
          styles.tabButtonInner,
          isActive && {
            backgroundColor: '#e40145',
            borderWidth: 1,
            borderColor: '#ffffff',
          },
          animatedContainerStyle,
        ]}
      >
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
            <MaterialIcons name={iconName} size={iconSize} color={iconColor} />
          </Animated.View>
        </View>
        <Animated.View style={[styles.labelContainer, animatedLabelStyle]}>
          <Animated.Text
            style={[
              styles.tabLabel,
              {
                color: '#ffffff',
              },
            ]}
            numberOfLines={1}
          >
            {label}
          </Animated.Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  tabBarContainer: {
    flexDirection: 'row',
    borderRadius: 28,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 60,
    borderWidth: Platform.OS === 'ios' ? 0.5 : 0,
    borderColor: Platform.OS === 'ios' ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        backdropFilter: 'blur(20px)',
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    overflow: 'hidden',
  },
  tabButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});

