import { CHECK_IN_SECONDS } from './duration';

export function captureProgress(secondsLeft, duration = CHECK_IN_SECONDS) {
  const total = Number.isFinite(duration) && duration > 0 ? duration : CHECK_IN_SECONDS;
  const remaining = Number.isFinite(secondsLeft)
    ? Math.max(0, Math.min(total, secondsLeft))
    : total;
  const elapsed = total - remaining;
  return {
    elapsed,
    ratio: elapsed / total,
    stage: Math.min(3, Math.floor((elapsed / total) * 4)),
    finishing: remaining === 0,
  };
}

const messages = {
  ru: {
    progress: 'Прогресс записи',
    part: 'Этап',
    of: 'из',
    finishing: 'Завершаем запись…',
    finishingBody: 'Ещё немного. Продолжайте держать телефон неподвижно.',
    stages: [
      ['20 секунд для себя', 'Устройтесь удобно. Держите лицо в рамке.'],
      ['Четверть уже позади', 'Дышите как обычно. Сохраняйте привычный темп.'],
      ['Половина позади', 'Всё идёт своим чередом. Сохраняйте неподвижность.'],
      ['Осталось совсем немного', 'Продолжайте смотреть в камеру. Скоро закончим.'],
    ],
  },
  en: {
    progress: 'Recording progress',
    part: 'Part',
    of: 'of',
    finishing: 'Finishing the recording…',
    finishingBody: 'Just a moment. Keep holding your phone still.',
    stages: [
      ['20 seconds for yourself', 'Get comfortable. Keep your face inside the frame.'],
      ['A quarter of the way', 'Breathe as you normally do. Keep your usual rhythm.'],
      ['Halfway there', 'Take your time. Keep holding still.'],
      ['Almost there', 'Keep looking at the camera. We will finish soon.'],
    ],
  },
  kk: {
    progress: 'Жазу барысы',
    part: 'Кезең',
    of: '/',
    finishing: 'Жазу аяқталып жатыр…',
    finishingBody: 'Сәл күте тұрыңыз. Телефонды қозғалтпай ұстаңыз.',
    stages: [
      ['Өзіңізге арналған 20 секунд', 'Ыңғайлы отырыңыз. Бетіңізді жақтау ішінде ұстаңыз.'],
      ['Уақыттың төрттен бірі өтті', 'Әдеттегідей тыныс алыңыз. Тыныс алу ырғағын өзгертпеңіз.'],
      ['Уақыттың жартысы өтті', 'Асықпаңыз. Қозғалмай отыра беріңіз.'],
      ['Аз ғана уақыт қалды', 'Камераға қарап отырыңыз. Жақында аяқтаймыз.'],
    ],
  },
};

export function captureCopy(language) {
  const key = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  return messages[key] || messages.en;
}
