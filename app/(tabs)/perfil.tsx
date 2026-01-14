import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useFocusEffect } from 'expo-router';
import api from '../../src/services/api';
import { UsuarioDetailDTO } from '../../src/types/UsuarioDTO';

export default function PerfilScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [usuario, setUsuario] = useState<UsuarioDetailDTO | null>(null);

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
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    Alert.alert(
      "Sair",
      "Deseja realmente sair da sua conta?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive", 
          onPress: async () => {
            await AsyncStorage.clear();
            router.replace('/'); 
          }
        }
      ]
    );
  }

  const getGeneroTexto = (g: number) => {
    switch(g) {
        case 0: return 'Masculino';
        case 1: return 'Feminino';
        case 2: return 'Outro';
        case 3: return 'Prefiro não dizer';
        default: return 'Não informado';
    }
  };

  const formatarData = (dataString: string) => {
    if(!dataString) return '-';
    const partes = dataString.split('T')[0].split('-');
    if(partes.length === 3) {
        return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }
    return dataString;
  };

  if (loading) {
    return (
      <View style={[styles.container, {justifyContent: 'center'}]}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  if (!usuario) {
    return (
      <View style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
        <Text>Não foi possível carregar o usuário.</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.btnLogout}>
            <Text style={styles.btnLogoutText}>Voltar ao Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{paddingBottom: 40}}>

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
                {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
            </Text>
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
        
        <InfoRow label="ID de Usuário" value={`#${usuario.id}`} />
        <InfoRow label="Nascimento" value={formatarData(usuario.dataNascimento)} />
        <InfoRow label="Gênero" value={getGeneroTexto(usuario.genero)} />
        <InfoRow label="Celular" value={usuario.telefone || "Não cadastrado"} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Integrações</Text>
        
        <InfoRow label="Steam ID" value={usuario.steamId || "Não vinculado"} />
        {usuario.steamIntegradoEm && (
             <InfoRow label="Sincronizado em" value={formatarData(usuario.steamIntegradoEm)} />
        )}
      </View>

      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>SAIR DO APP</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versão 1.0.0</Text>
    </ScrollView>
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
  
  header: { alignItems: 'center', marginTop: 20, marginBottom: 30 },
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#6200ee', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.2
  },
  avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  nome: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 16, color: '#666', marginTop: 4 },
  
  badge: { marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },

  section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', paddingBottom: 10 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f9f9f9', paddingBottom: 4 },
  label: { color: '#666', fontSize: 15 },
  value: { color: '#333', fontSize: 15, fontWeight: '500' },

  btnLogout: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d32f2f', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnLogoutText: { color: '#d32f2f', fontWeight: 'bold', fontSize: 16 },

  version: { textAlign: 'center', color: '#ccc', marginTop: 30, fontSize: 12 }
});