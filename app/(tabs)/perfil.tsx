import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, 
    ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Image 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import api, {API_URL} from '../../src/services/api';
import { UsuarioDetailDTO } from '../../src/types/UsuarioDTO';

export default function PerfilScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioDetailDTO | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [loadingSenha, setLoadingSenha] = useState(false);

  useFocusEffect(
    useCallback(() => {
      carregarPerfilCompleto();
    }, [])
  );

  async function carregarPerfilCompleto() {
    try {
      setLoading(true);
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      
      if (jsonValue != null) {
        const usuarioLogado = JSON.parse(jsonValue);
        const response = await api.get(`/api/Usuario/${usuarioLogado.id}`);
        setUsuario(response.data);
      }
    } catch (e) {
      console.error("Erro ao carregar perfil:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAlterarSenha() {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        Alert.alert("Atenção", "Preencha todos os campos.");
        return;
    }

    if (novaSenha !== confirmarSenha) {
        Alert.alert("Erro", "A nova senha e a confirmação não batem.");
        return;
    }

    if (novaSenha.length < 6) {
        Alert.alert("Senha Fraca", "A nova senha deve ter pelo menos 6 caracteres.");
        return;
    }

    try {
        setLoadingSenha(true);
        if (!usuario) return;

        await api.patch(`/api/Usuario/${usuario.id}/alterar-senha`, {
            senhaAtual: senhaAtual,
            novaSenha: novaSenha
        });

        Alert.alert("Sucesso", "Senha alterada com sucesso!");
        setModalVisible(false);
        limparCamposSenha();

    } catch (error: any) {
        console.error(error);
        const msg = error.response?.data ? String(error.response.data) : "Erro ao alterar senha.";
        Alert.alert("Erro", msg);
    } finally {
        setLoadingSenha(false);
    }
  }

  const limparCamposSenha = () => {
    setSenhaAtual('');
    setNovaSenha('');
    setConfirmarSenha('');
  }

  async function handleLogout() {
    Alert.alert("Sair", "Deseja realmente sair da sua conta?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Sair", style: "destructive", onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/'); 
          }
        }
      ]
    );
  }

  const getGeneroTexto = (g: number) => {
    switch(g) { case 0: return 'Masculino'; case 1: return 'Feminino'; case 2: return 'Outro'; default: return 'Não informado'; }
  };
  const formatarData = (d: string) => d ? d.split('T')[0].split('-').reverse().join('/') : '-';

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#6200ee" /></View>;
  if (!usuario) return <View style={styles.center}><Text>Erro ao carregar.</Text></View>;

  return (
    <View style={{flex: 1}}>
        <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>
        
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {usuario.imagemPerfil ? (
                        <Image 
                            source={{ uri: `${API_URL}${usuario.imagemPerfil}` }} 
                            style={styles.avatarImage} 
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {usuario.nome?.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>

                <Text style={styles.nome}>{usuario.nome}</Text>
                <Text style={styles.email}>{usuario.email}</Text>
                <View style={[styles.badge, { backgroundColor: usuario.ativo ? '#e8f5e9' : '#ffebee' }]}>
                    <Text style={{ color: usuario.ativo ? '#2e7d32' : '#c62828', fontSize: 12, fontWeight: 'bold' }}>
                        {usuario.ativo ? 'CONTA ATIVA' : 'INATIVA'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                <InfoRow label="ID" value={`#${usuario.id}`} />
                <InfoRow label="Nascimento" value={formatarData(usuario.dataNascimento)} />
                <InfoRow label="Gênero" value={getGeneroTexto(usuario.genero)} />
                <InfoRow label="Celular" value={usuario.telefone || "Não cadastrado"} />
                <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => router.push('/editar-perfil')}
                >
                    <Text style={styles.btnEditText}>Editar Dados</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Segurança</Text>
                
                <TouchableOpacity style={styles.btnAction} onPress={() => setModalVisible(true)}>
                    <Text style={styles.btnActionText}>Alterar Senha</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Integrações</Text>
                <InfoRow label="Steam ID" value={usuario.steamId || "Não vinculado"} />
                
                {usuario.steamId && (
                    <TouchableOpacity 
                        style={styles.btnAction} 
                        onPress={() => router.push('/importar-biblioteca')}
                    >
                        <Text style={styles.btnActionText}>Sincronizar Jogos</Text>
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
                <Text style={styles.btnLogoutText}>SAIR DO APP</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Versão 1.0.0</Text>
        </ScrollView>

        <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisible(false)}
        >
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Alterar Senha</Text>
                    
                    <Text style={styles.labelInput}>Senha Atual</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={senhaAtual} 
                        onChangeText={setSenhaAtual} 
                    />

                    <Text style={styles.labelInput}>Nova Senha</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={novaSenha} 
                        onChangeText={setNovaSenha} 
                    />

                    <Text style={styles.labelInput}>Confirmar Nova Senha</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={confirmarSenha} 
                        onChangeText={setConfirmarSenha} 
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.btnCancel]} 
                            onPress={() => { setModalVisible(false); limparCamposSenha(); }}
                        >
                            <Text style={styles.textCancel}>Cancelar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.modalBtn, styles.btnConfirm]} 
                            onPress={handleAlterarSenha}
                            disabled={loadingSenha}
                        >
                            {loadingSenha ? <ActivityIndicator color="#fff"/> : <Text style={styles.textConfirm}>Salvar</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    </View>
  );
}

const InfoRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.infoRow}>
        <Text style={styles.label}>{label}:</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarContainer: { 
    width: 90, height: 90, borderRadius: 45, backgroundColor: '#6200ee', 
    justifyContent: 'center', alignItems: 'center', marginBottom: 10, elevation: 4,
    overflow: 'hidden'
  },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  avatarImage: { width: 90, height: 90, borderRadius: 45 },

  nome: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 14, color: '#666', marginTop: 2 },
  badge: { marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#444', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 5 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  label: { color: '#666', fontSize: 14 },
  value: { color: '#333', fontSize: 14, fontWeight: '500' },

  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  btnActionText: { fontSize: 16, color: '#6200ee', fontWeight: '600' },

  btnLogout: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d32f2f', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnLogoutText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 14 },
  version: { textAlign: 'center', color: '#ccc', marginTop: 20, fontSize: 10 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 20, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15, textAlign: 'center', color: '#333' },
  labelInput: { color: '#666', marginBottom: 5, fontSize: 12, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: '#f0f0f0' },
  btnConfirm: { backgroundColor: '#6200ee' },
  textCancel: { color: '#333', fontWeight: 'bold' },
  textConfirm: { color: '#fff', fontWeight: 'bold' },

  btnEdit: { 
    marginTop: 15, 
    padding: 10, 
    backgroundColor: '#f0e6fc',
    borderRadius: 8, 
    alignItems: 'center' 
  },
  btnEditText: { 
    color: '#6200ee', 
    fontWeight: 'bold',
    fontSize: 14
  },
});