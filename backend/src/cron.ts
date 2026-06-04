import cron from "node-cron";

import { fecharDiaPorTurno } from "./services/diario.service";

const FUSO_HORARIO = "America/Manaus";

type Turno = "matutino" | "vespertino" | "noturno";

const execucoesEmAndamento: Partial<Record<Turno, boolean>> = {};

function obterDataHoje(): string {
  return new Intl.DateTimeFormat("sv", {
    timeZone: FUSO_HORARIO,
  }).format(new Date());
}

async function fecharTurnoComSeguranca(turno: Turno): Promise<void> {
  if (execucoesEmAndamento[turno]) {
    console.log(`[CRON] ${turno} já está em execução. Ignorando chamada duplicada.`);
    return;
  }

  const data = obterDataHoje();

  try {
    execucoesEmAndamento[turno] = true;

    const resultado = await fecharDiaPorTurno({
      turno,
      data,
    });

    console.log(
      `[CRON] ${turno} fechado em ${data}: ${resultado.faltas} falta(s) em ${resultado.processados} aluno(s).`,
    );
  } catch (error) {
    console.error(`[CRON] Erro ao fechar turno ${turno}:`, error);
  } finally {
    execucoesEmAndamento[turno] = false;
  }
}

export function iniciarCrons(): void {
  const cronAtivo = process.env.ENABLE_CRON !== "false";

  if (!cronAtivo) {
    console.log("[CRON] Desativado por ENABLE_CRON=false.");
    return;
  }

  cron.schedule(
    "15 11 * * 1-5",
    () => {
      void fecharTurnoComSeguranca("matutino");
    },
    {
      timezone: FUSO_HORARIO,
    },
  );

  cron.schedule(
    "15 17 * * 1-5",
    () => {
      void fecharTurnoComSeguranca("vespertino");
    },
    {
      timezone: FUSO_HORARIO,
    },
  );

  cron.schedule(
    "15 22 * * 1-5",
    () => {
      void fecharTurnoComSeguranca("noturno");
    },
    {
      timezone: FUSO_HORARIO,
    },
  );

  console.log(
    `[CRON] Agendamentos ativos: matutino 11h15, vespertino 17h15, noturno 22h15 (${FUSO_HORARIO})`,
  );
}