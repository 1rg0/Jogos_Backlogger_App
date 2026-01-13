import React, { useState, useCallback } from 'react'; 
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../src/services/api';
import { useRouter, useFocusEffect } from 'expo-router';
import { ItemBacklog } from '../../src/types/ItemBacklog';

export default function HomeScreen() {
  const router = useRouter();
  const [itens, setItens] = useState<ItemBacklog[]>([]);
  const [loading, setLoading] = useState(true);
  const [nomeUsuario, setNomeUsuario] = useState('');

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  async function carregarDados() {
    try {
      setLoading(true); 
      
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      
      if (jsonValue != null) {
        const usuario = JSON.parse(jsonValue);
        setNomeUsuario(usuario.nome);
        
        const response = await api.get(`/api/ItemBacklog?usuarioId=${usuario.id}`);
        setItens(response.data);
      }
    } catch (e) {
      console.error("Erro ao carregar home:", e);
    } finally {
      setLoading(false);
    }
  }

  const destaques = itens.slice(0, 3);
  const fila = itens.slice(3); 

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator color="#6200ee" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={fila}
        keyExtractor={(item) => String(item.id)}
        
        ListHeaderComponent={() => (
          <View>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.greeting}>Olá,</Text>
                    <Text style={styles.username}>{nomeUsuario}</Text>
                </View>
                
                <TouchableOpacity onPress={() => router.push('/perfil')}>
                    <View style={styles.profileButton}>
                        <Text style={{fontSize: 20}}>👤</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <TouchableOpacity 
                style={styles.btnExplorar} 
                onPress={() => router.push('/explorar')}
            >
                <Text style={styles.btnExplorarText}>🔍 Adicionar Novo Jogo</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Jogando Agora 🔥</Text>
            
            {itens.length === 0 && <Text style={styles.emptyText}>Nenhum jogo no backlog.</Text>}

            <FlatList
              data={destaques}
              keyExtractor={(item) => String(item.id)}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                    style={styles.cardDestaque}
                    onPress={() => router.push(`/item/${item.id}`)}
                >
                  {item.jogo.icone ? (
                    <Image 
                        source={{ uri: item.jogo.icone }} 
                        style={styles.capaDestaque} 
                        resizeMode="cover"
                    />
                  ) : (
                    <Image 
                        source={{ uri: 'https://cdn-icons-png.flaticon.com/256/262/262048.png' }} 
                        style={styles.capaDestaque} 
                        resizeMode="cover"
                    />
                  )}
                  <Text style={styles.tituloDestaque} numberOfLines={2}>{item.jogo.titulo}</Text>
                </TouchableOpacity>
              )}
            />

            {fila.length > 0 && <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Na Fila ⏳</Text>}
          </View>
        )}

        renderItem={({ item }) => (
           <TouchableOpacity 
               style={styles.cardFila}
               onPress={() => router.push(`/item/${item.id}`)}
           >
              {item.jogo.icone ? (
                <Image 
                    source={{ uri: item.jogo.icone }} 
                    style={styles.capaPequena} 
                />
              ) : (
                <Image 
                    source={{ uri: 'https://cdn-icons-png.flaticon.com/256/262/262048.png' }} 
                    style={styles.capaPequena} 
                    resizeMode="cover"
                />
              )}

              <View style={styles.infoContainer}>
                 <Text style={styles.tituloFila}>{item.jogo.titulo}</Text>
                 <Text style={styles.subtituloFila}>{item.jogo.desenvolvedora}</Text>
                 
                 <View style={styles.badgeHoras}>
                    <Text style={styles.textoBadge}>
                       {item.jogo.horasParaZerar}h est.
                    </Text>
                 </View>
              </View>
           </TouchableOpacity>
        )}
        
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 50, backgroundColor: '#f2f2f2' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 10, marginBottom: 10, color: '#333' },
  emptyText: { color: '#999', fontStyle: 'italic', marginTop: 10, textAlign: 'center' },
  
  cardDestaque: { width: 140, height: 190, backgroundColor: '#fff', marginRight: 12, borderRadius: 10, padding: 10, elevation: 2 },
  capaDestaque: { width: 100, height: 120, borderRadius: 8, marginBottom: 10, alignSelf: 'center' },
  tituloDestaque: { fontWeight: 'bold', fontSize: 13, textAlign: 'center', color: '#333' },
  
  cardFila: { backgroundColor: '#fff', padding: 10, marginBottom: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', elevation: 1 },
  capaPequena: { width: 50, height: 65, borderRadius: 6, marginRight: 15 },
  infoContainer: { flex: 1, justifyContent: 'center' },
  tituloFila: { fontWeight: 'bold', fontSize: 15, color: '#333' },
  subtituloFila: { color: '#777', fontSize: 12, marginBottom: 4 },
  badgeHoras: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  textoBadge: { fontSize: 10, fontWeight: 'bold', color: '#666' },

  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  greeting: { fontSize: 16, color: '#666' },
  username: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  
  profileButton: { 
    width: 45, 
    height: 45, 
    backgroundColor: '#fff', 
    borderRadius: 25, 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 2
  },

  btnExplorar: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20
  },
  btnExplorarText: { color: '#6200ee', fontWeight: 'bold' }
});