import type { Metadata } from 'next';
import { HubInfoPage } from '@/components/HubInfoPage';

export const metadata: Metadata = {
  title: 'Termos de Uso',
  description: 'Consulte os termos de uso do Tempale.',
};

const lastUpdated = '29 de julho de 2026';
const contactInfo = 'Canal oficial de contato a configurar.';

const sections = [
  ['Aceitacao dos termos', 'Ao acessar ou jogar Tempale, voce concorda com estes Termos de Uso. Se nao concordar, nao utilize o hub.'],
  ['Como o Tempale funciona', 'Tempale e um hub de jogos sociais. BatePrimeiro e o jogo de perguntas com buzzer; os demais jogos podem ter regras proprias dentro da mesma estrutura de salas.'],
  ['Partidas online e locais', 'O jogo pode ser usado em partidas online, com sala, codigo e conexao em tempo real, ou em modo local quando disponivel. Cada modo pode ter configuracoes proprias.'],
  ['Responsabilidades dos usuarios', 'Os usuarios sao responsaveis pelos nomes que escolhem, pelo uso dos codigos de sala e pela forma como participam das partidas. Nao use o servico para ofensas, fraude, abuso ou interrupcao proposital.'],
  ['Conteudo das perguntas', 'Perguntas, palavras, valores, alternativas e explicacoes podem conter erros, ambiguidades ou informacoes desatualizadas. O recurso de reportar problema ajuda a revisar esse conteudo.'],
  ['Disponibilidade do servico', 'O Tempale pode ficar indisponivel temporariamente por manutencao, falhas tecnicas, instabilidade de rede ou alteracoes futuras.'],
  ['Alteracoes futuras', 'Estes termos podem ser atualizados para refletir mudancas no hub, nos jogos, em seus recursos ou em suas regras de uso.'],
  ['Limitacao de responsabilidade', 'O Tempale e fornecido para entretenimento. Dentro dos limites permitidos pela legislacao aplicavel, nao nos responsabilizamos por perdas decorrentes de instabilidade, erros de conteudo ou uso inadequado.'],
  ['Contato', contactInfo],
];

export default function TermsPage() {
  return (
    <HubInfoPage
      eyebrow="Tempale"
      title="Termos de Uso"
      description={`Ultima atualizacao: ${lastUpdated}. Leia as regras gerais para usar o hub, criar salas e participar das partidas.`}
    >
      <article className="rounded-[2rem] border border-white/72 bg-white/52 p-5 shadow-[0_28px_80px_rgba(15,23,42,0.20)] backdrop-blur-xl sm:p-8 lg:p-10">
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map(([title, text], index) => (
            <section key={title} className="rounded-3xl border border-white/70 bg-white/54 p-5 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[#3B82F6]">
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
