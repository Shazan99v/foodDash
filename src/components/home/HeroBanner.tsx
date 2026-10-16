import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

export default function HeroBanner() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;
  const isWide = width >= 768;

  const handleOrderNow = () => {
    router.push({
      pathname: '/explore',
      params: {
        service: 'express',
      },
    });
  };

  return (
    <View style={[styles.container, isWide && styles.wideContainer]}>
      <LinearGradient
        colors={['#24201E', '#17191B', '#111315']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.banner,
          isCompact && styles.compactBanner,
          isWide && styles.wideBanner,
        ]}
      >
        <LinearGradient
          colors={['#FF8A36', '#FF6B1A', '#E8520C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orangeAccent}
        />

        <View style={styles.glowOne} />
        <View style={styles.glowTwo} />

        <View style={[styles.content, isCompact && styles.compactContent]}>
          <View style={styles.badge}>
            <Ionicons
              name="flash"
              size={13}
              color={colors.secondary}
            />

            <Text style={styles.badgeText}>
              EXPRESS DELIVERY
            </Text>

            <View style={styles.liveDot} />
          </View>

          <Text style={[styles.title, isCompact && styles.compactTitle]}>
            Craving{'\n'}Something{' '}
            <Text style={styles.titleAccent}>Delicious?</Text>
          </Text>

          <Text style={styles.subtitle}>
            Your favorites, faster.
          </Text>

          <Text style={styles.description}>
            Hot, fresh food delivered straight to your door.
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Order express delivery now"
            style={styles.button}
            activeOpacity={0.82}
            onPress={handleOrderNow}
          >
            <Text style={styles.buttonText}>
              Order Now
            </Text>

            <View style={styles.buttonIcon}>
              <Ionicons
                name="arrow-forward"
                size={15}
                color={colors.background}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.trustRow}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.trustText}>
              Quick, convenient delivery
            </Text>
          </View>
        </View>

        <View style={styles.artwork}>
          <View style={styles.foodOrbit} />
          <View style={styles.foodCircle}>
            <Text style={[styles.foodEmoji, isCompact && styles.compactFoodEmoji]}>
              🍔
            </Text>
          </View>

          <View style={styles.smallCircle}>
            <Text style={styles.smallEmoji}>🍟</Text>
          </View>

          <View style={styles.deliveryBadge}>
            <View style={styles.deliveryIcon}>
              <Ionicons
                name="bicycle"
                size={17}
                color={colors.background}
              />
            </View>

            <View>
              <Text style={styles.deliveryBadgeTitle}>EXPRESS</Text>
              <Text style={styles.deliveryBadgeText}>On the way</Text>
            </View>
          </View>

          <View style={styles.sparkleOne}>
            <Ionicons
              name="sparkles"
              size={19}
              color={colors.secondary}
            />
          </View>

          <View style={styles.sparkleTwo}>
            <View style={styles.sparkleDot} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },

  wideContainer: {
    alignSelf: 'center',
    maxWidth: 1100,
  },

  banner: {
    minHeight: 280,
    borderRadius: radius.xl,
    padding: spacing.xl,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#343A3F',
    justifyContent: 'center',
  },

  compactBanner: {
    minHeight: 260,
    padding: spacing.md,
  },

  wideBanner: {
    minHeight: 310,
    padding: spacing.xxxl,
  },

  orangeAccent: {
    position: 'absolute',
    left: 0,
    top: 32,
    bottom: 32,
    width: 4,
    borderTopRightRadius: radius.round,
    borderBottomRightRadius: radius.round,
  },

  content: {
    width: '66%',
    maxWidth: 490,
    zIndex: 3,
  },

  compactContent: {
    width: '72%',
  },

  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#25292D',
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radius.round,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#454039',
  },

  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: colors.secondary,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginLeft: 2,
  },

  title: {
    fontSize: 30,
    fontWeight: '900',
    color: colors.text,
    lineHeight: 36,
    letterSpacing: -0.8,
  },

  compactTitle: {
    fontSize: 25,
    lineHeight: 30,
  },

  titleAccent: {
    color: colors.primary,
  },

  subtitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: spacing.sm,
  },

  description: {
    fontSize: 11,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    maxWidth: 255,
  },

  button: {
    alignSelf: 'flex-start',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.secondary,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.round,
  },

  buttonText: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.background,
  },

  buttonIcon: {
    width: 29,
    height: 29,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  trustText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },

  artwork: {
    position: 'absolute',
    width: 190,
    height: 220,
    right: 0,
    top: '50%',
    marginTop: -110,
    zIndex: 1,
  },

  foodOrbit: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 100,
    right: -12,
    top: 23,
    backgroundColor: '#FF6B1A12',
    borderWidth: 1,
    borderColor: '#FF6B1A35',
  },

  foodCircle: {
    position: 'absolute',
    right: 5,
    top: 36,
    width: 135,
    height: 135,
    borderRadius: 100,
    backgroundColor: '#25292D',
    borderWidth: 1,
    borderColor: '#454039',
    alignItems: 'center',
    justifyContent: 'center',
  },

  foodEmoji: {
    fontSize: 76,
  },

  compactFoodEmoji: {
    fontSize: 64,
  },

  smallCircle: {
    position: 'absolute',
    right: 118,
    bottom: 20,
    width: 55,
    height: 55,
    borderRadius: 100,
    backgroundColor: colors.secondary,
    borderWidth: 3,
    borderColor: '#17191B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  smallEmoji: {
    fontSize: 29,
  },

  deliveryBadge: {
    position: 'absolute',
    right: 5,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#25292D',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#454039',
    zIndex: 4,
  },

  deliveryIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },

  deliveryBadgeTitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: colors.text,
  },

  deliveryBadgeText: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2,
  },

  sparkleOne: {
    position: 'absolute',
    right: 24,
    top: 8,
  },

  sparkleTwo: {
    position: 'absolute',
    right: 145,
    top: 25,
    width: 13,
    height: 13,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6F54A25',
  },

  sparkleDot: {
    width: 5,
    height: 5,
    borderRadius: radius.round,
    backgroundColor: colors.secondary,
  },

});