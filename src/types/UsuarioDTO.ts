// 'export' significa que outros arquivos podem importar e usar essa interface
export interface UsuarioCreateDTO {
  // Campo obrigatório: nomeDoCampo: tipo;
  nome: string;
  email: string;
  senha: string; 
  
  // Campo de Data: O JSON viaja como string "2000-01-01"
  dataNascimento: string; 
  
  // Campo Numérico (Enum): 0, 1 ou 2
  genero: number; 
  
  // Campo Opcional: O '?' diz que pode ser nulo ou não existir
  telefone?: string; 
  steamId?: string;
  imagemPerfil?: string;
}