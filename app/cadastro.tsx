import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

const COLORS = {
    background: '#363B4E',  
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    inputBg: 'rgba(0, 0, 0, 0.2)', 
    text: '#FFFFFF',
    success: '#69F0AE',
    error: '#FF5252'
};

interface CustomInputProps {
    iconName: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
    fieldKey: string;
    focusedId: string | null;
    setFocusedId: (id: string | null) => void;
}

const CustomInput = ({ 
    iconName, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry = false,
    keyboardType = 'default',
    fieldKey,
    focusedId,
    setFocusedId
}: CustomInputProps) => {
    const isFocused = focusedId === fieldKey;

    return (
        <View style={[styles.inputContainer, isFocused && styles.inputContainerFocused]}>
            <Ionicons 
                name={iconName} 
                size={20} 
                color={isFocused ? COLORS.accent : COLORS.highlight} 
                style={styles.inputIcon}
            />
            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.highlight}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                onFocus={() => setFocusedId(fieldKey)}
                onBlur={() => setFocusedId(null)}
                cursorColor={COLORS.accent}
            />
        </View>
    );
};

const GenderButton = ({ 
    label, 
    value, 
    selectedValue, 
    onSelect 
}: { 
    label: string, 
    value: number, 
    selectedValue: number, 
    onSelect: (v: number) => void 
}) => {
    const isSelected = selectedValue === value;
    return (
        <TouchableOpacity 
            style={[styles.genderBtn, isSelected && styles.genderBtnSelected]}
            onPress={() => onSelect(value)}
            activeOpacity={0.7}
        >
            <Text style={[styles.genderText, isSelected && styles.genderTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
};

const PasswordRequirement = ({ label, met }: { label: string, met: boolean }) => (
    <View style={styles.reqContainer}>
        <Ionicons 
            name={met ? "checkmark-circle" : "ellipse-outline"} 
            size={14} 
            color={met ? COLORS.success : COLORS.highlight} 
            style={{ opacity: met ? 1 : 0.5 }}
        />
        <Text style={[styles.reqText, { color: met ? COLORS.success : COLORS.highlight, opacity: met ? 1 : 0.6 }]}>
            {label}
        </Text>
    </View>
);

export default function CadastroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataNascimento, setDataNascimento] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [genero, setGenero] = useState(0); 
  const [steamId, setSteamId] = useState('');

  const [campoFocado, setCampoFocado] = useState<string | null>(null);

  const [senhaValida, setSenhaValida] = useState(false);
  const reqs = {
      min6: senha.length >= 6,
      upper: /[A-Z]/.test(senha),
      lower: /[a-z]/.test(senha),
      number: /[0-9]/.test(senha),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(senha)
  };

  useEffect(() => {
      const isValid = Object.values(reqs).every(r => r === true);
      setSenhaValida(isValid);
  }, [senha]);


  const formatarDataVisual = (date: Date) => {
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatarDataBackend = (date: Date) => {
    const ano = date.getFullYear();
    const mes = (date.getMonth() + 1).toString().padStart(2, '0');
    const dia = date.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const onChangeDate = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || dataNascimento;
    setShowDatePicker(Platform.OS === 'ios');
    setDataNascimento(currentDate);
    
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
  };

  async function handleCadastro() {
     if (!nome.trim() || !email.trim() || !senha.trim()) {
      Alert.alert("Campos Obrigatórios", "Por favor, preencha Nome, E-mail, Senha e Data de Nascimento.");
      return;
    }

    if (!senhaValida) {
        Alert.alert("Senha Fraca", "Sua senha precisa atender a todos os requisitos listados.");
        return;
    }

    setLoading(true);

    try {
      const dataFormatada = formatarDataBackend(dataNascimento);

      const usuarioDTO = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha: senha.trim(),
        dataNascimento: dataFormatada, 
        genero: genero,
        telefone: telefone,
        imagemPerfil: '',
        steamId: steamId
      };

      await api.post('/api/Usuario', usuarioDTO); 
      
      const loginPayload = {
          email: email.trim().toLowerCase(),
          senha: senha.trim()
      };

      const loginResponse = await api.post('/api/Login/login', loginPayload);
      const usuarioLogado = loginResponse.data;

      await AsyncStorage.setItem('usuario_logado', JSON.stringify(usuarioLogado));

      Alert.alert("Bem-vindo!", `Olá, ${nome.split(' ')[0]}! Sua conta foi criada com sucesso.`);
      router.replace('/(tabs)/home'); 

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data ? String(error.response.data) : "Falha ao criar conta. Verifique os dados.";
      Alert.alert("Erro", msg);
    } finally {
        setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        <View style={[styles.header, { marginTop: insets.top }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={COLORS.highlight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Criar Conta</Text>
            <View style={{width: 40}} /> 
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
        >
          <ScrollView 
            contentContainerStyle={[
                styles.scrollContent, 
                { paddingBottom: insets.bottom + 40 }
            ]} 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.card}>
                <Text style={styles.sectionLabel}>Dados Pessoais</Text>
                
                <CustomInput 
                    fieldKey="nome"
                    iconName="person-outline"
                    placeholder="Nome Completo *"
                    value={nome}
                    onChangeText={setNome}
                    focusedId={campoFocado}
                    setFocusedId={setCampoFocado}
                />
                
                <TouchableOpacity 
                    style={[styles.inputContainer, { marginBottom: 12 }]} 
                    onPress={() => setShowDatePicker(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="calendar-outline" size={20} color={COLORS.highlight} style={styles.inputIcon} />
                    <Text style={[styles.input, { textAlignVertical: 'center', lineHeight: 22, color: COLORS.text }]}>
                        {formatarDataVisual(dataNascimento)}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                        testID="dateTimePicker"
                        value={dataNascimento}
                        mode="date"
                        display="default"
                        onChange={onChangeDate}
                        maximumDate={new Date()}
                    />
                )}

                <CustomInput 
                    fieldKey="telefone"
                    iconName="call-outline"
                    placeholder="Celular"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                    focusedId={campoFocado}
                    setFocusedId={setCampoFocado}
                />

                <Text style={styles.label}>Gênero *</Text>
                <View style={styles.genderContainer}>
                    <GenderButton label="Masculino" value={0} selectedValue={genero} onSelect={setGenero} />
                    <GenderButton label="Feminino" value={1} selectedValue={genero} onSelect={setGenero} />
                    <GenderButton label="Outro" value={2} selectedValue={genero} onSelect={setGenero} />
                </View>

                <Text style={styles.sectionLabel}>Acesso</Text>
                <CustomInput 
                    fieldKey="email"
                    iconName="mail-outline"
                    placeholder="E-mail *"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    focusedId={campoFocado}
                    setFocusedId={setCampoFocado}
                />
                <CustomInput 
                    fieldKey="senha"
                    iconName="lock-closed-outline"
                    placeholder="Senha *"
                    value={senha}
                    onChangeText={setSenha}
                    secureTextEntry={true}
                    focusedId={campoFocado}
                    setFocusedId={setCampoFocado}
                />

                <View style={styles.passwordRulesContainer}>
                    <PasswordRequirement label="Mínimo de 6 caracteres" met={reqs.min6} />
                    <PasswordRequirement label="Ao menos uma letra maiúscula" met={reqs.upper} />
                    <PasswordRequirement label="Ao menos uma letra minúscula" met={reqs.lower} />
                    <PasswordRequirement label="Ao menos um número" met={reqs.number} />
                    <PasswordRequirement label="Ao menos um caractere especial (!@#...)" met={reqs.special} />
                </View>

                <Text style={styles.sectionLabel}>Integração (Opcional)</Text>
                <CustomInput 
                    fieldKey="steam"
                    iconName="logo-steam"
                    placeholder="Steam ID"
                    value={steamId}
                    onChangeText={setSteamId}
                    keyboardType="number-pad"
                    focusedId={campoFocado}
                    setFocusedId={setCampoFocado}
                />

                <TouchableOpacity 
                    style={[styles.button, !senhaValida && { opacity: 0.5 }]} 
                    onPress={handleCadastro}
                    disabled={loading}
                    activeOpacity={0.8}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CRIAR CONTA</Text>}
                </TouchableOpacity>

            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingBottom: 50 },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: COLORS.inputBg 
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },

  scrollContent: { paddingHorizontal: 20 },
  
  card: {
    width: '100%',
    marginBottom: 20
  },
  
  sectionLabel: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: COLORS.accent, 
    textTransform: 'uppercase', 
    marginBottom: 12, 
    marginTop: 10, 
    letterSpacing: 1 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: COLORS.highlight, 
    marginBottom: 8,
    marginTop: 5
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent', 
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputContainerFocused: {
    borderColor: COLORS.accent, 
    backgroundColor: 'rgba(0,0,0,0.3)' 
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 15,
    height: '100%'
  },
  
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 8 },
  genderBtn: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 8, 
    paddingVertical: 12, 
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBg
  },
  genderBtnSelected: { 
    backgroundColor: COLORS.primary, 
    borderColor: COLORS.primary 
  },
  genderText: { fontSize: 13, color: COLORS.highlight, fontWeight: '500' },
  genderTextSelected: { color: '#fff', fontWeight: 'bold' },

  passwordRulesContainer: {
      marginTop: -5,
      marginBottom: 15,
      paddingLeft: 5
  },
  reqContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4
  },
  reqText: {
      marginLeft: 8,
      fontSize: 12
  },

  button: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 8, 
    marginTop: 25, 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 },
});