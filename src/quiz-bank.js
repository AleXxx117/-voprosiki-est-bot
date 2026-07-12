import { randomInt } from "node:crypto";

export const quizItems = [
  {
    id: "p01", categoryKey: "psychology", answer: "эмпатия",
    question: "Как называется способность понимать чувства и переживания другого человека?",
    hints: ["Это качество помогает бережно общаться.", "Слово начинается на букву «Э»."],
    alternatives: []
  },
  {
    id: "p02", categoryKey: "psychology", answer: "внимание",
    question: "Как называется способность сосредоточиться на одном объекте или действии?",
    hints: ["Оно бывает устойчивым и рассеянным.", "Мы направляем его туда, что считаем важным."],
    alternatives: ["концентрация"]
  },
  {
    id: "p03", categoryKey: "psychology", answer: "память",
    question: "Какая способность помогает сохранять и воспроизводить прошлый опыт?",
    hints: ["Без неё трудно учиться.", "Она бывает кратковременной и долговременной."],
    alternatives: []
  },
  {
    id: "p04", categoryKey: "psychology", answer: "привычка",
    question: "Как называется действие, которое после повторений начинает выполняться почти автоматически?",
    hints: ["Она формируется постепенно.", "Полезный пример, чистить зубы каждый день."],
    alternatives: []
  },
  {
    id: "p05", categoryKey: "psychology", answer: "эмоция",
    question: "Как называется внутренняя реакция человека на значимое событие?",
    hints: ["Радость и грусть относятся к этому понятию.", "Она отражается в теле, мыслях и поведении."],
    alternatives: ["чувство"]
  },
  {
    id: "p06", categoryKey: "psychology", answer: "стресс",
    question: "Как называется состояние напряжения в ответ на трудную или непривычную ситуацию?",
    hints: ["Кратковременно оно может мобилизовать.", "Восстановление и отдых помогают снизить его уровень."],
    alternatives: []
  },
  {
    id: "p07", categoryKey: "psychology", answer: "мотивация",
    question: "Как называется внутреннее или внешнее побуждение к действию?",
    hints: ["Она помогает начать и продолжать дело.", "Цель часто усиливает её."],
    alternatives: []
  },
  {
    id: "p08", categoryKey: "psychology", answer: "рефлексия",
    question: "Как называется осмысление человеком собственных мыслей, чувств и поступков?",
    hints: ["Это наблюдение за своим внутренним опытом.", "Слово начинается на букву «Р»."],
    alternatives: ["самоанализ"]
  },
  {
    id: "p09", categoryKey: "psychology", answer: "самооценка",
    question: "Как называется представление человека о собственной ценности и качествах?",
    hints: ["Она может быть устойчивой или зависеть от чужого мнения.", "В слове есть часть «само»."],
    alternatives: []
  },
  {
    id: "p10", categoryKey: "psychology", answer: "границы",
    question: "Как одним словом называют личные пределы допустимого в общении?",
    hints: ["Они помогают различать своё и чужое.", "Их можно спокойно обозначать словами."],
    alternatives: ["личные границы"]
  },
  {
    id: "p11", categoryKey: "psychology", answer: "восприятие",
    question: "Как называется процесс, с помощью которого мозг создаёт целостный образ происходящего?",
    hints: ["На него влияют органы чувств и прошлый опыт.", "Два человека могут по-разному видеть одну ситуацию."],
    alternatives: []
  },
  {
    id: "p12", categoryKey: "psychology", answer: "адаптация",
    question: "Как называется постепенное приспособление к новым условиям?",
    hints: ["Она требует времени.", "Так происходит после переезда или смены работы."],
    alternatives: []
  },

  {
    id: "b01", categoryKey: "everyday", answer: "холодильник",
    question: "Какой бытовой прибор сохраняет продукты при низкой температуре?",
    hints: ["Обычно он стоит на кухне.", "Внутри него есть полки и морозильная камера."],
    alternatives: []
  },
  {
    id: "b02", categoryKey: "everyday", answer: "чайник",
    question: "Какой предмет используют, чтобы вскипятить воду для напитка?",
    hints: ["Он бывает электрическим и обычным.", "Часто нужен для чая или кофе."],
    alternatives: []
  },
  {
    id: "b03", categoryKey: "everyday", answer: "пылесос",
    question: "Какой прибор собирает пыль потоком воздуха?",
    hints: ["Он помогает очищать пол и ковры.", "У него часто есть шланг или щётка."],
    alternatives: []
  },
  {
    id: "b04", categoryKey: "everyday", answer: "утюг",
    question: "Какой прибор разглаживает складки на одежде с помощью нагрева?",
    hints: ["Его используют на гладильной доске.", "Некоторые модели выпускают пар."],
    alternatives: []
  },
  {
    id: "b05", categoryKey: "everyday", answer: "будильник",
    question: "Как называется устройство или функция, которая подаёт сигнал в заданное время?",
    hints: ["Часто помогает проснуться.", "Сейчас она обычно есть в телефоне."],
    alternatives: []
  },
  {
    id: "b06", categoryKey: "everyday", answer: "термос",
    question: "Какой сосуд долго сохраняет температуру напитка?",
    hints: ["Его удобно брать в дорогу.", "Он сохраняет и тепло, и холод."],
    alternatives: []
  },
  {
    id: "b07", categoryKey: "everyday", answer: "дуршлаг",
    question: "Как называется кухонная ёмкость с отверстиями для слива воды?",
    hints: ["Через неё часто сливают макароны.", "Она похожа на миску с множеством дырочек."],
    alternatives: []
  },
  {
    id: "b08", categoryKey: "everyday", answer: "полотенце",
    question: "Как называется тканевая вещь, которой вытирают руки или тело?",
    hints: ["Она хорошо впитывает воду.", "Её обычно держат в ванной или на кухне."],
    alternatives: []
  },
  {
    id: "b09", categoryKey: "everyday", answer: "подушка",
    question: "На какой мягкий предмет кладут голову во время сна?",
    hints: ["Она лежит на кровати.", "На неё надевают наволочку."],
    alternatives: []
  },
  {
    id: "b10", categoryKey: "everyday", answer: "кастрюля",
    question: "Как называется глубокая кухонная посуда для варки еды?",
    hints: ["У неё обычно есть ручки и крышка.", "В ней готовят суп."],
    alternatives: []
  },
  {
    id: "b11", categoryKey: "everyday", answer: "веник",
    question: "Какой простой предмет используют, чтобы подмести пол?",
    hints: ["Он работает без электричества.", "Его часто используют вместе с совком."],
    alternatives: ["метла"]
  },
  {
    id: "b12", categoryKey: "everyday", answer: "фонарик",
    question: "Как называется переносной источник света с батарейкой или аккумулятором?",
    hints: ["Он полезен при отключении электричества.", "Его можно держать в руке."],
    alternatives: []
  },

  {
    id: "r01", categoryKey: "relationships", answer: "доверие",
    question: "Как называется уверенность в надёжности и честности другого человека?",
    hints: ["Оно укрепляется последовательными поступками.", "Его трудно вернуть после обмана."],
    alternatives: []
  },
  {
    id: "r02", categoryKey: "relationships", answer: "компромисс",
    question: "Как называется решение, при котором обе стороны идут на взаимные уступки?",
    hints: ["Он помогает завершить спор.", "Это не всегда полная победа одной стороны."],
    alternatives: []
  },
  {
    id: "r03", categoryKey: "relationships", answer: "уважение",
    question: "Как называется признание достоинства, мнения и границ другого человека?",
    hints: ["Оно необходимо даже при несогласии.", "Без него близость становится небезопасной."],
    alternatives: []
  },
  {
    id: "r04", categoryKey: "relationships", answer: "диалог",
    question: "Как называется разговор, в котором собеседники обмениваются репликами?",
    hints: ["В нём важно не только говорить, но и слушать.", "Это слово противоположно монологу."],
    alternatives: []
  },
  {
    id: "r05", categoryKey: "relationships", answer: "поддержка",
    question: "Как называется помощь, которая даёт человеку ощущение, что он не один?",
    hints: ["Она бывает эмоциональной и практической.", "Иногда для неё достаточно внимательно выслушать."],
    alternatives: []
  },
  {
    id: "r06", categoryKey: "relationships", answer: "честность",
    question: "Как называется готовность говорить правду и не вводить другого в заблуждение?",
    hints: ["Она поддерживает доверие.", "Её можно сочетать с бережностью."],
    alternatives: []
  },
  {
    id: "r07", categoryKey: "relationships", answer: "дружба",
    question: "Как называются близкие отношения, основанные на взаимной симпатии и поддержке?",
    hints: ["Они не обязательно романтические.", "Друг является участником таких отношений."],
    alternatives: []
  },
  {
    id: "r08", categoryKey: "relationships", answer: "конфликт",
    question: "Как называется столкновение несовместимых интересов, целей или взглядов?",
    hints: ["Он не всегда разрушителен.", "Его можно решать через переговоры."],
    alternatives: ["спор"]
  },
  {
    id: "r09", categoryKey: "relationships", answer: "согласие",
    question: "Как называется добровольное подтверждение готовности принять предложение или действие?",
    hints: ["Оно должно быть свободным и ясным.", "Его можно отозвать."],
    alternatives: []
  },
  {
    id: "r10", categoryKey: "relationships", answer: "дистанция",
    question: "Как называется пространство, которое люди сохраняют между собой физически или эмоционально?",
    hints: ["Иногда она нужна для восстановления.", "Она может быть близкой или большой."],
    alternatives: []
  },
  {
    id: "r11", categoryKey: "relationships", answer: "взаимность",
    question: "Как называется обоюдность чувств, действий или отношения?",
    hints: ["В ней участвуют обе стороны.", "Это слово начинается с части «взаим»."],
    alternatives: []
  },
  {
    id: "r12", categoryKey: "relationships", answer: "сотрудничество",
    question: "Как называется совместная деятельность ради общей цели?",
    hints: ["Она требует согласования действий.", "Вместо соперничества люди работают вместе."],
    alternatives: ["кооперация"]
  },

  {
    id: "l01", categoryKey: "love", answer: "нежность",
    question: "Как называется мягкое и ласковое проявление любви?",
    hints: ["Она ощущается в интонации и прикосновениях.", "Это слово связано с бережностью."],
    alternatives: []
  },
  {
    id: "l02", categoryKey: "love", answer: "верность",
    question: "Как называется постоянство в чувствах и соблюдение договорённостей в паре?",
    hints: ["Она связана с надёжностью.", "Её противоположностью считают измену."],
    alternatives: []
  },
  {
    id: "l03", categoryKey: "love", answer: "объятие",
    question: "Как называется жест, когда люди обхватывают друг друга руками?",
    hints: ["Он может выражать тепло и поддержку.", "Это действие часто совершают при встрече."],
    alternatives: ["объятия"]
  },
  {
    id: "l04", categoryKey: "love", answer: "свидание",
    question: "Как называется заранее назначенная романтическая встреча?",
    hints: ["На него можно пойти в кино или парк.", "Обычно люди хотят лучше узнать друг друга."],
    alternatives: []
  },
  {
    id: "l05", categoryKey: "love", answer: "поцелуй",
    question: "Как называется прикосновение губами в знак любви, нежности или приветствия?",
    hints: ["Он бывает в щёку.", "Слово начинается на букву «П»."],
    alternatives: []
  },
  {
    id: "l06", categoryKey: "love", answer: "симпатия",
    question: "Как называется устойчивое положительное расположение к человеку?",
    hints: ["Она может появиться до влюблённости.", "Так называют чувство, когда кто-то нравится."],
    alternatives: []
  },
  {
    id: "l07", categoryKey: "love", answer: "романтика",
    question: "Как одним словом называют атмосферу нежности, красоты и влюблённости?",
    hints: ["Свечи и прогулка под звёздами часто создают её.", "Она помогает сделать обычный вечер особенным."],
    alternatives: []
  },
  {
    id: "l08", categoryKey: "love", answer: "признание",
    question: "Как называется открытое сообщение другому человеку о своих чувствах?",
    hints: ["Для него нужна смелость.", "Известная фраза начинается со слов «Я тебя»."],
    alternatives: ["признание в любви"]
  },
  {
    id: "l09", categoryKey: "love", answer: "разлука",
    question: "Как называется период, когда близкие люди вынуждены быть далеко друг от друга?",
    hints: ["Она может усиливать тоску.", "Её завершает встреча."],
    alternatives: []
  },
  {
    id: "l10", categoryKey: "love", answer: "забота",
    question: "Как называется внимательное действие ради благополучия любимого человека?",
    hints: ["Она проявляется в поступках.", "Иногда это чай, приготовленный после трудного дня."],
    alternatives: []
  },
  {
    id: "l11", categoryKey: "love", answer: "близость",
    question: "Как называется чувство глубокой эмоциональной соединённости и доверия между людьми?",
    hints: ["Для неё важна безопасность.", "Она бывает эмоциональной и физической."],
    alternatives: []
  },
  {
    id: "l12", categoryKey: "love", answer: "влюблённость",
    question: "Как называется яркое состояние сильного романтического увлечения человеком?",
    hints: ["В начале отношений оно часто переживается особенно интенсивно.", "В слове есть корень «люб»."],
    alternatives: []
  },

  {
    id: "n01", categoryKey: "nature", answer: "радуга",
    question: "Как называется цветная дуга, которая возникает из-за преломления света в каплях воды?",
    hints: ["Её часто видно после дождя.", "В ней принято различать семь цветов."],
    alternatives: []
  },
  {
    id: "n02", categoryKey: "nature", answer: "роса",
    question: "Как называются капли воды, которые утром появляются на траве?",
    hints: ["Они образуются при охлаждении воздуха у поверхности.", "Это короткое слово из трёх букв."],
    alternatives: []
  },
  {
    id: "n03", categoryKey: "nature", answer: "ветер",
    question: "Как называется движение воздуха относительно поверхности Земли?",
    hints: ["Он бывает слабым и ураганным.", "Его направление показывает флюгер."],
    alternatives: []
  },
  {
    id: "n04", categoryKey: "nature", answer: "молния",
    question: "Как называется мощный электрический разряд в атмосфере?",
    hints: ["Её видят во время грозы.", "После вспышки обычно слышен гром."],
    alternatives: []
  },
  {
    id: "n05", categoryKey: "nature", answer: "вулкан",
    question: "Как называется геологическое образование, из которого может извергаться лава?",
    hints: ["У него бывает кратер.", "Он может быть действующим или потухшим."],
    alternatives: []
  },
  {
    id: "n06", categoryKey: "nature", answer: "океан",
    question: "Как называется крупнейший водный объект, разделяющий материки?",
    hints: ["Он больше моря.", "Самый большой из них, Тихий."],
    alternatives: []
  },
  {
    id: "n07", categoryKey: "nature", answer: "облако",
    question: "Как называется видимое скопление капель воды или кристаллов льда в атмосфере?",
    hints: ["Оно движется по небу.", "Из него может пойти дождь."],
    alternatives: ["туча"]
  },
  {
    id: "n08", categoryKey: "nature", answer: "река",
    question: "Как называется естественный поток воды, который движется по руслу?",
    hints: ["У неё есть исток и устье.", "Она может впадать в море или другую реку."],
    alternatives: []
  },
  {
    id: "n09", categoryKey: "nature", answer: "лес",
    question: "Как называется большая территория, густо покрытая деревьями?",
    hints: ["Он бывает хвойным, лиственным и смешанным.", "В нём живут грибы, птицы и звери."],
    alternatives: []
  },
  {
    id: "n10", categoryKey: "nature", answer: "айсберг",
    question: "Как называется большая плавающая ледяная глыба, отколовшаяся от ледника?",
    hints: ["Большая её часть скрыта под водой.", "Она встречается в холодных морях."],
    alternatives: []
  },
  {
    id: "n11", categoryKey: "nature", answer: "водопад",
    question: "Как называется падение речной воды с высокого уступа?",
    hints: ["Он создаёт шум и водяную пыль.", "Известный пример, Ниагарский."],
    alternatives: []
  },
  {
    id: "n12", categoryKey: "nature", answer: "закат",
    question: "Как называется исчезновение Солнца за горизонтом вечером?",
    hints: ["Небо в это время часто становится золотым и красным.", "Он противоположен рассвету."],
    alternatives: []
  },

  {
    id: "s01", categoryKey: "spirituality", answer: "совесть",
    question: "Как называется внутреннее чувство нравственной ответственности за свои поступки?",
    hints: ["Она помогает различать добро и зло в собственных действиях.", "Говорят, что она может быть чистой."],
    alternatives: []
  },
  {
    id: "s02", categoryKey: "spirituality", answer: "надежда",
    question: "Как называется ожидание возможного доброго исхода даже в трудности?",
    hints: ["Она помогает не сдаваться.", "Её часто связывают с верой в лучшее."],
    alternatives: []
  },
  {
    id: "s03", categoryKey: "spirituality", answer: "благодарность",
    question: "Как называется признание ценности полученного добра или поддержки?",
    hints: ["Её выражают словом «спасибо».", "Она помогает замечать хорошее, не отрицая трудностей."],
    alternatives: []
  },
  {
    id: "s04", categoryKey: "spirituality", answer: "прощение",
    question: "Как называется внутреннее освобождение от желания постоянно мстить за обиду?",
    hints: ["Оно не обязывает снова сближаться.", "Это процесс, а не всегда одно решение."],
    alternatives: []
  },
  {
    id: "s05", categoryKey: "spirituality", answer: "сострадание",
    question: "Как называется сочувствие чужой боли вместе с желанием помочь?",
    hints: ["Это больше, чем просто жалость.", "В слове есть часть «страдание»."],
    alternatives: []
  },
  {
    id: "s06", categoryKey: "spirituality", answer: "смысл",
    question: "Как называется внутреннее значение, которое человек находит в жизни или поступке?",
    hints: ["Он отвечает на вопрос «ради чего». ", "Люди могут видеть его по-разному."],
    alternatives: []
  },
  {
    id: "s07", categoryKey: "spirituality", answer: "вера",
    question: "Как называется глубокое убеждение и доверие, не всегда основанное на прямом доказательстве?",
    hints: ["Она может быть религиозной или связанной с человеком и будущим.", "Короткое слово из четырёх букв."],
    alternatives: []
  },
  {
    id: "s08", categoryKey: "spirituality", answer: "тишина",
    question: "Как называется отсутствие громких звуков, в котором легче услышать себя?",
    hints: ["Её ищут во время созерцания.", "Она противоположна шуму."],
    alternatives: []
  },
  {
    id: "s09", categoryKey: "spirituality", answer: "гармония",
    question: "Как называется согласованность частей и ощущение внутреннего равновесия?",
    hints: ["Это слово используют и в музыке.", "Она связана с целостностью и балансом."],
    alternatives: ["баланс"]
  },
  {
    id: "s10", categoryKey: "spirituality", answer: "ценность",
    question: "Как называется принцип или качество, которое человек считает особенно важным?",
    hints: ["Она влияет на выборы и поступки.", "Любовь и честность могут быть её примерами."],
    alternatives: []
  },
  {
    id: "s11", categoryKey: "spirituality", answer: "смирение",
    question: "Как называется спокойное принятие ограниченности своего контроля без отказа от ответственности?",
    hints: ["Это не то же самое, что беспомощность.", "Оно помогает признать то, что нельзя изменить."],
    alternatives: ["принятие"]
  },
  {
    id: "s12", categoryKey: "spirituality", answer: "мудрость",
    question: "Как называется способность применять знания и опыт для взвешенных решений?",
    hints: ["Она не равна количеству выученных фактов.", "Её часто связывают со зрелостью."],
    alternatives: []
  }
];

const byId = new Map(quizItems.map((item) => [item.id, item]));

export function getQuizItem(id) {
  return byId.get(id) ?? null;
}

export function getQuizItems(categoryKey = "all") {
  return categoryKey === "all"
    ? quizItems
    : quizItems.filter((item) => item.categoryKey === categoryKey);
}

export function randomQuizItem(categoryKey = "all", excludedIds = []) {
  const available = getQuizItems(categoryKey);
  if (!available.length) {
    throw new Error(`Для категории ${categoryKey} нет игровых вопросов`);
  }

  const excluded = new Set(excludedIds);
  const fresh = available.filter((item) => !excluded.has(item.id));
  const pool = fresh.length ? fresh : available;
  return pool[randomInt(pool.length)];
}

export function normalizeAnswer(value) {
  return String(value)
    .toLowerCase()
    .replaceAll("ё", "е")
    .replace(/[^a-zа-яіїєґ0-9]+/gi, "")
    .trim();
}

function editDistance(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

export function isCorrectAnswer(item, candidate) {
  const normalizedCandidate = normalizeAnswer(candidate);
  if (!normalizedCandidate) {
    return false;
  }

  return [item.answer, ...(item.alternatives ?? [])].some((answer) => {
    const normalizedAnswer = normalizeAnswer(answer);
    if (normalizedCandidate === normalizedAnswer) {
      return true;
    }
    return normalizedAnswer.length >= 6
      && normalizedCandidate.length >= 6
      && editDistance(normalizedCandidate, normalizedAnswer) <= 1;
  });
}

export function maskAnswer(answer, revealedIndices = []) {
  const visible = new Set(revealedIndices);
  return [...answer]
    .map((character, index) => {
      if (!/[a-zа-яіїєґ0-9]/i.test(character)) {
        return character === " " ? "   " : character;
      }
      return visible.has(index) ? character.toUpperCase() : "＿";
    })
    .join(" ");
}

export function letterIndices(answer) {
  return [...answer]
    .map((character, index) => (/[a-zа-яіїєґ0-9]/i.test(character) ? index : null))
    .filter((index) => index !== null);
}
