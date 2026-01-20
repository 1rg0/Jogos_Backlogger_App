import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../src/services/api';
import { ItemBacklog } from '../../src/types/ItemBacklog';

export default function HistoricoScreen() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemBacklog[]>([]);
  const [loading, setLoading] = useState(true);

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
        const response = await api.get(`/api/ItemBacklog?usuarioId=${usuario.id}`);
        
        const listaFinalizados = response.data.filter((i: ItemBacklog) => i.finalizado === true);
        
        setItens(listaFinalizados.reverse());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#6200ee" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Jogos Zerados</Text>
      <Text style={styles.subtitle}>Sua galeria de troféus pessoal</Text>

      {itens.length === 0 && (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Você ainda não zerou nenhum jogo.</Text>
            <Text style={styles.emptySubtext}>Vá jogar!</Text>
        </View>
      )}

      <FlatList
        data={itens}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card}
            onPress={() => router.push(`/item/${item.id}`)}
          >
            {item.jogo.icone ? (
                <Image source={{ uri: item.jogo.icone }} style={styles.capa} resizeMode="cover" />
            ) : (
                <View style={[styles.capa, { backgroundColor: '#ccc' }]} />
            )}

            <View style={styles.info}>
                <Text style={styles.titulo}>{item.jogo.titulo}</Text>
                <Text style={styles.dev}>{item.jogo.desenvolvedora}</Text>
                
                <View style={styles.statsRow}>
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>⏱ {item.horasJogadas}h</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: '#fff3e0' }]}>
                        <Text style={[styles.badgeText, { color: '#e65100' }]}>
                            ★ {item.vezesFinalizado}x
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.iconContainer}>
                <Text style={{fontSize: 20}}>✅</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  headerTitle: { fontSize: 26, fontWeight: 'bold', color: '#333' },
  subtitle: { fontSize: 14, color: '#666', marginBottom: 20 },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: '#888', marginTop: 10, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, color: '#aaa' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4
  },
  capa: { width: 40, height: 40, borderRadius: 8 },
  
  info: { flex: 1, marginLeft: 15, justifyContent: 'center' },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  dev: { fontSize: 12, color: '#888', marginBottom: 6 },
  
  statsRow: { flexDirection: 'row', gap: 8 },
  badge: { backgroundColor: '#f0f0f0', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 11, fontWeight: 'bold', color: '#555' },

  iconContainer: { padding: 10 }
});