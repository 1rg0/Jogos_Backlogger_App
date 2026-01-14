export interface ItemBacklog {
  id: number;
  jogo: {
    titulo: string;
    icone?: string;
    dataLancamento: string;
    horasParaZerar: number;
    desenvolvedora: string;
  };
  horasJogadas: number;
  rejogando: boolean;
  ordemId: number;
}