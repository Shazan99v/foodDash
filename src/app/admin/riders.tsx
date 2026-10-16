import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { router } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

import {
  AdminRider,
  RiderFeedback,
  RiderFeedbackSummary,
  UpdateRiderData,
  banRider,
  getAllRiders,
  getRiderFeedback,
  unbanRider,
  updateRider,
} from '../../services/admin/adminRiderApi';
import {
  colors,
  radius,
  spacing,
} from '../../constants/theme';

const RiderManagementScreen = () => {
  const [riders, setRiders] = useState<AdminRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [selectedRider, setSelectedRider] =
    useState<AdminRider | null>(null);
  const [editVisible, setEditVisible] = useState(false);
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [banVisible, setBanVisible] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState<RiderFeedback[]>([]);
  const [feedbackSummary, setFeedbackSummary] =
    useState<RiderFeedbackSummary | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [editForm, setEditForm] = useState<UpdateRiderData>({
    name: '',
    phone: '',
    secondaryPhone: '',
    address: '',
    city: '',
    area: '',
    vehicleType: 'BIKE',
    vehicleNumber: '',
    drivingLicenseNumber: '',
  });

  const loadRiders = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getAllRiders();
        setRiders(data);
      } catch (error: any) {
        Toast.show({
          type: 'error',
          text1: 'Failed to load riders',
          text2:
            error?.response?.data?.message ||
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
    loadRiders();
  }, [loadRiders]);

  const filteredRiders = riders.filter((rider) => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return [
      rider.name,
      rider.email,
      rider.phone,
      rider.city,
      rider.area,
      rider.profile?.vehicleNumber,
      rider.application?.cnic,
    ]
      .filter(Boolean)
      .some((value) =>
        String(value).toLowerCase().includes(query)
      );
  });

  const activeCount = riders.filter(
    (rider) =>
      rider.status === 'ACTIVE' &&
      rider.profile?.isActive !== false
  ).length;

  const onlineCount = riders.filter(
    (rider) => rider.profile?.isOnline === true
  ).length;

  const bannedCount = riders.filter(
    (rider) =>
      rider.status === 'SUSPENDED' ||
      rider.profile?.isActive === false
  ).length;

  const openEdit = (rider: AdminRider) => {
    setSelectedRider(rider);

    setEditForm({
      name: rider.name || '',
      phone: rider.phone || '',
      secondaryPhone: rider.secondaryPhone || '',
      address: rider.address || '',
      city: rider.profile?.city || rider.city || '',
      area: rider.profile?.area || rider.area || '',
      vehicleType: rider.profile?.vehicleType || 'BIKE',
      vehicleNumber: rider.profile?.vehicleNumber || '',
      drivingLicenseNumber:
        rider.profile?.drivingLicenseNumber || '',
    });

    setEditVisible(true);
  };

  const handleEdit = async () => {
    if (!selectedRider) {
      return;
    }

    if (!editForm.name.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Name is required',
      });
      return;
    }

    if (!editForm.phone.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Phone is required',
      });
      return;
    }

    setActionLoading(true);

    try {
      const updated = await updateRider(
        selectedRider._id,
        editForm
      );

      setRiders((current) =>
        current.map((rider) =>
          rider._id === updated._id ? updated : rider
        )
      );

      setSelectedRider(updated);
      setEditVisible(false);

      Toast.show({
        type: 'success',
        text1: 'Rider updated',
        text2: 'Rider information was updated successfully.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Update failed',
        text2:
          error?.response?.data?.message ||
          'Unable to update rider.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openBanModal = (rider: AdminRider) => {
    setSelectedRider(rider);
    setBanVisible(true);
  };

  const handleBanToggle = async () => {
    if (!selectedRider) {
      return;
    }

    setActionLoading(true);

    try {
      const isBanned =
        selectedRider.status === 'SUSPENDED' ||
        selectedRider.profile?.isActive === false;

      if (isBanned) {
        await unbanRider(selectedRider._id);
      } else {
        await banRider(selectedRider._id);
      }

      await loadRiders();
      setBanVisible(false);

      Toast.show({
        type: 'success',
        text1: isBanned ? 'Rider unbanned' : 'Rider banned',
        text2: isBanned
          ? 'The rider can operate again.'
          : 'The rider has been suspended.',
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Action failed',
        text2:
          error?.response?.data?.message ||
          'Unable to update rider status.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openFeedback = async (rider: AdminRider) => {
    setSelectedRider(rider);
    setFeedbackVisible(true);
    setFeedbackLoading(true);
    setFeedback([]);
    setFeedbackSummary(null);

    try {
      const result = await getRiderFeedback(rider._id);
      setFeedback(result.feedback);
      setFeedbackSummary(result.summary);
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Feedback failed',
        text2:
          error?.response?.data?.message ||
          'Unable to load rider feedback.',
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Ionicons
          key={index}
          name={index < rating ? 'star' : 'star-outline'}
          size={16}
          color={colors.honey}
        />
      ))}
    </View>
  );

  const isSelectedRiderBanned =
    selectedRider?.status === 'SUSPENDED' ||
    selectedRider?.profile?.isActive === false;

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <View style={styles.loadingIcon}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingTitle}>Loading riders</Text>
          <Text style={styles.loadingText}>
            Fetching rider management data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/admin')}
          >
            <Ionicons
              name="arrow-back"
              size={18}
              color={colors.text}
            />
            <Text style={styles.backButtonText}>
              Admin Dashboard
            </Text>
          </Pressable>

          <Pressable
            style={styles.refreshButton}
            onPress={() => loadRiders(true)}
            accessibilityRole="button"
            accessibilityLabel="Refresh riders"
          >
            <Ionicons
              name="refresh"
              size={19}
              color={colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.titleBlock}>
          <View style={styles.eyebrow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrowText}>ADMINISTRATION</Text>
          </View>

          <Text style={styles.title}>Rider Management</Text>
          <Text style={styles.subtitle}>
            Manage rider accounts, performance and feedback.
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadRiders(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconOrange]}>
              <Ionicons
                name="people"
                size={19}
                color={colors.primary}
              />
            </View>
            <Text style={styles.statValue}>{riders.length}</Text>
            <Text style={styles.statLabel}>Total riders</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconLime]}>
              <Ionicons
                name="checkmark-circle"
                size={19}
                color={colors.secondary}
              />
            </View>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconHoney]}>
              <Ionicons
                name="radio"
                size={19}
                color={colors.honey}
              />
            </View>
            <Text style={styles.statValue}>{onlineCount}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconDanger]}>
              <Ionicons
                name="ban"
                size={19}
                color={colors.danger}
              />
            </View>
            <Text style={styles.statValue}>{bannedCount}</Text>
            <Text style={styles.statLabel}>Suspended</Text>
          </View>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.sectionTitle}>All riders</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredRiders.length} of {riders.length} riders
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.secondary}
            />
            <Text style={styles.countBadgeText}>
              {filteredRiders.length}
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={19}
            color={colors.textLight}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search name, phone, city, vehicle..."
            placeholderTextColor={colors.textLight}
            style={styles.searchInput}
            returnKeyType="search"
            autoCapitalize="none"
          />

          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              hitSlop={8}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={colors.textLight}
              />
            </Pressable>
          )}
        </View>

        {filteredRiders.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="people-outline"
                size={35}
                color={colors.primary}
              />
            </View>
            <Text style={styles.emptyTitle}>No riders found</Text>
            <Text style={styles.emptyText}>
              {search
                ? 'Try a different name, phone number, city or vehicle.'
                : 'Rider accounts will appear here when available.'}
            </Text>
            {search.length > 0 && (
              <Pressable
                style={styles.clearSearchButton}
                onPress={() => setSearch('')}
              >
                <Text style={styles.clearSearchText}>
                  Clear search
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          filteredRiders.map((rider) => {
            const banned =
              rider.status === 'SUSPENDED' ||
              rider.profile?.isActive === false;

            const isOnline = rider.profile?.isOnline === true;

            return (
              <View key={rider._id} style={styles.riderCard}>
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {rider.name?.charAt(0)?.toUpperCase() || 'R'}
                    </Text>
                  </View>

                  <View style={styles.identity}>
                    <Text style={styles.riderName}>
                      {rider.name}
                    </Text>
                    <Text style={styles.riderEmail}>
                      {rider.email}
                    </Text>

                    <View style={styles.statusRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: banned
                              ? colors.danger
                              : isOnline
                                ? colors.secondary
                                : colors.textLight,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          banned && styles.statusTextDanger,
                          !banned &&
                            isOnline &&
                            styles.statusTextOnline,
                        ]}
                      >
                        {banned
                          ? 'Banned'
                          : isOnline
                            ? 'Online'
                            : 'Offline'}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.badge,
                      banned
                        ? styles.badgeDanger
                        : styles.badgeSuccess,
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        {
                          color: banned
                            ? colors.danger
                            : colors.secondary,
                        },
                      ]}
                    >
                      {banned ? 'BANNED' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelRow}>
                      <Ionicons
                        name="call-outline"
                        size={13}
                        color={colors.textLight}
                      />
                      <Text style={styles.infoLabel}>Phone</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {rider.phone || 'Not provided'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelRow}>
                      <Ionicons
                        name="card-outline"
                        size={13}
                        color={colors.textLight}
                      />
                      <Text style={styles.infoLabel}>CNIC</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {rider.application?.cnic || 'Not provided'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelRow}>
                      <Ionicons
                        name="bicycle-outline"
                        size={13}
                        color={colors.textLight}
                      />
                      <Text style={styles.infoLabel}>Vehicle</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {rider.profile?.vehicleType || 'N/A'}{' '}
                      {rider.profile?.vehicleNumber || ''}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelRow}>
                      <Ionicons
                        name="location-outline"
                        size={13}
                        color={colors.textLight}
                      />
                      <Text style={styles.infoLabel}>Location</Text>
                    </View>
                    <Text style={styles.infoValue}>
                      {rider.profile?.city || rider.city || 'N/A'}
                      {rider.profile?.area || rider.area
                        ? `, ${rider.profile?.area || rider.area}`
                        : ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.performanceRow}>
                  <View style={styles.performanceItem}>
                    <Ionicons
                      name="star"
                      size={16}
                      color={colors.honey}
                    />
                    <Text style={styles.performanceValue}>
                      {Number(rider.profile?.rating || 0).toFixed(1)}
                    </Text>
                    <Text style={styles.performanceLabel}>
                      Rating
                    </Text>
                  </View>

                  <View style={styles.performanceItem}>
                    <Ionicons
                      name="bicycle"
                      size={16}
                      color={colors.primary}
                    />
                    <Text style={styles.performanceValue}>
                      {rider.profile?.totalDeliveries || 0}
                    </Text>
                    <Text style={styles.performanceLabel}>
                      Deliveries
                    </Text>
                  </View>

                  <View style={styles.performanceItem}>
                    <Ionicons
                      name="checkmark-done"
                      size={16}
                      color={colors.secondary}
                    />
                    <Text style={styles.performanceValue}>
                      {rider.profile?.completedDeliveries || 0}
                    </Text>
                    <Text style={styles.performanceLabel}>
                      Completed
                    </Text>
                  </View>

                  <View style={styles.performanceItem}>
                    <Ionicons
                      name="close-circle"
                      size={16}
                      color={colors.danger}
                    />
                    <Text style={styles.performanceValue}>
                      {rider.profile?.cancelledDeliveries || 0}
                    </Text>
                    <Text style={styles.performanceLabel}>
                      Cancelled
                    </Text>
                  </View>
                </View>

                <View style={styles.actionRow}>
                  <Pressable
                    style={[styles.actionButton, styles.feedbackButton]}
                    onPress={() => openFeedback(rider)}
                  >
                    <Ionicons
                      name="chatbubbles-outline"
                      size={17}
                      color={colors.secondary}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: colors.secondary },
                      ]}
                    >
                      Feedback
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[styles.actionButton, styles.editButton]}
                    onPress={() => openEdit(rider)}
                  >
                    <Ionicons
                      name="create-outline"
                      size={17}
                      color={colors.primary}
                    />
                    <Text
                      style={[
                        styles.actionText,
                        { color: colors.primary },
                      ]}
                    >
                      Edit
                    </Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.actionButton,
                      banned
                        ? styles.unbanButton
                        : styles.banButton,
                    ]}
                    onPress={() => openBanModal(rider)}
                  >
                    <Ionicons
                      name={
                        banned
                          ? 'lock-open-outline'
                          : 'ban-outline'
                      }
                      size={17}
                      color={
                        banned ? colors.secondary : colors.danger
                      }
                    />
                    <Text
                      style={[
                        styles.actionText,
                        {
                          color: banned
                            ? colors.secondary
                            : colors.danger,
                        },
                      ]}
                    >
                      {banned ? 'Unban' : 'Ban'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Edit rider */}
      <Modal
        visible={editVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>
                  RIDER ACCOUNT
                </Text>
                <Text style={styles.modalTitle}>Edit Rider</Text>
                <Text style={styles.modalSubtitle}>
                  Update rider information
                </Text>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setEditVisible(false)}
                hitSlop={8}
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
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.formContent}
            >
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                value={editForm.name}
                onChangeText={(value) =>
                  setEditForm((form) => ({
                    ...form,
                    name: value,
                  }))
                }
                style={styles.input}
                placeholder="Rider name"
                placeholderTextColor={colors.textLight}
              />

              <Text style={styles.fieldLabel}>Phone</Text>
              <TextInput
                value={editForm.phone}
                onChangeText={(value) =>
                  setEditForm((form) => ({
                    ...form,
                    phone: value,
                  }))
                }
                style={styles.input}
                placeholder="Phone number"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>
                Secondary Phone
              </Text>
              <TextInput
                value={editForm.secondaryPhone}
                onChangeText={(value) =>
                  setEditForm((form) => ({
                    ...form,
                    secondaryPhone: value,
                  }))
                }
                style={styles.input}
                placeholder="Secondary phone"
                placeholderTextColor={colors.textLight}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                value={editForm.address}
                onChangeText={(value) =>
                  setEditForm((form) => ({
                    ...form,
                    address: value,
                  }))
                }
                style={[styles.input, styles.multilineInput]}
                placeholder="Complete address"
                placeholderTextColor={colors.textLight}
                multiline
              />

              <View style={styles.formColumns}>
                <View style={styles.formColumn}>
                  <Text style={styles.fieldLabel}>City</Text>
                  <TextInput
                    value={editForm.city}
                    onChangeText={(value) =>
                      setEditForm((form) => ({
                        ...form,
                        city: value,
                      }))
                    }
                    style={styles.input}
                    placeholder="City"
                    placeholderTextColor={colors.textLight}
                  />
                </View>

                <View style={styles.formColumn}>
                  <Text style={styles.fieldLabel}>Area</Text>
                  <TextInput
                    value={editForm.area}
                    onChangeText={(value) =>
                      setEditForm((form) => ({
                        ...form,
                        area: value,
                      }))
                    }
                    style={styles.input}
                    placeholder="Area"
                    placeholderTextColor={colors.textLight}
                  />
                </View>
              </View>

              <Text style={styles.fieldLabel}>Vehicle Type</Text>
              <View style={styles.vehicleSelector}>
                <Pressable
                  style={[
                    styles.vehicleOption,
                    editForm.vehicleType === 'BIKE' &&
                      styles.vehicleOptionActive,
                  ]}
                  onPress={() =>
                    setEditForm((form) => ({
                      ...form,
                      vehicleType: 'BIKE',
                    }))
                  }
                >
                  <Ionicons
                    name="bicycle"
                    size={20}
                    color={
                      editForm.vehicleType === 'BIKE'
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      editForm.vehicleType === 'BIKE' &&
                        styles.vehicleTextActive,
                    ]}
                  >
                    Bike
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.vehicleOption,
                    editForm.vehicleType === 'CYCLE' &&
                      styles.vehicleOptionActive,
                  ]}
                  onPress={() =>
                    setEditForm((form) => ({
                      ...form,
                      vehicleType: 'CYCLE',
                    }))
                  }
                >
                  <Ionicons
                    name="walk"
                    size={20}
                    color={
                      editForm.vehicleType === 'CYCLE'
                        ? colors.primary
                        : colors.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.vehicleText,
                      editForm.vehicleType === 'CYCLE' &&
                        styles.vehicleTextActive,
                    ]}
                  >
                    Cycle
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.fieldLabel}>
                Vehicle Number
              </Text>
              <TextInput
                value={editForm.vehicleNumber}
                onChangeText={(value) =>
                  setEditForm((form) => ({
                    ...form,
                    vehicleNumber: value.toUpperCase(),
                  }))
                }
                style={styles.input}
                placeholder="Vehicle number"
                placeholderTextColor={colors.textLight}
                autoCapitalize="characters"
              />

              <Text style={styles.fieldLabel}>
                Driving License Number
              </Text>
              <TextInput
                value={editForm.drivingLicenseNumber}
                onChangeText={(value) =>
                  setEditForm((form) => ({
                    ...form,
                    drivingLicenseNumber: value,
                  }))
                }
                style={styles.input}
                placeholder="Driving license number"
                placeholderTextColor={colors.textLight}
              />

              <Pressable
                style={[
                  styles.primaryButton,
                  actionLoading && styles.disabledButton,
                ]}
                onPress={handleEdit}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <>
                    <Ionicons
                      name="save-outline"
                      size={19}
                      color={colors.black}
                    />
                    <Text style={styles.primaryButtonText}>
                      Save Changes
                    </Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ban / unban confirmation */}
      <Modal
        visible={banVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBanVisible(false)}
      >
        <View style={[styles.modalOverlay, styles.centeredOverlay]}>
          <View style={styles.confirmModal}>
            <View
              style={[
                styles.confirmIcon,
                isSelectedRiderBanned
                  ? styles.confirmIconSuccess
                  : styles.confirmIconDanger,
              ]}
            >
              <Ionicons
                name={
                  isSelectedRiderBanned
                    ? 'lock-open-outline'
                    : 'ban-outline'
                }
                size={28}
                color={
                  isSelectedRiderBanned
                    ? colors.secondary
                    : colors.danger
                }
              />
            </View>

            <Text style={styles.confirmTitle}>
              {isSelectedRiderBanned
                ? 'Unban this rider?'
                : 'Ban this rider?'}
            </Text>

            <Text style={styles.confirmText}>
              {isSelectedRiderBanned
                ? `${selectedRider?.name} will be allowed to operate again.`
                : `${selectedRider?.name} will be suspended and taken offline.`}
            </Text>

            <View style={styles.confirmActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setBanVisible(false)}
                disabled={actionLoading}
              >
                <Text style={styles.cancelButtonText}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.confirmButton,
                  {
                    backgroundColor: isSelectedRiderBanned
                      ? colors.secondary
                      : colors.danger,
                  },
                  actionLoading && styles.disabledButton,
                ]}
                onPress={handleBanToggle}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color={colors.black} />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {isSelectedRiderBanned
                      ? 'Unban Rider'
                      : 'Ban Rider'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rider feedback */}
      <Modal
        visible={feedbackVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFeedbackVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.feedbackModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeadingCopy}>
                <Text style={styles.modalEyebrow}>
                  PERFORMANCE & REVIEWS
                </Text>
                <Text style={styles.modalTitle}>
                  Rider Feedback
                </Text>
                <Text style={styles.modalSubtitle}>
                  {selectedRider?.name || 'Rider'}
                </Text>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setFeedbackVisible(false)}
                hitSlop={8}
              >
                <Ionicons
                  name="close"
                  size={22}
                  color={colors.text}
                />
              </Pressable>
            </View>

            {feedbackLoading ? (
              <View style={styles.feedbackLoading}>
                <ActivityIndicator
                  size="large"
                  color={colors.primary}
                />
                <Text style={styles.loadingText}>
                  Loading feedback...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.feedbackContent}
              >
                {feedbackSummary && (
                  <>
                    <View style={styles.ratingSummary}>
                      <View style={styles.averageRatingBox}>
                        <Text style={styles.averageRating}>
                          {feedbackSummary.averageRating.toFixed(1)}
                        </Text>
                        {renderStars(
                          Math.round(feedbackSummary.averageRating)
                        )}
                        <Text style={styles.reviewCount}>
                          {feedbackSummary.totalReviews} reviews
                        </Text>
                      </View>

                      <View style={styles.ratingBreakdown}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count =
                            feedbackSummary.ratingBreakdown[
                              star as 1 | 2 | 3 | 4 | 5
                            ] || 0;

                          const percentage =
                            feedbackSummary.totalReviews > 0
                              ? count / feedbackSummary.totalReviews
                              : 0;

                          return (
                            <View
                              key={star}
                              style={styles.breakdownRow}
                            >
                              <Text style={styles.breakdownStar}>
                                {star}
                              </Text>
                              <Ionicons
                                name="star"
                                size={12}
                                color={colors.honey}
                              />
                              <View style={styles.progressTrack}>
                                <View
                                  style={[
                                    styles.progressFill,
                                    {
                                      width: `${percentage * 100}%`,
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={styles.breakdownCount}>
                                {count}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    <View style={styles.behaviorSummary}>
                      <View style={styles.behaviorBox}>
                        <View style={styles.behaviorIconSuccess}>
                          <Ionicons
                            name="thumbs-up"
                            size={17}
                            color={colors.secondary}
                          />
                        </View>
                        <Text style={styles.behaviorValue}>
                          {feedbackSummary.positiveReviews}
                        </Text>
                        <Text style={styles.behaviorLabel}>
                          Positive
                        </Text>
                      </View>

                      <View style={styles.behaviorBox}>
                        <View style={styles.behaviorIconDanger}>
                          <Ionicons
                            name="thumbs-down"
                            size={17}
                            color={colors.danger}
                          />
                        </View>
                        <Text style={styles.behaviorValue}>
                          {feedbackSummary.negativeReviews}
                        </Text>
                        <Text style={styles.behaviorLabel}>
                          Negative
                        </Text>
                      </View>

                      <View style={styles.behaviorBox}>
                        <View style={styles.behaviorIconOrange}>
                          <Ionicons
                            name="chatbubble-ellipses"
                            size={17}
                            color={colors.primary}
                          />
                        </View>
                        <Text style={styles.behaviorValue}>
                          {feedbackSummary.totalReviews}
                        </Text>
                        <Text style={styles.behaviorLabel}>
                          Total
                        </Text>
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.feedbackSectionHeading}>
                  <Text style={styles.sectionTitle}>
                    Customer Feedback
                  </Text>
                  <Text style={styles.feedbackSectionCount}>
                    {feedback.length}
                  </Text>
                </View>

                {feedback.length === 0 ? (
                  <View style={styles.noFeedback}>
                    <View style={styles.emptyIcon}>
                      <Ionicons
                        name="chatbubbles-outline"
                        size={30}
                        color={colors.primary}
                      />
                    </View>
                    <Text style={styles.noFeedbackTitle}>
                      No feedback yet
                    </Text>
                    <Text style={styles.noFeedbackText}>
                      Customers have not submitted feedback for this
                      rider yet.
                    </Text>
                  </View>
                ) : (
                  feedback.map((item) => (
                    <View
                      key={item._id}
                      style={styles.feedbackCard}
                    >
                      <View style={styles.feedbackTop}>
                        <View style={styles.customerAvatar}>
                          <Text style={styles.avatarText}>
                            {item.customer?.name
                              ?.charAt(0)
                              ?.toUpperCase() || 'C'}
                          </Text>
                        </View>

                        <View style={styles.customerInfo}>
                          <Text style={styles.customerName}>
                            {item.customer?.name || 'Customer'}
                          </Text>
                          <Text style={styles.feedbackDate}>
                            {new Date(
                              item.createdAt
                            ).toLocaleDateString()}
                          </Text>
                        </View>

                        {renderStars(item.rating)}
                      </View>

                      {!!item.feedback && (
                        <Text style={styles.feedbackText}>
                          {item.feedback}
                        </Text>
                      )}

                      {!!item.behaviorTags?.length && (
                        <View style={styles.tagsRow}>
                          {item.behaviorTags.map((tag) => (
                            <View key={tag} style={styles.tag}>
                              <Text style={styles.tagText}>
                                {tag.replace(/_/g, ' ')}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      <View style={styles.orderInfo}>
                        <Ionicons
                          name="receipt-outline"
                          size={14}
                          color={colors.textLight}
                        />
                        <Text style={styles.orderText}>
                          Order #
                          {item.order?._id
                            ?.slice(-8)
                            .toUpperCase() || 'N/A'}
                        </Text>
                        <View style={styles.orderStatusBadge}>
                          <Text style={styles.orderStatus}>
                            {item.order?.status || 'N/A'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  titleBlock: {
    marginTop: spacing.xl,
  },

  eyebrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: spacing.sm,
  },

  eyebrowDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  eyebrowText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  backButton: {
    minHeight: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  backButtonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },

  title: {
    color: colors.text,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: -0.7,
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 42,
  },

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },

  loadingIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
  },

  loadingText: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
    fontSize: 13,
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xxl,
  },

  statCard: {
    flex: 1,
    minWidth: '22%',
    minHeight: 112,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  statIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  statIconOrange: {
    backgroundColor: 'rgba(255,107,26,0.12)',
  },

  statIconLime: {
    backgroundColor: 'rgba(198,245,74,0.10)',
  },

  statIconHoney: {
    backgroundColor: 'rgba(255,181,71,0.10)',
  },

  statIconDanger: {
    backgroundColor: 'rgba(255,98,104,0.10)',
  },

  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: spacing.sm,
  },

  statLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },

  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 4,
  },

  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.round,
    backgroundColor: 'rgba(198,245,74,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(198,245,74,0.18)',
  },

  countBadgeText: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: '800',
  },

  searchBox: {
    minHeight: 51,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    marginHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    outlineStyle: 'none',
  } as any,

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 55,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
  },

  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: 'rgba(255,107,26,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginTop: spacing.lg,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  clearSearchButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },

  clearSearchText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '800',
  },

  riderCard: {
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
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: 'rgba(255,107,26,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '900',
  },

  identity: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.md,
  },

  riderName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  riderEmail: {
    color: colors.textLight,
    fontSize: 11,
    marginTop: 3,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusText: {
    color: colors.textLight,
    fontSize: 11,
    fontWeight: '600',
  },

  statusTextOnline: {
    color: colors.secondary,
  },

  statusTextDanger: {
    color: colors.danger,
  },

  badge: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginLeft: spacing.sm,
  },

  badgeSuccess: {
    backgroundColor: 'rgba(198,245,74,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(198,245,74,0.18)',
  },

  badgeDanger: {
    backgroundColor: 'rgba(255,98,104,0.09)',
    borderWidth: 1,
    borderColor: 'rgba(255,98,104,0.2)',
  },

  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },

  infoItem: {
    width: '48%',
    flexGrow: 1,
    minWidth: '42%',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  infoLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },

  infoLabel: {
    color: colors.textLight,
    fontSize: 10,
    fontWeight: '600',
  },

  infoValue: {
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },

  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },

  performanceItem: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },

  performanceValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
    marginTop: 3,
  },

  performanceLabel: {
    color: colors.textLight,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  actionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 4,
  },

  feedbackButton: {
    backgroundColor: 'rgba(198,245,74,0.05)',
    borderColor: 'rgba(198,245,74,0.18)',
  },

  editButton: {
    backgroundColor: 'rgba(255,107,26,0.07)',
    borderColor: 'rgba(255,107,26,0.25)',
  },

  banButton: {
    backgroundColor: 'rgba(255,98,104,0.06)',
    borderColor: 'rgba(255,98,104,0.22)',
  },

  unbanButton: {
    backgroundColor: 'rgba(198,245,74,0.05)',
    borderColor: 'rgba(198,245,74,0.18)',
  },

  actionText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },

  centeredOverlay: {
    justifyContent: 'center',
    padding: spacing.lg,
  },

  modal: {
    width: '100%',
    maxHeight: '92%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },

  feedbackModal: {
    width: '100%',
    maxHeight: '94%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },

  modalHeadingCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },

  modalEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.3,
    marginBottom: 6,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalTitle: {
    color: colors.text,
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 5,
  },

  formContent: {
    paddingBottom: spacing.md,
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: spacing.md,
  },

  input: {
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: 14,
  },

  multilineInput: {
    minHeight: 82,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },

  formColumns: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  formColumn: {
    flex: 1,
    minWidth: 0,
  },

  vehicleSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
  },

  vehicleOption: {
    flex: 1,
    height: 49,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  vehicleOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(255,107,26,0.09)',
  },

  vehicleText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },

  vehicleTextActive: {
    color: colors.primary,
  },

  primaryButton: {
    minHeight: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },

  disabledButton: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: colors.black,
    fontSize: 14,
    fontWeight: '900',
  },

  confirmModal: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: colors.surface,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },

  confirmIcon: {
    width: 62,
    height: 62,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },

  confirmIconSuccess: {
    backgroundColor: 'rgba(198,245,74,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(198,245,74,0.18)',
  },

  confirmIconDanger: {
    backgroundColor: 'rgba(255,98,104,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,98,104,0.18)',
  },

  confirmTitle: {
    color: colors.text,
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
  },

  confirmText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  confirmActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },

  cancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelButtonText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },

  confirmButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  confirmButtonText: {
    color: colors.black,
    fontWeight: '900',
    fontSize: 13,
  },

  feedbackLoading: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 75,
  },

  feedbackContent: {
    paddingBottom: spacing.md,
  },

  ratingSummary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    flexDirection: 'row',
    marginBottom: spacing.md,
  },

  averageRatingBox: {
    width: '38%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: spacing.sm,
  },

  averageRating: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '900',
  },

  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },

  reviewCount: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },

  ratingBreakdown: {
    flex: 1,
    paddingLeft: spacing.md,
    justifyContent: 'center',
    gap: 6,
  },

  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  breakdownStar: {
    width: 10,
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'right',
  },

  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.round,
    overflow: 'hidden',
    marginHorizontal: 4,
  },

  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: radius.round,
  },

  breakdownCount: {
    width: 20,
    color: colors.textLight,
    fontSize: 10,
    textAlign: 'right',
  },

  behaviorSummary: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },

  behaviorBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },

  behaviorIconSuccess: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: 'rgba(198,245,74,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  behaviorIconDanger: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: 'rgba(255,98,104,0.09)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  behaviorIconOrange: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: 'rgba(255,107,26,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  behaviorValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing.sm,
  },

  behaviorLabel: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 3,
  },

  feedbackSectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  feedbackSectionCount: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.round,
    overflow: 'hidden',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  noFeedback: {
    alignItems: 'center',
    paddingVertical: 38,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },

  noFeedbackTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.md,
  },

  noFeedbackText: {
    color: colors.textLight,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: spacing.sm,
  },

  feedbackCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  feedbackTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  customerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  customerInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: spacing.sm,
  },

  customerName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '800',
  },

  feedbackDate: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 3,
  },

  feedbackText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.md,
  },

  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.md,
  },

  tag: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  tagText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },

  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },

  orderText: {
    color: colors.textLight,
    fontSize: 10,
    flex: 1,
  },

  orderStatusBadge: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  orderStatus: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '900',
  },
});

export default RiderManagementScreen;
