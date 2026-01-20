import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Image,
  Keyboard,
  StyleSheet,
  Text, TextInput, TouchableOpacity, View
} from 'react-native';
import api from '../src/services/api';
import { ItemBacklog } from '../src/types/ItemBacklog';
import { ItemBacklogCreateDTO } from '../src/types/ItemBacklogDTO';
import { Jogo } from '../src/types/Jogo';

interface SteamJogoResult {
    steamId: number;
    titulo: string;
    capa: string;
}

export default function ExplorarScreen() {
  const router = useRouter();
  
  const [modo, setModo] = useState<'local' | 'steam'>('local');

  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [catalogoLocal, setCatalogoLocal] = useState<Jogo[]>([]); 
  const [listaLocalFiltrada, setListaLocalFiltrada] = useState<Jogo[]>([]);
  
  const [listaSteam, setListaSteam] = useState<SteamJogoResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (modo === 'local') {
          carregarDadosLocais();
      }
    }, [modo])
  );

  async function carregarDadosLocais() {
    try {
        setLoading(true);
        const usuarioJson = await AsyncStorage.getItem('usuario_logado');
        if (!usuarioJson) return;
        const usuario = JSON.parse(usuarioJson);

        const [jogosResponse, backlogResponse] = await Promise.all([
            api.get<Jogo[]>('/api/Jogo'),
            api.get<ItemBacklog[]>(`/api/ItemBacklog?usuarioId=${usuario.id}`)
        ]);

        const todosJogos = jogosResponse.data;
        const meuBacklog = backlogResponse.data;
        const meusJogosIds = meuBacklog.map(item => item.jogoId);

        const jogosDisponiveis = todosJogos.filter(jogo => !meusJogosIds.includes(jogo.id));

        setCatalogoLocal(jogosDisponiveis);
        setListaLocalFiltrada(jogosDisponiveis);
        
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
  }

  function filtrarLocal(texto: string) {
      setBusca(texto);
      if(texto === ''){
          setListaLocalFiltrada(catalogoLocal);
      } else {
          const resultados = catalogoLocal.filter(item => item.titulo.toLowerCase().includes(texto.toLowerCase()));
          setListaLocalFiltrada(resultados);
      }
  }

  async function buscarNaSteam() {
      if (busca.length < 3) {
          Alert.alert("Busca curta", "Digite pelo menos 3 caracteres para buscar na Steam.");
          return;
      }

      Keyboard.dismiss();
      setLoading(true);
      try {
          const response = await api.get(`/api/Steam/search?q=${busca}`);
          setListaSteam(response.data);
      } catch (error) {
          console.error(error);
          Alert.alert("Erro", "Falha ao buscar na Steam.");
      } finally {
          setLoading(false);
      }
  }

  async function handleAdicionarLocal(jogoId: number) {
    try {
        const usuarioJson = await AsyncStorage.getItem('usuario_logado');
        if(usuarioJson != null){
            const usuario = JSON.parse(usuarioJson);
            
            const novoItemDTO: ItemBacklogCreateDTO = {
                jogoId: jogoId,
                usuarioId: usuario.id,
                ordemId: 1,
                finalizado: false,
                rejogando: false,
                horasJogadas: 0,
                vezesFinalizado: 0
            }

            await api.post('/api/ItemBacklog', novoItemDTO);
            Alert.alert("Sucesso", "Jogo adicionado ao backlog!");
            carregarDadosLocais();
        }    
    } catch(error){
        Alert.alert("Erro", "Falha ao adicionar jogo.");
    }
  }

  async function handleImportarSteam(steamId: number) {
      try {
          setLoading(true);
          const usuarioJson = await AsyncStorage.getItem('usuario_logado');
          
          if(usuarioJson != null){
              const usuario = JSON.parse(usuarioJson);
              
              const payload = {
                  steamId: steamId,
                  usuarioId: usuario.id
              };

              await api.post('/api/ItemBacklog/importar-steam', payload);
              
              Alert.alert("Sucesso", "Jogo importado e adicionado ao backlog!");
              
              setListaSteam(old => old.filter(item => item.steamId !== steamId));
          }
      } catch (error: any) {
          console.error(error);
          const msg = error.response?.data ? String(error.response.data) : "Falha ao importar jogo.";
          Alert.alert("Ops", msg);
          console.log(msg);
      } finally {
          setLoading(false);
      }
  }

  return (
    <View style={styles.container}>
      
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorar Jogos</Text>
      </View>

      <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tabButton, modo === 'local' && styles.tabActive]}
            onPress={() => { setModo('local'); setBusca(''); }}
          >
              <Text style={[styles.tabText, modo === 'local' && styles.tabTextActive]}>Catálogo</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.tabButton, modo === 'steam' && styles.tabActive]}
            onPress={() => { setModo('steam'); setBusca(''); setListaSteam([]); }}
          >
              <Text style={[styles.tabText, modo === 'steam' && styles.tabTextActive]}>Steam (Online)</Text>
          </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.input}
          placeholder={modo === 'local' ? "Filtrar catálogo..." : "Buscar na loja Steam..."}
          value={busca}
          onChangeText={(t) => modo === 'local' ? filtrarLocal(t) : setBusca(t)}
          onSubmitEditing={() => modo === 'steam' && buscarNaSteam()}
          returnKeyType="search"
        />
        {modo === 'steam' && (
            <TouchableOpacity style={styles.searchBtn} onPress={buscarNaSteam}>
                <Ionicons name="search" size={20} color="#fff" />
            </TouchableOpacity>
        )}
      </View>

      {loading ? <ActivityIndicator size="large" color="#6200ee" style={{marginTop: 50}} /> : (
        <FlatList
          data={modo === 'local' ? listaLocalFiltrada : listaSteam}
          
          keyExtractor={(item: any) => modo === 'local' ? String(item.id) : String(item.steamId)}
          contentContainerStyle={{ paddingBottom: 20 }}
          
          ListEmptyComponent={() => (
             <View style={{ alignItems: 'center', marginTop: 50 }}>
                 <Text style={{ color: '#999', textAlign: 'center' }}>
                     {modo === 'local' 
                        ? (busca ? "Nenhum jogo encontrado." : "Tudo limpo! 🚀")
                        : (listaSteam.length === 0 && busca ? "Nenhum resultado na Steam." : "Digite para buscar jogos online.")
                     }
                 </Text>
             </View>
          )}

          renderItem={({ item }) => {
            // @ts-ignore
            const imagemUri = modo === 'local' ? item.icone : item.capa;
            
            return (
                <View style={styles.card}>
                {imagemUri ? (
                    <Image source={{ uri: imagemUri }} style={styles.capa} resizeMode="cover" />
                ) : (
                    <View style={[styles.capa, { backgroundColor: '#ccc' }]} />
                )}
                
                <View style={styles.info}>
                    <Text style={styles.titulo}>{item.titulo}</Text>
                    {modo === 'local' && (
                        // @ts-ignore
                        <Text style={styles.dev}>{item.desenvolvedora}</Text>
                    )}
                    {modo === 'steam' && <Text style={styles.dev}>Steam Store</Text>}
                </View>

                <TouchableOpacity 
                    style={[styles.btnAdd, modo === 'steam' ? styles.btnAddSteam : null]}
                    onPress={() => {
                        if (modo === 'local') {
                            // @ts-ignore
                            handleAdicionarLocal(item.id);
                        } else {
                            // @ts-ignore
                            handleImportarSteam(item.steamId);
                        }
                    }} 
                >
                    <Text style={styles.btnAddText}>
                        {modo === 'local' ? "+ ADD" : "⬇ IMPORTAR"}
                    </Text>
                </TouchableOpacity>
                </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50, paddingBottom: 50 },
  
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { marginRight: 15, padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#333' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#e0e0e0', borderRadius: 10, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: '#fff', elevation: 2 },
  tabText: { fontWeight: 'bold', color: '#777' },
  tabTextActive: { color: '#6200ee' },

  searchContainer: { marginBottom: 20, flexDirection: 'row', gap: 10 },
  input: { 
    flex: 1,
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
  searchBtn: { backgroundColor: '#6200ee', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 15, borderRadius: 10 },

  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 12, 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  capa: { width: 60, height: 80, borderRadius: 8, marginRight: 15 },
  info: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  dev: { fontSize: 12, color: '#666' },
  
  btnAdd: { 
    backgroundColor: '#6200ee', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 6,
    minWidth: 70,
    alignItems: 'center'
  },
  btnAddSteam: {
      backgroundColor: '#2e7d32'
  },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});