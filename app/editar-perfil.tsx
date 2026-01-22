import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, 
    TouchableOpacity,
    View,
    StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, { API_URL } from '../src/services/api';
import { UsuarioDetailDTO, UsuarioUpdateDTO } from '../src/types/UsuarioDTO';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
    background: '#363B4E',  
    cardBg: 'rgba(0, 0, 0, 0.25)', 
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    inputBg: 'rgba(0,0,0,0.3)',
    danger: '#EF5350'
};

export default function EditarPerfilScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    
    const [id, setId] = useState<number>(0);
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [steamId, setSteamId] = useState('');
    
    const [imagemPerfil, setImagemPerfil] = useState('');
    const [novaImagem, setNovaImagem] = useState<ImagePicker.ImagePickerAsset | null>(null);

    useEffect(() => {
        carregarDadosAtuais();
    }, []);

    async function carregarDadosAtuais() {
        try {
            const jsonValue = await AsyncStorage.getItem('usuario_logado');
            if (jsonValue != null) {
                const userLogado = JSON.parse(jsonValue);
                setId(userLogado.id);

                const response = await api.get<UsuarioDetailDTO>(`/api/Usuario/${userLogado.id}`);
                const dados = response.data;

                setNome(dados.nome);
                setTelefone(dados.telefone || '');
                setSteamId(dados.steamId || '');
                setImagemPerfil(dados.imagemPerfil || '');
            }
        } catch (error) {
            Alert.alert("Erro", "Falha ao carregar dados do usuário.");
            router.back();
        } finally {
            setLoading(false);
        }
    }

    const escolherImagem = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNovaImagem(result.assets[0]);
        }
    };

    async function handleSalvar() {
        if (!nome.trim()) {
            Alert.alert("Erro", "O nome não pode ficar vazio.");
            return;
        }

        setSalvando(true);
        try {
            let urlFinalDaImagem = imagemPerfil;

            if (novaImagem) {
                const formData = new FormData();
                
                // @ts-ignore
                formData.append('arquivo', {
                    uri: novaImagem.uri,
                    name: 'foto_perfil.jpg',
                    type: 'image/jpeg',
                });

                const uploadResponse = await api.post(`/api/Usuario/${id}/foto`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                
                urlFinalDaImagem = uploadResponse.data.url;
            }

            const payload: UsuarioUpdateDTO = {
                nome: nome.trim(),
                telefone: telefone,
                steamId: steamId,
                imagemPerfil: urlFinalDaImagem
            };

            await api.put(`/api/Usuario/${id}/perfil`, payload);
            
            const jsonValue = await AsyncStorage.getItem('usuario_logado');
            if(jsonValue){
                const user = JSON.parse(jsonValue);
                user.nome = payload.nome;
                await AsyncStorage.setItem('usuario_logado', JSON.stringify(user));
            }

            Alert.alert("Sucesso", "Perfil atualizado!");
            router.back();
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Não foi possível salvar as alterações.");
        } finally {
            setSalvando(false);
        }
    }

    const getImagemUri = () => {
        if (novaImagem) return { uri: novaImagem.uri };
        if (imagemPerfil) return { uri: `${API_URL}${imagemPerfil}` };
        return null; 
    };

    const sourceImagem = getImagemUri();

    if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large"/></View>;

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
            style={{flex: 1, backgroundColor: COLORS.background}}
        >
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            
            <ScrollView 
                contentContainerStyle={[styles.container, { paddingTop: insets.top + 10 }]}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
                        <Ionicons name="arrow-back" size={24} color={COLORS.highlight} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Editar Perfil</Text>
                    <View style={{width: 30}} /> 
                </View>
                
                <View style={styles.card}>
                    <View style={styles.imageSection}>
                        <TouchableOpacity onPress={escolherImagem} activeOpacity={0.8}>
                            <View style={styles.avatarContainer}>
                                {sourceImagem ? (
                                    <Image source={sourceImagem} style={styles.avatar} />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Text style={styles.avatarText}>{nome.charAt(0).toUpperCase()}</Text>
                                    </View>
                                )}
                                <View style={styles.cameraOverlay}>
                                    <Ionicons name="camera" size={20} color="#fff" />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.changePhotoText}>Toque para alterar a foto</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Nome Completo</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="person-outline" size={20} color={COLORS.highlight} style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                value={nome} 
                                onChangeText={setNome} 
                                placeholder="Seu nome"
                                placeholderTextColor={COLORS.textSec}
                                cursorColor={COLORS.accent}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Celular</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color={COLORS.highlight} style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                value={telefone} 
                                onChangeText={setTelefone} 
                                keyboardType="phone-pad"
                                placeholder="(00) 00000-0000"
                                placeholderTextColor={COLORS.textSec}
                                cursorColor={COLORS.accent}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Steam ID</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="logo-steam" size={20} color={COLORS.highlight} style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                value={steamId} 
                                onChangeText={setSteamId} 
                                keyboardType="numeric"
                                placeholder="Ex: 76561198000000000"
                                placeholderTextColor={COLORS.textSec}
                                cursorColor={COLORS.accent}
                            />
                        </View>
                    </View>
                </View>

                <View style={styles.rowButtons}>
                    <TouchableOpacity style={styles.btnCancel} onPress={() => router.back()}>
                        <Text style={styles.textCancel}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.btnSave} 
                        onPress={handleSalvar}
                        disabled={salvando}
                    >
                        {salvando ? (
                            <ActivityIndicator color="#fff"/> 
                        ) : (
                            <Text style={styles.textSave}>Salvar Alterações</Text>
                        )}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    
    container: { flexGrow: 1, padding: 20, paddingBottom: 50 },
    
    headerRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 25 
    },
    btnBack: { 
        padding: 8, 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 20 
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    
    card: { 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 16, 
        padding: 20, 
        marginBottom: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    
    imageSection: { alignItems: 'center', marginBottom: 25 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: COLORS.accent },
    avatarPlaceholder: { 
        width: 120, height: 120, borderRadius: 60, 
        backgroundColor: COLORS.primary, 
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 3, borderColor: COLORS.accent
    },
    avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    cameraOverlay: {
        position: 'absolute', bottom: 0, right: 0,
        backgroundColor: COLORS.accent,
        width: 36, height: 36, borderRadius: 18,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 2, borderColor: COLORS.background
    },
    changePhotoText: { color: COLORS.highlight, marginTop: 10, fontSize: 14, fontWeight: '600' },

    inputGroup: { marginBottom: 16 },
    label: { fontSize: 12, fontWeight: 'bold', color: COLORS.textSec, marginBottom: 6, textTransform: 'uppercase' },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.inputBg,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        height: 50
    },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: COLORS.text, fontSize: 16 },

    rowButtons: { flexDirection: 'row', gap: 12 },
    btnCancel: { 
        flex: 1, padding: 16, borderRadius: 12, 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
    },
    btnSave: { 
        flex: 2, padding: 16, borderRadius: 12, 
        backgroundColor: COLORS.primary, 
        alignItems: 'center',
        elevation: 4
    },
    textCancel: { fontWeight: 'bold', color: COLORS.textSec },
    textSave: { fontWeight: 'bold', color: '#fff' },
});