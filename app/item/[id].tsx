import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  Alert, 
  Image, 
  ImageBackground, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  StatusBar 
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../src/services/api';

const COLORS = {
    background: '#363B4E',  
    cardBg: '#222', 
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    success: '#69F0AE',
    gold: '#FFD740',
    info: '#4FC3F7',
    inputBg: 'rgba(0,0,0,0.3)',
    overlay: 'rgba(0,0,0,0.7)'
};

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
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  if (!item) return null;

  const bgImage = item.jogo.imagem || item.jogo.icone;

  return (
    <View style={styles.container}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        
        <ImageBackground 
            source={bgImage ? { uri: bgImage } : undefined} 
            style={[styles.headerImage, { paddingTop: insets.top }]}
            resizeMode="cover"
        >
            <View style={styles.headerOverlay} />
            
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
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
        </ImageBackground>

        <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            style={styles.scrollContainer}
        >
          <View style={styles.section}>
            <Text style={styles.labelSection}>Status Atual</Text>
            <View style={styles.row}>
                <TouchableOpacity 
                    style={[styles.btnStatus, item.finalizado ? styles.btnSuccess : styles.btnOutline]}
                    onPress={() => toggleStatus('finalizado')}
                    activeOpacity={0.8}
                >
                    <Ionicons 
                        name={item.finalizado ? "checkmark-circle" : "ellipse-outline"} 
                        size={20} 
                        color={item.finalizado ? "#fff" : COLORS.textSec} 
                        style={{marginRight: 8}}
                    />
                    <Text style={[styles.btnText, item.finalizado ? styles.textWhite : styles.textSec]}>
                        {item.finalizado ? "Finalizado" : "Finalizado?"}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.btnStatus, item.rejogando ? styles.btnInfo : styles.btnOutline]}
                    onPress={() => toggleStatus('rejogando')}
                    activeOpacity={0.8}
                >
                    <Ionicons 
                        name={item.rejogando ? "refresh-circle" : "refresh-circle-outline"} 
                        size={20} 
                        color={item.rejogando ? "#fff" : COLORS.textSec} 
                        style={{marginRight: 8}}
                    />
                    <Text style={[styles.btnText, item.rejogando ? styles.textWhite : styles.textSec]}>
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
                    <View style={styles.inputContainer}>
                        <Ionicons name="time-outline" size={18} color={COLORS.highlight} style={{marginRight: 8}} />
                        <TextInput 
                            style={styles.input}
                            value={horasInput}
                            onChangeText={setHorasInput}
                            keyboardType="numeric"
                            cursorColor={COLORS.accent}
                        />
                    </View>
                </View>

                <View style={{flex: 1}}>
                    <Text style={styles.labelInput}>Vezes Zerado</Text>
                    <View style={styles.inputContainer}>
                        <Ionicons name="trophy-outline" size={18} color={COLORS.gold || '#FFD740'} style={{marginRight: 8}} />
                        <TextInput 
                            style={styles.input}
                            value={vezesInput}
                            onChangeText={setVezesInput}
                            keyboardType="numeric"
                            cursorColor={COLORS.accent}
                        />
                    </View>
                </View>
            </View>
            <Text style={styles.hint}>
                <Ionicons name="information-circle-outline" size={12} /> Tempo estimado para finalizar: {item.jogo.horasParaZerar}h
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.labelSection}>Sinopse</Text>
            <Text style={styles.sinopseText}>
                {item.jogo.sinopse || "Sem sinopse disponível."}
            </Text>
          </View>

        </ScrollView>

        <View style={[styles.footerContainer, { paddingBottom: insets.bottom + 10 }]}>
            <TouchableOpacity 
                style={styles.btnSalvar} 
                onPress={handleSalvar}
                disabled={salvando}
                activeOpacity={0.9}
            >
                {salvando ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.btnSalvarText}>SALVAR ALTERAÇÕES</Text>
                )}
            </TouchableOpacity>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  
  headerImage: {
      width: '100%',
      height: 300,
      justifyContent: 'space-between',
  },
  headerOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backBtn: {
      marginTop: 10,
      marginLeft: 20,
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10
  },
  headerContent: {
      padding: 20,
      paddingBottom: 30,
      backgroundColor: 'rgba(0,0,0,0.6)'
  },
  titulo: { fontSize: 28, fontWeight: 'bold', color: '#fff', textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 },
  dev: { fontSize: 16, color: COLORS.highlight, marginTop: 4, fontWeight: '600' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
  tag: { 
      backgroundColor: 'rgba(255,255,255,0.2)', 
      paddingHorizontal: 10, paddingVertical: 4, 
      borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' 
  },
  tagText: { fontSize: 12, color: '#fff', fontWeight: 'bold' },

  scrollContainer: { 
      flex: 1, 
      backgroundColor: COLORS.background, 
      borderTopLeftRadius: 24, 
      borderTopRightRadius: 24, 
      marginTop: -20,
      paddingTop: 20
  },
  
  section: { 
      padding: 20, 
      backgroundColor: COLORS.cardBg, 
      marginHorizontal: 15, 
      marginBottom: 15, 
      borderRadius: 16, 
      borderWidth: 1, 
      borderColor: 'rgba(255,255,255,0.05)'
  },
  labelSection: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: COLORS.highlight, textTransform: 'uppercase', letterSpacing: 1 },
  
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  
  btnStatus: { 
      flex: 1, 
      padding: 12, 
      borderRadius: 12, 
      alignItems: 'center', 
      borderWidth: 1, 
      justifyContent: 'center',
      flexDirection: 'row'
  },
  btnOutline: { borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'transparent' },
  btnSuccess: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  btnInfo: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  
  btnText: { fontWeight: 'bold', fontSize: 13 },
  textWhite: { color: '#000' },
  textSec: { color: COLORS.textSec },

  labelInput: { fontSize: 12, color: COLORS.textSec, marginBottom: 5, fontWeight: 'bold' },
  inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.inputBg,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      paddingHorizontal: 10
  },
  input: { 
      flex: 1,
      padding: 10, 
      fontSize: 16, 
      color: '#fff', 
      textAlign: 'left'
  },
  hint: { fontSize: 12, color: COLORS.textSec, marginTop: 10, fontStyle: 'italic' },
  
  sinopseText: { fontSize: 15, lineHeight: 24, color: '#ddd', textAlign: 'justify' },

  footerContainer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: COLORS.background,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.05)'
  },
  btnSalvar: { 
      backgroundColor: COLORS.primary, 
      padding: 16, 
      borderRadius: 12, 
      alignItems: 'center', 
      shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 6
  },
  btnSalvarText: { color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 1 },
});