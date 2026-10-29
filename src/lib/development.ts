/**
 * Janela de desenvolvimento de cada mês (0 a 24 meses): o que costuma acontecer, o que observar
 * e estímulos para fazer em casa. Módulo puro (sem navegador): o servidor usa para o aviso de "mesversário".
 *
 * Texto escrito por nós, em palavras próprias, juntando estas fontes:
 *  - CDC, "Marcos do Desenvolvimento" (versão em português, 2022): marcos de 2, 4, 6, 9, 12, 15, 18 e 24 meses
 *    (o que a maioria dos bebês já faz até essa idade) e a orientação "aja cedo".
 *  - Sociedade Brasileira de Pediatria, Cartilha de Desenvolvimento (2 meses a 5 anos): dicas por idade.
 *  - Manual MSD (versão para a família): marcos do nascimento aos 12 meses.
 *  - Pathways.org: tummy time mês a mês.
 *  - HSE (serviço de saúde da Irlanda): ideias de brincadeiras de 0 a 2 anos.
 *  - First 5 California: atividades por mês no primeiro ano.
 * Nos meses entre os pontos de checagem do CDC, os marcos são uma aproximação entre o ponto anterior e o
 * seguinte (cada bebê tem o seu ritmo). Nada aqui é diagnóstico.
 */

export type DevArea = "mov" | "soc" | "ling" | "cog";

export const DEV_AREAS: Record<DevArea, string> = {
  mov: "Movimento",
  soc: "Social e emoções",
  ling: "Fala e comunicação",
  cog: "Aprender e pensar",
};

export type DevMilestone = { id: string; area: DevArea; texto: string };
export type DevActivity = { titulo: string; como: string; treina: string };
export type DevMonth = {
  month: number;
  tema: string;
  janela: string;
  /** true quando o mês é um ponto de checagem do CDC (marcos "oficiais" dessa idade) */
  checkpoint: boolean;
  marcos: DevMilestone[];
  estimulos: DevActivity[];
  cuidados: string[];
  /** frase extra para o aviso "converse com o pediatra" nesta idade */
  triagem?: string;
};

export const DEV_ALERT =
  "Se ele ainda não faz várias dessas coisas, perdeu algo que já fazia ou você sente que há algo diferente, converse com o pediatra e peça uma triagem do desenvolvimento. Não precisa esperar: quanto mais cedo se olha, melhor.";

type A = [string, string, string]; // título, como, treina
type M = [DevArea, string];

function mk(
  month: number,
  tema: string,
  janela: string,
  marcos: M[],
  estimulos: A[],
  cuidados: string[],
  opts: { checkpoint?: boolean; triagem?: string } = {}
): DevMonth {
  return {
    month,
    tema,
    janela,
    checkpoint: Boolean(opts.checkpoint),
    marcos: marcos.map(([area, texto], i) => ({ id: `${month}-${i}`, area, texto })),
    estimulos: estimulos.map(([titulo, como, treina]) => ({ titulo, como, treina })),
    cuidados,
    triagem: opts.triagem,
  };
}

const SONO_SEGURO = "Para dormir, sempre de barriga para cima, em local seguro. Nunca sacuda o bebê.";
const TELAS = "Telas: a recomendação é nenhuma antes dos 2 anos (videochamada com a família pode).";

export const DEV_MONTHS: DevMonth[] = [
  mk(
    0,
    "Conhecendo o mundo de pertinho",
    "Dorme a maior parte do dia e acorda para mamar. Enxerga melhor o que está bem perto, como o rosto de quem o segura. O que mais importa agora é colo, voz e vínculo.",
    [
      ["mov", "Leva as mãos à boca e aos olhos"],
      ["mov", "Levanta a cabeça por um instante de bruços e vira para os lados"],
      ["soc", "Chora para avisar fome ou desconforto e se acalma com colo e voz"],
      ["cog", "Reage a sons: se assusta, chora ou fica quietinho"],
      ["cog", "Olha para o rosto de quem está perto e acompanha algo que se move devagar"],
    ],
    [
      ["Olho no olho", "Fique de frente para ele, bem perto, e converse ou cante baixinho. Os bebês pequenos preferem rostos a brinquedos.", "Vínculo e atenção ao rosto"],
      ["Barriguinha no seu peito", "Deite-se reclinada e coloque o bebê de bruços sobre o seu peito, acordado e calmo. Comece com 2 a 5 minutos, algumas vezes por dia, e pare se ele reclamar.", "Força do pescoço"],
      ["Narrar o dia", "Conte o que está fazendo na troca de fralda e no banho, com voz calma.", "Ouvir a linguagem"],
      ["Colo e pele com pele", "Segure, balance e acalme sempre que precisar. Colo não estraga o bebê.", "Segurança e vínculo"],
    ],
    [SONO_SEGURO, "Se o choro deixar você muito nervosa, coloque o bebê em local seguro, respire e volte a ver como ele está a cada 5 a 10 minutos."]
  ),
  mk(
    1,
    "Mais atento ao seu rosto",
    "Fica acordado por mais tempo e olha com mais interesse para rostos e vozes. Perto de 6 semanas, muitos bebês começam a sorrir quando alguém conversa com eles.",
    [
      ["soc", "Começa a sorrir quando conversam com ele (costuma aparecer perto de 6 semanas)"],
      ["cog", "Acompanha com o olhar um rosto ou brinquedo que se move devagar"],
      ["mov", "Levanta a cabeça por alguns segundos de bruços e vira para os dois lados"],
      ["ling", "Reconhece a voz de quem cuida dele e se acalma com ela"],
      ["mov", "Mexe braços e pernas sem parar, em movimentos soltos"],
    ],
    [
      ["Caretas e imitação", "Faça uma careta devagar, espere e veja se ele reage. Depois copie as expressões dele.", "Interação e imitação"],
      ["Brinquedo que passeia", "Segure um brinquedo colorido perto do rosto e mova bem devagar de um lado para o outro.", "Foco dos olhos"],
      ["Barriguinha com você no chão", "Deite-o de bruços acordado, com você no nível dos olhos dele, sorrindo e cantando. Sessões curtas e frequentes.", "Força do pescoço"],
      ["Cantar e conversar", "Cante a mesma música sempre que for trocá-lo ou dar banho.", "Linguagem e rotina"],
    ],
    [SONO_SEGURO]
  ),
  mk(
    2,
    "O primeiro sorriso de verdade",
    "Ele já olha para você, sorri de volta e começa a soltar sons além do choro. Os braços e as mãos ficam mais soltos.",
    [
      ["soc", "Acalma-se com a sua voz ou com o colo"],
      ["soc", "Olha para o seu rosto, parece contente ao ver você e sorri quando você sorri"],
      ["ling", "Faz sons além do choro e reage a sons altos"],
      ["cog", "Acompanha com o olhar quem se move e fixa um brinquedo por alguns segundos"],
      ["mov", "Mantém a cabeça erguida de bruços, mexe braços e pernas e abre as mãos por instantes"],
    ],
    [
      ["Conversa de ping-pong", "Quando ele fizer um som ou sorrir, responda, espere um pouco e deixe que ele \"responda\" de novo.", "Comunicação"],
      ["Tummy time no chão", "Deite-o de bruços sobre uma superfície firme, com um livro de contraste forte ou um espelho à frente. Cerca de 1 minuto por vez, várias vezes ao dia, até chegar a 15 a 30 minutos no total.", "Força do pescoço e dos ombros"],
      ["Bicicletinha", "Com ele deitado de costas, mova as perninhas devagar como se pedalasse, cantando.", "Movimento e flexibilidade"],
      ["Livro de figuras", "Mostre figuras simples e grandes e leia em voz alta, mesmo que ele ainda não entenda.", "Sons e ritmo da fala"],
    ],
    [SONO_SEGURO, "Até os 6 meses, só leite materno ou fórmula."],
    { checkpoint: true }
  ),
  mk(
    3,
    "Descobrindo as mãos e a risada",
    "Fica acordado por mais tempo durante o dia, ri e brinca de \"conversar\". De bruços, já se apoia nos antebraços e levanta bem a cabeça.",
    [
      ["mov", "De bruços, apoia-se nos antebraços e levanta a cabeça, e a sustenta bem quando está no colo"],
      ["cog", "Acompanha objetos de um lado ao outro com os olhos"],
      ["mov", "Abre e fecha as mãos e tenta alcançar brinquedos pendurados"],
      ["soc", "Sorri e ri em resposta à sua voz"],
      ["ling", "Faz sons parecidos com fala, como \"aaa\" e \"ooo\""],
    ],
    [
      ["Vai e volta", "Quando ele fizer um som, olhe nos olhos, sorria e responda com palavras. É assim que se constroem as conexões da fala.", "Comunicação"],
      ["Brinquedo de lado a lado", "Mova devagar um chocalho ou brinquedo de um lado para o outro à frente dele, de bruços, cantando.", "Acompanhar com o olhar"],
      ["Passeio narrado", "Na rua ou em casa, descreva o que vê e ouve: \"olha o passarinho\", \"o vento\".", "Vocabulário"],
      ["Brinquedo pendurado", "Deite-o de costas com um brinquedo pendurado ao alcance das mãos (nunca preso sobre o berço).", "Alcançar e agarrar"],
    ],
    [SONO_SEGURO, "Evite deixá-lo muito tempo em balanço, carrinho ou cadeirinha: ele precisa de chão para se mexer."]
  ),
  mk(
    4,
    "Conversando de volta",
    "Ele sorri para chamar a sua atenção, dá risadinhas e responde com sons quando você fala. As mãos viram brinquedos.",
    [
      ["soc", "Sorri por conta própria para chamar a sua atenção e dá risadinhas"],
      ["ling", "Faz sons como \"oooo\" e \"aahh\", responde quando você fala e vira a cabeça para a voz"],
      ["cog", "Abre a boca ao ver o peito ou a mamadeira e observa as próprias mãos"],
      ["mov", "Sustenta a cabeça sem apoio e segura um brinquedo colocado na mão"],
      ["mov", "Leva as mãos à boca, balança brinquedos e, de bruços, se apoia nos antebraços"],
    ],
    [
      ["Brinquedo logo fora do alcance", "De bruços, ponha um brinquedo um pouco além das mãos para ele se esticar e começar a rolar.", "Alcançar e rolar"],
      ["Caretas no espelho", "Coloque-o diante de um espelho seguro e faça caretas junto com ele.", "Perceber o próprio reflexo"],
      ["Dançar no colo", "Embale-o ao som de uma música no seu colo, deixando que mexa no ritmo.", "Ritmo e equilíbrio"],
      ["Chutar e agarrar", "Ofereça brinquedos seguros (sem peças pequenas, pontas ou calor) para segurar, balançar e chutar.", "Coordenação"],
    ],
    [TELAS, "Evite deixá-lo muito tempo em balanço ou cadeirinha. Responder aos sons e sorrisos dele é a melhor brincadeira."],
    { checkpoint: true }
  ),
  mk(
    5,
    "Mãos que alcançam",
    "Ele ganha controle dos movimentos: apoia-se nas mãos de bruços, alcança objetos e muitos bebês já sentam com apoio.",
    [
      ["mov", "De bruços, empurra o corpo com os braços esticados"],
      ["mov", "Estica a mão e pega brinquedos que estão perto"],
      ["mov", "Senta com apoio (colo, almofadas) e começa a rolar"],
      ["soc", "Ri alto e gosta de brincadeiras com você"],
      ["ling", "Responde a vozes com sons e \"conversa\" com brinquedos"],
    ],
    [
      ["Onde foi o brinquedo?", "Cubra um brinquedo com um paninho, deixando uma pontinha à mostra, e deixe que ele descubra.", "Pensar e resolver problema"],
      ["Bolhas de sabão", "Sopre bolhas perto dele para que acompanhe com os olhos e tente alcançar.", "Foco e alcance"],
      ["Brinquedo além do alcance", "De bruços, coloque o brinquedo um pouquinho longe: ele se estica, apoia as mãos e começa a se arrastar.", "Força e movimento"],
      ["Gestos simples", "Faça sempre o mesmo gesto para \"mais\" e \"acabou\" ao dar comida ou brincar.", "Comunicação"],
    ],
    ["Perto dos 6 meses, pergunte ao pediatra quando e como começar os alimentos, e como evitar engasgos. O leite continua sendo a base."]
  ),
  mk(
    6,
    "Rolar, sentar e explorar com a boca",
    "Tudo vai para a boca: é assim que ele conhece o mundo. Rola, apoia-se nas mãos para sentar e reconhece quem é da família.",
    [
      ["soc", "Reconhece pessoas conhecidas e gosta de se olhar no espelho"],
      ["ling", "Alterna sons com você, faz bolinhas de saliva e dá gritinhos agudos"],
      ["cog", "Leva objetos à boca e estica a mão para pegar o que quer"],
      ["mov", "Rola de bruços para as costas e empurra o corpo com os braços esticados"],
      ["mov", "Apoia-se nas mãos ao sentar"],
    ],
    [
      ["Brinquedos em volta", "De bruços, espalhe brinquedos de tamanhos e texturas diferentes ao redor para ele girar e alcançar.", "Rolar, girar e pegar"],
      ["Esconde-achou", "Cubra o rosto com as mãos ou com um paninho e apareça: \"achou!\"", "Saber que as coisas continuam existindo"],
      ["Torre macia", "Empilhe blocos macios para ele derrubar, e deixe que o faça sozinho depois.", "Coordenação olho-mão"],
      ["Ida e volta de sons", "Copie os sons que ele faz e espere a resposta. Mostre figuras e nomeie.", "Fala e atenção"],
    ],
    ["Converse com o pediatra sobre a introdução de alimentos e os riscos de engasgo. Ofereça só brinquedos limpos e sem peças pequenas, porque tudo vai para a boca.", TELAS],
    { checkpoint: true }
  ),
  mk(
    7,
    "Quase sentado sozinho",
    "Muitos bebês sentam sem apoio, passam objetos de uma mão para a outra e reagem ao próprio nome. Querem explorar tudo.",
    [
      ["mov", "Senta sem apoio por alguns instantes (alguns ainda estão aprendendo)"],
      ["mov", "Passa objetos de uma mão para a outra"],
      ["cog", "Procura o brinquedo que caiu"],
      ["ling", "Responde ao próprio nome e balbucia combinações como \"ba-ba\""],
      ["soc", "Fica animado antes de brincadeiras conhecidas, como esconde-achou"],
    ],
    [
      ["Brinquedos de lado", "Sentado, ponha brinquedos ao lado para ele girar o tronco e se esticar sem cair.", "Equilíbrio e força do tronco"],
      ["Bola que vai e volta", "Sentem no chão e role uma bola macia entre vocês.", "Acompanhar e trocar"],
      ["Palmas e música", "Bata palmas junto com uma música e deixe que imite.", "Ritmo e coordenação"],
      ["Circuito de almofadas", "Monte uma pequena trilha de almofadas para ele subir, contornar e se arrastar.", "Engatinhar e explorar"],
    ],
    ["Ele logo vai se deslocar: comece a olhar a casa de baixo para cima (tomadas, fios, escadas)."]
  ),
  mk(
    8,
    "Entendendo causa e efeito",
    "Descobre que as ações têm resultado (bate, joga, escuta o barulho) e pode estranhar quem não conhece. Isso é sinal de apego saudável.",
    [
      ["cog", "Entende causa e efeito: bate, joga e escuta o barulho"],
      ["soc", "Pode estranhar pessoas desconhecidas ou chorar quando você se afasta"],
      ["mov", "Senta com firmeza e tenta se deslocar (arrastar, engatinhar ou rolar)"],
      ["ling", "Repete sílabas como \"mamama\" e \"babababa\""],
      ["soc", "Estica os braços para ser pego"],
    ],
    [
      ["Narrar a rotina", "Dê nome ao que faz e ao que ele vê: \"vamos pegar a colher\", \"agora o banho\".", "Vocabulário e compreensão"],
      ["Tinta no saquinho", "Coloque um pouco de tinta atóxica dentro de um saquinho bem fechado e deixe que ele espalhe com os dedos.", "Sentir texturas sem sujeira"],
      ["Um tempinho sozinho", "Deixe-o brincar sozinho em local seguro por alguns minutos, com você por perto.", "Independência"],
      ["Esconde-esconde", "Esconda um brinquedo debaixo de um pano e deixe que o encontre.", "Pensar e memória"],
    ],
    ["Se ele chorar quando você sai, despeça-se com um \"tchau\" curto e alegre e diga que volta. Sair escondido piora o medo.", "Proteja a casa: tomadas, quinas, escadas, produtos de limpeza e remédios fora do alcance."]
  ),
  mk(
    9,
    "Esconde-esconde e a primeira timidez",
    "Ele tem consciência de quem é familiar e quem não é. Brinca de esconder, bate objetos e começa a usar gestos. Idade em que o pediatra costuma fazer a triagem do desenvolvimento.",
    [
      ["soc", "Fica tímido ou apegado perto de estranhos e reage quando você se afasta"],
      ["soc", "Responde ao próprio nome e mostra emoções variadas"],
      ["ling", "Faz sons repetidos como \"mamama\" e \"babababa\" e estende os braços para ser pego"],
      ["cog", "Procura objetos que somem de vista e bate dois objetos um no outro"],
      ["mov", "Senta sozinho, passa objetos de uma mão para a outra e pega comida com os dedos"],
    ],
    [
      ["Repetir e ampliar", "Repita os sons dele e acrescente uma palavra simples: \"ba-ba... bola!\"", "Ligar som e significado"],
      ["Minha vez, sua vez", "Passem um objeto de um para o outro, dizendo \"sua vez\", \"minha vez\".", "Revezar e se comunicar"],
      ["Tchau e não", "Ensine \"tchau\" acenando e \"não\" balançando a cabeça, sempre com o gesto junto da palavra.", "Gestos"],
      ["Empilhar e despejar", "Coloque blocos ou copinhos num pote e despeje: \"põe\", \"tira\".", "Coordenação e ideia de dentro/fora"],
    ],
    ["Deixe-o explorar a comida com as mãos, mesmo que faça bagunça. Ofereça sabores e texturas diferentes, mesmo se recusar na primeira vez.", "Prefira \"hora de sentar\" a só dizer \"não\"."],
    { checkpoint: true, triagem: "Aos 9 meses a Academia Americana de Pediatria recomenda uma triagem geral do desenvolvimento. Leve esta lista na consulta e pergunte." }
  ),
  mk(
    10,
    "Puxar para ficar de pé",
    "Muita energia: engatinha ou se desloca de algum jeito, puxa-se para ficar em pé nos móveis e pega coisas pequenas com a ponta dos dedos.",
    [
      ["mov", "Se desloca de algum jeito (engatinha, arrasta-se ou rola) e fica em pé segurando-se"],
      ["mov", "Pega objetos pequenos com a ponta dos dedos"],
      ["cog", "Procura brinquedos que você escondeu"],
      ["ling", "Diz \"mamã\" ou \"papá\" (ainda sem direcionar) e usa gestos como \"tchau\""],
      ["soc", "Imita palmas e brincadeiras"],
    ],
    [
      ["Túnel de caixa", "Corte as duas pontas de uma caixa grande e deixe que ele atravesse.", "Engatinhar e noção de espaço"],
      ["Post-it para descolar", "Cole post-its em uma superfície e deixe que ele descole um por um (sempre olhando para não colocar na boca).", "Pinça e coordenação fina"],
      ["Imitar a vida real", "Dê uma colher e um copo e mostre como \"comer\" e \"beber\" de mentirinha.", "Imaginação e imitação"],
      ["Levantar e sentar", "Sentado no tapete, segure as mãos dele e ajude a levantar por alguns segundos, depois sentar.", "Força das pernas"],
    ],
    ["Fixe os móveis que ele usa para se apoiar e proteja as quinas."]
  ),
  mk(
    11,
    "Quase andando",
    "Anda segurando nos móveis, fica em pé por instantes sem apoio e entende bem mais do que consegue dizer.",
    [
      ["mov", "Anda de lado segurando nos móveis e fica em pé por instantes"],
      ["ling", "Entende \"não\" e para por um instante"],
      ["cog", "Procura um brinquedo escondido sob um pano"],
      ["ling", "Usa \"mamã\" e \"papá\" para a pessoa certa e acena \"tchau\""],
      ["mov", "Pega objetos pequenos com o polegar e o indicador"],
    ],
    [
      ["Parquinho", "No balanço e no escorregador, sempre no seu colo ou com apoio, para sentir o movimento.", "Equilíbrio e confiança"],
      ["Histórias com bichinhos", "Invente historinhas curtas com bichos de pelúcia.", "Imaginação e linguagem"],
      ["Brinquedo de empurrar", "Ofereça um carrinho firme para empurrar quando ele andar apoiado.", "Preparar para andar"],
      ["Banho com brinquedos", "Ponha brinquedos que flutuam e copinhos para encher e esvaziar.", "Sentidos e coordenação"],
    ],
    ["Guarde objetos pontiagudos, remédios e produtos de limpeza e tenha o telefone de emergência salvo."]
  ),
  mk(
    12,
    "Primeiro aninho: palavras e passos",
    "Ele já participa das brincadeiras, procura o que você esconde e começa a puxar-se para andar. Muitos dão os primeiros passos entre os 10 e os 15 meses.",
    [
      ["soc", "Participa de brincadeiras de interação, como bater palmas"],
      ["ling", "Acena \"tchau\", chama os pais por um nome e entende o \"não\""],
      ["cog", "Coloca objetos dentro de recipientes e procura brinquedos escondidos sob um pano"],
      ["mov", "Levanta-se apoiado, anda segurando-se nos móveis e pega pequenos objetos com polegar e indicador"],
      ["mov", "Bebe de copo aberto com a sua ajuda"],
    ],
    [
      ["Narrar tudo", "Descreva o que você está fazendo: \"a mamãe está lavando as mãos\".", "Vocabulário"],
      ["Comemorar as tentativas de fala", "Dê significado ao que ele diz e comemore, mesmo que não seja uma palavra completa.", "Vontade de falar"],
      ["Pôr e tirar do pote", "Ofereça potes e brinquedos pequenos (maiores que a boca) para colocar e tirar.", "Cognição e coordenação"],
      ["Bateria de panelas", "Dê panelas, colheres de pau e instrumentos simples para fazer barulho.", "Causa e efeito, ritmo"],
    ],
    [
      "Casa segura: guarde objetos pontiagudos ou quebráveis, remédios e produtos de limpeza, e deixe o número de emergência salvo.",
      "Redirecione com um brinquedo ou outro ambiente. Reserve o \"não\" firme para perigos.",
      "Suco 100% só um pouco (até 100 ml por dia) e evite bebidas açucaradas.",
      TELAS,
    ],
    { checkpoint: true }
  ),
  mk(
    13,
    "Primeiros passos a caminho",
    "Está treinando para andar: alguns já dão passos sozinhos, outros ainda se seguram nos móveis. Os dois jeitos são normais.",
    [
      ["mov", "Dá alguns passos sozinho ou está perto disso"],
      ["ling", "Tenta imitar palavras e usa \"mamã/papá\" para a pessoa certa"],
      ["cog", "Segue pedidos simples acompanhados de gesto, como \"me dá\""],
      ["cog", "Coloca coisas dentro de recipientes e tira de novo"],
      ["soc", "Mostra objetos de que gosta e bate palmas empolgado"],
    ],
    [
      ["Cantar com gestos", "Cante músicas simples e faça os gestos junto. Ele logo vai imitar.", "Imitação e fala"],
      ["Empilhar", "Mostre como empilhar dois blocos e derrubar a torre.", "Coordenação"],
      ["Livro de papelão", "Leia livros curtos, uma frase por página, apontando as figuras.", "Linguagem"],
      ["Ajudante da casa", "Peça que pegue o sapato ou ponha um brinquedo na caixa.", "Compreensão de pedidos"],
    ],
    ["Proteja degraus e escadas com portão: agora ele se levanta e anda."]
  ),
  mk(
    14,
    "Mais palavras, mais vontade própria",
    "Entende muito do que ouve, aponta para pedir e começa a mostrar a própria vontade. Birras leves podem aparecer.",
    [
      ["mov", "Anda com mais firmeza (ou está quase lá)"],
      ["ling", "Aponta para pedir algo ou ajuda"],
      ["cog", "Olha para objetos conhecidos quando você os nomeia"],
      ["cog", "Usa objetos do jeito certo, como telefone, copo ou livro"],
      ["soc", "Abraça bichinhos de pelúcia e demonstra afeto"],
    ],
    [
      ["Repetir e ampliar", "Quando ele disser \"bó\", responda \"bola, isso é uma bola\".", "Ampliar o vocabulário"],
      ["Esperar o som", "Aponte um objeto, nomeie e espere um som dele antes de entregar.", "Pedir com palavras"],
      ["Faz de conta simples", "Ofereça comida de mentirinha a uma pelúcia com uma colher.", "Imaginação"],
      ["Bolhas e perseguição", "Brinque de perseguir bolhas de sabão ou de correr atrás um do outro.", "Movimento e alegria"],
    ],
    ["Nomeie os sentimentos: \"você está bravo\". Em birras, ofereça distração ou deixe que se acalme em segurança."]
  ),
  mk(
    15,
    "Imitando tudo",
    "Observa e copia: outras crianças, adultos, o que a família faz. Mostra o que gosta e demonstra afeto.",
    [
      ["soc", "Imita outras crianças, mostra objetos de que gosta e bate palmas empolgado"],
      ["ling", "Tenta dizer uma ou duas palavras além de \"mama\" e \"dada\" e aponta para pedir"],
      ["ling", "Olha para objetos conhecidos quando você os nomeia e segue pedidos com gesto e fala"],
      ["cog", "Usa objetos do jeito certo (telefone, copo, livro) e empilha pelo menos dois"],
      ["mov", "Dá alguns passos sozinho e come com os dedos"],
    ],
    [
      ["Repetir e ampliar", "Repita e acrescente à palavra dele: \"bola? sim, é uma bola vermelha\".", "Vocabulário"],
      ["Mostrar como se usa", "Mostre como colocar um chapéu, pentear o cabelo ou falar ao telefone, e deixe que imite.", "Imitação e cognição"],
      ["Dar tarefas", "Peça que pegue os sapatos ou ponha lanches na bolsa.", "Compreensão e participação"],
      ["Copo aberto e colher", "Deixe-o treinar beber em copo sem tampa e usar a colher, mesmo derramando.", "Autonomia"],
    ],
    ["Crianças de 1 a 2 anos precisam de 11 a 14 horas de sono por dia, contando as sonecas.", "Mantenha rotinas de sono e alimentação. " + TELAS],
    { checkpoint: true }
  ),
  mk(
    16,
    "Explorando com tudo",
    "Quer pegar, abrir, derrubar e imitar. Sobe em móveis e anda cada vez mais seguro.",
    [
      ["mov", "Anda sozinho com mais segurança e se abaixa para pegar coisas"],
      ["cog", "Imita tarefas simples (varrer, falar ao telefone)"],
      ["ling", "Diz algumas palavras além de \"mama\" e \"dada\""],
      ["soc", "Mostra o que gosta apontando e olhando para você"],
      ["cog", "Empilha dois ou mais objetos"],
    ],
    [
      ["Caixa do tesouro", "Reúna itens seguros de textura diferente (esponja natural, escova macia, rolo de papel) para explorar.", "Sentidos e curiosidade"],
      ["Chutar e rolar bola", "Chutem uma bola macia um para o outro.", "Equilíbrio e coordenação"],
      ["Telescópio e túnel", "Use rolos de papel como telescópio, túnel para brinquedos ou microfone.", "Imaginação"],
      ["Água e jarros", "Com jarros plásticos e uma bacia de água, deixe-o encher, derramar e esvaziar.", "Coordenação olho-mão"],
    ],
    ["Cuidado com janelas, portas e escadas. Agora ele chega rápido a tudo."]
  ),
  mk(
    17,
    "Quase aos 18",
    "Fala mais, rabisca e quer fazer sozinho. Já entende pedidos sem precisar do gesto.",
    [
      ["ling", "Fala três ou mais palavras além de \"mama\" e \"dada\" (ou está perto disso)"],
      ["cog", "Segue comandos simples sem gesto"],
      ["mov", "Rabisca e tenta usar a colher"],
      ["soc", "Aponta para mostrar algo interessante"],
      ["mov", "Sobe e desce do sofá ou da cadeira sem ajuda"],
    ],
    [
      ["Giz de cera grosso", "Dê giz de cera grosso e papel grande para rabiscar à vontade.", "Coordenação fina"],
      ["O que é isso?", "Faça perguntas simples com livros e objetos: \"O que é isso?\"", "Nomear coisas"],
      ["Brinquedo de empurrar", "Carrinho de boneca, carrinho de compras de brinquedo, andador firme.", "Andar com firmeza"],
      ["Partes do corpo", "Aponte e diga: \"nariz\", \"boca\", \"mão\", e peça que ele também aponte.", "Vocabulário"],
    ],
    ["Fique na altura dos olhos dele ao conversar."]
  ),
  mk(
    18,
    "Eu faço sozinho!",
    "Mostra mais independência: afasta-se mas confere se você está por perto, aponta para mostrar e quer ajudar. Idade de triagem do desenvolvimento e de autismo.",
    [
      ["soc", "Afasta-se, mas confere se você está por perto; aponta para mostrar algo e estende as mãos para ser lavado"],
      ["ling", "Fala três ou mais palavras além de \"mamãe\" e \"papai\" e segue comandos de uma etapa sem gestos"],
      ["cog", "Copia tarefas da casa (como varrer) e brinca de forma simples (empurra um carrinho)"],
      ["mov", "Anda sem apoio e rabisca"],
      ["mov", "Bebe de copo aberto (às vezes derramando), tenta usar colher e sobe e desce do sofá sem ajuda"],
    ],
    [
      ["Faz de conta", "Alimente uma pelúcia com colher, ponha o ursinho para dormir.", "Imaginação"],
      ["Escolhas de duas opções", "Pergunte: \"quer a camiseta azul ou a verde?\"", "Autonomia e linguagem"],
      ["Perguntas simples", "Aponte coisas e pergunte \"O que é isso?\". Espere a resposta.", "Vocabulário"],
      ["Ajudante na rotina", "Deixe-o ajudar a guardar brinquedos e a se vestir.", "Participar e cooperar"],
    ],
    [
      "Pergunte ao pediatra se ele está pronto para largar a fralda: muitas crianças só conseguem entre 2 e 3 anos.",
      "Faça as refeições à mesa, com ele junto. " + TELAS,
    ],
    {
      checkpoint: true,
      triagem: "Aos 18 meses recomenda-se triagem geral do desenvolvimento e triagem de autismo. Pergunte ao pediatra.",
    }
  ),
  mk(
    19,
    "Muitas palavras novas",
    "O vocabulário começa a crescer e ele entende ainda mais. Brincar sozinho e com você fica mais divertido.",
    [
      ["ling", "Usa várias palavras e entende bem pedidos simples"],
      ["cog", "Brinca com brinquedos de jeito simples (empurra carrinho, empilha blocos)"],
      ["mov", "Anda e se agacha para pegar coisas sem cair"],
      ["soc", "Brinca ao lado de outras crianças"],
      ["cog", "Imita o que vê você fazendo"],
    ],
    [
      ["Quebra-cabeça simples", "Comece com peças grandes de encaixar e ajude só quando pedir.", "Resolver problemas"],
      ["Massinha", "Deixe-o apertar, amassar e dar forma à massinha atóxica.", "Força das mãos e imaginação"],
      ["Instrumentos simples", "Tambor, xilofone ou panela com colher de pau.", "Ritmo e sons"],
      ["Livros curtos", "Leia o mesmo livro várias vezes e deixe que vire as páginas.", "Linguagem e atenção"],
    ],
    ["Rotina de sono com horário fixo ajuda muito nessa fase."]
  ),
  mk(
    20,
    "Juntando duas palavras",
    "Em breve, \"mais leite\", \"quer bola\". Corre (meio desajeitado) e adora imitar.",
    [
      ["ling", "Começa a juntar duas palavras"],
      ["ling", "Aponta para figuras de um livro quando você pergunta onde está o bicho"],
      ["mov", "Corre de um jeito desajeitado e come com colher"],
      ["cog", "Brinca de faz de conta mais elaborado"],
      ["soc", "Percebe quando alguém está triste"],
    ],
    [
      ["Onde está o urso?", "Em livros, pergunte \"onde está...?\" e deixe que ele aponte.", "Vocabulário e atenção"],
      ["Brincar de se vestir", "Deixe-o usar roupas e chapéus de adulto.", "Imaginação"],
      ["Ao ar livre", "Brinque de \"pronto, preparado, já\" no balanço ou correndo.", "Movimento e linguagem"],
      ["Tinta e giz", "Deixe-o pintar e desenhar livremente com materiais atóxicos.", "Criatividade e coordenação"],
    ],
    ["Fale claro, mesmo que ele ainda não pronuncie bem: \"você quer mais banana?\""]
  ),
  mk(
    21,
    "Cada vez mais independente",
    "Quer fazer as coisas do seu jeito. Chuta bola, sobe degraus e começa a seguir rotinas.",
    [
      ["mov", "Chuta uma bola e sobe alguns degraus com ou sem ajuda"],
      ["ling", "Fala frases curtas de duas palavras"],
      ["cog", "Tenta usar interruptores e botões"],
      ["soc", "Olha para o seu rosto para saber como reagir a algo novo"],
      ["cog", "Brinca com mais de um brinquedo ao mesmo tempo"],
    ],
    [
      ["Brinquedo de causa e efeito", "Brinquedos com botões que acendem ou tocam sons.", "Causa e efeito"],
      ["Chutar, rolar e jogar", "Ofereça bolas de tamanhos diferentes.", "Coordenação motora"],
      ["Ajudar em casa", "Peça que leve guardanapos ou copos à mesa.", "Participação"],
      ["Brincadeira de esconder", "Esconda-se e deixe que ele procure.", "Atenção e alegria"],
    ],
    ["Mantenha horários regulares de sono e de refeições."]
  ),
  mk(
    22,
    "Quase dois aninhos",
    "Entende bem o que você diz, fala mais e mostra emoções fortes. Birras fazem parte.",
    [
      ["ling", "Combina duas palavras (\"mais leite\") e aponta duas partes do corpo"],
      ["soc", "Percebe quando outros estão tristes ou magoados"],
      ["mov", "Corre e chuta bola"],
      ["cog", "Segura algo com uma mão enquanto mexe com a outra"],
      ["soc", "Mostra gestos como mandar beijo ou balançar a cabeça para dizer sim"],
    ],
    [
      ["Nomear sentimentos", "Diga \"você está bravo\" ou \"triste\" e mostre formas de lidar, como um abraço.", "Emoções"],
      ["Revezar e dividir", "Brinque de passar a bola e dizer \"sua vez\" e \"minha vez\".", "Convivência"],
      ["Brincar com água e areia", "Jarros, pás e baldes para encher e esvaziar.", "Sentidos e coordenação"],
      ["Livros e cantigas", "Cante cantigas com gestos e leia todo dia.", "Linguagem"],
    ],
    ["Use palavras positivas para elogiar: \"muito bem guardar o brinquedo\"."]
  ),
  mk(
    23,
    "A caminho dos 2 anos",
    "O vocabulário e o faz de conta explodem. Ele quer participar de tudo.",
    [
      ["ling", "Combina palavras em pequenas frases e aponta figuras quando você pergunta"],
      ["cog", "Brinca com mais de um brinquedo ao mesmo tempo e tenta usar botões"],
      ["mov", "Corre, chuta bola e sobe escadas"],
      ["soc", "Faz gestos variados, como beijo e aceno"],
      ["soc", "Mostra preferência por algumas pessoas e brinquedos"],
    ],
    [
      ["Cantar e dançar", "Músicas com movimento: \"cabeça, ombro, joelho e pé\".", "Linguagem e coordenação"],
      ["Brincadeira de cozinha", "Panelinhas e colheres para fazer comidinha de mentirinha.", "Faz de conta"],
      ["Blocos de montar", "Torres e casinhas, com você montando e ele derrubando.", "Coordenação e planejamento"],
      ["Parque", "Escorregador, balanço e bola, com você por perto.", "Movimento e convivência"],
    ],
    ["Telas: a recomendação é nenhuma antes dos 2 anos. Depois, pouco tempo e com um adulto junto."]
  ),
  mk(
    24,
    "Dois anos: frases e correria",
    "Corre, chuta bola, junta palavras e observa como os outros se sentem. Cada vez mais faz de conta e quer escolher.",
    [
      ["soc", "Percebe quando outros estão magoados ou tristes e olha para você para saber como reagir ao novo"],
      ["ling", "Aponta figuras de um livro, junta pelo menos duas palavras e aponta duas partes do corpo"],
      ["cog", "Segura um objeto com uma mão enquanto mexe com a outra, tenta usar botões e brinca com mais de um brinquedo"],
      ["mov", "Chuta bola, corre, sobe alguns degraus e come com colher"],
      ["ling", "Usa gestos variados, como mandar beijo ou balançar a cabeça para dizer sim"],
    ],
    [
      ["Falar claro e completo", "Repita o que ele diz em frase completa: \"você quer mais banana?\"", "Linguagem"],
      ["Brinquedos de causa e efeito", "Botões que acendem ou tocam, jogos de encaixe e de apertar.", "Resolver problemas"],
      ["Arte livre", "Lápis de cor, tinta e giz. O resultado não importa, o processo sim.", "Criatividade e coordenação"],
      ["Revezar nas brincadeiras", "Ajude-o a esperar a vez e a usar palavras quando houver conflito.", "Convivência"],
    ],
    ["Sono: 11 a 14 horas por dia, com horário fixo. " + TELAS, "Deixe-o comer a quantidade que quiser: o seu papel é oferecer comida saudável."],
    {
      checkpoint: true,
      triagem: "Aos 2 anos o CDC inclui triagem de autismo nas orientações. Pergunte ao pediatra.",
    }
  ),
];

/** Mais ideias de estímulo para cada mês (somam às de cima). */
const EXTRA: Record<number, A[]> = {
  0: [
    ["Cartões de contraste", "Mostre desenhos simples em preto e branco, bem pertinho do rosto, por 1 ou 2 minutos, e veja se ele olha.", "Visão"],
    ["Massagem depois do banho", "Com as mãos mornas e um hidratante, faça movimentos lentos nos braços, pernas e barriguinha, falando baixinho.", "Vínculo e consciência do corpo"],
    ["Cantiga sempre igual", "Escolha uma música para antes de dormir e cante sempre a mesma.", "Rotina e acalmar"],
    ["Troca de fralda sem pressa", "Olhe nos olhos e conte cada passo: \"agora a perninha\".", "Fala e confiança"],
  ],
  1: [
    ["Chocalho de lado a lado", "Agite um chocalho suave de um lado e do outro, longe do rosto, e veja se ele vira a cabeça para o som.", "Audição"],
    ["Passeio no colo pela casa", "Mostre a janela, as plantas e os quadros e diga o nome de cada coisa.", "Olhar e vocabulário"],
    ["Perninhas livres", "Deixe-o alguns minutos sem fralda sobre uma manta, em lugar aquecido, para chutar à vontade.", "Movimento das pernas"],
    ["Música suave", "Toque música calma em volume baixo enquanto vocês ficam juntos.", "Audição e calma"],
  ],
  2: [
    ["Espelho no colo", "Segure-o diante de um espelho seguro para que veja o próprio rosto e o seu.", "Atenção ao rosto"],
    ["Cantiga com o rosto", "Cante tocando de leve no nariz, na boca e nas bochechas, dizendo o nome de cada parte.", "Corpo e linguagem"],
    ["Banho brincado", "Na água morna, converse e deixe que mexa as perninhas. Nunca o deixe sozinho.", "Sentidos e relaxamento"],
    ["Passeio de sons", "Ao ar livre, pare para escutar o passarinho, o vento e o carro, e comente baixinho.", "Audição"],
  ],
  3: [
    ["Chocalho nas mãos", "Coloque um chocalho leve na mão dele e ajude a balançar. Depois, deixe que tente.", "Segurar e coordenar"],
    ["Mãozinhas à mostra", "Toque nas mãos dele, aproxime do rosto e diga: \"são as suas mãozinhas\".", "Consciência do corpo"],
    ["Ginástica de bracinhos", "Mova braços e pernas devagar, cantando, abrindo e fechando.", "Flexibilidade"],
    ["Cantiga com gestos", "Guie as mãos dele em \"cabeça, ombro, joelho e pé\" ou outra música.", "Movimento e ritmo"],
  ],
  4: [
    ["Texturas diferentes", "Passe um pano macio, um pano áspero e um papel que faz barulho nas mãos e nos pés dele, observando as reações.", "Tato"],
    ["Livro de pano", "Deixe-o segurar, olhar e levar à boca um livro de pano limpo, enquanto você nomeia as figuras.", "Linguagem e exploração"],
    ["Mordedor limpo", "Ofereça um mordedor ou brinquedo limpo para ele levar à boca.", "Exploração com a boca"],
    ["Sentado no colo", "Segure-o sentadinho no colo olhando o ambiente e comente o que ele vê.", "Equilíbrio e atenção"],
  ],
  5: [
    ["Rolar com brinquedo", "Deitado de costas, coloque um brinquedo ao lado para ele se virar até pegar.", "Rolar"],
    ["Chocalho que chama", "Sacuda um chocalho em lados diferentes para ele procurar o som.", "Audição e atenção"],
    ["Água no banho", "Com um copinho, derrame água devagar nas mãos e nos pés dele.", "Tato"],
    ["Livro com figuras", "Mostre figuras de bichos e objetos, aponte e nomeie com voz animada.", "Vocabulário"],
  ],
  6: [
    ["Sentado com apoio", "Segure-o sentado e coloque um brinquedo perto dos pés para que ele se incline e alcance.", "Equilíbrio do tronco"],
    ["Livros de páginas grossas", "Aponte e nomeie rostos, carros e bichos, e deixe que ele toque.", "Linguagem"],
    ["Papel que faz barulho", "Sob supervisão, deixe-o mexer em papel que amassa, sem rasgar na boca.", "Sons e tato"],
    ["Cavalinho no joelho", "Balance-o suavemente nos joelhos, cantando uma cantiga com ritmo.", "Equilíbrio e alegria"],
  ],
  7: [
    ["Cavalinho e acabou", "Balance-o no joelho e pare de repente, esperando o sorriso e o pedido de \"mais\".", "Antecipar e pedir"],
    ["Chamar pelo nome", "Chame de lugares diferentes da sala e espere que ele se vire.", "Atenção ao nome"],
    ["Copinhos no banho", "Dê copinhos e jarrinhos para encher, virar e despejar.", "Coordenação e sentidos"],
    ["Passar o brinquedo", "Ofereça um brinquedo, peça de volta com \"me dá\" e devolva, agradecendo.", "Revezar"],
  ],
  8: [
    ["Cesta do tesouro", "Reúna objetos seguros de casa (colher de madeira, esponja, tampa de panela) numa cesta, para ele explorar sentado.", "Curiosidade e sentidos"],
    ["Sons de bichos", "Mostre figuras e imite os sons: \"au-au\", \"miau\".", "Imitação e fala"],
    ["Cadê o bebê?", "Cubra o rosto dele com um paninho leve e tire dizendo \"achou!\".", "Antecipar e se divertir"],
    ["Livro de bichos", "Leia sempre o mesmo livro e aponte cada figura.", "Linguagem e memória"],
  ],
  9: [
    ["Bateria de panelas", "Dê uma panela e uma colher de pau para fazer barulho.", "Causa e efeito, ritmo"],
    ["Engatinhar atrás da bola", "Role uma bola e incentive que vá atrás dela.", "Engatinhar"],
    ["Tchau para tudo", "Acene \"tchau\" para o vizinho, o carro e a lua, sempre com o gesto.", "Gestos e palavras"],
    ["Cadê o brinquedo?", "Esconda o brinquedo debaixo de um pano na frente dele e deixe que descubra.", "Pensar e memória"],
  ],
  10: [
    ["Bola rolando", "Role uma bola grande e chame para pegar e devolver.", "Movimento e revezar"],
    ["Dar e receber", "Peça \"me dá\", estenda a mão e agradeça quando ele entregar.", "Compreensão de pedidos"],
    ["Palminhas e cantigas", "Cante músicas com gestos como \"parabéns\" e \"pó-pó-pó\".", "Imitação"],
    ["Explorar o chão", "Espalhe brinquedos seguros para que escolha e engatinhe até eles.", "Engatinhar e escolher"],
  ],
  11: [
    ["Andando de lado", "Coloque um brinquedo no sofá do outro lado dele para andar apoiado até pegar.", "Equilíbrio e passos"],
    ["Cadê o sapato?", "Pergunte pelo nome de objetos que ele conhece e deixe que aponte ou olhe.", "Compreensão"],
    ["Dançar de mãos dadas", "Segure as mãos dele e dancem juntos ao som de uma música.", "Equilíbrio e alegria"],
    ["Imitar gestos", "Bata palmas, mande beijo, faça \"tchau\" e espere que ele copie.", "Imitação"],
  ],
  12: [
    ["Livro, uma frase por página", "Leia livros curtos apontando as figuras e dizendo uma frase por página.", "Linguagem"],
    ["Caçar bolhas", "Sopre bolhas de sabão para que ele corra, engatinhe ou tente pegar.", "Movimento e foco"],
    ["Caminhar de mãos dadas", "Ande pela casa de mãos dadas, devagar, comentando o que vê.", "Equilíbrio"],
    ["Mostrar e nomear", "Quando ele apontar algo, nomeie: \"sim, é um cachorro\".", "Vocabulário"],
  ],
  13: [
    ["Carrinho para empurrar", "Ofereça um carrinho firme de empurrar ou um carrinho de boneca para treinar a caminhada.", "Andar com firmeza"],
    ["Caixa surpresa", "Coloque brinquedos numa caixa e tire um a um, nomeando.", "Curiosidade e vocabulário"],
    ["Contar pela janela", "Mostre o que acontece lá fora e descreva: \"carro\", \"gato\", \"gente\".", "Vocabulário"],
    ["Rolar e pegar a bola", "Sentados no chão, rolem uma bola um para o outro.", "Coordenação e revezar"],
  ],
  14: [
    ["Giz de cera grosso", "Dê papel grande e giz de cera grosso para rabiscar à vontade.", "Coordenação fina"],
    ["Sons dos bichos", "Mostre figuras e pergunte: \"como faz a vaca?\".", "Fala e imitação"],
    ["Casinha de caixa", "Use uma caixa grande de papelão como casinha ou túnel.", "Imaginação e movimento"],
    ["Instrumentos simples", "Ofereça um tambor ou chocalho para tocar junto com músicas.", "Ritmo"],
  ],
  15: [
    ["Torre de 2 ou 3 blocos", "Empilhe e deixe que ele derrube e tente também.", "Coordenação"],
    ["Apontar no livro", "Pergunte: \"onde está a bola?\" e espere que ele aponte.", "Compreensão"],
    ["Faz de conta com bichinhos", "Faça o ursinho dormir, comer e tomar banho.", "Imaginação"],
    ["Jarras no banho", "Dê jarras e copos para despejar e encher.", "Sentidos e coordenação"],
  ],
  16: [
    ["Caminhada de descobertas", "Num passeio, junte folhas, pedrinhas e gravetos e converse sobre cada um.", "Curiosidade e vocabulário"],
    ["Cadê o brinquedo?", "Esconda um brinquedo debaixo de panos e peça que ele procure.", "Pensar e memória"],
    ["Cantar e dançar", "Cantem e dancem juntos, e ele escolhe a música.", "Ritmo e escolha"],
    ["Pintura com os dedos", "Com tinta atóxica e papel grande, deixe espalhar com as mãos.", "Criatividade e tato"],
  ],
  17: [
    ["Torre de 4 blocos", "Empilhem juntos e comemorem quando a torre cair.", "Coordenação"],
    ["Parquinho", "Escorregador e balanço com você por perto, para ele experimentar com segurança.", "Movimento e confiança"],
    ["Livros do dia a dia", "Livros com figuras de objetos conhecidos: copo, sapato, bola.", "Vocabulário"],
    ["Guardar brinquedos", "Cante uma música para guardar e peça que coloque os brinquedos na caixa.", "Rotina e cooperação"],
  ],
  18: [
    ["Estourar bolhas", "Sopre bolhas de sabão para ele tentar estourar.", "Movimento e foco"],
    ["Cozinhando", "Dê panelinhas e colheres para fazer comidinha de mentirinha.", "Faz de conta"],
    ["Telefone de brinquedo", "Finja conversas ao telefone, passando para ele falar.", "Fala e imaginação"],
    ["Encaixe grande", "Quebra-cabeça de peças grandes ou formas de encaixar, com ajuda.", "Resolver problemas"],
  ],
  19: [
    ["Subir e descer", "Monte uma pequena trilha de almofadas para subir e descer, com você ao lado.", "Equilíbrio e força"],
    ["Cantigas com gestos", "Escolha cantigas conhecidas e faça os gestos, convidando-o a repetir.", "Imitação e fala"],
    ["Livros com rima", "Leia livros com rimas e deixe que complete a última palavra.", "Linguagem"],
    ["Empurrar e puxar", "Ofereça carrinhos de empurrar e brinquedos de puxar com cordão.", "Coordenação"],
  ],
  20: [
    ["Dar comida à boneca", "Faça a boneca comer, tomar banho e dormir, e deixe que ele conduza.", "Faz de conta"],
    ["Pintar com pincel grosso", "Papel grande e tinta atóxica, com você por perto.", "Criatividade"],
    ["Falar as cores", "No dia a dia, diga a cor das coisas: \"o copo azul\".", "Vocabulário"],
    ["Pega-pega", "Corram devagar um atrás do outro rindo.", "Movimento e alegria"],
  ],
  21: [
    ["Torre de blocos", "Empilhem juntos e conte os blocos em voz alta.", "Coordenação e números"],
    ["Esconde-esconde", "Esconda-se perto e chame; ele vem procurar.", "Memória e movimento"],
    ["Estátua", "Dancem e, quando a música parar, fiquem parados como estátuas.", "Atenção e controle do corpo"],
    ["Histórias curtas", "Leia histórias com poucas frases e pergunte: \"o que ele está fazendo?\".", "Linguagem"],
  ],
  22: [
    ["Quebra-cabeça de poucas peças", "Quebra-cabeças com 3 ou 4 peças grandes, com ajuda quando pedir.", "Resolver problemas"],
    ["Caixa de fantasias", "Chapéus, lenços e roupas de adulto para brincar de ser outra pessoa.", "Imaginação"],
    ["Pular", "Pule junto com ele, de pés juntos, para fora de um tapete e de volta.", "Equilíbrio e coordenação"],
    ["Ajudar na cozinha", "Deixe-o lavar frutas ou mexer uma colher numa tigela, com você ao lado.", "Autonomia e participação"],
  ],
  23: [
    ["Parlendas e rimas", "Brinque com parlendas e cantigas tradicionais, com gestos.", "Linguagem e memória"],
    ["Hora do conto", "Escolha um livro antes de dormir e peça que escolha a história.", "Linguagem e vínculo"],
    ["Linhas e círculos", "Mostre como fazer uma linha reta e depois um círculo com giz ou lápis grosso.", "Coordenação fina"],
    ["Conversa do dia", "À noite, relembrem juntos o que fizeram: \"hoje fomos ao parque\".", "Memória e fala"],
  ],
  24: [
    ["Rimas e músicas", "Cante e repita músicas com ele, parando antes da última palavra para ele completar.", "Linguagem"],
    ["Faz de conta com personagens", "Brinque de médico, de casinha, de motorista.", "Imaginação"],
    ["Formas e encaixes", "Quebra-cabeças e formas simples para encaixar.", "Resolver problemas"],
    ["Correr e pular no parque", "Corram, chutem bola e pulem em espaço seguro.", "Movimento"],
  ],
};
for (const m of DEV_MONTHS) {
  for (const [titulo, como, treina] of EXTRA[m.month] ?? []) m.estimulos.push({ titulo, como, treina });
}

export const DEV_SOURCES: { nome: string; url: string }[] = [
  { nome: "CDC: Marcos do Desenvolvimento (português)", url: "https://www.cdc.gov/ncbddd/actearly/milestones/" },
  { nome: "Sociedade Brasileira de Pediatria: Cartilha de Desenvolvimento", url: "https://www.sbp.com.br/fileadmin/user_upload/_24327e-Cartilha_de_Desenvolvimento-2m-5anos_compressed.pdf" },
  { nome: "Manual MSD: marcos do desenvolvimento", url: "https://www.msdmanuals.com/pt/casa/multimedia/table/marcos-do-desenvolvimento-desde-o-nascimento-at%C3%A9-os-12-meses-de-idade" },
  { nome: "Pathways.org: tummy time mês a mês", url: "https://pathways.org/basics/how-tummy-time-looks-different-month-by-month" },
  { nome: "HSE (Irlanda): brincadeiras de 0 a 2 anos", url: "https://www.hse.ie/babies-children/play/" },
  { nome: "First 5 California: atividades do primeiro ano", url: "https://www.first5california.com/en-us/articles/babys-first-year-developmental-activities/" },
];

/** Meses completos de calendário desde o nascimento (data "YYYY-MM-DD") até `at`, ou null. */
export function completedMonths(birthDate: string, at: number): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return null;
  const b = new Date(`${birthDate}T00:00:00`);
  const t = new Date(at);
  if (!Number.isFinite(b.getTime()) || b.getTime() > at) return null;
  let months = (t.getFullYear() - b.getFullYear()) * 12 + (t.getMonth() - b.getMonth());
  if (t.getDate() < b.getDate()) months -= 1;
  return Math.max(0, months);
}

export const devMonthFor = (months: number): DevMonth =>
  DEV_MONTHS[Math.min(DEV_MONTHS.length - 1, Math.max(0, months))];
