// src/types/Jogo.ts
export interface Jogo {
  id: number;
  titulo: string;
  icone?: string; // O '?' indica que pode vir null
  dataLancamento: string;
  desenvolvedora: string;
  distribuidora: string;
  horasParaZerar: number;
  generos: string[]; // A lista de nomes que criamos no controller
}