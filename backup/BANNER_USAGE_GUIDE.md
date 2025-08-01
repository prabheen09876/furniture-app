# Banner Carousel System - Usage Guide

## 🎯 Overview
The banner carousel system is now fully dynamic and controlled through the admin panel. No temporary banners are included - you create all banners through the admin interface.

## 🚀 Setup Instructions

### Step 1: Database Setup
1. **Open Supabase Dashboard** → SQL Editor
2. **Copy and paste** the entire contents of `setup_banner_storage.sql`
3. **Execute the script** to create:
   - `banners` table with proper structure
   - Storage bucket for banner images
   - RLS policies for security
   - Indexes for performance

### Step 2: Access Banner Management
1. **Navigate to Admin Dashboard** (`/admin`)
2. **Click "Banner Management"** in Quick Actions
3. **Start creating your banners**

## 📝 Creating Your First Banner

### Banner Fields:
- **Title** (required): Main banner headline
- **Description** (optional): Subtitle or additional text
- **Image** (required): Banner image (recommended 16:9 aspect ratio)
- **Link URL** (optional): Where banner should navigate when tapped
- **Display Order**: Controls banner sequence (0 = first)
- **Active Status**: Toggle to show/hide banner

### Best Practices:
- **Image Size**: 1200x675px (16:9 ratio) for best results
- **File Format**: JPG, PNG, or WebP
- **File Size**: Keep under 2MB for optimal loading
- **Link URLs**: Use app routes like `/categories`, `/products`, etc.

## 🎨 Banner Carousel Features

### Automatic Behavior:
- **Auto-advances** every 4 seconds when multiple banners exist
- **Pauses** when user interacts, then resumes
- **Smooth fade transitions** between banners
- **Infinite loop** through all active banners

### User Interaction:
- **Horizontal scrolling** with momentum
- **Tap to navigate** to linked content
- **Pagination dots** show current position
- **Responsive design** adapts to screen size

### Empty State:
- **No banners**: Carousel doesn't appear (graceful handling)
- **Loading state**: Shows "Loading banners..." message
- **Single banner**: No auto-advance, just displays the banner

## 📍 Banner Placement
The banner carousel appears at the top of the home page, replacing the previous categories section. Users can still access categories via the "Browse Categories" button below the carousel.

## 🔧 Management Features

### Admin Panel Functions:
- ✅ **Create** new banners with image upload
- ✅ **Edit** existing banner details and images
- ✅ **Delete** banners you no longer need
- ✅ **Toggle** active/inactive status
- ✅ **Reorder** banners by changing display order
- ✅ **Preview** how banners will appear

### Banner Status:
- **Active**: Appears in carousel rotation
- **Inactive**: Hidden from users but saved in database

## 🎯 Usage Examples

### Welcome Banner:
- **Title**: "Welcome to AceQuint"
- **Description**: "Discover premium furniture for your home"
- **Link**: `/categories`
- **Order**: 0 (first)

### Sale Promotion:
- **Title**: "Summer Sale - 50% Off"
- **Description**: "Limited time offer on selected items"
- **Link**: `/categories?filter=sale`
- **Order**: 1

### New Arrivals:
- **Title**: "New Collection"
- **Description**: "Check out our latest furniture pieces"
- **Link**: `/categories?filter=new`
- **Order**: 2

## 🔒 Security & Performance

### Built-in Security:
- **RLS policies** protect banner data
- **Storage policies** secure image uploads
- **Admin-only access** to banner management

### Performance Features:
- **Image optimization** with proper compression
- **Lazy loading** for better performance
- **Efficient caching** of banner data
- **Smooth animations** with native drivers

## 🎨 Customization

### Carousel Settings:
The carousel is configured with optimal defaults:
- **Auto-play interval**: 4 seconds
- **Transition duration**: 300ms fade
- **Scroll behavior**: Smooth with momentum
- **Responsive sizing**: Adapts to screen width

### Styling:
The carousel uses your app's design system:
- **Glassmorphism effects** with blur backgrounds
- **Consistent colors** (#2D1B16, #8B7355, #F5F0E8)
- **Rounded corners** and proper shadows
- **Modern animations** and transitions

## 🚀 Getting Started

1. **Run the SQL setup script** in Supabase
2. **Navigate to Admin Dashboard**
3. **Click "Banner Management"**
4. **Create your first banner**
5. **Check the home page** to see it in action!

The system is now completely dynamic - create beautiful banners to showcase your furniture store's promotions, new arrivals, and featured content!
