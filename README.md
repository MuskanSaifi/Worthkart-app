# WorthKart Mobile (Expo)

React Native app for WorthKart. Same website backend APIs use hoti hain (`E:\\worthkart\\website`).

## Run (Expo Go)

1. Website chalao (alag terminal):

```powershell
cd E:\worthkart\website
npm run dev
```

2. App chalao:

```powershell
cd E:\worthkart\app
npm start
```

3. Phone pe **Expo Go** app kholo, QR scan karo.

## Important

- Phone aur PC same Wi‑Fi pe hone chahiye.
- App **Expo SDK 54** pe hai — yehi App Store / Play Store wale Expo Go se match karta hai.
- `.env` mein `EXPO_PUBLIC_API_URL` LAN IP set karo (abhi `http://192.168.1.146:3000`).
- IP change ho to `.env` + `app.json` → `extra.apiUrl` update karo, phir Expo restart.

## Screens

- Home (header, category strip, banners, deals)
- Categories (full category tree + Offer Zone)
- Search / sort filters
- Product detail (wishlist + add to cart / buy now)
- Cart (qty, totals, checkout CTA)
- Wishlist, Orders, Help
- Account hub (profile, orders, wishlist, seller, support)
- Login OTP
