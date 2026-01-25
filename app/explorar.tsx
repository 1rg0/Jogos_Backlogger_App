import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator, 
  Alert, 
  FlatList, 
  Image,
  Keyboard,
  StyleSheet,
  Text, 
  TextInput, 
  TouchableOpacity, 
  View,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../src/services/api';
import { ItemBacklog } from '../src/types/ItemBacklog';
import { ItemBacklogCreateDTO } from '../src/types/ItemBacklogDTO';
import { Jogo } from '../src/types/Jogo';

const COLORS = {
    background: '#363B4E',  
    cardBg: 'rgba(0, 0, 0, 0.25)', 
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    success: '#69F0AE',
    steam: '#171A21',
    inputBg: 'rgba(0,0,0,0.3)'
};

interface SteamJogoResult {
    steamId: number;
    titulo: string;
    capa: string;
    icone: string;
}

export default function ExplorarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
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

  async function handleImportarSteam(itemSteam: SteamJogoResult) {
      try {
          setLoading(true);
          const usuarioJson = await AsyncStorage.getItem('usuario_logado');
          
          if(usuarioJson != null){
              const usuario = JSON.parse(usuarioJson);
              
              const payload = {
                  steamId: itemSteam.steamId,
                  usuarioId: usuario.id,
                  iconeUrl: itemSteam.icone || itemSteam.capa
              };

              await api.post('/api/ItemBacklog/importar-steam', payload);
              
              Alert.alert("Sucesso", "Jogo importado e adicionado ao backlog!");
              setListaSteam(old => old.filter(i => i.steamId !== itemSteam.steamId));
          }
      } catch (error: any) {
          console.error(error);
          const msg = error.response?.data ? String(error.response.data) : "Falha ao importar jogo.";
          Alert.alert("Ops", msg);
      } finally {
          setLoading(false);
      }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      
      <View style={[styles.headerRow, { marginTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explorar Jogos</Text>
        <View style={{width: 40}} /> 
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
        <View style={styles.inputWrapper}>
            <Ionicons name="search" size={20} color={COLORS.textSec} style={{marginRight: 8}} />
            <TextInput 
                style={styles.input}
                placeholder={modo === 'local' ? "Filtrar catálogo..." : "Buscar na loja Steam..."}
                placeholderTextColor={COLORS.textSec}
                value={busca}
                onChangeText={(t) => modo === 'local' ? filtrarLocal(t) : setBusca(t)}
                onSubmitEditing={() => modo === 'steam' && buscarNaSteam()}
                returnKeyType="search"
                cursorColor={COLORS.accent}
            />
        </View>
        
        {modo === 'steam' && (
            <TouchableOpacity style={styles.searchBtn} onPress={buscarNaSteam}>
                <Ionicons name="arrow-forward" size={24} color="#fff" />
            </TouchableOpacity>
        )}
      </View>

      {loading ? (
          <View style={{flex: 1, justifyContent: 'center'}}>
              <ActivityIndicator size="large" color={COLORS.accent} />
          </View>
      ) : (
        <FlatList
          data={modo === 'local' ? listaLocalFiltrada : listaSteam}
          
          keyExtractor={(item: any) => modo === 'local' ? String(item.id) : String(item.steamId)}
          contentContainerStyle={{ paddingBottom: 50, paddingHorizontal: 20 }}
          
          ListEmptyComponent={() => (
             <View style={{ alignItems: 'center', marginTop: 80, opacity: 0.5 }}>
                 <Ionicons 
                    name={modo === 'local' ? "library-outline" : "cloud-offline-outline"} 
                    size={60} 
                    color={COLORS.textSec} 
                 />
                 <Text style={{ color: COLORS.textSec, textAlign: 'center', marginTop: 15 }}>
                     {modo === 'local' 
                        ? (busca ? "Nenhum jogo encontrado." : "Tudo limpo! Seu backlog está em dia.")
                        : (listaSteam.length === 0 && busca ? "Nenhum resultado na Steam." : "Digite para buscar jogos online.")
                     }
                 </Text>
             </View>
          )}

          renderItem={({ item }) => {
            // @ts-ignore
            const imagemUri = item.icone || item.capa;
            
            return (
                <View style={styles.card}>
                    {imagemUri ? (
                        <Image source={{ uri: imagemUri }} style={styles.capa} resizeMode="cover" />
                    ) : (
                        <View style={[styles.capa, { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }]}>
                             <Ionicons name="image-outline" size={24} color={COLORS.textSec} />
                        </View>
                    )}
                    
                    <View style={styles.info}>
                        <Text style={styles.titulo} numberOfLines={2}>{item.titulo}</Text>
                        {modo === 'local' ? (
                            // @ts-ignore
                            <Text style={styles.dev} numberOfLines={1}>{item.desenvolvedora}</Text>
                        ) : (
                            <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 4}}>
                                <Ionicons name="logo-steam" size={12} color={COLORS.textSec} style={{marginRight: 4}} />
                                <Text style={styles.dev}>Steam Store</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity 
                        style={[styles.btnAdd, modo === 'steam' && styles.btnAddSteam]}
                        onPress={() => {
                            if (modo === 'local') {
                                // @ts-ignore
                                handleAdicionarLocal(item.id);
                            } else {
                                // @ts-ignore
                                handleImportarSteam(item);
                            }
                        }} 
                        activeOpacity={0.7}
                    >
                        {modo === 'local' ? (
                            <Ionicons name="add" size={24} color="#fff" />
                        ) : (
                            <Ionicons name="cloud-download-outline" size={20} color="#fff" />
                        )}
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
  container: { flex: 1, backgroundColor: COLORS.background, paddingBottom: 50 },
  
  headerRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingBottom: 15,
      paddingTop: 10
  },
  backButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: COLORS.cardBg
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.text },

  tabContainer: { 
      flexDirection: 'row', 
      backgroundColor: 'rgba(0,0,0,0.2)', 
      borderRadius: 12, 
      padding: 4, 
      marginHorizontal: 20,
      marginBottom: 20 
  },
  tabButton: { 
      flex: 1, 
      paddingVertical: 10, 
      alignItems: 'center', 
      borderRadius: 10 
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textSec },
  tabTextActive: { color: '#fff' },

  searchContainer: { 
      marginHorizontal: 20, 
      marginBottom: 20, 
      flexDirection: 'row', 
      gap: 10 
  },
  inputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.inputBg,
      borderRadius: 12,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
  },
  input: { 
    flex: 1,
    paddingVertical: 12,
    fontSize: 16, 
    color: '#fff' 
  },
  searchBtn: { 
      backgroundColor: COLORS.primary, 
      justifyContent: 'center', 
      alignItems: 'center', 
      width: 50,
      borderRadius: 12 
  },

  card: { 
    backgroundColor: COLORS.cardBg, 
    borderRadius: 16, 
    marginBottom: 12, 
    padding: 10, 
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent'
  },
  capa: { width: 50, height: 50, borderRadius: 8, marginRight: 15, backgroundColor: '#222' },
  
  info: { flex: 1 },
  titulo: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  dev: { fontSize: 12, color: COLORS.textSec },
  
  btnAdd: { 
    backgroundColor: COLORS.primary, 
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },
  btnAddSteam: {
      backgroundColor: '#2E7D32' 
  },
});