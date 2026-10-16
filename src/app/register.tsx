import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const colors = {
  primary: '#FF6B1A',
  primaryDark: '#E8520C',
  secondary: '#C6F54A',
  background: '#111315',
  surface: '#1B1E21',
  surfaceAlt: '#25292D',
  text: '#F5F5F0',
  textSecondary: '#B8BEC3',
  textLight: '#858D94',
  border: '#343A3F',
};

type AccountOptionProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
  accent: string;
  tag: string;
  onPress: () => void;
};

function AccountOption({
  icon,
  title,
  description,
  accent,
  tag,
  onPress,
}: AccountOptionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Register as ${title}`}
      style={({ pressed }) => [
        styles.option,
        pressed && styles.optionPressed,
      ]}
      onPress={onPress}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${accent}16`, borderColor: `${accent}35` },
        ]}
      >
        <Ionicons
          name={icon}
          size={27}
          color={accent}
        />
      </View>

      <View style={styles.optionContent}>
        <View style={styles.optionHeading}>
          <Text style={styles.optionTitle}>{title}</Text>

          <View style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        </View>

        <Text style={styles.optionDescription}>
          {description}
        </Text>
      </View>

      <View style={styles.arrowContainer}>
        <Ionicons
          name="arrow-forward"
          size={17}
          color={colors.secondary}
        />
      </View>
    </Pressable>
  );
}

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons
            name="arrow-back"
            size={19}
            color={colors.text}
          />

          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons
                name="restaurant"
                size={31}
                color={colors.secondary}
              />
            </View>

            <View style={styles.logoDot} />
          </View>

          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>
              JOIN OUR COMMUNITY
            </Text>
          </View>

          <Text
            style={[
              styles.title,
              isCompact && styles.compactTitle,
            ]}
          >
            Create Your{' '}
            <Text style={styles.titleAccent}>Account</Text>
          </Text>

          <Text style={styles.subtitle}>
            Choose how you want to use Food App and get started.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Choose your account type
          </Text>

          <Text style={styles.sectionHint}>03 OPTIONS</Text>
        </View>

        <View style={styles.options}>
          <AccountOption
            icon="person-outline"
            title="Customer"
            description="Discover restaurants and order your favourite meals."
            accent={colors.secondary}
            tag="ORDER FOOD"
            onPress={() => router.push('/register/customer')}
          />

          <AccountOption
            icon="bicycle-outline"
            title="Rider"
            description="Apply to deliver orders and join our delivery team."
            accent={colors.primary}
            tag="DELIVER"
            onPress={() => router.push('/register/rider')}
          />

          <AccountOption
            icon="storefront-outline"
            title="Business"
            description="Register your restaurant and start receiving orders."
            accent={colors.secondary}
            tag="PARTNER"
            onPress={() => router.push('/register/business')}
          />
        </View>

        <View style={styles.loginCard}>
          <View style={styles.loginIcon}>
            <Ionicons
              name="person-circle-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>

          <View style={styles.loginContent}>
            <Text style={styles.infoTitle}>
              Already have an account?
            </Text>

            <Text style={styles.loginSubtitle}>
              Welcome back to Food App.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/login')}
            style={({ pressed }) => [
              styles.loginButton,
              pressed && styles.loginButtonPressed,
            ]}
          >
            <Text style={styles.loginLink}>Sign in</Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color={colors.secondary}
            />
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={14}
            color={colors.textLight}
          />

          <Text style={styles.footerText}>
            A better food experience starts here
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 28,
  },

  backButton: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 9,
    paddingRight: 14,
  },

  backText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  header: {
    alignItems: 'center',
    marginTop: 21,
    marginBottom: 29,
  },

  logoContainer: {
    position: 'relative',
    marginBottom: 19,
  },

  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoDot: {
    position: 'absolute',
    right: -3,
    bottom: -3,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.background,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 11,
  },

  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondary,
  },

  eyebrowText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
  },

  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 37,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginBottom: 8,
  },

  compactTitle: {
    fontSize: 26,
  },

  titleAccent: {
    color: colors.primary,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 310,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 13,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  sectionHint: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },

  options: {
    gap: 12,
  },

  option: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 15,
  },

  optionPressed: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.secondary,
    opacity: 0.92,
  },

  iconContainer: {
    width: 53,
    height: 53,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },

  optionContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 7,
  },

  optionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 5,
  },

  optionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },

  tag: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  tagText: {
    color: colors.textSecondary,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  optionDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },

  arrowContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 17,
    padding: 13,
    marginTop: 25,
  },

  loginIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  loginContent: {
    flex: 1,
    minWidth: 0,
  },

  infoTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  loginSubtitle: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 4,
  },

  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 9,
    paddingVertical: 10,
  },

  loginButtonPressed: {
    opacity: 0.65,
  },

  loginLink: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '900',
  },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 22,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },
});