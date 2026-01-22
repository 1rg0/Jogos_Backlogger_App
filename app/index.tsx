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
    TouchableOpacity,
    View,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/services/api';

const COLORS = {
    background: '#363B4E',  
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    inputBg: 'rgba(0, 0, 0, 0.2)', 
    text: '#FFFFFF'
};

interface CustomInputProps {
    iconName: keyof typeof Ionicons.glyphMap;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    fieldKey: string;
    focusedId: string | null;
    setFocusedId: (id: string | null) => void;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad';
}

const CustomInput = ({ 
    iconName, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry = false,
    fieldKey,
    focusedId,
    setFocusedId,
    keyboardType = 'default'
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
                autoCapitalize="none"
                keyboardType={keyboardType}
                onFocus={() => setFocusedId(fieldKey)}
                onBlur={() => setFocusedId(null)}
                cursorColor={COLORS.accent}
            />
        </View>
    );
};

export default function LoginScreen() {
    const router = useRouter();
    
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingAutoLogin, setLoadingAutoLogin] = useState(true); 
    const [manterConectado, setManterConectado] = useState(false); 

    const [campoFocado, setCampoFocado] = useState<string | null>(null);

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
            <View style={[styles.container, styles.center]}>
                <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1, backgroundColor: COLORS.background }} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.headerContainer}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="game-controller" size={60} color={COLORS.accent} />
                    </View>
                    <Text style={styles.title}>Jogos Backlogger</Text>
                    <Text style={styles.subtitle}>Um simples organizador de jogos.</Text>
                </View>

                <View style={styles.formCard}>
                    <CustomInput 
                        fieldKey="email"
                        iconName="mail-outline"
                        placeholder="E-mail"
                        value={email}
                        onChangeText={setEmail}
                        focusedId={campoFocado}
                        setFocusedId={setCampoFocado}
                        keyboardType="email-address"
                    />
                    
                    <CustomInput 
                        fieldKey="senha"
                        iconName="lock-closed-outline"
                        placeholder="Senha"
                        value={senha}
                        onChangeText={setSenha}
                        secureTextEntry={true}
                        focusedId={campoFocado}
                        setFocusedId={setCampoFocado}
                    />

                    <View style={styles.checkboxContainer}>
                        <Checkbox
                            style={styles.checkbox}
                            value={manterConectado}
                            onValueChange={setManterConectado}
                            color={manterConectado ? COLORS.primary : COLORS.highlight}
                        />
                        <TouchableOpacity onPress={() => setManterConectado(!manterConectado)}>
                            <Text style={styles.checkboxLabel}>Manter conectado</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                        style={styles.button} 
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>ENTRAR</Text>
                        )}
                    </TouchableOpacity>

                    <Link href="/cadastro" asChild>
                        <TouchableOpacity style={styles.registerLink}>
                            <Text style={styles.linkText}>
                                Não tem conta? <Text style={styles.linkTextBold}>Cadastre-se</Text>
                            </Text>
                        </TouchableOpacity>
                    </Link>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { justifyContent: 'center', alignItems: 'center' },
    
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 24,
        paddingBottom: 50 
    },

    headerContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        width: 100,
        height: 100,
        backgroundColor: COLORS.inputBg,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.primary
    },
    title: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: COLORS.text, 
        textAlign: 'center',
        letterSpacing: 1
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.highlight,
        marginTop: 5,
        opacity: 0.8
    },

    formCard: { 
        width: '100%',
    },
    
    // Inputs
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg, 
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'transparent', 
        marginBottom: 16,
        paddingHorizontal: 12,
        height: 55, 
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
        fontSize: 16,
        height: '100%'
    },

    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 5
    },
    checkbox: {
        marginRight: 10,
        borderRadius: 4,
        borderColor: COLORS.highlight,
        borderWidth: 1
    },
    checkboxLabel: {
        fontSize: 14,
        color: COLORS.highlight,
    },

    button: { 
        backgroundColor: COLORS.primary, 
        padding: 16, 
        borderRadius: 8, 
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6
    },
    buttonText: { 
        color: '#fff', 
        fontWeight: 'bold', 
        fontSize: 16,
        letterSpacing: 0.5
    },

    registerLink: {
        marginTop: 30,
        alignItems: 'center',
        padding: 10
    },
    linkText: { 
        color: COLORS.highlight, 
        fontSize: 14 
    },
    linkTextBold: {
        color: '#fff', 
        fontWeight: 'bold',
        textDecorationLine: 'underline'
    }
});