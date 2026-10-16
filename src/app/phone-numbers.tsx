import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useFocusEffect, useRouter } from 'expo-router';

import {
  addPhoneNumber,
  deletePhoneNumber,
  getPhoneNumbers,
  setPrimaryPhoneNumber,
  updatePhoneNumber,
  type SavedPhoneNumber,
  type PhoneNumberLabel,
} from '../services/auth/authApi';

import { colors, radius, spacing } from '../constants/theme';

const LABELS: { title: string; value: PhoneNumberLabel }[] = [
  { title: 'Personal', value: 'PERSONAL' },
  { title: 'Work', value: 'WORK' },
  { title: 'Other', value: 'OTHER' },
];

const getLabel = (label: string) => {
  if (label.toUpperCase() === 'WORK') return 'Work';
  if (label.toUpperCase() === 'OTHER') return 'Other';
  if (label.toUpperCase() === 'PERSONAL') return 'Personal';
  return label;
};

const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n\n${message}`);
    }
    return;
  }

  Alert.alert(title, message);
};

export default function PhoneNumbersScreen() {
  const router = useRouter();

  const [phoneNumbers, setPhoneNumbers] = useState<SavedPhoneNumber[]>([]);
  const [number, setNumber] = useState('');
  const [label, setLabel] = useState<PhoneNumberLabel>('PERSONAL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNumber, setEditingNumber] = useState('');
  const [editingLabel, setEditingLabel] =
    useState<PhoneNumberLabel>('PERSONAL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadPhoneNumbers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const result = await getPhoneNumbers();
      setPhoneNumbers(result);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          'Unable to load your phone numbers.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPhoneNumbers();
    }, [loadPhoneNumbers])
  );

  const resetForm = () => {
    setNumber('');
    setLabel('PERSONAL');
  };

  const addNumber = async () => {
    const cleanNumber = number.trim();

    if (!cleanNumber) {
      showMessage('Phone number required', 'Enter a phone number first.');
      return;
    }

    if (cleanNumber.length > 30) {
      showMessage('Invalid phone number', 'Use 30 characters or fewer.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const result = await addPhoneNumber({
        number: cleanNumber,
        label,
        isPrimary: phoneNumbers.length === 0,
      });

      setPhoneNumbers(result);
      resetForm();
      showMessage('Saved', 'Your phone number has been saved.');
    } catch (err: any) {
      showMessage(
        'Could not save number',
        err?.response?.data?.message || 'Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (phone: SavedPhoneNumber) => {
    setEditingId(phone._id);
    setEditingNumber(phone.number);
    setEditingLabel(
      phone.label.toUpperCase() === 'WORK'
        ? 'WORK'
        : phone.label.toUpperCase() === 'OTHER'
          ? 'OTHER'
          : 'PERSONAL'
    );
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingNumber('');
    setEditingLabel('PERSONAL');
  };

  const saveEditedNumber = async (phoneId: string) => {
    const cleanNumber = editingNumber.trim();

    if (!cleanNumber || cleanNumber.length > 30) {
      showMessage('Invalid phone number', 'Enter a valid phone number.');
      return;
    }

    setActionId(phoneId);

    try {
      const result = await updatePhoneNumber(phoneId, {
        number: cleanNumber,
        label: editingLabel,
      });

      setPhoneNumbers(result);
      cancelEditing();
      showMessage('Updated', 'Your phone number has been updated.');
    } catch (err: any) {
      showMessage(
        'Update failed',
        err?.response?.data?.message || 'Please try again.'
      );
    } finally {
      setActionId(null);
    }
  };

  const makePrimary = async (phoneId: string) => {
    setActionId(phoneId);

    try {
      const result = await setPrimaryPhoneNumber(phoneId);
      setPhoneNumbers(result);
    } catch (err: any) {
      showMessage(
        'Could not update primary number',
        err?.response?.data?.message || 'Please try again.'
      );
    } finally {
      setActionId(null);
    }
  };

  const deleteNumber = (phone: SavedPhoneNumber) => {
    const performDelete = async () => {
      setActionId(phone._id);

      try {
        const result = await deletePhoneNumber(phone._id);
        setPhoneNumbers(result);

        if (editingId === phone._id) {
          cancelEditing();
        }
      } catch (err: any) {
        showMessage(
          'Could not delete number',
          err?.response?.data?.message || 'Please try again.'
        );
      } finally {
        setActionId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(`Delete ${phone.number}?`)
      ) {
        void performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete phone number',
      `Are you sure you want to delete ${phone.number}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void performDelete(),
        },
      ]
    );
  };

  const renderLabelOptions = (
    selected: PhoneNumberLabel,
    onSelect: (value: PhoneNumberLabel) => void
  ) => (
    <View style={styles.labelOptions}>
      {LABELS.map((item) => {
        const active = selected === item.value;

        return (
          <Pressable
            key={item.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.value)}
            style={({ pressed }) => [
              styles.labelOption,
              active && styles.labelOptionActive,
              pressed && styles.pressed,
            ]}
          >
            {active && (
              <Ionicons
                name="checkmark-circle"
                size={14}
                color={colors.black}
              />
            )}
            <Text
              style={[
                styles.labelOptionText,
                active && styles.labelOptionTextActive,
              ]}
            >
              {item.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/account');
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={goBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
          <Text style={styles.title}>Phone Numbers</Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="call-outline" size={21} color={colors.primary} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.introCard}>
            <View style={styles.introAccent} />
            <View style={styles.introIcon}>
              <Ionicons
                name="shield-checkmark-outline"
                size={24}
                color={colors.secondary}
              />
            </View>
            <View style={styles.introText}>
              <Text style={styles.introEyebrow}>STAY CONNECTED</Text>
              <Text style={styles.introTitle}>Your contact details</Text>
              <Text style={styles.introDescription}>
                Save multiple contact numbers and choose your primary number.
              </Text>
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeading}>
              <View style={styles.formHeadingIcon}>
                <Ionicons
                  name="add"
                  size={19}
                  color={colors.secondary}
                />
              </View>
              <View style={styles.formHeadingText}>
                <Text style={styles.sectionTitle}>Add a phone number</Text>
                <Text style={styles.sectionSubtitle}>
                  Keep your contact details up to date
                </Text>
              </View>
            </View>

            <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
            <View style={styles.inputWrap}>
              <Ionicons
                name="call-outline"
                size={19}
                color={colors.secondary}
              />
              <TextInput
                value={number}
                onChangeText={setNumber}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
                autoComplete="tel"
                maxLength={30}
                style={styles.input}
                selectionColor={colors.secondary}
              />
            </View>

            <Text style={styles.fieldLabel}>SAVE NUMBER AS</Text>
            {renderLabelOptions(label, setLabel)}

            <Pressable
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void addNumber()}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && !saving && styles.pressed,
                saving && styles.disabledButton,
              ]}
            >
              {saving ? (
                <ActivityIndicator color={colors.black} />
              ) : (
                <Ionicons
                  name="add-circle-outline"
                  size={21}
                  color={colors.black}
                />
              )}
              <Text style={styles.primaryButtonText}>
                {saving ? 'Saving...' : 'Save Phone Number'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.listHeader}>
            <View>
              <Text style={styles.sectionTitle}>Saved numbers</Text>
              <Text style={styles.listSubtitle}>
                {phoneNumbers.length}{' '}
                {phoneNumbers.length === 1 ? 'number' : 'numbers'} saved
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Refresh phone numbers"
              onPress={() => void loadPhoneNumbers()}
              disabled={loading}
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
                loading && styles.disabledButton,
              ]}
            >
              <Ionicons
                name="refresh-outline"
                size={19}
                color={colors.secondary}
              />
            </Pressable>
          </View>

          {!!error && (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color={colors.danger}
              />
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadPhoneNumbers()}
              >
                <Text style={styles.retryText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {loading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="large" color={colors.secondary} />
              <Text style={styles.stateText}>Loading phone numbers...</Text>
            </View>
          ) : phoneNumbers.length === 0 ? (
            <View style={styles.stateCard}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name="call-outline"
                  size={28}
                  color={colors.secondary}
                />
              </View>
              <Text style={styles.emptyTitle}>No saved numbers yet</Text>
              <Text style={styles.stateText}>
                Add a phone number above to get started.
              </Text>
            </View>
          ) : (
            phoneNumbers.map((phone) => {
              const isEditing = editingId === phone._id;
              const isBusy = actionId === phone._id;

              return (
                <View key={phone._id} style={styles.phoneCard}>
                  <View style={styles.phoneTopRow}>
                    <View
                      style={[
                        styles.phoneIcon,
                        phone.isPrimary && styles.phoneIconPrimary,
                      ]}
                    >
                      <Ionicons
                        name="call"
                        size={20}
                        color={phone.isPrimary ? colors.secondary : colors.primary}
                      />
                    </View>

                    <View style={styles.phoneInfo}>
                      <Text style={styles.phoneLabel}>
                        {getLabel(phone.label)}
                      </Text>
                      <Text style={styles.phoneNumber}>{phone.number}</Text>
                    </View>

                    {phone.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.secondary}
                        />
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                  </View>

                  {isEditing ? (
                    <View style={styles.editForm}>
                      <Text style={styles.fieldLabel}>PHONE NUMBER</Text>
                      <View style={styles.inputWrap}>
                        <Ionicons
                          name="call-outline"
                          size={18}
                          color={colors.secondary}
                        />
                        <TextInput
                          value={editingNumber}
                          onChangeText={setEditingNumber}
                          keyboardType="phone-pad"
                          placeholder="Phone number"
                          placeholderTextColor={colors.textLight}
                          maxLength={30}
                          style={styles.input}
                          selectionColor={colors.secondary}
                        />
                      </View>

                      <Text style={styles.fieldLabel}>SAVE NUMBER AS</Text>
                      {renderLabelOptions(editingLabel, setEditingLabel)}

                      <View style={styles.editActions}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.cancelButton,
                            pressed && styles.pressed,
                          ]}
                          onPress={cancelEditing}
                          disabled={isBusy}
                        >
                          <Text style={styles.cancelButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                          disabled={isBusy}
                          style={({ pressed }) => [
                            styles.smallPrimaryButton,
                            pressed && !isBusy && styles.pressed,
                            isBusy && styles.disabledButton,
                          ]}
                          onPress={() => void saveEditedNumber(phone._id)}
                        >
                          {isBusy ? (
                            <ActivityIndicator color={colors.black} />
                          ) : (
                            <>
                              <Ionicons
                                name="checkmark"
                                size={17}
                                color={colors.black}
                              />
                              <Text style={styles.smallPrimaryButtonText}>
                                Save changes
                              </Text>
                            </>
                          )}
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.phoneActions}>
                      {!phone.isPrimary && (
                        <Pressable
                          disabled={isBusy}
                          style={({ pressed }) => [
                            styles.actionButton,
                            pressed && styles.pressed,
                            isBusy && styles.disabledButton,
                          ]}
                          onPress={() => void makePrimary(phone._id)}
                        >
                          {isBusy ? (
                            <ActivityIndicator color={colors.secondary} />
                          ) : (
                            <Ionicons
                              name="star-outline"
                              size={17}
                              color={colors.secondary}
                            />
                          )}
                          <Text style={styles.actionButtonText}>
                            Make primary
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        disabled={isBusy}
                        style={({ pressed }) => [
                          styles.actionButton,
                          pressed && styles.pressed,
                          isBusy && styles.disabledButton,
                        ]}
                        onPress={() => startEditing(phone)}
                      >
                        <Ionicons
                          name="create-outline"
                          size={17}
                          color={colors.textSecondary}
                        />
                        <Text style={styles.actionButtonText}>Edit</Text>
                      </Pressable>

                      <Pressable
                        disabled={isBusy}
                        style={({ pressed }) => [
                          styles.actionButton,
                          styles.deleteAction,
                          pressed && styles.pressed,
                          isBusy && styles.disabledButton,
                        ]}
                        onPress={() => deleteNumber(phone)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color={colors.danger}
                        />
                        <Text style={styles.deleteActionText}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })
          )}

          <View style={styles.noteCard}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.secondary}
            />
            <Text style={styles.noteText}>
              Your primary number should stay synchronized with your main
              account phone field.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'web' ? spacing.lg : 54,
    paddingBottom: spacing.lg,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '800',
  },
  headerIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 36,
    gap: 16,
  },
  introCard: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 13,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introAccent: {
    position: 'absolute',
    left: 0,
    top: 15,
    bottom: 15,
    width: 4,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.primary,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  introText: {
    flex: 1,
  },
  introEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 5,
  },
  introTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 5,
  },
  introDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  formCard: {
    padding: 17,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 5,
  },
  formHeadingIcon: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  formHeadingText: {
    flex: 1,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 17,
    marginBottom: 9,
  },
  inputWrap: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 10,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    minWidth: 0,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 12,
    outlineStyle: 'none',
  } as any,
  labelOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  labelOptionActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  labelOptionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  labelOptionTextActive: {
    color: colors.black,
  },
  primaryButton: {
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    borderRadius: 14,
    backgroundColor: colors.secondary,
    marginTop: 22,
    paddingHorizontal: 15,
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.75,
  },
  disabledButton: {
    opacity: 0.55,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  listSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  stateText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 3,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  phoneCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 15,
  },
  phoneTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  phoneIcon: {
    width: 43,
    height: 43,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  phoneIconPrimary: {
    borderColor: colors.secondary,
  },
  phoneInfo: {
    flex: 1,
    minWidth: 0,
  },
  phoneLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  phoneNumber: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: radius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBadgeText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
  },
  phoneActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 13,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  deleteAction: {
    borderColor: '#5B3034',
  },
  deleteActionText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  editForm: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 3,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 9,
    marginTop: 16,
  },
  cancelButton: {
    paddingHorizontal: 15,
    minHeight: 42,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  smallPrimaryButton: {
    minHeight: 42,
    minWidth: 110,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: 12,
    backgroundColor: colors.secondary,
  },
  smallPrimaryButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 17,
  },
  retryText: {
    color: colors.secondary,
    fontWeight: '800',
    fontSize: 12,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 13,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
});
