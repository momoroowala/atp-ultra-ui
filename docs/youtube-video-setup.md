# Video Setup Guide for Secure Embedding

This guide explains how to add videos to course modules with built-in security protections.

## Supported Video Platforms

1. **YouTube** (Recommended for security)
2. **Google Drive**
3. **Vimeo**

---

## YouTube Video Setup (Recommended)

### Why YouTube?
- Built-in privacy-enhanced embedding
- Better security controls
- No storage costs
- Reliable streaming performance

### Step-by-Step Instructions:

1. **Upload Video to YouTube:**
   - Go to [YouTube Studio](https://studio.youtube.com/)
   - Click "Create" → "Upload videos"
   - Upload your course video

2. **Set Video to "Unlisted":**
   - **CRITICAL**: Set visibility to "Unlisted" (NOT Public or Private)
   - This makes the video invisible in YouTube search
   - Only people with the link can view it
   - Accessible through your platform's embed

3. **Copy Video URL:**
   - Click "Share" button
   - Copy the full URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
   - Or use the short URL (e.g., `https://youtu.be/dQw4w9WgXcQ`)

4. **Add to Course Module:**
   - Go to Admin Settings → Plan Management
   - Select the course and phase
   - Edit or create a task/module
   - In "Content Sections", add a Video section
   - Paste the YouTube URL in the "Video URL" field
   - Save

---

## Google Drive Video Setup

### Step-by-Step Instructions:

1. **Upload Video to Google Drive:**
   - Go to [Google Drive](https://drive.google.com/)
   - Upload your video file
   - Right-click the video → "Get link"

2. **Set Sharing Permissions:**
   - Change to "Anyone with the link can view"
   - **Note**: This is less secure than YouTube unlisted videos
   - Google Drive videos can be downloaded by users with technical knowledge

3. **Copy Share Link:**
   - Copy the full Google Drive link
   - Example: `https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view`

4. **Add to Course Module:**
   - Same process as YouTube
   - Paste the Google Drive link in "Video URL" field
   - System will automatically convert it to an embeddable preview

---

## Security Features Applied Automatically

### For YouTube Videos (Custom Secure Player):
✅ **MAXIMUM SECURITY** - Custom player with complete URL protection
✅ No YouTube UI or branding visible
✅ No "Watch on YouTube" button
✅ No channel name displayed
✅ Cannot right-click to copy video URL
✅ Cannot access video URL from player interface
✅ Privacy-enhanced API usage (no tracking cookies)
✅ Unlisted videos won't appear in search
✅ Custom HTML5-style controls (play, pause, seek, volume, fullscreen)
✅ Full keyboard support (space, arrows)
✅ Professional player matching app design

**Security Level: MAXIMUM** - Users have no way to access the video URL or share videos outside the platform through the player interface.

### For Google Drive Videos:
✅ Right-click protection
✅ Cannot be easily shared outside platform
⚠️ **Note**: Google Drive videos can be downloaded by determined users

---

## Best Practices

1. **Use YouTube for maximum security** - Unlisted videos with privacy-enhanced embedding
2. **Never use "Public" visibility** - Always use "Unlisted" for YouTube
3. **Don't share video URLs directly** - Only embed through the platform
4. **Organize videos with clear naming** - Makes admin management easier
5. **Test video playback** - Always preview after adding to ensure it works

---

## Troubleshooting

**Video not displaying:**
- Ensure YouTube video is "Unlisted" (not Private)
- Ensure Google Drive sharing is set to "Anyone with the link"
- Check that URL is copied correctly (full URL, not shortened)

**Video plays on YouTube but not in platform:**
- Check that video is not age-restricted
- Ensure embedding is allowed in YouTube video settings

**Google Drive video not loading:**
- Ensure sharing permissions are set correctly
- Large videos may take time to load (consider YouTube for better performance)
