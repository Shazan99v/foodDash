
import { Platform } from 'react-native';
import api from './api';

export type RestaurantImageType = 'logo' | 'banner' | 'gallery';

export interface RestaurantImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  file?: Blob;
}

interface RestaurantImageUploadResponse {
  message: string;
  imageUrl: string;
  photoUrl?: string;
}

export async function uploadRestaurantImage(
  asset: RestaurantImageAsset
): Promise<string> {
  if (!asset.uri && !asset.file) {
    throw new Error('Please select an image first.');
  }

  const formData = new FormData();

  const filename =
    asset.fileName ||
    asset.uri?.split('/').pop()?.split('?')[0] ||
    'restaurant-image.jpg';

  const extension = filename.split('.').pop()?.toLowerCase();

  const mimeType =
    asset.mimeType ||
    (extension === 'png'
      ? 'image/png'
      : extension === 'webp'
        ? 'image/webp'
        : 'image/jpeg');

  // PART 2 CONTINUES BELOW

  if (Platform.OS === 'web') {
    let imageBlob: Blob;

    if (asset.file instanceof Blob) {
      imageBlob = asset.file;
    } else {
      if (!asset.uri) {
        throw new Error('Please select an image first.');
      }

      const imageResponse = await fetch(asset.uri);

      if (!imageResponse.ok) {
        throw new Error('Could not read the selected image. Please select it again.');
      }

      imageBlob = await imageResponse.blob();
    }

    if (imageBlob.size === 0) {
      throw new Error('The selected image is empty. Please choose another image.');
    }

    if (imageBlob.size > 5 * 1024 * 1024) {
      throw new Error('Image size must not exceed 5 MB.');
    }

    if (!imageBlob.type || imageBlob.type !== mimeType) {
      imageBlob = new Blob([imageBlob], { type: mimeType });
    }

    formData.append('restaurantImage', imageBlob, filename);
  } else {
    formData.append(
      'restaurantImage',
      {
        uri: asset.uri,
        name: filename,
        type: mimeType,
      } as unknown as Blob
    );
  }

  // PART 3 CONTINUES BELOW

  const response = await api.post<RestaurantImageUploadResponse>(
    '/uploads/restaurant',
    formData,
    {
      // Do not set Content-Type manually.
      // Axios/browser must generate the multipart boundary.
      timeout: 60000,
    }
  );

  const imageUrl = response.data.imageUrl || response.data.photoUrl;

  if (!imageUrl) {
    throw new Error('The server did not return the uploaded image URL.');
  }

  return imageUrl;
}
