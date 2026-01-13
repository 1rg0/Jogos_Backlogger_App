import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function PerfilScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    carregarUsuario();
  }, []);

  async function carregarUsuario() {
    try {
      const jsonValue = await AsyncStorage.getItem('usuario_logado');
      if (jsonValue != null) {
        setUsuario(JSON.parse(jsonValue));
      }
    } catch (e) {
      console.error(e);
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

  if (!usuario) {
    return (
      <View style={styles.container}>
        <Text>Carregando perfil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {/* CABEÇALHO DO PERFIL */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
            {/* Placeholder de Avatar (Letra Inicial) */}
            <Text style={styles.avatarText}>
                {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : 'U'}
            </Text>
        </View>
        <Text style={styles.nome}>{usuario.nome}</Text>
        <Text style={styles.email}>{usuario.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minha Conta</Text>
        
        <View style={styles.infoRow}>
            <Text style={styles.label}>ID de Usuário:</Text>
            <Text style={styles.value}>#{usuario.id}</Text>
        </View>

        <View style={styles.infoRow}>
            <Text style={styles.label}>Gênero:</Text>
            <Text style={styles.value}>
                {usuario.genero === 0 ? 'Masculino' : usuario.genero === 1 ? 'Feminino' : 'Outro'}
            </Text>
        </View>

        {usuario.steamId ? (
             <View style={styles.infoRow}>
                <Text style={styles.label}>Steam ID:</Text>
                <Text style={styles.value}>{usuario.steamId}</Text>
            </View>
        ) : null}
      </View>

      {/* BOTÃO SAIR */}
      <TouchableOpacity style={styles.btnLogout} onPress={handleLogout}>
        <Text style={styles.btnLogoutText}>SAIR DO APP</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Versão 1.0.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  
  header: { alignItems: 'center', marginTop: 40, marginBottom: 30 },
  avatarContainer: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: '#6200ee', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15,
    elevation: 5
  },
  avatarText: { fontSize: 40, color: '#fff', fontWeight: 'bold' },
  nome: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  email: { fontSize: 16, color: '#666', marginTop: 5 },

  section: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 20, elevation: 2 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#333', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { color: '#666', fontSize: 16 },
  value: { color: '#333', fontSize: 16, fontWeight: '500' },

  btnLogout: { backgroundColor: '#d32f2f', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  btnLogoutText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  version: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 12 }
});