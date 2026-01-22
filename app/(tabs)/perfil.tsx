import React, { useState, useCallback } from 'react';
import { 
    View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, 
    ScrollView, Modal, TextInput, KeyboardAvoidingView, Platform, Image, StatusBar 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api, {API_URL} from '../../src/services/api';
import { UsuarioDetailDTO } from '../../src/types/UsuarioDTO';

// --- PALETA DE CORES ---
const COLORS = {
    background: '#363B4E',  
    cardBg: 'rgba(0, 0, 0, 0.25)', 
    primary: '#4F3B78',     
    accent: '#927FBF',      
    highlight: '#C4BBF0',   
    text: '#FFFFFF',
    textSec: '#B0B0B0',
    success: '#69F0AE',
    danger: '#EF5350',
    inputBg: 'rgba(0,0,0,0.3)',
    overlay: 'rgba(0,0,0,0.7)'
};

export default function PerfilScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
  if (!usuario) return <View style={styles.center}><Text style={{color: '#fff'}}>Erro ao carregar.</Text></View>;

  return (
    <View style={{flex: 1, backgroundColor: COLORS.background}}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        
        <ScrollView 
            style={styles.container} 
            contentContainerStyle={{paddingBottom: 100, paddingTop: insets.top}}
        >
            {/* CABEÇALHO DO PERFIL */}
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
                    <TouchableOpacity style={styles.editAvatarBtn} onPress={() => router.push('/editar-perfil')}>
                        <Ionicons name="pencil" size={16} color="#fff" />
                    </TouchableOpacity>
                </View>

                <Text style={styles.nome}>{usuario.nome}</Text>
                <Text style={styles.email}>{usuario.email}</Text>
                
                <View style={[styles.badge, { borderColor: usuario.ativo ? COLORS.success : COLORS.danger }]}>
                    <View style={[styles.statusDot, { backgroundColor: usuario.ativo ? COLORS.success : COLORS.danger }]} />
                    <Text style={{ color: usuario.ativo ? COLORS.success : COLORS.danger, fontSize: 11, fontWeight: 'bold' }}>
                        {usuario.ativo ? 'CONTA ATIVA' : 'INATIVA'}
                    </Text>
                </View>
            </View>

            {/* SEÇÃO: DADOS PESSOAIS */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={20} color={COLORS.highlight} />
                    <Text style={styles.sectionTitle}>Dados Pessoais</Text>
                </View>
                
                <View style={styles.divider} />
                
                <InfoRow label="ID" value={`#${usuario.id}`} />
                <InfoRow label="Nascimento" value={formatarData(usuario.dataNascimento)} />
                <InfoRow label="Gênero" value={getGeneroTexto(usuario.genero)} />
                <InfoRow label="Celular" value={usuario.telefone || "Não cadastrado"} />
                
                <TouchableOpacity 
                    style={styles.btnEdit} 
                    onPress={() => router.push('/editar-perfil')}
                >
                    <Text style={styles.btnEditText}>Editar Informações</Text>
                </TouchableOpacity>
            </View>

            {/* SEÇÃO: INTEGRAÇÕES */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="logo-steam" size={20} color={COLORS.highlight} />
                    <Text style={styles.sectionTitle}>Integrações</Text>
                </View>

                <View style={styles.divider} />

                <InfoRow label="Steam ID" value={usuario.steamId || "Não vinculado"} />
                
                {/* Botão de Importar/Sincronizar (Destaque) */}
                <TouchableOpacity 
                    style={styles.btnSync} 
                    onPress={() => router.push('/importar-biblioteca')}
                    activeOpacity={0.8}
                >
                    <Ionicons name="cloud-download-outline" size={20} color="#fff" style={{marginRight: 8}} />
                    <Text style={styles.btnSyncText}>
                        {usuario.steamId ? "Sincronizar Biblioteca Steam" : "Vincular Steam"}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* SEÇÃO: SEGURANÇA */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.highlight} />
                    <Text style={styles.sectionTitle}>Segurança</Text>
                </View>
                
                <View style={styles.divider} />

                <TouchableOpacity style={styles.btnAction} onPress={() => setModalVisible(true)}>
                    <Text style={styles.btnActionText}>Alterar Senha</Text>
                    <Ionicons name="chevron-forward" size={18} color={COLORS.textSec} />
                </TouchableOpacity>
            </View>

            {/* LOGOUT */}
            <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.danger} style={{marginRight: 8}} />
                <Text style={styles.btnLogoutText}>SAIR DO APP</Text>
            </TouchableOpacity>

            <Text style={styles.version}>Versão 1.0.0</Text>
        </ScrollView>

        {/* MODAL DE SENHA (DARK MODE) */}
        <Modal
            animationType="fade"
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
                        placeholderTextColor="#666"
                        cursorColor={COLORS.accent}
                    />

                    <Text style={styles.labelInput}>Nova Senha</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={novaSenha} 
                        onChangeText={setNovaSenha} 
                        placeholderTextColor="#666"
                        cursorColor={COLORS.accent}
                    />

                    <Text style={styles.labelInput}>Confirmar Nova Senha</Text>
                    <TextInput 
                        style={styles.input} 
                        secureTextEntry 
                        value={confirmarSenha} 
                        onChangeText={setConfirmarSenha} 
                        placeholderTextColor="#666"
                        cursorColor={COLORS.accent}
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
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  
  header: { alignItems: 'center', marginBottom: 25, marginTop: 10 },
  avatarContainer: { 
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.cardBg, 
    justifyContent: 'center', alignItems: 'center', marginBottom: 15,
    borderWidth: 2, borderColor: COLORS.accent,
    position: 'relative'
  },
  avatarText: { fontSize: 40, color: COLORS.highlight, fontWeight: 'bold' },
  avatarImage: { width: 96, height: 96, borderRadius: 48 },
  editAvatarBtn: {
      position: 'absolute', bottom: 0, right: 0, 
      backgroundColor: COLORS.primary, padding: 8, borderRadius: 20,
      borderWidth: 2, borderColor: COLORS.background
  },

  nome: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, letterSpacing: 0.5 },
  email: { fontSize: 14, color: COLORS.textSec, marginTop: 4 },
  
  badge: { 
      marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
      borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },

  // --- SEÇÕES (CARDS) ---
  section: { 
      backgroundColor: COLORS.cardBg, 
      marginHorizontal: 20, borderRadius: 16, 
      padding: 16, marginBottom: 16,
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)'
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.highlight },
  
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 12 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: COLORS.textSec, fontSize: 14 },
  value: { color: COLORS.text, fontSize: 14, fontWeight: '500' },

  // --- BOTÕES ---
  btnEdit: { 
    marginTop: 5, padding: 12, 
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  btnEditText: { color: COLORS.highlight, fontWeight: 'bold', fontSize: 14 },

  btnSync: {
      marginTop: 10, padding: 14,
      backgroundColor: COLORS.primary,
      borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
      shadowColor: "#000", shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4
  },
  btnSyncText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  btnAction: { 
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
      paddingVertical: 12 
  },
  btnActionText: { fontSize: 15, color: COLORS.text },

  btnLogout: { 
      flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
      marginHorizontal: 20, marginTop: 10, marginBottom: 10,
      padding: 14, borderRadius: 12, 
      borderWidth: 1, borderColor: COLORS.danger,
      backgroundColor: 'rgba(239, 83, 80, 0.1)'
  },
  btnLogoutText: { color: COLORS.danger, fontWeight: 'bold', fontSize: 14, letterSpacing: 0.5 },
  version: { textAlign: 'center', color: '#555', marginTop: 10, fontSize: 10 },

  // --- MODAL ---
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'center', padding: 20 },
  modalContent: { 
      backgroundColor: '#2C2C2C', borderRadius: 16, padding: 24, 
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#fff' },
  
  labelInput: { color: COLORS.textSec, marginBottom: 6, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  input: { 
      backgroundColor: 'rgba(0,0,0,0.3)', 
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', 
      borderRadius: 8, padding: 12, marginBottom: 16, 
      fontSize: 16, color: '#fff' 
  },
  
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 10 },
  modalBtn: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  btnCancel: { backgroundColor: 'rgba(255,255,255,0.1)' },
  btnConfirm: { backgroundColor: COLORS.primary },
  textCancel: { color: '#ddd', fontWeight: '600' },
  textConfirm: { color: '#fff', fontWeight: 'bold' },
});