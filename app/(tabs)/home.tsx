import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    ImageBackground,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import api from '../../src/services/api';
import { ItemBacklog } from '../../src/types/ItemBacklog';

import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { API_URL } from '../../src/services/api';

const COLORS = {
    background: '#363B4E',  
    cardBg: 'rgba(0, 0, 0, 0.25)', 
    cardHighlight: 'rgba(79, 59, 120, 0.4)', 
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    success: '#69F0AE',
    warning: '#FFD740'
};

const BigCard = ({ item, drag, isActive, onPress, indexDebug }: { item: ItemBacklog, drag: () => void, isActive: boolean, onPress: () => void, indexDebug: number }) => {
    const horasTotais = item.jogo.horasParaZerar || 1;
    const progresso = Math.min(item.horasJogadas / horasTotais, 1);
    const imagemUri = item.jogo.imagem || item.jogo.icone;

    return (
        <ScaleDecorator>
            <TouchableOpacity 
                onLongPress={drag}
                disabled={isActive}
                activeOpacity={0.9}
                onPress={onPress}
                style={[styles.bigCard, isActive && styles.cardActive]}
            >
                {imagemUri ? (
                    <ImageBackground 
                        source={{ uri: imagemUri }}
                        style={styles.bigCardBackground}
                        imageStyle={{ borderRadius: 16 }}
                        resizeMode="cover"
                    >
                        <View style={styles.bigCardOverlay} />
                        <View style={styles.bigCardContent}>
                            <View style={styles.badgeTopContainer}>
                                 <View style={styles.playingBadge}>
                                    <Ionicons name="game-controller" size={12} color="#fff" />
                                    <Text style={styles.playingText}>JOGANDO AGORA</Text>
                                </View>
                            </View>

                            <View style={styles.textBottomContainer}>
                                <Text style={styles.bigTitle} numberOfLines={1}>{item.jogo.titulo}</Text>
                                <Text style={styles.bigSubtitle}>{item.jogo.desenvolvedora}</Text>
                                <View style={styles.statsContainer}>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${progresso * 100}%` }]} />
                                    </View>
                                    <Text style={styles.statsText}>
                                        {item.horasJogadas.toFixed(1)}h / {item.jogo.horasParaZerar}h
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </ImageBackground>
                ) : (
                    <View style={[styles.bigCardBackground, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image-outline" size={50} color="#666" />
                        <Text style={{color: '#fff'}}>Sem Imagem</Text>
                    </View>
                )}
            </TouchableOpacity>
        </ScaleDecorator>
    );
};

const CompactCard = ({ item, drag, isActive, index, onPress, canDrag }: { item: ItemBacklog, drag: () => void, isActive: boolean, index: number, onPress: () => void, canDrag: boolean }) => {
    const horasTotais = item.jogo.horasParaZerar || 1;
    const progresso = Math.min(item.horasJogadas / horasTotais, 1);
    const iconeUri = item.jogo.icone || item.jogo.imagem;

    return (
        <ScaleDecorator>
            <TouchableOpacity 
                onLongPress={canDrag ? drag : undefined}
                disabled={isActive}
                activeOpacity={0.7}
                onPress={onPress}
                style={[styles.compactCard, isActive && styles.cardActive]}
            >
                <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                </View>

                {iconeUri ? (
                    <Image source={{ uri: iconeUri }} style={styles.compactIcon} resizeMode="cover" />
                ) : (
                    <View style={[styles.compactIcon, { justifyContent: 'center', alignItems: 'center' }]}>
                         <Ionicons name="image-outline" size={20} color={COLORS.textSec} />
                    </View>
                )}
                
                <View style={styles.compactContent}>
                    <Text style={styles.compactTitle} numberOfLines={1}>{item.jogo.titulo}</Text>
                    
                    <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                        <View style={[styles.progressBarBg, {height: 4, width: 60, marginRight: 8}]}>
                            <View style={[styles.progressBarFill, { width: `${progresso * 100}%` }]} />
                        </View>
                        <Text style={styles.compactStatsText}>
                            {Math.round(progresso * 100)}%
                        </Text>
                    </View>
                </View>

                {canDrag && (
                     <Ionicons name="reorder-two" size={24} color={COLORS.highlight} style={{ opacity: 0.5 }} />
                )}
            </TouchableOpacity>
        </ScaleDecorator>
    );
};


export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [items, setItems] = useState<ItemBacklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [usuarioNome, setUsuarioNome] = useState('');
  
  const [filtroAtivo, setFiltroAtivo] = useState('Todos');
  const [generosDisponiveis, setGenerosDisponiveis] = useState<string[]>(['Todos']);
  const [listVersion, setListVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  useEffect(() => {
    let connection: any;

    const startConnection = async () => {
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      if (!jsonValue) return;
      const usuario = JSON.parse(jsonValue);

      connection = new HubConnectionBuilder()
        .withUrl(`${API_URL}/jogoHub`)
        .configureLogging(LogLevel.Information)
        .build();

      try {
        await connection.start();

        await connection.invoke("JoinUserGroup", String(usuario.id));

        connection.on("ReceberAtualizacaoHoras", () => {
            carregarDados();
        });

      } catch (err) {
        console.error("Erro no SignalR:", err);
      }
    };

    startConnection();

    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, []);

  async function carregarDados() {
    try {
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      if (jsonValue != null) {
        const usuario = JSON.parse(jsonValue);
        setUsuarioNome(usuario.nome.split(' ')[0]); 
        
        const response = await api.get('/api/ItemBacklog', {
            params: { usuarioId: usuario.id }
        });

        const data: ItemBacklog[] = response.data;
        
        const jogosAtivos = data.filter(item => !item.finalizado || item.rejogando);

        const sortedData = jogosAtivos.sort((a, b) => a.ordemId - b.ordemId);
        
        setItems(sortedData);
        extrairGeneros(sortedData);
      }
    } catch (error) {
      console.error("Erro ao carregar backlog", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSincronizarSteam() {
      if (syncing) return;

      try {
          setSyncing(true);
          const jsonValue = await AsyncStorage.getItem('usuario_logado');
          if (jsonValue) {
              const usuario = JSON.parse(jsonValue);
              await api.post(`/api/ItemBacklog/sincronizar-horas-steam?usuarioId=${usuario.id}`);
              Alert.alert("Sucesso", "Horas sincronizadas com a Steam!");
              await carregarDados(); 
          }
      } catch (error) {
          console.error("Erro ao sincronizar steam", error);
          Alert.alert("Erro", "Falha ao sincronizar com a Steam.");
      } finally {
          setSyncing(false);
      }
  }

  function extrairGeneros(lista: ItemBacklog[]) {
      const setGeneros = new Set<string>();
      setGeneros.add('Todos');
      lista.forEach(item => {
          if (item.jogo.generos && Array.isArray(item.jogo.generos)) {
              item.jogo.generos.forEach(g => setGeneros.add(g));
          }
      });
      const arrayGeneros = Array.from(setGeneros);
      const generosOrdenados = ['Todos', ...arrayGeneros.filter(g => g !== 'Todos').sort()];
      setGenerosDisponiveis(generosOrdenados);
  }

  async function onDragEnd({ data }: { data: ItemBacklog[] }) {
    if (filtroAtivo !== 'Todos') return;
    
    setItems(data);
    setListVersion(prev => prev + 1);

    try {
        await api.patch('/api/ItemBacklog/reordenar', { listaIds: data.map(i => i.id) });
    } catch (error) {
        console.error("Erro ao reordenar", error);
        carregarDados();
    }
  }

  const listaExibida = useMemo(() => {
      if (filtroAtivo === 'Todos') return items;
      return items.filter(item => item.jogo.generos?.includes(filtroAtivo));
  }, [items, filtroAtivo]);

  const renderItem = useCallback(({ item, drag, isActive, getIndex }: RenderItemParams<ItemBacklog>) => {
    const index = getIndex();
    const isBigCard = filtroAtivo === 'Todos' && index !== undefined && index < 3;

    return (
        <View 
            key={isBigCard ? `big-${item.id}-${listVersion}` : `compact-${item.id}-${listVersion}`}
            collapsable={false} 
        >
            {isBigCard ? (
                <BigCard 
                    item={item} 
                    drag={drag} 
                    isActive={isActive} 
                    onPress={() => router.push(`/item/${item.id}`)}
                    indexDebug={index || 0}
                />
            ) : (
                <CompactCard 
                    item={item} 
                    drag={drag} 
                    isActive={isActive} 
                    index={index || 0}
                    canDrag={filtroAtivo === 'Todos'}
                    onPress={() => router.push(`/item/${item.id}`)}
                />
            )}
        </View>
    );
  }, [filtroAtivo, router, listVersion]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      <View style={[styles.header, { marginTop: insets.top + 10}]}>
        <View style={{flex: 1}}>
            <Text style={styles.greeting}>Olá, <Text style={{fontWeight: 'bold', color: COLORS.highlight}}>{usuarioNome}</Text></Text>
            <Text style={styles.subGreeting}>O que vamos jogar hoje?</Text>
        </View>
        
        <View style={styles.headerButtons}>
            <TouchableOpacity 
                onPress={handleSincronizarSteam} 
                style={styles.syncButton}
                activeOpacity={0.7}
                disabled={syncing}
            >
                {syncing ? (
                    <ActivityIndicator color={COLORS.highlight} size="small" />
                ) : (
                    <Ionicons name="refresh" size={22} color={COLORS.highlight} />
                )}
            </TouchableOpacity>

            <TouchableOpacity 
                onPress={() => router.push('/explorar')} 
                style={styles.addButton}
                activeOpacity={0.8}
            >
                <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.filterContainer}>
          <FlatList
            horizontal
            data={generosDisponiveis}
            keyExtractor={item => item}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{paddingHorizontal: 20}}
            renderItem={({item}) => (
                <TouchableOpacity 
                    style={[styles.chip, filtroAtivo === item && styles.chipActive]}
                    onPress={() => setFiltroAtivo(item)}
                >
                    <Text style={[styles.chipText, filtroAtivo === item && styles.chipTextActive]}>{item}</Text>
                </TouchableOpacity>
            )}
          />
      </View>

      {filtroAtivo !== 'Todos' && (
          <View style={styles.warningBanner}>
              <Ionicons name="information-circle" size={16} color={COLORS.warning} />
              <Text style={styles.warningText}>Reordenação desativada enquanto filtra.</Text>
          </View>
      )}

      {loading && items.length === 0 ? (
        <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.accent} />
        </View>
      ) : (
        <DraggableFlatList
            data={listaExibida}
            onDragEnd={onDragEnd}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            extraData={listVersion} 
            contentContainerStyle={{ 
                paddingBottom: insets.bottom + 150, 
                paddingHorizontal: 20 
            }}
            showsVerticalScrollIndicator={false}
            dragHitSlop={filtroAtivo === 'Todos' ? undefined : {}}
            activationDistance={filtroAtivo === 'Todos' ? 5 : 99999}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 15
  },
  greeting: { fontSize: 22, color: COLORS.text },
  subGreeting: { fontSize: 14, color: COLORS.textSec, marginTop: 2 },
  
  headerButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
  },
  
  syncButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(196, 187, 240, 0.3)',
      backgroundColor: 'rgba(0,0,0,0.2)'
  },

  addButton: {
      backgroundColor: COLORS.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 4,
      shadowColor: '#000',
      shadowOpacity: 0.3,
      shadowOffset: {width: 0, height: 2}
  },

  filterContainer: { marginBottom: 15, height: 35 },
  chip: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: COLORS.cardBg,
      marginRight: 8,
      borderWidth: 1,
      borderColor: 'transparent'
  },
  chipActive: {
      backgroundColor: COLORS.primary,
      borderColor: COLORS.accent
  },
  chipText: { color: COLORS.textSec, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },

  warningBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 215, 64, 0.1)',
      padding: 8,
      marginBottom: 10,
      marginHorizontal: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(255, 215, 64, 0.3)'
  },
  warningText: { color: COLORS.warning, fontSize: 12, marginLeft: 6 },

  bigCard: {
      height: 180,
      borderRadius: 16,
      marginBottom: 16,
      backgroundColor: '#222',
      elevation: 5, 
      overflow: 'hidden' 
  },
  cardActive: {
      borderColor: COLORS.accent,
      borderWidth: 2,
      opacity: 0.9,
      transform: [{ scale: 1.02 }]
  },
  bigCardBackground: {
      flex: 1,
      justifyContent: 'space-between',
      borderRadius: 16,
      overflow: 'hidden'
  },
  bigCardOverlay: { 
      ...StyleSheet.absoluteFillObject, 
      backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bigCardContent: {
      flex: 1,
      justifyContent: 'space-between', 
      padding: 16
  },
  badgeTopContainer: {
      alignItems: 'flex-start'
  },
  textBottomContainer: {
      justifyContent: 'flex-end'
  },
  playingBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.primary,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 4
  },
  playingText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4 },
  
  bigTitle: { 
      color: '#fff', 
      fontSize: 20, 
      fontWeight: 'bold', 
      textShadowColor: 'rgba(0,0,0,0.8)', 
      textShadowRadius: 4 
  },
  bigSubtitle: { 
      color: COLORS.highlight, 
      fontSize: 12, 
      marginBottom: 8,
      textShadowColor: 'rgba(0,0,0,0.8)', 
      textShadowRadius: 4 
  },
  
  compactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.cardBg,
      borderRadius: 12,
      padding: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
      height: 80 
  },
  rankContainer: {
      width: 30,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 5
  },
  rankText: { color: COLORS.textSec, fontSize: 12, fontStyle: 'italic' },
  
  compactIcon: {
      width: 40, 
      height: 40, 
      borderRadius: 4,
      marginRight: 12,
      backgroundColor: '#222'
  },
  compactContent: { flex: 1 },
  compactTitle: { color: COLORS.text, fontSize: 14, fontWeight: '600' },
  compactStatsText: { color: COLORS.textSec, fontSize: 11 },

  statsContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  progressBarBg: {
      height: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 3,
      flex: 1,
      marginRight: 10
  },
  progressBarFill: {
      height: '100%',
      backgroundColor: COLORS.success,
      borderRadius: 3
  },
  statsText: { color: '#fff', fontSize: 11, fontWeight: 'bold' }
});