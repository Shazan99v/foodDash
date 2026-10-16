import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import { colors, radius, spacing } from '../constants/theme';
import { useAuthStore } from '../stores/authStore';

export default function LoginScreen() {
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2: 'Please enter your email and password.',
      });
      return;
    }

    try {
      const user = await login({
        email: email.trim().toLowerCase(),
        password,
      });

      if (!user) {
        Toast.show({
          type: 'error',
          text1: 'Login failed',
          text2: 'Unable to sign in with these credentials.',
        });
        return;
      }

      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Signed in as ${user.name}.`,
      });

      if (user.role === 'ADMIN') {
        router.replace('/admin');
        return;
      }

      if (user.role === 'BUSINESS') {
        if (user.status === 'PENDING') {
          router.replace('/business-pending');
          return;
        }

        if (user.status === 'REJECTED') {
          router.replace('/business-rejected');
          return;
        }

        router.replace('/business');
        return;
      }

      if (user.role === 'RIDER') {
        if (user.status === 'PENDING') {
          router.replace('/rider-pending');
          return;
        }

        if (user.status === 'REJECTED') {
          router.replace('/rider-rejected');
          return;
        }

        router.replace('/rider');
        return;
      }

      router.replace('/');
    } catch (error: any) {
      console.log('LOGIN ERROR:', error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Unable to connect to the server.';

      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: message,
      });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.brandLabel}>
            <View style={styles.brandDot} />
            <Text style={styles.brandText}>FOODDASH</Text>
          </View>
        </View>

        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <View style={styles.logoInner}>
              <Ionicons
                name="restaurant"
                size={30}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.welcomePill}>
            <Ionicons
              name="flash"
              size={12}
              color={colors.secondary}
            />
            <Text style={styles.welcomePillText}>
              YOUR NEXT MEAL IS CLOSER
            </Text>
          </View>

          <Text style={styles.title}>
            Welcome{'\n'}
            <Text style={styles.titleAccent}>back.</Text>
          </Text>

          <Text style={styles.subtitle}>
            Sign in to order your favourites and keep track of every delivery.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.formHeading}>
            <Text style={styles.formTitle}>Sign in</Text>
            <Text style={styles.formSubtitle}>
              Enter your account details below.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>EMAIL ADDRESS</Text>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={colors.textSecondary}
                />
              </View>

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.label}>PASSWORD</Text>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputIcon}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={colors.textSecondary}
                />
              </View>

              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Enter your password"
                placeholderTextColor={colors.textLight}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={() => void handleLogin()}
                style={styles.input}
              />

              <Pressable
                onPress={() => setShowPassword((current) => !current)}
                style={styles.eyeButton}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={21}
                  color={colors.textSecondary}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.loginButton,
              pressed && !isLoading && styles.pressed,
              isLoading && styles.loginButtonDisabled,
            ]}
            onPress={() => void handleLogin()}
            disabled={isLoading}
            accessibilityRole="button"
          >
            {isLoading ? (
              <ActivityIndicator
                size="small"
                color={colors.black}
              />
            ) : (
              <>
                <Text style={styles.loginButtonText}>
                  Sign In
                </Text>

                <View style={styles.loginArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={colors.secondary}
                  />
                </View>
              </>
            )}
          </Pressable>

          <View style={styles.secureNote}>
            <Ionicons
              name="shield-checkmark-outline"
              size={15}
              color={colors.secondary}
            />
            <Text style={styles.secureNoteText}>
              Your account is protected
            </Text>
          </View>
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>
            New to FoodDash?
          </Text>

          <Pressable
            onPress={() => router.push('/register')}
            accessibilityRole="button"
          >
            <Text style={styles.signupLink}>Create account</Text>
          </Pressable>
        </View>

        <View style={styles.bottomDivider}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.guestButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace('/')}
          accessibilityRole="button"
        >
          <Ionicons
            name="compass-outline"
            size={19}
            color={colors.text}
          />
          <Text style={styles.guestButtonText}>
            Continue exploring as guest
          </Text>
          <Ionicons
            name="chevron-forward"
            size={17}
            color={colors.textSecondary}
          />
        </Pressable>

        <Text style={styles.footerText}>
          GOOD FOOD. ZERO FUSS.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: 22,
    paddingBottom: 34,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  brandLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  brandText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
  },

  header: {
    alignItems: 'flex-start',
    marginBottom: 27,
  },

  logoCircle: {
    width: 74,
    height: 74,
    borderRadius: 25,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 21,
  },

  logoInner: {
    width: 55,
    height: 55,
    borderRadius: 19,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  welcomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginBottom: 14,
  },

  welcomePillText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },

  title: {
    fontSize: 38,
    lineHeight: 43,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.2,
  },

  titleAccent: {
    color: colors.primary,
  },

  subtitle: {
    marginTop: 11,
    fontSize: 13,
    lineHeight: 21,
    color: colors.textSecondary,
    maxWidth: 340,
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },

  formHeading: {
    marginBottom: 24,
  },

  formTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: colors.text,
  },

  formSubtitle: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  field: {
    marginBottom: 19,
  },

  passwordLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  label: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 9,
  },

  inputWrapper: {
    minHeight: 55,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 11,
    paddingRight: 9,
    flexDirection: 'row',
    alignItems: 'center',
  },

  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 14,
    marginLeft: 10,
    paddingVertical: 12,
  },

  eyeButton: {
    width: 37,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 3,
  },

  loginButton: {
    minHeight: 55,
    borderRadius: radius.md,
    backgroundColor: colors.secondary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 5,
    paddingHorizontal: 16,
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
  },

  loginArrow: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: colors.black,
    alignItems: 'center',
    justifyContent: 'center',
  },

  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 17,
  },

  secureNoteText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },

  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
    gap: 6,
  },

  signupText: {
    color: colors.textSecondary,
    fontSize: 12,
  },

  signupLink: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '900',
  },

  bottomDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginTop: 23,
    marginBottom: 15,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },

  orText: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },

  guestButton: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
  },

  guestButtonText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  pressed: {
    opacity: 0.75,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: 27,
  },
});
