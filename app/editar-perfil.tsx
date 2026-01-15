import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView, Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput, TouchableOpacity,
    View
} from 'react-native';
import api, { API_URL } from '../src/services/api';
import { UsuarioDetailDTO, UsuarioUpdateDTO } from '../src/types/UsuarioDTO';

export default function EditarPerfilScreen() {
    const router = useRouter();
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

    if (loading) return <View style={styles.center}><ActivityIndicator color="#6200ee" size="large"/></View>;

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex: 1}}>
            <ScrollView contentContainerStyle={styles.container}>
                
                <Text style={styles.title}>Editar Perfil</Text>
                
                <View style={styles.card}>
                    <View style={styles.imageContainer}>
                        {sourceImagem ? (
                            <Image source={sourceImagem} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                                <Text style={styles.avatarText}>{nome.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        
                        <TouchableOpacity style={styles.btnChangePhoto} onPress={escolherImagem}>
                            <Text style={styles.btnChangePhotoText}>📷 Alterar Foto</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.label}>Nome Completo</Text>
                    <TextInput 
                        style={styles.input} 
                        value={nome} 
                        onChangeText={setNome} 
                        placeholder="Seu nome"
                    />

                    <Text style={styles.label}>Celular</Text>
                    <TextInput 
                        style={styles.input} 
                        value={telefone} 
                        onChangeText={setTelefone} 
                        keyboardType="phone-pad"
                        placeholder="(00) 00000-0000"
                    />

                    <Text style={styles.label}>Steam ID</Text>
                    <TextInput 
                        style={styles.input} 
                        value={steamId} 
                        onChangeText={setSteamId} 
                        keyboardType="numeric"
                        placeholder="Ex: 76561198000000000"
                    />
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
                        {salvando ? <ActivityIndicator color="#fff"/> : <Text style={styles.textSave}>Salvar</Text>}
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5', justifyContent: 'center' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333', textAlign: 'center' },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, elevation: 3, marginBottom: 20 },
    
    imageContainer: { alignItems: 'center', marginBottom: 20 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { backgroundColor: '#6200ee', justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    btnChangePhoto: { marginTop: 10 },
    btnChangePhotoText: { color: '#6200ee', fontWeight: 'bold', fontSize: 14 },

    label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 5, marginTop: 10 },
    input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9', color: '#333' },

    rowButtons: { flexDirection: 'row', gap: 10 },
    btnCancel: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#ddd', alignItems: 'center' },
    btnSave: { flex: 1, padding: 15, borderRadius: 8, backgroundColor: '#6200ee', alignItems: 'center' },
    textCancel: { fontWeight: 'bold', color: '#333' },
    textSave: { fontWeight: 'bold', color: '#fff' }
});