import type { Restaurant } from '../types/restaurant';

const restaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Burger House',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    cuisine: 'Burgers • Fast Food',
    rating: 4.8,
    deliveryTime: '20-30 min',
    deliveryFee: 'Free delivery',
    priceLevel: '$$',
    isFavorite: false,
    isFeatured: true,
  },
  {
    id: '2',
    name: 'Pizza Corner',
    image:
      'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    cuisine: 'Pizza • Italian',
    rating: 4.7,
    deliveryTime: '25-35 min',
    deliveryFee: 'Rs. 99 delivery',
    priceLevel: '$$',
    isFavorite: false,
    isFeatured: true,
  },
  {
    id: '3',
    name: 'Tokyo Bowl',
    image:
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    cuisine: 'Japanese • Asian',
    rating: 4.9,
    deliveryTime: '30-40 min',
    deliveryFee: 'Free delivery',
    priceLevel: '$$$',
    isFavorite: false,
    isFeatured: false,
  },
  {
    id: '4',
    name: 'Green Bowl',
    image:
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800',
    cuisine: 'Healthy • Salads',
    rating: 4.6,
    deliveryTime: '15-25 min',
    deliveryFee: 'Rs. 79 delivery',
    priceLevel: '$$',
    isFavorite: false,
    isFeatured: false,
  },
  {
    id: '5',
    name: 'Sweet Bakery',
    image:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800',
    cuisine: 'Bakery • Desserts',
    rating: 4.8,
    deliveryTime: '15-25 min',
    deliveryFee: 'Free delivery',
    priceLevel: '$',
    isFavorite: false,
    isFeatured: false,
  },
];

export default restaurants;