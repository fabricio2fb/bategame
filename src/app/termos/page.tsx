import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { Logo } from '@/components/Logo';

export const metadata: Metadata = {
  title: 'Termos de Uso | BatePrimeiro',
  description: 'Consulte os termos de uso do BatePrimeiro.',
};

const lastUpdated = '29 de julho de 2026';
const contactInfo = 'Canal oficial de contato a configurar.';

export default function TermsPage() {
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
            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">Termos de Uso</h1>
            <p className="mt-3 text-sm text-[#64748B]">Ultima atualizacao: {lastUpdated}</p>
          </div>

          <div className="mt-8 space-y-7 text-sm sm:text-base text-[#475569] leading-relaxed">
            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">1. Aceitacao dos termos</h2>
              <p className="mt-2">
                Ao acessar ou jogar BatePrimeiro, voce concorda com estes Termos de Uso. Se nao concordar,
                nao utilize o jogo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">2. Como o BatePrimeiro funciona</h2>
              <p className="mt-2">
                BatePrimeiro e um jogo de perguntas e respostas com buzzer. Quem bater primeiro recebe a vez
                de responder, conforme as regras e configuracoes da partida.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">3. Partidas online e locais</h2>
              <p className="mt-2">
                O jogo pode ser usado em partidas online, com sala, codigo e conexao em tempo real, ou em modo
                local, no mesmo aparelho. Cada modo pode ter configuracoes proprias, como categorias,
                dificuldade, quantidade de perguntas e tempo de resposta.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">4. Responsabilidades dos usuarios</h2>
              <p className="mt-2">
                Os usuarios sao responsaveis pelos nomes que escolhem, pelo uso dos codigos de sala e pela
                forma como participam das partidas. Nao use o jogo para praticar ofensas, fraude, abuso,
                interrupcao proposital das partidas ou qualquer uso indevido do servico.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">5. Conteudo das perguntas</h2>
              <p className="mt-2">
                O banco de perguntas e preparado para o jogo, mas perguntas, alternativas, respostas e
                explicacoes podem conter erros, ambiguidades ou informacoes desatualizadas. Quando existir a
                opcao de reportar problema, o envio ajuda a identificar pontos que precisam de revisao.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">6. Disponibilidade do servico</h2>
              <p className="mt-2">
                O BatePrimeiro pode ficar indisponivel temporariamente por manutencao, falhas tecnicas,
                instabilidade de rede ou alteracoes futuras. Nao garantimos disponibilidade continua ou livre
                de interrupcoes.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">7. Alteracoes futuras</h2>
              <p className="mt-2">
                Estes termos podem ser atualizados para refletir mudancas no jogo, em seus recursos ou em suas
                regras de uso. A versao publicada nesta pagina substitui versoes anteriores.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">8. Limitacao de responsabilidade</h2>
              <p className="mt-2">
                O BatePrimeiro e fornecido para entretenimento. Dentro dos limites permitidos pela legislacao
                aplicavel, nao nos responsabilizamos por perdas decorrentes de instabilidade, erros em
                perguntas, problemas de conexao, uso inadequado por participantes ou decisoes tomadas com base
                no conteudo do jogo.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A]">9. Contato</h2>
              <p className="mt-2">{contactInfo}</p>
            </section>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
