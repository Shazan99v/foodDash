import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {
  getPendingBusinessApplications,
  approveBusinessApplication,
  rejectBusinessApplication,
} from '../../services/admin/adminApi';

import { colors, radius, spacing } from '../../constants/theme';

type BusinessApplication = {
  _id: string;
  ownerName?: string;
  restaurantName?: string;
  ownerMobileNumber?: string;
  completeAddress?: string;
  city?: string;
  area?: string;
  status?: string;
  createdAt?: string;
  rejectionReason?: string;
  user?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export default function AdminBusinessesScreen() {
  const [applications, setApplications] = useState<BusinessApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingApplication, setRejectingApplication] =
    useState<BusinessApplication | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const loadApplications = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await getPendingBusinessApplications();
      const data = response as unknown;
      let applicationList: BusinessApplication[] = [];

      if (Array.isArray(data)) {
        applicationList = data as BusinessApplication[];
      } else if (
        data &&
        typeof data === 'object' &&
        Array.isArray(
          (data as { applications?: unknown }).applications
        )
      ) {
        applicationList = (
          data as { applications: BusinessApplication[] }
        ).applications;
      }

      setApplications(applicationList);
    } catch (error: any) {
      console.error('Load business applications error:', error);
      setApplications([]);

      Toast.show({
        type: 'error',
        text1: 'Could not load applications',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong.',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleApprove = async (application: BusinessApplication) => {
    if (processingId) return;

    try {
      setProcessingId(application._id);
      await approveBusinessApplication(application._id);

      setApplications((current) =>
        current.filter((item) => item._id !== application._id)
      );

      Toast.show({
        type: 'success',
        text1: 'Business approved',
        text2: 'Restaurant created and business account activated.',
      });
    } catch (error: any) {
      console.error('Approve business error:', error);

      Toast.show({
        type: 'error',
        text1: 'Approval failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (application: BusinessApplication) => {
    if (processingId) return;
    setRejectionReason('');
    setRejectingApplication(application);
  };

  const closeRejectModal = () => {
    if (processingId) return;
    setRejectingApplication(null);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectingApplication || processingId) return;

    const reason = rejectionReason.trim();

    if (!reason) {
      Toast.show({
        type: 'error',
        text1: 'Reason required',
        text2: 'Please enter a reason for rejecting this application.',
      });
      return;
    }

    try {
      setProcessingId(rejectingApplication._id);

      await rejectBusinessApplication(
        rejectingApplication._id,
        reason
      );

      setApplications((current) =>
        current.filter(
          (item) => item._id !== rejectingApplication._id
        )
      );

      setRejectingApplication(null);
      setRejectionReason('');

      Toast.show({
        type: 'success',
        text1: 'Business rejected',
        text2: 'The application has been rejected successfully.',
      });
    } catch (error: any) {
      console.error('Reject business error:', error);

      Toast.show({
        type: 'error',
        text1: 'Rejection failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Something went wrong.',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>
          Loading business applications...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={() => router.replace('/admin')}
          accessibilityRole="button"
          accessibilityLabel="Back to admin dashboard"
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>MARKETPLACE MANAGEMENT</Text>
          <Text style={styles.title}>Business Applications</Text>
          <Text style={styles.subtitle}>
            Review and approve restaurant owners
          </Text>
        </View>

        <View style={styles.countBadge}>
          <Text style={styles.countText}>{applications.length}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => loadApplications(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryIcon}>
            <Ionicons
              name="storefront-outline"
              size={22}
              color={colors.primary}
            />
          </View>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>
              Pending review
            </Text>
            <Text style={styles.summaryDescription}>
              Approve legitimate businesses or provide a clear rejection reason.
            </Text>
          </View>
        </View>

        {applications.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-circle-outline"
                size={36}
                color={colors.secondary}
              />
            </View>

            <Text style={styles.emptyTitle}>
              All caught up!
            </Text>
            <Text style={styles.emptyText}>
              There are currently no business applications waiting for review.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.refreshButton,
                pressed && styles.pressed,
              ]}
              onPress={() => loadApplications(true)}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="refresh-outline"
                    size={17}
                    color={colors.text}
                  />
                  <Text style={styles.refreshButtonText}>
                    Check again
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        ) : (
          applications.map((application) => {
            const isProcessing = processingId === application._id;

            const location =
              [application.area, application.city]
                .filter(Boolean)
                .join(', ') ||
              application.completeAddress ||
              'Not provided';

            return (
              <View
                key={application._id}
                style={styles.applicationCard}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.restaurantIcon}>
                    <Ionicons
                      name="restaurant-outline"
                      size={25}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.restaurantInfo}>
                    <Text
                      style={styles.restaurantName}
                      numberOfLines={2}
                    >
                      {application.restaurantName || 'Restaurant Name'}
                    </Text>

                    <Text style={styles.ownerName} numberOfLines={1}>
                      {application.ownerName ||
                        application.user?.name ||
                        'Business Owner'}
                    </Text>
                  </View>

                  <View style={styles.pendingBadge}>
                    <View style={styles.pendingDot} />
                    <Text style={styles.pendingText}>PENDING</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.details}>
                  <DetailRow
                    icon="mail-outline"
                    label="Email"
                    value={application.user?.email || 'Not provided'}
                  />
                  <DetailRow
                    icon="call-outline"
                    label="Phone"
                    value={
                      application.ownerMobileNumber ||
                      application.user?.phone ||
                      'Not provided'
                    }
                  />
                  <DetailRow
                    icon="location-outline"
                    label="Location"
                    value={location}
                  />
                  <DetailRow
                    icon="navigate-outline"
                    label="Full address"
                    value={application.completeAddress || 'Not provided'}
                  />
                  <DetailRow
                    icon="calendar-outline"
                    label="Application date"
                    value={
                      application.createdAt
                        ? new Date(
                            application.createdAt
                          ).toLocaleDateString()
                        : 'Unknown'
                    }
                  />
                </View>

                <View style={styles.actions}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.rejectButton,
                      isProcessing && styles.disabledButton,
                      pressed && !isProcessing && styles.pressed,
                    ]}
                    disabled={isProcessing || Boolean(processingId)}
                    onPress={() => openRejectModal(application)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={colors.danger}
                    />
                    <Text style={styles.rejectText}>Reject</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.approveButton,
                      isProcessing && styles.disabledButton,
                      pressed && !isProcessing && styles.pressed,
                    ]}
                    disabled={isProcessing || Boolean(processingId)}
                    onPress={() => handleApprove(application)}
                  >
                    {isProcessing ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.black}
                      />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={19}
                          color={colors.black}
                        />
                        <Text style={styles.approveText}>
                          Approve Business
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={Boolean(rejectingApplication)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={closeRejectModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="alert-circle-outline"
                size={27}
                color={colors.danger}
              />
            </View>

            <Text style={styles.modalTitle}>Reject Business</Text>
            <Text style={styles.modalSubtitle}>
              Provide a clear reason so the applicant understands why their
              application was rejected.
            </Text>

            {rejectingApplication?.restaurantName ? (
              <View style={styles.modalBusiness}>
                <Ionicons
                  name="storefront-outline"
                  size={17}
                  color={colors.primary}
                />
                <Text style={styles.modalBusinessName}>
                  {rejectingApplication.restaurantName}
                </Text>
              </View>
            ) : null}

            <Text style={styles.fieldLabel}>Rejection reason</Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Example: Incomplete business information"
              placeholderTextColor={colors.textLight}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={styles.reasonInput}
              editable={!processingId}
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  pressed && !processingId && styles.pressed,
                ]}
                disabled={Boolean(processingId)}
                onPress={closeRejectModal}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.confirmRejectButton,
                  processingId && styles.disabledButton,
                  pressed && !processingId && styles.pressed,
                ]}
                disabled={Boolean(processingId)}
                onPress={handleReject}
              >
                {processingId ? (
                  <ActivityIndicator
                    size="small"
                    color={colors.text}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="close-circle-outline"
                      size={18}
                      color={colors.text}
                    />
                    <Text style={styles.confirmRejectText}>
                      Reject Application
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={16} color={colors.textLight} />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
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

  headerText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 5,
  },

  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17,
  },

  countBadge: {
    minWidth: 38,
    height: 36,
    paddingHorizontal: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  countText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },

  content: {
    padding: spacing.xl,
    paddingBottom: 44,
  },

  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },

  summaryIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  summaryText: {
    flex: 1,
  },

  summaryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },

  summaryDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  applicationCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  restaurantIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restaurantInfo: {
    flex: 1,
    marginHorizontal: spacing.md,
  },

  restaurantName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },

  ownerName: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 181, 71, 0.10)',
    borderWidth: 1,
    borderColor: colors.honey,
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },

  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.honey,
  },

  pendingText: {
    color: colors.honey,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },

  details: {
    gap: spacing.md,
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },

  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  detailContent: {
    flex: 1,
    paddingTop: 1,
  },

  detailLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },

  detailValue: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  rejectButton: {
    flex: 0.8,
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 98, 104, 0.07)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  rejectText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '800',
  },

  approveButton: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: spacing.sm,
  },

  approveText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
  },

  disabledButton: {
    opacity: 0.55,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.985 }],
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.sm,
  },

  emptyIcon: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
    marginTop: spacing.lg,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  refreshButton: {
    minHeight: 43,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },

  refreshButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },

  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xl,
  },

  modalIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },

  modalBusiness: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  modalBusinessName: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },

  reasonInput: {
    minHeight: 120,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },

  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  cancelButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },

  confirmRejectButton: {
    flex: 1.5,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
  },

  confirmRejectText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },
});
