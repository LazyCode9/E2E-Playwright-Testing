import { test, expect } from '@playwright/test';

test.use({ ignoreHTTPSErrors: true });

const baseURL = 'https://api.eventhub.rahulshettyacademy.com/api';
const email = process.env.EVENTHUB_API_EMAIL || 'enma@gmail.com';
const password = process.env.EVENTHUB_API_PASSWORD || 'Zorojur0!';

async function login(api) {
  const response = await api.post(`${baseURL}/auth/login`, {
    data: { email, password },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.token).toBeTruthy();
  return body.token;
}

async function createEvent(api, token, suffix) {
  const response = await api.post(`${baseURL}/events`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title: `Playwright API ${suffix}`,
      description: 'Temporary event created by the Playwright API suite',
      category: 'Conference',
      venue: 'Automated Test Venue',
      city: 'Test City',
      eventDate: '2027-06-15T18:00:00.000Z',
      price: 125,
      totalSeats: 20,
      imageUrl: 'https://example.com/playwright-event.jpg',
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.id).toBeGreaterThan(0);
  return body.data;
}

test('Api health reports', async ({ request: api }) => {
  const healthResponse = await api.get(`${baseURL}/health`);
  expect(healthResponse.status()).toBe(200);
  const health = await healthResponse.json();
  expect(health.status).toBe('ok');
  expect(health.dbStatus).toBe('connected');

  const configResponse = await api.get(`${baseURL}/config`);
  expect(configResponse.status()).toBe(200);
  const config = await configResponse.json();
  expect(config).toHaveProperty('showExploreLinks');
});

test('Authentication Test', async ({ request: api }) => {
  const anonymousResponse = await api.get(`${baseURL}/auth/me`);
  expect(anonymousResponse.status()).toBe(401);

  const token = await login(api);
  const meResponse = await api.get(`${baseURL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(meResponse.status()).toBe(200);
  const me = await meResponse.json();
  expect(me.success).toBe(true);
  expect(me.user.email).toBe(email);
});

test('Event listing API ', async ({ request: api }) => {
  const token = await login(api);
  const headers = { Authorization: `Bearer ${token}` };

  const listResponse = await api.get(`${baseURL}/events`, { headers });
  expect(listResponse.status()).toBe(200);
  const list = await listResponse.json();
  expect(list.success).toBe(true);
  expect(Array.isArray(list.data)).toBe(true);
  expect(list.pagination.total).toBeGreaterThanOrEqual(list.data.length);
  expect(list.pagination.page).toBe(1);
  expect(list.pagination.limit).toBeGreaterThan(0);

  const knownEvent = list.data.find((event) => event.id > 0);
  expect(knownEvent).toBeTruthy();

  const detailResponse = await api.get(`${baseURL}/events/${knownEvent.id}`, { headers });
  expect(detailResponse.status()).toBe(200);
  const detail = await detailResponse.json();
  expect(detail.data.id).toBe(knownEvent.id);
  expect(detail.data.availableSeats).toBeLessThanOrEqual(detail.data.totalSeats);

  const missingResponse = await api.get(`${baseURL}/events/999999999`, { headers });
  expect(missingResponse.status()).toBe(404);
  const missing = await missingResponse.json();
  expect(missing.success).toBe(false);
});

test('Test authenticated user can create, update, and delete an event', async ({ request: api }) => {
  const token = await login(api);
  const headers = { Authorization: `Bearer ${token}` };
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  let event;

  try {
    event = await createEvent(api, token, suffix);

    const updateResponse = await api.put(`${baseURL}/events/${event.id}`, {
      headers,
      data: {
        title: `Playwright API Updated ${suffix}`,
        description: 'Updated by the Playwright API suite',
        category: 'Conference',
        venue: 'Updated Test Venue',
        city: 'Updated Test City',
        eventDate: '2027-06-16T18:00:00.000Z',
        price: 150,
        totalSeats: 25,
        imageUrl: 'https://example.com/playwright-event-updated.jpg',
      },
    });
    expect(updateResponse.status()).toBe(200);
    const updated = await updateResponse.json();
    expect(updated.data.title).toContain('Updated');
    expect(updated.data.price).toBe('150');
    expect(updated.data.totalSeats).toBe(25);

    const detailResponse = await api.get(`${baseURL}/events/${event.id}`, { headers });
    expect(detailResponse.status()).toBe(200);
  } finally {
    if (event) {
      await api.delete(`${baseURL}/events/${event.id}`, { headers });
    }
  }

  const deletedResponse = await api.get(`${baseURL}/events/${event.id}`, { headers });
  expect(deletedResponse.status()).toBe(404);
});

test('Book & Cancell', async ({ request: api }) => {
  const token = await login(api);
  const headers = { Authorization: `Bearer ${token}` };
  const suffix = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const event = await createEvent(api, token, suffix);
  let booking;

  try {
    const bookingResponse = await api.post(`${baseURL}/bookings`, {
      headers,
      data: {
        eventId: event.id,
        customerName: 'Playwright API Customer',
        customerEmail: 'playwright-api@example.com',
        customerPhone: '+15550001111',
        quantity: 3,
      },
    });
    expect(bookingResponse.status()).toBe(201);
    const bookingBody = await bookingResponse.json();
    booking = bookingBody.data;
    expect(booking.status).toBe('confirmed');
    expect(booking.quantity).toBe(3);
    expect(booking.totalPrice).toBe('375');
    expect(booking.bookingRef).toMatch(/^[A-Z]-[A-Z0-9]+$/);

    const eventAfterBooking = await api.get(`${baseURL}/events/${event.id}`, { headers });
    expect(eventAfterBooking.status()).toBe(200);
    const reservedEvent = await eventAfterBooking.json();
    expect(reservedEvent.data.availableSeats).toBe(event.availableSeats - 3);

    const refResponse = await api.get(`${baseURL}/bookings/ref/${booking.bookingRef}`, { headers });
    expect(refResponse.status()).toBe(200);
    const refBody = await refResponse.json();
    expect(refBody.data.id).toBe(booking.id);

    const cancelResponse = await api.delete(`${baseURL}/bookings/${booking.id}`, { headers });
    expect(cancelResponse.status()).toBe(200);
    booking = null;

    const eventAfterCancel = await api.get(`${baseURL}/events/${event.id}`, { headers });
    expect(eventAfterCancel.status()).toBe(200);
    const restoredEvent = await eventAfterCancel.json();
    expect(restoredEvent.data.availableSeats).toBe(event.availableSeats);
  } finally {
    if (booking) {
      await api.delete(`${baseURL}/bookings/${booking.id}`, { headers });
    }
    await api.delete(`${baseURL}/events/${event.id}`, { headers });
  }
});
