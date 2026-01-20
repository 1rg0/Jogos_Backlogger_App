import React, { useState, useCallback } from 'react'; 
import { View, Text, StyleSheet, Image, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { API_URL } from '../../src/services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { ItemBacklog } from '../../src/types/ItemBacklog';
import { UsuarioDetailDTO } from '../../src/types/UsuarioDTO';
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import { Ionicons } from '@expo/vector-icons'; 

export default function HomeScreen() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemBacklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sincronizando, setSincronizando] = useState(false);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [nomeUsuario, setNomeUsuario] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      
      if (jsonValue != null) {
        const usuarioLogado = JSON.parse(jsonValue);
        setUsuarioId(usuarioLogado.id); 
        
        const [userResponse, itensResponse] = await Promise.all([
            api.get<UsuarioDetailDTO>(`/api/Usuario/${usuarioLogado.id}`),
            api.get<ItemBacklog[]>(`/api/ItemBacklog?usuarioId=${usuarioLogado.id}`)
        ]);

        const usuarioAtualizado = userResponse.data;
        const listaItens = itensResponse.data;

        setNomeUsuario(usuarioAtualizado.nome.split(' ')[0]);
        setFotoPerfil(usuarioAtualizado.imagemPerfil || '');

        const backlogAtivo = listaItens
            .filter((i: ItemBacklog) => !i.finalizado || i.rejogando)
            .sort((a, b) => a.ordemId - b.ordemId);

        setItens(backlogAtivo);
      }
    } catch (e) {
      console.error("Erro ao carregar home:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSincronizarSteam() {
    if (!usuarioId) return;

    setSincronizando(true);
    try {
        const response = await api.post(`/api/ItemBacklog/sincronizar-horas-steam?usuarioId=${usuarioId}`);
        
        Alert.alert(
            "Sucesso",
            response.data.message,
            [
                { text: "OK", onPress: () => carregarDados() }
            ]
        );
    } catch (error: any) {
        console.error("Erro ao sincronizar:", error);
        const msg = error.response?.data || "Não foi possível conectar à Steam.";
        Alert.alert("Erro", typeof msg === 'string' ? msg : "Erro na sincronização.");
    } finally {
        setSincronizando(false);
    }
  }

  async function handleDragEnd(data: ItemBacklog[]) {
    setItens(data);
    try {
        const listaIds = data.map(item => item.id);
        await api.patch('/api/ItemBacklog/reordenar', { listaIds });
    } catch (error) {
        console.error("Erro ao reordenar", error);
        Alert.alert("Erro", "Falha ao salvar a nova ordem.");
        carregarDados();
    }
  }

  const renderItem = ({ item, drag, isActive, getIndex }: RenderItemParams<ItemBacklog>) => {
    const index = getIndex() || 0;
    const isDestaque = index < 3;

    const horasJogadas = item.horasJogadas || 0;
    const horasTotal = item.jogo.horasParaZerar || 0; 
    
    let porcentagem = 0;
    if (horasTotal > 0) {
        porcentagem = (horasJogadas / horasTotal) * 100;
        if (porcentagem > 100) porcentagem = 100;
    }

    const imagemDestaque = item.jogo.imagem || item.jogo.icone;

    return (
        <ScaleDecorator>
            <TouchableOpacity
                onLongPress={drag}
                disabled={isActive}
                onPress={() => router.push(`/item/${item.id}`)}
                style={[
                    styles.itemWrapper, 
                    { backgroundColor: isActive ? '#f0e6fc' : 'transparent' }
                ]}
            >
                {isDestaque ? (
                    <View style={styles.cardDestaque}>
                        <View style={styles.destaqueBadgeContainer}>
                            <Text style={styles.destaqueBadge}>TOP {index + 1}</Text>
                        </View>
                        
                        {imagemDestaque ? (
                            <Image source={{ uri: imagemDestaque }} style={styles.capaDestaque} />
                        ) : (
                            <View style={[styles.capaDestaque, {backgroundColor: '#ccc'}]} />
                        )}
                        
                        <Text style={styles.tituloDestaque} numberOfLines={1}>{item.jogo.titulo}</Text>
                        <Text style={styles.subtituloDestaque} numberOfLines={1}>{item.jogo.desenvolvedora}</Text>
                        
                        <View style={styles.progressContainerDestaque}>
                            <View style={styles.progressBarBackground}>
                                <View style={[styles.progressBarFill, { width: `${porcentagem}%` }]} />
                            </View>
                            <Text style={styles.progressText}>
                                {horasJogadas}h / {horasTotal > 0 ? `${horasTotal}h` : '?'}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.cardFila}>
                        <Text style={styles.filaIndex}>#{index + 1}</Text>
                        
                        {item.jogo.icone ? (
                            <Image 
                                source={{ uri: item.jogo.icone }} 
                                style={styles.iconeLista} 
                                resizeMode="cover" 
                            />
                        ) : (
                            <View style={[styles.iconeLista, {backgroundColor: '#ccc', justifyContent:'center', alignItems:'center'}]}>
                                 <Ionicons name="game-controller-outline" size={20} color="#666" />
                            </View>
                        )}
                        
                        <View style={styles.infoContainer}>
                            <Text style={styles.tituloFila} numberOfLines={1}>{item.jogo.titulo}</Text>
                            
                            <View style={styles.progressContainerFila}>
                                <View style={styles.progressBarBackground}>
                                    <View style={[styles.progressBarFill, { width: `${porcentagem}%` }]} />
                                </View>
                                <Text style={styles.progressTextSmall}>
                                    {horasJogadas}h / {horasTotal > 0 ? `${horasTotal}h` : '?'}
                                </Text>
                            </View>
                        </View>
                        
                        <Ionicons name="reorder-three-outline" size={24} color="#ccc" />
                    </View>
                )}
            </TouchableOpacity>
        </ScaleDecorator>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color="#6200ee" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
            <View>
                <Text style={styles.greeting}>Olá,</Text>
                <Text style={styles.username}>{nomeUsuario}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/perfil')}>
                <View style={styles.profileButton}>
                    {fotoPerfil ? (
                        <Image 
                            source={{ uri: `${API_URL}${fotoPerfil}?t=${new Date().getTime()}` }} 
                            style={styles.profileImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={{fontSize: 20}}>👤</Text>
                    )}
                </View>
            </TouchableOpacity>
      </View>

      <TouchableOpacity 
            style={styles.btnExplorar} 
            onPress={() => router.push('/explorar')}
      >
            <Text style={styles.btnExplorarText}>Adicionar Novo Jogo</Text>
      </TouchableOpacity>

      <View>
        <Text style = {styles.textJogando}>Jogando Agora</Text>
      </View>

      {itens.length === 0 && <Text style={styles.emptyText}>Nenhum jogo no backlog.</Text>}

      <DraggableFlatList
        data={itens}
        onDragEnd={({ data }) => handleDragEnd(data)}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity 
        style={styles.fab} 
        onPress={handleSincronizarSteam}
        disabled={sincronizando}
      >
        {sincronizando ? (
            <ActivityIndicator size="small" color="#FFF" />
        ) : (
            <Ionicons name="sync" size={24} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, paddingBottom: 100, backgroundColor: '#f2f2f2' },
  emptyText: { color: '#999', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },

  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 16, color: '#666' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  profileButton: { width: 45, height: 45, backgroundColor: '#fff', borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  profileImage: { width: 45, height: 45, borderRadius: 25 },

  textJogando:{ fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 15},
  btnExplorar: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#6200ee', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  btnExplorarText: { color: '#6200ee', fontWeight: 'bold' },

  itemWrapper: { marginBottom: 10 },

  cardDestaque: { backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 3, alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  destaqueBadgeContainer: { position: 'absolute', top: 10, left: 10, backgroundColor: '#6200ee', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, zIndex: 1 },
  destaqueBadge: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  capaDestaque: { width: '100%', height: 180, borderRadius: 8, marginBottom: 10, resizeMode: 'cover' }, 
  tituloDestaque: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'center' },
  subtituloDestaque: { fontSize: 14, color: '#666', textAlign: 'center' },

  cardFila: { backgroundColor: '#fff', padding: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  filaIndex: { fontSize: 14, fontWeight: 'bold', color: '#ccc', marginRight: 10, width: 25 },

  iconeLista: { 
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 15 
  },
  
  infoContainer: { flex: 1, justifyContent: 'center' },
  tituloFila: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  
  fab: {
    position: 'absolute',
    width: 60, height: 60, alignItems: 'center', justifyContent: 'center',
    right: 20, bottom: 30, backgroundColor: '#6200ee', borderRadius: 30,
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, zIndex: 999,
  },

  progressBarBackground: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4ac403', borderRadius: 3 },
  
  progressContainerDestaque: { width: '100%', marginTop: 10, alignItems: 'center' },
  progressText: { fontSize: 12, color: '#666', marginTop: 4, fontWeight: '500' },
  
  progressContainerFila: { marginTop: 4, width: '90%' },
  progressTextSmall: { fontSize: 10, color: '#888', marginTop: 2 },
});