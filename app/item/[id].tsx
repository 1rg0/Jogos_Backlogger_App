import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../src/services/api';

interface ItemDetalhe {
  id: number;
  jogoId: number;
  usuarioId: number;
  ordemId: number;
  finalizado: boolean;
  rejogando: boolean;
  horasJogadas: number;
  vezesFinalizado: number;
  jogo: {
    id: number;
    titulo: string;
    icone: string;
    imagem: string,
    sinopse: string;
    desenvolvedora: string;
    horasParaZerar: number;
    generos: string[];
  };
}

export default function ItemDetalhesScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [item, setItem] = useState<ItemDetalhe | null>(null);

  const [horasInput, setHorasInput] = useState('0');
  const [vezesInput, setVezesInput] = useState('0');

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  async function carregarDetalhes() {
    try {
      const response = await api.get(`/api/ItemBacklog/${id}`);
      const dados: ItemDetalhe = response.data;
      setItem(dados);
      setHorasInput(dados.horasJogadas.toString());
      setVezesInput(dados.vezesFinalizado.toString());
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível carregar os detalhes.");
      router.back();
    } finally {
      setLoading(false);
      
    }
  }

  async function handleSalvar() {
    if (!item) return;
    try {
      setSalvando(true);
      const payload = {
        id: item.id,
        jogoId: item.jogoId,
        usuarioId: item.usuarioId,
        ordemId: item.ordemId,
        finalizado: item.finalizado,
        rejogando: item.rejogando,
        horasJogadas: parseFloat(horasInput) || 0,
        vezesFinalizado: parseInt(vezesInput) || 0
      };
      await api.put(`/api/ItemBacklog/${item.id}`, payload);
      Alert.alert("Sucesso", "Dados atualizados!");
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  function toggleStatus(tipo: 'finalizado' | 'rejogando') {
    if (!item) return;
    const novoItem = { ...item };
    if (tipo === 'finalizado') {
        novoItem.finalizado = !novoItem.finalizado;
        if (novoItem.finalizado) {
            const novasVezes = (parseInt(vezesInput) || 0) + 1;
            setVezesInput(novasVezes.toString());
            novoItem.vezesFinalizado = novasVezes;
        }
    } else if (tipo === 'rejogando') {
        novoItem.rejogando = !novoItem.rejogando;
    }
    setItem(novoItem);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!item) return null;

  return (
    <View style={{ 
        flex: 1, 
        backgroundColor: '#f9f9f9', 
        paddingTop: insets.top,
        paddingBottom: insets.bottom
    }}>
        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
        >
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtnCircle}>
                <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        
          <View style={styles.header}>
            <View style={styles.imageContainer}>
                {item.jogo.imagem ? (
                    <Image 
                        source={{ uri: item.jogo.imagem }} 
                        style={styles.capa} 
                        resizeMode='contain'
                    />
                ) : (
                    <View style={[styles.capa, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image-outline" size={50} color="#fff" />
                    </View>
                )}
            </View>

            <Text style={styles.titulo}>{item.jogo.titulo}</Text>
            <Text style={styles.dev}>{item.jogo.desenvolvedora}</Text>
            
            <View style={styles.tagsContainer}>
                {item.jogo.generos && item.jogo.generos.map((g, i) => (
                    <View key={i} style={styles.tag}>
                        <Text style={styles.tagText}>{g}</Text>
                    </View>
                ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.labelSection}>Status Atual</Text>
            <View style={styles.row}>
                <TouchableOpacity 
                    style={[styles.btnStatus, item.finalizado ? styles.btnSuccess : styles.btnOutline]}
                    onPress={() => toggleStatus('finalizado')}
                >
                    <Text style={[styles.btnText, item.finalizado ? styles.textWhite : styles.textDark]}>
                        {item.finalizado ? "Finalizado" : "Marcar Finalizado"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btnStatus, item.rejogando ? styles.btnInfo : styles.btnOutline]}
                    onPress={() => toggleStatus('rejogando')}
                >
                    <Text style={[styles.btnText, item.rejogando ? styles.textWhite : styles.textDark]}>
                        {item.rejogando ? "Rejogando" : "Rejogar?"}
                    </Text>
                </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.labelSection}>Meu Progresso</Text>
            <View style={styles.row}>
                <View style={{flex: 1, marginRight: 10}}>
                    <Text style={styles.labelInput}>Horas Jogadas</Text>
                    <TextInput 
                        style={styles.input}
                        value={horasInput}
                        onChangeText={setHorasInput}
                        keyboardType="numeric"
                    />
                </View>

                <View style={{flex: 1}}>
                    <Text style={styles.labelInput}>Vezes Zerado</Text>
                    <TextInput 
                        style={styles.input}
                        value={vezesInput}
                        onChangeText={setVezesInput}
                        keyboardType="numeric"
                    />
                </View>
            </View>
            <Text style={styles.hint}>Tempo estimado para zerar: {item.jogo.horasParaZerar}h</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.labelSection}>Sinopse</Text>
            <Text style={styles.sinopseText}>{item.jogo.sinopse || "Sem sinopse disponível."}</Text>
          </View>

          <View style={{backgroundColor: '#fff', paddingBottom: 20}}>
            <TouchableOpacity 
                style={styles.btnSalvar} 
                onPress={handleSalvar}
                disabled={salvando}
            >
                {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSalvarText}>SALVAR ALTERAÇÕES</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'flex-start',
    backgroundColor: '#f9f9f9',
  },
  backBtnCircle: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 20, backgroundColor: '#f9f9f9' },
  
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  capa: { 
    width: '100%', 
    height: 200,
  },
  
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  dev: { fontSize: 16, color: '#666', marginTop: 4 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15, gap: 8 },
  tag: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  tagText: { fontSize: 12, color: '#333' },
  divider: { height: 1, backgroundColor: '#eee', marginHorizontal: 20},
  section: { padding: 20, paddingBottom: 5, backgroundColor: '#fff', marginHorizontal: 15, marginTop: 15, borderRadius: 10, elevation: 1 }, // Cards separados
  labelSection: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  btnStatus: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', borderWidth: 1, justifyContent: 'center' },
  btnOutline: { borderColor: '#ccc', backgroundColor: 'transparent' },
  btnSuccess: { backgroundColor: '#28a745', borderColor: '#28a745' },
  btnInfo: { backgroundColor: '#17a2b8', borderColor: '#17a2b8' },
  btnText: { fontWeight: 'bold', fontSize: 14 },
  textWhite: { color: '#fff' },
  textDark: { color: '#333' },
  labelInput: { fontSize: 14, color: '#666', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 18, backgroundColor: '#fff', textAlign: 'center' },
  hint: { fontSize: 12, color: '#888', marginTop: 8, fontStyle: 'italic' },
  sinopseText: { fontSize: 15, lineHeight: 22, color: '#444', textAlign: 'justify' },
  btnSalvar: { backgroundColor: '#6200ee', margin: 20, padding: 16, borderRadius: 10, alignItems: 'center', elevation: 2 },
  btnSalvarText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 }
});