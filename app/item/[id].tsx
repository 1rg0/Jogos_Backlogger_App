import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '../../src/services/api';

// Interface que espelha a estrutura que vem do Backend (ItemBacklog + Jogo dentro)
interface ItemDetalhe {
  id: number;
  jogoId: number;
  usuarioId: number;
  ordemId: number;
  
  // Status editáveis
  finalizado: boolean;
  rejogando: boolean;
  horasJogadas: number;
  vezesFinalizado: number;

  // Dados do Jogo (Aninhados/Nested)
  jogo: {
    id: number;
    titulo: string;
    icone: string;
    sinopse: string;
    desenvolvedora: string;
    horasParaZerar: number;
    generos: string[]; // Supondo que o backend mande lista de strings
  };
}

export default function ItemDetalhesScreen() {
  const { id } = useLocalSearchParams(); // Pega o ID da URL
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [item, setItem] = useState<ItemDetalhe | null>(null);

  // Estados locais para os inputs de texto (Edição)
  const [horasInput, setHorasInput] = useState('0');
  const [vezesInput, setVezesInput] = useState('0');

  useEffect(() => {
    carregarDetalhes();
  }, [id]);

  async function carregarDetalhes() {
    try {
      // Busca o item pelo ID do Backlog
      const response = await api.get(`/api/ItemBacklog/${id}`);
      const dados: ItemDetalhe = response.data;
      
      setItem(dados);
      
      // Preenche os inputs com os dados que vieram do banco
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

  // Função para salvar as alterações no Banco
  async function handleSalvar() {
    if (!item) return;

    try {
      setSalvando(true);

      // Monta o objeto para o PUT
      const payload = {
        id: item.id,
        jogoId: item.jogoId,
        usuarioId: item.usuarioId,
        ordemId: item.ordemId,
        finalizado: item.finalizado,
        rejogando: item.rejogando,
        // Converte os textos dos inputs para números
        horasJogadas: parseFloat(horasInput) || 0,
        vezesFinalizado: parseInt(vezesInput) || 0
      };

      await api.put(`/ItemBacklog/${item.id}`, payload);
      
      Alert.alert("Sucesso", "Dados atualizados!");
      router.back(); // Volta para a Home atualizado
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Falha ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  // Função para alternar os botões de status (Finalizado/Rejogando)
  function toggleStatus(tipo: 'finalizado' | 'rejogando') {
    if (!item) return;

    const novoItem = { ...item }; // Cria cópia para não alterar estado direto

    if (tipo === 'finalizado') {
        novoItem.finalizado = !novoItem.finalizado;
        
        // Regra de Negócio: Se marcou como finalizado, sugere aumentar o contador
        if (novoItem.finalizado) {
            const novasVezes = (parseInt(vezesInput) || 0) + 1;
            setVezesInput(novasVezes.toString());
            novoItem.vezesFinalizado = novasVezes;
        }
    } 
    else if (tipo === 'rejogando') {
        novoItem.rejogando = !novoItem.rejogando;
        // Se começou a rejogar, desmarca finalizado? (Opcional, deixei comentado)
        // if (novoItem.rejogando) novoItem.finalizado = false;
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
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* CABEÇALHO (Capa e Título) */}
      <View style={styles.header}>
        {item.jogo.icone ? (
             <Image source={{ uri: item.jogo.icone }} style={styles.capa} resizeMode='cover' />
        ) : (
             <View style={[styles.capa, { backgroundColor: '#ccc' }]} />
        )}
        <Text style={styles.titulo}>{item.jogo.titulo}</Text>
        <Text style={styles.dev}>{item.jogo.desenvolvedora}</Text>
        
        {/* Chips de Gêneros (Se houver) */}
        <View style={styles.tagsContainer}>
            {item.jogo.generos && item.jogo.generos.map((g, i) => (
                <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{g}</Text>
                </View>
            ))}
        </View>
      </View>

      <View style={styles.divider} />

      {/* CONTROLES DE STATUS */}
      <View style={styles.section}>
        <Text style={styles.labelSection}>Status Atual</Text>
        <View style={styles.row}>
            
            {/* Botão Finalizado */}
            <TouchableOpacity 
                style={[styles.btnStatus, item.finalizado ? styles.btnSuccess : styles.btnOutline]}
                onPress={() => toggleStatus('finalizado')}
            >
                <Text style={[styles.btnText, item.finalizado ? styles.textWhite : styles.textDark]}>
                    {item.finalizado ? "🏆 Finalizado" : "Marcar Finalizado"}
                </Text>
            </TouchableOpacity>

            {/* Botão Rejogando */}
            <TouchableOpacity 
                style={[styles.btnStatus, item.rejogando ? styles.btnInfo : styles.btnOutline]}
                onPress={() => toggleStatus('rejogando')}
            >
                <Text style={[styles.btnText, item.rejogando ? styles.textWhite : styles.textDark]}>
                    {item.rejogando ? "🔄 Rejogando" : "Rejogar?"}
                </Text>
            </TouchableOpacity>
        </View>
      </View>

      {/* INPUTS DE PROGRESSO */}
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

      {/* SINOPSE */}
      <View style={styles.section}>
        <Text style={styles.labelSection}>Sinopse</Text>
        <Text style={styles.sinopseText}>{item.jogo.sinopse || "Sem sinopse disponível."}</Text>
      </View>

      {/* BOTÃO SALVAR */}
      <TouchableOpacity 
        style={styles.btnSalvar} 
        onPress={handleSalvar}
        disabled={salvando}
      >
        {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSalvarText}>SALVAR ALTERAÇÕES</Text>}
      </TouchableOpacity>

      <View style={{height: 40}} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', flexGrow: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { alignItems: 'center', padding: 20, backgroundColor: '#f9f9f9' },
  capa: { width: 140, height: 200, borderRadius: 10, marginBottom: 15, elevation: 5 },
  titulo: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#333' },
  dev: { fontSize: 16, color: '#666', marginTop: 4 },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15, gap: 8 },
  tag: { backgroundColor: '#e0e0e0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 15 },
  tagText: { fontSize: 12, color: '#333' },

  divider: { height: 1, backgroundColor: '#eee', marginVertical: 10 },

  section: { padding: 20, paddingBottom: 5 },
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