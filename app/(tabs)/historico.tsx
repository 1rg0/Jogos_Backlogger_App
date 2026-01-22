import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  ImageBackground, 
  ActivityIndicator, 
  TouchableOpacity, 
  StatusBar,
  TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../src/services/api';
import { ItemBacklog } from '../../src/types/ItemBacklog';

const COLORS = {
    background: '#363B4E',  
    cardBg: '#222', 
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    gold: '#FFD740', 
    overlay: 'rgba(0,0,0,0.6)',
    inputBg: 'rgba(0,0,0,0.3)' 
};

const HistoryCard = ({ item, onPress }: { item: ItemBacklog, onPress: () => void }) => {
    
  const imagemUri = item.jogo.imagem || item.jogo.icone;

    return (
        <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.9} 
            onPress={onPress}
        >
            <ImageBackground
                source={imagemUri ? { uri: imagemUri } : undefined}
                style={styles.cardBackground}
                imageStyle={{ borderRadius: 16, opacity: 0.8 }}
                resizeMode="cover"
            >
                {!imagemUri && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#2C2C2C', borderRadius: 16 }]} />
                )}

                <View style={styles.cardOverlay} />

                <View style={styles.badgeContainer}>
                    <View style={styles.goldBadge}>
                        <Ionicons name="trophy" size={12} color="#000" />
                        <Text style={styles.goldBadgeText}>
                            {item.vezesFinalizado > 1 ? `${item.vezesFinalizado}x ZERADO` : 'ZERADO'}
                        </Text>
                    </View>
                </View>

                <View style={styles.cardContent}>
                    <Text style={styles.gameTitle} numberOfLines={1}>{item.jogo.titulo}</Text>
                    <Text style={styles.gameDev}>{item.jogo.desenvolvedora}</Text>

                    <View style={styles.divider} />

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Ionicons name="time-outline" size={14} color={COLORS.highlight} />
                            <Text style={styles.statText}>{item.horasJogadas}h jogadas</Text>
                        </View>
                    </View>
                </View>
            </ImageBackground>
        </TouchableOpacity>
    );
};

export default function HistoricoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [itens, setItens] = useState<ItemBacklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(''); 

  useFocusEffect(
    useCallback(() => {
      carregarHistorico();
    }, [])
  );

  async function carregarHistorico() {
    try {
      setLoading(true);
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      
      if (jsonValue != null) {
        const usuario = JSON.parse(jsonValue);
        const response = await api.get('/api/ItemBacklog', {
            params: { usuarioId: usuario.id }
        });
        
        const listaFinalizados = response.data.filter((i: ItemBacklog) => i.finalizado === true);
        
        const listaOrdenada = listaFinalizados.sort((a: ItemBacklog, b: ItemBacklog) => {
            return a.jogo.titulo.localeCompare(b.jogo.titulo);
        });
        
        setItens(listaOrdenada); 
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filteredItens = useMemo(() => {
    if (!searchQuery) return itens;
    return itens.filter(item => 
        item.jogo.titulo.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [itens, searchQuery]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator color={COLORS.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <View style={styles.header}>
          <Text style={styles.headerTitle}>Galeria de Troféus</Text>
          <Text style={styles.subtitle}>Jogos que você completou</Text>

          <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={COLORS.textSec} style={{ marginRight: 10 }} />
              <TextInput
                  style={styles.searchInput}
                  placeholder="Buscar jogo zerado..."
                  placeholderTextColor={COLORS.textSec}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  cursorColor={COLORS.accent}
              />
              {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color={COLORS.textSec} />
                  </TouchableOpacity>
              )}
          </View>
      </View>

      {filteredItens.length === 0 && (
        <View style={styles.emptyContainer}>
            {searchQuery ? (
                <>
                    <Ionicons name="search-outline" size={60} color={COLORS.textSec} style={{ opacity: 0.3 }} />
                    <Text style={styles.emptyText}>Nenhum jogo encontrado.</Text>
                </>
            ) : (
                <>
                    <Ionicons name="trophy-outline" size={60} color={COLORS.textSec} style={{ opacity: 0.3 }} />
                    <Text style={styles.emptyText}>Nenhum jogo zerado ainda.</Text>
                    <Text style={styles.emptySubtext}>Continue jogando para preencher sua galeria!</Text>
                </>
            )}
        </View>
      )}

      <FlatList
        data={filteredItens}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <HistoryCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { paddingHorizontal: 20, marginBottom: 15, marginTop: 10 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text, letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: COLORS.textSec, marginTop: 4, marginBottom: 15 },

  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.inputBg,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 45,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
  },
  searchInput: {
      flex: 1,
      color: COLORS.text,
      fontSize: 15,
      height: '100%'
  },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 18, color: COLORS.textSec, marginTop: 15, fontWeight: '600' },
  emptySubtext: { fontSize: 14, color: '#666', marginTop: 5 },

  card: {
    height: 180, 
    marginBottom: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4,
    backgroundColor: COLORS.cardBg
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'space-between'
  },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
    borderRadius: 16
  },
  
  badgeContainer: {
      alignItems: 'flex-end',
      padding: 12
  },
  goldBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.gold,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6
  },
  goldBadgeText: {
      color: '#000',
      fontSize: 11,
      fontWeight: 'bold',
      marginLeft: 4
  },

  cardContent: {
      padding: 16,
      justifyContent: 'flex-end'
  },
  gameTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#fff',
      textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4
  },
  gameDev: {
      fontSize: 12,
      color: COLORS.textSec,
      marginBottom: 8
  },
  
  divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.2)',
      marginVertical: 8
  },

  statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 15
  },
  statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5
  },
  statText: {
      color: COLORS.highlight,
      fontSize: 12,
      fontWeight: '500'
  }
});