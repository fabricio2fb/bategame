import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

test('1. Criar sala redireciona para a rota existente', () => {
  const page = read('src/app/criar-partida/page.tsx');
  assert.match(page, /router\.push\(getRoomPath\(result\.roomCode\)\)/);
  assert.ok(existsSync(join(root, 'src/app/sala/[codigo]/page.tsx')));
});

test('28. Partida-sofa carrega configuracao local e inicia runtime sem sala online', () => {
  const page = read('src/app/partida-sofa/page.tsx');
  const storage = read('src/lib/couch-match-storage.ts');
  assert.match(page, /loadCouchMatchConfig\(\)/);
  assert.match(page, /router\.replace\('\/criar-partida'\)/);
  assert.match(page, /<CouchGameRuntime[\s\S]*autoStart[\s\S]*initialOptions=\{config\}/);
  assert.doesNotMatch(page, /useSocketRoom/);
  assert.match(storage, /sessionStorage\.setItem/);
  assert.match(storage, /sessionStorage\.getItem/);
  assert.doesNotMatch(storage, /URLSearchParams/);
});

test('29. Toque no buzzer nao seleciona alternativa no mesmo gesto', () => {
  const hook = read('src/hooks/useCouchGame.ts');
  const runtime = read('src/components/couch/CouchGameRuntime.tsx');
  const zones = read('src/components/couch/CouchTouchZones.tsx');
  assert.match(hook, /answerInputArmedRef/);
  assert.match(hook, /if \(!answerInputArmedRef\.current\) return/);
  assert.match(runtime, /onPointerDown=\{\(event\) => \{[\s\S]*answerInputArmedRef\.current = true/);
  assert.match(runtime, /onClick=\{\(event\) => \{[\s\S]*hook\.submitMCAnswer\(alt\)/);
  assert.match(zones, /onPointerDown=\{\(e\) => \{/);
  assert.match(zones, /onPointerUp=\{consumeEvent\}/);
  assert.match(zones, /onTouchEnd=\{consumeEvent\}/);
  assert.match(zones, /onClick=\{consumeEvent\}/);
});

test('30. Sofa reabre buzzer somente para jogadores elegiveis e zonas grandes', () => {
  const runtime = read('src/components/couch/CouchGameRuntime.tsx');
  const zones = read('src/components/couch/CouchTouchZones.tsx');
  assert.match(runtime, /players=\{players\.filter\(player => !gameState\.blockedPlayerIds\.includes\(player\.id\)\)\}/);
  assert.match(zones, /if \(count === 2\) return 'grid-cols-1 grid-rows-2'/);
  assert.match(zones, /if \(count === 3\) return 'grid-cols-1 grid-rows-3'/);
  assert.match(zones, /return 'grid-cols-2 grid-rows-2'/);
  assert.match(zones, /flex-1 min-h-0 w-full/);
  assert.match(zones, /height: '100%'/);
  assert.match(zones, /min-h-\[112px\]/);
  assert.match(runtime, /inputMode === 'keyboard'/);
  assert.match(runtime, /window\.addEventListener\('keydown', handleKeyDown\)/);
});

test('31. Sofa nao revela resposta correta apos erro enquanto ha elegiveis', () => {
  const hook = read('src/hooks/useCouchGame.ts');
  const runtime = read('src/components/couch/CouchGameRuntime.tsx');
  assert.match(hook, /const remainingAfterWrong = prev\.players\.filter\(p => !prev\.blockedPlayerIds\.includes\(p\.id\)\)/);
  assert.match(hook, /const shouldRevealAnswer = validation\.isCorrect \|\| remainingAfterWrong\.length === 0/);
  assert.match(hook, /correctAnswer: shouldRevealAnswer \? validation\.correctAnswer : null/);
  assert.match(hook, /const shouldRevealAnswer = isCorrect \|\| remainingAfterWrong\.length === 0/);
  assert.match(hook, /correctAnswer: shouldRevealAnswer \? \(prev\.currentQuestion\.correctAnswer \|\| null\) : null/);
  assert.match(runtime, /const shouldRevealCorrectAnswer = phase === 'correct' \|\| phase === 'timeout' \|\| \(phase === 'wrong' && !!correctAnswer\)/);
  assert.match(runtime, /const showWrongFeedback = phase === 'wrong' && !correctAnswer/);
  assert.match(runtime, /\(showResult \|\| showWrongFeedback\) && isSelected && !isCorrectAlt/);
});

test('32. Sofa usa 100dvh, safe areas e nao permite scroll horizontal', () => {
  const page = read('src/app/partida-sofa/page.tsx');
  const runtime = read('src/components/couch/CouchGameRuntime.tsx');
  const zones = read('src/components/couch/CouchTouchZones.tsx');
  assert.match(page, /min-h-screen min-h-\[100dvh\]/);
  assert.match(page, /overflow-hidden/);
  assert.match(page, /env\(safe-area-inset-left\)/);
  assert.match(page, /env\(safe-area-inset-right\)/);
  assert.match(page, /env\(safe-area-inset-top\)/);
  assert.match(runtime, /min-h-screen min-h-\[100dvh\]/);
  assert.match(runtime, /overflow-x-hidden/);
  assert.match(runtime, /isTouchBuzzerPhase \? 'min-h-0 overflow-hidden' : 'overflow-y-auto'/);
  assert.match(runtime, /w-full flex-1 min-h-0 pb-\[max\(0\.5rem,env\(safe-area-inset-bottom\)\)\]/);
  assert.match(zones, /grid-rows-2/);
  assert.match(zones, /grid-rows-3/);
  assert.match(zones, /return 'grid-cols-2 grid-rows-2'/);
});

test('33. Sofa usa timer da pergunta inteira e auto atribui ultimo elegivel', () => {
  const hook = read('src/hooks/useCouchGame.ts');
  const runtime = read('src/components/couch/CouchGameRuntime.tsx');
  const openBuzzer = hook.slice(hook.indexOf('const openBuzzer'), hook.indexOf('const tickTimer'));
  assert.match(hook, /const timerRuns =/);
  assert.match(hook, /prev\.phase === 'question-visible'/);
  assert.match(hook, /prev\.phase === 'player-selected'/);
  assert.match(hook, /\(prev\.phase === 'wrong' && !prev\.correctAnswer\)/);
  assert.doesNotMatch(openBuzzer, /timer:/);
  assert.match(hook, /timer: shouldRevealAnswer \? 0 : prev\.timer/);
  assert.match(hook, /const assignAnsweringPlayer = useCallback/);
  assert.match(hook, /action: 'AUTO_ASSIGN_ANSWER'/);
  assert.match(runtime, /remaining\.length === 1/);
  assert.match(runtime, /hook\.assignAnsweringPlayer\(remaining\[0\]\.id\)/);
  assert.match(runtime, /const isAutoAssignedWinner = !!winnerEvent\?\.data\?\.autoAssigned/);
  assert.match(runtime, /responde agora` : `\$\{winner\.name\} apertou primeiro!/);
  assert.match(runtime, /remaining\.length > 1/);
  assert.match(runtime, /hook\.setPhase\('buzzer-opening'\)/);
});

test('34. Partida sofa nao tem navbar branca e sair fica no menu interno', () => {
  const page = read('src/app/partida-sofa/page.tsx');
  const runtime = read('src/components/couch/CouchGameRuntime.tsx');
  const header = read('src/components/partida1/GameHeader.tsx');
  assert.doesNotMatch(page, /<header/);
  assert.doesNotMatch(page, /<Logo/);
  assert.doesNotMatch(page, /Voltar/);
  assert.match(runtime, /onLeave=\{onExit\}/);
  assert.match(runtime, /confirmLeaveOnExit=\{hasProgress\}/);
  assert.match(runtime, /compact=\{autoStart\}/);
  assert.match(header, /Sair da partida/);
  assert.match(header, /confirmLeaveOnExit/);
});

test('2. /sala/5HG2Y tem pagina dinamica e nao depende de notFound', () => {
  const page = read('src/app/sala/[codigo]/page.tsx');
  assert.match(page, /useSocketRoom\(code\)/);
  assert.doesNotMatch(page, /notFound\(/);
});

test('3. Atualizar a pagina mantem a sala por room:reconnect', () => {
  const hook = read('src/hooks/useSocketRoom.ts');
  assert.match(hook, /room:reconnect/);
  assert.match(hook, /normalizeRoomCode\(session\.roomCode\) === normalizedRoomCode/);
});

test('4. Abrir link direto busca a sala por room:get', () => {
  const hook = read('src/hooks/useSocketRoom.ts');
  assert.match(hook, /room:get/);
  assert.match(hook, /setRoom\(response\.room\)/);
});

test('5. Codigo inexistente mostra mensagem amigavel em vez de 404', () => {
  const page = read('src/app/sala/[codigo]/page.tsx');
  assert.match(page, /Sala n.+o encontrada/s);
  assert.match(page, /Tentar outro c/s);
});

test('6. Codigo minusculo e normalizado', () => {
  const helper = read('src/lib/room-code.ts');
  assert.match(helper, /\.toUpperCase\(\)/);
  assert.match(read('src/app/sala/[codigo]/page.tsx'), /router\.replace\(getRoomPath\(code\)\)/);
});

test('7. Entrada por codigo usa a mesma rota oficial', () => {
  assert.match(read('src/app/entrar/page.tsx'), /router\.push\(getRoomPath\(roomCode\)\)/);
  assert.match(read('src/app/page.tsx'), /router\.push\(getRoomPath\(code\)\)/);
});

test('8. Parametro dinamico chega como codigo na pagina', () => {
  const page = read('src/app/sala/[codigo]/page.tsx');
  assert.match(page, /params\.codigo/);
  assert.match(page, /const code = normalizeRoomCode\(rawCode\)/);
});

test('9. Build reconhece a rota dinamica quando os tipos foram gerados', () => {
  const routeTypes = join(root, '.next/types/routes.d.ts');
  if (!existsSync(routeTypes)) return;
  const generated = readFileSync(routeTypes, 'utf8');
  assert.match(generated, /"\/sala\/\[codigo\]"/);
});

test('10. Fluxo Socket.IO continua usando o mesmo codigo', () => {
  const server = read('server/src/index.ts');
  assert.match(server, /room:create/);
  assert.match(server, /room:join/);
  assert.match(server, /room:reconnect/);
  assert.match(server, /normalizeRoomCode\(roomCode\)/);
});

test('11. Alternativas nao aparecem nas fases de leitura ou buzzer', () => {
  const tablet = read('src/components/partida1/QuestionTablet.tsx');
  const showChoicesLine = tablet.match(/const showChoices = .+/)?.[0] ?? '';
  assert.doesNotMatch(showChoicesLine, /question/);
  assert.doesNotMatch(showChoicesLine, /buzzer/);
  assert.match(showChoicesLine, /!!alternatives/);
});

test('12. Estado publico do servidor nunca envia orderedAlternatives', () => {
  const gameManager = read('server/src/GameManager.ts');
  assert.match(gameManager, /orderedAlternatives: null/);
  assert.doesNotMatch(gameManager, /orderedAlternatives = shuffled\.alternatives/);
});

test('13. Alternativas sao enviadas apenas pelo evento privado do jogador vencedor', () => {
  const gameManager = read('server/src/GameManager.ts');
  assert.match(gameManager, /room\.status === 'answering' && room\.currentBuzzerWinnerId === playerId/);
  assert.doesNotMatch(gameManager, /alternatives: question\.alternatives/);
});

test('14. Cliente limpa alternativas quando recebe estado publico', () => {
  const page = read('src/app/partida/[codigo]/page.tsx');
  assert.match(page, /setAlternatives\(state\.orderedAlternatives \?\? null\)/);
});

test('15. Tempo de resposta da sala e configuravel e usado pelo servidor', () => {
  const server = read('server/src/index.ts');
  const createPage = read('src/app/criar-partida/page.tsx');
  assert.match(server, /isValidAnswerTimeSeconds/);
  assert.match(server, /room\.settings\.answerTimeSeconds \* 1000/);
  assert.match(createPage, /ANSWER_TIME_OPTIONS/);
  assert.match(createPage, /answerTimeSeconds/);
});

test('16. Menu da partida tem acoes reais e confirmacao de saida', () => {
  const header = read('src/components/partida1/GameHeader.tsx');
  const page = read('src/app/partida/[codigo]/page.tsx');
  assert.match(header, /Sair da partida/);
  assert.match(header, /Tem certeza de que deseja sair da partida/);
  assert.match(header, /Ver jogadores/);
  assert.match(header, /Ver configura/);
  assert.match(header, /Como jogar/);
  assert.match(page, /room:leave/);
});

test('17. Entrada direta usa nome e codigo no mesmo card', () => {
  const sidebar = read('src/components/SidebarPanels.tsx');
  const home = read('src/app/page.tsx');
  assert.match(sidebar, /Seu nome/);
  assert.match(sidebar, /Codigo da sala/);
  assert.match(sidebar, /isJoining/);
  assert.match(sidebar, /normalizedName/);
  assert.match(home, /joinRoom\(code, playerName\)/);
});

test('18. Servidor aplica regra 0 1 2 elegiveis apos falha', () => {
  const server = read('server/src/index.ts');
  assert.match(server, /function continueAfterFailedAttempt/);
  assert.match(server, /eligible\.length === 0/);
  assert.match(server, /eligible\.length === 1/);
  assert.match(server, /startAnswerTurn\(room, nextPlayer/);
  assert.match(server, /eligible\.length/);
});

test('19. Timer de resposta usa tentativa para ignorar callbacks antigos', () => {
  const server = read('server/src/index.ts');
  const types = read('server/src/types.ts');
  assert.match(server, /answerAttemptId/);
  assert.match(server, /handleAnswerTimeout\(room, player\.id, attemptId\)/);
  assert.match(server, /room\.answerAttemptId !== attemptId/);
  assert.match(types, /answerDeadlineAt/);
});

test('20. Historico da rodada fica oculto no mobile e preservado no desktop', () => {
  const page = read('src/app/partida/[codigo]/page.tsx');
  assert.doesNotMatch(page, /lg:hidden px-3 pb-14[\s\S]*<ActivityFeed/);
  assert.match(page, /hidden lg:flex lg:w-56 xl:w-64/);
  assert.match(page, /<ActivityFeed events=\{feedEvents\} \/>/);
});

test('21. Partida usa centralizacao mobile apenas nas fases sem alternativas', () => {
  const page = read('src/app/partida/[codigo]/page.tsx');
  assert.match(page, /shouldCenterMobile/);
  assert.match(page, /justify-center overflow-hidden py-4 lg:py-0/);
  assert.match(page, /justify-start overflow-y-auto/);
  assert.match(page, /h-\[100dvh\] lg:h-screen/);
});

test('22. Menu da partida usa camada fixa acima do conteudo', () => {
  const header = read('src/components/partida1/GameHeader.tsx');
  assert.match(header, /relative z-50/);
  assert.match(header, /fixed inset-0 z-\[70\]/);
  assert.match(header, /fixed right-0 top-0 z-\[80\]/);
  assert.match(header, /document\.body\.style\.overflow = 'hidden'/);
  assert.match(header, /aria-controls="game-menu"/);
});

test('23. Menu mobile tem botao X acessivel e nao ocupa largura total', () => {
  const header = read('src/components/partida1/GameHeader.tsx');
  assert.match(header, /const closeMenu = useCallback/);
  assert.match(header, /menuButtonRef\.current\?\.focus\(\)/);
  assert.match(header, /document\.body\.style\.overflow = previousOverflowRef\.current/);
  assert.match(header, /aria-label="Fechar menu"/);
  assert.match(header, /<X className="h-5 w-5" \/>/);
  assert.match(header, /min-h-11 min-w-11/);
  assert.match(header, /w-\[85vw\] max-w-sm/);
  assert.doesNotMatch(header, /h-\[100dvh\] w-screen/);
});

test('24. API de perguntas usa o release oficial e nao o JSON antigo', () => {
  const api = read('src/app/api/questions/route.ts');
  const manager = read('server/src/QuestionManager.ts');
  assert.match(api, /data', 'release', 'questions-release\.json'/);
  assert.match(manager, /data', 'release', 'questions-release\.json'/);
  assert.doesNotMatch(api, /questions-approved\.json/);
  assert.doesNotMatch(manager, /questions-approved\.json/);
});

test('25. Payload inicial de perguntas nao envia resposta correta', () => {
  const api = read('src/app/api/questions/route.ts');
  const sanitize = read('server/src/types.ts');
  const publicQuestion = api.slice(api.indexOf('interface PublicQuestion'), api.indexOf('let questionsCache'));
  const toPublic = api.slice(api.indexOf('function toPublicQuestion'), api.indexOf('function shuffle'));
  assert.doesNotMatch(publicQuestion, /correctAnswer/);
  assert.doesNotMatch(publicQuestion, /correctAlternativeIndex/);
  assert.doesNotMatch(publicQuestion, /explanation/);
  assert.doesNotMatch(toPublic, /correctAnswer/);
  assert.doesNotMatch(toPublic, /correctAlternativeIndex/);
  assert.doesNotMatch(sanitize.slice(sanitize.indexOf('export function sanitizeQuestion')), /correctAnswer/);
});

test('26. Jogo tem estrutura para reportar problema de pergunta', () => {
  const tablet = read('src/components/partida1/QuestionTablet.tsx');
  const partida = read('src/app/partida/[codigo]/page.tsx');
  const server = read('server/src/index.ts');
  const couchRuntime = read('src/components/couch/CouchGameRuntime.tsx');
  assert.match(tablet, /Reportar problema/);
  assert.match(partida, /question:report-problem/);
  assert.match(server, /question:report-problem/);
  assert.match(couchRuntime, /reportOfficialQuestionProblem/);
});

test('27. Modo sofa configura em criar-partida e navega para partida-sofa', () => {
  const createPage = read('src/app/criar-partida/page.tsx');
  const couchSetup = read('src/components/couch/CouchSetup.tsx');
  const couchRuntime = read('src/components/couch/CouchGameRuntime.tsx');
  assert.match(createPage, /<CouchSetup isMobile=\{isCouchMobile\} onStart=\{handleStartCouch\} \/>/);
  assert.match(createPage, /saveCouchMatchConfig\(options\)/);
  assert.match(createPage, /router\.push\('\/partida-sofa'\)/);
  assert.doesNotMatch(createPage, /<CouchGameRuntime \/>/);
  assert.match(createPage, /useSocketRoom\(undefined, gameMode !== 'couch'\)/);
  assert.doesNotMatch(createPage, /router\.push\('\/sofa'\)/);
  assert.ok(!existsSync(join(root, 'src/app/sofa/page.tsx')));
  assert.ok(existsSync(join(root, 'src/app/partida-sofa/page.tsx')));
  assert.match(couchSetup, /Alterar tecla/);
  assert.match(couchSetup, /Pressione qualquer tecla/);
  assert.match(couchSetup, /Esta tecla já está em uso/);
  assert.doesNotMatch(couchRuntime, /<ActivityFeed/);
});
