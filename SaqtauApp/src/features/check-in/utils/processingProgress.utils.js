// Copy for the two honest progress phases: known upload bytes and server analysis.
const messages = {
  en: {
    complete: 'Your check-in is ready',
    analysisBody: 'Your video was uploaded. We are analyzing the signal now.',
    title: 'Check-in progress',
    upload: 'Uploading video',
    analyze: 'Analyzing signal',
    uploading: 'Uploading',
    analyzing: 'Processing',
    waiting: 'Waiting for the server',
    finished: 'Completed',
    pending: 'In progress',
    retrying: 'Waiting for connection',
    percent: 'Analysis progress',
    noEstimate: 'Time remaining is not yet available',
    notificationTitle: 'Get notified when it is ready',
    notificationBody: 'Enable iPhone notifications. You can leave the app while the analysis runs.',
    notificationButton: 'Enable notifications',
    notificationActive: 'Notifications enabled on this device',
    notificationDisabled: 'Notifications are disabled in iPhone Settings.',
    notificationSettings: 'Open Settings',
    notificationGuest: 'Sign in to receive notifications when the app is closed.',
    notificationGuestButton: 'Sign in',
    notificationUnavailable: 'A physical device and an iOS build are required for push notifications.',
    notificationProblem: 'Unable to enable push notifications. Try again.',
  },
  ru: {
    complete: 'Ваш результат готов',
    analysisBody: 'Видео загружено. Сейчас мы анализируем полученный сигнал.',
    title: 'Прогресс check-in',
    upload: 'Загрузка видео',
    analyze: 'Анализ сигнала',
    uploading: 'Загрузка',
    analyzing: 'Обработка',
    waiting: 'Ожидание сервера',
    finished: 'Завершено',
    pending: 'В процессе',
    retrying: 'Ожидание подключения',
    percent: 'Прогресс анализа',
    noEstimate: 'Время окончания пока неизвестно',
    notificationTitle: 'Узнайте, когда результат будет готов',
    notificationBody: 'Включите уведомления iPhone — можно выйти из приложения, пока идёт анализ.',
    notificationButton: 'Включить уведомления',
    notificationActive: 'Уведомления включены на этом устройстве',
    notificationDisabled: 'Уведомления отключены в настройках iPhone.',
    notificationSettings: 'Открыть настройки',
    notificationGuest: 'Войдите в аккаунт, чтобы получать уведомления при закрытом приложении.',
    notificationGuestButton: 'Войти',
    notificationUnavailable: 'Для push-уведомлений нужен настоящий телефон и сборка iOS.',
    notificationProblem: 'Не удалось включить push-уведомления. Попробуйте ещё раз.',
  },
  kk: {
    complete: 'Нәтижеңіз дайын',
    analysisBody: 'Бейне жүктелді. Қазір сигнал талданып жатыр.',
    title: 'Check-in барысы',
    upload: 'Бейнені жүктеу',
    analyze: 'Сигналды талдау',
    uploading: 'Жүктелуде',
    analyzing: 'Өңделуде',
    waiting: 'Сервер күтілуде',
    finished: 'Аяқталды',
    pending: 'Орындалып жатыр',
    retrying: 'Байланыс күтілуде',
    percent: 'Талдау барысы',
    noEstimate: 'Аяқталу уақыты әлі белгісіз',
    notificationTitle: 'Нәтиже дайын болғанда хабар алыңыз',
    notificationBody: 'iPhone хабарландыруларын қосыңыз — талдау жүріп жатқанда қолданбадан шығуға болады.',
    notificationButton: 'Хабарландыруларды қосу',
    notificationActive: 'Осы құрылғыда хабарландырулар қосылған',
    notificationDisabled: 'iPhone баптауларында хабарландыруларға тыйым салынған.',
    notificationSettings: 'Баптауларды ашу',
    notificationGuest: 'Қолданба жабылғанда хабар алу үшін аккаунтқа кіріңіз.',
    notificationGuestButton: 'Кіру',
    notificationUnavailable: 'Push-хабарландырулар үшін нақты телефон мен iOS нұсқасы қажет.',
    notificationProblem: 'Push-хабарландыруларды қосу мүмкін болмады. Қайталап көріңіз.',
  },
};

export function processingCopy(language) {
  const key = String(language || 'en').toLowerCase().split(/[-_]/)[0];
  return messages[key] || messages.en;
}

export function uploadPercent(value) {
  const ratio = Number(value);
  return Number.isFinite(ratio) ? Math.round(Math.max(0, Math.min(1, ratio)) * 100) : 0;
}

/**
 * Only show a numeric analysis percentage if the backend explicitly supplies one.
 * progress_percent fields are 0..100; processing_progress/analysis_progress are
 * ratios 0..1 (or percentages if over 1).
 */
export function processingPercent(measurement) {
  if (!measurement) return null;
  if (measurement.status === 'completed') return 100;
  const percentageCandidates = [
    measurement.processing_progress_percent,
    measurement.analysis_progress_percent,
    measurement.progress_percent,
    measurement.progress?.percent,
    measurement.analysis?.progress_percent,
  ];
  for (const value of percentageCandidates) {
    if (value === null || value === undefined || value === '') continue;
    const n = Number(value);
    if (Number.isFinite(n)) return Math.round(Math.min(100, Math.max(0, n)));
  }
  const ratioCandidates = [
    measurement.processing_progress,
    measurement.analysis_progress,
    measurement.progress?.ratio,
  ];
  for (const value of ratioCandidates) {
    if (value === null || value === undefined || value === '') continue;
    const n = Number(value);
    if (Number.isFinite(n)) return Math.round(Math.min(100, Math.max(0, n <= 1 ? n * 100 : n)));
  }
  return null;
}
