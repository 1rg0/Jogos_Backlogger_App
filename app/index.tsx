import AsyncStorage from '@react-native-async-storage/async-storage';
import Checkbox from 'expo-checkbox';
import { Link, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity, View
} from 'react-native';
import api from '../src/services/api';

export default function LoginScreen() {
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingAutoLogin, setLoadingAutoLogin] = useState(true); 
    const [manterConectado, setManterConectado] = useState(false); 

    useEffect(() => {
        verificarLoginAutomatico();
    }, []);

    async function verificarLoginAutomatico() {
        try {
            const usuarioJson = await AsyncStorage.getItem('usuario_logado');
            const deveManterConectado = await AsyncStorage.getItem('manter_conectado');

            if (usuarioJson && deveManterConectado === 'true') {
                const usuario = JSON.parse(usuarioJson);

                try {
                    await api.get(`/api/Usuario/${usuario.id}`);
                    
                    router.replace('/(tabs)/home');
                    return;

                } catch (error) {
                    console.log("Usuário salvo não existe mais no banco.");

                    await AsyncStorage.multiRemove(['usuario_logado', 'manter_conectado']);
                }
            }
        } catch (e) {
            console.error("Erro ao verificar login:", e);
        } finally {
            setLoadingAutoLogin(false);
        }
    }

    async function handleLogin() {
        if (!email.trim() || !senha.trim()) {
            Alert.alert("Campos vazios", "Por favor, preencha e-mail e senha.");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                email: email.trim().toLowerCase(), 
                senha: senha.trim()
            };

            const response = await api.post('/api/Login/login', payload);
            const usuario = response.data;
            
            await AsyncStorage.setItem('usuario_logado', JSON.stringify(usuario));

            if (manterConectado) {
                await AsyncStorage.setItem('manter_conectado', 'true');
            } else {
                await AsyncStorage.removeItem('manter_conectado');
            }

            router.replace('/(tabs)/home');

        } catch (error: any) {
            console.error("Erro no Login:", error);
            if (error.response) {
                const msg = typeof error.response.data === 'string' 
                    ? error.response.data 
                    : "E-mail ou senha incorretos.";
                Alert.alert("Erro de Login", msg);
            } else {
                Alert.alert("Erro", "Ocorreu um erro inesperado. Verifique sua conexão.");
            }
        } finally {
            setLoading(false);
        }
    }

    if (loadingAutoLogin) {
        return (
            <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color="#6200ee" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.title}>Jogos Backlogger</Text>
            
                <Text style={styles.label}>E-mail</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="exemplo@email.com"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                />
                
                <Text style={styles.label}>Senha</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="******"
                    placeholderTextColor="#999"
                    secureTextEntry={true}
                    autoCapitalize="none"
                    value={senha}
                    onChangeText={setSenha}
                />

                <View style={styles.checkboxContainer}>
                    <Checkbox
                        style={styles.checkbox}
                        value={manterConectado}
                        onValueChange={setManterConectado}
                        color={manterConectado ? '#6200ee' : undefined}
                    />
                    <TouchableOpacity onPress={() => setManterConectado(!manterConectado)}>
                        <Text style={styles.checkboxLabel}>Manter conectado</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity 
                    style={styles.button} 
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>ENTRAR</Text>
                    )}
                </TouchableOpacity>

                <Link href="/cadastro" asChild>
                    <TouchableOpacity style={{marginTop: 20}}>
                        <Text style={styles.linkText}>Não tem conta? <Text style={{fontWeight: 'bold'}}>Cadastre-se</Text></Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', justifyContent: 'center', padding: 24 },
    formContainer: { backgroundColor: '#fff', padding: 24, borderRadius: 16, elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 32, color: '#333', textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
    input: { 
        backgroundColor: '#f9f9f9', 
        borderWidth: 1, 
        borderColor: '#eee', 
        borderRadius: 8, 
        padding: 14, 
        fontSize: 16,
        marginBottom: 16,
        color: '#333'
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    checkbox: {
        marginRight: 10,
        borderRadius: 4,
    },
    checkboxLabel: {
        fontSize: 14,
        color: '#555',
    },
    button: { 
        backgroundColor: '#6200ee', 
        padding: 16, 
        borderRadius: 8, 
        marginTop: 5, 
        alignItems: 'center' 
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: '#6200ee', textAlign: 'center', fontSize: 14 }
});