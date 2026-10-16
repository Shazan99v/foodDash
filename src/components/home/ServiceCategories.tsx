import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

const services = [
  {
    id: 'express',
    title: 'Express',
    subtitle: 'Fast delivery',
    icon: 'flash' as const,
    accent: colors.primary,
  },
  {
    id: 'groceries',
    title: 'Groceries',
    subtitle: 'Daily essentials',
    icon: 'cart' as const,
    accent: colors.secondary,
  },
  {
    id: 'restaurants',
    title: 'Restaurants',
    subtitle: 'Order food',
    icon: 'restaurant' as const,
    accent: colors.primary,
  },
  {
    id: 'deals',
    title: 'Deals',
    subtitle: 'Save more',
    icon: 'pricetag' as const,
    accent: colors.secondary,
  },
];

export default function ServiceCategories() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const handleServicePress = (serviceId: string) => {
    router.push({
      pathname: '/explore',
      params: {
        service: serviceId,
      },
    });
  };

  const handleSeeAll = () => {
    router.push('/explore');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headingGroup}>
          <View style={styles.headingAccent} />

          <View>
            <Text style={styles.eyebrow}>MORE TO DISCOVER</Text>

            <Text style={styles.title}>
              Explore Services
            </Text>

            <Text style={styles.subtitle}>
              Everything you need, delivered
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="See all services"
          activeOpacity={0.75}
          onPress={handleSeeAll}
          style={styles.seeAllButton}
        >
          <Text style={styles.seeAll}>See all</Text>

          <Ionicons
            name="arrow-forward"
            size={14}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          isCompact && styles.compactList,
        ]}
      >
        {services.map((service, index) => (
          <TouchableOpacity
            key={service.id}
            accessibilityRole="button"
            accessibilityLabel={`${service.title}, ${service.subtitle}`}
            style={[
              styles.service,
              isCompact && styles.compactService,
            ]}
            activeOpacity={0.78}
            onPress={() => handleServicePress(service.id)}
          >
            <View style={styles.tile}>
              <View
                style={[
                  styles.iconGlow,
                  {
                    backgroundColor:
                      service.accent === colors.primary
                        ? '#FF6B1A18'
                        : '#C6F54A16',
                  },
                ]}
              >
                <Ionicons
                  name={service.icon}
                  size={27}
                  color={service.accent}
                />
              </View>

              <View
                style={[
                  styles.numberBadge,
                  {
                    backgroundColor: service.accent,
                  },
                ]}
              >
                <Text style={styles.numberText}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
              </View>

              <View
                style={[
                  styles.bottomAccent,
                  { backgroundColor: service.accent },
                ]}
              />
            </View>

            <Text style={styles.serviceTitle}>
              {service.title}
            </Text>

            <Text style={styles.serviceSubtitle}>
              {service.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },

  headingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },

  headingAccent: {
    width: 4,
    height: 43,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    marginRight: spacing.md,
  },

  eyebrow: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.secondary,
    marginBottom: 4,
  },

  title: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },

  subtitle: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4,
  },

  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    marginLeft: spacing.xs,
  },

  seeAll: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },

  list: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },

  compactList: {
    gap: spacing.sm,
  },

  service: {
    width: 104,
    alignItems: 'center',
  },

  compactService: {
    width: 96,
  },

  tile: {
    width: 78,
    height: 78,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    position: 'relative',
  },

  iconGlow: {
    width: 51,
    height: 51,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  numberText: {
    fontSize: 8,
    fontWeight: '900',
    color: colors.background,
  },

  bottomAccent: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 0,
    height: 3,
    borderTopLeftRadius: radius.round,
    borderTopRightRadius: radius.round,
  },

  serviceTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.text,
    textAlign: 'center',
  },

  serviceSubtitle: {
    fontSize: 9,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
});