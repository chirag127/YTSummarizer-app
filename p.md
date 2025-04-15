To enable your **React Native Expo app** to receive YouTube links shared from the **native YouTube app** or **browser via the OS share sheet** (on **Android**, ), you need to:

---

## ✅ Goal
Allow users to **share a YouTube video link from other apps** (like YouTube or a browser), have your app appear in the share menu, and **automatically receive the shared link, populate the input field, and start summary generation**.

---

## ⚙️ How to Implement (Android-focused)

### 1. **Use `react-native-share-menu`**
This library lets you receive data when a user shares content into your app.

### 🔧 Installation (Expo-compatible)
```bash
npx expo install react-native-share-menu
```

> ⚠️ `react-native-share-menu` works with **Expo development builds** using EAS (bare workflow is not required, but you do need a custom dev client).

---

### 2. **Configure AndroidManifest.xml**
Modify `android/app/src/main/AndroidManifest.xml` inside your custom dev client with the following:

```xml
<activity android:name=".MainActivity" ... >
    <intent-filter>
        <action android:name="android.intent.action.SEND"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <data android:mimeType="text/plain"/>
    </intent-filter>
</activity>
```

> This registers your app to accept **text shares** from other apps.

---

### 3. **Handle Incoming Shared Content**
In your main screen component (or entry screen), use `useEffect` to listen for shared links:

```js
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import ShareMenu from 'react-native-share-menu';

export default function HomeScreen() {
  const [sharedLink, setSharedLink] = useState(null);

  useEffect(() => {
    ShareMenu.getInitialShare((item) => {
      if (!item) return;

      if (item.mimeType === 'text/plain' && item.data) {
        const link = item.data;
        setSharedLink(link);
        if (isYouTubeLink(link)) {
          startSummarization(link); // Your summarization handler
        } else {
          Alert.alert("Invalid Link", "Only YouTube links are supported.");
        }
      }
    });
  }, []);

  const isYouTubeLink = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const startSummarization = (url) => {
    // Populate input field, trigger fetch, update state, etc.
  };

  return (
    // Your screen JSX here
  );
}
```

---

### 4. **Optional: Populate Input Field**
If your UI has a visible text input for pasting YouTube links, you can programmatically set its value using a `ref` or state.

---

### 5. **iOS Note**
iOS support is not necessary.

Users must be able to share a YouTube video link directly from the native YouTube application (/Android) or web browser (via OS share sheet) into this app. Receiving a shared link should automatically populate the input field and initiate the summarization process