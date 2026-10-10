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
  Image,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { BlurView } from 'expo-blur';

// Cấu hình Notification Handler để hiển thị banner, phát chuông & cập nhật badge
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  // --- STATE DỮ LIỆU GIAO DỊCH CHUẨN MB BANK ---
  const [transactionType, setTransactionType] = useState('plus'); // 'plus' (+) hoặc 'minus' (-)
  const [accountNumber, setAccountNumber] = useState('0123456789');
  const [amount, setAmount] = useState('5000000');
  const [balance, setBalance] = useState('52500000');
  const [counterpartyName, setCounterpartyName] = useState('NGUYEN VAN A');
  const [counterpartyAccount, setCounterpartyAccount] = useState('0987654321');
  const [content, setContent] = useState('NGUYEN VAN A chuyen tien');
  const [badgeCount, setBadgeCount] = useState('1'); // Mặc định 1 thông báo mới
  
  // Hẹn giờ gửi
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdownRemaining, setCountdownRemaining] = useState(0);
  
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(null);

  const countdownTimerRef = useRef(null);

  useEffect(() => {
    // Xin quyền nhận thông báo ngay khi mở ứng dụng
    requestNotificationPermissions();

    return () => {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, []);

  // Yêu cầu quyền thông báo iOS
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

      setPermissionGranted(finalStatus === 'granted');
      return finalStatus === 'granted';
    } catch (e) {
      console.error('Lỗi xin quyền:', e);
      return false;
    }
  };

  // Định dạng ngày giờ: DD/MM/YY HH:mm (VD: 10/10/26 15:00)
  const getFormattedDateTime = () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yy} ${hh}:${min}`;
  };

  // Format số tiền có dấu phẩy hàng nghìn
  const formatNumber = (numStr) => {
    if (!numStr) return '0';
    const clean = numStr.toString().replace(/\D/g, '');
    return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Tạo chuỗi nội dung biến động số dư theo chuẩn MB Bank
  const buildNotificationBody = () => {
    const sign = transactionType === 'minus' ? '-' : '+';
    const formattedAmount = formatNumber(amount);
    const formattedBalance = formatNumber(balance);
    const timeStr = getFormattedDateTime();
    const direction = transactionType === 'minus' ? 'DEN' : 'TU';
    const cleanName = (counterpartyName || '').toUpperCase();

    return `TK ${accountNumber} | GD: ${sign}${formattedAmount}VND ${timeStr} | SD: ${formattedBalance}VND | ${direction}: ${cleanName} - ${counterpartyAccount} | ND: ${content}`;
  };

  // Kích hoạt thông báo (Ngay lập tức hoặc hẹn giờ)
  const scheduleNotification = async (seconds) => {
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert('Chưa cấp quyền', 'Vui lòng vào Cài đặt iOS -> Cho phép thông báo để sử dụng!');
      return;
    }

    const title = 'Thông báo biến động số dư';
    const body = buildNotificationBody();
    const badgeNum = parseInt(badgeCount, 10) || 1;

    try {
      // Đặt số badge trên icon app
      await Notifications.setBadgeCountAsync(badgeNum);

      if (seconds > 0) {
        // Hẹn giờ sau X giây
        setIsCountingDown(true);
        setCountdownRemaining(seconds);

        countdownTimerRef.current = setInterval(() => {
          setCountdownRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimerRef.current);
              setIsCountingDown(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'default',
            badge: badgeNum,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: seconds,
          },
        });

        Alert.alert(
          'Đã kích hoạt hẹn giờ!',
          `Thông báo sẽ xuất hiện sau ${seconds} giây. Bạn có thể KHÓA MÀN HÌNH ngay bây giờ để chờ chuông reo và sáng màn hình!`
        );
      } else {
        // Gửi ngay lập tức
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            sound: 'default',
            badge: badgeNum,
          },
          trigger: null,
        });

        const now = new Date();
        setLastSentTime(
          `${now.getHours().toString().padStart(2, '0')}:${now
            .getMinutes()
            .toString()
            .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
        );
      }
      Keyboard.dismiss();
    } catch (e) {
      Alert.alert('Lỗi tạo thông báo', e.message || 'Không thể tạo thông báo.');
    }
  };

  // Hủy hẹn giờ
  const cancelCountdown = async () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    setIsCountingDown(false);
    setCountdownRemaining(0);
    Alert.alert('Đã hủy', 'Đã hủy lịch hẹn giờ thông báo.');
  };

  // Nạp mẫu nhanh chuẩn MB Bank
  const loadPreset = (type) => {
    if (type === 'plus_5m') {
      setTransactionType('plus');
      setAccountNumber('0123456789');
      setAmount('5000000');
      setBalance('52500000');
      setCounterpartyName('NGUYEN VAN A');
      setCounterpartyAccount('0987654321');
      setContent('NGUYEN VAN A chuyen tien');
      setBadgeCount('1');
    } else if (type === 'plus_50m') {
      setTransactionType('plus');
      setAccountNumber('0123456789');
      setAmount('50000000');
      setBalance('152500000');
      setCounterpartyName('NGUYEN VAN A');
      setCounterpartyAccount('0987654321');
      setContent('NGUYEN VAN A thanh toan hop dong');
      setBadgeCount('1');
    } else if (type === 'minus_200k') {
      setTransactionType('minus');
      setAccountNumber('0123456789');
      setAmount('200000');
      setBalance('52300000');
      setCounterpartyName('NGUYEN VAN A');
      setCounterpartyAccount('0987654321');
      setContent('Thanh toan tien hang');
      setBadgeCount('1');
    } else if (type === 'minus_2m') {
      setTransactionType('minus');
      setAccountNumber('0123456789');
      setAmount('2000000');
      setBalance('50500000');
      setCounterpartyName('NGUYEN VAN A');
      setCounterpartyAccount('0987654321');
      setContent('Chuyen tien mua sam');
      setBadgeCount('1');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Ánh sáng nền Glassmorphism MB Bank Navy & Red */}
      <View style={[styles.glowOrb, styles.orbTop]} />
      <View style={[styles.glowOrb, styles.orbBottom]} />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header thương hiệu MB Bank */}
            <View style={styles.header}>
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: permissionGranted ? '#10b981' : '#f59e0b' },
                  ]}
                />
                <Text style={styles.badgeText}>
                  {permissionGranted ? 'MB Bank • Sẵn Sàng' : 'Chờ Cấp Quyền iOS'}
                </Text>
              </View>
              <Text style={styles.appTitle}>MB BANK</Text>
              <Text style={styles.appSubtitle}>Thông Báo Biến Động Số Dư • iOS Physical Device</Text>
            </View>

            {/* PREVIEW KHUNG THÔNG BÁO IOS THỜI GIAN THỰC */}
            <View style={styles.previewContainer}>
              <Text style={styles.sectionHeaderTitle}>XEM TRƯỚC BANNER THÔNG BÁO (IOS PREVIEW)</Text>
              <View style={styles.iosNotificationBanner}>
                {/* Icon App MB Bank chính thức */}
                <View style={styles.bannerIconWrapper}>
                  <View style={styles.bannerIcon}>
                    <Image
                      source={require('./assets/icon.png')}
                      style={styles.bannerIconImage}
                      resizeMode="cover"
                    />
                    <View style={styles.badgeSmall}>
                      <Text style={styles.badgeSmallText}>{badgeCount}</Text>
                    </View>
                  </View>
                </View>

                {/* Nội dung Banner */}
                <View style={styles.bannerContent}>
                  <View style={styles.bannerHeader}>
                    <Text style={styles.bannerTitle}>Thông báo biến động số dư</Text>
                    <Text style={styles.bannerTime}>Vừa xong</Text>
                  </View>
                  <Text style={styles.bannerBody} numberOfLines={4}>
                    {buildNotificationBody()}
                  </Text>
                </View>
              </View>
            </View>

            {/* MẪU GIAO DỊCH NHANH */}
            <View style={styles.presetSection}>
              <Text style={styles.sectionHeaderTitle}>MẪU CÓ SẴN (BẤM ĐỂ NẠP NHANH)</Text>
              <View style={styles.presetButtonsRow}>
                <TouchableOpacity
                  style={[styles.presetButton, styles.presetHighlightPlus]}
                  onPress={() => loadPreset('plus_5m')}
                >
                  <Text style={styles.presetButtonText}>💰 Nhận +5Tr</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, styles.presetHighlightPlus]}
                  onPress={() => loadPreset('plus_50m')}
                >
                  <Text style={styles.presetButtonText}>💎 Nhận +50Tr</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, styles.presetHighlightMinus]}
                  onPress={() => loadPreset('minus_200k')}
                >
                  <Text style={styles.presetButtonText}>💸 Chuyển -200K</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetButton, styles.presetHighlightMinus]}
                  onPress={() => loadPreset('minus_2m')}
                >
                  <Text style={styles.presetButtonText}>💳 Chuyển -2Tr</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* FORM TÙY CHỈNH THÔNG TIN BIẾN ĐỘNG SỐ DƯ */}
            <View style={styles.cardContainer}>
              <BlurView intensity={50} tint="dark" style={styles.glassCard}>
                {/* Chọn loại giao dịch: Cộng (+) hoặc Trừ (-) */}
                <Text style={styles.inputLabel}>LOẠI GIAO DỊCH</Text>
                <View style={styles.typeSelectorRow}>
                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      transactionType === 'plus' && styles.typeButtonPlusActive,
                    ]}
                    onPress={() => setTransactionType('plus')}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        transactionType === 'plus' && styles.typeButtonTextActive,
                      ]}
                    >
                      🟢 Nhận tiền ( + )
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.typeButton,
                      transactionType === 'minus' && styles.typeButtonMinusActive,
                    ]}
                    onPress={() => setTransactionType('minus')}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        transactionType === 'minus' && styles.typeButtonTextActive,
                      ]}
                    >
                      🔴 Chuyển tiền ( - )
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Số tiền biến động */}
                <Text style={styles.inputLabel}>SỐ TIỀN GIAO DỊCH (VND)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={[
                      styles.inputField,
                      { color: transactionType === 'minus' ? '#ef4444' : '#10b981', fontWeight: 'bold' },
                    ]}
                    placeholder="VD: 5000000"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={(val) => setAmount(val.replace(/\D/g, ''))}
                  />
                  <Text style={styles.inputUnit}>
                    {transactionType === 'minus' ? '-' : '+'}
                    {formatNumber(amount)} đ
                  </Text>
                </View>

                {/* Số tài khoản & Số dư sau giao dịch */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>SỐ TÀI KHOẢN (TK)</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="VD: 0123456789"
                        placeholderTextColor="#64748b"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                      />
                    </View>
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>SỐ DƯ CÒN LẠI (SD)</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="VD: 52500000"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        value={balance}
                        onChangeText={(val) => setBalance(val.replace(/\D/g, ''))}
                      />
                    </View>
                  </View>
                </View>

                {/* Tên đối tác & STK đối tác */}
                <View style={styles.twoColRow}>
                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>
                      {transactionType === 'minus' ? 'NGƯỜI NHẬN (DEN)' : 'NGƯỜI GỬI (TU)'}
                    </Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="VD: NGUYEN VAN A"
                        placeholderTextColor="#64748b"
                        autoCapitalize="characters"
                        value={counterpartyName}
                        onChangeText={(val) => setCounterpartyName(val.toUpperCase())}
                      />
                    </View>
                  </View>

                  <View style={styles.halfCol}>
                    <Text style={styles.inputLabel}>STK ĐỐI TÁC</Text>
                    <View style={styles.inputBox}>
                      <TextInput
                        style={styles.inputField}
                        placeholder="VD: 0987654321"
                        placeholderTextColor="#64748b"
                        value={counterpartyAccount}
                        onChangeText={setCounterpartyAccount}
                      />
                    </View>
                  </View>
                </View>

                {/* Nội dung giao dịch (ND) */}
                <Text style={styles.inputLabel}>NỘI DUNG CHUYỂN KHOẢN (ND)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="VD: NGUYEN VAN A chuyen tien"
                    placeholderTextColor="#64748b"
                    value={content}
                    onChangeText={setContent}
                  />
                </View>

                {/* Số Badge Icon */}
                <Text style={styles.inputLabel}>SỐ BADGE ĐỎ TRÊN ICON APP (MẶC ĐỊNH 1)</Text>
                <View style={styles.inputBox}>
                  <TextInput
                    style={styles.inputField}
                    placeholder="VD: 1"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={badgeCount}
                    onChangeText={setBadgeCount}
                  />
                </View>

                {/* BỘ NÚT HẸN GIỜ & KÍCH HOẠT THÔNG BÁO */}
                <Text style={[styles.inputLabel, { marginTop: 16 }]}>HẸN GIỜ GỬI THÔNG BÁO</Text>
                <Text style={styles.hintText}>
                  💡 Mẹo: Bấm hẹn giờ (5s hoặc 10s), sau đó KHÓA MÀN HÌNH iPhone để chuông reo và sáng màn hình nhận thông báo!
                </Text>

                {isCountingDown ? (
                  <View style={styles.countdownBox}>
                    <Text style={styles.countdownTitle}>ĐANG ĐẾM NGƯỢC THÔNG BÁO...</Text>
                    <Text style={styles.countdownNumber}>{countdownRemaining}s</Text>
                    <Text style={styles.countdownSub}>Hãy khóa màn hình ngay bây giờ!</Text>
                    <TouchableOpacity style={styles.cancelButton} onPress={cancelCountdown}>
                      <Text style={styles.cancelButtonText}>HỦY HẸN GIỜ</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.timerButtonsGrid}>
                    <TouchableOpacity
                      style={[styles.timerButton, styles.timerButtonInstant]}
                      onPress={() => scheduleNotification(0)}
                    >
                      <Text style={styles.timerButtonTitle}>⚡ Gửi Ngay</Text>
                      <Text style={styles.timerButtonSub}>0 giây</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.timerButton, styles.timerButton5s]}
                      onPress={() => scheduleNotification(5)}
                    >
                      <Text style={styles.timerButtonTitle}>⏱️ Sau 5s</Text>
                      <Text style={styles.timerButtonSub}>Kịp khóa màn hình</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.timerButton, styles.timerButton10s]}
                      onPress={() => scheduleNotification(10)}
                    >
                      <Text style={styles.timerButtonTitle}>⏱️ Sau 10s</Text>
                      <Text style={styles.timerButtonSub}>Chuẩn bị sẵn sàng</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.timerButton, styles.timerButton30s]}
                      onPress={() => scheduleNotification(30)}
                    >
                      <Text style={styles.timerButtonTitle}>⏱️ Sau 30s</Text>
                      <Text style={styles.timerButtonSub}>Hẹn giờ tự động</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {lastSentTime && (
                  <Text style={styles.lastSentNotice}>
                    ✓ Lần gửi gần nhất lúc: {lastSentTime}
                  </Text>
                )}
              </BlurView>
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
    backgroundColor: '#001338',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  // Ánh sáng nền Glassmorphism MB Bank Navy & Red
  glowOrb: {
    position: 'absolute',
    borderRadius: 300,
    opacity: 0.32,
  },
  orbTop: {
    width: 380,
    height: 380,
    top: -60,
    right: -40,
    backgroundColor: '#003082',
  },
  orbBottom: {
    width: 340,
    height: 340,
    bottom: -60,
    left: -40,
    backgroundColor: '#E30613',
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  appSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  // Preview Container (Mô phỏng Banner iOS)
  previewContainer: {
    marginBottom: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  iosNotificationBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(235, 235, 245, 0.92)', // Màu nền banner xám sáng chuẩn iOS
    borderRadius: 18,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  bannerIconWrapper: {
    marginRight: 10,
    justifyContent: 'flex-start',
  },
  bannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  bannerIconImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  badgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#e11d48',
    borderRadius: 10,
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  badgeSmallText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  bannerContent: {
    flex: 1,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
  },
  bannerTime: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '500',
  },
  bannerBody: {
    fontSize: 12.5,
    color: '#1f2937',
    lineHeight: 17,
    fontWeight: '400',
  },
  // Presets Row
  presetSection: {
    marginBottom: 16,
  },
  presetButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  presetButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  presetHighlightPlus: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderColor: '#10b981',
  },
  presetHighlightMinus: {
    backgroundColor: 'rgba(239, 68, 68, 0.22)',
    borderColor: '#ef4444',
  },
  presetButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  // Form Glass Card
  cardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  glassCard: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  hintText: {
    fontSize: 11.5,
    color: '#38bdf8',
    marginBottom: 12,
    lineHeight: 16,
  },
  inputBox: {
    backgroundColor: 'rgba(0, 18, 56, 0.85)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inputField: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13.5,
    padding: 0,
  },
  inputUnit: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  halfCol: {
    flex: 1,
  },
  // Type selector
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  typeButtonPlusActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    borderColor: '#10b981',
  },
  typeButtonMinusActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
  },
  typeButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  // Timer Grid
  timerButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  timerButton: {
    width: '48%',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  timerButtonInstant: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8',
  },
  timerButton5s: {
    backgroundColor: '#0d9488',
    borderColor: '#2dd4bf',
  },
  timerButton10s: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  timerButton30s: {
    backgroundColor: '#4f46e5',
    borderColor: '#818cf8',
  },
  timerButtonTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  timerButtonSub: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
  },
  // Countdown Box
  countdownBox: {
    backgroundColor: 'rgba(13, 148, 136, 0.25)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#2dd4bf',
    marginVertical: 10,
  },
  countdownTitle: {
    color: '#2dd4bf',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  countdownNumber: {
    color: '#ffffff',
    fontSize: 48,
    fontWeight: '900',
    marginVertical: 4,
  },
  countdownSub: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
  },
  lastSentNotice: {
    marginTop: 14,
    textAlign: 'center',
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600',
  },
});
