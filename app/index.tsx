import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Text, TouchableOpacity, View, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import api from '../src/services/api'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);

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
            router.replace('/(tabs)/home');

        } catch (error: any) {
            console.error("Erro no Login:", error);
            
            if (error.response) {
                const mensagemErro = typeof error.response.data === 'string' 
                    ? error.response.data 
                    : "E-mail ou senha incorretos.";
                
                Alert.alert("Erro de Login", mensagemErro);
            } else if (error.request) {
                Alert.alert("Erro de Conexão", "Não foi possível conectar ao servidor. Verifique sua internet.");
            } else {
                Alert.alert("Erro", "Ocorreu um erro inesperado.");
            }
        } finally {
            setLoading(false);
        }
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
    button: { 
        backgroundColor: '#6200ee', 
        padding: 16, 
        borderRadius: 8, 
        marginTop: 10, 
        alignItems: 'center' 
    },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    linkText: { color: '#6200ee', textAlign: 'center', fontSize: 14 }
});