/**
 * Wedding T7: coded envelope opening + hero video (names at 5.5s, no loop) + scroll invitation.
 */
(function () {
  'use strict';

  var body = document.body;
  if (!body) return;

  var sessionOpening = document.getElementById('wed7-session-opening');
  var sessionInvite = document.getElementById('wed7-session-invite');
  var openingStage = document.getElementById('wed7-opening-stage');
  var envelope = document.getElementById('wed7-envelope');
  var flapWrap = document.getElementById('wed7-env-flap-wrap');
  var whiteWash = document.getElementById('wed7-opening-white-wash');
  var heroVideo = document.getElementById('wed7-hero-video');
  var invitePrepared = false;
  var namesRevealArmed = false;
  var openBtn = document.getElementById('wed7-open-btn');
  var waxText = document.getElementById('wed7-wax-text');
  var waxMonogram = document.getElementById('wed7-wax-monogram');
  var waxAmp = document.getElementById('wed7-wax-amp');
  var waxGroomInitial = document.getElementById('wed7-wax-groom-initial');
  var waxBrideInitial = document.getElementById('wed7-wax-bride-initial');
  var hero = document.getElementById('wed7-hero');
  var heroNames = document.getElementById('wed7-hero-names');
  var heroGroom = document.getElementById('wed7-hero-groom');
  var heroBride = document.getElementById('wed7-hero-bride');
  var heroIntroStarted = false;
  var heroVideoFinished = false;
  var heroPlaybackAllowed = false;
  var heroNamesRevealTimer = null;
  var HERO_NAMES_DELAY_MS = 5500;
  var HERO_FLY_SETTLE_MS = 1180;
  var TYPEWRITER_CHAR_MIN_MS = 22;
  var TYPEWRITER_CHAR_MAX_MS = 95;
  var audio = document.getElementById('wed7-music');
  var muteBtn = document.getElementById('wed7-mute-btn');
  var scrollPage = document.getElementById('wed7-scroll-page');
  var pointerTrail = document.getElementById('wed7-pointer-trail');
  var pointerTrailInit = false;
  var lastTrailAt = 0;
  var lastTrailX = 0;
  var lastTrailY = 0;
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var scrollRevealsInit = false;
  var scrollPhotoFxInit = false;
  var petalsStarted = false;
  var venueTabsBuilt = false;
  var openingStarted = false;
  var openingTransitioned = false;
  var countdownEls = {
    days: document.getElementById('wed7-countdown-days'),
    hours: document.getElementById('wed7-countdown-hours'),
    minutes: document.getElementById('wed7-countdown-minutes'),
    seconds: document.getElementById('wed7-countdown-seconds')
  };
  var OPEN_FLAP_MS = 6500;
  var OPEN_WHITE_MS = Math.round(OPEN_FLAP_MS * 0.5); /* full white at 50% — after lid ~half open */
  var musicStartTimer = null;
  /* Dev: skip envelope and unlock hero scroll. Keep false for shipping. */
  var DEV_SKIP_OPENING = false;
  var scratchInit = false;
  var coupleMergeInit = false;
  var timelineCloudsInit = false;
  var PETAL_COUNT = 8;
  var PETAL_SHADES = ['#f0e4e6', '#ebd8d9', '#e0c4c8', '#c98991', '#a66b72', '#d8c4ae', '#f5eceb', '#e5d6c8'];
  var heroScrollLocked = false;
  var scrollLockHandler = null;
  var scrollHintEl = null;
  var scrollHintDismissed = false;
  var heroScrollHintInit = false;
  function getAttr(name, fallback) {
    var val = body.getAttribute(name);
    if (val === null || val === '') return fallback;
    return val;
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setHtml(id, value) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = value;
  }

  function escapeNameHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function setDetailsName(id, name) {
    var stacked = body.classList.contains('wed7-details-name-2line');
    var value = (name || '').trim();
    if (stacked && value.indexOf(' ') !== -1) {
      var parts = value.split(/\s+/);
      var first = parts.shift();
      var rest = parts.join(' ');
      setHtml(
        id,
        '<span class="wed7-details-name-first">' + escapeNameHtml(first) + '</span>' +
        '<br><span class="wed7-details-name-rest">' + escapeNameHtml(rest) + '</span>'
      );
    } else {
      setText(id, value);
    }
  }

  function formatParentsName(value) {
    if (!value) return '';
    if (value.indexOf('|') === -1) return value;
    return value.split('|').map(function (line) {
      return line.trim();
    }).join('<br>');
  }

  function splitParentNameLines(value) {
    if (!value) return [];
    var parts;
    if (value.indexOf('|') !== -1) {
      parts = value.split('|');
    } else if (value.indexOf('&') !== -1) {
      parts = value.split('&');
    } else if (value.indexOf(' and ') !== -1) {
      parts = value.split(/\s+and\s+/i);
    } else {
      return [value.trim()].filter(Boolean);
    }
    return parts.map(function (line) {
      return line.trim();
    }).filter(Boolean);
  }

  function formatMergeParentsName(value) {
    var lines = splitParentNameLines(value);
    if (!lines.length) return '';
    if (lines.length === 1) return lines[0];
    return lines.join('<br><span class="wed7-parents-amp">&amp;</span><br>');
  }

  function abbreviateParentPrefix(prefix) {
    if (!prefix) return '';
    var value = prefix.trim().toLowerCase().replace(/\./g, '');
    if (value === 'son of' || value === 's/o') return 'S/o';
    if (value === 'daughter of' || value === 'd/o') return 'D/o';
    return prefix;
  }

  function formatDetailsParents(prefix, names) {
    var lines = splitParentNameLines(names);
    if (!lines.length) return '';

    var shortPrefix = abbreviateParentPrefix(prefix);
    var html = '';
    if (shortPrefix) {
      html += '<span class="wed7-details-parents-prefix">' + shortPrefix + '</span>';
    }
    html += lines.map(function (line) {
      return '<span class="wed7-details-parent-line">' + line + '</span>';
    }).join('');
    return html;
  }

  function formatLongDate(dateRaw, omitYear) {
    if (!dateRaw) return '';
    var eventDate = new Date(dateRaw + 'T00:00:00');
    if (isNaN(eventDate.getTime())) return '';
    var opts = {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    };
    if (!omitYear) opts.year = 'numeric';
    return eventDate.toLocaleDateString('en-GB', opts);
  }

  function getOrdinalSuffix(n) {
    var i = parseInt(n, 10);
    if (isNaN(i)) return '';
    var j = i % 10;
    var k = i % 100;
    if (j === 1 && k !== 11) return 'ST';
    if (j === 2 && k !== 12) return 'ND';
    if (j === 3 && k !== 13) return 'RD';
    return 'TH';
  }

  function formatDetailsTimeLabel(timeRaw) {
    if (!timeRaw) return '';
    var start = String(timeRaw).split(/\s*[-–—]\s*/)[0].trim();
    if (!start) return '';
    if (/^at\s+/i.test(start)) return start.toUpperCase();
    return 'AT ' + start.toUpperCase();
  }

  function formatHeroDateParts(dateRaw) {
    if (!dateRaw) return { main: '', year: '' };
    var eventDate = new Date(dateRaw + 'T00:00:00');
    if (isNaN(eventDate.getTime())) return { main: '', year: '' };
    return {
      main: eventDate.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      }),
      year: String(eventDate.getFullYear())
    };
  }

  function applyWaxSeal() {
    if (!waxMonogram) return;

    var mode = getAttr('data-wax-seal-mode', 'initials');
    var customText = getAttr('data-wax-seal-text', '');

    if (openBtn) openBtn.classList.remove('is-save-the-date', 'is-monogram');

    function showCustomCenter() {
      waxMonogram.classList.remove('is-initials-split');
      if (waxGroomInitial) {
        waxGroomInitial.textContent = '';
        waxGroomInitial.setAttribute('aria-hidden', 'true');
      }
      if (waxBrideInitial) {
        waxBrideInitial.textContent = '';
        waxBrideInitial.setAttribute('aria-hidden', 'true');
      }
      if (waxAmp) waxAmp.hidden = true;
      if (waxText) waxText.hidden = false;
    }

    if (mode === 'save-the-date') {
      if (openBtn) openBtn.classList.add('is-save-the-date');
      showCustomCenter();
      if (waxText) {
        waxText.innerHTML =
          '<span class="wed7-wax-line">Save</span>' +
          '<span class="wed7-wax-line wed7-wax-line-small">the</span>' +
          '<span class="wed7-wax-line">Date</span>';
      }
      return;
    }

    if (customText || mode === 'monogram') {
      if (openBtn) openBtn.classList.add('is-monogram');
      showCustomCenter();
      if (waxText) waxText.textContent = customText || getAttr('data-cover-monogram', '');
      return;
    }

    var groom = getAttr('data-groom-name', 'G');
    var bride = getAttr('data-bride-name', 'B');
    var groomInitial = getAttr('data-groom-initial', groom.charAt(0)).toUpperCase();
    var brideInitial = getAttr('data-bride-initial', bride.charAt(0)).toUpperCase();
    var brideFirst = getAttr('data-bride-first', '') === 'true';

    waxMonogram.classList.add('is-initials-split');
    if (waxText) {
      waxText.textContent = '';
      waxText.hidden = true;
    }
    if (waxAmp) waxAmp.hidden = false;

    if (waxGroomInitial) {
      waxGroomInitial.textContent = brideFirst ? brideInitial : groomInitial;
      waxGroomInitial.removeAttribute('aria-hidden');
    }
    if (waxBrideInitial) {
      waxBrideInitial.textContent = brideFirst ? groomInitial : brideInitial;
      waxBrideInitial.removeAttribute('aria-hidden');
    }
  }

  function applyBrideFirstOrder() {
    if (getAttr('data-bride-first', '') !== 'true') return;
    body.classList.add('wed7-bride-first');

    /* Stacked merge cards stay groom-on-top / bride-below — do not reorder. */

    var detailsCouple = document.querySelector('.wed7-details-couple');
    var detailsGroom = document.querySelector('.wed7-details-couple .wed7-details-person');
    var detailsPeople = document.querySelectorAll('.wed7-details-couple .wed7-details-person');
    var detailsDivider = document.querySelector('.wed7-details-couple .wed7-details-divider');
    if (detailsCouple && detailsPeople.length >= 2 && detailsDivider) {
      var detailsBride = detailsPeople[1];
      detailsCouple.insertBefore(detailsBride, detailsGroom);
      detailsCouple.insertBefore(detailsDivider, detailsGroom);
    }
  }

  function formatTimelineDate(dateRaw) {
    if (!dateRaw) return '';
    var d = new Date(dateRaw + 'T00:00:00');
    if (isNaN(d.getTime())) return dateRaw;
    var day = d.getDate();
    var month = d.toLocaleDateString('en-GB', { month: 'short' }).toUpperCase();
    return day + ' ' + month;
  }

  function buildTimeline() {
    var list = document.getElementById('wed7-timeline-list');
    if (!list) return;
    list.innerHTML = '';

    var eventIndex = 0;
    for (var i = 1; i <= 5; i++) {
      var title = getAttr('data-event-' + i + '-title', '');
      if (!title) continue;
      eventIndex += 1;
      var dateRaw = getAttr('data-event-' + i + '-date', '') || getAttr('data-event-date', '');
      var time = getAttr('data-event-' + i + '-time', '');
      var dateLabel = formatTimelineDate(dateRaw);
      var metaHtml = '';
      if (dateLabel) {
        metaHtml += '<span class="wed7-timeline-date">' + escapeNameHtml(dateLabel) + '</span>';
      }
      if (time) {
        metaHtml += '<span class="wed7-timeline-time">' + escapeNameHtml(time) + '</span>';
      }

      var side = eventIndex % 2 === 1 ? 'is-left' : 'is-right';
      var item = document.createElement('li');
      item.className = 'wed7-timeline-item ' + side;
      item.style.setProperty('--wed7-leaf-delay', (0.28 + (eventIndex - 1) * 0.38) + 's');
      item.innerHTML =
        '<div class="wed7-timeline-card">' +
          '<h3 class="wed7-timeline-title">' + escapeNameHtml(title) + '</h3>' +
          (metaHtml ? '<p class="wed7-timeline-meta">' + metaHtml + '</p>' : '') +
        '</div>' +
        '<span class="wed7-timeline-leaf" aria-hidden="true">' +
          '<span class="wed7-timeline-petiole"></span>' +
          '<span class="wed7-timeline-leaf-body">' +
            '<span class="wed7-timeline-leaf-blade"></span>' +
            '<span class="wed7-timeline-leaf-vein"></span>' +
          '</span>' +
        '</span>';
      list.appendChild(item);
    }

    var plant = document.getElementById('wed7-timeline-plant');
    if (plant) {
      plant.style.setProperty('--wed7-stem-duration', Math.max(1.7, 0.75 + eventIndex * 0.55) + 's');
    }
    prepareTimelineStem();

    if (!list.children.length) {
      var section = document.getElementById('wed7-timeline');
      if (section) section.hidden = true;
    }
  }

  function prepareTimelineStem() {
    var path = document.querySelector('#wed7-timeline .wed7-timeline-stem-path');
    if (!path || typeof path.getTotalLength !== 'function') return;
    var length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = String(length);
    path.setAttribute('data-stem-length', String(length));
  }

  function growTimelineStem() {
    var section = document.getElementById('wed7-timeline');
    if (section && section.dataset.stemGrown === 'true') return;
    var path = document.querySelector('#wed7-timeline .wed7-timeline-stem-path');
    if (!path) return;
    if (section) {
      section.dataset.stemGrown = 'true';
      /* Keep leaves/cards/tip in sync with stem — not the earlier section reveal. */
      section.classList.add('is-plant-grown');
    }
    prepareTimelineStem();
    void path.getBoundingClientRect();
    requestAnimationFrame(function () {
      path.style.strokeDashoffset = '0';
    });
  }

  function initTimelineClouds() {
    var section = document.getElementById('wed7-timeline');
    if (!section || !scrollPage) return;

    var lastP = -1;
    var ticking = false;
    var reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function applyProgress(p) {
      p = clamp(p, 0, 1);
      if (Math.abs(p - lastP) < 0.002) return;
      lastP = p;
      section.style.setProperty('--wed7-cloud-p', String(p));
      section.classList.toggle('is-clouds-parting', p > 0.02 && p < 0.98);
      section.classList.toggle('is-clouds-open', p >= 0.98);
      if (p >= 0.55) growTimelineStem();
    }

    function updateFromScroll() {
      ticking = false;
      if (!scrollPage) return;

      if (reducedMotion) {
        applyProgress(1);
        return;
      }

      var rootRect = scrollPage.getBoundingClientRect();
      var sectionRect = section.getBoundingClientRect();
      var vh = rootRect.height || 1;
      var h = sectionRect.height || 1;
      var top = sectionRect.top - rootRect.top;

      /*
       * Start parting only once most of the section is on screen (~72% entered),
       * finish when the section is centered — keeps clouds covering longer.
       */
      var startTop = vh - h * 0.72;
      var endTop = vh * 0.5 - h * 0.5;
      var range = Math.max(1, startTop - endTop);
      applyProgress((startTop - top) / range);
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateFromScroll);
    }

    scrollPage.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function applyClientPhotoPath(el, path) {
    if (!el || !path) return;
    el.removeAttribute('data-token');
    el.removeAttribute('src');
    el.setAttribute('data-storage-path', path);
  }

  function hydrateCouplePhoto() {
    var couplePath = getAttr('data-couple-photo', '');
    var photoEl = document.getElementById('wed7-together-photo');
    applyClientPhotoPath(photoEl, couplePath);

    var groomPath = getAttr('data-groom-photo', '');
    var bridePath = getAttr('data-bride-photo', '');
    var personPhotos = document.querySelectorAll('.wed7-person-photo');
    if (personPhotos[0]) applyClientPhotoPath(personPhotos[0], groomPath);
    if (personPhotos[1]) applyClientPhotoPath(personPhotos[1], bridePath);
  }

  function hydrate() {
    var groomName = getAttr('data-groom-name', '');
    var brideName = getAttr('data-bride-name', '');
    var groomDisplay = getAttr('data-groom-display-name', groomName);
    var brideDisplay = getAttr('data-bride-display-name', brideName);
    var sharedParentPrefix = getAttr('data-parent-prefix', '');
    var sharedParentsName = getAttr('data-parents-name', '');

    setText('wed7-hero-groom', groomDisplay);
    setText('wed7-hero-bride', brideDisplay);
    if (heroGroom) heroGroom.setAttribute('data-full-text', groomDisplay);
    if (heroBride) heroBride.setAttribute('data-full-text', brideDisplay);

    var groomInitial = getAttr('data-groom-initial', groomName.charAt(0)).toUpperCase();
    var brideInitial = getAttr('data-bride-initial', brideName.charAt(0)).toUpperCase();
    var brideFirst = getAttr('data-bride-first', '') === 'true';
    setText('wed7-quote-text', getAttr('data-quote', ''));
    var togetherQuote = body.getAttribute('data-together-quote');
    if (togetherQuote !== null && togetherQuote.trim() !== '') {
      setText('wed7-together-quote', togetherQuote.trim());
    }
    setText(
      'wed7-details-invocation',
      getAttr('data-invitation-invocation', 'In the name of God')
    );
    setText('wed7-invitation-message', getAttr('data-invitation-message', ''));
    setText('wed7-welcome-text', getAttr('data-welcome-message', ''));

    var detailsDateRaw =
      getAttr('data-primary-date', '') ||
      getAttr('data-event-1-date', '') ||
      getAttr('data-event-date', '');
    var detailsTime =
      getAttr('data-event-1-time', '') ||
      getAttr('data-event-time', '');
    var detailsDateObj = detailsDateRaw ? new Date(detailsDateRaw + 'T00:00:00') : null;
    var detailsDatetime = document.getElementById('wed7-details-datetime');
    if (detailsDateObj && !isNaN(detailsDateObj.getTime())) {
      var dayNum = detailsDateObj.getDate();
      setText(
        'wed7-details-weekday',
        detailsDateObj.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
      );
      setText('wed7-details-day-num', String(dayNum));
      setText('wed7-details-day-ord', getOrdinalSuffix(dayNum));
      setText(
        'wed7-details-month',
        detailsDateObj.toLocaleDateString('en-GB', { month: 'long' }).toUpperCase()
      );
      setText('wed7-details-year', String(detailsDateObj.getFullYear()));
      setText('wed7-details-time', formatDetailsTimeLabel(detailsTime));
      if (detailsDatetime) detailsDatetime.classList.remove('is-hidden');
    } else {
      setText('wed7-details-weekday', '');
      setText('wed7-details-day-num', '');
      setText('wed7-details-day-ord', '');
      setText('wed7-details-month', '');
      setText('wed7-details-year', '');
      setText('wed7-details-time', '');
      if (detailsDatetime) detailsDatetime.classList.add('is-hidden');
    }
    setText(
      'wed7-details-venue',
      getAttr('data-venue-1-address', '') || getAttr('data-event-address', '')
    );
    setText(
      'wed7-closing-names',
      brideFirst ? brideDisplay + ' & ' + groomDisplay : groomDisplay + ' & ' + brideDisplay
    );
    var blessingsFrom = getAttr('data-blessings-from', '');
    setHtml('wed7-blessings-names', formatParentsName(blessingsFrom));
    var blessingsEl = document.getElementById('wed7-blessings');
    if (blessingsEl) blessingsEl.hidden = !blessingsFrom;

    setText('wed7-groom-name', groomName);
    setText('wed7-groom-prefix', getAttr('data-groom-parent-prefix', sharedParentPrefix));
    setHtml(
      'wed7-groom-parents',
      formatMergeParentsName(getAttr('data-groom-parents-name', sharedParentsName))
    );
    var groomPlace = getAttr('data-groom-place', '');
    setText('wed7-groom-place', groomPlace ? groomPlace : '');

    setText('wed7-bride-name', brideName);
    setText('wed7-bride-prefix', getAttr('data-bride-parent-prefix', sharedParentPrefix));
    setHtml(
      'wed7-bride-parents',
      formatMergeParentsName(getAttr('data-bride-parents-name', sharedParentsName))
    );
    var bridePlace = getAttr('data-bride-place', '');
    setText('wed7-bride-place', bridePlace ? bridePlace : '');

    setDetailsName('wed7-details-groom-name', groomName);
    setHtml(
      'wed7-details-groom-parents',
      formatDetailsParents(
        getAttr('data-groom-parent-prefix', sharedParentPrefix),
        getAttr('data-groom-parents-name', sharedParentsName)
      )
    );
    setDetailsName('wed7-details-bride-name', brideName);
    setHtml(
      'wed7-details-bride-parents',
      formatDetailsParents(
        getAttr('data-bride-parent-prefix', sharedParentPrefix),
        getAttr('data-bride-parents-name', sharedParentsName)
      )
    );

    hydrateScratchSection();
    buildTimeline();
    hydrateCouplePhoto();
    applyWaxSeal();
    applyBrideFirstOrder();
    hydrateContact();
    hydrateRsvpThanks();
    hydrateCountdown();
  }

  function getScratchDateRaw() {
    return (
      getAttr('data-scratch-date', '') ||
      getAttr('data-event-1-date', '') ||
      getAttr('data-event-date', '')
    );
  }

  function hydrateScratchSection() {
    var dateRaw = getScratchDateRaw();
    var eventDate = new Date(dateRaw + 'T00:00:00');
    if (isNaN(eventDate.getTime())) {
      setText('wed7-scratch-month', '');
      setText('wed7-scratch-day', '');
      setText('wed7-scratch-year', '');
      setText('wed7-scratch-time', '');
      return;
    }

    setText(
      'wed7-scratch-month',
      eventDate.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase()
    );
    setText(
      'wed7-scratch-day',
      eventDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
    );
    setText('wed7-scratch-year', String(eventDate.getFullYear()));

    var timeOverride = getAttr('data-scratch-time', '');
    var eventTime =
      timeOverride ||
      getAttr('data-event-1-time', '') ||
      getAttr('data-event-time', '');
    setText('wed7-scratch-time', (eventTime || '').replace(' - ', ' — '));
  }

  function initCoupleMerge() {
    var section = document.getElementById('wed7-couple-intro');
    var track = document.getElementById('wed7-merge-track');
    var sticky = section ? section.querySelector('.wed7-merge-sticky') : null;
    var stage = document.getElementById('wed7-merge-stage');
    var runway = document.getElementById('wed7-merge-runway');
    var united = document.getElementById('wed7-merge-united');
    if (!section || !track || !sticky || !scrollPage || !section.classList.contains('wed7-merge')) {
      return;
    }

    var lastP = -1;
    var ticking = false;
    var stageSettled = false;
    var stageLocked = false;
    var settledHeight = 0;
    var mergeHint = section.querySelector('.wed7-merge-hint');

    /* Freeze section-level décor parallax; only cards/hint follow scroll progress. */
    section.style.setProperty('--wed7-merge-p', '0');
    section.style.setProperty('--wed7-merge-view', '0');

    function clamp(n, min, max) {
      return Math.max(min, Math.min(max, n));
    }

    function settleStage() {
      if (stageSettled || !stage) return;
      settledHeight = stage.offsetHeight;
      if (!settledHeight) return;
      stageSettled = true;
      stage.style.height = settledHeight + 'px';
      stage.style.minHeight = settledHeight + 'px';
    }

    function releaseStage() {
      if (!stageSettled || stageLocked || !stage) return;
      stageSettled = false;
      settledHeight = 0;
      stage.style.height = '';
      stage.style.minHeight = '';
    }

    function applyProgress(p) {
      p = clamp(p, 0, 1);
      /*
       * Freeze stage height while merging. Use hysteresis so scrolling around
       * the 0.45 threshold does not thrash layout (which staggers the page and
       * can make nearby reveal sections appear to vanish).
       */
      if (p >= 0.45) {
        settleStage();
        if (p >= 0.98) stageLocked = true;
      } else if (p < 0.1) {
        releaseStage();
      }

      if (Math.abs(p - lastP) < 0.008) return;
      lastP = p;
      var pStr = p.toFixed(3);
      if (stage) stage.style.setProperty('--wed7-merge-p', pStr);
      if (mergeHint) mergeHint.style.setProperty('--wed7-merge-p', pStr);

      var done = p >= 0.98;
      section.classList.toggle('is-merging', p > 0.01 && !done);
      section.classList.toggle('is-united', done);
      if (united) united.setAttribute('aria-hidden', p > 0.55 ? 'false' : 'true');
    }

    function updateFromScroll() {
      ticking = false;
      if (!scrollPage) return;

      var rootRect = scrollPage.getBoundingClientRect();
      var trackRect = track.getBoundingClientRect();
      var near =
        trackRect.bottom > rootRect.top - 80 &&
        trackRect.top < rootRect.bottom + 80;

      /* Skip expensive CSS var updates when the merge block is far off-screen. */
      if (!near) {
        if (trackRect.bottom < rootRect.top && lastP < 1) applyProgress(1);
        else if (trackRect.top > rootRect.bottom && lastP > 0) applyProgress(0);
        return;
      }

      var range = Math.max(
        1,
        (runway && runway.offsetHeight) || track.offsetHeight - sticky.offsetHeight
      );
      var raw = rootRect.top - trackRect.top;
      applyProgress(raw / range);
      /* Keep --wed7-merge-view static — per-frame décor parallax caused scroll shake. */
    }

    function requestUpdate() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateFromScroll);
    }

    scrollPage.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
  }

  function initScratchCard() {
    var scratchCanvas = document.getElementById('wed7-scratch-canvas');
    var scratchCard = document.getElementById('wed7-scratch-card');
    var scratchPanel = document.getElementById('wed7-scratch-panel');
    var scratchSection = document.getElementById('wed7-scratch-section');
    var scratchBurst = document.getElementById('wed7-scratch-burst');
    if (!scratchCanvas || !scratchCard) return;

    if (scratchBurst && scratchBurst.parentNode !== document.body) {
      document.body.appendChild(scratchBurst);
    }

    if (body.getAttribute('data-scratch-revealed') === 'true') {
      scratchCard.classList.add('is-revealed');
      scratchCard.style.touchAction = 'auto';
      scratchCanvas.style.touchAction = 'auto';
      scratchCanvas.style.pointerEvents = 'none';
      if (scratchSection) {
        scratchSection.classList.add('is-revealed-static');
      }
      return;
    }

    var ctx = scratchCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      scratchCard.classList.add('is-revealed');
      return;
    }

    var isDrawing = false;
    var revealed = false;
    var brushRadius = 24;
    var boardMask = document.getElementById('wed7-scratch-board');
    var initialAlpha = null;
    var pixelReadOk = true;
    var scratchedStrokeArea = 0;
    var foilAreaEstimate = 0;

    function captureInitialAlpha() {
      var w = scratchCanvas.width;
      var h = scratchCanvas.height;
      if (!w || !h) return;
      try {
        var imageData = ctx.getImageData(0, 0, w, h);
        var pixels = imageData.data;
        initialAlpha = new Uint8Array(w * h);
        var opaque = 0;
        for (var p = 0, i = 3; i < pixels.length; i += 4, p++) {
          initialAlpha[p] = pixels[i];
          if (pixels[i] > 24) opaque++;
        }
        foilAreaEstimate = opaque;
        pixelReadOk = true;
      } catch (err) {
        /* Cross-origin board art without CORS taints the canvas. */
        initialAlpha = null;
        pixelReadOk = false;
        foilAreaEstimate = Math.max(1, Math.round(w * h * 0.42));
      }
    }

    function ensureBoardCors() {
      /* Intentionally no-op: Firebase Storage often lacks CORS for canvas reads.
         Scratch progress uses a stroke-area fallback when getImageData is blocked. */
    }

    function boardMaskReady() {
      return !!(
        boardMask &&
        boardMask.complete &&
        boardMask.naturalWidth > 0 &&
        boardMask.currentSrc
      );
    }

    function drawScratchFoil(width, height) {
      if (revealed) return;
      var dpr = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, scratchCanvas.width, scratchCanvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';

      var gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f3e6e8');
      gradient.addColorStop(0.28, '#e2c4b0');
      gradient.addColorStop(0.58, '#d4a0a8');
      gradient.addColorStop(1, '#b0767f');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = 'rgba(255, 250, 247, 0.34)';
      for (var i = 0; i < 110; i++) {
        ctx.fillRect(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 3 + 1,
          Math.random() * 3 + 1
        );
      }

      ctx.fillStyle = 'rgba(138, 79, 88, 0.12)';
      for (var j = 0; j < 50; j++) {
        ctx.fillRect(
          Math.random() * width,
          Math.random() * height,
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.5
        );
      }

      ctx.font = '600 14px Nunito, sans-serif';
      ctx.fillStyle = 'rgba(74, 58, 60, 0.78)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Scratch here', width / 2, height / 2);

      /*
       * Only clip once the board bitmap is actually ready. destination-in with an
       * unloaded/empty image clears the foil and makes the date look pre-revealed.
       */
      if (boardMaskReady()) {
        var fit = getContainRect(
          boardMask.naturalWidth,
          boardMask.naturalHeight,
          width,
          height
        );
        ctx.globalCompositeOperation = 'destination-in';
        try {
          ctx.drawImage(boardMask, fit.x, fit.y, fit.w, fit.h);
        } catch (err) {
          /* Keep unclipped foil if drawImage fails. */
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      scratchedStrokeArea = 0;
      captureInitialAlpha();

      /* If clipping wiped the foil, redraw without the mask so it stays scratchable. */
      if (pixelReadOk && foilAreaEstimate < Math.max(24, Math.round(width * height * dpr * dpr * 0.02))) {
        initialAlpha = null;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        scratchedStrokeArea = 0;
        captureInitialAlpha();
      }
    }

    function getContainRect(srcW, srcH, boxW, boxH) {
      if (!srcW || !srcH || !boxW || !boxH) {
        return { x: 0, y: 0, w: boxW, h: boxH };
      }
      var scale = Math.min(boxW / srcW, boxH / srcH);
      var w = srcW * scale;
      var h = srcH * scale;
      return {
        x: (boxW - w) / 2,
        y: (boxH - h) / 2,
        w: w,
        h: h
      };
    }

    function resizeCanvas() {
      if (revealed) return;
      var measureEl = scratchPanel || scratchCard;
      var rect = measureEl.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      var dpr = window.devicePixelRatio || 1;
      scratchCanvas.width = Math.max(1, Math.round(rect.width * dpr));
      scratchCanvas.height = Math.max(1, Math.round(rect.height * dpr));
      scratchCanvas.style.width = rect.width + 'px';
      scratchCanvas.style.height = rect.height + 'px';
      drawScratchFoil(rect.width, rect.height);
    }

    function getPos(e) {
      var rect = scratchCanvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return { x: 0, y: 0 };
      var clientX = e.touches ? e.touches[0].clientX : e.clientX;
      var clientY = e.touches ? e.touches[0].clientY : e.clientY;
      /* Map CSS pointer coords into the canvas bitmap pixel space. */
      var scaleX = scratchCanvas.width / rect.width;
      var scaleY = scratchCanvas.height / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    }

    function scratchAt(x, y) {
      var dpr = window.devicePixelRatio || 1;
      var radius = brushRadius * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      /* Always track stroke coverage so reveal still works if the canvas becomes tainted mid-scratch. */
      scratchedStrokeArea += Math.PI * radius * radius * 0.22;
    }

    function getClearedPercent() {
      var w = scratchCanvas.width;
      var h = scratchCanvas.height;
      if (!w || !h) return 0;
      /* Never auto-reveal before the guest has scratched. */
      if (scratchedStrokeArea <= 0) return 0;

      if (!pixelReadOk || !initialAlpha) {
        return Math.min(1, scratchedStrokeArea / Math.max(1, foilAreaEstimate));
      }

      try {
        var imageData = ctx.getImageData(0, 0, w, h);
        var pixels = imageData.data;
        var opaque = 0;
        var cleared = 0;
        var step = 8;

        for (var p = 0, i = 3; i < pixels.length; i += 4 * step, p += step) {
          if (initialAlpha[p] > 24) {
            opaque++;
            if (pixels[i] < 12) cleared++;
          }
        }

        return opaque ? cleared / opaque : 0;
      } catch (err) {
        pixelReadOk = false;
        if (!foilAreaEstimate) foilAreaEstimate = Math.max(1, Math.round(w * h * 0.42));
        return Math.min(1, scratchedStrokeArea / Math.max(1, foilAreaEstimate));
      }
    }

    function launchScratchPoppers() {
      if (!scratchBurst) return;
      if (scratchBurst.parentNode !== document.body) {
        document.body.appendChild(scratchBurst);
      }
      scratchBurst.classList.add('is-active');
      scratchBurst.innerHTML = '';

      var colors = ['wed7-popper-white', 'wed7-popper-blue', 'wed7-popper-pink'];
      var count = 70;

      for (var i = 0; i < count; i++) {
        var piece = document.createElement('div');
        piece.className = 'wed7-popper ' + colors[i % colors.length];
        var startPercent = Math.random() * 100;
        var driftX = (Math.random() - 0.5) * 160;
        piece.style.left = startPercent.toFixed(2) + '%';
        piece.style.top = (-2 - Math.random() * 8).toFixed(2) + 'rem';
        piece.style.animationDelay = (Math.random() * 0.55).toFixed(2) + 's';
        piece.style.animationDuration = (2.6 + Math.random() * 2.2).toFixed(2) + 's';
        piece.style.width = (5 + Math.random() * 10).toFixed(2) + 'px';
        piece.style.height = (8 + Math.random() * 14).toFixed(2) + 'px';
        piece.style.setProperty('--wed7-drift-x', driftX.toFixed(2) + 'px');
        piece.style.setProperty('--wed7-twist', (Math.random() * 720 - 360).toFixed(2) + 'deg');
        scratchBurst.appendChild(piece);
      }

      setTimeout(function () {
        scratchBurst.classList.remove('is-active');
        scratchBurst.innerHTML = '';
      }, 5600);
    }

    function checkReveal() {
      if (revealed) return;
      if (getClearedPercent() >= 0.78) {
        revealed = true;
        scratchCard.classList.add('is-revealed');
        if (scratchSection) {
          scratchSection.classList.add('is-splashed');
        }
        /* Allow normal page scroll over the revealed board. */
        scratchCard.style.touchAction = 'auto';
        scratchCanvas.style.touchAction = 'auto';
        scratchCanvas.style.pointerEvents = 'none';
        launchScratchPoppers();
      }
    }

    function onStart(e) {
      if (revealed) return;
      isDrawing = true;
      var pos = getPos(e);
      scratchAt(pos.x, pos.y);
      e.preventDefault();
    }

    function onMove(e) {
      if (!isDrawing || revealed) return;
      var pos = getPos(e);
      scratchAt(pos.x, pos.y);
      checkReveal();
      e.preventDefault();
    }

    function onEnd() {
      if (isDrawing) checkReveal();
      isDrawing = false;
    }

    ensureBoardCors();
    resizeCanvas();
    if (boardMask) {
      boardMask.addEventListener('load', function () {
        if (!revealed) resizeCanvas();
      });
      if (!boardMaskReady()) {
        /* Firebase may assign src after init — poll briefly for a ready bitmap. */
        var boardWaitTries = 0;
        var boardWait = setInterval(function () {
          boardWaitTries += 1;
          if (boardMaskReady() || boardWaitTries > 40) {
            clearInterval(boardWait);
            if (!revealed) resizeCanvas();
          }
        }, 150);
      }
    }
    window.addEventListener('resize', resizeCanvas);

    /* Re-measure once the scratch section is on-screen (layout may change after fonts/images). */
    if ('IntersectionObserver' in window && scratchSection) {
      var seenScratch = false;
      var scratchVisibility = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || seenScratch) return;
          seenScratch = true;
          resizeCanvas();
          scratchVisibility.disconnect();
        });
      }, { root: scrollPage || null, threshold: 0.2 });
      scratchVisibility.observe(scratchSection);
    }

    scratchCanvas.addEventListener('mousedown', onStart);
    scratchCanvas.addEventListener('mousemove', onMove);
    scratchCanvas.addEventListener('mouseup', onEnd);
    scratchCanvas.addEventListener('mouseleave', onEnd);
    scratchCanvas.addEventListener('touchstart', onStart, { passive: false });
    scratchCanvas.addEventListener('touchmove', onMove, { passive: false });
    scratchCanvas.addEventListener('touchend', onEnd);
  }

  function formatTelHref(phone) {
    var tel = (phone || '').replace(/\s/g, '');
    if (!tel) return '';
    if (tel.indexOf('+') !== 0 && tel.indexOf('tel:') !== 0) {
      tel = '+' + tel.replace(/^\+?/, '');
    }
    return 'tel:' + tel.replace('tel:', '');
  }

  function hydrateContact() {
    var phones = [];
    var phone1 = getAttr('data-contact-phone', '');
    var phone2 = getAttr('data-contact-phone-2', '');
    if (phone1) phones.push(phone1);
    if (phone2) phones.push(phone2);

    var wrap = document.getElementById('wed7-contact-links');
    if (wrap && phones.length) {
      wrap.innerHTML = '';
      phones.forEach(function (phone) {
        var href = formatTelHref(phone);
        if (!href) return;
        var digits = phone.replace(/\D/g, '');
        var label = phone;
        if (digits.length === 12 && digits.indexOf('91') === 0) {
          label = '+91 ' + digits.slice(2, 7) + ' ' + digits.slice(7);
        } else if (digits.length === 10) {
          label = '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5);
        }
        var a = document.createElement('a');
        a.className = 'wed7-btn wed7-btn-contact';
        a.href = href;
        a.setAttribute('aria-label', 'Call ' + label);
        a.textContent = label;
        wrap.appendChild(a);
      });
      return;
    }

    var phone = phone1;
    var link = document.getElementById('wed7-contact-link');
    if (!link || !phone) return;

    link.href = formatTelHref(phone);
    link.setAttribute('aria-label', 'Call ' + phone);
    link.textContent = 'Contact Us';
  }

  function hydrateRsvpThanks() {
    setText('wed7-rsvp-thanks-text', getAttr('data-rsvp-thank-you', 'Thank you for your response!'));
  }

  function getCountdownTarget() {
    var dateRaw =
      getAttr('data-event-1-date', '') ||
      getAttr('data-event-date', '');
    var eventTimeRaw =
      getAttr('data-event-1-time', '') ||
      getAttr('data-event-time', '11:00 AM');
    var timeStart = eventTimeRaw.split('-')[0].trim();
    var dateTime = new Date(dateRaw + ' ' + timeStart);

    if (isNaN(dateTime.getTime())) {
      dateTime = new Date(dateRaw + 'T11:00:00');
    }

    return {
      dateRaw: dateRaw,
      dateTime: dateTime
    };
  }

  function hydrateCountdown() {
    var target = getCountdownTarget();
    var dateRaw = target.dateRaw;
    var eventTimeRaw =
      getAttr('data-event-1-time', '') ||
      getAttr('data-event-time', '');
    var timeStart = eventTimeRaw.split('-')[0].trim();
    var label = formatLongDate(dateRaw);

    if (label && timeStart) {
      label += ' at ' + timeStart;
    }

    setText('wed7-countdown-date', label);
  }

  function startCountdown() {
    if (!countdownEls.days) return;

    var target = getCountdownTarget();
    var dateTime = target.dateTime;

    if (isNaN(dateTime.getTime())) return;

    function tick() {
      var diff = dateTime.getTime() - Date.now();

      if (diff <= 0) {
        countdownEls.days.textContent = '0';
        countdownEls.hours.textContent = '0';
        countdownEls.minutes.textContent = '0';
        countdownEls.seconds.textContent = '0';
        return;
      }

      var dayMs = 24 * 60 * 60 * 1000;
      var hourMs = 60 * 60 * 1000;
      var minuteMs = 60 * 1000;

      countdownEls.days.textContent = String(Math.floor(diff / dayMs));
      countdownEls.hours.textContent = String(Math.floor((diff % dayMs) / hourMs));
      countdownEls.minutes.textContent = String(Math.floor((diff % hourMs) / minuteMs));
      countdownEls.seconds.textContent = String(Math.floor((diff % minuteMs) / 1000));
    }

    tick();
    setInterval(tick, 1000);
  }

  function resetScrollToTop() {
    if (scrollPage) scrollPage.scrollTop = 0;
  }

  function onScrollLockEvent(e) {
    if (!heroScrollLocked) return;
    resetScrollToTop();
    e.preventDefault();
  }

  function lockHeroScroll() {
    if (!scrollPage || heroScrollLocked) return;
    heroScrollLocked = true;
    scrollPage.classList.add('is-scroll-locked');
    resetScrollToTop();

    if (!scrollLockHandler) {
      scrollLockHandler = onScrollLockEvent;
      scrollPage.addEventListener('wheel', scrollLockHandler, { passive: false });
      scrollPage.addEventListener('touchmove', scrollLockHandler, { passive: false });
    }
  }

  function unlockHeroScroll() {
    if (!scrollPage) return;
    heroScrollLocked = false;
    scrollPage.classList.remove('is-scroll-locked');

    if (scrollLockHandler) {
      scrollPage.removeEventListener('wheel', scrollLockHandler);
      scrollPage.removeEventListener('touchmove', scrollLockHandler);
      scrollLockHandler = null;
    }

    showHeroScrollHint();
  }

  function showHeroScrollHint() {
    if (!scrollHintEl || scrollHintDismissed) return;
    scrollHintEl.classList.add('is-visible');
  }

  function dismissHeroScrollHint() {
    if (!scrollHintEl || scrollHintDismissed) return;
    scrollHintDismissed = true;
    scrollHintEl.classList.remove('is-visible');
    scrollHintEl.classList.add('is-hidden');
  }

  function initHeroScrollHint() {
    if (heroScrollHintInit || !hero) return;
    heroScrollHintInit = true;

    scrollHintEl = document.createElement('div');
    scrollHintEl.className = 'wed7-scroll-hint';
    scrollHintEl.id = 'wed7-scroll-hint';
    scrollHintEl.setAttribute('aria-hidden', 'true');
    scrollHintEl.innerHTML =
      '<span class="wed7-scroll-hint-chevrons" aria-hidden="true">' +
      '<span></span><span></span></span>' +
      '<span class="wed7-scroll-hint-label">Scroll</span>';
    hero.appendChild(scrollHintEl);

    if (scrollPage) {
      scrollPage.addEventListener('scroll', function () {
        if (scrollPage.scrollTop > 24) dismissHeroScrollHint();
      }, { passive: true });
    }
  }

  function onHeroIntroComplete() {
    /* Names finished — unlock once video has also ended (or never started). */
    tryUnlockHeroScroll();
  }

  function tryUnlockHeroScroll() {
    if (!heroIntroStarted) return;
    if (heroVideo && !heroVideoFinished) {
      var neverStarted = heroVideo.paused && heroVideo.currentTime < 0.15;
      if (!neverStarted) return;
    }
    unlockHeroScroll();
  }

  function markHeroVideoFinished() {
    if (heroVideoFinished) return;
    heroVideoFinished = true;
    tryUnlockHeroScroll();
  }

  function randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  }

  function spawnTrailParticle(x, y) {
    if (!pointerTrail || prefersReducedMotion) return;
    var particle = document.createElement('span');
    var glyphs = ['♥', '♡'];
    particle.className = 'wed7-trail-particle';
    particle.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
    particle.style.left = x.toFixed(1) + 'px';
    particle.style.top = y.toFixed(1) + 'px';
    particle.style.fontSize = randomInRange(0.75, 1.25).toFixed(2) + 'rem';
    particle.style.animationDuration = randomInRange(650, 980).toFixed(0) + 'ms';
    particle.style.color = Math.random() > 0.4
      ? 'rgba(201, 137, 145, 0.82)'
      : (Math.random() > 0.5 ? 'rgba(166, 107, 114, 0.72)' : 'rgba(232, 201, 205, 0.8)');
    pointerTrail.appendChild(particle);
    setTimeout(function () {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 1100);
  }

  function maybeSpawnTrail(x, y) {
    if (!pointerTrail || !sessionInvite || !sessionInvite.classList.contains('is-active')) return;
    var now = Date.now();
    var dx = x - lastTrailX;
    var dy = y - lastTrailY;
    if (now - lastTrailAt < 45 && (dx * dx + dy * dy) < 196) return;
    lastTrailAt = now;
    lastTrailX = x;
    lastTrailY = y;
    spawnTrailParticle(x + randomInRange(-8, 8), y + randomInRange(-8, 8));
  }

  function initPointerTrail() {
    if (pointerTrailInit || !pointerTrail || !scrollPage || prefersReducedMotion) return;
    pointerTrailInit = true;

    scrollPage.addEventListener('pointermove', function (e) {
      maybeSpawnTrail(e.clientX, e.clientY);
    }, { passive: true });

    scrollPage.addEventListener('touchmove', function (e) {
      var touch = e.touches && e.touches[0];
      if (!touch) return;
      maybeSpawnTrail(touch.clientX, touch.clientY);
    }, { passive: true });

    scrollPage.addEventListener('pointerdown', function (e) {
      maybeSpawnTrail(e.clientX, e.clientY);
      spawnTrailParticle(e.clientX + randomInRange(-10, 10), e.clientY + randomInRange(-10, 10));
    }, { passive: true });
  }

  function buildFlyLetters(lineEl, options) {
    if (!lineEl) return;
    var text = (lineEl.getAttribute('data-full-text') || lineEl.textContent || '').trim();
    if (!text) return;

    lineEl.setAttribute('data-full-text', text);
    lineEl.innerHTML = '';
    lineEl.classList.add('wed7-fly-line');

    var chars = Array.from(text);
    chars.forEach(function (ch, i) {
      var span = document.createElement('span');
      span.className = 'wed7-fly-letter';
      span.textContent = ch === ' ' ? '\u00a0' : ch;
      span.style.setProperty('--sx', randomInRange(options.minX, options.maxX).toFixed(0) + 'px');
      span.style.setProperty('--sy', randomInRange(options.minY, options.maxY).toFixed(0) + 'px');
      span.style.setProperty('--rot', randomInRange(-35, 35).toFixed(1) + 'deg');
      var delay = options.baseDelay + i * options.stepDelay + randomInRange(0, options.jitter);
      span.style.setProperty('--delay', delay.toFixed(0) + 'ms');
      lineEl.appendChild(span);
    });
  }

  function getMaxFlyDelayMs(container) {
    var maxDelayMs = 0;
    if (!container) return maxDelayMs;
    container.querySelectorAll('.wed7-fly-letter').forEach(function (letter) {
      var delayRaw = letter.style.getPropertyValue('--delay') || '0ms';
      var delay = parseFloat(delayRaw);
      if (!isNaN(delay) && delay > maxDelayMs) maxDelayMs = delay;
    });
    return maxDelayMs;
  }

  function runTypewriterOnEl(el, onComplete) {
    if (!el) {
      if (onComplete) onComplete();
      return;
    }

    var text = el.getAttribute('data-full-text') || '';
    el.textContent = '';

    if (!text) {
      if (onComplete) onComplete();
      return;
    }

    var chars = Array.from(text);
    var elapsed = 0;
    chars.forEach(function (ch, i) {
      elapsed += randomInRange(TYPEWRITER_CHAR_MIN_MS, TYPEWRITER_CHAR_MAX_MS);
      (function (index, char, delay) {
        setTimeout(function () {
          el.textContent += char;
          if (index === chars.length - 1 && onComplete) onComplete();
        }, delay);
      })(i, ch, elapsed);
    });
  }

  function runHeroLetterIntro() {
    if (!hero || !heroNames || !heroGroom || !heroBride) return;
    if (heroIntroStarted) return;
    heroIntroStarted = true;

    if (heroNames) heroNames.classList.add('is-ready');

    var reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reducedMotion) {
      heroGroom.textContent = heroGroom.getAttribute('data-full-text') || '';
      heroBride.textContent = heroBride.getAttribute('data-full-text') || '';
      onHeroIntroComplete();
      return;
    }

    buildFlyLetters(heroGroom, {
      minX: -140,
      maxX: -35,
      minY: -120,
      maxY: 90,
      baseDelay: 60,
      stepDelay: 38,
      jitter: 110
    });
    buildFlyLetters(heroBride, {
      minX: 35,
      maxX: 140,
      minY: -120,
      maxY: 90,
      baseDelay: 200,
      stepDelay: 38,
      jitter: 110
    });

    heroNames.classList.remove('wed7-fly-active');
    void heroNames.offsetWidth;
    heroNames.classList.add('wed7-fly-active');

    var namesDoneMs = getMaxFlyDelayMs(heroNames) + HERO_FLY_SETTLE_MS;
    setTimeout(function () {
      onHeroIntroComplete();
    }, namesDoneMs);
  }

  function scheduleHeroNamesReveal(delayOverrideMs) {
    if (heroIntroStarted) return;
    if (heroNamesRevealTimer) {
      clearTimeout(heroNamesRevealTimer);
      heroNamesRevealTimer = null;
    }

    var reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var delay = reducedMotion
      ? 0
      : (typeof delayOverrideMs === 'number'
        ? Math.max(0, delayOverrideMs)
        : HERO_NAMES_DELAY_MS);

    heroNamesRevealTimer = setTimeout(function () {
      heroNamesRevealTimer = null;
      runHeroLetterIntro();
    }, delay);
  }

  function hideOpeningSession() {
    if (!sessionOpening) return;
    sessionOpening.classList.remove('is-active', 'is-fading', 'is-handoff');
    sessionOpening.setAttribute('aria-hidden', 'true');
  }

  function getHeroVideoElapsedMs() {
    if (!heroVideo) return 0;
    try {
      return Math.max(0, (heroVideo.currentTime || 0) * 1000);
    } catch (err) {
      return 0;
    }
  }

  function armHeroNamesReveal() {
    if (namesRevealArmed || !hero) return;
    namesRevealArmed = true;
    hero.classList.add('is-animated', 'is-visible');
    scheduleHeroNamesReveal(HERO_NAMES_DELAY_MS - getHeroVideoElapsedMs());
  }

  function prepareInviteUnderOpening() {
    if (invitePrepared || !sessionInvite) return;
    invitePrepared = true;

    sessionInvite.classList.add('is-active');
    sessionInvite.removeAttribute('aria-hidden');
    body.classList.add('wed7-invite-active');

    initHeroScrollHint();
    lockHeroScroll();

    if (!scrollRevealsInit) {
      initScrollReveals();
      scrollRevealsInit = true;
    }
    if (!venueTabsBuilt) {
      buildVenueTabs();
      venueTabsBuilt = true;
    }
    if (hero) {
      hero.classList.add('is-animated', 'is-visible');
    }
    startPetals();
    if (!scratchInit) {
      initScratchCard();
      scratchInit = true;
    }
    if (!coupleMergeInit) {
      initCoupleMerge();
      coupleMergeInit = true;
    }
    if (!timelineCloudsInit) {
      initTimelineClouds();
      timelineCloudsInit = true;
    }
    initHeroVideoScroll();
    if (!scrollPhotoFxInit) {
      initScrollPhotoParallax();
      scrollPhotoFxInit = true;
    }

    /* Hold first frame under the envelope — do not play until the seal is opened. */
    holdHeroVideoAtStart();
    initPointerTrail();
  }

  function activateInviteSession() {
    if (!sessionInvite) return;

    sessionInvite.classList.add('is-active');
    sessionInvite.removeAttribute('aria-hidden');
    body.classList.add('wed7-invite-active');
    initHeroScrollHint();

    if (DEV_SKIP_OPENING) {
      unlockHeroScroll();
      if (scrollHintEl) {
        scrollHintDismissed = true;
        scrollHintEl.classList.add('is-hidden');
      }
    } else {
      lockHeroScroll();
    }

    if (!scrollRevealsInit) {
      initScrollReveals();
      scrollRevealsInit = true;
    }
    if (!venueTabsBuilt) {
      buildVenueTabs();
      venueTabsBuilt = true;
    }
    startPetals();
    if (!scratchInit) {
      initScratchCard();
      scratchInit = true;
    }
    if (!coupleMergeInit) {
      initCoupleMerge();
      coupleMergeInit = true;
    }
    if (!timelineCloudsInit) {
      initTimelineClouds();
      timelineCloudsInit = true;
    }
    initHeroVideoScroll();
    if (!scrollPhotoFxInit) {
      initScrollPhotoParallax();
      scrollPhotoFxInit = true;
    }

    invitePrepared = true;
    armHeroNamesReveal();
    initPointerTrail();
  }

  function holdHeroVideoAtStart() {
    if (!heroVideo) return;
    try {
      heroVideo.pause();
    } catch (err) { /* ignore */ }

    function seekStart() {
      if (heroPlaybackAllowed) return;
      try {
        heroVideo.currentTime = 0;
      } catch (err) { /* ignore */ }
      try {
        heroVideo.pause();
      } catch (err2) { /* ignore */ }
    }

    if (heroVideo.readyState >= 1) {
      seekStart();
    } else {
      heroVideo.addEventListener('loadedmetadata', seekStart, { once: true });
    }
  }

  function beginHeroVideoPlayback() {
    if (!heroVideo) return;
    heroPlaybackAllowed = true;
    heroVideoFinished = false;

    function seekAndPlay() {
      try {
        heroVideo.currentTime = 0;
      } catch (err) { /* ignore */ }
      playHeroVideoOnce();
    }

    if (heroVideo.readyState >= 1) {
      seekAndPlay();
    } else {
      heroVideo.addEventListener('loadedmetadata', function onMeta() {
        if (!heroPlaybackAllowed || heroVideoFinished) return;
        seekAndPlay();
      }, { once: true });
      /* Kick play once src is ready; browsers queue until metadata arrives. */
      playHeroVideoOnce();
    }
  }

  function playHeroVideoOnce() {
    if (!heroVideo || heroVideoFinished || !heroPlaybackAllowed) return;
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.playsInline = true;
    heroVideo.setAttribute('playsinline', '');
    heroVideo.play().catch(function () { /* autoplay blocked */ });
  }

  function showOpeningWithInviteUnderneath() {
    if (sessionOpening) {
      sessionOpening.classList.add('is-active');
      sessionOpening.removeAttribute('aria-hidden');
    }
    prepareInviteUnderOpening();
  }

  function showSession(target) {
    var sessions = [sessionOpening, sessionInvite];
    sessions.forEach(function (node) {
      if (!node) return;
      var isTarget = node === target;
      node.classList.toggle('is-active', isTarget);
      if (isTarget) node.removeAttribute('aria-hidden');
      else node.setAttribute('aria-hidden', 'true');
    });

    if (target === sessionInvite) {
      activateInviteSession();
    }
  }

  function transitionToInvite() {
    if (openingTransitioned) return;
    openingTransitioned = true;

    hideOpeningSession();
    armHeroNamesReveal();

    if (whiteWash) {
      whiteWash.style.opacity = '';
      whiteWash.style.animation = '';
    }
  }

  function finishOpening() {
    transitionToInvite();
  }

  function initHeroVideoScroll() {
    if (!heroVideo || !hero || !scrollPage) return;

    heroVideo.loop = false;
    heroVideo.removeAttribute('loop');

    if (!heroVideo._wed7EndedBound) {
      heroVideo._wed7EndedBound = true;
      heroVideo.addEventListener('ended', function () {
        markHeroVideoFinished();
        try {
          if (heroVideo.duration && isFinite(heroVideo.duration)) {
            heroVideo.currentTime = Math.max(0, heroVideo.duration - 0.05);
          }
        } catch (err) { /* ignore seek errors */ }
        heroVideo.pause();
      });
    }

    if (!('IntersectionObserver' in window)) {
      playHeroVideoOnce();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            playHeroVideoOnce();
          } else if (!heroVideoFinished) {
            heroVideo.pause();
          }
        });
      },
      { root: scrollPage, threshold: 0.12 }
    );

    observer.observe(hero);
  }

  function scheduleMusicStart(delayMs) {
    if (musicStartTimer) {
      clearTimeout(musicStartTimer);
      musicStartTimer = null;
    }

    var delay = Math.max(0, delayMs);
    if (delay === 0) {
      /* Must stay synchronous with the seal tap so autoplay is allowed. */
      startMusic();
      showMuteButton(true);
      return;
    }

    musicStartTimer = setTimeout(function () {
      musicStartTimer = null;
      startMusic();
      showMuteButton(true);
    }, delay);
  }

  function startOpeningAnimation() {
    if (openingStarted) return;
    openingStarted = true;

    var hint = document.getElementById('wed7-opening-hint');
    var reducedMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (openBtn) {
      openBtn.disabled = true;
      openBtn.classList.add('is-opening', 'is-lit');
    }
    if (hint) hint.classList.add('is-hidden');
    if (openingStage) openingStage.classList.add('is-playing');
    if (envelope) envelope.classList.add('is-opening');

    /* Music first, still inside the seal-tap gesture (no setTimeout). */
    startMusic();
    showMuteButton(true);

    /* Start hero video with the seal tap so it isn't already finished behind the flap. */
    beginHeroVideoPlayback();

    if (reducedMotion) {
      if (flapWrap) flapWrap.style.transform = 'rotateX(165deg)';
      finishOpening();
      return;
    }

    if (flapWrap) flapWrap.classList.add('is-opening');

    setTimeout(finishOpening, OPEN_WHITE_MS);
  }

  function initOpeningEnvelope() {
    if (openBtn) {
      openBtn.addEventListener('click', startOpeningAnimation);
      openBtn.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          startOpeningAnimation();
        }
      });
    }
  }

  function applyMusicVolume() {
    if (!audio) return;
    var volRaw = getAttr('data-music-volume', '');
    if (!volRaw) return;
    var vol = parseFloat(volRaw);
    if (isNaN(vol)) return;
    if (vol > 1) vol = vol / 100;
    audio.volume = Math.min(1, Math.max(0, vol));
  }

  function initializeFirebaseAudio() {
    if (!audio) return;
    applyMusicVolume();

    var source = audio.querySelector('source[data-storage-path]');
    if (!source) return;

    var storagePath = source.getAttribute('data-storage-path');
    var token = source.getAttribute('data-token');
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;

    if (baseUrl && storagePath && token) {
      var encoded = storagePath.replace(/^\//, '');
      var url = baseUrl + encoded + '?alt=media&token=' + token;
      source.src = url;
      /* Set on <audio> too so play() can start without waiting on nested <source> quirks. */
      audio.src = url;
      audio.preload = 'auto';
      audio.load();
    }
  }

  function startMusic() {
    if (!audio) return;
    var playAttempt = audio.play();
    if (playAttempt && typeof playAttempt.then === 'function') {
      playAttempt.catch(function () {
        var retry = function () {
          audio.removeEventListener('canplay', retry);
          audio.play().catch(function () { /* still blocked */ });
        };
        audio.addEventListener('canplay', retry);
      });
    }
  }

  function showMuteButton(show) {
    if (!muteBtn) return;
    if (show) muteBtn.removeAttribute('aria-hidden');
    else muteBtn.setAttribute('aria-hidden', 'true');
  }

  function initMute() {
    if (!muteBtn || !audio) return;

    muteBtn.addEventListener('click', function () {
      audio.muted = !audio.muted;
      muteBtn.textContent = audio.muted ? '🔇' : '🔊';
      muteBtn.setAttribute('aria-label', audio.muted ? 'Unmute music' : 'Mute music');
    });
  }

  function createPetal(container, index) {
    var petal = document.createElement('span');
    petal.className = 'wed7-petal';

    var left = 4 + Math.random() * 92;
    var duration = 20 + Math.random() * 14;
    var delay = -(Math.random() * duration);
    var drift = (Math.random() - 0.5) * 80;
    var spin = 200 + Math.random() * 400;
    var size = 8 + Math.random() * 7;
    var shade = PETAL_SHADES[index % PETAL_SHADES.length];

    petal.style.left = left + '%';
    petal.style.width = size + 'px';
    petal.style.height = (size * 1.15) + 'px';
    petal.style.background = shade;
    petal.style.setProperty('--petal-drift', drift.toFixed(1) + 'px');
    petal.style.setProperty('--petal-spin', spin.toFixed(0) + 'deg');
    petal.style.setProperty('--petal-opacity', (0.35 + Math.random() * 0.35).toFixed(2));
    petal.style.animationDuration = duration.toFixed(1) + 's';
    petal.style.animationDelay = delay.toFixed(1) + 's';

    container.appendChild(petal);
  }

  function startPetals() {
    if (petalsStarted) return;
    var container = document.getElementById('wed7-petals');
    if (!container) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    petalsStarted = true;
    container.classList.add('is-active');
    for (var i = 0; i < PETAL_COUNT; i++) {
      createPetal(container, i);
    }
  }

  function initScrollReveals() {
    var sections = document.querySelectorAll('.wed7-reveal');
    if (!sections.length) return;

    function markRevealTarget(el, delay) {
      if (!el) return;
      el.classList.add('wed7-reveal-target');
      if (
        el.classList.contains('wed7-save-date-art') ||
        el.classList.contains('wed7-welcome-footer-art')
      ) {
        el.classList.add('wed7-reveal-art');
      }
      el.style.setProperty('--wed7-reveal-delay', delay);
      el.addEventListener('animationend', function onRevealEnd(e) {
        if (e.target !== el) return;
        el.classList.add('wed7-reveal-done');
        el.style.willChange = 'auto';
      });
    }

    function registerRevealTargets(section) {
      if (!section) return;
      if (section.id === 'wed7-hero') return;

      if (section.classList.contains('wed7-floral-divider')) {
        /* Hang florals stay at rest (no fade) so swing can start from the resting pose. */
        return;
      }

      var selectorMap = {
        'wed7-quote': [
          '.wed7-ornament',
          '.wed7-quote-text'
        ],
        'wed7-scratch-section': [
          '.wed7-save-date-art',
          '.wed7-scratch-hint',
          '.wed7-scratch-card'
        ],
        'wed7-couple-intro': [
          '.wed7-person-heading-wrap'
        ],
        'wed7-timeline': [
          '.wed7-timeline-heading',
          '.wed7-timeline-plant'
        ],
        'wed7-venues': [
          '.wed7-venues-title',
          '.wed7-venue-tabs',
          '.wed7-venue-panels'
        ],
        'wed7-countdown': [
          '.wed7-countdown-title',
          '.wed7-countdown-date',
          '.wed7-countdown-grid'
        ],
        'wed7-rsvp': [
          '.wed7-rsvp-title',
          '.wed7-rsvp-sub',
          '.wed7-rsvp-form .wed7-field:nth-of-type(1)',
          '.wed7-rsvp-form .wed7-field:nth-of-type(2)',
          '#wed7-rsvp-submit'
        ],
        'wed7-contact': [
          '.wed7-section-title',
          '.wed7-contact-text',
          '.wed7-btn-contact'
        ],
        'wed7-welcome': [
          '.wed7-ornament-row',
          '.wed7-welcome-text',
          '.wed7-closing-top',
          '.wed7-closing-names',
          '.wed7-blessings-label',
          '.wed7-blessings-names'
        ]
      };

      var selectors = selectorMap[section.id] || ['.wed7-section-title'];
      /* Details: slower cascade so each line reads clearly one-by-one. */
      var delayStep = section.id === 'wed7-details' ? 0.22 : 0.16;
      var seen = [];
      var index = 0;

      if (section.id === 'wed7-details') {
        /* Walk couple block in DOM order so bride-first still cascades top→bottom. */
        var detailsSequence = [];
        var invocation = section.querySelector('.wed7-details-invocation');
        var inviteQuote = section.querySelector('.wed7-details-invite-quote');
        var coupleFrame = section.querySelector('.wed7-details-couple-frame');
        if (invocation) detailsSequence.push(invocation);
        if (inviteQuote) detailsSequence.push(inviteQuote);
        if (coupleFrame) detailsSequence.push(coupleFrame);

        var coupleChildren = section.querySelectorAll(
          '.wed7-details-couple > .wed7-details-person, .wed7-details-couple > .wed7-details-divider'
        );
        Array.prototype.forEach.call(coupleChildren, function (child) {
          if (child.classList.contains('wed7-details-divider')) {
            detailsSequence.push(child);
            return;
          }
          var role = child.querySelector('.wed7-details-role');
          var name = child.querySelector('.wed7-details-name');
          var parents = child.querySelector('.wed7-details-parents');
          if (role) detailsSequence.push(role);
          if (name) detailsSequence.push(name);
          if (parents) detailsSequence.push(parents);
        });

        ['.wed7-details-weekday', '.wed7-details-date-main', '#wed7-details-time', '#wed7-details-venue']
          .forEach(function (selector) {
            var el = section.querySelector(selector);
            if (el) detailsSequence.push(el);
          });

        var frameIndex = -1;
        detailsSequence.forEach(function (el) {
          if (!el || seen.indexOf(el) !== -1) return;
          seen.push(el);
          var delay = index * delayStep;
          if (el.classList.contains('wed7-details-couple-frame')) {
            delay = Math.max(delay, 0.4);
            frameIndex = index;
          } else if (frameIndex >= 0) {
            /* Let the frame bloom start before couple lines cascade. */
            delay += 0.35;
          }
          markRevealTarget(el, delay.toFixed(2) + 's');
          index += 1;
        });
        return;
      }

      selectors.forEach(function (selector) {
        var matches = section.querySelectorAll(selector);
        Array.prototype.forEach.call(matches, function (el) {
          if (!el || seen.indexOf(el) !== -1) return;
          seen.push(el);
          markRevealTarget(el, (index * delayStep).toFixed(2) + 's');
          index += 1;
        });
      });
    }

    sections.forEach(function (el) {
      registerRevealTargets(el);
    });

    function revealSection(el) {
      if (!el || el.classList.contains('is-visible')) return;
      el.classList.add('is-visible');
    }

    /*
     * Safety net: sticky merge layout shifts can make IntersectionObserver miss
     * thresholds, leaving reveal-targets stuck at opacity 0. Force-reveal any
     * section that has entered view or already scrolled past.
     */
    function revealPassedOrVisibleSections() {
      if (!scrollPage) return;
      var rootRect = scrollPage.getBoundingClientRect();
      sections.forEach(function (el) {
        if (!el || el.id === 'wed7-hero' || el.classList.contains('is-visible')) return;
        var observeEl = el;
        if (el.id === 'wed7-details') {
          observeEl = el.querySelector('.wed7-details-card') || el;
        }
        var rect = observeEl.getBoundingClientRect();
        var scrolledPast = rect.bottom < rootRect.top + 64;
        var entered =
          rect.top < rootRect.bottom - Math.min(120, rootRect.height * 0.28) &&
          rect.bottom > rootRect.top + 24;
        if (scrolledPast || entered) revealSection(el);
      });
    }

    var safetyTicking = false;
    function requestRevealSafety() {
      if (safetyTicking) return;
      safetyTicking = true;
      window.requestAnimationFrame(function () {
        safetyTicking = false;
        revealPassedOrVisibleSections();
      });
    }

    if (!('IntersectionObserver' in window) || prefersReducedMotion) {
      sections.forEach(revealSection);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var target = entry.target;
          var section = target;
          if (target && target.getAttribute('data-wed7-reveal-section')) {
            section = document.getElementById(target.getAttribute('data-wed7-reveal-section'));
          }
          if (!section) return;

          var viewportRatio = entry.rootBounds && entry.rootBounds.height
            ? entry.intersectionRect.height / entry.rootBounds.height
            : 0;
          var triggerRatio = 0.42;
          if (section.id === 'wed7-details') triggerRatio = 0.32;
          if (section.id === 'wed7-quote') triggerRatio = 0.2;
          if (section.id === 'wed7-couple-intro') triggerRatio = 0.24;
          if (section.id === 'wed7-scratch-section') triggerRatio = 0.28;
          if (section.classList.contains('wed7-floral-divider')) {
            triggerRatio = 0.18;
          }

          if (entry.isIntersecting && (entry.intersectionRatio >= triggerRatio || viewportRatio >= triggerRatio)) {
            revealSection(section);
            observer.unobserve(target);
          }
        });
      },
      { root: scrollPage, rootMargin: '0px 0px -8% 0px', threshold: [0, 0.15, 0.3, 0.45, 0.6, 1] }
    );

    sections.forEach(function (el) {
      if (el.id === 'wed7-hero') {
        revealSection(el);
        return;
      }
      /*
       * Details has large flower padding — observe the card so the stagger
       * starts when names/frame are actually on screen, not when only padding is.
       */
      if (el.id === 'wed7-details') {
        var detailsCard = el.querySelector('.wed7-details-card');
        if (detailsCard) {
          detailsCard.setAttribute('data-wed7-reveal-section', 'wed7-details');
          observer.observe(detailsCard);
          return;
        }
      }
      observer.observe(el);
    });

    if (scrollPage) {
      scrollPage.addEventListener('scroll', requestRevealSafety, { passive: true });
      requestRevealSafety();
    }
  }

  function initScrollPhotoParallax() {
    /* Disabled for t7 — scroll-linked photo shift caused shaking in Meet the Couple. */
    return;
  }

  function getVenueCount() {
    var count = parseInt(getAttr('data-venue-count', '1'), 10);
    if (isNaN(count) || count < 1) count = 1;
    if (count > 4) count = 4;
    return count;
  }

  function buildVenueTabs() {
    var tabsEl = document.getElementById('wed7-venue-tabs');
    var panelsEl = document.getElementById('wed7-venue-panels');
    if (!tabsEl || !panelsEl) return;
    var venueArtSources = [
      {
        path: '/templates%2Fshared%2Fimages%2Fwedding%20t7%2Fpink%20arch.png',
        token: '41fbbcfc-e8dc-40b9-9835-b481b54cf100'
      },
      {
        path: '/templates%2Fshared%2Fimages%2Fwedding%20t7%2Fpink%20door%202%20plain.png',
        token: '65a5b0bc-d1a6-47a1-a2cc-9c331ce0930a'
      },
      {
        path: '/templates%2Fshared%2Fimages%2Fwedding%20t7%2Fvenue%20pink%20door.png',
        token: '5402ebee-dbc0-4243-91e4-9dd7877daad3'
      }
    ];

    var count = getVenueCount();
    var hasMultiple = count > 1;
    tabsEl.classList.toggle('is-single', !hasMultiple);
    tabsEl.innerHTML = '';
    panelsEl.innerHTML = '';

    for (var i = 1; i <= count; i++) {
      var label = getAttr('data-venue-' + i + '-label', 'Venue ' + i);
      var address = getAttr('data-venue-' + i + '-address', getAttr('data-event-address', ''));
      var mapLink = getAttr('data-venue-' + i + '-map-link', getAttr('data-map-link', '#'));
      var doorArt = venueArtSources[Math.min(i - 1, venueArtSources.length - 1)];

      if (hasMultiple) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'wed7-venue-tab' + (i === 1 ? ' is-active' : '');
        tab.setAttribute('role', 'tab');
        tab.setAttribute('aria-selected', i === 1 ? 'true' : 'false');
        tab.setAttribute('data-venue-index', String(i));
        tab.textContent = label;
        tabsEl.appendChild(tab);
      }

      var panel = document.createElement('div');
      panel.className = 'wed7-venue-panel' + (i === 1 ? ' is-active' : '');
      panel.setAttribute('role', 'tabpanel');
      panel.setAttribute('data-venue-index', String(i));
      panel.innerHTML =
        '<div class="wed7-venue-panel-card">' +
        '<div class="wed7-venue-door-wrap">' +
        '<img class="wed7-venue-door" data-storage-path="' + doorArt.path + '" data-token="' + doorArt.token + '" alt="" aria-hidden="true" loading="lazy" decoding="async">' +
        '</div>' +
        '<h3 class="wed7-venue-card-title">' + escapeNameHtml(label) + '</h3>' +
        '<p class="wed7-venue-address">' + address + '</p>' +
        '<a class="wed7-btn-map" href="' + mapLink + '" target="_blank" rel="noopener noreferrer">View on Google Maps</a>' +
        '</div>';

      panelsEl.appendChild(panel);
      var doorImg = panel.querySelector('.wed7-venue-door');
      if (doorImg) applyFirebaseAsset(doorImg);
    }

    if (hasMultiple) {
      tabsEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.wed7-venue-tab');
        if (!btn) return;
        var idx = btn.getAttribute('data-venue-index');
        switchVenueTab(idx);
      });
    }
  }

  function switchVenueTab(index) {
    var tabs = document.querySelectorAll('.wed7-venue-tab');
    var panels = document.querySelectorAll('.wed7-venue-panel');

    tabs.forEach(function (tab) {
      var active = tab.getAttribute('data-venue-index') === index;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    panels.forEach(function (panel) {
      panel.classList.toggle('is-active', panel.getAttribute('data-venue-index') === index);
    });
  }

  function initRsvp() {
    if (getAttr('data-rsvp-enabled', 'true') === 'false') {
      var rsvpSection = document.getElementById('wed7-rsvp');
      if (rsvpSection) rsvpSection.hidden = true;
      return;
    }

    var form = document.getElementById('wed7-rsvp-form');
    var guestsWrap = document.getElementById('wed7-rsvp-guests-wrap');
    var reasonWrap = document.getElementById('wed7-rsvp-reason-wrap');
    var guestsInput = document.getElementById('wed7-rsvp-guests');
    var reasonInput = document.getElementById('wed7-rsvp-reason');
    var heartsLayer = document.getElementById('wed7-rsvp-hearts');
    var thanks = document.getElementById('wed7-rsvp-thanks');
    var rsvpSub = document.querySelector('#wed7-rsvp .wed7-rsvp-sub');
    if (!form) return;

    function syncRsvpSubVisibility() {
      if (!rsvpSub) return;
      var thanksVisible = thanks && !thanks.hidden;
      rsvpSub.hidden = !!thanksVisible;
    }

    function lockThanksHeightFromForm() {
      if (!form || !thanks) return;
      if (form.classList.contains('is-hidden') || form.classList.contains('is-fading-out')) return;
      var height = Math.round(form.getBoundingClientRect().height);
      if (height > 0) thanks.style.minHeight = height + 'px';
    }

    var thanksFadeBusy = false;

    function animateWishFormToThanks() {
      if (!form || !thanks || thanksFadeBusy) return;
      thanksFadeBusy = true;

      /* Measure while form is still visible, then undo RsvpForm's instant swap. */
      form.classList.remove('is-hidden');
      lockThanksHeightFromForm();
      thanks.hidden = true;
      thanks.classList.remove('is-visible');
      syncRsvpSubVisibility();

      window.requestAnimationFrame(function () {
        form.classList.add('is-fading-out');
        if (rsvpSub) {
          rsvpSub.style.transition = 'opacity 0.35s ease';
          rsvpSub.style.opacity = '0';
        }

        var finished = false;
        function finishFade() {
          if (finished) return;
          finished = true;
          form.classList.add('is-hidden');
          form.classList.remove('is-fading-out');
          thanks.hidden = false;
          syncRsvpSubVisibility();
          window.requestAnimationFrame(function () {
            window.requestAnimationFrame(function () {
              thanks.classList.add('is-visible');
              thanksFadeBusy = false;
            });
          });
        }

        form.addEventListener('transitionend', function onFadeOut(event) {
          if (event.target !== form || event.propertyName !== 'opacity') return;
          form.removeEventListener('transitionend', onFadeOut);
          finishFade();
        });
        window.setTimeout(finishFade, 500);
      });
    }

    lockThanksHeightFromForm();
    syncRsvpSubVisibility();
    window.addEventListener('resize', lockThanksHeightFromForm);
    form.addEventListener('input', lockThanksHeightFromForm);
    form.addEventListener('submit', lockThanksHeightFromForm, true);

    if (thanks && 'MutationObserver' in window) {
      var thanksObserver = new MutationObserver(function () {
        if (thanksFadeBusy) return;

        if (thanks.hidden) {
          thanks.classList.remove('is-visible');
          form.classList.remove('is-fading-out');
          thanks.style.minHeight = '';
          if (rsvpSub) {
            rsvpSub.style.opacity = '';
            rsvpSub.style.transition = '';
          }
          syncRsvpSubVisibility();
          return;
        }

        if (thanks.classList.contains('is-visible')) {
          syncRsvpSubVisibility();
          return;
        }

        if (form.classList.contains('is-hidden')) {
          animateWishFormToThanks();
        } else {
          syncRsvpSubVisibility();
        }
      });
      thanksObserver.observe(thanks, { attributes: true, attributeFilter: ['hidden', 'class'] });
    }

    if (heartsLayer && heartsLayer.parentNode !== document.body) {
      document.body.appendChild(heartsLayer);
    }

    function playRsvpHearts() {
      if (!heartsLayer) return;
      heartsLayer.innerHTML = '';
      var shades = ['#a66b72', '#c98991', '#8a4f58', '#d4a5ab', '#b0767f'];

      for (var i = 0; i < 18; i++) {
        var heart = document.createElement('span');
        heart.className = 'wed7-rsvp-heart';
        heart.textContent = i % 3 === 0 ? '♡' : '♥';
        heart.style.left = (6 + Math.random() * 88).toFixed(2) + '%';
        heart.style.animationDuration = (3.6 + Math.random() * 1.8).toFixed(2) + 's';
        heart.style.animationDelay = (Math.random() * 0.55).toFixed(2) + 's';
        heart.style.fontSize = (0.95 + Math.random() * 0.8).toFixed(2) + 'rem';
        heart.style.color = shades[i % shades.length];
        heart.style.setProperty('--wed7-heart-drift', ((Math.random() - 0.5) * 120).toFixed(0) + 'px');
        heart.style.setProperty('--wed7-heart-spin', ((Math.random() - 0.5) * 260).toFixed(0) + 'deg');
        heartsLayer.appendChild(heart);
      }

      window.setTimeout(function () {
        if (heartsLayer) heartsLayer.innerHTML = '';
      }, 6500);
    }

    if (window.RsvpForm && window.RsvpStore) {
      var rsvpMode = getAttr('data-rsvp-mode', '');
      var rsvpConfig = {
        formId: 'wed7-rsvp-form',
        nameInputId: 'wed7-rsvp-name',
        reasonWrapId: 'wed7-rsvp-reason-wrap',
        reasonInputId: 'wed7-rsvp-reason',
        submitButtonId: 'wed7-rsvp-submit',
        thanksId: 'wed7-rsvp-thanks',
        thanksTextId: 'wed7-rsvp-thanks-text',
        getInviteMeta: function () {
          return {
            slug: getAttr('data-rsvp-slug', ''),
            groomName: getAttr('data-groom-name', ''),
            brideName: getAttr('data-bride-name', ''),
            displayName: getAttr('data-groom-name', '') + ' & ' + getAttr('data-bride-name', ''),
            templateId: getAttr('data-template-id', 'wedding-t7')
          };
        },
        getSuccessMessage: function () {
          return getAttr('data-rsvp-thank-you', 'Thank you for your response!');
        },
        onAttendYes: playRsvpHearts
      };

      if (rsvpMode === 'wishes') {
        rsvpConfig.mode = 'wishes';
      } else {
        rsvpConfig.guestsWrapId = 'wed7-rsvp-guests-wrap';
        rsvpConfig.guestsInputId = 'wed7-rsvp-guests';
        rsvpConfig.decreaseBtnId = 'wed7-rsvp-guests-decrease';
        rsvpConfig.increaseBtnId = 'wed7-rsvp-guests-increase';
        rsvpConfig.attendanceSelector = 'input[name="attendance"]';
      }

      window.RsvpForm.init(rsvpConfig);
    }
  }

  function encodedStoragePath(attr) {
    return attr ? attr.replace(/^\//, '') : '';
  }

  function decodedStoragePath(attr) {
    if (!attr) return '';
    var raw = attr.replace(/^\//, '');
    try {
      return decodeURIComponent(raw);
    } catch (err) {
      return raw.replace(/%2F/g, '/');
    }
  }

  function resolvePathOnlyImageUrl(storagePath, baseUrl, cb) {
    var path = decodedStoragePath(storagePath);
    var encoded = encodedStoragePath(storagePath);
    var bucket = 'my-bel0ved.firebasestorage.app';

    function setUrl(url) {
      if (url && typeof cb === 'function') cb(url);
    }

    function tryPublicMedia() {
      if (baseUrl) setUrl(baseUrl + encoded + '?alt=media');
    }

    function tryRestFallback() {
      fetch('https://firebasestorage.googleapis.com/v0/b/' + bucket + '/o/' + encoded)
        .then(function (r) { return r.json(); })
        .then(function (data) {
          var token = data && (data.downloadTokens || (data.metadata && data.metadata.firebaseStorageDownloadTokens));
          if (token) setUrl(baseUrl + encoded + '?alt=media&token=' + token);
          else tryPublicMedia();
        })
        .catch(function () { tryPublicMedia(); });
    }

    function trySdk() {
      if (!window.FirebaseStorage || !window.FirebaseStorage.getDownloadUrlByPath) {
        tryRestFallback();
        return;
      }
      window.FirebaseStorage.getDownloadUrlByPath(path)
        .then(function (url) {
          if (url) setUrl(url);
          else tryRestFallback();
        })
        .catch(function () { tryRestFallback(); });
    }

    trySdk();
    setTimeout(trySdk, 300);
    setTimeout(trySdk, 700);
  }

  var wed7ImageInitDone = false;

  function applyFirebaseAsset(el) {
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!baseUrl || !el) return;

    var storagePath = el.getAttribute('data-storage-path');
    if (!storagePath) return;

    var token = el.getAttribute('data-token');
    var encoded = encodedStoragePath(storagePath);

    function syncHeroHold() {
      if (el.id !== 'wed7-hero-video') return;
      if (heroPlaybackAllowed && !heroVideoFinished) {
        playHeroVideoOnce();
      } else {
        holdHeroVideoAtStart();
      }
    }

    function setSrc(url) {
      if (!url) return;
      var current = el.currentSrc || el.getAttribute('src') || el.src || '';
      /* Hero already has an inline Firebase src — don't restart buffering. */
      if (el.id === 'wed7-hero-video' && current.indexOf(encoded) !== -1) {
        syncHeroHold();
        return;
      }
      if (current === url || current.indexOf(encoded) !== -1) {
        syncHeroHold();
        return;
      }
      el.src = url;
      if (el.tagName === 'VIDEO') {
        el.load();
        syncHeroHold();
      }
    }

    if (token) {
      setSrc(baseUrl + encoded + '?alt=media&token=' + token);
      return;
    }

    resolvePathOnlyImageUrl(storagePath, baseUrl, setSrc);
  }

  function initializeFirebaseImages() {
    var baseUrl = window.FirebaseConfig && window.FirebaseConfig.storageBaseUrl;
    if (!baseUrl || wed7ImageInitDone) return;
    wed7ImageInitDone = true;

    /* Hero video first — often already started via inline src / preload. */
    var heroEl = document.getElementById('wed7-hero-video');
    if (heroEl && heroEl.getAttribute('data-storage-path')) {
      applyFirebaseAsset(heroEl);
    }

    /* Closing flower next so it's ready before the guest reaches the last session. */
    var welcomeArt = document.querySelector('.wed7-welcome-footer-art[data-storage-path]');
    if (welcomeArt) applyFirebaseAsset(welcomeArt);

    document.querySelectorAll('img[data-storage-path], video[data-storage-path]').forEach(function (el) {
      if (el === heroEl || el === welcomeArt) return;
      applyFirebaseAsset(el);
    });
  }

  function tryInitFirebaseImages() {
    if (!window.FirebaseConfig || !window.FirebaseConfig.storageBaseUrl) return false;
    initializeFirebaseImages();
    return true;
  }

  function runFirebaseImageInit() {
    if (tryInitFirebaseImages()) return;
    var checkFirebase = setInterval(function () {
      if (tryInitFirebaseImages()) clearInterval(checkFirebase);
    }, 100);
    setTimeout(function () { clearInterval(checkFirebase); }, 12000);
  }

  hydrate();
  /* First frame as soon as metadata is ready (src is already inline). */
  holdHeroVideoAtStart();
  initializeFirebaseAudio();
  runFirebaseImageInit();
  initMute();
  initRsvp();
  startCountdown();
  if (DEV_SKIP_OPENING) {
    openingStarted = true;
    openingTransitioned = true;
    showSession(sessionInvite);
    beginHeroVideoPlayback();
    startMusic();
    showMuteButton(true);
  } else {
    initOpeningEnvelope();
    showOpeningWithInviteUnderneath();
    showMuteButton(false);
  }
})();
