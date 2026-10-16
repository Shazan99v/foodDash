const Restaurant = require('../models/Restaurant');
const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');

/* =========================================================
   GET CATEGORIES FOR RESTAURANT
   GET /api/admin/catalog/restaurants/:restaurantId/categories
   ========================================================= */

const getRestaurantCategories = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(
      restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const categories = await MenuCategory.find({
      restaurant: restaurantId,
    }).sort({
      sortOrder: 1,
      createdAt: 1,
    });

    return res.status(200).json({
      success: true,
      count: categories.length,
      categories,
    });
  } catch (error) {
    console.error(
      'Get restaurant categories error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load restaurant categories.',
    });
  }
};


/* =========================================================
   CREATE CATEGORY
   POST /api/admin/catalog/restaurants/:restaurantId/categories
   ========================================================= */

const createCategory = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const {
      name,
      description,
      image,
      sortOrder,
      isActive,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }

    const restaurant = await Restaurant.findById(
      restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const category = await MenuCategory.create({
      restaurant: restaurantId,
      name: name.trim(),
      description:
        description?.trim() || '',
      image:
        image?.trim() || '',
      sortOrder:
        sortOrder !== undefined
          ? Number(sortOrder)
          : 0,
      isActive:
        isActive !== undefined
          ? Boolean(isActive)
          : true,
    });

    return res.status(201).json({
      success: true,
      message: 'Category created successfully.',
      category,
    });
  } catch (error) {
    console.error(
      'Create menu category error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to create category.',
    });
  }
};


/* =========================================================
   UPDATE CATEGORY
   PATCH /api/admin/catalog/categories/:categoryId
   ========================================================= */

const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await MenuCategory.findById(
      categoryId
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    const {
      name,
      description,
      image,
      sortOrder,
      isActive,
    } = req.body;

    if (
      name !== undefined &&
      !String(name).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Category name cannot be empty.',
      });
    }

    if (name !== undefined) {
      category.name = String(name).trim();
    }

    if (description !== undefined) {
      category.description =
        String(description).trim();
    }

    if (image !== undefined) {
      category.image =
        String(image).trim();
    }

    if (sortOrder !== undefined) {
      category.sortOrder = Number(sortOrder);
    }

    if (isActive !== undefined) {
      category.isActive = Boolean(isActive);
    }

    await category.save();

    return res.status(200).json({
      success: true,
      message: 'Category updated successfully.',
      category,
    });
  } catch (error) {
    console.error(
      'Update menu category error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update category.',
    });
  }
};


/* =========================================================
   DELETE CATEGORY
   DELETE /api/admin/catalog/categories/:categoryId

   Also removes all menu items belonging to this category.
   ========================================================= */

const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    const category = await MenuCategory.findById(
      categoryId
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found.',
      });
    }

    await MenuItem.deleteMany({
      category: categoryId,
    });

    await MenuCategory.findByIdAndDelete(
      categoryId
    );

    return res.status(200).json({
      success: true,
      message:
        'Category and its menu items deleted successfully.',
    });
  } catch (error) {
    console.error(
      'Delete menu category error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to delete category.',
    });
  }
};


/* =========================================================
   GET MENU ITEMS FOR RESTAURANT
   GET /api/admin/catalog/restaurants/:restaurantId/items
   ========================================================= */

const getRestaurantMenuItems = async (
  req,
  res
) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findById(
      restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const items = await MenuItem.find({
      restaurant: restaurantId,
    })
      .populate(
        'category',
        'name image isActive'
      )
      .sort({
        sortOrder: 1,
        createdAt: 1,
      });

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
    });
  } catch (error) {
    console.error(
      'Get restaurant menu items error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to load menu items.',
    });
  }
};


/* =========================================================
   CREATE MENU ITEM
   POST /api/admin/catalog/restaurants/:restaurantId/items
   ========================================================= */

const createMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const {
      category,
      name,
      description,
      image,
      price,
      discountedPrice,
      variations,
      addons,
      preparationTime,
      sortOrder,
      isAvailable,
      isFeatured,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Menu item name is required.',
      });
    }

    if (
      price === undefined ||
      price === null ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid menu item price is required.',
      });
    }

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category is required.',
      });
    }

    const restaurant = await Restaurant.findById(
      restaurantId
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: 'Restaurant not found.',
      });
    }

    const menuCategory =
      await MenuCategory.findOne({
        _id: category,
        restaurant: restaurantId,
      });

    if (!menuCategory) {
      return res.status(404).json({
        success: false,
        message:
          'The selected category does not belong to this restaurant.',
      });
    }

    const menuItem = await MenuItem.create({
      restaurant: restaurantId,
      category,
      name: name.trim(),
      description:
        description?.trim() || '',
      image:
        image?.trim() || '',
      price: Number(price),
      discountedPrice:
        discountedPrice !== undefined &&
        discountedPrice !== ''
          ? Number(discountedPrice)
          : undefined,
      variations:
        Array.isArray(variations)
          ? variations
          : [],
      addons:
        Array.isArray(addons)
          ? addons
          : [],
      preparationTime:
        preparationTime !== undefined
          ? Number(preparationTime)
          : 20,
      sortOrder:
        sortOrder !== undefined
          ? Number(sortOrder)
          : 0,
      isAvailable:
        isAvailable !== undefined
          ? Boolean(isAvailable)
          : true,
      isFeatured:
        isFeatured !== undefined
          ? Boolean(isFeatured)
          : false,
    });

    const populatedItem =
      await MenuItem.findById(
        menuItem._id
      ).populate(
        'category',
        'name image isActive'
      );

    return res.status(201).json({
      success: true,
      message: 'Menu item created successfully.',
      item: populatedItem,
    });
  } catch (error) {
    console.error(
      'Create menu item error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to create menu item.',
    });
  }
};


/* =========================================================
   UPDATE MENU ITEM
   PATCH /api/admin/catalog/items/:itemId
   ========================================================= */

const updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await MenuItem.findById(
      itemId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    const {
      category,
      name,
      description,
      image,
      price,
      discountedPrice,
      variations,
      addons,
      preparationTime,
      sortOrder,
      isAvailable,
      isFeatured,
    } = req.body;

    if (
      name !== undefined &&
      !String(name).trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Menu item name cannot be empty.',
      });
    }

    if (
      price !== undefined &&
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative.',
      });
    }

    if (category !== undefined) {
      const menuCategory =
        await MenuCategory.findOne({
          _id: category,
          restaurant: item.restaurant,
        });

      if (!menuCategory) {
        return res.status(400).json({
          success: false,
          message:
            'The selected category does not belong to this restaurant.',
        });
      }

      item.category = category;
    }

    if (name !== undefined) {
      item.name = String(name).trim();
    }

    if (description !== undefined) {
      item.description =
        String(description).trim();
    }

    if (image !== undefined) {
      item.image =
        String(image).trim();
    }

    if (price !== undefined) {
      item.price = Number(price);
    }

    if (discountedPrice !== undefined) {
      item.discountedPrice =
        discountedPrice === ''
          ? undefined
          : Number(discountedPrice);
    }

    if (variations !== undefined) {
      item.variations =
        Array.isArray(variations)
          ? variations
          : [];
    }

    if (addons !== undefined) {
      item.addons =
        Array.isArray(addons)
          ? addons
          : [];
    }

    if (preparationTime !== undefined) {
      item.preparationTime =
        Number(preparationTime);
    }

    if (sortOrder !== undefined) {
      item.sortOrder = Number(sortOrder);
    }

    if (isAvailable !== undefined) {
      item.isAvailable =
        Boolean(isAvailable);
    }

    if (isFeatured !== undefined) {
      item.isFeatured =
        Boolean(isFeatured);
    }

    await item.save();

    const populatedItem =
      await MenuItem.findById(
        item._id
      ).populate(
        'category',
        'name image isActive'
      );

    return res.status(200).json({
      success: true,
      message: 'Menu item updated successfully.',
      item: populatedItem,
    });
  } catch (error) {
    console.error(
      'Update menu item error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to update menu item.',
    });
  }
};


/* =========================================================
   DELETE MENU ITEM
   DELETE /api/admin/catalog/items/:itemId
   ========================================================= */

const deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const item = await MenuItem.findById(
      itemId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found.',
      });
    }

    await MenuItem.findByIdAndDelete(
      itemId
    );

    return res.status(200).json({
      success: true,
      message: 'Menu item deleted successfully.',
    });
  } catch (error) {
    console.error(
      'Delete menu item error:',
      error
    );

    return res.status(500).json({
      success: false,
      message: 'Failed to delete menu item.',
    });
  }
};


module.exports = {
  getRestaurantCategories,
  createCategory,
  updateCategory,
  deleteCategory,

  getRestaurantMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
