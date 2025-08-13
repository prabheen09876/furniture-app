/**
 * Furniture Expo App - Screenshot Capturing Script
 * 
 * This script helps you automate capturing screenshots for the Google Play Store.
 * It provides a checklist of screens to capture and useful tips.
 */

const chalk = require('chalk');

// Print header
console.log(chalk.bgBlue.white.bold('\n FURNITURE EXPO APP - PLAY STORE SCREENSHOT GUIDE \n'));

// Screen checklist
console.log(chalk.yellow.bold('📱 ESSENTIAL SCREENS TO CAPTURE:'));
const screens = [
  { name: 'Home Screen', path: '/app/index.tsx', tips: 'Show categories, banners and featured products' },
  { name: 'Product Details', path: '/app/product/[id].tsx', tips: 'Show a premium furniture item with all details' },
  { name: 'Shopping Cart', path: '/app/cart.tsx', tips: 'Show multiple items with different quantities' },
  { name: 'Checkout Flow', path: '/app/checkout.tsx', tips: 'Show shipping information filled out' },
  { name: 'Categories Page', path: '/app/categories.tsx', tips: 'Show furniture filtering by category' },
  { name: 'User Profile', path: '/app/profile.tsx', tips: 'Show a complete user profile' },
  { name: 'Order History', path: '/app/orders.tsx', tips: 'Show multiple orders with different statuses' },
  { name: 'Settings', path: '/app/settings.tsx', tips: 'Show app settings and customization options' },
];

screens.forEach((screen, index) => {
  console.log(chalk.green(`${index + 1}. ${screen.name}`));
  console.log(chalk.gray(`   File: ${screen.path}`));
  console.log(chalk.cyan(`   Tips: ${screen.tips}`));
  console.log();
});

// Device sizes
console.log(chalk.yellow.bold('📏 REQUIRED SCREENSHOT SIZES:'));
console.log(chalk.green('- Phone: ') + chalk.white('1080 x 1920px (16:9)'));
console.log(chalk.green('- 7-inch tablet: ') + chalk.white('1080 x 1920px (16:9)'));
console.log(chalk.green('- 10-inch tablet: ') + chalk.white('1920 x 1200px (16:10)'));
console.log();

// Tips
console.log(chalk.yellow.bold('💡 TIPS FOR GREAT SCREENSHOTS:'));
console.log(chalk.white('1. Use real content, not placeholder data'));
console.log(chalk.white('2. Show your app in action with realistic scenarios'));
console.log(chalk.white('3. Capture in light mode for better visibility'));
console.log(chalk.white('4. Consider adding text overlays to highlight features'));
console.log(chalk.white('5. Use device frames for a professional look'));
console.log();

// File organization
console.log(chalk.yellow.bold('📂 RECOMMENDED FOLDER STRUCTURE:'));
console.log(chalk.white('store-assets/'));
console.log(chalk.white('├── screenshots/'));
console.log(chalk.white('│   ├── phone/'));
console.log(chalk.white('│   │   ├── 1_home.png'));
console.log(chalk.white('│   │   ├── 2_product_details.png'));
console.log(chalk.white('│   │   └── ...'));
console.log(chalk.white('│   ├── tablet_7/'));
console.log(chalk.white('│   └── tablet_10/'));
console.log(chalk.white('├── feature_graphic.png'));
console.log(chalk.white('└── app_icon.png'));
console.log();

// Capture command
console.log(chalk.yellow.bold('📸 HOW TO CAPTURE:'));
console.log(chalk.white('• Android Studio: Device emulator screenshot button'));
console.log(chalk.white('• Physical Device: Power + Volume Down buttons'));
console.log(chalk.white('• ADB Command: adb shell screencap -p /sdcard/screen.png && adb pull /sdcard/screen.png'));
console.log();

console.log(chalk.bgBlue.white.bold(' GOOD LUCK WITH YOUR PLAY STORE SUBMISSION! '));
console.log();
