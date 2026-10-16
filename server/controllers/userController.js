const mongoose = require('mongoose');
const User = require('../models/User');

const getUserId = (req) =>
  req.user?.userId || req.user?._id || req.user?.id;

const sendUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  phone: user.phone,
  secondaryPhone: user.secondaryPhone,
  address: user.address,
  city: user.city,
  area: user.area,
  location: user.location,
  profilePhoto: user.profilePhoto,
  phoneNumbers: user.phoneNumbers || [],
  savedAddresses: user.savedAddresses || [],
});

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      user: sendUserResponse(user),
    });
  } catch (error) {
    console.error('Get current user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while getting the user account.',
    });
  }
};

const updateCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const allowedFields = [
      'name',
      'phone',
      'secondaryPhone',
      'address',
      'city',
      'area',
      'profilePhoto',
    ];

    for (const field of allowedFields) {
      if (!Object.prototype.hasOwnProperty.call(req.body, field)) {
        continue;
      }

      const value = req.body[field];

      if (value !== null && typeof value !== 'string') {
        return res.status(400).json({
          success: false,
          message: `${field} must be a string.`,
        });
      }

      user[field] = typeof value === 'string' ? value.trim() : '';
    }

    if (
      Object.prototype.hasOwnProperty.call(req.body, 'name') &&
      !user.name
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'location')) {
      const location = req.body.location;

      if (location === null) {
        user.location = undefined;
      } else {
        const coordinates = location?.coordinates;

        if (
          location?.type !== 'Point' ||
          !Array.isArray(coordinates) ||
          coordinates.length !== 2 ||
          !coordinates.every(
            (coordinate) =>
              typeof coordinate === 'number' &&
              Number.isFinite(coordinate)
          ) ||
          coordinates[0] < -180 ||
          coordinates[0] > 180 ||
          coordinates[1] < -90 ||
          coordinates[1] > 90
        ) {
          return res.status(400).json({
            success: false,
            message: 'Location coordinates are invalid.',
          });
        }

        user.location = location;
      }
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: sendUserResponse(user),
    });
  } catch (error) {
    console.error('Update current user error:', error);

    return res.status(500).json({
      success: false,
      message: 'Something went wrong while updating your profile.',
    });
  }
};

// =========================
// Saved Phone Numbers
// =========================

const getPhoneNumbers = async (req, res) => {
  try {
    const user = await User.findById(getUserId(req)).select('phone phoneNumbers');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      phoneNumbers: user.phoneNumbers || [],
      primaryPhone: user.phone || '',
    });
  } catch (error) {
    console.error('Get phone numbers error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load saved phone numbers.',
    });
  }
};

const addPhoneNumber = async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const number =
      typeof req.body.number === 'string'
        ? req.body.number.trim()
        : '';

    const label =
      typeof req.body.label === 'string'
        ? req.body.label.trim()
        : 'Mobile';

    if (!number || number.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid phone number (maximum 30 characters).',
      });
    }

    if (label.length > 30) {
      return res.status(400).json({
        success: false,
        message: 'Phone label cannot exceed 30 characters.',
      });
    }

    const isPrimary = req.body.isPrimary === true;

    if (isPrimary) {
      user.phoneNumbers.forEach((item) => {
        item.isPrimary = false;
      });
      user.phone = number;
    }

    const phoneNumber = {
      number,
      label: label || 'Mobile',
      isPrimary,
    };

    user.phoneNumbers.push(phoneNumber);

    if (!user.phone) {
      user.phone = number;
      user.phoneNumbers[user.phoneNumbers.length - 1].isPrimary = true;
    }

    await user.save();

    const created = user.phoneNumbers[user.phoneNumbers.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Phone number saved successfully.',
      phoneNumber: created,
      phoneNumbers: user.phoneNumbers,
    });
  } catch (error) {
    console.error('Add phone number error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to save this phone number.',
    });
  }
};

const updatePhoneNumber = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.phoneId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number ID.',
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const phone = user.phoneNumbers.id(req.params.phoneId);

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Saved phone number not found.',
      });
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'number')) {
      if (
        typeof req.body.number !== 'string' ||
        !req.body.number.trim() ||
        req.body.number.trim().length > 30
      ) {
        return res.status(400).json({
          success: false,
          message: 'Enter a valid phone number.',
        });
      }

      const oldNumber = phone.number;
      phone.number = req.body.number.trim();

      if (user.phone === oldNumber && phone.isPrimary) {
        user.phone = phone.number;
      }
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'label')) {
      if (
        typeof req.body.label !== 'string' ||
        req.body.label.trim().length > 30
      ) {
        return res.status(400).json({
          success: false,
          message: 'Phone label must be 30 characters or fewer.',
        });
      }

      phone.label = req.body.label.trim() || 'Mobile';
    }

    if (req.body.isPrimary === true) {
      user.phoneNumbers.forEach((item) => {
        item.isPrimary = item._id.equals(phone._id);
      });

      phone.isPrimary = true;
      user.phone = phone.number;
    } else if (req.body.isPrimary === false && phone.isPrimary) {
      return res.status(400).json({
        success: false,
        message: 'Choose another primary phone number first.',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Phone number updated successfully.',
      phoneNumbers: user.phoneNumbers,
    });
  } catch (error) {
    console.error('Update phone number error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update this phone number.',
    });
  }
};

const deletePhoneNumber = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.phoneId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number ID.',
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const phone = user.phoneNumbers.id(req.params.phoneId);

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Saved phone number not found.',
      });
    }

    if (phone.isPrimary && user.phoneNumbers.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Choose another primary number before deleting this one.',
      });
    }

    const wasPrimary = phone.isPrimary;
    const deletedNumber = phone.number;

    phone.deleteOne();

    if (wasPrimary || user.phone === deletedNumber) {
      const nextPhone = user.phoneNumbers[0];

      user.phone = nextPhone ? nextPhone.number : '';
      if (nextPhone) nextPhone.isPrimary = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Phone number deleted successfully.',
      phoneNumbers: user.phoneNumbers,
    });
  } catch (error) {
    console.error('Delete phone number error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete this phone number.',
    });
  }
};

const setPrimaryPhoneNumber = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.phoneId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number ID.',
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const phone = user.phoneNumbers.id(req.params.phoneId);

    if (!phone) {
      return res.status(404).json({
        success: false,
        message: 'Saved phone number not found.',
      });
    }

    user.phoneNumbers.forEach((item) => {
      item.isPrimary = item._id.equals(phone._id);
    });

    user.phone = phone.number;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Primary phone number updated.',
      phoneNumbers: user.phoneNumbers,
    });
  } catch (error) {
    console.error('Set primary phone error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to set the primary phone number.',
    });
  }
};

// =========================
// Saved Delivery Addresses
// =========================

const getSavedAddresses = async (req, res) => {
  try {
    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    return res.status(200).json({
      success: true,
      addresses: user.savedAddresses || [],
    });
  } catch (error) {
    console.error('Get saved addresses error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to load saved addresses.',
    });
  }
};

const validateAddress = (data, partial = false) => {
  const fields = [
    'label',
    'recipientName',
    'phone',
    'alternatePhone',
    'address',
    'city',
    'area',
    'landmark',
  ];

  for (const field of fields) {
    if (
      Object.prototype.hasOwnProperty.call(data, field) &&
      data[field] !== null &&
      typeof data[field] !== 'string'
    ) {
      return `${field} must be a string.`;
    }
  }

  if (!partial) {
    for (const field of ['label', 'address', 'city', 'area']) {
      if (
        typeof data[field] !== 'string' ||
        !data[field].trim()
      ) {
        return `${field} is required.`;
      }
    }
  }

  const limits = {
    label: 40,
    recipientName: 100,
    phone: 30,
    alternatePhone: 30,
    address: 300,
    city: 100,
    area: 100,
    landmark: 200,
  };

  for (const [field, limit] of Object.entries(limits)) {
    if (
      typeof data[field] === 'string' &&
      data[field].trim().length > limit
    ) {
      return `${field} cannot exceed ${limit} characters.`;
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'location')) {
    const location = data.location;

    if (
      location !== null &&
      (
        location.type !== 'Point' ||
        !Array.isArray(location.coordinates) ||
        location.coordinates.length !== 2 ||
        !location.coordinates.every(
          (coordinate) =>
            typeof coordinate === 'number' &&
            Number.isFinite(coordinate)
        ) ||
        location.coordinates[0] < -180 ||
        location.coordinates[0] > 180 ||
        location.coordinates[1] < -90 ||
        location.coordinates[1] > 90
      )
    ) {
      return 'Location coordinates are invalid.';
    }
  }

  return null;
};

const getAddressData = (body) => {
  const fields = [
    'label',
    'recipientName',
    'phone',
    'alternatePhone',
    'address',
    'city',
    'area',
    'landmark',
  ];

  const result = {};

  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      result[field] =
        typeof body[field] === 'string'
          ? body[field].trim()
          : '';
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'location')) {
    result.location = body.location || undefined;
  }

  return result;
};

const addSavedAddress = async (req, res) => {
  try {
    const validationError = validateAddress(req.body);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const makeDefault =
      req.body.isDefault === true ||
      user.savedAddresses.length === 0;

    if (makeDefault) {
      user.savedAddresses.forEach((item) => {
        item.isDefault = false;
      });
    }

    const address = {
      ...getAddressData(req.body),
      isDefault: makeDefault,
    };

    user.savedAddresses.push(address);

    await user.save();

    const createdAddress =
      user.savedAddresses[user.savedAddresses.length - 1];

    return res.status(201).json({
      success: true,
      message: 'Delivery address saved successfully.',
      address: createdAddress,
      addresses: user.savedAddresses,
    });
  } catch (error) {
    console.error('Add saved address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to save this delivery address.',
    });
  }
};

const updateSavedAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID.',
      });
    }

    const validationError = validateAddress(req.body, true);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const address = user.savedAddresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Saved delivery address not found.',
      });
    }

    const addressData = getAddressData(req.body);

    Object.assign(address, addressData);

    if (req.body.isDefault === true) {
      user.savedAddresses.forEach((item) => {
        item.isDefault = item._id.equals(address._id);
      });
    } else if (req.body.isDefault === false && address.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Choose another default address first.',
      });
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Delivery address updated successfully.',
      address,
      addresses: user.savedAddresses,
    });
  } catch (error) {
    console.error('Update saved address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to update this delivery address.',
    });
  }
};

const deleteSavedAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID.',
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const address = user.savedAddresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Saved delivery address not found.',
      });
    }

    const wasDefault = address.isDefault;

    address.deleteOne();

    if (wasDefault && user.savedAddresses.length > 0) {
      user.savedAddresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Delivery address deleted successfully.',
      addresses: user.savedAddresses,
    });
  } catch (error) {
    console.error('Delete saved address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to delete this delivery address.',
    });
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.addressId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address ID.',
      });
    }

    const user = await User.findById(getUserId(req));

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
    }

    const address = user.savedAddresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Saved delivery address not found.',
      });
    }

    user.savedAddresses.forEach((item) => {
      item.isDefault = item._id.equals(address._id);
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Default delivery address updated.',
      addresses: user.savedAddresses,
    });
  } catch (error) {
    console.error('Set default address error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to set the default delivery address.',
    });
  }
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,

  getPhoneNumbers,
  addPhoneNumber,
  updatePhoneNumber,
  deletePhoneNumber,
  setPrimaryPhoneNumber,

  getSavedAddresses,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
};