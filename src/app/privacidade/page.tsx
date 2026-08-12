import type { Metadata } from 'next';
import { HubInfoPage } from '@/components/HubInfoPage';

export const metadata: Metadata = {
  title: 'Politica de Privacidade',
  description: 'Consulte a politica de privacidade do Tempale.',
};

const lastUpdated = '29 de julho de 2026';
const contactInfo = 'Canal oficial de contato a configurar.';

const sections = [
  ['Dados usados nas partidas', 'Para criar ou entrar em uma partida online, usamos nome do jogador, nome da sala, codigo da sala, configuracoes, identificadores de jogador e estado da partida.'],
  ['Dados tecnicos e logs', 'O servidor pode registrar eventos tecnicos como conexao, criacao de sala, entrada, reconexao, saida e erros internos para diagnosticar falhas e manter o jogo funcionando.'],
  ['Relatorios de problemas', 'Quando um usuario reporta uma pergunta, palavra ou rodada, podemos registrar o identificador do conteudo, motivo, data, modo, categoria e dificuldade para revisao.'],
  ['Armazenamento local', 'O navegador pode guardar dados de sessao, como codigo da sala, identificador de jogador e token de reconexao. Tambem pode salvar rascunhos de conteudo personalizado.'],
  ['Finalidade do uso', 'Os dados permitem partidas online, reconexao, placar, configuracao de salas, revisao de problemas e melhoria da estabilidade dos jogos.'],
  ['Compartilhamento na sala', 'Durante uma partida, nomes, placar, estado da sala e eventos do jogo podem ser exibidos para outros participantes da mesma sala.'],
  ['Seguranca e retencao', 'Usamos identificadores e tokens para reconectar jogadores. Salas e historicos podem ser removidos quando deixam de ser necessarios. Dados locais podem ser apagados no navegador.'],
  ['Direitos do usuario', 'O usuario pode escolher nao informar nome real, sair de uma partida, limpar dados locais e solicitar orientacoes pelo canal oficial quando configurado.'],
  ['Dados de menores', 'O Tempale e um hub de jogos de entretenimento. Menores devem utilizar o jogo com acompanhamento de responsavel quando necessario.'],
  ['Mudancas nesta politica', 'Esta politica pode ser atualizada para refletir mudancas no hub, nos jogos ou em suas praticas tecnicas.'],
  ['Contato', contactInfo],
];

export default function PrivacyPage() {
  return (
    <HubInfoPage
      eyebrow="Privacidade"
      title="Como seus dados sao usados"
      description={`Ultima atualizacao: ${lastUpdated}. Entenda quais dados sustentam as salas, partidas e recursos do hub.`}
    >
      <article className="rounded-[2rem] border border-white/72 bg-white/52 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.20)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(([title, text], index) => (
            <section key={title} className="rounded-3xl border border-white/70 bg-white/54 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#0F766E]">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h2 className="mt-2 text-lg font-black text-[#0F172A]">{title}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-[#475569]">{text}</p>
            </section>
          ))}
        </div>
      </article>
    </HubInfoPage>
  );
}
