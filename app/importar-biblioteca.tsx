import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import api from '../src/services/api';

interface SteamGame {
    steamId: number;
    titulo: string;
    horasJogadas: number;
    iconeUrl: string;
}

export default function ImportarBibliotecaScreen() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [importando, setImportando] = useState(false);
    const [jogos, setJogos] = useState<SteamGame[]>([]);
    const [selecionados, setSelecionados] = useState<Set<number>>(new Set());

    useEffect(() => {
        carregarBiblioteca();
    }, []);

    async function carregarBiblioteca() {
        try {
            const jsonValue = await AsyncStorage.getItem('usuario_logado');
            if (jsonValue) {
                const usuarioStorage = JSON.parse(jsonValue);

                const userResponse = await api.get(`/api/Usuario/${usuarioStorage.id}`);
                const usuarioAtualizado = userResponse.data;

                if (!usuarioAtualizado.steamId) {
                    Alert.alert("Atenção", "Você não cadastrou um Steam ID no seu perfil.");
                    router.back();
                    return;
                }

                const response = await api.get(`/api/Steam/library/${usuarioAtualizado.steamId}`);
                setJogos(response.data);
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha ao buscar biblioteca. Verifique se seu perfil Steam é PÚBLICO.");
            router.back();
        } finally {
            setLoading(false);
        }
    }

    function toggleSelecao(id: number) {
        const novosSelecionados = new Set(selecionados);
        if (novosSelecionados.has(id)) {
            novosSelecionados.delete(id);
        } else {
            novosSelecionados.add(id);
        }
        setSelecionados(novosSelecionados);
    }

    async function handleImportar() {
        if (selecionados.size === 0) return;

        try {
            setImportando(true);
            const jsonValue = await AsyncStorage.getItem('usuario_logado');
            if (jsonValue) {
                const usuario = JSON.parse(jsonValue);
                
                const listaJogosParaEnviar = Array.from(selecionados).map(idSelecionado => {
                    const jogoOriginal = jogos.find(j => j.steamId === idSelecionado);
                    return {
                        steamId: idSelecionado,
                        horasJogadas: jogoOriginal ? jogoOriginal.horasJogadas : 0
                    };
                });

                const payload = {
                    usuarioId: usuario.id,
                    jogos: listaJogosParaEnviar
                };

                await api.post('/api/ItemBacklog/importar-lote', payload);
                
                Alert.alert("Sucesso", `${selecionados.size} jogos foram enviados para importação!`);
                router.replace('/(tabs)/home');
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Erro", "Falha ao importar jogos.");
        } finally {
            setImportando(false);
        }
    }

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6200ee"/></View>;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.title}>Sincronizar Steam</Text>
                <View style={{width: 24}} />
            </View>

            <Text style={styles.subtitle}>
                Selecione os jogos que deseja adicionar ao seu backlog.
                {'\n'}Total encontrado: {jogos.length}
            </Text>

            <FlatList
                data={jogos}
                keyExtractor={item => String(item.steamId)}
                contentContainerStyle={{ paddingBottom: 100 }}
                initialNumToRender={10}
                renderItem={({ item }) => {
                    const isSelected = selecionados.has(item.steamId);
                    return (
                        <TouchableOpacity 
                            style={[styles.card, isSelected && styles.cardSelected]} 
                            onPress={() => toggleSelecao(item.steamId)}
                        >
                            <Image 
                                source={{ uri: item.iconeUrl }} 
                                style={styles.icon} 
                                defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/262/262048.png' }}
                            />
                            <View style={styles.info}>
                                <Text style={styles.gameTitle} numberOfLines={1}>{item.titulo}</Text>
                                <Text style={styles.gameTime}>
                                    {item.horasJogadas > 0 ? `${item.horasJogadas}h registradas` : 'Nunca jogado'}
                                </Text>
                            </View>
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {selecionados.size > 0 && (
                <View style={styles.floatingFooter}>
                    <TouchableOpacity 
                        style={styles.btnImport} 
                        onPress={handleImportar}
                        disabled={importando}
                    >
                        {importando ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnImportText}>IMPORTAR {selecionados.size} JOGOS</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', paddingTop: 50, paddingBottom: 50 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
    title: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    subtitle: { paddingHorizontal: 20, marginBottom: 15, color: '#666', fontSize: 13 },
    
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 10, padding: 10, borderRadius: 8, elevation: 1 },
    cardSelected: { backgroundColor: '#e8eaf6', borderColor: '#6200ee', borderWidth: 1 },
    
    icon: { width: 40, height: 40, borderRadius: 4, marginRight: 15 },
    info: { flex: 1 },
    gameTitle: { fontWeight: 'bold', color: '#333', fontSize: 14 },
    gameTime: { color: '#888', fontSize: 12 },
    
    checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
    checkboxSelected: { backgroundColor: '#6200ee', borderColor: '#6200ee' },

    floatingFooter: { position: 'absolute', bottom: 50, left: 0, right: 0, backgroundColor: '#fff', padding: 20, elevation: 10, borderTopWidth: 1, borderTopColor: '#eee' },
    btnImport: { backgroundColor: '#6200ee', padding: 15, borderRadius: 8, alignItems: 'center' },
    btnImportText: { color: '#fff', fontWeight: 'bold' }
});