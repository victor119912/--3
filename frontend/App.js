import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

// 設定後端 API 網址
const API_URL = 'http://localhost:3000'; // 開發時使用
// 如果在實體手機測試，請改為電腦的區域網路 IP，例如：'http://192.168.1.100:3000'

const Stack = createStackNavigator();

// ==================== 登入頁 ====================
function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('錯誤', '請輸入帳號和密碼');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });

      if (response.data.user_id) {
        Alert.alert('成功', '登入成功！');
        navigation.replace('Main', { userId: response.data.user_id, username });
      }
    } catch (error) {
      Alert.alert('錯誤', error.response?.data?.message || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>搶票成功率模擬器</Text>
        
        <TextInput
          style={styles.input}
          placeholder="帳號"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="密碼"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>登入</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.linkText}>還沒有帳號？點此註冊</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==================== 註冊頁 ====================
function RegisterScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('錯誤', '兩次密碼輸入不一致');
      return;
    }

    if (password.length < 6) {
      Alert.alert('錯誤', '密碼至少需要 6 個字元');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        password
      });

      Alert.alert('成功', '註冊成功！請登入', [
        { text: '確定', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('錯誤', error.response?.data?.message || '註冊失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>註冊新帳號</Text>
        
        <TextInput
          style={styles.input}
          placeholder="帳號"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="密碼 (至少 6 個字元)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="確認密碼"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>註冊</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkText}>返回登入</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ==================== 主頁（模擬頁） ====================
function MainScreen({ route, navigation }) {
  const { userId, username } = route.params;
  
  const [platform, setPlatform] = useState('KKTIX');
  const [entryTime, setEntryTime] = useState('early');
  const [ticketType, setTicketType] = useState('4800');
  const [network, setNetwork] = useState('fast');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/simulate`, {
        platform,
        entry_time: entryTime,
        ticket_type: ticketType,
        network,
        user_id: userId
      });

      setResult(response.data);
    } catch (error) {
      Alert.alert('錯誤', '模擬失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_URL}/logout`);
      navigation.replace('Login');
    } catch (error) {
      navigation.replace('Login');
    }
  };

  const handleGenerateQR = async () => {
    try {
      const ticketData = {
        platform,
        entry_time: entryTime,
        ticket_type: ticketType,
        network,
        user_id: userId,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(`${API_URL}/generate-ticket-qr`, {
        strategy_id: Math.random(),
        user_id: userId,
        ticket_number: `TKT-${Date.now()}`
      });

      navigation.navigate('QRCode', { qrCode: response.data.qrCode });
    } catch (error) {
      Alert.alert('錯誤', '無法生成 QR Code');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>歡迎，{username}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.historyButton}
              onPress={() => navigation.navigate('History', { userId })}
            >
              <Text style={styles.historyButtonText}>歷史紀錄</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>登出</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>搶票成功率模擬</Text>

          <Text style={styles.label}>購票平台</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={platform}
              onValueChange={setPlatform}
              style={styles.picker}
            >
              <Picker.Item label="ibon" value="ibon" />
              <Picker.Item label="KKTIX" value="KKTIX" />
              <Picker.Item label="拓元" value="拓元" />
            </Picker>
          </View>

          <Text style={styles.label}>進場時間</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={entryTime}
              onValueChange={setEntryTime}
              style={styles.picker}
            >
              <Picker.Item label="提早進場 (early)" value="early" />
              <Picker.Item label="準時進場 (ontime)" value="ontime" />
              <Picker.Item label="延遲進場 (late)" value="late" />
            </Picker>
          </View>

          <Text style={styles.label}>票種</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={ticketType}
              onValueChange={setTicketType}
              style={styles.picker}
            >
              <Picker.Item label="3800 區" value="3800" />
              <Picker.Item label="4800 區" value="4800" />
              <Picker.Item label="6800 區" value="6800" />
            </Picker>
          </View>

          <Text style={styles.label}>網路速度</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={network}
              onValueChange={setNetwork}
              style={styles.picker}
            >
              <Picker.Item label="快速 (fast)" value="fast" />
              <Picker.Item label="一般 (normal)" value="normal" />
              <Picker.Item label="慢速 (slow)" value="slow" />
            </Picker>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleSimulate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>開始模擬</Text>
            )}
          </TouchableOpacity>

          {result && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>模擬結果</Text>
              <View style={styles.successRateContainer}>
                <Text style={styles.successRateLabel}>成功率</Text>
                <Text style={[
                  styles.successRateValue,
                  { color: result.success_rate >= 70 ? '#4CAF50' : result.success_rate >= 50 ? '#FF9800' : '#f44336' }
                ]}>
                  {result.success_rate}%
                </Text>
              </View>
              <View style={styles.suggestionContainer}>
                <Text style={styles.suggestionLabel}>建議</Text>
                <Text style={styles.suggestionText}>{result.suggestion}</Text>
              </View>

              <TouchableOpacity 
                style={[styles.button, { marginTop: 15, backgroundColor: '#4CAF50' }]}
                onPress={handleGenerateQR}
              >
                <Text style={styles.buttonText}>生成票券 QR Code</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== QR Code 顯示頁 ====================
function QRCodeScreen({ route, navigation }) {
  const { qrCode } = route.params;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      // 複製 QR Code 圖片 URL
      Alert.alert('成功', 'QR Code 已準備好顯示');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      Alert.alert('錯誤', '複製失敗');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>票券 QR Code</Text>
          
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: qrCode }}
              style={styles.qrImage}
              onError={(error) => Alert.alert('錯誤', '無法載入 QR Code 圖片')}
            />
          </View>

          <Text style={styles.qrDescription}>
            請將此 QR Code 展示給工作人員掃描以驗證票券。
          </Text>

          <TouchableOpacity 
            style={[styles.button, { backgroundColor: '#2196F3' }]}
            onPress={handleCopy}
          >
            <Text style={styles.buttonText}>複製 QR Code</Text>
          </TouchableOpacity>

          {copied && (
            <Text style={styles.copiedText}>已複製！</Text>
          )}

          <TouchableOpacity 
            style={[styles.button, { marginTop: 15, backgroundColor: '#666' }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.buttonText}>返回</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 歷史紀錄頁 ====================
function HistoryScreen({ route }) {
  const { userId } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get(`${API_URL}/history?user_id=${userId}`);
      setHistory(response.data);
    } catch (error) {
      Alert.alert('錯誤', '無法載入歷史紀錄');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>歷史紀錄</Text>
          
          {history.length === 0 ? (
            <Text style={styles.emptyText}>目前沒有任何紀錄</Text>
          ) : (
            history.map((record) => (
              <View key={record.id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyDate}>{formatDate(record.created_at)}</Text>
                  <Text style={[
                    styles.historyRate,
                    { color: record.success_rate >= 70 ? '#4CAF50' : record.success_rate >= 50 ? '#FF9800' : '#f44336' }
                  ]}>
                    {record.success_rate}%
                  </Text>
                </View>
                <View style={styles.historyDetails}>
                  <Text style={styles.historyDetailText}>平台: {record.platform}</Text>
                  <Text style={styles.historyDetailText}>進場: {record.entry_time}</Text>
                  <Text style={styles.historyDetailText}>票種: {record.ticket_type}</Text>
                  <Text style={styles.historyDetailText}>網路: {record.network}</Text>
                </View>
                <Text style={styles.historySuggestion}>{record.suggestion}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================== 主應用程式 ====================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#007AFF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ title: '註冊' }}
        />
        <Stack.Screen 
          name="Main" 
          component={MainScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="History" 
          component={HistoryScreen}
          options={{ title: '歷史紀錄' }}
        />
        <Stack.Screen 
          name="QRCode" 
          component={QRCodeScreen}
          options={{ title: '票券 QR Code' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ==================== 樣式 ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    padding: 20,
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  historyButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 15,
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  resultContainer: {
    marginTop: 30,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  successRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  successRateLabel: {
    fontSize: 18,
    color: '#666',
  },
  successRateValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  suggestionContainer: {
    marginTop: 10,
  },
  suggestionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#666',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  historyCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
  },
  historyRate: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  historyDetails: {
    marginBottom: 10,
  },
  historyDetailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  historySuggestion: {
    fontSize: 14,
    color: '#007AFF',
    fontStyle: 'italic',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    marginTop: 50,
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrImage: {
    width: 300,
    height: 300,
    resizeMode: 'contain',
  },
  qrDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  copiedText: {
    textAlign: 'center',
    color: '#4CAF50',
    fontSize: 14,
    marginTop: 10,
    fontWeight: 'bold',
  },
});
