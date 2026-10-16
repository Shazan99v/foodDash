import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
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
  approveRiderApplication,
  getPendingRiderApplications,
  rejectRiderApplication,
  RiderApplication,
} from '../../services/admin/adminApi';

import { useAuthStore } from '../../stores/authStore';
import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

export default function RiderApplicationsScreen() {
  const user = useAuthStore((state) => state.user);

  const [applications, setApplications] = useState<
    RiderApplication[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState<RiderApplication | null>(null);

  const [rejectingApplication, setRejectingApplication] =
    useState<RiderApplication | null>(null);

  const [rejectionReason, setRejectionReason] =
    useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const normalizeApplications = (
    response: any
  ): RiderApplication[] => {
    if (Array.isArray(response)) {
      return response;
    }

    if (response && Array.isArray(response.applications)) {
      return response.applications;
    }

    if (response && Array.isArray(response.data)) {
      return response.data;
    }

    if (
      response &&
      response.data &&
      Array.isArray(response.data.applications)
    ) {
      return response.data.applications;
    }

    return [];
  };

  const loadApplications = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const response = await getPendingRiderApplications();
        setApplications(normalizeApplications(response));
      } catch (error: any) {
        console.error(
          'Failed to load rider applications:',
          error
        );

        setApplications([]);

        Toast.show({
          type: 'error',
          text1: 'Unable to load applications',
          text2:
            error?.response?.data?.message ||
            error?.message ||
            'Please try again.',
        });
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      router.replace('/');
      return;
    }

    loadApplications();
  }, [user?.role, loadApplications]);

  const handleApprove = async (
    application: RiderApplication
  ) => {
    try {
      setActionLoading(true);

      await approveRiderApplication(application._id);

      Toast.show({
        type: 'success',
        text1: 'Rider approved',
        text2: 'The rider account is now active.',
      });

      setSelectedApplication(null);
      await loadApplications(true);
    } catch (error: any) {
      console.error('Failed to approve rider:', error);

      Toast.show({
        type: 'error',
        text1: 'Approval failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openRejectModal = (
    application: RiderApplication
  ) => {
    setSelectedApplication(null);
    setRejectionReason('');
    setRejectingApplication(application);
  };

  const closeRejectModal = () => {
    if (actionLoading) {
      return;
    }

    setRejectingApplication(null);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectingApplication) {
      return;
    }

    const reason = rejectionReason.trim();

    if (!reason) {
      Toast.show({
        type: 'error',
        text1: 'Reason required',
        text2:
          'Please write a reason before rejecting the application.',
      });
      return;
    }

    try {
      setActionLoading(true);

      await rejectRiderApplication(
        rejectingApplication._id,
        reason
      );

      Toast.show({
        type: 'success',
        text1: 'Rider application rejected',
        text2: 'The rejection reason has been saved.',
      });

      setRejectingApplication(null);
      setRejectionReason('');

      await loadApplications(true);
    } catch (error: any) {
      console.error('Failed to reject rider:', error);

      Toast.show({
        type: 'error',
        text1: 'Rejection failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Please try again.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (date?: string) => {
    if (!date) {
      return '—';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return '—';
    }

    return parsedDate.toLocaleString();
  };

  const getApplicationName = (
    application: RiderApplication
  ) => {
    return (
      application.name ||
      application.user?.name ||
      'Unknown Rider'
    );
  };

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/admin')}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={colors.text}
            />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ADMIN PANEL</Text>

            <Text style={styles.title}>
              Rider Applications
            </Text>

            <Text style={styles.subtitle}>
              Review and manage pending rider registrations.
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>
              {applications.length}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator
              size="large"
              color={colors.primary}
            />
            <Text style={styles.loadingText}>
              Loading rider applications...
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadApplications(true)}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Ionicons
                  name="bicycle"
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={styles.summaryText}>
                <Text style={styles.summaryTitle}>
                  Pending Reviews
                </Text>

                <Text style={styles.summaryDescription}>
                  These riders are waiting for admin approval
                  before they can start working.
                </Text>
              </View>
            </View>

            {applications.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={42}
                    color={colors.secondary}
                  />
                </View>

                <Text style={styles.emptyTitle}>
                  All caught up
                </Text>

                <Text style={styles.emptyDescription}>
                  There are no pending rider applications right
                  now.
                </Text>
              </View>
            ) : (
              applications.map((application) => (
                <View
                  key={application._id}
                  style={styles.applicationCard}
                >
                  <View style={styles.cardTop}>
                    <View style={styles.avatar}>
                      <Ionicons
                        name="person"
                        size={23}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.applicantInfo}>
                      <Text
                        style={styles.applicantName}
                        numberOfLines={1}
                      >
                        {getApplicationName(application)}
                      </Text>

                      <Text
                        style={styles.applicantEmail}
                        numberOfLines={1}
                      >
                        {application.email ||
                          application.user?.email ||
                          'No email'}
                      </Text>
                    </View>

                    <View style={styles.pendingBadge}>
                      <View style={styles.pendingDot} />
                      <Text style={styles.pendingText}>
                        PENDING
                      </Text>
                    </View>
                  </View>

                  <View style={styles.quickGrid}>
                    <InfoItem
                      icon="call-outline"
                      label="Mobile"
                      value={
                        application.mobileNumber ||
                        application.user?.phone ||
                        '—'
                      }
                    />

                    <InfoItem
                      icon="bicycle-outline"
                      label="Vehicle"
                      value={application.vehicleType || '—'}
                    />

                    <InfoItem
                      icon="card-outline"
                      label="CNIC"
                      value={application.cnic || '—'}
                    />

                    <InfoItem
                      icon="location-outline"
                      label="Area"
                      value={
                        [
                          application.area,
                          application.city,
                        ]
                          .filter(Boolean)
                          .join(', ') || '—'
                      }
                    />
                  </View>

                  <View style={styles.dateRow}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={colors.textLight}
                    />

                    <Text style={styles.dateText}>
                      Applied {formatDate(application.createdAt)}
                    </Text>
                  </View>

                  <View style={styles.actionRow}>
                    <Pressable
                      style={styles.detailsButton}
                      onPress={() =>
                        setSelectedApplication(application)
                      }
                    >
                      <Ionicons
                        name="eye-outline"
                        size={18}
                        color={colors.text}
                      />
                      <Text style={styles.detailsButtonText}>
                        View Details
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.approveButton,
                        actionLoading && styles.disabledButton,
                      ]}
                      disabled={actionLoading}
                      onPress={() => handleApprove(application)}
                    >
                      <Ionicons
                        name="checkmark"
                        size={18}
                        color={colors.black}
                      />
                      <Text style={styles.approveButtonText}>
                        Approve
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.rejectButton,
                        actionLoading && styles.disabledButton,
                      ]}
                      disabled={actionLoading}
                      onPress={() => openRejectModal(application)}
                    >
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.danger}
                      />
                      <Text style={styles.rejectButtonText}>
                        Reject
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}

        {/* Rider details modal */}
        <Modal
          visible={selectedApplication !== null}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedApplication(null)}
        >
          {selectedApplication && (
            <View style={styles.modalOverlay}>
              <View style={styles.detailsModal}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalEyebrow}>
                      RIDER APPLICATION
                    </Text>

                    <Text style={styles.modalTitle}>
                      Applicant Details
                    </Text>
                  </View>

                  <Pressable
                    style={styles.modalClose}
                    onPress={() => setSelectedApplication(null)}
                  >
                    <Ionicons
                      name="close"
                      size={22}
                      color={colors.text}
                    />
                  </Pressable>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalContent}
                >
                  {selectedApplication.vehiclePhoto ? (
                    <View style={styles.vehiclePhotoWrapper}>
                      <Image
                        source={{
                          uri: selectedApplication.vehiclePhoto,
                        }}
                        style={styles.vehiclePhoto}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}

                  <DetailSection title="Personal Information">
                    <DetailRow
                      label="Full Name"
                      value={selectedApplication.name}
                    />
                    <DetailRow
                      label="Father Name"
                      value={selectedApplication.fatherName}
                    />
                    <DetailRow
                      label="Mobile Number"
                      value={selectedApplication.mobileNumber}
                    />
                    <DetailRow
                      label="Father Mobile"
                      value={selectedApplication.fatherMobileNumber}
                    />
                    <DetailRow
                      label="Email"
                      value={selectedApplication.email}
                    />
                    <DetailRow
                      label="CNIC"
                      value={selectedApplication.cnic}
                    />
                  </DetailSection>

                  <DetailSection title="Vehicle & License">
                    <DetailRow
                      label="Vehicle Type"
                      value={selectedApplication.vehicleType}
                    />
                    <DetailRow
                      label="Vehicle Number"
                      value={selectedApplication.vehicleNumber}
                    />
                    <DetailRow
                      label="Driving License"
                      value={
                        selectedApplication.drivingLicenseNumber
                      }
                    />
                  </DetailSection>

                  <DetailSection title="Location">
                    <DetailRow
                      label="City"
                      value={selectedApplication.city}
                    />
                    <DetailRow
                      label="Area"
                      value={selectedApplication.area}
                    />
                    <DetailRow
                      label="Complete Address"
                      value={selectedApplication.completeAddress}
                    />
                  </DetailSection>

                  <DetailSection title="Work Information">
                    <DetailRow
                      label="Emergency Contact"
                      value={selectedApplication.emergencyContact}
                    />
                    <DetailRow
                      label="Daily Working Hours"
                      value={
                        selectedApplication.dailyWorkingHours
                          ? `${selectedApplication.dailyWorkingHours} hours`
                          : '—'
                      }
                    />
                  </DetailSection>

                  <DetailSection title="Application">
                    <DetailRow
                      label="Status"
                      value={
                        selectedApplication.status || 'PENDING'
                      }
                    />
                    <DetailRow
                      label="Submitted"
                      value={formatDate(
                        selectedApplication.createdAt
                      )}
                    />
                  </DetailSection>

                  <View style={styles.modalActionRow}>
                    <Pressable
                      style={styles.modalRejectButton}
                      disabled={actionLoading}
                      onPress={() =>
                        openRejectModal(selectedApplication)
                      }
                    >
                      <Ionicons
                        name="close"
                        size={19}
                        color={colors.danger}
                      />
                      <Text style={styles.modalRejectText}>
                        Reject
                      </Text>
                    </Pressable>

                    <Pressable
                      style={[
                        styles.modalApproveButton,
                        actionLoading && styles.disabledButton,
                      ]}
                      disabled={actionLoading}
                      onPress={() =>
                        handleApprove(selectedApplication)
                      }
                    >
                      {actionLoading ? (
                        <ActivityIndicator
                          size="small"
                          color={colors.black}
                        />
                      ) : (
                        <>
                          <Ionicons
                            name="checkmark"
                            size={19}
                            color={colors.black}
                          />
                          <Text style={styles.modalApproveText}>
                            Approve Rider
                          </Text>
                        </>
                      )}
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </View>
          )}
        </Modal>

        {/* Rejection reason modal */}
        <Modal
          visible={rejectingApplication !== null}
          transparent
          animationType="fade"
          onRequestClose={closeRejectModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.rejectModal}>
              <View style={styles.rejectIcon}>
                <Ionicons
                  name="close-circle-outline"
                  size={30}
                  color={colors.danger}
                />
              </View>

              <Text style={styles.rejectTitle}>
                Reject Application
              </Text>

              <Text style={styles.rejectDescription}>
                Write a clear reason for rejecting{' '}
                {rejectingApplication
                  ? getApplicationName(rejectingApplication)
                  : 'this rider'}
                . The applicant will be able to see this reason.
              </Text>

              <TextInput
                value={rejectionReason}
                onChangeText={setRejectionReason}
                placeholder="Enter rejection reason..."
                placeholderTextColor={colors.textLight}
                multiline
                textAlignVertical="top"
                editable={!actionLoading}
                style={styles.reasonInput}
              />

              <View style={styles.rejectModalActions}>
                <Pressable
                  style={styles.cancelButton}
                  disabled={actionLoading}
                  onPress={closeRejectModal}
                >
                  <Text style={styles.cancelText}>
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.confirmRejectButton,
                    actionLoading && styles.disabledButton,
                  ]}
                  disabled={actionLoading}
                  onPress={handleReject}
                >
                  {actionLoading ? (
                    <ActivityIndicator
                      size="small"
                      color={colors.text}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="close"
                        size={18}
                        color={colors.text}
                      />
                      <Text style={styles.confirmRejectText}>
                        Reject Rider
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoItem}>
      <Ionicons
        name={icon}
        size={16}
        color={colors.primary}
      />

      <View style={styles.infoItemText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.detailSection}>
      <Text style={styles.detailSectionTitle}>
        {title}
      </Text>
      <View style={styles.detailSectionCard}>
        {children}
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>
        {value || '—'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 3,
  },
  title: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },
  countBadge: {
    minWidth: 38,
    height: 38,
    paddingHorizontal: 9,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  countText: {
    color: colors.black,
    fontSize: 15,
    fontWeight: '900',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    color: colors.text,
    fontSize: 15,
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
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  applicantInfo: {
    flex: 1,
    minWidth: 0,
  },
  applicantName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  applicantEmail: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 26, 0.13)',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },
  pendingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginRight: 5,
  },
  pendingText: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.lg,
    gap: 10,
  },
  infoItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: 10,
  },
  infoItemText: {
    flex: 1,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  infoLabel: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 13,
  },
  dateText: {
    color: colors.textLight,
    fontSize: 11,
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 15,
    gap: 8,
  },
  detailsButton: {
    flex: 1.25,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  detailsButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  approveButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  approveButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },
  rejectButton: {
    flex: 0.9,
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.30)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rejectButtonText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },
  disabledButton: {
    opacity: 0.55,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.md,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 35,
    marginTop: 4,
  },
  emptyIcon: {
    width: 74,
    height: 74,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.76)',
    justifyContent: 'flex-end',
  },
  detailsModal: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: 18,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalEyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 3,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    padding: 18,
    paddingBottom: 35,
  },
  vehiclePhotoWrapper: {
    width: '100%',
    height: 190,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    marginBottom: 18,
  },
  vehiclePhoto: {
    width: '100%',
    height: '100%',
  },
  detailSection: {
    marginBottom: 18,
  },
  detailSectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  detailSectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
    marginTop: 3,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 3,
  },
  modalRejectButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 98, 104, 0.30)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  modalRejectText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '900',
  },
  modalApproveButton: {
    flex: 1.4,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  modalApproveText: {
    color: colors.black,
    fontSize: 13,
    fontWeight: '900',
  },
  rejectModal: {
    width: '92%',
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  rejectIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255, 98, 104, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  rejectTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  rejectDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
    marginBottom: 15,
  },
  reasonInput: {
    minHeight: 125,
    maxHeight: 200,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 13,
    lineHeight: 19,
  },
  rejectModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
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
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  confirmRejectButton: {
    flex: 1.35,
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmRejectText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
});
