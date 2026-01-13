export interface ItemBacklogCreateDTO{
    jogoId: number,
    usuarioId: number,
    ordemId: number,
    finalizado: boolean,
    rejogando: boolean,
    horasJogadas: number,
    vezesFinalizado: number
}