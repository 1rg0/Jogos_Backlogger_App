import { useRouter } from 'expo-router';
import React, { useState } from 'react';
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
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../src/services/api';

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
  const [imagemPerfil, setImagemPerfil] = useState('');

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
        imagemPerfil: imagemPerfil,
        steamId: steamId
      };

      await api.post('/api/Usuario', usuarioDTO); 
      
      Alert.alert("Sucesso!", "Sua conta foi criada. Faça login para continuar.");
      router.back(); 

    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data ? String(error.response.data) : "Falha ao criar conta. Verifique os dados.";
      Alert.alert("Erro", msg);
    } finally {
        setLoading(false);
    }
  }

  const GenderButton = ({ label, value }: { label: string, value: number }) => (
    <TouchableOpacity 
        style={[styles.genderBtn, genero === value && styles.genderBtnSelected]}
        onPress={() => setGenero(value)}
    >
        <Text style={[styles.genderText, genero === value && styles.genderTextSelected]}>
            {label}
        </Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ 
        flex: 1, 
        backgroundColor: '#f9f9f9', 
        paddingBottom: insets.bottom,
        paddingTop: insets.top
    }}>
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
            <Text style={styles.title}>Crie sua conta</Text>
            <Text style={styles.subtitle}>Preencha os dados para começar sua coleção</Text>

            <Text style={styles.sectionLabel}>Dados Pessoais</Text>
            <TextInput 
                style={styles.input}
                placeholder="Nome Completo *"
                placeholderTextColor="#999"
                value={nome}
                onChangeText={setNome}
            />
            
            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    <TouchableOpacity 
                        style={styles.input} 
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: '#333', fontSize: 16 }}>
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
                </View>

                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder='Celular'
                    placeholderTextColor="#999"
                    value={telefone}
                    onChangeText={setTelefone}
                    keyboardType="phone-pad"
                />
            </View>

            <Text style={styles.label}>Gênero *</Text>
            <View style={styles.genderContainer}>
                <GenderButton label="Masculino" value={0} />
                <GenderButton label="Feminino" value={1} />
                <GenderButton label="Outro" value={2} />
            </View>

            <Text style={styles.sectionLabel}>Acesso</Text>
            <TextInput 
                style={styles.input} 
                placeholder="E-mail *"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput 
                style={styles.input} 
                placeholder="Senha *"
                placeholderTextColor="#999"
                secureTextEntry={true}
                value={senha}
                onChangeText={setSenha}
            />

            <Text style={styles.sectionLabel}>Extras (Opcional)</Text>
            <TextInput
                style={styles.input}
                placeholder='Steam ID'
                placeholderTextColor="#999"
                value={steamId}
                onChangeText={setSteamId}
            />

            <TouchableOpacity 
                style={styles.button} 
                onPress={handleCadastro}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>CRIAR CONTA</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => router.back()}>
                <Text style={styles.linkText}>Já tem uma conta? <Text style={{fontWeight: 'bold'}}>Fazer Login</Text></Text>
            </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  scrollContent: { padding: 20, paddingTop: 40, alignItems: 'center' },
  
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 25 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#aaa', textTransform: 'uppercase', marginBottom: 10, marginTop: 10, letterSpacing: 1 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  
  input: { 
    backgroundColor: '#f9f9f9', 
    borderWidth: 1, 
    borderColor: '#eee', 
    borderRadius: 8, 
    padding: 14, 
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
    justifyContent: 'center' 
  },
  
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  genderContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 8 },
  genderBtn: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    paddingVertical: 10, 
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  genderBtnSelected: { backgroundColor: '#6200ee', borderColor: '#6200ee' },
  genderText: { fontSize: 13, color: '#555' },
  genderTextSelected: { color: '#fff', fontWeight: 'bold' },
  button: { 
    backgroundColor: '#6200ee', 
    padding: 16, 
    borderRadius: 8, 
    marginTop: 20, 
    alignItems: 'center',
    elevation: 2
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  linkButton: { marginTop: 20, padding: 10, alignItems: 'center' },
  linkText: { color: '#6200ee', fontSize: 14 }
});