import { get } from '../api.js';
import { renderShell } from '../shell.js';
import { showSkeleton } from '../skeleton.js';
import { icon } from '../icons.js';

export const LANGUAGE_CATALOG = [
  'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Japanese', 'Korean', 'Chinese (Mandarin)',
  'Hindi', 'Arabic', 'Russian', 'Dutch', 'Turkish', 'Swedish', 'Polish', 'Greek', 'Hebrew', 'Indonesian',
  'Thai', 'Vietnamese', 'Bengali', 'Urdu', 'Punjabi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada',
  'Malayalam', 'Nepali', 'Sinhala', 'Persian (Farsi)', 'Ukrainian', 'Czech', 'Slovak', 'Hungarian', 'Romanian',
  'Bulgarian', 'Serbian', 'Croatian', 'Slovenian', 'Bosnian', 'Macedonian', 'Albanian', 'Lithuanian', 'Latvian',
  'Estonian', 'Finnish', 'Danish', 'Norwegian', 'Icelandic', 'Irish', 'Welsh', 'Scottish Gaelic', 'Basque',
  'Catalan', 'Galician', 'Malay', 'Filipino (Tagalog)', 'Swahili', 'Zulu', 'Xhosa', 'Afrikaans', 'Amharic',
  'Somali', 'Hausa', 'Yoruba', 'Igbo', 'Sesotho', 'Malagasy', 'Maori', 'Samoan', 'Hawaiian', 'Fijian',
  'Mongolian', 'Tibetan', 'Burmese', 'Khmer', 'Lao', 'Kazakh', 'Uzbek', 'Azerbaijani', 'Armenian', 'Georgian',
  'Pashto', 'Kurdish', 'Tajik', 'Turkmen', 'Kyrgyz', 'Luxembourgish', 'Maltese', 'Esperanto', 'Latin', 'Sanskrit',
  'Yiddish', 'Haitian Creole'
];

const LANGUAGE_FLAG_CODES = {
  English: 'GB', Spanish: 'ES', French: 'FR', German: 'DE', Italian: 'IT', Portuguese: 'PT', Japanese: 'JP',
  Korean: 'KR', 'Chinese (Mandarin)': 'CN', Hindi: 'IN', Arabic: 'SA', Russian: 'RU', Dutch: 'NL', Turkish: 'TR',
  Swedish: 'SE', Polish: 'PL', Greek: 'GR', Hebrew: 'IL', Indonesian: 'ID', Thai: 'TH', Vietnamese: 'VN',
  Bengali: 'BD', Urdu: 'PK', Punjabi: 'IN', Marathi: 'IN', Gujarati: 'IN', Tamil: 'IN', Telugu: 'IN', Kannada: 'IN',
  Malayalam: 'IN', Nepali: 'NP', Sinhala: 'LK', 'Persian (Farsi)': 'IR', Ukrainian: 'UA', Czech: 'CZ', Slovak: 'SK',
  Hungarian: 'HU', Romanian: 'RO', Bulgarian: 'BG', Serbian: 'RS', Croatian: 'HR', Slovenian: 'SI', Bosnian: 'BA',
  Macedonian: 'MK', Albanian: 'AL', Lithuanian: 'LT', Latvian: 'LV', Estonian: 'EE', Finnish: 'FI', Danish: 'DK',
  Norwegian: 'NO', Icelandic: 'IS', Irish: 'IE', Welsh: 'GB', 'Scottish Gaelic': 'GB', Basque: 'ES', Catalan: 'ES',
  Galician: 'ES', Malay: 'MY', 'Filipino (Tagalog)': 'PH', Swahili: 'KE', Zulu: 'ZA', Xhosa: 'ZA', Afrikaans: 'ZA',
  Amharic: 'ET', Somali: 'SO', Hausa: 'NG', Yoruba: 'NG', Igbo: 'NG', Sesotho: 'LS', Malagasy: 'MG', Maori: 'NZ',
  Samoan: 'WS', Hawaiian: 'US', Fijian: 'FJ', Mongolian: 'MN', Tibetan: 'CN', Burmese: 'MM', Khmer: 'KH', Lao: 'LA',
  Kazakh: 'KZ', Uzbek: 'UZ', Azerbaijani: 'AZ', Armenian: 'AM', Georgian: 'GE', Pashto: 'AF', Kurdish: 'IQ', Tajik: 'TJ',
  Turkmen: 'TM', Kyrgyz: 'KG', Luxembourgish: 'LU', Maltese: 'MT', Latin: 'VA', Sanskrit: 'IN', Yiddish: 'IL',
  'Haitian Creole': 'HT', Esperanto: ''
};

const CONTINENT_COUNTRY_CODES = {
  Asia: new Set(['AF', 'AM', 'AZ', 'BD', 'CN', 'GE', 'ID', 'IL', 'IN', 'IQ', 'IR', 'JP', 'KG', 'KH', 'KR', 'KZ', 'LA', 'LK', 'MM', 'MN', 'MY', 'NP', 'PH', 'PK', 'SA', 'TH', 'TM', 'TJ', 'TR', 'UZ', 'VN']),
  Africa: new Set(['ET', 'KE', 'LS', 'MG', 'NG', 'SO', 'ZA']),
  Europe: new Set(['AL', 'BA', 'BG', 'CZ', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LT', 'LU', 'LV', 'MK', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'RS', 'SE', 'SI', 'SK', 'VA', 'UA']),
  'North America': new Set(['HT', 'US']),
  Oceania: new Set(['FJ', 'NZ', 'WS'])
};
const CONTINENTS = Object.keys(CONTINENT_COUNTRY_CODES);

function continentForLanguage(language) {
  const countryCode = LANGUAGE_FLAG_CODES[language];
  return CONTINENTS.find(continent => CONTINENT_COUNTRY_CODES[continent].has(countryCode))
    || (language === 'Esperanto' ? 'Europe' : null);
}

const LANGUAGE_PHOTOS = {
  English: '/assets/lesson-photo-united-kingdom.jpg',
  Spanish: '/assets/lesson-photo-spain.jpg',
  French: '/assets/lesson-photo-france.jpg',
  German: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=600&q=80',
  Italian: 'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=600&q=80',
  Portuguese: '/assets/lesson-photo-portugal.jpg',
  Japanese: '/assets/lesson-photo-japan.jpg',
  Korean: 'https://images.unsplash.com/photo-1538485399081-7191377e8241?auto=format&fit=crop&w=600&q=80',
  'Chinese (Mandarin)': 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=600&q=80',
  Hindi: '/assets/lesson-photo-india.jpg',
  Arabic: '/assets/lesson-photo-middle-east.jpg',
  Russian: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=600&q=80',
  Dutch: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=600&q=80',
  Turkish: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=600&q=80',
  Swedish: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=600&q=80',
  Polish: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=600&q=80',
  Greek: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=600&q=80',
  Hebrew: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?auto=format&fit=crop&w=600&q=80',
  Indonesian: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=600&q=80',
  Thai: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=600&q=80',
  Vietnamese: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
  Bengali: '/assets/lesson-photo-bangladesh.jpg',
  Urdu: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&w=600&q=80',
  Punjabi: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=600&q=80',
  Marathi: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=600&q=80',
  Gujarati: 'https://images.unsplash.com/photo-1609137144827-e4cf5e28a520?auto=format&fit=crop&w=600&q=80',
  Tamil: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
  Telugu: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=600&q=80',
  Kannada: 'https://images.unsplash.com/photo-1600100397608-f010f4448553?auto=format&fit=crop&w=600&q=80',
  Malayalam: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80',
  Nepali: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
  Sinhala: 'https://images.unsplash.com/photo-1586861635167-e5223aadc9fe?auto=format&fit=crop&w=600&q=80',
  'Persian (Farsi)': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
  Ukrainian: 'https://images.unsplash.com/photo-1561542320-9a18cd340469?auto=format&fit=crop&w=600&q=80',
  Czech: 'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=600&q=80',
  Slovak: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
  Hungarian: 'https://images.unsplash.com/photo-1549877452-9c387954fbc2?auto=format&fit=crop&w=600&q=80',
  Romanian: 'https://images.unsplash.com/photo-1584646098378-0874589d76b1?auto=format&fit=crop&w=600&q=80',
  Bulgarian: '/assets/lesson-photo-bulgaria.jpg',
  Serbian: 'https://images.unsplash.com/photo-1596701062351-8c2c14d1fdd0?auto=format&fit=crop&w=600&q=80',
  Croatian: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80',
  Slovenian: 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=600&q=80',
  Bosnian: '/assets/lesson-photo-bosnia.jpg',
  Macedonian: 'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?auto=format&fit=crop&w=600&q=80',
  Albanian: '/assets/lesson-photo-albania.jpg',
  Lithuanian: 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=600&q=80',
  Latvian: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80',
  Estonian: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=600&q=80',
  Finnish: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=600&q=80',
  Danish: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=600&q=80',
  Norwegian: 'https://images.unsplash.com/photo-1507272931001-fc06c17e4f43?auto=format&fit=crop&w=600&q=80',
  Icelandic: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?auto=format&fit=crop&w=600&q=80',
  Irish: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&w=600&q=80',
  Welsh: 'https://images.unsplash.com/photo-1549880338-65ddcdfd017b?auto=format&fit=crop&w=600&q=80',
  'Scottish Gaelic': 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=600&q=80',
  Basque: '/assets/lesson-photo-basque.jpg',
  Catalan: '/assets/lesson-photo-catalonia.jpg',
  Galician: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=600&q=80',
  Malay: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=600&q=80',
  'Filipino (Tagalog)': 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=600&q=80',
  Swahili: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=600&q=80',
  Zulu: '/assets/lesson-photo-south-africa.jpg',
  Xhosa: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=600&q=80',
  Afrikaans: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=600&q=80',
  Amharic: '/assets/lesson-photo-ethiopia.jpg',
  Somali: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&w=600&q=80',
  Hausa: 'https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=600&q=80',
  Yoruba: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
  Igbo: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=600&q=80',
  Sesotho: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=600&q=80',
  Malagasy: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=600&q=80',
  Maori: '/assets/lesson-photo-new-zealand.jpg',
  Samoan: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  Hawaiian: '/assets/lesson-photo-hawaii.jpg',
  Fijian: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  Mongolian: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80',
  Tibetan: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=600&q=80',
  Burmese: '/assets/lesson-photo-myanmar.jpg',
  Khmer: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80',
  Lao: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
  Kazakh: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
  Uzbek: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=600&q=80',
  Azerbaijani: '/assets/lesson-photo-azerbaijan.jpg',
  Armenian: '/assets/lesson-photo-armenia.jpg',
  Georgian: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=600&q=80',
  Pashto: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  Kurdish: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=600&q=80',
  Tajik: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
  Turkmen: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=600&q=80',
  Kyrgyz: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80',
  Luxembourgish: 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?auto=format&fit=crop&w=600&q=80',
  Maltese: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80',
  Esperanto: '/assets/travel.jpg',
  Latin: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&w=600&q=80',
  Sanskrit: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=600&q=80',
  Yiddish: 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?auto=format&fit=crop&w=600&q=80',
  'Haitian Creole': '/assets/lesson-photo-caribbean.jpg'
};

const LESSON_SPECIFIC_PHOTOS = {
  // French Lessons
  'French::Greetings & Introductions': '/assets/lesson-photo-france.jpg',
  'French::Numbers & Shopping': 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?auto=format&fit=crop&w=600&q=80',
  'French::At the CafÃ©': 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=600&q=80',
  'French::Talking About the Past': 'https://images.unsplash.com/photo-1520939817895-060bdef4df1a?auto=format&fit=crop&w=600&q=80',

  // Japanese Lessons
  'Japanese::Greetings & Introductions': '/assets/lesson-photo-japan.jpg',
  'Japanese::Numbers & Counting': 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80',
  'Japanese::Ordering Food': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
  'Japanese::Talking About the Past': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80',

  // Spanish Lessons
  'Spanish::Greetings & Introductions': '/assets/lesson-photo-spain.jpg',
  'Spanish::Numbers & Everyday Counting': 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
  'Spanish::Ordering Food & Drink': 'https://images.unsplash.com/photo-1515443961218-a51367888e4b?auto=format&fit=crop&w=600&q=80',
  'Spanish::Talking About the Past': 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?auto=format&fit=crop&w=600&q=80',
  'Spanish::Making Plans & Invitations': 'https://images.unsplash.com/photo-1583200424564-94e803c404cf?auto=format&fit=crop&w=600&q=80'
};

const CONTINENT_LANGUAGES = {
  Asia: [
    'Chinese (Mandarin)', 'Japanese', 'Korean', 'Hindi', 'Bengali', 'Urdu', 'Punjabi', 'Marathi', 'Gujarati',
    'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Nepali', 'Sinhala', 'Arabic', 'Persian (Farsi)', 'Turkish',
    'Hebrew', 'Indonesian', 'Malay', 'Thai', 'Vietnamese', 'Khmer', 'Lao', 'Burmese', 'Mongolian', 'Tibetan',
    'Kazakh', 'Uzbek', 'Azerbaijani', 'Armenian', 'Georgian', 'Pashto', 'Kurdish', 'Tajik', 'Turkmen', 'Kyrgyz',
    'Sanskrit', 'Filipino (Tagalog)'
  ],
  Europe: [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Dutch', 'Swedish', 'Polish', 'Greek',
    'Russian', 'Ukrainian', 'Czech', 'Slovak', 'Hungarian', 'Romanian', 'Bulgarian', 'Serbian', 'Croatian',
    'Slovenian', 'Bosnian', 'Macedonian', 'Albanian', 'Lithuanian', 'Latvian', 'Estonian', 'Finnish', 'Danish',
    'Norwegian', 'Icelandic', 'Irish', 'Welsh', 'Scottish Gaelic', 'Basque', 'Catalan', 'Galician', 'Luxembourgish',
    'Maltese', 'Latin', 'Yiddish'
  ],
  Africa: ['Swahili', 'Zulu', 'Xhosa', 'Afrikaans', 'Amharic', 'Somali', 'Hausa', 'Yoruba', 'Igbo', 'Sesotho', 'Malagasy'],
  'North America': ['Haitian Creole', 'Hawaiian'],
  'South America': ['Spanish', 'Portuguese'],
  Oceania: ['Maori', 'Samoan', 'Fijian']
};

export async function renderLessons() {
  const view = renderShell('#/lessons', 'Lessons', 'Structured, level-tagged curriculum');
  showSkeleton(view, 'lessons');

  const lessons = await get('/lessons').catch(err => { view.innerHTML = `<div class="empty">${err.message}</div>`; throw err; });
  let searchQuery = '';
  let statusFilter = 'all';
  let continentFilter = 'all';
  const continentCounts = Object.fromEntries(CONTINENTS.map(continent => [
    continent,
    lessons.filter(lesson => continentForLanguage(lesson.language) === continent).length
  ]));

  view.innerHTML = `
    <div class="lesson-toolbar">
      <label class="lesson-search">
        ${icon('search', 18)}
        <input type="search" id="lessonSearch" placeholder="Search lessons or languages..." aria-label="Search lessons or languages">
      </label>
    </div>
    <div class="language-filters" role="tablist" aria-label="Lesson filters">
      <button type="button" class="active" data-status-filter="all" role="tab" aria-selected="true" aria-pressed="true">
        All <span class="filter-count">${lessons.length}</span>
      </button>
      <button type="button" data-status-filter="completed" role="tab" aria-selected="false" aria-pressed="false">
        Completed <span class="filter-count">${lessons.filter(lesson => lesson.completed).length}</span>
      </button>
      ${CONTINENTS.map(continent => `<button type="button" data-continent-filter="${continent}" role="tab" aria-selected="false" aria-pressed="false">
        ${continent} <span class="filter-count">${continentCounts[continent]}</span>
      </button>`).join('')}
    </div>
    <div class="grid lesson-grid" id="lessonResults" aria-live="polite"></div>`;

  function drawResults() {
    let filtered = lessons;

    if (statusFilter === 'completed') {
      filtered = filtered.filter(lesson => lesson.completed);
    }
    if (continentFilter !== 'all') {
      filtered = filtered.filter(lesson => continentForLanguage(lesson.language) === continentFilter);
    }

    const query = searchQuery.trim().toLocaleLowerCase();
    if (query) {
      filtered = filtered.filter(lesson => [lesson.title, lesson.language, lesson.level, lesson.description]
        .some(value => String(value || '').toLocaleLowerCase().includes(query)));
    }

    const statusLabel = statusFilter === 'completed' ? 'completed lessons' : 'lessons';
    const emptyMessage = query
      ? `No ${statusLabel} match "${escapeHtml(searchQuery.trim())}".`
      : statusFilter === 'completed'
        ? 'No completed lessons yet.'
        : continentFilter !== 'all'
          ? `No lessons for ${escapeHtml(continentFilter)} yet.`
          : 'No lessons yet.';

    view.querySelector('#lessonResults').innerHTML = filtered.length
      ? filtered.map(cardHtml).join('')
      : `<div class="empty empty-lessons" style="grid-column:1/-1">${emptyMessage}</div>`;
  }

  view.querySelectorAll('[data-status-filter]').forEach(button => {
    button.addEventListener('click', () => {
      statusFilter = button.dataset.statusFilter;
      view.querySelectorAll('[data-status-filter]').forEach(filterButton => {
        const isActive = filterButton.dataset.statusFilter === statusFilter;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-selected', String(isActive));
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      view.querySelectorAll('[data-continent-filter]').forEach(filterButton => {
        filterButton.classList.remove('active');
        filterButton.setAttribute('aria-selected', 'false');
        filterButton.setAttribute('aria-pressed', 'false');
      });
      continentFilter = 'all';
      drawResults();
    });
  });

  view.querySelectorAll('[data-continent-filter]').forEach(button => {
    button.addEventListener('click', () => {
      continentFilter = button.dataset.continentFilter;
      statusFilter = 'all';
      view.querySelectorAll('[data-status-filter]').forEach(filterButton => {
        const isActive = filterButton.dataset.statusFilter === 'all';
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-selected', String(isActive));
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      view.querySelectorAll('[data-continent-filter]').forEach(filterButton => {
        const isActive = filterButton.dataset.continentFilter === continentFilter;
        filterButton.classList.toggle('active', isActive);
        filterButton.setAttribute('aria-selected', String(isActive));
        filterButton.setAttribute('aria-pressed', String(isActive));
      });
      drawResults();
    });
  });

  view.querySelector('#lessonSearch').addEventListener('input', event => {
    searchQuery = event.currentTarget.value;
    drawResults();
  });

  drawResults();
}

function cardHtml(l) {
  const level = l.level || 'A1';
  const photoUrl = lessonPhoto(l);
  return `<a class="card lesson-card" href="#/lessons/${l._id}">
    <img class="lesson-card-image" src="${escapeHtml(photoUrl)}" alt="${escapeHtml(l.language)} - ${escapeHtml(l.title)}" loading="lazy" decoding="async" onerror="this.onerror=null; this.src='/assets/travel.jpg';">
    <div class="lesson-card-overlay" aria-hidden="true"></div>
    <div class="lesson-card-content">
      <div class="lesson-card-header">
        <div class="lesson-meta-left">
          <span class="lesson-flag" role="img" aria-label="${escapeHtml(flagLabel(l.language))}" title="${escapeHtml(flagLabel(l.language))}">
            ${flagForLanguage(l.language)}
          </span>
          <span class="lesson-level-badge">${escapeHtml(level)}</span>
          <span class="lesson-language-name">${escapeHtml(l.language)}</span>
        </div>
        ${l.completed ? `<span class="lesson-complete" aria-label="Completed" title="Completed">${icon('check', 16)}</span>` : ''}
      </div>
      <div class="lesson-card-body">
        <h3 class="lesson-title">${escapeHtml(l.title)}</h3>
        ${l.description ? `<p class="lesson-description">${escapeHtml(l.description)}</p>` : ''}
      </div>
      <div class="lesson-card-footer">
        <div class="lesson-reward">
          <span>+${Number(l.xpReward) || 0} XP</span>
        </div>
        <span class="lesson-action-arrow" aria-hidden="true">
          ${icon('chevronRight', 16)}
        </span>
      </div>
    </div>
  </a>`;
}

export function lessonPhoto(lesson) {
  if (!lesson) return '/assets/travel.jpg';
  const specificKey = `${lesson.language}::${lesson.title}`;
  if (LESSON_SPECIFIC_PHOTOS[specificKey]) {
    const p = LESSON_SPECIFIC_PHOTOS[specificKey];
    return p.startsWith('http') || p.startsWith('/') ? p : `/assets/${p}`;
  }
  const langPhoto = LANGUAGE_PHOTOS[lesson.language];
  if (langPhoto) {
    return langPhoto.startsWith('http') || langPhoto.startsWith('/') ? langPhoto : `/assets/${langPhoto}`;
  }
  return '/assets/travel.jpg';
}

function flagLabel(language) {
  if (language === 'Arabic') return 'Arabic-speaking regions';
  if (language === 'Basque' || language === 'Catalan') return `${language} regional flag`;
  return LANGUAGE_FLAG_CODES[language] ? `${language} flag` : `${language} region`;
}

export function flagForLanguage(language) {
  if (language === 'Basque') {
    return `<img class="lesson-flag-img" src="/assets/flag-basque.svg" alt="Basque flag" loading="lazy">`;
  }
  if (language === 'Catalan') {
    return `<img class="lesson-flag-img" src="/assets/flag-catalonia.svg" alt="Catalonia flag" loading="lazy">`;
  }
  const countryCode = LANGUAGE_FLAG_CODES[language];
  if (countryCode) {
    const codeLower = countryCode.toLowerCase();
    return `<img class="lesson-flag-img" src="https://flagcdn.com/w80/${codeLower}.png" alt="${escapeHtml(language)} flag" loading="lazy" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'lesson-flag-fallback\\'>${countryCode}</span>';">`;
  }
  return `<span class="lesson-flag-emblem">ðŸŒ</span>`;
}

function escapeHtml(v) { return String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }






