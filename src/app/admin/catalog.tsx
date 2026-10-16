import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';

import {
  AdminCategory,
  AdminMenuItem,
  AdminRestaurant,
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  getAdminRestaurants,
  getRestaurantCategories,
  getRestaurantMenuItems,
  updateCategory,
  updateMenuItem,
} from '../../services/admin/adminCatalogApi';

import { uploadRestaurantImage } from '../../services/restaurantImageUpload';
import { colors, radius, spacing } from '../../constants/theme';

export default function AdminCatalogScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 760;

  const [restaurants, setRestaurants] = useState<AdminRestaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<AdminRestaurant | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [items, setItems] = useState<AdminMenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [restaurantLoading, setRestaurantLoading] = useState(false);

  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemCategory, setItemCategory] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDiscountedPrice, setItemDiscountedPrice] = useState('');
  const [itemPreparationTime, setItemPreparationTime] = useState('20');
  const [itemSortOrder, setItemSortOrder] = useState('0');
  const [itemIsAvailable, setItemIsAvailable] = useState(true);
  const [itemIsFeatured, setItemIsFeatured] = useState(false);

  const [itemImage, setItemImage] = useState<string | null>(null);
  const [itemImagePreview, setItemImagePreview] = useState<string | null>(null);
  const [uploadingItemImage, setUploadingItemImage] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  const loadRestaurants = useCallback(async () => {
    try {
      const data = await getAdminRestaurants();
      setRestaurants(data);

      if (data.length === 0) {
        setSelectedRestaurant(null);
        return;
      }

      setSelectedRestaurant((current) => {
        if (current && data.some((restaurant) => restaurant._id === current._id)) {
          return current;
        }

        return data[0];
      });
    } catch (error: any) {
      console.error('Load admin restaurants error:', error);

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load restaurants.',
      });
    }
  }, []);

  const loadCatalog = useCallback(async () => {
    if (!selectedRestaurant) {
      setCategories([]);
      setItems([]);
      setLoading(false);
      setRestaurantLoading(false);
      return;
    }

    try {
      setRestaurantLoading(true);

      const [categoryData, itemData] = await Promise.all([
        getRestaurantCategories(selectedRestaurant._id),
        getRestaurantMenuItems(selectedRestaurant._id),
      ]);

      setCategories(categoryData);
      setItems(itemData);
    } catch (error: any) {
      console.error('Load admin catalog error:', error);

      Toast.show({
        type: 'error',
        text1: 'Catalog error',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to load catalog.',
      });
    } finally {
      setRestaurantLoading(false);
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedRestaurant]);

  useFocusEffect(
    useCallback(() => {
      loadRestaurants();
    }, [loadRestaurants]),
  );

  useFocusEffect(
    useCallback(() => {
      loadCatalog();
    }, [loadCatalog]),
  );

  const refreshCatalog = async () => {
    if (!selectedRestaurant) return;

    try {
      setRestaurantLoading(true);

      const [categoryData, itemData] = await Promise.all([
        getRestaurantCategories(selectedRestaurant._id),
        getRestaurantMenuItems(selectedRestaurant._id),
      ]);

      setCategories(categoryData);
      setItems(itemData);
    } catch (error: any) {
      console.error('Refresh catalog error:', error);

      Toast.show({
        type: 'error',
        text1: 'Refresh failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to refresh catalog.',
      });
    } finally {
      setRestaurantLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      await loadRestaurants();
      await loadCatalog();
    } finally {
      setRefreshing(false);
    }
  };

  const resetItemForm = () => {
    setEditingItemId(null);
    setItemCategory('');
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemDiscountedPrice('');
    setItemPreparationTime('20');
    setItemSortOrder('0');
    setItemIsAvailable(true);
    setItemIsFeatured(false);
    setItemImage(null);
    setItemImagePreview(null);
    setUploadingItemImage(false);
  };

  const handleHeaderBack = () => {
    if (showItemForm) {
      closeItemForm();
      return;
    }

    if (showCategoryForm) {
      closeCategoryForm();
      return;
    }

    router.replace('/admin');
  };

  const handleSelectRestaurant = (restaurant: AdminRestaurant) => {
    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDescription('');
    setShowItemForm(false);
    resetItemForm();
    setSelectedRestaurant(restaurant);
  };

  const openCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDescription('');
    setShowCategoryForm(true);
  };

  const openEditCategory = (category: AdminCategory) => {
    setEditingCategoryId(category._id);
    setCategoryName(category.name);
    setCategoryDescription(category.description || '');
    setShowCategoryForm(true);
  };

  const closeCategoryForm = () => {
    if (savingCategory) return;

    setShowCategoryForm(false);
    setEditingCategoryId(null);
    setCategoryName('');
    setCategoryDescription('');
  };

  const openCreateItem = () => {
    if (categories.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Create a category first',
        text2: 'A menu item must belong to a category.',
      });
      return;
    }

    setEditingItemId(null);
    setShowItemForm(true);
    setShowCategoryForm(false);
    setItemCategory(categories[0]?._id || '');
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setItemDiscountedPrice('');
    setItemPreparationTime('20');
    setItemSortOrder('0');
    setItemIsAvailable(true);
    setItemIsFeatured(false);
    setItemImage(null);
    setItemImagePreview(null);
  };

  const openEditItem = (item: AdminMenuItem) => {
    const categoryId =
      typeof item.category === 'string'
        ? item.category
        : item.category?._id || '';

    setEditingItemId(item._id);
    setShowItemForm(true);
    setShowCategoryForm(false);
    setItemCategory(categoryId);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemPrice(String(item.price ?? ''));
    setItemDiscountedPrice(
      item.discountedPrice !== undefined
        ? String(item.discountedPrice)
        : '',
    );
    setItemPreparationTime(String(item.preparationTime ?? 20));
    setItemSortOrder(String(item.sortOrder ?? 0));
    setItemIsAvailable(item.isAvailable !== false);
    setItemIsFeatured(item.isFeatured === true);
    setItemImage(item.image || null);
    setItemImagePreview(item.image || null);
  };

  const closeItemForm = () => {
    if (savingItem || uploadingItemImage) return;

    setShowItemForm(false);
    resetItemForm();
  };

  const handlePickItemImage = async () => {
    if (uploadingItemImage || savingItem) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Toast.show({
          type: 'error',
          text1: 'Photo permission required',
          text2: 'Allow photo-library access to select a menu item image.',
        });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      setItemImagePreview(asset.uri);
      setUploadingItemImage(true);

      Toast.show({
        type: 'info',
        text1: 'Uploading image',
        text2: 'Please wait while the image uploads.',
      });

      const uploadedUrl = await uploadRestaurantImage(asset);

      if (!uploadedUrl) {
        throw new Error('The server did not return an image URL.');
      }

      setItemImage(uploadedUrl);
      setItemImagePreview(uploadedUrl);

      Toast.show({
        type: 'success',
        text1: 'Image uploaded',
        text2: 'The menu item image is ready to save.',
      });
    } catch (error: any) {
      console.error('Upload menu item image error:', error);
      setItemImagePreview(itemImage);

      Toast.show({
        type: 'error',
        text1: 'Image upload failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Could not upload the menu item image.',
      });
    } finally {
      setUploadingItemImage(false);
    }
  };

  const handleRemoveItemImage = () => {
    if (uploadingItemImage || savingItem) return;

    setItemImage(null);
    setItemImagePreview(null);
  };

  const handleSaveCategory = async () => {
    if (!selectedRestaurant) return;

    const trimmedName = categoryName.trim();
    const trimmedDescription = categoryDescription.trim();

    if (!trimmedName) {
      Toast.show({
        type: 'error',
        text1: 'Category name required',
        text2: 'Please enter a category name.',
      });
      return;
    }

    setSavingCategory(true);
    const categoryId = editingCategoryId;

    try {
      if (categoryId) {
        await updateCategory(categoryId, {
          name: trimmedName,
          description: trimmedDescription,
        });

        Toast.show({
          type: 'success',
          text1: 'Category updated',
          text2: 'Category updated successfully.',
        });
      } else {
        await createCategory(selectedRestaurant._id, {
          name: trimmedName,
          description: trimmedDescription,
        });

        Toast.show({
          type: 'success',
          text1: 'Category created',
          text2: 'Category created successfully.',
        });
      }

      setShowCategoryForm(false);
      setEditingCategoryId(null);
      setCategoryName('');
      setCategoryDescription('');
      await refreshCatalog();
    } catch (error: any) {
      console.error('Save category error:', error);

      Toast.show({
        type: 'error',
        text1: categoryId ? 'Update failed' : 'Create failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to save category.',
      });
    } finally {
      setSavingCategory(false);
    }
  };

  const handleSaveItem = async () => {
    if (!selectedRestaurant) return;

    if (uploadingItemImage) {
      Toast.show({
        type: 'error',
        text1: 'Image is still uploading',
        text2: 'Wait for the image upload to finish before saving.',
      });
      return;
    }

    const trimmedCategory = itemCategory.trim();
    const trimmedName = itemName.trim();
    const trimmedDescription = itemDescription.trim();
    const price = Number(itemPrice);
    const discountedPrice =
      itemDiscountedPrice.trim() === ''
        ? undefined
        : Number(itemDiscountedPrice);
    const preparationTime = Number(itemPreparationTime);
    const sortOrder = Number(itemSortOrder);

    if (!trimmedCategory) {
      Toast.show({
        type: 'error',
        text1: 'Category required',
        text2: 'Please select a category.',
      });
      return;
    }

    if (!trimmedName) {
      Toast.show({
        type: 'error',
        text1: 'Item name required',
        text2: 'Please enter a menu item name.',
      });
      return;
    }

    if (
      itemPrice.trim() === '' ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid price',
        text2: 'Please enter a valid item price.',
      });
      return;
    }

    if (
      discountedPrice !== undefined &&
      (!Number.isFinite(discountedPrice) || discountedPrice < 0)
    ) {
      Toast.show({
        type: 'error',
        text1: 'Invalid discount price',
        text2: 'Please enter a valid discounted price.',
      });
      return;
    }

    if (discountedPrice !== undefined && discountedPrice > price) {
      Toast.show({
        type: 'error',
        text1: 'Invalid discount price',
        text2: 'Discounted price cannot be higher than the original price.',
      });
      return;
    }

    if (!Number.isFinite(preparationTime) || preparationTime < 1) {
      Toast.show({
        type: 'error',
        text1: 'Invalid preparation time',
        text2: 'Preparation time must be at least 1 minute.',
      });
      return;
    }

    if (!Number.isFinite(sortOrder) || sortOrder < 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid sort order',
        text2: 'Sort order must be 0 or greater.',
      });
      return;
    }

    setSavingItem(true);
    const itemId = editingItemId;

    try {
      const payload = {
        category: trimmedCategory,
        name: trimmedName,
        description: trimmedDescription,
        price,
        discountedPrice,
        preparationTime,
        sortOrder,
        isAvailable: itemIsAvailable,
        isFeatured: itemIsFeatured,
        image: itemImage || undefined,
      };

      if (itemId) {
        await updateMenuItem(itemId, payload);

        Toast.show({
          type: 'success',
          text1: 'Menu item updated',
          text2: 'Menu item updated successfully.',
        });
      } else {
        await createMenuItem(selectedRestaurant._id, payload);

        Toast.show({
          type: 'success',
          text1: 'Menu item created',
          text2: 'Menu item created successfully.',
        });
      }

      setShowItemForm(false);
      resetItemForm();
      await refreshCatalog();
    } catch (error: any) {
      console.error('Save menu item error:', error);

      Toast.show({
        type: 'error',
        text1: itemId ? 'Update failed' : 'Create failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to save menu item.',
      });
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteCategory = async (category: AdminCategory) => {
    if (deletingCategoryId) return;

    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(
            `Delete "${category.name}" and all menu items inside it?`,
          )
        : true;

    if (!confirmed) return;

    setDeletingCategoryId(category._id);

    try {
      await deleteCategory(category._id);

      if (editingCategoryId === category._id) {
        setShowCategoryForm(false);
        setEditingCategoryId(null);
        setCategoryName('');
        setCategoryDescription('');
      }

      setCategories((current) =>
        current.filter((item) => item._id !== category._id),
      );

      setItems((current) =>
        current.filter((item) => {
          if (typeof item.category === 'string') {
            return item.category !== category._id;
          }

          return item.category?._id !== category._id;
        }),
      );

      if (itemCategory === category._id) {
        setShowItemForm(false);
        resetItemForm();
      }

      Toast.show({
        type: 'success',
        text1: 'Category deleted',
        text2: 'Category and its menu items were deleted.',
      });

      await refreshCatalog();
    } catch (error: any) {
      console.error('Delete category error:', error);

      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete category.',
      });
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleDeleteItem = async (item: AdminMenuItem) => {
    if (deletingItemId) return;

    const confirmed =
      typeof window !== 'undefined'
        ? window.confirm(`Delete "${item.name}"?`)
        : true;

    if (!confirmed) return;

    setDeletingItemId(item._id);

    try {
      await deleteMenuItem(item._id);

      setItems((current) =>
        current.filter((currentItem) => currentItem._id !== item._id),
      );

      if (editingItemId === item._id) {
        closeItemForm();
      }

      Toast.show({
        type: 'success',
        text1: 'Menu item deleted',
        text2: 'Menu item deleted successfully.',
      });

      await refreshCatalog();
    } catch (error: any) {
      console.error('Delete menu item error:', error);

      Toast.show({
        type: 'error',
        text1: 'Delete failed',
        text2:
          error?.response?.data?.message ||
          error?.message ||
          'Failed to delete menu item.',
      });
    } finally {
      setDeletingItemId(null);
    }
  };

  const getCategoryName = (
    category: string | { _id: string; name: string },
  ) => {
    if (typeof category === 'object' && category !== null) {
      return category.name;
    }

    return categories.find((item) => item._id === category)?.name ||
      'Uncategorized';
  };

  const renderField = (
    label: string,
    value: string,
    onChangeText: (value: string) => void,
    placeholder: string,
    options?: {
      multiline?: boolean;
      keyboardType?: 'default' | 'decimal-pad' | 'number-pad';
      editable?: boolean;
    },
  ) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textLight}
        multiline={options?.multiline}
        keyboardType={options?.keyboardType || 'default'}
        editable={options?.editable !== false}
        style={[
          styles.input,
          options?.multiline && styles.textArea,
        ]}
      />
    </View>
  );

  const renderSwitchRow = (
    title: string,
    description: string,
    value: boolean,
    onValueChange: (value: boolean) => void,
  ) => (
    <View style={styles.switchRow}>
      <View style={styles.switchText}>
        <Text style={styles.switchTitle}>{title}</Text>
        <Text style={styles.switchDescription}>{description}</Text>
      </View>

      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={savingItem}
        trackColor={{
          false: colors.surfaceAlt,
          true: colors.secondary,
        }}
        thumbColor={value ? colors.primary : colors.textLight}
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading catalog...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
          onPress={handleHeaderBack}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>ADMIN CONSOLE</Text>
          <Text style={styles.title}>Menu Catalog</Text>
          <Text style={styles.subtitle}>
            Manage restaurant categories and items
          </Text>
        </View>

        <View style={styles.headerIcon}>
          <Ionicons name="layers-outline" size={23} color={colors.primary} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Select Restaurant</Text>
            <Text style={styles.sectionSubtitle}>
              Choose a restaurant to manage its catalog
            </Text>
          </View>

          <View style={styles.countBadge}>
            <Text style={styles.countText}>{restaurants.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.restaurantList}
        >
          {restaurants.map((restaurant) => {
            const selected = selectedRestaurant?._id === restaurant._id;

            return (
              <Pressable
                key={restaurant._id}
                style={[
                  styles.restaurantChip,
                  selected && styles.restaurantChipSelected,
                ]}
                onPress={() => handleSelectRestaurant(restaurant)}
              >
                <View
                  style={[
                    styles.restaurantChipIcon,
                    selected && styles.restaurantChipIconSelected,
                  ]}
                >
                  <Ionicons
                    name="storefront-outline"
                    size={19}
                    color={selected ? colors.primary : colors.textSecondary}
                  />
                </View>

                <View style={styles.restaurantChipText}>
                  <Text
                    style={[
                      styles.restaurantName,
                      selected && styles.restaurantNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {restaurant.name}
                  </Text>

                  <Text style={styles.restaurantArea} numberOfLines={1}>
                    {restaurant.area}, {restaurant.city}
                  </Text>
                </View>

                {selected ? (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {!selectedRestaurant ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="restaurant-outline"
                size={32}
                color={colors.textLight}
              />
            </View>
            <Text style={styles.emptyTitle}>No restaurants</Text>
            <Text style={styles.emptyText}>
              Create or approve a restaurant before managing its catalog.
            </Text>
          </View>
        ) : restaurantLoading ? (
          <View style={styles.catalogLoading}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading catalog...</Text>
          </View>
        ) : (
          <>
            <View style={styles.restaurantBanner}>
              <View style={styles.restaurantBannerIcon}>
                <Ionicons
                  name="storefront"
                  size={24}
                  color={colors.primary}
                />
              </View>

              <View style={styles.restaurantBannerText}>
                <Text style={styles.restaurantBannerName}>
                  {selectedRestaurant.name}
                </Text>
                <Text style={styles.restaurantBannerAddress}>
                  {selectedRestaurant.area}, {selectedRestaurant.city}
                </Text>
                <Text style={styles.restaurantBannerMeta}>
                  {categories.length} categories · {items.length} menu items
                </Text>
              </View>

              <View
                style={[
                  styles.openBadge,
                  selectedRestaurant.isOpen
                    ? styles.openBadgeOpen
                    : styles.openBadgeClosed,
                ]}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: selectedRestaurant.isOpen
                        ? colors.secondary
                        : colors.textLight,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.openBadgeText,
                    {
                      color: selectedRestaurant.isOpen
                        ? colors.secondary
                        : colors.textSecondary,
                    },
                  ]}
                >
                  {selectedRestaurant.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Categories</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{categories.length}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
                onPress={openCreateCategory}
              >
                <Ionicons name="add" size={19} color={colors.black} />
                <Text style={styles.addButtonText}>Add category</Text>
              </Pressable>
            </View>

            {showCategoryForm ? (
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View>
                    <Text style={styles.formEyebrow}>
                      CATEGORY DETAILS
                    </Text>
                    <Text style={styles.formTitle}>
                      {editingCategoryId ? 'Edit Category' : 'New Category'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeCategoryForm}
                    disabled={savingCategory}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={21} color={colors.textSecondary} />
                  </Pressable>
                </View>

                {renderField(
                  'Category name',
                  categoryName,
                  setCategoryName,
                  'e.g. Burgers',
                  { editable: !savingCategory },
                )}

                {renderField(
                  'Description',
                  categoryDescription,
                  setCategoryDescription,
                  'Describe this category (optional)',
                  { multiline: true, editable: !savingCategory },
                )}

                <Pressable
                  style={[
                    styles.saveButton,
                    savingCategory && styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveCategory}
                  disabled={savingCategory}
                >
                  {savingCategory ? (
                    <ActivityIndicator size="small" color={colors.black} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={19}
                        color={colors.black}
                      />
                      <Text style={styles.saveButtonText}>
                        {editingCategoryId ? 'Update Category' : 'Create Category'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}

            {categories.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons name="layers-outline" size={32} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTitle}>No categories yet</Text>
                <Text style={styles.emptyText}>
                  Create your first category before adding menu items.
                </Text>
              </View>
            ) : (
              <View style={styles.categoryList}>
                {categories.map((category) => {
                  const isEditing = editingCategoryId === category._id;
                  const isDeleting = deletingCategoryId === category._id;

                  return (
                    <View
                      key={category._id}
                      style={[
                        styles.categoryCard,
                        isEditing && styles.cardEditing,
                      ]}
                    >
                      <View style={styles.categoryIcon}>
                        <Ionicons
                          name="restaurant-outline"
                          size={21}
                          color={colors.primary}
                        />
                      </View>

                      <View style={styles.categoryInfo}>
                        <Text style={styles.categoryName}>{category.name}</Text>

                        {category.description ? (
                          <Text
                            style={styles.categoryDescription}
                            numberOfLines={2}
                          >
                            {category.description}
                          </Text>
                        ) : null}

                        <View style={styles.statusLine}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: category.isActive
                                  ? colors.secondary
                                  : colors.danger,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              styles.categoryStatus,
                              {
                                color: category.isActive
                                  ? colors.secondary
                                  : colors.danger,
                              },
                            ]}
                          >
                            {category.isActive ? 'Active' : 'Disabled'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.actionGroup}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => openEditCategory(category)}
                        >
                          <Ionicons
                            name="create-outline"
                            size={17}
                            color={colors.primary}
                          />
                        </Pressable>

                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => handleDeleteCategory(category)}
                          disabled={Boolean(deletingCategoryId)}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={17}
                              color={colors.danger}
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            <View style={[styles.sectionHeader, styles.itemsHeader]}>
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>Menu Items</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countText}>{items.length}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.addButton,
                  pressed && styles.pressed,
                ]}
                onPress={openCreateItem}
              >
                <Ionicons name="add" size={19} color={colors.black} />
                <Text style={styles.addButtonText}>Add item</Text>
              </Pressable>
            </View>

            {showItemForm ? (
              <View style={styles.formCard}>
                <View style={styles.formHeader}>
                  <View>
                    <Text style={styles.formEyebrow}>MENU ITEM DETAILS</Text>
                    <Text style={styles.formTitle}>
                      {editingItemId ? 'Edit Menu Item' : 'New Menu Item'}
                    </Text>
                  </View>

                  <Pressable
                    onPress={closeItemForm}
                    disabled={savingItem || uploadingItemImage}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={21} color={colors.textSecondary} />
                  </Pressable>
                </View>

                <Text style={styles.fieldLabel}>Menu item image</Text>

                <View style={styles.imagePickerCard}>
                  {itemImagePreview ? (
                    <Image
                      source={{ uri: itemImagePreview }}
                      style={styles.itemImagePreview}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons
                        name="image-outline"
                        size={38}
                        color={colors.textLight}
                      />
                      <Text style={styles.imagePlaceholderText}>
                        No image selected
                      </Text>
                    </View>
                  )}

                  {uploadingItemImage ? (
                    <View style={styles.imageUploading}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.imageUploadingText}>
                        Uploading image...
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.imageActionRow}>
                    <Pressable
                      style={styles.imageChooseButton}
                      onPress={handlePickItemImage}
                      disabled={savingItem || uploadingItemImage}
                    >
                      <Ionicons
                        name="cloud-upload-outline"
                        size={18}
                        color={colors.black}
                      />
                      <Text style={styles.imageChooseButtonText}>
                        {itemImagePreview ? 'Change image' : 'Choose image'}
                      </Text>
                    </Pressable>

                    {itemImagePreview ? (
                      <Pressable
                        style={styles.imageRemoveButton}
                        onPress={handleRemoveItemImage}
                        disabled={savingItem || uploadingItemImage}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={17}
                          color={colors.danger}
                        />
                        <Text style={styles.imageRemoveButtonText}>Remove</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <Text style={styles.imageHelpText}>
                    Choose a JPG, PNG, or WEBP photo. The image uploads before
                    the menu item is saved.
                  </Text>
                </View>

                <Text style={styles.fieldLabel}>Category</Text>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.categorySelector}
                >
                  {categories.map((category) => {
                    const selected = itemCategory === category._id;

                    return (
                      <Pressable
                        key={category._id}
                        style={[
                          styles.categoryOption,
                          selected && styles.categoryOptionSelected,
                        ]}
                        onPress={() => setItemCategory(category._id)}
                        disabled={savingItem}
                      >
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={17}
                          color={selected ? colors.primary : colors.textLight}
                        />
                        <Text
                          style={[
                            styles.categoryOptionText,
                            selected && styles.categoryOptionTextSelected,
                          ]}
                        >
                          {category.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                {renderField('Item name', itemName, setItemName, 'e.g. Classic Burger', {
                  editable: !savingItem,
                })}

                {renderField(
                  'Description',
                  itemDescription,
                  setItemDescription,
                  'Describe the item (optional)',
                  { multiline: true, editable: !savingItem },
                )}

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    {renderField('Price (Rs.)', itemPrice, setItemPrice, '0', {
                      keyboardType: 'decimal-pad',
                      editable: !savingItem,
                    })}
                  </View>

                  <View style={styles.inputHalf}>
                    {renderField(
                      'Discounted price',
                      itemDiscountedPrice,
                      setItemDiscountedPrice,
                      'Optional',
                      {
                        keyboardType: 'decimal-pad',
                        editable: !savingItem,
                      },
                    )}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    {renderField(
                      'Preparation (minutes)',
                      itemPreparationTime,
                      setItemPreparationTime,
                      '20',
                      {
                        keyboardType: 'number-pad',
                        editable: !savingItem,
                      },
                    )}
                  </View>

                  <View style={styles.inputHalf}>
                    {renderField(
                      'Sort order',
                      itemSortOrder,
                      setItemSortOrder,
                      '0',
                      {
                        keyboardType: 'number-pad',
                        editable: !savingItem,
                      },
                    )}
                  </View>
                </View>

                {renderSwitchRow(
                  'Available',
                  'Customers can order this item',
                  itemIsAvailable,
                  setItemIsAvailable,
                )}

                {renderSwitchRow(
                  'Featured',
                  'Highlight this item in the app',
                  itemIsFeatured,
                  setItemIsFeatured,
                )}

                <Pressable
                  style={[
                    styles.saveButton,
                    (savingItem || uploadingItemImage) &&
                      styles.saveButtonDisabled,
                  ]}
                  onPress={handleSaveItem}
                  disabled={savingItem || uploadingItemImage}
                >
                  {savingItem || uploadingItemImage ? (
                    <ActivityIndicator size="small" color={colors.black} />
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={19}
                        color={colors.black}
                      />
                      <Text style={styles.saveButtonText}>
                        {editingItemId ? 'Update Menu Item' : 'Create Menu Item'}
                      </Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}

            {items.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="fast-food-outline"
                    size={32}
                    color={colors.textLight}
                  />
                </View>
                <Text style={styles.emptyTitle}>No menu items yet</Text>
                <Text style={styles.emptyText}>
                  Add menu items after creating your categories.
                </Text>
              </View>
            ) : (
              <View style={[styles.itemList, isWide && styles.itemGrid]}>
                {items.map((item) => {
                  const isDeleting = deletingItemId === item._id;
                  const isEditing = editingItemId === item._id;

                  return (
                    <View
                      key={item._id}
                      style={[
                        styles.itemCard,
                        isWide && styles.itemCardWide,
                        isEditing && styles.cardEditing,
                      ]}
                    >
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.itemCardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.itemIcon}>
                          <Ionicons
                            name="fast-food-outline"
                            size={24}
                            color={colors.primary}
                          />
                        </View>
                      )}

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemCategory}>
                          {getCategoryName(item.category)}
                        </Text>

                        {item.description ? (
                          <Text
                            style={styles.itemDescription}
                            numberOfLines={2}
                          >
                            {item.description}
                          </Text>
                        ) : null}

                        <View style={styles.priceRow}>
                          <Text style={styles.itemPrice}>
                            Rs. {Number(item.price || 0).toLocaleString()}
                          </Text>

                          {item.discountedPrice !== undefined ? (
                            <Text style={styles.discountPrice}>
                              Rs. {Number(item.discountedPrice).toLocaleString()}
                            </Text>
                          ) : null}
                        </View>

                        <View style={styles.itemMetaRow}>
                          <View
                            style={[
                              styles.statusDot,
                              {
                                backgroundColor: item.isAvailable
                                  ? colors.secondary
                                  : colors.danger,
                              },
                            ]}
                          />
                          <Text style={styles.itemMetaText}>
                            {item.isAvailable ? 'Available' : 'Unavailable'}
                          </Text>

                          {item.isFeatured ? (
                            <View style={styles.featuredBadge}>
                              <Ionicons
                                name="star"
                                size={10}
                                color={colors.honey}
                              />
                              <Text style={styles.featuredText}>Featured</Text>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      <View style={styles.actionGroup}>
                        <Pressable
                          style={styles.editButton}
                          onPress={() => openEditItem(item)}
                          disabled={Boolean(deletingItemId)}
                        >
                          <Ionicons
                            name="create-outline"
                            size={17}
                            color={colors.primary}
                          />
                        </Pressable>

                        <Pressable
                          style={styles.deleteButton}
                          onPress={() => handleDeleteItem(item)}
                          disabled={Boolean(deletingItemId)}
                        >
                          {isDeleting ? (
                            <ActivityIndicator size="small" color={colors.danger} />
                          ) : (
                            <Ionicons
                              name="trash-outline"
                              size={17}
                              color={colors.danger}
                            />
                          )}
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        <Text style={styles.footerText}>FOODDASH · MASTER CATALOG</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  pressed: {
    opacity: 0.7,
  },

  headerText: {
    flex: 1,
    minWidth: 0,
  },

  eyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 4,
  },

  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },

  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },

  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    marginLeft: spacing.sm,
  },

  content: {
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
    padding: spacing.lg,
    paddingBottom: 48,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },

  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: colors.textLight,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  countBadge: {
    minWidth: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
  },

  countText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '900',
  },

  restaurantList: {
    gap: spacing.sm,
    paddingBottom: 4,
  },

  restaurantChip: {
    width: 225,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },

  restaurantChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceAlt,
  },

  restaurantChipIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  restaurantChipIconSelected: {
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
  },

  restaurantChipText: {
    flex: 1,
    minWidth: 0,
  },

  restaurantName: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
  },

  restaurantNameSelected: {
    color: colors.primary,
  },

  restaurantArea: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 4,
  },

  restaurantBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginTop: spacing.lg,
  },

  restaurantBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  restaurantBannerText: {
    flex: 1,
    minWidth: 0,
  },

  restaurantBannerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },

  restaurantBannerAddress: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 3,
  },

  restaurantBannerMeta: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 5,
  },

  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.round,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginLeft: spacing.sm,
  },

  openBadgeOpen: {
    backgroundColor: 'rgba(198, 245, 74, 0.09)',
  },

  openBadgeClosed: {
    backgroundColor: colors.surfaceAlt,
  },

  openBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
  },

  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },

  addButtonText: {
    color: colors.black,
    fontSize: 11,
    fontWeight: '900',
  },

  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },

  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },

  formEyebrow: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  formTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '900',
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  fieldContainer: {
    flex: 1,
    minWidth: 0,
    marginBottom: spacing.sm,
  },

  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 13,
    minHeight: 46,
  },

  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },

  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },

  inputHalf: {
    flex: 1,
    minWidth: 0,
  },

  categorySelector: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },

  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },

  categoryOptionSelected: {
    backgroundColor: 'rgba(255, 107, 26, 0.12)',
    borderColor: colors.primary,
  },

  categoryOptionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },

  categoryOptionTextSelected: {
    color: colors.primary,
  },

  imagePickerCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  itemImagePreview: {
    width: '100%',
    height: 210,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },

  imagePlaceholder: {
    width: '100%',
    height: 165,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },

  imagePlaceholderText: {
    color: colors.textLight,
    fontSize: 12,
    marginTop: spacing.sm,
  },

  imageUploading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },

  imageUploadingText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },

  imageActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  imageChooseButton: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
  },

  imageChooseButtonText: {
    color: colors.black,
    fontSize: 11,
    fontWeight: '900',
  },

  imageRemoveButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },

  imageRemoveButtonText: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '800',
  },

  imageHelpText: {
    color: colors.textLight,
    fontSize: 10,
    lineHeight: 16,
    marginTop: spacing.sm,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },

  switchText: {
    flex: 1,
    paddingRight: spacing.sm,
  },

  switchTitle: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },

  switchDescription: {
    color: colors.textLight,
    fontSize: 10,
    marginTop: 4,
  },

  saveButton: {
    minHeight: 47,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: colors.black,
    fontSize: 12,
    fontWeight: '900',
  },

  categoryList: {
    gap: spacing.sm,
  },

  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
  },

  cardEditing: {
    borderColor: colors.primary,
  },

  categoryIcon: {
    width: 43,
    height: 43,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },

  categoryInfo: {
    flex: 1,
    minWidth: 0,
    paddingRight: spacing.sm,
  },

  categoryName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  categoryDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  statusLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 7,
  },

  categoryStatus: {
    fontSize: 10,
    fontWeight: '800',
  },

  actionGroup: {
    flexDirection: 'row',
    gap: 7,
  },

  editButton: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  deleteButton: {
    width: 37,
    height: 37,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 98, 104, 0.08)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemsHeader: {
    marginTop: spacing.xxl,
  },

  itemList: {
    gap: spacing.sm,
  },

  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },

  itemCardWide: {
    width: '48%',
    flexGrow: 1,
    alignItems: 'flex-start',
  },

  itemCardImage: {
    width: 76,
    height: 76,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },

  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 107, 26, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  itemInfo: {
    flex: 1,
    minWidth: 0,
  },

  itemName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },

  itemCategory: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },

  itemDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 5,
  },

  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  itemPrice: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '900',
  },

  discountPrice: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
  },

  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },

  itemMetaText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '700',
  },

  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 181, 71, 0.10)',
    borderRadius: radius.round,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  featuredText: {
    color: colors.honey,
    fontSize: 9,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    marginTop: spacing.md,
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing.md,
  },

  emptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  catalogLoading: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.sm,
  },

  footerText: {
    color: colors.textLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
