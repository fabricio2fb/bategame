import { roomManager } from '../src/RoomManager';
import { gameManager } from '../src/GameManager';
import { isValidRoomCode, normalizeRoomCode, ROOM_CODE_PATTERN } from '../src/roomCode';
import { GameRoom, Player } from '../src/types';

let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`  ok - ${name}`);
  } else {
    failed++;
    console.error(`  fail - ${name}`);
  }
}

console.log('\nROOM CODE CONTRACT');

const generated = Array.from({ length: 50 }, () => roomManager.generateCode());
assert(generated.every(code => ROOM_CODE_PATTERN.test(code)), 'generated codes match the server format');
assert(generated.every(code => code.length === 5), 'generated codes have 5 characters');
assert(normalizeRoomCode(' 5hg2y ') === '5HG2Y', 'lowercase and spaces are normalized');
assert(isValidRoomCode('5HG2Y'), 'valid generated-style code is accepted');
assert(isValidRoomCode('5H G2Y'), 'spaces are removed before validation');
assert(!isValidRoomCode('OI01A'), 'ambiguous characters rejected');

const room = roomManager.createRoom('BUZZ1', 'Buzzer Test', 'host-1', {
  gameMode: 'classic',
  questionSource: 'official',
  answerMode: 'multiple-choice',
  questionCount: 1,
  difficulty: 'mixed',
  categories: ['Tudo misturado'],
  maxPlayers: 8,
  answerTimeSeconds: 15,
  privacy: 'public',
  wrongAnswerPenalty: 0,
  allowRebound: true,
}) as GameRoom;

const playerA: Player = {
  id: 'player-a',
  token: 'token-a',
  socketId: 'socket-a',
  name: 'Ana',
  score: 0,
  isHost: false,
  isReady: true,
  isConnected: true,
  joinedAt: Date.now(),
};
const playerB: Player = {
  id: 'player-b',
  token: 'token-b',
  socketId: 'socket-b',
  name: 'Beto',
  score: 0,
  isHost: false,
  isReady: true,
  isConnected: true,
  joinedAt: Date.now(),
};

roomManager.addPlayer(room, playerA);
roomManager.addPlayer(room, playerB);
room.selectedQuestions = [{
  id: 'q-buzzer',
  text: 'Pergunta de teste?',
  answerType: 'multiple-choice',
  category: 'Teste',
  difficulty: 'easy',
  alternatives: ['A', 'B', 'C', 'D'],
  correctAlternativeIndex: 0,
  correctAnswer: 'A',
  timeLimitSeconds: 10,
}];

room.status = 'question-visible';
assert(gameManager.getFullGameState(room).orderedAlternatives === null, 'reading phase does not expose alternatives');
assert(gameManager.getQuestionForPlayer(room, playerA.id).alternatives === null, 'reading phase does not expose private alternatives');

room.status = 'buzzer-open';
assert(gameManager.canPlayerBuzz(room, playerA.id), 'player A can dispute the buzzer');
assert(gameManager.canPlayerBuzz(room, playerB.id), 'player B can dispute the buzzer');
assert(gameManager.getFullGameState(room).orderedAlternatives === null, 'buzzer phase does not expose alternatives');

room.status = 'answering';
room.currentBuzzerWinnerId = playerA.id;
const winnerQuestion = gameManager.getQuestionForPlayer(room, playerA.id);
const loserQuestion = gameManager.getQuestionForPlayer(room, playerB.id);
assert(Array.isArray(winnerQuestion.alternatives) && winnerQuestion.alternatives.length === 4, 'winner receives alternatives');
assert(loserQuestion.alternatives === null, 'non-winner does not receive alternatives');
assert(!gameManager.canPlayerBuzz(room, playerB.id), 'buzzer is locked while winner answers');

gameManager.handleWrongAnswer(room, playerA.id);
room.status = 'buzzer-open';
room.currentBuzzerWinnerId = null;
assert(!gameManager.canPlayerBuzz(room, playerA.id), 'wrong player cannot buzz again in same round');
assert(gameManager.canPlayerBuzz(room, playerB.id), 'other player can buzz after wrong answer');

process.exit(failed > 0 ? 1 : 0);
