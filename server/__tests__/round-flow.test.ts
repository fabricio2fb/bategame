import { io, Socket } from 'socket.io-client';

process.env.PORT = process.env.PORT || '3061';

const url = `http://127.0.0.1:${process.env.PORT}`;

let failed = 0;

function assert(condition: boolean, name: string, detail?: string): void {
  if (condition) {
    console.log(`  ok - ${name}`);
  } else {
    failed++;
    console.error(`  fail - ${name}${detail ? ` - ${detail}` : ''}`);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function once<T = any>(socket: Socket, event: string, ms = 15000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout ${event}`)), ms);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function emitAck<T = any>(socket: Socket, event: string, data: any, ms = 8000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`ack timeout ${event}`)), ms);
    socket.emit(event, data, (response: T) => {
      clearTimeout(timer);
      resolve(response);
    });
  });
}

async function connectPlayer(): Promise<Socket> {
  const socket = io(url, { transports: ['websocket'] });
  await once(socket, 'connect');
  return socket;
}

async function createQuiz(socket: Socket, timeLimitSeconds = 15): Promise<string> {
  const questions = Array.from({ length: 5 }, (_, idx) => ({
    text: `Pergunta teste ${idx + 1}`,
    answerType: 'multiple-choice',
    category: 'Teste',
    difficulty: 'easy',
    alternatives: ['Right', 'Wrong 1', 'Wrong 2', 'Wrong 3'],
    correctAlternativeIndex: 0,
    correctAnswer: 'Right',
    timeLimitSeconds,
    explanation: 'Explicacao teste',
  }));
  const response: any = await emitAck(socket, 'quiz:create', {
    quizTitle: `Quiz fluxo ${Date.now()}-${Math.random()}`,
    questions,
  });
  if (!response.success) throw new Error(`quiz:create failed ${JSON.stringify(response)}`);
  return response.quizId;
}

async function createStartedRoom(playerNames: string[], answerTimeSeconds = 5, questionTimeLimitSeconds = 15) {
  const sockets = await Promise.all(playerNames.map(() => connectPlayer()));
  const quizId = await createQuiz(sockets[0], questionTimeLimitSeconds);
  const settings = {
    gameMode: 'classic',
    questionSource: 'custom',
    customQuizId: quizId,
    answerMode: 'multiple-choice',
    questionCount: 5,
    difficulty: 'mixed',
    categories: ['Tudo misturado'],
    maxPlayers: 8,
    answerTimeSeconds,
    privacy: 'public',
    wrongAnswerPenalty: 0,
    allowRebound: true,
  };
  const created: any = await emitAck(sockets[0], 'room:create', {
    playerName: playerNames[0],
    roomName: 'Fluxo Rodada',
    settings,
  });
  if (!created.success) throw new Error(`room:create failed ${JSON.stringify(created)}`);
  const roomCode = created.roomCode;
  const playerIds = [created.playerId];
  for (let i = 1; i < sockets.length; i++) {
    const joined: any = await emitAck(sockets[i], 'room:join', { roomCode, playerName: playerNames[i] });
    if (!joined.success) throw new Error(`room:join failed ${JSON.stringify(joined)}`);
    playerIds.push(joined.playerId);
    const ready: any = await emitAck(sockets[i], 'player:set-ready', { roomCode, ready: true });
    if (!ready.success) throw new Error(`player:set-ready failed ${JSON.stringify(ready)}`);
  }
  const startedEvents = sockets.map(s => once(s, 'game:started'));
  const openedEvents = sockets.map(s => once(s, 'buzzer:opened'));
  const started: any = await emitAck(sockets[0], 'game:start', { roomCode });
  if (!started.success) throw new Error(`game:start failed ${JSON.stringify(started)}`);
  await Promise.all(startedEvents);
  await Promise.all(openedEvents);
  return { sockets, roomCode, playerIds };
}

async function buzz(socket: Socket, roomCode: string) {
  return emitAck<any>(socket, 'buzzer:press', { roomCode });
}

async function submit(socket: Socket, roomCode: string, questionId: string, selectedAlternative: string) {
  return emitAck<any>(socket, 'answer:submit', { roomCode, questionId, selectedAlternative });
}

async function scenarioTwoPlayersFirstWrongSecondCorrect() {
  console.log('\nROUND FLOW 1/3. Two players transfer after wrong and second scores');
  const { sockets: [a, b], roomCode } = await createStartedRoom(['Ana', 'Beto']);
  const bPrivate = once<any>(b, 'question:for-player');
  const aPrivate = once<any>(a, 'question:for-player');
  const aBuzz = await buzz(a, roomCode);
  assert(aBuzz.success, 'A wins buzzer');
  const [qa, qbWaiting] = await Promise.all([aPrivate, bPrivate]);
  assert(Array.isArray(qa.alternatives) && qa.alternatives.length === 4, 'A receives alternatives');
  assert(qbWaiting.alternatives === null, 'B does not receive alternatives before transfer');

  const bTransferred = once<any>(b, 'question:for-player');
  const wrongEvent = once<any>(a, 'answer:result');
  await submit(a, roomCode, qa.question.id, '__wrong__');
  const wrong = await wrongEvent;
  const qb = await bTransferred;
  assert(wrong.autoTransferred === true, 'server marks automatic transfer');
  assert(Array.isArray(qb.alternatives) && qb.alternatives.length === 4, 'B receives alternatives automatically');
  assert(qb.answerDeadlineAt - Date.now() > 4500, 'B receives a full fresh timer');

  const result = once<any>(a, 'answer:result');
  await submit(b, roomCode, qb.question.id, 'Right');
  const correct = await result;
  assert(correct.result === 'correct', 'B correct answer ends round');
  assert(correct.scores.some((s: any) => s.name === 'Beto' && s.score === 1), 'B receives point');
  a.disconnect(); b.disconnect();
}

async function scenarioTwoPlayersBothWrong() {
  console.log('\nROUND FLOW 2. Two players both wrong reveals answer');
  const { sockets: [a, b], roomCode } = await createStartedRoom(['Caio', 'Duda']);
  const qaPromise = once<any>(a, 'question:for-player');
  await buzz(a, roomCode);
  const qa = await qaPromise;
  const qbPromise = once<any>(b, 'question:for-player');
  await submit(a, roomCode, qa.question.id, '__wrong__');
  const qb = await qbPromise;
  const allWrongPromise = once<any>(a, 'answer:result');
  await submit(b, roomCode, qb.question.id, '__wrong__');
  const allWrong = await allWrongPromise;
  assert(allWrong.result === 'all_wrong', 'round ends when both players failed');
  assert(allWrong.correctAnswer === 'Right', 'correct answer is revealed only after all failed');
  assert(!!allWrong.explanation, 'explanation is revealed after all failed');
  a.disconnect(); b.disconnect();
}

async function scenarioThreePlayersReopensBuzzer() {
  console.log('\nROUND FLOW 4/5. Three players reopen buzzer until one eligible remains');
  const { sockets: [a, b, c], roomCode } = await createStartedRoom(['Eva', 'Fabio', 'Gabi']);
  const qaPromise = once<any>(a, 'question:for-player');
  await buzz(a, roomCode);
  const qa = await qaPromise;
  const reopenedB = once<any>(b, 'buzzer:opened');
  await submit(a, roomCode, qa.question.id, '__wrong__');
  await reopenedB;
  const blocked = await buzz(a, roomCode);
  assert(!blocked.success, 'A cannot buzz again after wrong answer');
  const bPrivate = once<any>(b, 'question:for-player');
  const cPrivate = once<any>(c, 'question:for-player');
  const [bBuzz, cBuzz] = await Promise.all([buzz(b, roomCode), buzz(c, roomCode)]);
  assert([bBuzz, cBuzz].filter(r => r.success).length === 1, 'B or C can win reopened buzzer');
  const [qb, qc] = await Promise.all([bPrivate, cPrivate]);
  const activePrivate = bBuzz.success ? qb : qc;
  assert(Array.isArray(activePrivate.alternatives), 'new winner receives alternatives after reopened buzzer');
  a.disconnect(); b.disconnect(); c.disconnect();
}

async function scenarioTimeoutTransferAndStaleTimer() {
  console.log('\nROUND FLOW 6/7. Timeout transfers and stale timer is ignored');
  const { sockets: [a, b], roomCode } = await createStartedRoom(['Hugo', 'Iara'], 5);
  const qaPromise = once<any>(a, 'question:for-player');
  const bInitialPrivate = once<any>(b, 'question:for-player');
  await buzz(a, roomCode);
  await qaPromise;
  await bInitialPrivate;
  const qbPromise = once<any>(b, 'question:for-player', 9000);
  const timeoutEvent = once<any>(a, 'answer:result', 9000);
  const qb = await qbPromise;
  const timeoutResult = await timeoutEvent;
  assert(timeoutResult.result === 'timeout' && timeoutResult.autoTransferred === true, 'timeout counts as failed attempt and transfers');
  assert(Array.isArray(qb.alternatives), 'B receives alternatives after A timeout');
  assert(qb.answerDeadlineAt - Date.now() > 4500, 'B receives full timer after A timeout');
  await wait(1000);
  const late = await submit(a, roomCode, qb.question.id, 'Right');
  assert(!late.success, 'A cannot answer after timeout and transfer');
  a.disconnect(); b.disconnect();
}

async function scenarioOldBuzzerTimerDoesNotFinishNextRound() {
  console.log('\nROUND FLOW 9. Old buzzer timer does not finish next round');
  const { sockets: [a, b], roomCode } = await createStartedRoom(['Luan', 'Mara'], 5, 5);
  const qaPromise = once<any>(a, 'question:for-player');
  await buzz(a, roomCode);
  const qa = await qaPromise;

  const nextRoundOpened = once<any>(a, 'buzzer:opened', 12000);
  await submit(a, roomCode, qa.question.id, 'Right');
  await nextRoundOpened;

  await wait(2500);
  const lookup: any = await emitAck(a, 'room:get', { roomCode });
  assert(lookup.success, 'room remains available after old buzzer timer window');
  assert(lookup.room.currentQuestionIndex === 1, 'second round remains the active round');
  assert(lookup.room.status === 'buzzer-open', 'second round buzzer remains open instead of timing out early');
  a.disconnect(); b.disconnect();
}

async function scenarioLeaveAndHostTransfer() {
  console.log('\nROUND FLOW 8. Leave removes player and transfers host');
  const a = await connectPlayer();
  const b = await connectPlayer();
  const quizId = await createQuiz(a);
  const settings = {
    gameMode: 'classic',
    questionSource: 'custom',
    customQuizId: quizId,
    answerMode: 'multiple-choice',
    questionCount: 5,
    difficulty: 'mixed',
    categories: ['Tudo misturado'],
    maxPlayers: 8,
    answerTimeSeconds: 5,
    privacy: 'public',
    wrongAnswerPenalty: 0,
    allowRebound: true,
  };
  const created: any = await emitAck(a, 'room:create', { playerName: 'Joao', roomName: 'Sair', settings });
  const joined: any = await emitAck(b, 'room:join', { roomCode: created.roomCode, playerName: 'Katia' });
  assert(created.success && joined.success, 'room has common player and host');
  await emitAck(b, 'room:leave', { roomCode: created.roomCode });
  const lookup: any = await emitAck(a, 'room:get', { roomCode: created.roomCode });
  const afterCommonLeave = lookup.room;
  assert(afterCommonLeave.players.length === 1, 'common player is removed');
  const b2 = await connectPlayer();
  const joinedAgain: any = await emitAck(b2, 'room:join', { roomCode: created.roomCode, playerName: 'Lia' });
  assert(joinedAgain.success, 'another player joins');
  const transferred = once<any>(b2, 'host:transferred');
  await emitAck(a, 'room:leave', { roomCode: created.roomCode });
  const transfer = await transferred;
  assert(transfer.newHostName === 'Lia', 'host leadership is transferred on host leave');
  a.disconnect(); b.disconnect(); b2.disconnect();
}

async function main(): Promise<void> {
  await import('../src/index');
  await wait(1000);

  await scenarioTwoPlayersFirstWrongSecondCorrect();
  await scenarioTwoPlayersBothWrong();
  await scenarioThreePlayersReopensBuzzer();
  await scenarioTimeoutTransferAndStaleTimer();
  await scenarioOldBuzzerTimerDoesNotFinishNextRound();
  await scenarioLeaveAndHostTransfer();

  if (failed > 0) {
    console.error(`\nROUND FLOW FAILED: ${failed}`);
    process.exit(1);
  }

  console.log('\nROUND FLOW PASSED');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
