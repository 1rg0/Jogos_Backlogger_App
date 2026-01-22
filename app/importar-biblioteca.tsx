import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
    ActivityIndicator, 
    Alert, 
    FlatList, 
    Image, 
    StyleSheet, 
    Text, 
    TouchableOpacity, 
    View,
    StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../src/services/api';

const COLORS = {
    background: '#363B4E',  
    cardBg: 'rgba(0, 0, 0, 0.25)', 
    cardSelected: 'rgba(79, 59, 120, 0.4)',
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    success: '#69F0AE',
};

interface SteamGame {
    steamId: number;
    titulo: string;
    horasJogadas: number;
    iconeUrl: string;
}

export default function ImportarBibliotecaScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    
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
                        horasJogadas: jogoOriginal ? jogoOriginal.horasJogadas : 0,
                        iconeUrl: jogoOriginal ? jogoOriginal.iconeUrl : null
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

    if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent}/></View>;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
            
            <View style={[styles.header, { marginTop: insets.top }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.title}>Sincronizar Steam</Text>
                <View style={{width: 40}} />
            </View>

            <View style={styles.infoBox}>
                <Ionicons name="cloud-download-outline" size={20} color={COLORS.highlight} />
                <Text style={styles.subtitle}>
                    Total encontrado: <Text style={{fontWeight: 'bold', color: '#fff'}}>{jogos.length}</Text>
                    {'\n'}Selecione para importar
                </Text>
            </View>

            <FlatList
                data={jogos}
                keyExtractor={item => String(item.steamId)}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
                initialNumToRender={10}
                renderItem={({ item }) => {
                    const isSelected = selecionados.has(item.steamId);
                    return (
                        <TouchableOpacity 
                            style={[styles.card, isSelected && styles.cardSelected]} 
                            onPress={() => toggleSelecao(item.steamId)}
                            activeOpacity={0.8}
                        >
                            <Image 
                                source={{ uri: item.iconeUrl }} 
                                style={styles.icon} 
                                defaultSource={{ uri: 'https://cdn-icons-png.flaticon.com/512/262/262048.png' }}
                            />
                            <View style={styles.info}>
                                <Text style={[styles.gameTitle, isSelected && {color: COLORS.highlight}]} numberOfLines={1}>
                                    {item.titulo}
                                </Text>
                                <Text style={styles.gameTime}>
                                    {item.horasJogadas > 0 ? `${item.horasJogadas.toFixed(1)}h registradas` : 'Nunca jogado'}
                                </Text>
                            </View>
                            
                            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                                {isSelected && <Ionicons name="checkmark" size={14} color="#fff" />}
                            </View>
                        </TouchableOpacity>
                    );
                }}
            />

            {selecionados.size > 0 && (
                <View style={[styles.floatingFooter, { paddingBottom: insets.bottom + 10 }]}>
                    <View style={styles.footerInfo}>
                        <Text style={styles.footerCount}>{selecionados.size} itens</Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={styles.btnImport} 
                        onPress={handleImportar}
                        disabled={importando}
                        activeOpacity={0.9}
                    >
                        {importando ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <Text style={styles.btnImportText}>IMPORTAR SELECIONADOS</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
    
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 20, 
        paddingBottom: 15,
        paddingTop: 10
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: COLORS.cardBg
    },
    title: { fontSize: 20, fontWeight: 'bold', color: COLORS.text },
    
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 20,
        marginBottom: 15,
        padding: 12,
        backgroundColor: COLORS.cardBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    subtitle: { marginLeft: 10, color: COLORS.textSec, fontSize: 13, lineHeight: 18 },
    
    card: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: COLORS.cardBg, 
        marginBottom: 10, 
        padding: 12, 
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    cardSelected: { 
        backgroundColor: COLORS.cardSelected, 
        borderColor: COLORS.accent 
    },
    
    icon: { width: 45, height: 45, borderRadius: 8, marginRight: 15, backgroundColor: '#222' },
    info: { flex: 1 },
    gameTitle: { fontWeight: 'bold', color: COLORS.text, fontSize: 15, marginBottom: 2 },
    gameTime: { color: COLORS.textSec, fontSize: 12 },
    
    checkbox: { 
        width: 22, height: 22, 
        borderRadius: 6, 
        borderWidth: 2, 
        borderColor: COLORS.textSec, 
        justifyContent: 'center', alignItems: 'center' 
    },
    checkboxSelected: { 
        backgroundColor: COLORS.accent, 
        borderColor: COLORS.accent 
    },

    floatingFooter: { 
        position: 'absolute', 
        bottom: 0, left: 0, right: 0, 
        backgroundColor: '#252836',
        padding: 20, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    footerInfo: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8
    },
    footerCount: { color: COLORS.highlight, fontWeight: 'bold', fontSize: 12 },

    btnImport: { 
        backgroundColor: COLORS.primary, 
        paddingVertical: 14, 
        paddingHorizontal: 24,
        borderRadius: 12, 
        alignItems: 'center',
        elevation: 4
    },
    btnImportText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 }
});