import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    console.log('Starting booking process for tour:', tourId);

    // 1) Отримати сесію оплати з API
    const session = await axios(`/api/bookings/checkout-session/${tourId}`);

    console.log('Session data:', session.data);

    // 2) Завантажити Stripe.js
    const stripe = await Stripe(
      'pk_test_51RlAP8IZwJC3270FA2mEIlyIjaMdRwkzYYap0uYv92qkO0yCsdQKFQfBXRAE3V2WkeQEMNtoIK0UGyXRbOzVnWAB003c5Af9jk'
    );
    console.log('Stripe loaded:', stripe !== null);

    // 3) Перенаправити на сторінку оплати Stripe
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.error('Full error:', err);
    showAlert('error', err.response?.data?.message || 'Помилка оплати');
  }
};
