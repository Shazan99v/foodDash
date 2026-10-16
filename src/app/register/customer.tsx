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
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';

export default function CustomerRegisterScreen() {
  const registerCustomer = useAuthStore(
    (state) => state.registerCustomer
  );

  const isLoading = useAuthStore(
    (state) => state.isLoading
  );

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const handleRegister = async () => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (
      !cleanName ||
      !cleanEmail ||
      !password ||
      !confirmPassword
    ) {
      Toast.show({
        type: 'error',
        text1: 'Missing information',
        text2: 'Please complete all fields.',
      });
      return;
    }

    if (password.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Password too short',
        text2: 'Password must be at least 8 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Passwords do not match',
        text2: 'Please enter the same password twice.',
      });
      return;
    }

    try {
      const user = await registerCustomer({
        name: cleanName,
        email: cleanEmail,
        password,
      });

      Toast.show({
        type: 'success',
        text1: 'Account created!',
        text2: 'Welcome to Food App.',
      });

      if (user.role === 'CUSTOMER') {
        router.replace('/');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        'Unable to create your account. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Registration failed',
        text2: message,
      });
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color={colors.text}
            />
            <Text style={styles.backText}>Back</Text>
          </Pressable>

          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <View style={styles.logoInner}>
                <Ionicons
                  name="restaurant"
                  size={29}
                  color={colors.primary}
                />
              </View>
            </View>

            <Text style={styles.eyebrow}>
              WELCOME TO FOODDASH
            </Text>

            <Text style={styles.title}>
              Good food starts here.
            </Text>

            <Text style={styles.subtitle}>
              Create your customer account and discover
              your next favourite meal.
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>
                Create your account
              </Text>
              <Text style={styles.formSubtitle}>
                Enter your details to get started.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="person-outline"
                  size={19}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>

              <View style={styles.inputWrapper}>
                <Ionicons
                  name="mail-outline"
                  size={19}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>

              <View style={styles.passwordWrapper}>
                <Ionicons
                  name="lock-closed-outline"
                  size={19}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />

                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="next"
                  style={styles.passwordInput}
                />

                <Pressable
                  onPress={() =>
                    setShowPassword((current) => !current)
                  }
                  disabled={isLoading}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={21}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>

              <Text style={styles.fieldHint}>
                Use at least 8 characters.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                Confirm Password
              </Text>

              <View style={styles.passwordWrapper}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={19}
                  color={colors.textLight}
                  style={styles.inputIcon}
                />

                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.textLight}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleRegister}
                  style={styles.passwordInput}
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  disabled={isLoading}
                  style={styles.eyeButton}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={21}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                pressed && !isLoading && styles.buttonPressed,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator color={colors.black} />
                  <Text style={styles.registerButtonText}>
                    Creating Account...
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.registerButtonText}>
                    Create Account
                  </Text>
                  <Ionicons
                    name="arrow-forward"
                    size={19}
                    color={colors.black}
                  />
                </>
              )}
            </Pressable>

            <View style={styles.secureNote}>
              <Ionicons
                name="shield-checkmark-outline"
                size={16}
                color={colors.secondary}
              />
              <Text style={styles.secureNoteText}>
                Your account details are submitted securely.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?
            </Text>

            <Pressable
              onPress={() => router.push('/login')}
              disabled={isLoading}
              hitSlop={8}
            >
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>

          <Text style={styles.footerBrand}>
            MADE FOR YOUR NEXT CRAVING
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 42,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },

  backText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.xxl,
  },

  logoCircle: {
    width: 78,
    height: 78,
    borderRadius: 27,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '-5deg' }],
  },

  logoInner: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '5deg' }],
  },

  eyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },

  title: {
    color: colors.text,
    fontSize: 29,
    lineHeight: 36,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.7,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 330,
  },

  form: {
    width: '100%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },

  formHeading: {
    marginBottom: spacing.xl,
  },

  formTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },

  formSubtitle: {
    color: colors.textLight,
    fontSize: 13,
    lineHeight: 19,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },

  inputWrapper: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  inputIcon: {
    marginRight: spacing.sm,
  },

  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    color: colors.text,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },

  passwordWrapper: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
  },

  passwordInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    color: colors.text,
    fontSize: 14,
    paddingVertical: spacing.sm,
  },

  eyeButton: {
    width: 46,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldHint: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: spacing.sm,
  },

  registerButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },

  buttonDisabled: {
    opacity: 0.65,
  },

  registerButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },

  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  secureNoteText: {
    flexShrink: 1,
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 17,
  },

  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },

  footerText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  loginLink: {
    color: colors.secondary,
    fontSize: 13,
    fontWeight: '900',
  },

  footerBrand: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
