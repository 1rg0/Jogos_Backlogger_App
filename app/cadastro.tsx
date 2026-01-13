// Importa o hook 'useRouter' do Expo Router. É ele que nos permite navegar (ir e voltar) entre as telas.
import { useRouter } from 'expo-router';

// Importa o React e o hook 'useState'.
// 'useState' é a memória do componente.
import React, { useState } from 'react';

// Importa os componentes visuais nativos do React Native.
// - Alert: Para mostrar popups de aviso.
// - KeyboardAvoidingView: Para o teclado não cobrir a tela.
// - Platform: Para saber se é Android ou iOS (comportamentos diferentes).
// - ScrollView: Para a tela rolar se for maior que o celular.
// - StyleSheet: Para criar o CSS (estilos).
// - Text: Para escrever textos.
// - TextInput: A caixa de digitação.
// - TouchableOpacity: Qualquer coisa que você queira clicar (botões).
import {
  Alert,
  KeyboardAvoidingView, Platform,
  ScrollView,
  StyleSheet,
  Text, TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// Importa a nossa configuração do Axios (o mensageiro que fala com o Backend).
import api from '../src/services/api';

// Importa a Interface TypeScript que define como deve ser o objeto de usuário.
import { UsuarioCreateDTO } from '../src/types/UsuarioDTO';

// Define a função principal da tela. O 'export default' diz que este arquivo "entrega" essa tela para quem chamar.
export default function CadastroScreen() {

  // Cria a variável 'router' usando o hook. Agora podemos chamar router.back() ou router.push().
  const router = useRouter();

  // --- ESTADOS (useState) ---
  // Sintaxe: const [variávelLeitura, funcaoModificadora] = useState(valorInicial);

  // Guarda o nome digitado. Começa vazio ('').
  const [nome, setNome] = useState('');
  
  // Guarda o email digitado.
  const [email, setEmail] = useState('');
  
  // Guarda a senha digitada.
  const [senha, setSenha] = useState('');
  
  // Guarda o telefone.
  const [telefone, setTelefone] = useState('');
  
  // Guarda a data. Por enquanto é texto livre.
  const [dataNascimento , setDataNascimento] = useState('');
  
  // Guarda o Gênero. Começa com 0 (Masculino) pois é um número (Enum do C#).
  const [genero, setGenero] = useState(0);
  
  // Guarda a URL ou Base64 da imagem (vazio por padrão).
  const [imagemPerfil, setImagemPerfil] = useState('');
  
  // Guarda o ID da Steam (vazio por padrão).
  const [steamId, setSteamId] = useState('');

  // Função assíncrona (async) porque vai conversar com a Internet (Backend), o que demora.
  async function handleCadastro() {
    
    // --- VALIDAÇÃO ---
    // Verifica se algum campo obrigatório está vazio. O !nome verifica se é null, undefined ou "".
    if (!nome || !email || !senha || !dataNascimento || genero === undefined || genero === null) {
      // Mostra um alerta nativo do celular (Título, Mensagem).
      Alert.alert("Erro", "Preencha os campos obrigatórios (*)");
      // O 'return' para a função aqui. Nada abaixo é executado.
      return;
    }

    try {
      // --- MONTAGEM DO DTO ---
      // Criamos o objeto Javascript que será enviado.
      // A tipagem ': UsuarioCreateDTO' garante que não esquecemos campos ou erramos tipos.
      const usuarioDTO: UsuarioCreateDTO = {
        nome: nome,              // Chave (DTO): Valor (Estado)
        email: email,
        senha: senha,            // Mapeia o estado 'senha' para o campo 'senha' do DTO
        dataNascimento: dataNascimento,
        genero: genero,
        telefone: telefone,
        imagemPerfil: imagemPerfil,
        steamId: steamId
      };

      // --- ENVIO PARA O BACKEND ---
      // Chama o método POST na rota '/Usuario'.
      // O 'await' diz: "Espere o backend responder antes de continuar".
      await api.post('/Usuario', usuarioDTO); 
      
      // Se chegou aqui, o backend retornou sucesso (200 ou 201).
      Alert.alert("Sucesso", "Conta criada!");
      
      // Manda o usuário de volta para a tela anterior (Login).
      router.back(); 

    } catch (error) {
      // Se o backend der erro (400, 500) ou a internet cair, cai aqui.
      console.error(error); // Mostra o erro detalhado no terminal.
      Alert.alert("Erro", "Falha ao criar conta.");
    }
  }

return (
    // KeyboardAvoidingView: O componente mágico.
    // behavior='padding': No iOS, ele adiciona um preenchimento embaixo para empurrar tudo pra cima.
    // behavior='height': No Android, ele diminui a altura da tela.
    // style={{ flex: 1 }}: Ocupa a tela inteira.
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={{ flex: 1 }}
    >
      
      {/* ScrollView: Permite rolar a tela se o conteúdo for grande. */}
      {/* contentContainerStyle: Estilo do "miolo" da rolagem (paddings internos). */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* Título da página */}
        <Text style={styles.title}>Crie sua conta</Text>

        {/* --- CAMPO NOME --- */}
        <Text style={styles.label}>Nome Completo *</Text>
        <TextInput 
            style={styles.input}      // Estilo da caixinha (bordas, cor)
            placeholder="Seu nome"    // Texto cinza de dica
            value={nome}              // O valor que aparece é o do Estado
            onChangeText={setNome}    // Ao digitar, atualiza o Estado
        />
        
        {/* --- CAMPO DATA --- */}
        <Text style={styles.label}>Data de Nascimento *</Text>
        <TextInput
            style={styles.input}
            placeholder='YYYY-MM-DD'
            value={dataNascimento}
            onChangeText={setDataNascimento}
        />

        {/* --- SELEÇÃO DE GÊNERO (BOTÕES) --- */}
        <Text style={styles.label}>Gênero *</Text>
        
        {/* Botão Masculino */}
        <TouchableOpacity
            // Estilo dinâmico: Se genero for 0, fundo verde ('lime'). Se não, transparente.
            style={{backgroundColor: genero === 0 ? 'lime' : 'transparent'}}
            // Ao clicar, chama setGenero(0). O componente redesenha e aplica o estilo acima.
            onPress={() => setGenero(0)}
        >
            <Text>Masculino</Text>
        </TouchableOpacity>

        {/* Botão Feminino */}
        <TouchableOpacity
            // Estilo dinâmico: Se genero for 1, fundo verde ('lime'). Se não, transparente.
            style={{backgroundColor: genero === 1 ? 'lime' : 'transparent'}}
            // Ao clicar, chama setGenero(1). O componente redesenha e aplica o estilo acima.
            onPress={() => setGenero(1)}
        >
            <Text>Feminino</Text>
        </TouchableOpacity>

        {/* Botão Outro */}
        <TouchableOpacity
            // Estilo dinâmico: Se genero for 2, fundo verde ('lime'). Se não, transparente.
            style={{backgroundColor: genero === 2 ? 'lime' : 'transparent'}}
            // Ao clicar, chama setGenero(2). O componente redesenha e aplica o estilo acima.
            onPress={() => setGenero(2)}
        >
            <Text>Outro</Text>
        </TouchableOpacity>

        {/* Botão Prefiro não dizer */}
        <TouchableOpacity
            // Estilo dinâmico: Se genero for 3, fundo verde ('lime'). Se não, transparente.
            style={{backgroundColor: genero === 3 ? 'lime' : 'transparent'}}
            // Ao clicar, chama setGenero(3). O componente redesenha e aplica o estilo acima.
            onPress={() => setGenero(3)}
        >
            <Text>Prefiro não dizer</Text>
        </TouchableOpacity>

        {/* --- CAMPO EMAIL --- */}
        <Text style={styles.label}>E-mail *</Text>
        <TextInput 
            style={styles.input} 
            placeholder="exemplo@email.com"
            keyboardType="email-address" // Muda o teclado (coloca @ visível)
            autoCapitalize="none"        // Não deixa a primeira letra maiúscula
            value={email}
            onChangeText={setEmail}
        />

        {/* --- CAMPO SENHA --- */}
        <Text style={styles.label}>Senha *</Text>
        <TextInput 
            style={styles.input} 
            placeholder="******"
            secureTextEntry={true} // Protege visualização de senha
            value={senha}
            onChangeText={setSenha}
        />

        {/* --- CAMPOS OPCIONAIS --- */}
        <Text style={styles.label}>Telefone</Text>
        <TextInput
            style={styles.input}
            placeholder='+5511999999999'
            value={telefone}
            onChangeText={setTelefone}
        />

        <Text style={styles.label}>Steam ID</Text>
        <TextInput
            style={styles.input}
            value={steamId}
            onChangeText={setSteamId}
        />

        {/* --- BOTÃO DE AÇÃO PRINCIPAL --- */}
        <TouchableOpacity style={styles.button} onPress={handleCadastro}>
          <Text style={styles.buttonText}>CRIAR CONTA</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 24, paddingBottom: 50, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#333', textAlign: 'center' },
  label: { fontSize: 16, fontWeight: '600', color: '#555', marginBottom: 8, marginTop: 12 },
  input: { 
    backgroundColor: '#fff', 
    borderWidth: 1, 
    borderColor: '#ddd', 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 16 
  },
  button: { 
    backgroundColor: '#6200ee', 
    padding: 16, 
    borderRadius: 8, 
    marginTop: 30, 
    alignItems: 'center' 
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  genreContainer: {
    flexDirection: 'row', // Itens lado a lado
    justifyContent: 'space-between', // Espalha eles igualmente
    marginBottom: 10,
  },
  genreButton: {
    flex: 1, // Cada botão tenta ocupar o mesmo espaço
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4, // Espacinho entre eles
    alignItems: 'center',
  },
  genreButtonSelected: {
    backgroundColor: '#6200ee', // Cor de destaque quando selecionado
    borderColor: '#6200ee',
  },
  genreText: {
    color: '#333',
  },
  genreTextSelected: {
    color: '#fff', // Texto branco no fundo roxo
    fontWeight: 'bold',
  }
});