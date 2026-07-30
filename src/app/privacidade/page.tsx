import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Política de Privacidade | BatePrimeiro',
  description: 'Consulte a política de privacidade do BatePrimeiro.',
};

const lastUpdated = '29 de julho de 2026';
const contactInfo = 'Canal oficial de contato a configurar.';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#3B82F6] rounded-xl">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#3B82F6]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 w-full">
        <article className="bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#3B82F6]">BatePrimeiro</p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
              Política de Privacidade
            </h1>
            <p className="mt-3 text-sm text-[#64748B]">Ultima atualizacao: {lastUpdated}</p>
          </div>

          <div className="mt-8 space-y-7 text-sm sm:text-base text-[#475569] leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">1. Dados usados nas partidas</h2>
              <p className="mt-2">
                Para criar ou entrar em uma partida online, o BatePrimeiro usa o nome informado pelo jogador,
                o nome da sala, o codigo da sala, configuracoes da partida, identificadores de jogador e
                estado da partida. Esses dados sao necessarios para organizar o lobby, sincronizar jogadores,
                placar, perguntas e reconexao.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">2. Dados tecnicos e logs</h2>
              <p className="mt-2">
                O servidor pode registrar eventos tecnicos como conexao, criacao de sala, entrada em sala,
                reconexao, saida e erros internos. Esses registros ajudam a diagnosticar falhas e manter o
                funcionamento do jogo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">3. Relatorios de problemas em perguntas</h2>
              <p className="mt-2">
                Quando o usuario reporta um problema em uma pergunta, o projeto registra o identificador da
                pergunta, motivo selecionado, data, modo da partida, categoria e dificuldade. Esse registro e
                usado para revisar o banco de perguntas.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">4. Armazenamento local no navegador</h2>
              <p className="mt-2">
                O projeto usa armazenamento do navegador para manter dados de sessao da sala, como codigo da
                sala, identificador de jogador e token de reconexao. Tambem pode salvar rascunhos de quiz
                personalizado no navegador do proprio usuario para evitar perda do trabalho.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">5. Finalidade do uso dos dados</h2>
              <p className="mt-2">
                Os dados sao usados para permitir partidas online, partidas locais, reconexao, exibicao de
                placar, configuracao de salas, revisao de problemas em perguntas e melhoria da estabilidade do
                jogo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">6. Compartilhamento</h2>
              <p className="mt-2">
                Durante uma partida, nomes de jogadores, placar, estado da sala e eventos do jogo podem ser
                exibidos para outros participantes da mesma sala. Nao identificamos no codigo atual recursos de
                contas, pagamentos, anuncios, analytics ou banco de usuarios.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">7. Seguranca e retencao</h2>
              <p className="mt-2">
                O jogo usa identificadores e tokens de jogador para reconectar participantes a uma sala. Salas
                e historicos de partida podem ser removidos quando deixam de ser necessarios. Dados armazenados
                no navegador podem ser apagados pelo proprio usuario nas configuracoes do navegador.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">8. Direitos do usuario</h2>
              <p className="mt-2">
                O usuario pode escolher nao informar um nome real, sair de uma partida, limpar dados locais do
                navegador e solicitar orientacoes pelo canal oficial quando ele estiver configurado.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">9. Dados de menores</h2>
              <p className="mt-2">
                O BatePrimeiro e um jogo de entretenimento. Menores devem utilizar o jogo com acompanhamento
                de responsavel quando necessario, especialmente em partidas online com outras pessoas.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">10. Mudancas nesta politica</h2>
              <p className="mt-2">
                Esta politica pode ser atualizada para refletir mudancas no jogo, em seus recursos ou em suas
                praticas tecnicas. A versao publicada nesta pagina substitui versoes anteriores.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">11. Contato</h2>
              <p className="mt-2">{contactInfo}</p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
