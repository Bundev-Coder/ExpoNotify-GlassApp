import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { BlurView } from 'expo-blur';

// Cấu hình Notification Handler để thông báo hiện banner & phát chuông cả khi app đang mở (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const [message, setMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('⚡ Thông Báo iOS');
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(null);

  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // 1. Cấu hình Channel cho Android (nếu có)
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default Channel',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#00f2fe',
      });
    }

    // 2. Yêu cầu cấp quyền nhận thông báo trên iOS
    requestNotificationPermissions();

    // 3. Lắng nghe thông báo khi nhận được
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Đã nhận thông báo:', notification);
      }
    );

    // 4. Lắng nghe tương tác khi người dùng chạm vào thông báo
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Người dùng tương tác với thông báo:', response);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  // Xử lý xin cấp quyền thông báo chuẩn xác cho hệ điều hành iOS
  const requestNotificationPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
        finalStatus = status;
      }

      if (finalStatus === 'granted') {
        setPermissionGranted(true);
        return true;
      } else {
        setPermissionGranted(false);
        Alert.alert(
          'Quyền bị từ chối',
          'Vui lòng vào Cài đặt (Settings) trên iOS -> Cho phép Ứng dụng gửi thông báo để sử dụng tính năng này.'
        );
        return false;
      }
    } catch (error) {
      console.error('Lỗi khi xin quyền:', error);
      return false;
    }
  };

  // Kích hoạt Local Push Notification ngay lập tức
  const handleSendNotification = async () => {
    const trimmedBody = message.trim();
    if (!trimmedBody) {
      Alert.alert('Chưa nhập nội dung', 'Vui lòng nhập nội dung thông báo vào ô bên dưới!');
      return;
    }

    // Nếu chưa cấp quyền, xin cấp lại lần nữa
    if (!permissionGranted) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    }

    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: notificationTitle.trim() || '⚡ Thông Báo iOS',
          body: trimmedBody,
          sound: 'default',
          data: { sentAt: new Date().toISOString() },
        },
        trigger: null, // Gửi ngay lập tức lập tức (instant)
      });

      const now = new Date();
      setLastSentTime(
        `${now.getHours().toString().padStart(2, '0')}:${now
          .getMinutes()
          .toString()
          .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
      );
      setMessage('');
      Keyboard.dismiss();
    } catch (error) {
      Alert.alert('Lỗi gửi thông báo', error.message || 'Không thể tạo thông báo.');
    }
  };

  // Chọn mẫu tin nhắn nhanh
  const setPresetMessage = (presetTitle, presetBody) => {
    setNotificationTitle(presetTitle);
    setMessage(presetBody);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ánh sáng nền khúc xạ chiều sâu tạo hiệu ứng kính Glassmorphism */}
      <View style={[styles.glowOrb, styles.orbTopRight]} />
      <View style={[styles.glowOrb, styles.orbBottomLeft]} />
      <View style={[styles.glowOrb, styles.orbCenter]} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header thương hiệu */}
            <View style={styles.header}>
              <View style={styles.badgeContainer}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: permissionGranted ? '#10b981' : '#f59e0b' },
                  ]}
                />
                <Text style={styles.badgeText}>
                  {permissionGranted ? 'iOS Notification: Sẵn Sàng' : 'Chờ Cấp Quyền iOS'}
                </Text>
              </View>
              <Text style={styles.appTitle}>NOTIFY GLASS</Text>
              <Text style={styles.appSubtitle}>Local Push Notification • iOS Glassmorphism</Text>
            </View>

            {/* Thẻ Kính Kính Mờ (Glassmorphism Card) */}
            <View style={styles.glassContainerWrapper}>
              <BlurView intensity={Platform.OS === 'ios' ? 45 : 100} tint="dark" style={styles.glassCard}>
                <Text style={styles.cardSectionLabel}>TIÊU ĐỀ THÔNG BÁO</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputTitle}
                    placeholder="VD: ⚡ Cảnh Báo Hệ Thống..."
                    placeholderTextColor="#64748b"
                    value={notificationTitle}
                    onChangeText={setNotificationTitle}
                  />
                </View>

                <Text style={styles.cardSectionLabel}>NỘI DUNG TIN NHẮN</Text>
                <View style={[styles.inputContainer, styles.inputBodyContainer]}>
                  <TextInput
                    style={styles.inputBody}
                    placeholder="Nhập nội dung bạn muốn gửi..."
                    placeholderTextColor="#64748b"
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                {/* Gợi ý mẫu tin nhắn nhanh */}
                <Text style={styles.quickPresetLabel}>Gợi ý nhanh:</Text>
                <View style={styles.quickTagsWrapper}>
                  <TouchableOpacity
                    style={styles.presetTag}
                    onPress={() =>
                      setPresetMessage('🚀 Báo Cáo Tiến Độ', 'Dự án đã hoàn thành các hạng mục theo kế hoạch!')
                    }
                  >
                    <Text style={styles.presetTagText}>🚀 Tiến độ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetTag}
                    onPress={() =>
                      setPresetMessage('🔥 Cảnh Báo Khẩn', 'Phát hiện sự kiện quan trọng cần xử lý ngay!')
                    }
                  >
                    <Text style={styles.presetTagText}>🔥 Khẩn cấp</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.presetTag}
                    onPress={() =>
                      setPresetMessage('✨ Chào Buổi Sáng', 'Chúc bạn một ngày làm việc tràn đầy năng lượng!')
                    }
                  >
                    <Text style={styles.presetTagText}>✨ Chào ngày mới</Text>
                  </TouchableOpacity>
                </View>

                {/* Nút bấm Neon Glow Phát Sáng Màu Xanh Cyan */}
                <TouchableOpacity
                  activeOpacity={0.82}
                  style={styles.neonGlowButton}
                  onPress={handleSendNotification}
                >
                  <Text style={styles.neonButtonText}>GỬI THÔNG BÁO NGAY</Text>
                </TouchableOpacity>

                {lastSentTime && (
                  <View style={styles.footerInfo}>
                    <Text style={styles.footerInfoText}>
                      ✓ Đã gửi thông báo gần nhất lúc: <Text style={styles.highlightTime}>{lastSentTime}</Text>
                    </Text>
                  </View>
                )}
              </BlurView>
            </View>

            {/* Thông tin môi trường */}
            <View style={styles.envInfoContainer}>
              <Text style={styles.envText}>
                Nền tảng: {Platform.OS.toUpperCase()} • Thiết bị thật: {Device.isDevice ? 'Có' : 'Giả lập'}
              </Text>
              <Text style={styles.hintText}>
                Khi bấm nút, thông báo sẽ hiển thị trực tiếp trên thanh thông báo iOS ngay lập tức.
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Nền Dark Mode chuyên nghiệp
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  // Vùng ánh sáng nền (Glow Orbs) phản chiếu qua bề mặt kính
  glowOrb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  orbTopRight: {
    width: 260,
    height: 260,
    top: 40,
    right: -60,
    backgroundColor: '#00f2fe', // Cyan Glow
  },
  orbBottomLeft: {
    width: 280,
    height: 280,
    bottom: 20,
    left: -70,
    backgroundColor: '#8b5cf6', // Purple Glow
  },
  orbCenter: {
    width: 180,
    height: 180,
    top: '40%',
    left: '25%',
    backgroundColor: '#0284c7', // Blue Glow
    opacity: 0.2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 26,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 12,
    color: '#cbd5e1',
    fontWeight: '600',
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  // Container thẻ kính
  glassContainerWrapper: {
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 35,
    elevation: 10,
  },
  glassCard: {
    padding: 24,
    borderRadius: 26,
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // Kính mờ phản quang
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  cardSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  inputContainer: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  inputBodyContainer: {
    minHeight: 100,
    marginBottom: 16,
  },
  inputTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  inputBody: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    textAlignVertical: 'top',
  },
  quickPresetLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
    fontWeight: '500',
  },
  quickTagsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  presetTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetTagText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },
  // Nút bấm phát sáng Neon Glow Cyan
  neonGlowButton: {
    backgroundColor: '#00f2fe',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    // Hiệu ứng Neon Glow (Đổ bóng ánh sáng xanh Cyan cực kỳ bắt mắt)
    shadowColor: '#00f2fe',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 22,
    elevation: 14,
  },
  neonButtonText: {
    color: '#090d16',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  footerInfo: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerInfoText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  highlightTime: {
    color: '#00f2fe',
    fontWeight: '700',
  },
  envInfoContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  envText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  hintText: {
    color: '#475569',
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
});
