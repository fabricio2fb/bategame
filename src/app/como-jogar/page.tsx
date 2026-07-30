import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  DoorOpen,
  Gamepad2,
  HelpCircle,
  KeyRound,
  ListChecks,
  Mic,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Trophy,
  Users,
  Zap,
  XCircle,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const roundSteps = [
  {
    icon: <BookOpen className="w-5 h-5" />,
    title: '1. Leia a pergunta',
    text: 'A rodada comeca mostrando somente a pergunta. As alternativas ficam escondidas para todos.',
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: '2. Aperte o buzzer',
    text: 'Depois da leitura, o botao APERTE aparece. O servidor decide quem clicou primeiro.',
  },
  {
    icon: <ListChecks className="w-5 h-5" />,
    title: '3. Responda sozinho',
    text: 'So o vencedor do buzzer recebe as quatro alternativas e o contador de resposta.',
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    title: '4. Errou? Passa a vez',
    text: 'Quem erra fica bloqueado nessa pergunta. Se restar um jogador, ele recebe a vez automaticamente.',
  },
];

const createSteps = [
  'Clique em Criar partida.',
  'Informe seu nome e o nome da sala.',
  'Escolha modo de jogo, fonte das perguntas, categorias, dificuldade e quantidade.',
  'Defina o tempo de resposta: 5, 10, 15, 20 ou 30 segundos.',
  'Crie a sala e compartilhe o codigo ou o link com os jogadores.',
];

const joinSteps = [
  'Clique em Entrar com codigo ou use o card Entrar em uma sala.',
  'Digite seu nome e cole o codigo da sala.',
  'O codigo e normalizado em maiusculas automaticamente.',
  'No lobby, marque que esta pronto. O host inicia quando todos estiverem preparados.',
];

const settings = [
  ['Perguntas', 'Quantidade de rodadas da partida.'],
  ['Categorias', 'Pode ser uma categoria especifica ou tudo misturado.'],
  ['Dificuldade', 'Facil, media, dificil ou misturada.'],
  ['Tempo', 'Cada jogador recebe o tempo completo quando ganha a vez.'],
  ['Privacidade', 'Sala publica aparece no lobby; sala privada entra por codigo.'],
  ['Resposta', 'Multipla escolha na tela ou resposta falada validada pelo host.'],
];

export default function HowToPlayPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto h-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium text-[#64748B] hover:text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao lobby</span>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1 space-y-8">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-7 bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-semibold">
              <HelpCircle className="w-3.5 h-3.5" />
              Guia completo
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0F172A] tracking-tight">
                Como jogar BatePrimeiro
              </h1>
              <p className="text-base text-[#64748B] leading-relaxed">
                BatePrimeiro é um jogo online de perguntas e respostas com buzzer. Todos veem a pergunta,
                mas somente quem vence o buzzer pode responder. O servidor controla a vez, o tempo,
                a pontuacao e a troca de pergunta.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/criar-partida"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Criar partida
              </Link>
              <Link
                href="/entrar"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] border border-[#CBD5E1] font-semibold text-sm rounded-xl transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                Entrar com codigo
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 bg-[#0F172A] border-2 border-black/15 rounded-2xl p-5 sm:p-6 text-white shadow-sm">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 space-y-4">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Pergunta 3/15</span>
                <span className="inline-flex items-center gap-1 text-[#F59E0B] font-bold"><Clock className="w-3.5 h-3.5" />10s</span>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                <p className="text-[11px] font-bold text-sky-300 uppercase mb-2">Conhecimentos Gerais</p>
                <p className="text-lg font-black leading-snug">Qual planeta e conhecido como planeta vermelho?</p>
              </div>
              <div className="grid place-items-center gap-2 py-3">
                <div className="grid h-28 w-28 place-items-center rounded-full bg-[#EF4444] border-4 border-white/15 shadow-[0_10px_28px_rgba(239,68,68,0.35)]">
                  <span className="text-sm font-black tracking-wider">APERTE</span>
                </div>
                <p className="text-xs text-white/40">O primeiro a apertar ganha a vez</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {roundSteps.map((step) => (
            <div key={step.title} className="bg-white border-2 border-black/15 rounded-2xl p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#3B82F6]">
                {step.icon}
              </div>
              <h2 className="text-base font-bold text-[#0F172A]">{step.title}</h2>
              <p className="text-sm text-[#64748B] leading-relaxed">{step.text}</p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GuideCard
            icon={<PlusCircle className="w-5 h-5" />}
            title="Como criar uma sala"
            items={createSteps}
          />
          <GuideCard
            icon={<DoorOpen className="w-5 h-5" />}
            title="Como entrar em uma sala"
            items={joinSteps}
          />
        </section>

        <section className="bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#3B82F6] shrink-0">
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#0F172A]">Como funciona uma partida</h2>
              <p className="text-sm text-[#64748B] mt-1">
                Cada rodada segue uma ordem fixa para manter a disputa justa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <RuleBox
              icon={<CheckCircle2 className="w-4 h-4" />}
              title="Se acertar"
              text="O jogador ganha ponto, a rodada acaba e a proxima pergunta e preparada."
              tone="green"
            />
            <RuleBox
              icon={<XCircle className="w-4 h-4" />}
              title="Se errar"
              text="Ele fica bloqueado nessa pergunta. Se houver mais de um elegivel, o buzzer reabre."
              tone="red"
            />
            <RuleBox
              icon={<Users className="w-4 h-4" />}
              title="Se restar um jogador"
              text="A vez e transferida automaticamente para quem ainda nao tentou."
              tone="blue"
            />
          </div>

          <div className="rounded-2xl bg-[#F8FAFC] border border-[#CBD5E1] p-4">
            <p className="text-sm text-[#64748B] leading-relaxed">
              As alternativas nunca aparecem antes de alguem vencer o buzzer. Quem esta esperando ve apenas
              quem esta respondendo e o contador. A resposta correta e a explicacao so aparecem quando todos
              erram ou quando o tempo da rodada acaba sem acerto.
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#3B82F6] shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[#0F172A]">Configuracoes da sala</h2>
                <p className="text-sm text-[#64748B] mt-1">O host define as regras antes de iniciar.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {settings.map(([title, text]) => (
                <div key={title} className="rounded-xl bg-[#F8FAFC] border border-[#CBD5E1] p-4">
                  <p className="text-sm font-bold text-[#0F172A]">{title}</p>
                  <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <ModeCard
              icon={<Trophy className="w-5 h-5" />}
              title="Modo classico"
              text="Disputa individual. Todos competem pelo buzzer e cada jogador soma seus pontos."
            />
            <ModeCard
              icon={<Users className="w-5 h-5" />}
              title="Modo equipes"
              text="Jogadores entram em times. A pontuacao pode ser compartilhada entre os membros."
            />
            <ModeCard
              icon={<Smartphone className="w-5 h-5" />}
              title="Modo sofa"
              text="Pensado para jogar no mesmo ambiente, com controles por toque ou teclado."
            />
            <ModeCard
              icon={<Mic className="w-5 h-5" />}
              title="Resposta falada"
              text="O jogador responde em voz alta e o host marca se a resposta esta correta."
            />
          </div>
        </section>

        <section className="bg-white border-2 border-black/15 rounded-2xl p-6 sm:p-8 text-center space-y-4">
          <h2 className="text-2xl font-bold text-[#0F172A]">Pronto para jogar?</h2>
          <p className="text-sm text-[#64748B] max-w-2xl mx-auto">
            Crie uma sala para ser o host ou entre com um codigo enviado por outra pessoa.
            Cada jogador usa seu proprio celular ou computador.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link href="/criar-partida" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold text-sm rounded-xl transition-colors">
              <PlusCircle className="w-4 h-4" />
              Criar partida
            </Link>
            <Link href="/entrar" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#F1F5F9] hover:bg-[#CBD5E1] text-[#0F172A] border border-[#CBD5E1] font-semibold text-sm rounded-xl transition-colors">
              <KeyRound className="w-4 h-4" />
              Entrar na sala
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#CBD5E1] py-6 px-4 text-center text-xs text-[#64748B]">
        BatePrimeiro - Quem bater primeiro responde.
      </footer>
    </div>
  );
}

function GuideCard({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <section className="bg-white border-2 border-black/15 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#3B82F6]">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-[#0F172A]">{title}</h2>
      </div>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm text-[#64748B]">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#F1F5F9] border border-[#CBD5E1] text-[11px] font-bold text-[#0F172A]">
              {index + 1}
            </span>
            <span className="leading-relaxed">{item}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RuleBox({ icon, title, text, tone }: { icon: React.ReactNode; title: string; text: string; tone: 'green' | 'red' | 'blue' }) {
  const toneClass = {
    green: 'bg-[#22C55E]/10 text-[#16A34A] border-[#22C55E]/25',
    red: 'bg-[#EF4444]/10 text-[#DC2626] border-[#EF4444]/25',
    blue: 'bg-[#3B82F6]/10 text-[#2563EB] border-[#3B82F6]/25',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 ${toneClass}`}>
      <div className="flex items-center gap-2 font-bold text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{text}</p>
    </div>
  );
}

function ModeCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-white border-2 border-black/15 rounded-2xl p-5 flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] border border-[#CBD5E1] flex items-center justify-center text-[#3B82F6] shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-bold text-[#0F172A]">{title}</h3>
        <p className="text-sm text-[#64748B] mt-1 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
