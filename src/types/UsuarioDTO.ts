export interface UsuarioCreateDTO {
  nome: string;
  email: string;
  senha: string; 
  dataNascimento: string; 
  genero: number; 
  
  telefone?: string; 
  steamId?: string;
  imagemPerfil?: string;
}

export interface UsuarioDetailDTO {
  id: number;
  nome: string;
  email: string;
  dataNascimento: string;
  genero: number; 
  ativo: boolean;
  telefone?: string;
  imagemPerfil?: string;
  steamId?: string;
  steamIntegradoEm?: string;
}

export interface UsuarioUpdateDTO {
    nome: string;
    telefone?: string;
    imagemPerfil?: string;
    steamId?: string;
}