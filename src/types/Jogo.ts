export interface Jogo {
  id: number;
  titulo: string;
  icone?: string;
  dataLancamento: string;
  desenvolvedora: string;
  distribuidora: string;
  horasParaZerar: number;
  generos: string[];
}