import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import api from '../src/services/api';
import { ItemBacklogCreateDTO } from '../src/types/ItemBacklogDTO';
import { Jogo } from '../src/types/Jogo';

export default function ExplorarScreen() {
  const router = useRouter();
  
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [catalogo, setCatalogo] = useState<Jogo[]>([]);
  const [listaFiltrada, setListaFiltrada] = useState<Jogo[]>([]);
  
  useEffect(() => {
    carregarCatalogo();
  }, []);

  async function carregarCatalogo() {
    try {
        const response = await api.get(`/api/Jogo`);
        setCatalogo(response.data);
        setListaFiltrada(response.data);

    } catch (error) {
      console.error(error);
    }finally{
        setLoading(false);
    }
  }

  function handleBuscar(texto: string) {
    setBusca(texto);

    if(texto == ''){
        setListaFiltrada(catalogo);
    }else{
        const resultados = catalogo.filter(item => item.titulo.toLowerCase().includes(busca.toLowerCase()));
        setListaFiltrada(resultados);
    }
  }

  async function handleAdicionar(jogoId: number) {
    try{
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
            router.back();
        }    
    }
    catch(error){
        console.error(error);
        Alert.alert("Erro", "Falha ao adicionar jogo.");
    }
    
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Explorar Jogos</Text>

      <View style={styles.searchContainer}>
        <TextInput 
          style={styles.input}
          placeholder="Digite o nome do jogo..."
          value={busca}
          onChangeText={handleBuscar}
        />
      </View>

      {loading ? <ActivityIndicator size="large" color="#6200ee" /> : (
        <FlatList
          data={listaFiltrada} 
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              {item.icone ? (
                <Image source={{ uri: item.icone }} style={styles.capa} />
              ) : (
                <View style={[styles.capa, { backgroundColor: '#ccc' }]} />
              )}
              
              <View style={styles.info}>
                <Text style={styles.titulo}>{item.titulo}</Text>
                <Text style={styles.dev}>{item.desenvolvedora}</Text>
              </View>

              <TouchableOpacity 
                style={styles.btnAdd}
                onPress={() => handleAdicionar(item.id)} 
              >
                <Text style={styles.btnAddText}>+ ADD</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 50, paddingBottom: 50 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#333' },
  searchContainer: { marginBottom: 20 },
  input: { 
    backgroundColor: '#fff', 
    padding: 15, 
    borderRadius: 10, 
    fontSize: 16, 
    borderWidth: 1, 
    borderColor: '#ddd' 
  },
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
    borderRadius: 6 
  },
  btnAddText: { color: '#fff', fontWeight: 'bold', fontSize: 12 }
});