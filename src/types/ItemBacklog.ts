export interface ItemBacklog {
  id: number;
  jogo: {
    titulo: string;
    icone?: string; // Base64
    dataLancamento: string;
    horasParaZerar: number;
    desenvolvedora: string;
  };
  horasJogadas: number;
  rejogando: boolean;
  ordemId: number;
}