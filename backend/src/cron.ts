import cron from 'node-cron';
import { fecharDiaPorTurno } from './services/diario.service';

function obterDataHoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export function iniciarCrons(): void {
  // Matutino: fecha às 11h15 (Manaus, GMT-4)
  cron.schedule(
    '15 11 * * 1-5',
    async () => {
      const data = obterDataHoje();
      try {
        const resultado = await fecharDiaPorTurno({ turno: 'matutino', data });
        console.log(`[CRON] Matutino fechado: ${resultado.faltas} falta(s) em ${resultado.processados} aluno(s).`);
      } catch (error) {
        console.error('[CRON] Erro ao fechar turno matutino:', error);
      }
    },
    { timezone: 'America/Manaus' },
  );

  // Vespertino: fecha às 17h15 (Manaus, GMT-4)
  cron.schedule(
    '15 17 * * 1-5',
    async () => {
      const data = obterDataHoje();
      try {
        const resultado = await fecharDiaPorTurno({ turno: 'vespertino', data });
        console.log(`[CRON] Vespertino fechado: ${resultado.faltas} falta(s) em ${resultado.processados} aluno(s).`);
      } catch (error) {
        console.error('[CRON] Erro ao fechar turno vespertino:', error);
      }
    },
    { timezone: 'America/Manaus' },
  );

  // Noturno: fecha às 22h15 (Manaus, GMT-4)
  cron.schedule(
    '15 22 * * 1-5',
    async () => {
      const data = obterDataHoje();
      try {
        const resultado = await fecharDiaPorTurno({ turno: 'noturno', data });
        console.log(`[CRON] Noturno fechado: ${resultado.faltas} falta(s) em ${resultado.processados} aluno(s).`);
      } catch (error) {
        console.error('[CRON] Erro ao fechar turno noturno:', error);
      }
    },
    { timezone: 'America/Manaus' },
  );

  console.log('[CRON] Agendamentos ativos: matutino 11h15, vespertino 17h15, noturno 22h15 (America/Manaus)');
}
