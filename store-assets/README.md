# Furniture Expo App - Google Play Store Assets

This directory contains all the necessary assets for publishing your Furniture Expo app to the Google Play Store.

## Screenshot Requirements

### Required Dimensions
- **Phone**: 1080 x 1920px (16:9 aspect ratio)
- **7-inch tablet**: 1080 x 1920px (16:9 aspect ratio)
- **10-inch tablet**: 1920 x 1200px (16:10 aspect ratio)

### Format Requirements
- JPEG or 24-bit PNG (no alpha transparency)
- Maximum file size: 8MB per screenshot
- At least 2 screenshots per device type (up to 8)

## Screenshot Checklist

✅ Place your screenshots in the appropriate device folder:
- `/screenshots/phone/` - Phone screenshots (1080 x 1920px)
- `/screenshots/tablet_7/` - 7-inch tablet screenshots (1080 x 1920px)
- `/screenshots/tablet_10/` - 10-inch tablet screenshots (1920 x 1200px)

## Key Screens to Capture

1. **Home Screen** - Show categories, banners, and featured products
2. **Product Details** - Display a premium furniture item with details, images, and price
3. **Shopping Cart** - Show multiple items with different quantities
4. **Checkout Flow** - Demonstrate the easy checkout process
5. **Categories Page** - Show furniture filtering by category
6. **User Profile** - Display user account information
7. **Order History** - Show order tracking and history
8. **Settings** - Show app settings and privacy policy

## Additional Required Assets

1. **Feature Graphic** (1024 x 500px)
   - Place in `/store-assets/feature_graphic.png`
   - Used as the header image for your store listing

2. **High-resolution App Icon** (512 x 512px)
   - Place in `/store-assets/app_icon.png` 
   - Must be a PNG with transparency

3. **App Screenshots**
   - Add text overlays to highlight key features
   - Use consistent branding and color schemes
   - Showcase real content, not placeholder data

## Tips for Better Screenshots

1. **Use a Physical Device or Emulator**
   ```
   // Run app on device or emulator
   npx expo run:android --variant release
   ```

2. **Use Device Frames**
   - Android Studio's Device Art Generator
   - Online tools like Mockup Generator (https://mockuphone.com)

3. **Add Text Annotations**
   - Highlight key features with short text callouts
   - Use consistent font and color scheme
   - Keep text brief and focused on benefits

4. **Maintain Visual Consistency**
   - Use the same device frame for all screenshots of the same type
   - Maintain consistent lighting and background style
   - Follow your app's color scheme (#2D1B16, #8B7355, #F5F0E8)

## Privacy Policy

Your privacy policy is accessible within the app at `/privacy-policy`. You'll need to provide this URL in the Play Store listing as well.

## Running the Screenshot Helper

We've included a helper script to guide you through capturing screenshots:

```
cd scripts
node capture_screenshots.js
```

Follow the on-screen instructions to systematically capture all required screenshots.
