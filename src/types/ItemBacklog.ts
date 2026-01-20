export interface ItemBacklog {
  id: number;
  jogoId: number;
  usuarioId: number;
  ordemId: number;
  finalizado: boolean;
  rejogando: boolean;
  horasJogadas: number;
  vezesFinalizado: number;

  jogo: {
    id: number;
    titulo: string;
    icone?: string;
    imagem?: string;
    sinopse?: string;
    dataLancamento: string;
    horasParaZerar: number;
    desenvolvedora: string;
    generos?: string[];
  };
}