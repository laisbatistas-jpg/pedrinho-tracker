/**
 * Sequências de quadros (3 a 4) para cada estímulo ilustrado.
 * Chave: "mês:título do estímulo". Cada quadro: [cena, ajustes da cena, legenda].
 * Estímulos sem entrada aqui continuam só com o texto.
 */
import type { SceneName, Ex } from "@/components/illus/Scenes";

export type ArtPanel = { s: SceneName; p?: Record<string, unknown>; t: string };
type Row = [SceneName, Record<string, unknown>, string];

const say = (x: number, y: number, text: string): Ex => ({ k: "say", x, y, text });
const spark = (x: number, y: number, s = 1): Ex => ({ k: "spark", x, y, s });
const heart = (x: number, y: number, s = 1.4): Ex => ({ k: "heart", x, y, s });
const notes = (x: number, y: number, s = 1): Ex => ({ k: "notes", x, y, s });
const motion = (x: number, y: number, s = 1): Ex => ({ k: "motion", x, y, s });
const bubbles = (x: number, y: number, s = 1): Ex => ({ k: "bubbles", x, y, s });
const arrow = (x1: number, y1: number, x2: number, y2: number): Ex => ({ k: "arrow", x1, y1, x2, y2 });

const seq = (rows: Row[]): ArtPanel[] => rows.map(([s, p, t]) => ({ s, p, t }));

export const DEV_ART: Record<string, ArtPanel[]> = {
  /* ================= 3 meses ================= */
  "3:Vai e volta": seq([
    ["face", { baby: "calm", adult: "smile" }, "Fique bem pertinho, de frente, na altura do rosto dele."],
    ["face", { baby: "open", adult: "smile", x: [say(78, 40, "aaa")] }, "Ele solta um sonzinho ou sorri."],
    ["face", { baby: "calm", adult: "open", x: [say(176, 22, "Que lindo!")] }, "Olhe nos olhos e responda com palavras e um sorriso."],
    ["face", { baby: "smile", adult: "smile", x: [heart(120, 34)] }, "Espere um pouco: ele responde de novo. Repita!"],
  ]),
  "3:Brinquedo de lado a lado": seq([
    ["lie", { holdX: 70, lookDx: -4 }, "Deite-o de costas e segure um brinquedo diante dos olhos."],
    ["lie", { holdX: 70, lookDx: -4, x: [arrow(92, 22, 150, 22)] }, "Mova bem devagar para um lado..."],
    ["lie", { holdX: 140, lookDx: 5 }, "...e depois para o outro, cantando."],
    ["lie", { holdX: 140, lookDx: 5, mouth: "smile", x: [spark(40, 40)] }, "Ele acompanha com os olhos. Pare se ele cansar."],
  ]),
  "3:Passeio narrado": seq([
    ["walk", {}, "Leve-o no colo para passear, dentro ou fora de casa."],
    ["walk", { x: [say(104, 24, "olha o passarinho")] }, "Mostre o que você vê e diga o nome."],
    ["walk", { bird: false, x: [say(150, 24, "o vento"), motion(176, 50)] }, "Descreva também o que ouve e sente."],
    ["walk", { mouth: "smile", bird: false, x: [heart(150, 44)] }, "Pare quando ele olhar: ele está aprendendo."],
  ]),
  "3:Brinquedo pendurado": seq([
    ["lie", { mobile: true }, "Deite-o de costas num tapete e prenda um móbile no suporte."],
    ["lie", { mobile: true, arms: "up", lookDx: 3 }, "Ele olha e levanta as mãozinhas."],
    ["lie", { mobile: true, arms: "up", kick: true, mouth: "open", x: [spark(40, 90)] }, "Ele tenta alcançar e bate nos brinquedos."],
    ["lie", { mobile: true, arms: "open", mouth: "smile" }, "Fique ao lado e converse com ele sobre o que vê."],
  ]),
  "3:Chocalho nas mãos": seq([
    ["lie", { arms: "rest" }, "Deite-o de costas, tranquilo e acordado."],
    ["lie", { arms: "hold", holdX: 132 }, "Coloque um chocalho leve na mãozinha dele."],
    ["lie", { arms: "hold", rattleHand: true, mouth: "open", x: [notes(176, 40)] }, "Ajude a balançar e escutem o som juntos."],
    ["lie", { arms: "hold", rattleHand: true, mouth: "smile", x: [spark(176, 40)] }, "Depois, deixe que ele tente sozinho."],
  ]),
  "3:Mãozinhas à mostra": seq([
    ["lie", { arms: "rest" }, "Converse com ele e faça carinho nas mãozinhas."],
    ["lie", { arms: "up" }, "Aproxime as mãos do rosto, bem à vista."],
    ["lie", { arms: "up", lookDx: 4, mouth: "open", x: [say(164, 30, "suas mãozinhas!")] }, "Diga: \"são as suas mãozinhas!\""],
    ["lie", { arms: "up", mouth: "smile", x: [spark(46, 56)] }, "Repita sorrindo. Logo ele olha para elas sozinho."],
  ]),
  "3:Ginástica de bracinhos": seq([
    ["lie", { arms: "rest", mouth: "smile" }, "Deite-o de costas e converse com ele."],
    ["lie", { arms: "open", x: [notes(180, 40)] }, "Abra os bracinhos devagar, cantando."],
    ["lie", { arms: "up" }, "Estique para cima e depois leve para baixo."],
    ["lie", { arms: "open", kick: true, mouth: "smile", x: [spark(40, 50)] }, "Termine com a bicicletinha nas perninhas."],
  ]),
  "3:Cantiga com gestos": seq([
    ["sit", { adult: "lap", mouth: "smile" }, "Sente-o no seu colo, de frente."],
    ["sit", { adult: "lap", x: [notes(196, 40, 1.2)] }, "Cante \"cabeça, ombro, joelho e pé\"."],
    ["sit", { adult: "lap", adult2: "hands", mouth: "open", x: [say(190, 36, "ombro!")] }, "Toque cada parte do corpo dele ao cantar."],
    ["sit", { adult: "lap", mouth: "smile", x: [spark(190, 46)] }, "Repita sempre as mesmas músicas: ele reconhece."],
  ]),

  /* ================= 4 meses ================= */
  "4:Brinquedo logo fora do alcance": seq([
    ["tummy", { head: "up" }, "Deite-o de bruços no tapete, acordado e tranquilo."],
    ["tummy", { head: "up", toy: "near", hand: true }, "Ponha um brinquedo um pouco além das mãozinhas."],
    ["tummy", { head: "high", toy: "near", reach: true }, "Ele levanta a cabeça e se estica para alcançar."],
    ["tummy", { head: "high", toy: "near", reach: true, x: [spark(44, 48, 1.1), spark(118, 34, 0.8), spark(160, 60, 0.9)] }, "Comemore! Repita por alguns minutos, várias vezes ao dia."],
  ]),
  "4:Caretas no espelho": seq([
    ["mirror", { baby: "calm" }, "Segure-o no colo diante de um espelho seguro."],
    ["mirror", { baby: "calm", adult: "silly" }, "Faça uma careta engraçada ao lado dele."],
    ["mirror", { baby: "smile", adult: "silly" }, "Espere: ele observa e pode sorrir."],
    ["mirror", { baby: "silly", adult: "smile" }, "Agora copie a expressão dele e repitam."],
  ]),
  "4:Dançar no colo": seq([
    ["sit", { adult: "lap", adult2: "hands", mouth: "smile" }, "Sente-o no seu colo, de frente."],
    ["sit", { adult: "lap", adult2: "hands", x: [notes(196, 40, 1.2)] }, "Ponha uma música que vocês gostem."],
    ["sit", { adult: "lap", adult2: "hands", mouth: "smile", x: [motion(30, 90), notes(196, 40, 1.2)] }, "Embale devagar de um lado para o outro."],
    ["sit", { adult: "lap", adult2: "hands", mouth: "open", x: [heart(190, 44)] }, "Deixe que ele mexa no ritmo."],
  ]),
  "4:Chutar e agarrar": seq([
    ["lie", { arms: "rest" }, "Deite-o de costas num tapete limpo."],
    ["lie", { kick: true, toyFoot: true }, "Ponha um brinquedo seguro ao alcance dos pezinhos."],
    ["lie", { arms: "hold", rattleHand: true, mouth: "open" }, "Dê outro para ele agarrar e balançar."],
    ["lie", { arms: "hold", rattleHand: true, kick: true, toyFoot: true, mouth: "smile", x: [spark(40, 56)] }, "Ele chuta e agarra! Sem peças pequenas ou pontas."],
  ]),
  "4:Texturas diferentes": seq([
    ["sit", { adult: "hands", floor: "swatches" }, "Reúna panos de texturas diferentes: macio, áspero, liso."],
    ["sit", { hold: "crinkle", adult: "hands" }, "Deixe-o sentir com as mãozinhas."],
    ["sit", { floor: "swatches", dx: 6, mouth: "open", adult: "hands" }, "Passe nos pés e nos braços também."],
    ["sit", { floor: "swatches", mouth: "smile", adult: "hands", x: [say(176, 30, "macio!"), spark(60, 40)] }, "Diga o que é: \"macio\", \"áspero\"."],
  ]),
  "4:Livro de pano": seq([
    ["sit", { adult: "lap" }, "Sente-o no colo com um livro de pano limpo."],
    ["sit", { adult: "lap", hold: "book" }, "Deixe que segure e olhe as figuras."],
    ["sit", { adult: "lap", hold: "book", dx: 4, mouth: "open", x: [say(188, 30, "bolinha!")] }, "Aponte e diga o nome de cada figura."],
    ["sit", { adult: "lap", hold: "book", mouth: "smile", x: [spark(190, 46)] }, "Se levar à boca, tudo bem: o livro é limpo e de pano."],
  ]),
  "4:Mordedor limpo": seq([
    ["sit", { adult: "hands" }, "Escolha um mordedor limpo e sem peças soltas."],
    ["sit", { adult: "hands", hold: "teether" }, "Ofereça na mãozinha dele."],
    ["sit", { adult: "hands", hold: "teether", mouth: "open" }, "Ele leva à boca para explorar."],
    ["sit", { adult: "hands", hold: "teether", mouth: "smile", x: [spark(190, 50)] }, "Lave depois de usar e fique de olho enquanto ele brinca."],
  ]),
  "4:Sentado no colo": seq([
    ["sit", { adult: "lap", window: true, mouth: "calm" }, "Segure-o sentado no colo, perto de uma janela."],
    ["sit", { adult: "lap", window: true, dx: 6 }, "Deixe que olhe o ambiente à vontade."],
    ["sit", { adult: "lap", window: true, dx: 6, mouth: "open", x: [say(60, 30, "uma árvore")] }, "Comente o que ele vê: cores, sons, pessoas."],
    ["sit", { adult: "lap", window: true, mouth: "smile", x: [heart(60, 40)] }, "Pare quando ele cansar ou virar o rosto."],
  ]),

  /* ================= 5 meses ================= */
  "5:Onde foi o brinquedo?": seq([
    ["sit", { floor: "rattle", adult: "hands" }, "Mostre um brinquedo para ele olhar bem."],
    ["sit", { floor: "clothToy", adult: "hands" }, "Cubra com um paninho, deixando uma pontinha à mostra."],
    ["sit", { floor: "clothToy", adult: "hands", dx: 8, mouth: "open" }, "Espere: ele pensa e tenta descobrir."],
    ["sit", { floor: "rattle", adult: "hands", mouth: "smile", x: [spark(200, 120), spark(60, 40)] }, "Achou! Comemore junto."],
  ]),
  "5:Bolhas de sabão": seq([
    ["sit", { adult: "lap" }, "Sente-o confortável, no colo ou apoiado."],
    ["sit", { adult: "lap", x: [bubbles(190, 90)] }, "Sopre bolhas de sabão devagar diante dele."],
    ["sit", { adult: "lap", dx: 8, mouth: "open", x: [bubbles(190, 80)] }, "Ele acompanha com os olhos e estica as mãos."],
    ["sit", { adult: "lap", mouth: "smile", x: [bubbles(190, 100), spark(50, 40)] }, "Diga: \"olha, estourou!\""],
  ]),
  "5:Brinquedo além do alcance": seq([
    ["tummy", { head: "up" }, "Deite-o de bruços num tapete firme."],
    ["tummy", { head: "up", toy: "far", toyX: 22, hand: true }, "Ponha o brinquedo um pouco longe das mãozinhas."],
    ["tummy", { head: "high", toyX: 34, toy: "far", reach: true }, "Ele se apoia, estica o braço e tenta pegar."],
    ["tummy", { head: "high", toyX: 34, toy: "far", reach: true, x: [spark(44, 48, 1.1), spark(118, 34, 0.8)] }, "Quando alcançar, comemore!"],
  ]),
  "5:Gestos simples": seq([
    ["face", { baby: "calm", adult: "smile" }, "Escolha dois gestos: \"mais\" e \"acabou\"."],
    ["face", { baby: "calm", adult: "open", x: [say(176, 22, "mais!")] }, "Diga a palavra e faça o gesto, sempre igual."],
    ["face", { baby: "open", adult: "smile", babyDx: 4, x: [say(176, 22, "acabou!")] }, "Repita em toda refeição e brincadeira."],
    ["face", { baby: "smile", adult: "smile", x: [heart(120, 34)] }, "Um dia ele vai responder com o gesto."],
  ]),
  "5:Rolar com brinquedo": seq([
    ["lie", { toySide: "right" }, "Deite-o de costas e ponha um brinquedo ao lado."],
    ["lie", { toySide: "right", lookDx: 6, x: [arrow(170, 66, 208, 104)] }, "Chame a atenção dele para o brinquedo."],
    ["tummy", { head: "up", roll: true, toy: "ball", toyX: 30 }, "Ele vira de lado para alcançar."],
    ["tummy", { head: "high", toy: "ball", toyX: 30, reach: true, x: [spark(44, 48), spark(118, 34, 0.8)] }, "Quando rolar, comemore! Repita para o outro lado."],
  ]),
  "5:Chocalho que chama": seq([
    ["lie", { arms: "rest" }, "Deite-o tranquilo, acordado e satisfeito."],
    ["lie", { holdX: 60, x: [notes(24, 50)] }, "Sacuda o chocalho de um lado."],
    ["lie", { holdX: 60, lookDx: -5, mouth: "open", x: [notes(24, 50)] }, "Ele escuta e vira a cabeça para procurar."],
    ["lie", { holdX: 150, lookDx: 5, mouth: "smile", x: [notes(196, 50), spark(30, 40)] }, "Mude de lado e repita."],
  ]),
  "5:Água no banho": seq([
    ["bath", {}, "Na banheira, com água morna, converse com ele."],
    ["bath", { cup: true }, "Com um copinho, derrame água devagar nas mãozinhas."],
    ["bath", { cup: true, splash: true, mouth: "open" }, "Deixe que sinta e bata na água."],
    ["bath", { duck: true, mouth: "smile", x: [spark(40, 50)] }, "Nunca o deixe sozinho na água, nem por um segundo."],
  ]),
  "5:Livro com figuras": seq([
    ["sit", { adult: "lap" }, "Escolha um livro com figuras grandes e coloridas."],
    ["sit", { adult: "lap", hold: "book" }, "Segure-o no colo, com o livro à frente."],
    ["sit", { adult: "lap", hold: "book", mouth: "open", dx: 4, x: [say(188, 30, "au-au!")] }, "Aponte, nomeie e imite o som."],
    ["sit", { adult: "lap", hold: "book", mouth: "smile", x: [heart(190, 44)] }, "Leia todo dia, mesmo que sejam poucos minutos."],
  ]),

  /* ================= 6 meses ================= */
  "6:Brinquedos em volta": seq([
    ["tummy", { head: "up", around: true }, "Espalhe brinquedos de tamanhos e texturas diferentes ao redor."],
    ["tummy", { head: "high", around: true, reach: true, toy: "near", toyX: 40 }, "De bruços, ele escolhe um e se estica."],
    ["tummy", { head: "up", around: true, roll: true }, "Ele gira o corpo para chegar aos outros."],
    ["tummy", { head: "high", around: true, x: [spark(44, 48, 1.1), spark(118, 34, 0.8), spark(160, 60, 0.9)] }, "Deixe que escolha. Fique por perto e comemore."],
  ]),
  "6:Esconde-achou": seq([
    ["peek", { cloth: "off", showCloth: true }, "Sente-o de frente para você e pegue um paninho leve."],
    ["peek", { cloth: "face" }, "Cubra o rosto dele com o paninho por um instante."],
    ["peek", { cloth: "partial", x: [say(184, 30, "cadê o bebê?")] }, "Tire devagar, dizendo: \"cadê o bebê?\""],
    ["peek", { cloth: "off", mouth: "smile", x: [say(184, 30, "achou!"), spark(56, 50)] }, "\"Achou!\" Sorria e repita."],
  ]),
  "6:Torre macia": seq([
    ["sit", { floor: "blocks", adult: "hands" }, "Monte uma torrinha de blocos macios diante dele."],
    ["sit", { floor: "blocks", adult: "hands", dx: 6, mouth: "open" }, "Mostre devagar como ela é feita."],
    ["sit", { floor: "blocksFallen", adult: "hands", mouth: "open", x: [motion(176, 120)] }, "Deixe que derrube! É a melhor parte."],
    ["sit", { floor: "blocksFallen", adult: "hands", mouth: "smile", x: [spark(60, 40)] }, "Monte de novo e repita."],
  ]),
  "6:Ida e volta de sons": seq([
    ["face", { baby: "calm", adult: "smile" }, "Fique de frente para ele, com o rosto bem perto."],
    ["face", { baby: "open", adult: "smile", x: [say(78, 40, "ba-ba")] }, "Quando ele fizer um som, copie."],
    ["face", { baby: "calm", adult: "open", x: [say(176, 22, "ba-ba")] }, "Espere um pouquinho: é a vez dele."],
    ["face", { baby: "smile", adult: "smile", x: [heart(120, 34)] }, "Quanto mais vocês \"conversam\", mais ele fala."],
  ]),
  "6:Sentado com apoio": seq([
    ["sit", { adult: "hands" }, "Segure-o sentadinho, com as mãos na cintura."],
    ["sit", { cushions: true, floor: "rattle" }, "Apoie com almofadas ao redor."],
    ["sit", { cushions: true, lean: true, floor: "rattle", dx: 6, x: [arrow(146, 122, 186, 142)] }, "Coloque um brinquedo perto para ele se inclinar e alcançar."],
    ["sit", { cushions: true, mouth: "smile", x: [spark(40, 50)] }, "Fique ao lado, sempre atenta, por poucos minutos."],
  ]),
  "6:Livros de páginas grossas": seq([
    ["sit", { adult: "lap" }, "Escolha um livro de páginas grossas."],
    ["sit", { adult: "lap", hold: "book" }, "Sente-o no colo e deixe que toque no livro."],
    ["sit", { adult: "lap", hold: "book", mouth: "open", dx: 4, x: [say(188, 30, "carro!")] }, "Aponte e nomeie rostos, carros e bichos."],
    ["sit", { adult: "lap", hold: "book", mouth: "smile", x: [heart(190, 44)] }, "Deixe que vire as páginas, mesmo fora de ordem."],
  ]),
  "6:Papel que faz barulho": seq([
    ["sit", { adult: "hands" }, "Pegue um papel grande que amassa, sem pontas."],
    ["sit", { hold: "crinkle", adult: "hands" }, "Deixe que mexa e escute o barulho."],
    ["sit", { hold: "crinkle", adult: "hands", mouth: "open", x: [notes(196, 40)] }, "Amasse também e mostre os sons."],
    ["sit", { hold: "crinkle", adult: "hands", mouth: "smile", x: [spark(190, 50)] }, "Se rasgar ou levar à boca, troque por um brinquedo."],
  ]),
  "6:Cavalinho no joelho": seq([
    ["sit", { adult: "lap", adult2: "hands" }, "Sente-o de frente para você, apoiado nas suas pernas."],
    ["sit", { adult: "lap", adult2: "hands", x: [motion(30, 100), notes(196, 40, 1.2)] }, "Balance de leve cantando \"upa, cavalinho\"."],
    ["sit", { adult: "lap", adult2: "hands", mouth: "open", x: [say(188, 30, "upa!")] }, "Pare de repente e espere o \"mais\"."],
    ["sit", { adult: "lap", adult2: "hands", mouth: "smile", x: [heart(190, 44), spark(50, 40)] }, "Ele ri e pede de novo. Repita!"],
  ]),
};
