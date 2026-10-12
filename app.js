/* =============================================
   LUNA — app.js
   Logique principale de l'application
   ============================================= */

/* ---- INIT ---- */
document.addEventListener('DOMContentLoaded', () => {
  // Splash → app
  setTimeout(() => {
    document.getElementById('splash').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
    initApp();
  }, 2100);
});

function initApp() {
  applyTheme();
  setupNav();
  setupThemeToggle();
  setupPrintBtn();
  renderCalendar();
  renderPhaseCard();
  checkAlerts();
  renderJournal();
  renderIllnessStats();
  renderHealthNutrition();
  renderWeightList();
  renderRdvList();
  setupForms();
  setupVoiceMode();
  setupVoiceSettings();
  setupSymptomTracker();
  setTodayDefaults();
  /* l'ancienne liste de courses n'existe plus : on efface ses données */
  try { localStorage.removeItem('luna_shopping'); } catch (e) {}
}

/* ---- THEME ---- */
function applyTheme() {
  const saved = localStorage.getItem('luna_theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
    return;
  }

  const prefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;

  document.documentElement.setAttribute(
    'data-theme',
    prefersDark ? 'dark' : 'light'
  );
}

function setupThemeToggle() {
  document.getElementById('themeToggle').addEventListener('click', () => {
    const current =
      document.documentElement.getAttribute('data-theme');

    const next = current === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('luna_theme', next);
  });
}

/* ---- NAVIGATION ---- */
function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document
        .querySelectorAll('.nav-btn')
        .forEach(b => b.classList.remove('active'));

      document
        .querySelectorAll('.tab-section')
        .forEach(s => s.classList.remove('active'));

      btn.classList.add('active');

      const tab = btn.dataset.tab;
      document
        .getElementById(`tab-${tab}`)
        .classList.add('active');
    });
  });
}

/* ---- SET TODAY AS DEFAULTS ---- */
function setTodayDefaults() {
  const today = lunaGetLocalDateISO();

  [
    'inputStart',
    'inputEnd',
    'entryDate',
    'weightDate',
    'rdvDate'
  ].forEach(id => {
    const el = document.getElementById(id);

    if (el && !el.value) {
      el.value = today;
    }
  });
}

/* ---- ALERTS ---- */
function checkAlerts() {
  const data = LunaDB.calcCycleData();

  if (!data) return;

  const banner = document.getElementById('alertBanner');
  const text = document.getElementById('alertText');

  if (
    data.daysToNextPeriod >= 0 &&
    data.daysToNextPeriod <= 3
  ) {
    text.textContent =
      `🩸 Vos règles sont prévues dans ${data.daysToNextPeriod} jour(s). Pensez à vous préparer !`;

    banner.classList.remove('hidden');

  } else if (data.phase === 'fertile') {

    text.textContent =
      `🌸 Vous êtes en période fertile (ovulation estimée dans ${Math.round(
        (data.ovulationDay - data.today) / 86400000
      )} jours).`;

    banner.classList.remove('hidden');
  }
}

/* ---- PHASE CARD ---- */
function renderPhaseCard() {
  const data = LunaDB.calcCycleData();

  if (!data) {
    document.getElementById('phaseLabel').textContent =
      'Saisissez vos règles pour commencer';

    document.getElementById('phaseDay').textContent = '';
    document.getElementById('phaseNext').textContent = '';

    document.getElementById('pillPeriod').textContent = '—';
    document.getElementById('pillFertile').textContent = '—';
    document.getElementById('pillOvul').textContent = '—';

    return;
  }

  document.getElementById('phaseLabel').textContent =
    data.phaseLabel;

  document.getElementById('phaseDay').textContent =
    `Jour ${data.dayOfCycle} du cycle · ${data.phaseDesc}`;

  if (data.daysToNextPeriod < 0) {

    document.getElementById('phaseNext').textContent =
      `Règles en retard de ${Math.abs(
        data.daysToNextPeriod
      )} jour(s)`;

  } else if (data.daysToNextPeriod === 0) {

    document.getElementById('phaseNext').textContent =
      'Règles prévues aujourd\'hui';

  } else {

    document.getElementById('phaseNext').textContent =
      `Prochaines règles dans ${data.daysToNextPeriod} jours`;
  }

  document.getElementById('pillPeriod').textContent =
    fmtShortDate(data.nextPeriodStart);

  document.getElementById('pillFertile').textContent =
    fmtShortDate(data.fertileStart) +
    '–' +
    fmtShortDate(data.fertileEnd);

  document.getElementById('pillOvul').textContent =
    fmtShortDate(data.ovulationDay);
}

/* ---- CALENDAR ---- */
let calYear, calMonth;

function renderCalendar(year, month) {
  const now = new Date();

  calYear = year || now.getFullYear();
  calMonth =
    month !== undefined
      ? month
      : now.getMonth();

  const label =
    new Date(calYear, calMonth, 1)
      .toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
      });

  document.getElementById('calMonthLabel').textContent =
    label.charAt(0).toUpperCase() +
    label.slice(1);

  const data = LunaDB.calcCycleData();
  const rdvs = LunaDB.getRdv();
  const journal = LunaDB.getJournal();

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const firstDay =
    new Date(calYear, calMonth, 1);

  let startDow = firstDay.getDay();

  // 0 = dimanche
  // On transforme pour avoir lundi = 0
  startDow =
    startDow === 0
      ? 6
      : startDow - 1;

  const daysInMonth =
    new Date(
      calYear,
      calMonth + 1,
      0
    ).getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* ---- DATES SPECIALES ---- */

  const periods = LunaDB.getPeriods();

  const periodDates = new Set();
  const predictedPeriodDates = new Set();
  const fertileDates = new Set();
  const ovulDates = new Set();

  periods.forEach(p => {

    let d = new Date(p.start);

    const end =
      p.end
        ? new Date(p.end)
        : new Date(
            d.getTime() +
            4 * 86400000
          );

    while (d <= end) {

      periodDates.add(
        d.toISOString().split('T')[0]
      );

      d = new Date(
        d.getTime() + 86400000
      );
    }
  });

  if (data) {

    data.predictions.forEach(pred => {

      let d = new Date(pred.periodStart);

      while (d <= pred.periodEnd) {

        predictedPeriodDates.add(
          d.toISOString().split('T')[0]
        );

        d = new Date(
          d.getTime() + 86400000
        );
      }

      let fd = new Date(pred.fertileStart);

      while (fd <= pred.fertileEnd) {

        fertileDates.add(
          fd.toISOString().split('T')[0]
        );

        fd = new Date(
          fd.getTime() + 86400000
        );
      }

      ovulDates.add(
        pred.ovulation
          .toISOString()
          .split('T')[0]
      );
    });

    /* ---- CYCLE ACTUEL ---- */

    let fd = new Date(data.fertileStart);

    while (fd <= data.fertileEnd) {

      fertileDates.add(
        fd.toISOString().split('T')[0]
      );

      fd = new Date(
        fd.getTime() + 86400000
      );
    }

    ovulDates.add(
      data.ovulationDay
        .toISOString()
        .split('T')[0]
    );
  }

  const rdvDates =
    new Set(
      rdvs.map(r => r.date)
    );

  const sickDates =
    new Set(
      journal
        .filter(
          e =>
            e.category === 'maladie' ||
            e.category === 'fievre'
        )
        .map(e => e.date)
    );

  /* ---- MOIS PRECEDENT ---- */

  for (let i = 0; i < startDow; i++) {

    const d =
      new Date(
        calYear,
        calMonth,
        -startDow + i + 1
      );

    const cell =
      makeDayCell(
        d,
        false,
        periodDates,
        predictedPeriodDates,
        fertileDates,
        ovulDates,
        rdvDates,
        sickDates,
        today,
        data
      );

    grid.appendChild(cell);
  }

  /* ---- MOIS ACTUEL ---- */

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const d =
      new Date(
        calYear,
        calMonth,
        day
      );

    const cell =
      makeDayCell(
        d,
        true,
        periodDates,
        predictedPeriodDates,
        fertileDates,
        ovulDates,
        rdvDates,
        sickDates,
        today,
        data
      );

    grid.appendChild(cell);
  }

  /* ---- MOIS SUIVANT ---- */

  const totalCells =
    startDow + daysInMonth;

  const remaining =
    totalCells % 7 === 0
      ? 0
      : 7 - (totalCells % 7);

  for (
    let i = 1;
    i <= remaining;
    i++
  ) {

    const d =
      new Date(
        calYear,
        calMonth + 1,
        i
      );

    const cell =
      makeDayCell(
        d,
        false,
        periodDates,
        predictedPeriodDates,
        fertileDates,
        ovulDates,
        rdvDates,
        sickDates,
        today,
        data
      );

    grid.appendChild(cell);
  }

  /* ---- NAVIGATION CALENDRIER ---- */

  document.getElementById('calPrev').onclick =
    () => {

      let m = calMonth - 1;
      let y = calYear;

      if (m < 0) {
        m = 11;
        y--;
      }

      renderCalendar(y, m);
    };

  document.getElementById('calNext').onclick =
    () => {

      let m = calMonth + 1;
      let y = calYear;

      if (m > 11) {
        m = 0;
        y++;
      }

      renderCalendar(y, m);
    };
}

function makeDayCell(
  d,
  isCurrentMonth,
  periodDates,
  predictedPeriodDates,
  fertileDates,
  ovulDates,
  rdvDates,
  sickDates,
  today,
  data
) {

  const cell =
    document.createElement('div');

  cell.className = 'cal-day';
  cell.textContent = d.getDate();

  const ds = lunaGetLocalDateISO(d);

  if (!isCurrentMonth)
    cell.classList.add('other-month');

  if (d.getTime() === today.getTime())
    cell.classList.add('today');

  if (periodDates.has(ds))
    cell.classList.add('period');

  else if (predictedPeriodDates.has(ds))
    cell.classList.add('predicted-period');

  else if (ovulDates.has(ds))
    cell.classList.add('ovulation');

  else if (fertileDates.has(ds))
    cell.classList.add('fertile');

  const dots = [];

  if (rdvDates.has(ds))
    dots.push('dot-rdv');

  if (sickDates.has(ds))
    dots.push('dot-sick');

  if (dots.length) {

    const row =
      document.createElement('div');

    row.className = 'dot-row';

    dots.forEach(cls => {

      const dot =
        document.createElement('span');

      dot.className =
        'day-dot ' + cls;

      row.appendChild(dot);
    });

    cell.appendChild(row);
  }

  cell.addEventListener(
    'click',
    () => openDayModal(d, ds)
  );

  return cell;
}

function openDayModal(d, ds) {

  const modal =
    document.getElementById('dayModal');

  const title =
    document.getElementById('modalTitle');

  const content =
    document.getElementById('modalContent');

  title.textContent =
    d.toLocaleDateString(
      'fr-FR',
      {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }
    );

  const journal =
    LunaDB
      .getJournal()
      .filter(e => e.date === ds);

  const rdvs =
    LunaDB
      .getRdv()
      .filter(r => r.date === ds);

  const periods =
    LunaDB
      .getPeriods()
      .filter(p => {

        const s = new Date(p.start);

        const e =
          p.end
            ? new Date(p.end)
            : new Date(
                s.getTime() +
                4 * 86400000
              );

        return (
          new Date(ds) >= s &&
          new Date(ds) <= e
        );
      });

  let html = '';

  if (periods.length) {

    html += `
      <div
        style="
          background:rgba(232,121,164,.15);
          border-radius:10px;
          padding:.8rem;
          margin-bottom:.7rem
        "
      >
        <strong>🩸 Règles</strong>
      </div>
    `;
  }

  if (rdvs.length) {

    rdvs.forEach(r => {

      html += `
        <div
          style="
            background:var(--accent-soft);
            border-radius:10px;
            padding:.8rem;
            margin-bottom:.7rem
          "
        >
          <strong>📅 ${r.title}</strong><br>

          <span
            style="
              font-size:.82rem;
              color:var(--text-muted)
            "
          >
            ${r.time || ''}
            ${r.place ? '· ' + r.place : ''}
          </span>

          ${
            r.notes
              ? `<br><span style="font-size:.8rem">${r.notes}</span>`
              : ''
          }
        </div>
      `;
    });
  }

  if (journal.length) {

    journal.forEach(e => {

      const icons = {
        periode: '🩸',
        symptome: '💊',
        maladie: '🤒',
        fievre: '🌡️',
        humeur: '😊',
        note: '📝'
      };

      html += `
        <div
          style="
            background:var(--bg-input);
            border-radius:10px;
            padding:.8rem;
            margin-bottom:.7rem
          "
        >
          <strong>
            ${icons[e.category] || '📝'}
            ${
              e.category.charAt(0).toUpperCase() +
              e.category.slice(1)
            }
          </strong>

          ${e.illnessType ? ` — ${e.illnessType}` : ''}

          ${
            e.fever
              ? `<span style="color:#ef4444">${e.fever}°C</span>`
              : ''
          }

          ${
            e.notes
              ? `<br>
                 <span
                   style="
                     font-size:.82rem;
                     color:var(--text-muted)
                   "
                 >
                   ${e.notes}
                 </span>`
              : ''
          }

          ${
            e.intensity
              ? `<br>
                 <span style="font-size:.78rem">
                   Intensité : ${e.intensity}/5
                 </span>`
              : ''
          }
        </div>
      `;
    });
  }

  if (!html) {

    html = `
      <p
        style="
          color:var(--text-muted);
          font-size:.9rem;
          text-align:center;
          padding:1rem 0
        "
      >
        Aucune donnée pour ce jour.<br>

        <span style="font-size:.8rem">
          Ajoutez une entrée dans le Journal.
        </span>
      </p>
    `;
  }

  /* ---- BOUTONS RAPIDES ---- */

  html += `
    <div
      style="
        display:flex;
        gap:.5rem;
        margin-top:.8rem
      "
    >
      <button
        class="btn-secondary"
        onclick="quickAddJournal('${ds}')"
        style="flex:1;font-size:.8rem"
      >
        + Journal
      </button>

      <button
        class="btn-secondary"
        onclick="quickAddRdv('${ds}')"
        style="flex:1;font-size:.8rem"
      >
        + RDV
      </button>
    </div>
  `;

  content.innerHTML = html;
  modal.classList.remove('hidden');
}

function quickAddJournal(date) {

  document
    .getElementById('dayModal')
    .classList.add('hidden');

  document
    .querySelector('[data-tab="journal"]')
    .click();

  document.getElementById('entryDate').value =
    date;

  document
    .getElementById('entryForm')
    .classList.remove('hidden');
}

function quickAddRdv(date) {

  document
    .getElementById('dayModal')
    .classList.add('hidden');

  document
    .querySelector('[data-tab="rdv"]')
    .click();

  document.getElementById('rdvDate').value =
    date;
}

document
  .getElementById('modalClose')
  .addEventListener('click', () => {

    document
      .getElementById('dayModal')
      .classList.add('hidden');
  });

document
  .getElementById('dayModal')
  .addEventListener('click', (e) => {

    if (e.target === e.currentTarget)
      e.currentTarget.classList.add('hidden');
  });

/* ---- JOURNAL ---- */
function setupForms() {

  // Period form
  document
    .getElementById('savePeriodBtn')
    .addEventListener('click', () => {

      const start =
        document.getElementById('inputStart').value;

      const end =
        document.getElementById('inputEnd').value;

      const cycleLen =
        parseInt(
          document.getElementById('inputCycleLen').value
        ) || 28;

      if (!start) {
        showToast(
          'Veuillez saisir une date de début.'
        );
        return;
      }

      LunaDB.addPeriod(start, end);
      LunaDB.setCycleLength(cycleLen);

      renderCalendar();
      renderPhaseCard();
      checkAlerts();
      renderHealthNutrition();

      showToast(
        '✅ Période enregistrée !'
      );
    });

  // Journal new entry toggle
  document
    .getElementById('newEntryBtn')
    .addEventListener('click', () => {

      document
        .getElementById('entryForm')
        .classList.toggle('hidden');
    });

  document
    .getElementById('cancelEntry')
    .addEventListener('click', () => {

      document
        .getElementById('entryForm')
        .classList.add('hidden');
    });

  // Category change
  document
    .getElementById('entryCategory')
    .addEventListener('change', (e) => {

      const ill =
        document.getElementById('illnessTypeGroup');

      const fev =
        document.getElementById('feverGroup');

      ill.style.display =
        e.target.value === 'maladie'
          ? 'block'
          : 'none';

      fev.style.display =
        e.target.value === 'fievre'
          ? 'block'
          : 'none';
    });

  // Tag pickers
  document
    .querySelectorAll('.tag-picker')
    .forEach(picker => {

      picker.addEventListener('click', (e) => {

        const btn =
          e.target.closest('.tag-pick');

        if (!btn) return;

        const group =
          btn.dataset.group;

        if (group) {

          picker
            .querySelectorAll(
              `[data-group="${group}"]`
            )
            .forEach(b =>
              b.classList.remove('active')
            );

        } else {

          const multi =
            picker.dataset.multi !== 'false';

          if (!multi) {

            picker
              .querySelectorAll('.tag-pick')
              .forEach(b =>
                b.classList.remove('active')
              );
          }
        }

        btn.classList.toggle('active');

        if (btn.dataset.other) {

          const otherId =
            picker.id === 'illnessTags'
              ? 'illnessOther'
              : null;

          if (otherId) {

            document
              .getElementById(otherId)
              .classList.toggle(
                'hidden',
                !btn.classList.contains('active')
              );
          }
        }
      });
    });
      // Intensity picker
  document
    .getElementById('intensityPicker')
    .addEventListener('click', (e) => {

      const btn =
        e.target.closest('.int-btn');

      if (!btn) return;

      document
        .querySelectorAll('.int-btn')
        .forEach(b =>
          b.classList.remove('active')
        );

      btn.classList.add('active');
    });

  // Save journal entry
  document
    .getElementById('saveEntry')
    .addEventListener('click', () => {

      const date =
        document.getElementById('entryDate').value;

      const category =
        document.getElementById('entryCategory').value;

      const notes =
        document.getElementById('entryNotes').value;

      const intensity =
        document
          .querySelector('.int-btn.active')
          ?.dataset.val || null;

      if (!date) {
        showToast(
          'Veuillez choisir une date.'
        );
        return;
      }

      let illnessType = null;

      const activeIll =
        document.querySelector(
          '#illnessTags .tag-pick.active'
        );

      if (activeIll) {

        illnessType =
          activeIll.dataset.other
            ? (
                document.getElementById(
                  'illnessOther'
                ).value || 'autre'
              )
            : activeIll.dataset.val;
      }

      const fever =
        category === 'fievre'
          ? document.getElementById(
              'entryFever'
            ).value
          : null;

      LunaDB.addJournalEntry({
        date,
        category,
        notes,
        intensity,
        illnessType,
        fever
      });

      renderJournal();
      renderIllnessStats();
      renderCalendar(
        calYear,
        calMonth
      );

      // Reset
      document.getElementById(
        'entryNotes'
      ).value = '';

      document.getElementById(
        'entryFever'
      ).value = '';

      document
        .querySelectorAll('.int-btn')
        .forEach(b =>
          b.classList.remove('active')
        );

      document
        .querySelector(
          '#illnessTags .tag-pick.active'
        )
        ?.classList.remove('active');

      document
        .getElementById('entryForm')
        .classList.add('hidden');

      showToast(
        '✅ Entrée enregistrée !'
      );
    });

  // Journal filters
  document
    .querySelectorAll('.filter-btn')
    .forEach(btn => {

      btn.addEventListener('click', () => {

        document
          .querySelectorAll('.filter-btn')
          .forEach(b =>
            b.classList.remove('active')
          );

        btn.classList.add('active');

        renderJournal(
          btn.dataset.filter
        );
      });
    });

  // Health calc
  document
    .getElementById('calcHealthBtn')
    .addEventListener('click', () => {

      const h =
        parseFloat(
          document.getElementById(
            'healthHeight'
          ).value
        );

      const w =
        parseFloat(
          document.getElementById(
            'healthWeight'
          ).value
        );

      const age =
        parseInt(
          document.getElementById(
            'healthAge'
          ).value
        );

      const act =
        parseFloat(
          document.getElementById(
            'healthActivity'
          ).value
        );

      const goal =
        document
          .querySelector(
            '[data-group="goal"].active'
          )
          ?.dataset.val || 'maintien';

      if (!h || !w || !age) {

        showToast(
          'Remplissez tous les champs.'
        );

        return;
      }

      const res =
        LunaDB.calcHealth(
          h,
          w,
          age,
          act,
          goal
        );

      document.getElementById(
        'resIMC'
      ).textContent = res.imc;

      document.getElementById(
        'resIMCLabel'
      ).textContent = res.imcLabel;

      document.getElementById(
        'resCal'
      ).textContent = res.tdee;

      document.getElementById(
        'resPoideal'
      ).textContent =
        `${res.pMin}–${res.pMax}`;

      document
        .getElementById('healthResults')
        .classList.remove('hidden');
    });

  // Add weight
  document
    .getElementById('addWeightBtn')
    .addEventListener('click', () => {

      const date =
        document.getElementById(
          'weightDate'
        ).value;

      const val =
        parseFloat(
          document.getElementById(
            'weightVal'
          ).value
        );

      if (!date || !val) {

        showToast(
          'Date et poids requis.'
        );

        return;
      }

      LunaDB.addWeight(
        date,
        val
      );

      renderWeightList();
      renderWeightChart();

      document.getElementById(
        'weightVal'
      ).value = '';

      showToast(
        '✅ Poids enregistré !'
      );
    });

  // RDV
  document
    .getElementById('saveRdvBtn')
    .addEventListener(
      'click',
      saveRdv
    );

  document
    .getElementById('exportIcsBtn')
    .addEventListener(
      'click',
      exportCurrentIcs
    );

  // Print
  document
    .getElementById('printModalClose')
    .addEventListener(
      'click',
      () => {

        document
          .getElementById('printModal')
          .classList.add('hidden');
      }
    );

  document
    .getElementById('printModal')
    .addEventListener(
      'click',
      (e) => {

        if (
          e.target ===
          e.currentTarget
        ) {
          e.currentTarget
            .classList.add('hidden');
        }
      }
    );
}

function setupPrintBtn() {

  document
    .getElementById('printBtn')
    .addEventListener('click', () => {

      document
        .getElementById('printModal')
        .classList.remove('hidden');
    });
}

/* ---- JOURNAL ---- */

function renderJournal(
  filter = 'all'
) {

  const list =
    document.getElementById(
      'journalList'
    );

  let entries =
    LunaDB.getJournal();

  if (filter !== 'all') {

    entries =
      entries.filter(
        e =>
          e.category === filter
      );
  }

  if (!entries.length) {

    list.innerHTML = `
      <div
        style="
          text-align:center;
          padding:2rem;
          color:var(--text-hint);
          font-size:.9rem
        "
      >
        Aucune entrée pour le moment.<br>

        Appuyez sur
        <strong>
          + Nouvelle entrée
        </strong>.
      </div>
    `;

    return;
  }

  const icons = {
    periode: '🩸',
    symptome: '💊',
    maladie: '🤒',
    fievre: '🌡️',
    humeur: '😊',
    note: '📝'
  };

  const labels = {
    periode: 'Règles',
    symptome: 'Symptôme',
    maladie: 'Maladie',
    fievre: 'Fièvre',
    humeur: 'Humeur',
    note: 'Note'
  };

  list.innerHTML =
    entries
      .map(e => {

        const intensity =
          e.intensity
            ? `
              <div class="je-intensity">
                ${
                  [1,2,3,4,5]
                    .map(i =>
                      `
                      <span
                        class="
                          ie-dot
                          ${
                            i <= e.intensity
                              ? 'filled'
                              : 'empty'
                          }
                        "
                      ></span>
                      `
                    )
                    .join('')
                }
              </div>
            `
            : '';

        const subinfo =
          [
            e.illnessType,
            e.fever
              ? `${e.fever}°C`
              : null
          ]
          .filter(Boolean)
          .join(' · ');

        return `
          <div
            class="
              journal-entry
              ${e.category}
            "
          >

            <span class="je-icon">
              ${
                icons[e.category] ||
                '📝'
              }
            </span>

            <div class="je-info">

              <div class="je-date">
                ${
                  new Date(e.date)
                    .toLocaleDateString(
                      'fr-FR',
                      {
                        weekday:'short',
                        day:'numeric',
                        month:'short'
                      }
                    )
                }
              </div>

              <div class="je-title">
                ${
                  labels[e.category] ||
                  e.category
                }

                ${
                  subinfo
                    ? ' — ' + subinfo
                    : ''
                }
              </div>

              ${
                e.notes
                  ? `
                    <div class="je-notes">
                      ${e.notes}
                    </div>
                  `
                  : ''
              }

              ${intensity}

            </div>

            <button
              class="je-delete"
              onclick="
                deleteJournalEntry(
                  '${e.id}'
                )
              "
            >
              🗑
            </button>

          </div>
        `;
      })
      .join('');
}

function deleteJournalEntry(id) {

  LunaDB.deleteJournalEntry(id);

  renderJournal(
    document
      .querySelector(
        '.filter-btn.active'
      )
      ?.dataset.filter ||
      'all'
  );

  renderIllnessStats();

  renderCalendar(
    calYear,
    calMonth
  );
}

function renderIllnessStats() {

  const stats =
    LunaDB.getIllnessStats();

  const container =
    document.getElementById(
      'illnessStats'
    );

  if (!stats.length) {

    container.innerHTML = `
      <p
        style="
          color:var(--text-hint);
          font-size:.85rem
        "
      >
        Aucune maladie enregistrée.
      </p>
    `;

    return;
  }

  const icons = {
    rhume: '🤧',
    gastro: '🤢',
    angine: '😮‍💨',
    grippe: '🤒',
    sinusite: '👃',
    migraine: '🧠',
    autre: '🤕'
  };

  const max =
    stats[0][1];

  container.innerHTML =
    stats
      .map(
        ([type, count]) => `
          <div class="stat-row">

            <span class="stat-label">
              ${
                icons[type] ||
                '🤕'
              }
              ${
                type
                  .charAt(0)
                  .toUpperCase() +
                type.slice(1)
              }
            </span>

            <div
              class="stat-bar-wrap"
            >
              <div
                class="stat-bar"
                style="
                  width:${(
                    count / max * 100
                  )}%
                "
              ></div>
            </div>

            <span class="stat-count">
              ${count}
            </span>

          </div>
        `
      )
      .join('');
}

/* ---- HEALTH & WEIGHT ---- */

/* ---------------------------------------------------------
   ALIMENTATION SELON LA PHASE (avec lecture à voix haute)
   --------------------------------------------------------- */

/* Texte lu pour une phase : titre, aliments, astuce, calories */
function lunaNutritionSpeechText(info, intro) {

  const end = (t) => {
    t = String(t || '').trim();
    return /[.!?]$/.test(t) ? t : t + '.';
  };

  return [
    intro,
    info.label,
    info.foods,
    info.tip,
    'Calories : ' + info.calories
  ]
    .filter(Boolean)
    .map(end)
    .join(' ');
}

function lunaReadNutrition(phaseKey) {

  const info = LunaDB.getNutritionByPhase(phaseKey);

  lunaReadAloud(
    'nutri:' + phaseKey,
    lunaNutritionSpeechText(info, '')
  );
}

function lunaReadNutritionToday() {

  const data = LunaDB.calcCycleData();

  if (!data) return;

  const info =
    LunaDB.getNutritionByPhase(data.phase);

  lunaReadAloud(
    'nutri:today',
    lunaNutritionSpeechText(
      info,
      'Voici tes conseils du jour.'
    )
  );
}

function renderHealthNutrition() {

  const data = LunaDB.calcCycleData();

  const rawPhase =
    data ? data.phase : 'folliculaire';

  /* "ovulation" et "fertile" utilisent la même carte */
  const phase =
    rawPhase === 'ovulation' ? 'fertile' : rawPhase;

  const allPhases = [
    'menstruation',
    'folliculaire',
    'fertile',
    'luteale'
  ];

  const container =
    document.getElementById('cycleNutrition');

  const todayButton =
    data
      ? `
        <button
          type="button"
          class="read-btn read-btn-big"
          data-read-key="nutri:today"
          data-label="🔊 Écouter mes conseils du jour"
          onclick="lunaReadNutritionToday()"
        >🔊 Écouter mes conseils du jour</button>
      `
      : '';

  container.innerHTML =
    todayButton +
    allPhases
      .map(p => {

        const info =
          LunaDB.getNutritionByPhase(p);

        const isActive = p === phase;

        return `
          <div class="cn-phase ${isActive ? 'active-phase' : ''}">
            ${
              isActive
                ? '<span class="cn-badge">Phase actuelle</span>'
                : ''
            }
            <div class="cn-title" style="color:${info.color}">
              ${info.label}
            </div>
            <div class="cn-foods" style="margin-bottom:.3rem">
              ${
                info.foods.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong>$1</strong>'
                )
              }
            </div>
            <div style="font-size:.78rem;color:var(--text-hint)">
              💡 ${info.tip}
            </div>
            <div
              style="
                font-size:.78rem;
                color:var(--text-muted);
                margin-top:.2rem
              "
            >
              ⚡ Calories : ${info.calories}
            </div>
            <button
              type="button"
              class="read-btn"
              data-read-key="nutri:${p}"
              data-label="🔊 Écouter"
              onclick="lunaReadNutrition('${p}')"
            >🔊 Écouter</button>
          </div>
        `;
      })
      .join('');

  lunaRefreshReadButtons();
}

function renderWeightList() {

  const weights =
    LunaDB
      .getWeights()
      .slice()
      .reverse();

  const list =
    document.getElementById(
      'weightList'
    );

  if (!weights.length) {

    list.innerHTML = `
      <p
        style="
          color:var(--text-hint);
          font-size:.85rem;
          text-align:center;
          padding:.5rem
        "
      >
        Aucune donnée de poids.
      </p>
    `;

    return;
  }

  list.innerHTML =
    weights
      .slice(0, 8)
      .map(
        w => `
          <div class="wl-row">

            <span class="wl-date">
              ${
                new Date(w.date)
                  .toLocaleDateString(
                    'fr-FR',
                    {
                      day:'numeric',
                      month:'short',
                      year:'numeric'
                    }
                  )
              }
            </span>

            <span class="wl-val">
              ${w.value} kg
            </span>

            <button
              class="wl-del"
              onclick="
                deleteWeight(
                  '${w.date}'
                )
              "
            >
              ✕
            </button>

          </div>
        `
      )
      .join('');

  renderWeightChart();
}

function deleteWeight(date) {

  LunaDB.deleteWeight(date);

  renderWeightList();
}

function renderWeightChart() {

  const canvas =
    document.getElementById(
      'weightChart'
    );

  const weights =
    LunaDB.getWeights();

  if (weights.length < 2) {

    canvas.style.display =
      'none';

    return;
  }

  canvas.style.display =
    'block';

  const ctx =
    canvas.getContext('2d');

  const W =
    canvas.offsetWidth || 300;

  const H = 140;

  canvas.width = W;
  canvas.height = H;

  const vals =
    weights.map(
      w => w.value
    );

  const min =
    Math.min(...vals) - 1;

  const max =
    Math.max(...vals) + 1;

  const n =
    weights.length;

  const isDark =
    document.documentElement
      .getAttribute(
        'data-theme'
      ) === 'dark';

  const lineColor =
    '#9b7fe8';

  const textColor =
    isDark
      ? 'rgba(240,234,254,.45)'
      : 'rgba(26,15,46,.4)';

  const gridColor =
    isDark
      ? 'rgba(155,127,232,.12)'
      : 'rgba(124,77,206,.1)';

  ctx.clearRect(
    0,
    0,
    W,
    H
  );

  const pad = {
    l: 36,
    r: 12,
    t: 12,
    b: 28
  };

  const chartW =
    W -
    pad.l -
    pad.r;

  const chartH =
    H -
    pad.t -
    pad.b;

  const xPos =
    i =>
      pad.l +
      (i / (n - 1)) *
      chartW;

  const yPos =
    v =>
      pad.t +
      chartH -
      (
        (v - min) /
        (max - min)
      ) *
      chartH;

  // Grid
  ctx.strokeStyle =
    gridColor;

  ctx.lineWidth = 1;

  [0,.25,.5,.75,1]
    .forEach(t => {

      const y =
        pad.t +
        t * chartH;

      ctx.beginPath();

      ctx.moveTo(
        pad.l,
        y
      );

      ctx.lineTo(
        W - pad.r,
        y
      );

      ctx.stroke();

      const v =
        (
          max -
          (
            t *
            (max - min)
          )
        ).toFixed(1);

      ctx.fillStyle =
        textColor;

      ctx.font =
        '10px DM Sans, sans-serif';

      ctx.textAlign =
        'right';

      ctx.fillText(
        v,
        pad.l - 4,
        y + 3
      );
    });

  // Line
  ctx.beginPath();

  weights.forEach(
    (w, i) => {

      const x =
        xPos(i);

      const y =
        yPos(w.value);

      if (i === 0)
        ctx.moveTo(x, y);
      else
        ctx.lineTo(x, y);
    }
  );

  ctx.strokeStyle =
    lineColor;

  ctx.lineWidth =
    2.5;

  ctx.lineJoin =
    'round';

  ctx.stroke();

  // Area fill
  ctx.beginPath();

  weights.forEach(
    (w, i) => {

      const x =
        xPos(i);

      const y =
        yPos(w.value);

      if (i === 0)
        ctx.moveTo(x, y);
      else
        ctx.lineTo(x, y);
    }
  );

  ctx.lineTo(
    xPos(n - 1),
    H - pad.b
  );

  ctx.lineTo(
    xPos(0),
    H - pad.b
  );

  ctx.closePath();

  const grad =
    ctx.createLinearGradient(
      0,
      pad.t,
      0,
      H - pad.b
    );

  grad.addColorStop(
    0,
    'rgba(155,127,232,.25)'
  );

  grad.addColorStop(
    1,
    'rgba(155,127,232,.0)'
  );

  ctx.fillStyle =
    grad;

  ctx.fill();

  // Dots + labels
  weights.forEach(
    (w, i) => {

      const x =
        xPos(i);

      const y =
        yPos(w.value);

      ctx.beginPath();

      ctx.arc(
        x,
        y,
        3.5,
        0,
        Math.PI * 2
      );

      ctx.fillStyle =
        lineColor;

      ctx.fill();

      if (n <= 10) {

        const label =
          new Date(w.date)
            .toLocaleDateString(
              'fr-FR',
              {
                day:'2-digit',
                month:'2-digit'
              }
            );

        ctx.fillStyle =
          textColor;

        ctx.font =
          '9px DM Sans, sans-serif';

        ctx.textAlign =
          'center';

        ctx.fillText(
          label,
          x,
          H - 4
        );
      }
    }
  );
}

/* ---- RDV ---- */

function saveRdv() {

  const title =
    document
      .getElementById(
        'rdvTitle'
      )
      .value
      .trim();

  const date =
    document.getElementById(
      'rdvDate'
    ).value;

  const time =
    document.getElementById(
      'rdvTime'
    ).value;

  const place =
    document
      .getElementById(
        'rdvPlace'
      )
      .value
      .trim();

  const notes =
    document
      .getElementById(
        'rdvNotes'
      )
      .value
      .trim();

  const type =
    document
      .querySelector(
        '[data-group="rdvtype"].active'
      )
      ?.dataset.val ||
    'autre';

  if (!title || !date) {

    showToast(
      'Titre et date obligatoires.'
    );

    return;
  }

  LunaDB.addRdv({
    title,
    date,
    time,
    place,
    notes,
    type
  });

  renderRdvList();

  renderCalendar(
    calYear,
    calMonth
  );

  // Reset
  [
    'rdvTitle',
    'rdvPlace',
    'rdvNotes'
  ].forEach(
    id =>
      document.getElementById(
        id
      ).value = ''
  );

  showToast(
    '✅ Rendez-vous enregistré !'
  );
}

function exportCurrentIcs() {

  const title =
    document
      .getElementById(
        'rdvTitle'
      )
      .value
      .trim();

  const date =
    document.getElementById(
      'rdvDate'
    ).value;

  const time =
    document.getElementById(
      'rdvTime'
    ).value ||
    '09:00';

  const place =
    document
      .getElementById(
        'rdvPlace'
      )
      .value
      .trim();

  const notes =
    document
      .getElementById(
        'rdvNotes'
      )
      .value
      .trim();

  if (!title || !date) {

    showToast(
      'Remplissez le titre et la date d\'abord.'
    );

    return;
  }

  const tmpRdv = {
    id: Date.now().toString(),
    title,
    date,
    time,
    place,
    notes
  };

  const ics =
    LunaDB.generateICS(
      tmpRdv
    );

  downloadFile(
    `rdv-${date}-luna.ics`,
    ics,
    'text/calendar'
  );

  showToast(
    '📅 Fichier .ics téléchargé ! Ouvrez-le avec Google Calendar.'
  );
}

function renderRdvList() {

  const rdvs =
    LunaDB.getRdv();

  const list =
    document.getElementById(
      'rdvList'
    );

  const today = lunaGetLocalDateISO();

  if (!rdvs.length) {

    list.innerHTML = `
      <p
        style="
          color:var(--text-hint);
          font-size:.85rem;
          text-align:center;
          padding:1rem
        "
      >
        Aucun rendez-vous.
      </p>
    `;

    return;
  }

  const moisFr = [
    'jan',
    'fév',
    'mar',
    'avr',
    'mai',
    'jun',
    'jul',
    'aoû',
    'sep',
    'oct',
    'nov',
    'déc'
  ];

  list.innerHTML =
    rdvs
      .map(r => {

        const d =
          new Date(
            r.date +
            'T00:00:00'
          );

        const isPast =
          r.date < today;

        return `
          <div
            class="rdv-card"
            style="
              opacity:
                ${isPast ? '.6' : '1'}
            "
          >

            <div
              class="rdv-date-block"
            >
              <div
                class="rdv-day"
              >
                ${d.getDate()}
              </div>

              <div
                class="rdv-month"
              >
                ${
                  moisFr[
                    d.getMonth()
                  ]
                }
              </div>
            </div>

            <div
              class="rdv-info"
            >

              <div
                class="rdv-title"
              >
                ${
                  escHtml(
                    r.title
                  )
                }
              </div>

              <div
                class="rdv-time"
              >
                ${r.time || ''}

                ${
                  r.place
                    ? '· ' +
                      escHtml(
                        r.place
                      )
                    : ''
                }
              </div>

              ${
                r.notes
                  ? `
                    <div
                      class="rdv-place"
                    >
                      ${
                        escHtml(
                          r.notes
                        )
                      }
                    </div>
                  `
                  : ''
              }

            </div>

            <div
              class="rdv-actions"
            >

              <button
                class="rdv-ics"
                onclick="
                  exportRdvIcs(
                    '${r.id}'
                  )
                "
              >
                📅 .ics
              </button>

              <button
                class="rdv-del"
                onclick="
                  deleteRdv(
                    '${r.id}'
                  )
                "
              >
                🗑
              </button>

            </div>

          </div>
        `;
      })
      .join('');
}

function exportRdvIcs(id) {

  const rdv =
    LunaDB
      .getRdv()
      .find(
        r => r.id === id
      );

  if (!rdv) return;

  const ics =
    LunaDB.generateICS(
      rdv
    );

  downloadFile(
    `rdv-${rdv.date}-luna.ics`,
    ics,
    'text/calendar'
  );

  showToast(
    '📅 .ics téléchargé ! Ouvrez avec Google Calendar.'
  );
}

function deleteRdv(id) {

  LunaDB.deleteRdv(id);

  renderRdvList();

  renderCalendar(
    calYear,
    calMonth
  );
}

/* ---- PRINT ---- */

function printSection(section) {

  document
    .getElementById(
      'printModal'
    )
    .classList.add('hidden');

  const content =
    LunaDB.generatePrintContent(
      section
    );

  const w =
    window.open(
      '',
      '_blank'
    );

  w.document.write(`
    <!DOCTYPE html>

    <html>
      <head>

        <meta charset="UTF-8">

        <title>
          Luna — Rapport
        </title>

        <style>

          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 2rem auto;
            color: #000;
          }

          h1,
          h2 {
            font-family: Georgia, serif;
          }

          h2 {
            margin-top: 2rem;
            border-bottom: 1px solid #ccc;
            padding-bottom: .3rem;
          }

          table {
            width: 100%;
            border-collapse: collapse;
          }

          th,
          td {
            border: 1px solid #ccc;
            padding: .5rem .7rem;
            text-align: left;
          }

          th {
            background: #f5f5f5;
          }

          tr:nth-child(even) {
            background: #fafafa;
          }

        </style>

      </head>

      <body>

        ${content}

      </body>

    </html>
  `);

  w.document.close();

  setTimeout(
    () => w.print(),
    500
  );
}

/* ---- UTILS ---- */

function fmtShortDate(d) {

  if (!d) return '—';

  return d.toLocaleDateString(
    'fr-FR',
    {
      day: 'numeric',
      month: 'short'
    }
  );
}

function escHtml(str) {

  return String(str)
    .replace(
      /&/g,
      '&amp;'
    )
    .replace(
      /</g,
      '&lt;'
    )
    .replace(
      />/g,
      '&gt;'
    )
    .replace(
      /"/g,
      '&quot;'
    );
}

function downloadFile(
  filename,
  content,
  mimeType
) {

  const blob =
    new Blob(
      [content],
      {
        type: mimeType
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const a =
    document.createElement(
      'a'
    );

  a.href = url;
  a.download = filename;
  a.click();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        url
      ),
    1000
  );
}

let toastTimeout;

function showToast(msg) {

  let toast =
    document.getElementById(
      'lunaToast'
    );

  if (!toast) {

    toast =
      document.createElement(
        'div'
      );

    toast.id =
      'lunaToast';

    toast.style.cssText = `
      position:fixed;
      bottom:calc(
        80px +
        env(
          safe-area-inset-bottom,
          0
        ) +
        12px
      );
      left:50%;
      transform:
        translateX(-50%);
      background:var(--bg-card);
      color:var(--text);
      border:
        1px solid
        var(--border-strong);
      padding:.65rem 1.2rem;
      border-radius:100px;
      font-size:.85rem;
      box-shadow:
        var(--shadow-md);
      z-index:300;
      white-space:nowrap;
      transition:
        opacity .3s;
      font-family:
        var(--font-body);
    `;

    document.body.appendChild(
      toast
    );
  }

  toast.textContent =
    msg;

  toast.style.opacity =
    '1';

  clearTimeout(
    toastTimeout
  );

  toastTimeout =
    setTimeout(
      () => {
        toast.style.opacity =
          '0';
      },
      2800
    );
}
/* =========================================================
   LUNA — MODE VOCAL
   Saisie vocale des règles
   ========================================================= */

let lunaVoiceRecognition = null;
let lunaVoicePendingDate = null;
let lunaVoiceState = 'idle';
let lunaVoicePendingWord = 'aujourd’hui';


/* ---------------------------------------------------------
   INITIALISATION DU MODE VOCAL
   --------------------------------------------------------- */

function setupVoiceMode() {

  // Évite de créer deux fois le module vocal
  if (document.getElementById('lunaVoiceCard')) return;

  // Le calendrier existe dans index.html sous cet identifiant
  const calendarTab = document.getElementById('tab-calendar');

  if (!calendarTab) {
    console.warn('Luna : onglet calendrier introuvable.');
    return;
  }

  const card = document.createElement('div');

  card.id = 'lunaVoiceCard';

  card.innerHTML = `
    <div class="luna-voice-header">

      <div class="luna-voice-icon">
        🎙️
      </div>

      <div>
        <h2>Parler à Luna</h2>
        <p>
          Dis un mot simple : « règles ».
        </p>
      </div>

    </div>

    <button
      type="button"
      id="lunaVoiceButton"
      class="luna-voice-main-button"
    >
      🎙️
      <span>Parler à Luna</span>
    </button>

    <div
      id="lunaVoiceStatus"
      class="luna-voice-status"
    >
      Appuie sur le bouton, puis dis « règles » (ou n’importe quel mot).
    </div>

    <div
      id="lunaVoiceConfirmation"
      class="luna-voice-confirmation hidden"
    >

      <div class="luna-voice-confirm-title">
        Confirmer l'enregistrement
      </div>

      <div
        id="lunaVoiceConfirmationText"
        class="luna-voice-confirm-text"
      >
        Est-ce bien aujourd'hui ?
      </div>

      <div class="luna-voice-confirm-buttons">

        <button
          type="button"
          id="lunaVoiceYes"
          class="luna-voice-yes"
        >
          ✅ OUI
        </button>

        <button
          type="button"
          id="lunaVoiceNo"
          class="luna-voice-no"
        >
          ❌ NON
        </button>

      </div>

    </div>

    <button
      type="button"
      id="lunaVoiceDirectPeriod"
      class="luna-voice-direct-button"
    >
      🩸 J'ai mes règles aujourd'hui
    </button>
  `;

  /*
   * On place le module vocal tout en haut
   * de l'onglet calendrier.
   */
  calendarTab.insertBefore(card, calendarTab.firstChild);

  addLunaVoiceStyles();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      lunaStopListening();
      lunaStopSpeaking();
    }
  });


  /* -------------------------------------------------------
     BOUTON PRINCIPAL
     ------------------------------------------------------- */

  document
    .getElementById('lunaVoiceButton')
    .addEventListener('click', startLunaVoice);


  /* -------------------------------------------------------
     BOUTONS OUI / NON
     ------------------------------------------------------- */

  document
    .getElementById('lunaVoiceYes')
    .addEventListener('click', () => {
      confirmLunaVoice(true);
    });

  document
    .getElementById('lunaVoiceNo')
    .addEventListener('click', () => {
      confirmLunaVoice(false);
    });


  /* -------------------------------------------------------
     BOUTON DIRECT
     ------------------------------------------------------- */

  document
    .getElementById('lunaVoiceDirectPeriod')
    .addEventListener('click', () => askLunaPeriodConfirmation());


  /* -------------------------------------------------------
     TEST DE COMPATIBILITÉ
     ------------------------------------------------------- */

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {

    setLunaVoiceStatus(lunaVoiceErrorMessage('unsupported'));
  }
}


/* ---------------------------------------------------------
   DATE LOCALE DU TÉLÉPHONE
   --------------------------------------------------------- */

function lunaGetLocalDateISO(date) {

  const now = date ? new Date(date) : new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    now.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}


/* ---------------------------------------------------------
   DATE LISIBLE
   --------------------------------------------------------- */

function lunaGetReadableDate(dateISO) {

  const date = dateISO
    ? new Date(dateISO + 'T12:00:00')
    : new Date();

  return date.toLocaleDateString(
    'fr-FR',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  );
}


/* =========================================================
   VOIX DE LUNA (synthèse vocale) + RÉGLAGES
   ========================================================= */

const LUNA_VOICE_KEY = 'luna_voice_name';
const LUNA_RATE_KEY = 'luna_voice_rate';
const LUNA_TAPSPEAK_KEY = 'luna_speak_taps';

function lunaStoreGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v;
  } catch (e) {
    return fallback;
  }
}

function lunaStoreSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}

/*
 * Réglages choisis par l'utilisatrice :
 * la voix (par son nom) et la vitesse.
 */
function lunaGetVoiceSettings() {

  let rate = parseFloat(lunaStoreGet(LUNA_RATE_KEY, '0.95'));

  if (!isFinite(rate)) rate = 0.95;

  rate = Math.min(1.4, Math.max(0.5, rate));

  return {
    voice: lunaStoreGet(LUNA_VOICE_KEY, ''),
    rate: rate
  };
}

function lunaIsFrenchVoice(v) {
  return String((v && v.lang) || '')
    .replace('_', '-')
    .toLowerCase()
    .startsWith('fr');
}

/* Android écrit parfois "fr_FR" au lieu de "fr-FR" */
function lunaGetFrenchVoices() {

  if (!('speechSynthesis' in window)) return [];

  const voices =
    window.speechSynthesis.getVoices() || [];

  return voices.filter(lunaIsFrenchVoice);
}

function lunaGetFrenchVoice() {

  const french = lunaGetFrenchVoices();

  if (!french.length) return null;

  const saved = lunaGetVoiceSettings().voice;

  if (saved) {
    const chosen =
      french.find(v =>
        v.voiceURI === saved || v.name === saved
      );
    if (chosen) return chosen;
  }

  return (
    french.find(v =>
      String(v.lang).replace('_', '-') === 'fr-FR'
    ) ||
    french[0]
  );
}

/*
 * On garde une référence à la phrase en cours :
 * sinon Chrome / Android peuvent la "ramasser" avant
 * la fin et l'évènement onend n'arrive jamais.
 */
let lunaCurrentUtterance = null;
let lunaSpeechTimer = null;

/* Clé de la lecture longue en cours (ex. "nutri:luteale") */
let lunaReadingKey = null;

/*
 * Arrête la voix SANS déclencher le callback de fin
 * (sinon "annuler" lancerait l'écoute à tort).
 * Si ce n'est pas une suite de lecture, on remet
 * aussi les boutons 🔊 à leur état normal.
 */
function lunaStopSpeaking(keepReading) {

  clearTimeout(lunaSpeechTimer);

  if (lunaCurrentUtterance) {
    lunaCurrentUtterance.onend = null;
    lunaCurrentUtterance.onerror = null;
  }

  lunaCurrentUtterance = null;

  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }

  if (!keepReading && lunaReadingKey) {
    lunaReadingKey = null;
    lunaRefreshReadButtons();
  }
}

function lunaSpeak(text, onEnd, keepReading) {

  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(lunaSpeechTimer);
    lunaCurrentUtterance = null;
    if (typeof onEnd === 'function') onEnd();
  };

  if (
    !('speechSynthesis' in window) ||
    typeof SpeechSynthesisUtterance === 'undefined'
  ) {
    finish();
    return;
  }

  lunaStopSpeaking(keepReading);

  const settings = lunaGetVoiceSettings();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = 'fr-FR';

  const voice = lunaGetFrenchVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'fr-FR';
  }

  utterance.rate = settings.rate;
  utterance.pitch = 1;
  utterance.volume = 1;

  utterance.onend = finish;
  utterance.onerror = finish;

  lunaCurrentUtterance = utterance;

  /*
   * Filet de sécurité : si le navigateur ne signale
   * jamais la fin de la phrase, on continue quand même.
   * (La durée dépend de la vitesse choisie.)
   */
  lunaSpeechTimer = setTimeout(
    finish,
    Math.max(4000, (text.length * 110 + 2000) / settings.rate)
  );

  /*
   * Petit délai après cancel() : certains navigateurs
   * ignorent un speak() lancé immédiatement après.
   */
  setTimeout(() => {
    if (lunaCurrentUtterance !== utterance) return;
    try {
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      finish();
    }
  }, 80);
}


/* ---------------------------------------------------------
   PRÉPARER UN TEXTE POUR ÊTRE LU À VOIX HAUTE
   (sans emojis, avec les abréviations dites en toutes lettres)
   --------------------------------------------------------- */

function lunaPrepareSpeech(text) {

  let t = String(text || '');

  t = t.replace(/<[^>]*>/g, ' ');
  t = t.replace(/\*\*/g, '');

  /* emojis et symboles décoratifs */
  t = t.replace(
    /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu,
    ' '
  );

  /* "j. 6-13" -> "jours 6 à 13" */
  t = t.replace(
    /\bj\.\s*(\d+)\s*-\s*(\d+)/gi,
    'jours $1 à $2'
  );

  /* calories */
  t = t.replace(
    /\+\s*(\d+)\s*à\s*\+?\s*(\d+)\s*kcal/gi,
    (m, a, b) =>
      Number(a) === 0
        ? 'jusqu’à ' + b + ' kilocalories en plus'
        : 'de ' + a + ' à ' + b + ' kilocalories en plus'
  );
  t = t.replace(/\+\s*0\s*kcal/gi, 'pas de calories en plus');
  t = t.replace(/\+\s*(\d+)\s*kcal/gi, '$1 kilocalories en plus');
  t = t.replace(/\bkcal\b/gi, 'kilocalories');

  /* pourcentages : "70%+" */
  t = t.replace(/(\d+)\s*%\s*\+/g, '$1 pour cent ou plus');
  t = t.replace(/%/g, ' pour cent');

  /* vitamines, oméga */
  t = t.replace(/\bB\s?12\b/g, 'B douze');
  t = t.replace(/\bB\s?6\b/g, 'B six');
  t = t.replace(/\bB\s?9\b/g, 'B neuf');
  t = t.replace(/oméga[\s-]?3/gi, 'oméga trois');

  /* tirets longs et parenthèses = petites pauses */
  t = t.replace(/\s[—–]\s/g, ', ');
  t = t.replace(/\s*\(\s*/g, ', ');
  t = t.replace(/\s*\)\s*/g, ', ');

  /* nettoyage de la ponctuation */
  t = t.replace(/\s+/g, ' ');
  t = t.replace(/,\s*,+/g, ',');
  t = t.replace(/,\s*([.!?:;])/g, '$1');
  t = t.replace(/([.!?])\s*\./g, '$1');
  t = t.replace(/\s+([,.!?:;])/g, '$1');

  return t.trim();
}

/*
 * Découpe en morceaux courts : Chrome coupe les
 * phrases trop longues au bout d'environ 15 secondes.
 */
function lunaSplitForSpeech(text) {

  const sentences =
    (String(text).match(/[^.!?]+[.!?]*/g) || [text])
      .map(s => s.trim())
      .filter(Boolean);

  const parts = [];

  sentences.forEach(sentence => {

    if (sentence.length <= 170) {
      parts.push(sentence);
      return;
    }

    let current = '';

    sentence.split(/,\s*/).forEach(piece => {
      if ((current + ', ' + piece).length > 150 && current) {
        parts.push(current);
        current = piece;
      } else {
        current = current ? current + ', ' + piece : piece;
      }
    });

    if (current) parts.push(current);
  });

  return parts;
}

function lunaRefreshReadButtons() {

  document.querySelectorAll('[data-read-key]').forEach(btn => {

    const on = btn.dataset.readKey === lunaReadingKey;

    btn.classList.toggle('reading', on);

    btn.textContent =
      on ? '⏹ Arrêter' : (btn.dataset.label || '🔊 Écouter');
  });
}

/*
 * Lit un long texte, morceau par morceau.
 * Un deuxième appui sur le même bouton arrête la lecture.
 */
function lunaReadAloud(key, text, onDone) {

  if (lunaReadingKey === key) {
    lunaStopSpeaking();
    return;
  }

  const parts =
    lunaSplitForSpeech(lunaPrepareSpeech(text));

  lunaStopSpeaking();

  lunaReadingKey = key;

  lunaRefreshReadButtons();

  const next = (i) => {

    if (lunaReadingKey !== key) return;

    if (i >= parts.length) {
      lunaReadingKey = null;
      lunaRefreshReadButtons();
      if (typeof onDone === 'function') onDone();
      return;
    }

    lunaSpeak(parts[i], () => next(i + 1), true);
  };

  next(0);
}


/* ---------------------------------------------------------
   STATUT VOCAL
   --------------------------------------------------------- */

function setLunaVoiceStatus(text) {

  const status =
    document.getElementById('lunaVoiceStatus');

  if (status) {
    status.textContent = text;
  }
}


/* ---------------------------------------------------------
   NORMALISATION DU TEXTE
   (minuscules, sans accents, sans apostrophes ni tirets)
   --------------------------------------------------------- */

function lunaNormalizeVoiceText(text) {

  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’'`´\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/* ---------------------------------------------------------
   ÉCOUTE (reconnaissance vocale)
   --------------------------------------------------------- */

function lunaSetListeningUI(on) {

  const btn =
    document.getElementById('lunaVoiceButton');

  if (!btn) return;

  btn.classList.toggle('listening', on);

  const label = btn.querySelector('span');

  if (label) {
    label.textContent =
      on
        ? 'J’écoute… (touche pour arrêter)'
        : 'Parler à Luna';
  }
}

/*
 * Coupe proprement l'écoute en cours.
 * On retire d'abord les handlers : sinon l'ancien
 * onend viendrait écraser l'état de la nouvelle écoute.
 */
function lunaStopListening() {

  if (lunaVoiceRecognition) {

    const r = lunaVoiceRecognition;

    r.onresult = null;
    r.onend = null;
    r.onerror = null;

    try {
      r.abort();
    } catch (e) {
      try { r.stop(); } catch (e2) {}
    }

    lunaVoiceRecognition = null;
  }

  lunaSetListeningUI(false);
}

function lunaVoiceErrorMessage(code) {

  switch (code) {

    case 'not-allowed':
    case 'service-not-allowed':
      return 'Le microphone n’est pas autorisé. Autorise-le dans les réglages du navigateur.';

    case 'no-speech':
      return 'Je n’ai rien entendu. Parle un peu plus fort puis réessaie.';

    case 'audio-capture':
      return 'Le microphone semble indisponible.';

    case 'network':
      return 'La reconnaissance vocale a besoin d’une connexion Internet.';

    case 'insecure':
      return 'Le micro ne fonctionne que sur une page sécurisée (https). Utilise le bouton « J’ai mes règles aujourd’hui ».';

    case 'unsupported':
      return 'La reconnaissance vocale n’est pas disponible ici. Utilise le bouton « J’ai mes règles aujourd’hui ».';

    default:
      return 'Je n’ai pas réussi à t’entendre. Tu peux réessayer.';
  }
}

/*
 * Écoute une seule phrase.
 *  onResult(alternatives)  → liste des hypothèses du micro
 *  onFail(code)            → erreur / rien entendu
 */
function lunaListen(onResult, onFail) {

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {
    onFail('unsupported');
    return;
  }

  if (window.isSecureContext === false) {
    onFail('insecure');
    return;
  }

  lunaStopListening();

  const rec = new Recognition();

  lunaVoiceRecognition = rec;

  rec.lang = 'fr-FR';
  rec.continuous = false;
  rec.interimResults = false;
  rec.maxAlternatives = 3;

  let gotResult = false;

  rec.onresult = (event) => {

    gotResult = true;

    const alternatives = [];

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {
      for (let j = 0; j < event.results[i].length; j++) {
        const t = (event.results[i][j].transcript || '').trim();
        if (t) alternatives.push(t);
      }
    }

    lunaStopListening();
    onResult(alternatives);
  };

  rec.onerror = (event) => {

    if (lunaVoiceRecognition !== rec) return;

    lunaStopListening();
    onFail(event.error || 'error');
  };

  rec.onend = () => {

    if (lunaVoiceRecognition !== rec) return;

    lunaStopListening();

    if (!gotResult) onFail('no-speech');
  };

  try {
    rec.start();
    lunaSetListeningUI(true);
  } catch (error) {
    console.warn('Luna voice start error:', error);
    lunaStopListening();
    onFail('start-failed');
  }
}


/* ---------------------------------------------------------
   BOUTON "PARLER À LUNA"
   --------------------------------------------------------- */

function startLunaVoice() {

  /*
   * Deuxième appui pendant l'écoute = on arrête.
   */
  if (lunaVoiceRecognition) {

    lunaStopListening();

    if (lunaVoiceState === 'listening') {
      lunaVoiceState = 'idle';
    }

    setLunaVoiceStatus('Écoute arrêtée.');
    return;
  }

  /*
   * Si Luna attend un oui / non, le micro sert à répondre.
   */
  if (
    lunaVoiceState === 'waiting-confirmation' &&
    lunaVoicePendingDate
  ) {
    lunaStopSpeaking();
    lunaListenForAnswer(0);
    return;
  }

  lunaStopSpeaking();

  lunaVoiceState = 'listening';

  setLunaVoiceStatus('🎧 Je t’écoute…');

  lunaListen(

    (alternatives) => {

      lunaVoiceState = 'idle';

      setLunaVoiceStatus(
        'Tu as dit : « ' + alternatives[0] + ' »'
      );

      handleLunaVoiceCommand(alternatives);
    },

    (code) => {

      lunaVoiceState = 'idle';

      const message =
        lunaVoiceErrorMessage(code);

      setLunaVoiceStatus(message);

      if (code === 'unsupported' || code === 'insecure') {
        lunaSpeak(message);
      }
    }
  );
}


/* ---------------------------------------------------------
   INTERPRÉTATION DE LA PHRASE
   --------------------------------------------------------- */

/*
 * Mots simples. Le micro se trompe souvent sur les mots isolés
 * ("règles" peut devenir "règle", "reg", "raigle"…), donc on
 * reste volontairement très large.
 */
const LUNA_PERIOD_RE =
  /\b(re ?i?gles?|regl\w*|raigles?|ragles?|reg|rail|menstru\w*|periodes?|sang|saigne\w*|debut|mes|luna)\b/;

/* "je n'ai pas mes règles", "plus de règles"… */
const LUNA_NEGATION_RE =
  /\b(pas|plus|jamais|aucune?)\b(?:\s+\w+){0,3}?\s+(?:re ?i?gles?|menstruations?|periodes?)\b/;

/* Refus dit d'emblée : "non", "stop", "annule"… */
const LUNA_REFUSE_RE =
  /^(non|nan|nom|no|none|nope|pas|annule\w*|stop|rien|jamais|laisse tomber)\b/;

/*
 * Date demandée à l'oral :
 * "aujourd'hui" (par défaut), "hier", "avant-hier".
 */
function lunaParseVoiceDate(normalized) {

  const d = new Date();
  d.setHours(12, 0, 0, 0);

  if (/\bavant ?hier\b/.test(normalized)) {
    d.setDate(d.getDate() - 2);
    return { iso: lunaGetLocalDateISO(d), word: 'avant-hier' };
  }

  if (/\bhier\b/.test(normalized)) {
    d.setDate(d.getDate() - 1);
    return { iso: lunaGetLocalDateISO(d), word: 'hier' };
  }

  return { iso: lunaGetLocalDateISO(), word: 'aujourd’hui' };
}

/*
 * Règle d'or : Elisa peut dire UN SEUL mot simple
 * ("règles", "oui", "Luna"…) ou même un mot mal reconnu.
 *
 * Luna ne répond jamais "je n'ai pas compris" :
 * elle pose simplement la question
 * "Tu as tes règles aujourd'hui ? oui ou non".
 * Rien n'est enregistré sans un "oui".
 *
 * Seul un refus clair ("non", "pas mes règles") annule.
 */
function handleLunaVoiceCommand(input) {

  const list =
    (Array.isArray(input) ? input : [input])
      .map(lunaNormalizeVoiceText)
      .filter(Boolean);

  const best = list[0] || '';

  if (
    LUNA_REFUSE_RE.test(best) ||
    LUNA_NEGATION_RE.test(best)
  ) {

    setLunaVoiceStatus(
      'D’accord, je n’enregistre rien.'
    );

    lunaSpeak('D’accord. Je n’enregistre rien.');

    return;
  }

  const when =
    lunaParseVoiceDate(list.join(' '));

  const understood =
    list.some(n => LUNA_PERIOD_RE.test(n));

  askLunaPeriodConfirmation(
    when.iso,
    when.word,
    understood
      ? ''
      : 'Je n’ai pas bien entendu, mais je peux noter tes règles. '
  );
}


/* ---------------------------------------------------------
   DEMANDE DE CONFIRMATION
   --------------------------------------------------------- */

function askLunaPeriodConfirmation(dateISO, whenWord, spokenPrefix) {

  /*
   * Quand la fonction est appelée par un clic de bouton,
   * le premier argument est l'évènement : on l'ignore.
   */
  lunaVoicePendingDate =
    typeof dateISO === 'string'
      ? dateISO
      : lunaGetLocalDateISO();

  lunaVoicePendingWord =
    typeof whenWord === 'string'
      ? whenWord
      : 'aujourd’hui';

  lunaVoiceState = 'waiting-confirmation';

  lunaStopListening();

  const readableDate =
    lunaGetReadableDate(lunaVoicePendingDate);

  const question =
    lunaVoicePendingWord === 'aujourd’hui'
      ? `Nous sommes le ${readableDate}. Confirmes-tu que tu as tes règles aujourd’hui ?`
      : `Je note le début de tes règles ${lunaVoicePendingWord}, le ${readableDate}. C’est bien ça ?`;

  const confirmation =
    document.getElementById('lunaVoiceConfirmation');

  const confirmationText =
    document.getElementById('lunaVoiceConfirmationText');

  if (confirmation) {
    confirmation.classList.remove('hidden');
  }

  if (confirmationText) {
    confirmationText.textContent = question;
  }

  setLunaVoiceStatus(
    'Dis « oui » ou « non », ou touche un bouton.'
  );

  /*
   * Luna pose la question, PUIS écoute la réponse.
   * (On n'écoute pas pendant qu'elle parle, pour éviter
   * que le téléphone reconnaisse sa propre voix.)
   */
  lunaSpeak(
    (typeof spokenPrefix === 'string' ? spokenPrefix : '') + question,
    () => lunaListenForAnswer(0)
  );
}

/*
 * "oui" / "non" dits à voix haute.
 * Beaucoup de variantes, car le micro transcrit
 * "oui" de plusieurs façons (oui, ouais, wi, ouai…).
 */
const LUNA_YES_RE =
  /\b(oui|ouai|ouais|oue|ouep|ui|wi|wee|yes|yep|yeah|ok|okay|d ?accord|voila|exact\w*|ca y est|c est ca|c est bon|bien sur|tout a fait|si|affirmatif|confirme\w*|vas y|ca marche)\b/;

const LUNA_NO_RE =
  /\b(non|nan|nom|no|none|nope|pas|annule\w*|stop|jamais|rien|laisse tomber|negatif)\b/;

/*
 * Si "oui" et "non" apparaissent, le premier mot dit l'emporte
 * ("oui pas de souci" = oui, "non merci" = non).
 */
function lunaInterpretAnswer(normalizedList) {

  for (const n of normalizedList) {

    const y = n.search(LUNA_YES_RE);
    const no = n.search(LUNA_NO_RE);

    if (y >= 0 && (no < 0 || y < no)) return 'yes';
    if (no >= 0 && (y < 0 || no < y)) return 'no';
  }

  return null;
}

function lunaListenForAnswer(attempt) {

  if (lunaVoiceState !== 'waiting-confirmation') return;

  setLunaVoiceStatus('🎧 Dis « oui » ou « non »…');

  lunaListen(

    (alternatives) => {

      if (lunaVoiceState !== 'waiting-confirmation') return;

      const answer =
        lunaInterpretAnswer(
          alternatives.map(lunaNormalizeVoiceText)
        );

      if (answer === 'yes') {
        confirmLunaVoice(true);
        return;
      }

      if (answer === 'no') {
        confirmLunaVoice(false);
        return;
      }

      if (attempt < 2) {

        setLunaVoiceStatus(
          'Dis juste « oui » ou « non ».'
        );

        lunaSpeak(
          'Dis juste oui, ou non.',
          () => lunaListenForAnswer(attempt + 1)
        );

        return;
      }

      setLunaVoiceStatus(
        'Touche le gros bouton OUI ou NON.'
      );
    },

    (code) => {

      if (lunaVoiceState !== 'waiting-confirmation') return;

      if (code === 'no-speech') {
        setLunaVoiceStatus(
          'Je n’ai rien entendu. Touche OUI ou NON, ou appuie sur le micro pour répondre.'
        );
        return;
      }

      setLunaVoiceStatus(
        lunaVoiceErrorMessage(code) +
        ' Tu peux toucher OUI ou NON.'
      );
    }
  );
}


/* ---------------------------------------------------------
   CONFIRMATION OUI / NON
   --------------------------------------------------------- */

function confirmLunaVoice(isYes) {

  /*
   * Une réponse (voix ou bouton) coupe l'écoute
   * et la voix en cours.
   */
  lunaStopListening();
  lunaStopSpeaking();

  if (!lunaVoicePendingDate) {
    lunaVoicePendingDate = lunaGetLocalDateISO();
  }

  if (isYes) {
    saveLunaVoicePeriod();
    return;
  }

  /*
   * NON
   */
  lunaVoiceState = 'idle';
  lunaVoicePendingDate = null;
  lunaVoicePendingWord = 'aujourd’hui';

  const confirmation =
    document.getElementById('lunaVoiceConfirmation');

  if (confirmation) {
    confirmation.classList.add('hidden');
  }

  setLunaVoiceStatus(
    'D’accord, rien n’a été enregistré.'
  );

  lunaSpeak('D’accord. Je n’enregistre rien.');
}


/* ---------------------------------------------------------
   ENREGISTREMENT DES RÈGLES
   --------------------------------------------------------- */

function saveLunaVoicePeriod() {

  const date =
    lunaVoicePendingDate ||
    lunaGetLocalDateISO();

  const word =
    lunaVoicePendingWord || 'aujourd’hui';

  const addDays = (iso, n) => {
    const d = new Date(iso + 'T12:00:00');
    d.setDate(d.getDate() + n);
    return lunaGetLocalDateISO(d);
  };

  /*
   * Évite de créer un nouveau cycle si les règles
   * sont déjà enregistrées (même période, quelques jours
   * plus tôt) : sinon chaque "j'ai mes règles" décalerait
   * tous les calculs du cycle.
   */
  const existing =
    LunaDB.getPeriods().find(p => {
      const last = p.end || addDays(p.start, 8);
      return date >= p.start && date <= last;
    });

  const confirmation =
    document.getElementById('lunaVoiceConfirmation');

  if (confirmation) {
    confirmation.classList.add('hidden');
  }

  lunaVoicePendingDate = null;
  lunaVoicePendingWord = 'aujourd’hui';
  lunaVoiceState = 'saved';

  if (existing) {

    const since =
      lunaGetReadableDate(existing.start);

    setLunaVoiceStatus(
      `ℹ️ Tes règles sont déjà enregistrées depuis le ${since}.`
    );

    showToast('ℹ️ Règles déjà enregistrées');

    lunaSpeak(
      'Tes règles sont déjà enregistrées. Je ne change rien.'
    );

    return;
  }

  /*
   * Enregistrement local (localStorage) :
   * aucune donnée n'est envoyée sur un serveur.
   */
  LunaDB.addPeriod(date, null);

  renderCalendar();
  renderPhaseCard();
  checkAlerts();
  renderHealthNutrition();

  const readableDate =
    lunaGetReadableDate(date);

  setLunaVoiceStatus(
    `✅ Règles enregistrées pour le ${readableDate}.`
  );

  showToast(
    `🩸 Règles enregistrées pour ${word} !`
  );

  lunaSpeak(
    word === 'aujourd’hui'
      ? 'C’est enregistré. J’ai noté que tu as tes règles aujourd’hui.'
      : `C’est enregistré. J’ai noté le début de tes règles ${word}.`
  );
}


/* ---------------------------------------------------------
   STYLE DU MODULE VOCAL
   --------------------------------------------------------- */

function addLunaVoiceStyles() {

  /*
   * Évite d'ajouter les styles plusieurs fois.
   */
  if (
    document.getElementById(
      'lunaVoiceStyles'
    )
  ) {
    return;
  }


  const style =
    document.createElement('style');

  style.id =
    'lunaVoiceStyles';


  style.textContent = `

    /* =========================================
       MODULE VOCAL LUNA
       ========================================= */

    #lunaVoiceCard {
      margin-bottom: 1.2rem;
      padding: 1.2rem;
      border-radius: 22px;
      background:
        linear-gradient(
          145deg,
          var(--card),
          var(--bg)
        );
      border:
        1px solid var(--border);
      box-shadow:
        0 8px 25px rgba(0,0,0,.08);
      text-align: center;
    }


    .luna-voice-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-align: left;
      margin-bottom: 1rem;
    }


    .luna-voice-icon {
      width: 58px;
      height: 58px;
      min-width: 58px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      background:
        linear-gradient(
          135deg,
          #e8a4c4,
          #b987c7
        );
      box-shadow:
        0 5px 15px rgba(0,0,0,.12);
    }


    .luna-voice-header h2 {
      margin: 0 0 .25rem;
      font-size: 1.25rem;
    }


    .luna-voice-header p {
      margin: 0;
      color: var(--text-hint);
      font-size: .88rem;
    }


    .luna-voice-main-button {
      width: 100%;
      min-height: 64px;
      border: none;
      border-radius: 18px;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
      background:
        linear-gradient(
          135deg,
          #c56fa5,
          #8e70c7
        );
      box-shadow:
        0 7px 18px rgba(142,112,199,.28);
      transition:
        transform .15s ease,
        box-shadow .15s ease;
    }


    .luna-voice-main-button:hover {
      transform: translateY(-2px);
      box-shadow:
        0 10px 22px rgba(142,112,199,.35);
    }


    .luna-voice-main-button:active {
      transform: scale(.98);
    }


    .luna-voice-status {
      min-height: 42px;
      margin-top: .8rem;
      padding: .65rem .8rem;
      border-radius: 12px;
      background:
        var(--bg);
      color:
        var(--text);
      font-size: .9rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }


    .luna-voice-confirmation {
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 18px;
      background:
        rgba(197,111,165,.10);
      border:
        1px solid rgba(197,111,165,.25);
    }


    .luna-voice-confirm-title {
      font-weight: 700;
      font-size: 1rem;
      margin-bottom: .6rem;
    }


    .luna-voice-confirm-text {
      font-size: .95rem;
      line-height: 1.45;
      margin-bottom: 1rem;
    }


    .luna-voice-confirm-buttons {
      display: grid;
      grid-template-columns:
        1fr 1fr;
      gap: .7rem;
    }


    .luna-voice-confirm-buttons button {
      min-height: 58px;
      border: none;
      border-radius: 15px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 800;
    }


    .luna-voice-yes {
      background: #65b98b;
      color: white;
    }


    .luna-voice-no {
      background: #d97979;
      color: white;
    }


    .luna-voice-direct-button {
      width: 100%;
      margin-top: .8rem;
      min-height: 52px;
      border:
        1px solid var(--border);
      border-radius: 15px;
      background:
        var(--card);
      color:
        var(--text);
      cursor: pointer;
      font-size: .95rem;
      font-weight: 700;
    }


    .luna-voice-direct-button:hover {
      background:
        var(--bg);
    }


    .luna-voice-main-button.listening {
      background:
        linear-gradient(
          135deg,
          #e0527e,
          #c23b6b
        );
      animation:
        lunaVoicePulse 1.2s ease-in-out infinite;
    }


    @keyframes lunaVoicePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.025); }
    }


    #lunaVoiceConfirmation.hidden {
      display: none;
    }


    @media (max-width: 480px) {

      #lunaVoiceCard {
        padding: 1rem;
        border-radius: 18px;
      }


      .luna-voice-header {
        gap: .7rem;
      }


      .luna-voice-icon {
        width: 50px;
        height: 50px;
        min-width: 50px;
        font-size: 1.5rem;
      }


      .luna-voice-header h2 {
        font-size: 1.1rem;
      }


      .luna-voice-main-button {
        min-height: 62px;
        font-size: 1rem;
      }


      .luna-voice-confirm-buttons button {
        min-height: 62px;
        font-size: 1rem;
      }

    }

  `;


  document.head.appendChild(style);
}


/* =========================================================
   FIN DU MODE VOCAL LUNA
   ========================================================= */

/* =========================================================
   RÉGLAGES DE LA VOIX DE LUNA
   (bouton 🔊 en haut de l'écran)
   ========================================================= */

function lunaRateWord(rate) {
  if (rate < 0.85) return 'lente';
  if (rate <= 1.05) return 'normale';
  return 'rapide';
}

function fillVoiceOptions() {

  const select = document.getElementById('lunaVoiceSelect');
  const hint = document.getElementById('lunaVoiceHint');

  if (!select) return;

  const french = lunaGetFrenchVoices();
  const saved = lunaGetVoiceSettings().voice;

  select.innerHTML = '';

  const auto = document.createElement('option');
  auto.value = '';
  auto.textContent = 'Automatique (meilleure voix française)';
  select.appendChild(auto);

  french.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.voiceURI || v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    select.appendChild(opt);
  });

  const exists =
    french.some(v => (v.voiceURI || v.name) === saved);

  select.value = exists ? saved : '';

  if (hint) {
    hint.textContent =
      french.length
        ? `${french.length} voix française${french.length > 1 ? 's' : ''} sur cet appareil.`
        : 'Aucune voix française trouvée. Tu peux en installer une dans les réglages du téléphone (Synthèse vocale).';
  }
}

function openVoiceSettings() {

  fillVoiceOptions();

  const range = document.getElementById('lunaRateRange');
  const label = document.getElementById('lunaRateLabel');
  const rate = lunaGetVoiceSettings().rate;

  if (range) range.value = String(rate);
  if (label) label.textContent = lunaRateWord(rate);

  document.getElementById('voiceModal').classList.remove('hidden');
}

function closeVoiceSettings() {

  lunaStopSpeaking();

  const modal = document.getElementById('voiceModal');

  if (modal) modal.classList.add('hidden');
}

function lunaVoiceSample() {
  lunaSpeak(
    'Bonjour, je suis Luna. Voici ma voix. J’espère qu’elle te plaît.'
  );
}

function setupVoiceSettings() {

  if (document.getElementById('voiceModal')) return;

  const right = document.querySelector('.topbar-right');

  if (right) {

    const btn = document.createElement('button');

    btn.type = 'button';
    btn.className = 'icon-btn';
    btn.id = 'voiceSettingsBtn';
    btn.title = 'Voix de Luna';
    btn.setAttribute('aria-label', 'Voix de Luna');
    btn.textContent = '🔊';

    right.insertBefore(btn, right.firstChild);

    btn.addEventListener('click', openVoiceSettings);
  }

  const modal = document.createElement('div');

  modal.id = 'voiceModal';
  modal.className = 'modal-overlay hidden';

  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>🔊 Voix de Luna</h3>
        <button type="button" class="modal-close" id="voiceModalClose">✕</button>
      </div>
      <div class="modal-content">
        <div class="form-group">
          <label for="lunaVoiceSelect">Voix</label>
          <select id="lunaVoiceSelect" class="inp"></select>
        </div>
        <p id="lunaVoiceHint" class="lv-hint"></p>
        <div class="form-group">
          <label for="lunaRateRange">
            Vitesse : <strong id="lunaRateLabel">normale</strong>
          </label>
          <input
            type="range"
            id="lunaRateRange"
            class="lv-range"
            min="0.6"
            max="1.3"
            step="0.05"
            value="0.95"
          >
          <div class="lv-range-legend">
            <span>🐢 lente</span><span>rapide 🐇</span>
          </div>
        </div>
        <button type="button" class="btn-primary" id="lunaVoiceTest">
          ▶ Écouter un essai
        </button>
        <p class="lv-hint mt-xs">
          Les voix disponibles dépendent de ton téléphone.
          Ton choix est mémorisé.
        </p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  document
    .getElementById('voiceModalClose')
    .addEventListener('click', closeVoiceSettings);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVoiceSettings();
  });

  document
    .getElementById('lunaVoiceSelect')
    .addEventListener('change', (e) => {
      lunaStoreSet(LUNA_VOICE_KEY, e.target.value);
      lunaVoiceSample();
    });

  const range = document.getElementById('lunaRateRange');

  range.addEventListener('input', () => {
    document.getElementById('lunaRateLabel').textContent =
      lunaRateWord(parseFloat(range.value));
  });

  range.addEventListener('change', () => {
    lunaStoreSet(LUNA_RATE_KEY, range.value);
    lunaVoiceSample();
  });

  document
    .getElementById('lunaVoiceTest')
    .addEventListener('click', () => {
      lunaStoreSet(LUNA_RATE_KEY, range.value);
      lunaVoiceSample();
    });

  /* Les voix se chargent parfois après le démarrage */
  if ('speechSynthesis' in window) {
    try {
      window.speechSynthesis.onvoiceschanged = () => {
        if (!modal.classList.contains('hidden')) fillVoiceOptions();
      };
    } catch (e) {}
  }
}


/* =========================================================
   SYMPTÔMES SUR PLUSIEURS JOURS
   ========================================================= */

const LUNA_SYMPTOMS = [
  { id: 'crampes',       icon: '😖', label: 'Crampes' },
  { id: 'tete',          icon: '🤕', label: 'Maux de tête' },
  { id: 'fatigue',       icon: '😴', label: 'Fatigue' },
  { id: 'ballonnements', icon: '🎈', label: 'Ballonnements' },
  { id: 'nausees',       icon: '🤢', label: 'Nausées' },
  { id: 'dos',           icon: '🦴', label: 'Mal au dos' },
  { id: 'seins',         icon: '💗', label: 'Seins sensibles' },
  { id: 'sucre',         icon: '🍫', label: 'Envie de sucré' },
  { id: 'triste',        icon: '😢', label: 'Humeur triste' },
  { id: 'irritable',     icon: '😤', label: 'Irritable' },
  { id: 'sommeil',       icon: '🌙', label: 'Mal dormi' },
  { id: 'energie',       icon: '😊', label: 'Bonne énergie' }
];

/* niveau 0 = non choisi */
const LUNA_LEVELS = ['', 'un peu', 'moyennement', 'beaucoup'];
const LUNA_LEVEL_DOTS = ['', '●○○', '●●○', '●●●'];
const LUNA_LEVEL_INTENSITY = [0, 2, 3, 5];

const LUNA_MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

let lunaSymYear = null;
let lunaSymMonth = null;
const lunaSymDays = new Set();
let lunaSymLevels = {};

function lunaSymSpeak(text) {
  if (lunaStoreGet(LUNA_TAPSPEAK_KEY, '1') === '1') {
    lunaSpeak(text);
  }
}

function lunaDayParts(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

function lunaDayDiff(a, b) {
  const pa = lunaDayParts(a);
  const pb = lunaDayParts(b);
  return Math.round(
    (Date.UTC(pb.y, pb.m - 1, pb.d) - Date.UTC(pa.y, pa.m - 1, pa.d)) / 86400000
  );
}

/*
 * "du 10 au 12 octobre", "le 3 octobre",
 * "du 10 au 12 octobre et le 15 octobre"…
 */
function lunaDescribeDays(isos) {

  const sorted = [...isos].sort();

  if (!sorted.length) return '';

  const runs = [];
  let current = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    if (lunaDayDiff(sorted[i - 1], sorted[i]) === 1) {
      current.push(sorted[i]);
    } else {
      runs.push(current);
      current = [sorted[i]];
    }
  }

  runs.push(current);

  const thisYear = new Date().getFullYear();

  const dayNum = (p) => (p.d === 1 ? '1er' : String(p.d));

  const full = (iso) => {
    const p = lunaDayParts(iso);
    return `${dayNum(p)} ${LUNA_MONTHS[p.m - 1]}` +
      (p.y !== thisYear ? ' ' + p.y : '');
  };

  const phrases = runs.map(run => {

    if (run.length === 1) return 'le ' + full(run[0]);

    const a = lunaDayParts(run[0]);
    const b = lunaDayParts(run[run.length - 1]);

    if (a.m === b.m && a.y === b.y) {
      return `du ${dayNum(a)} au ${full(run[run.length - 1])}`;
    }

    return `du ${full(run[0])} au ${full(run[run.length - 1])}`;
  });

  if (phrases.length === 1) return phrases[0];

  return (
    phrases.slice(0, -1).join(', ') +
    ' et ' +
    phrases[phrases.length - 1]
  );
}

function lunaSymChosen() {
  return LUNA_SYMPTOMS.filter(s => (lunaSymLevels[s.id] || 0) > 0);
}

/* Phrase affichée et phrase lue */
function lunaSymSummary() {

  const days = [...lunaSymDays];
  const chosen = lunaSymChosen();

  if (!days.length && !chosen.length) {
    return {
      show: 'Choisis les jours, puis les symptômes.',
      speak: 'Choisis d’abord les jours, puis les symptômes.'
    };
  }

  const dayText =
    days.length
      ? `${lunaDescribeDays(days)} (${days.length} jour${days.length > 1 ? 's' : ''})`
      : 'aucun jour choisi';

  const showSymptoms =
    chosen.length
      ? chosen
          .map(s => `${s.label.toLowerCase()} (${LUNA_LEVELS[lunaSymLevels[s.id]]})`)
          .join(', ')
      : 'aucun symptôme choisi';

  const speakSymptoms =
    chosen.length
      ? chosen
          .map(s => `${s.label}, ${LUNA_LEVELS[lunaSymLevels[s.id]]}.`)
          .join(' ')
      : 'Aucun symptôme choisi.';

  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  return {
    show: `${cap(dayText)} : ${showSymptoms}.`,
    speak: `${cap(dayText.replace(/\s*\((\d+) jours?\)/, ', $1 jour' + (days.length > 1 ? 's' : '')))}. ${speakSymptoms}`
  };
}

/* ---- mini-calendrier ---- */

function renderSymCalendar() {

  const box = document.getElementById('symCal');

  if (!box) return;

  const todayISO = lunaGetLocalDateISO();

  const first = new Date(lunaSymYear, lunaSymMonth, 1, 12);
  const daysInMonth = new Date(lunaSymYear, lunaSymMonth + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; /* lundi = 0 */

  /* jours qui ont déjà des symptômes notés */
  const withEntry = new Set(
    LunaDB.getJournal()
      .filter(e => e.category === 'symptome')
      .map(e => e.date)
  );

  const title =
    `${LUNA_MONTHS[lunaSymMonth]} ${lunaSymYear}`;

  let cells = '';

  for (let i = 0; i < offset; i++) {
    cells += '<span class="sym-day-empty"></span>';
  }

  for (let d = 1; d <= daysInMonth; d++) {

    const iso = lunaGetLocalDateISO(
      new Date(lunaSymYear, lunaSymMonth, d, 12)
    );

    const classes = ['sym-day'];

    if (lunaSymDays.has(iso)) classes.push('selected');
    if (iso === todayISO) classes.push('today');
    if (withEntry.has(iso)) classes.push('has-entry');

    const future = iso > todayISO;

    cells += `
      <button
        type="button"
        class="${classes.join(' ')}"
        data-date="${iso}"
        aria-pressed="${lunaSymDays.has(iso)}"
        ${future ? 'disabled' : ''}
      >${d}</button>
    `;
  }

  box.innerHTML = `
    <div class="sym-cal-head">
      <button type="button" class="sym-nav" data-nav="-1" aria-label="Mois précédent">◀</button>
      <strong>${title}</strong>
      <button type="button" class="sym-nav" data-nav="1" aria-label="Mois suivant">▶</button>
    </div>
    <div class="sym-weekdays">
      <span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span>
    </div>
    <div class="sym-days">${cells}</div>
  `;
}

/* ---- boutons de symptômes ---- */

function renderSymGrid() {

  const grid = document.getElementById('symGrid');

  if (!grid) return;

  grid.innerHTML =
    LUNA_SYMPTOMS
      .map(s => {

        const lvl = lunaSymLevels[s.id] || 0;

        return `
          <button
            type="button"
            class="sym-btn ${lvl ? 'lvl-' + lvl : ''}"
            data-sym="${s.id}"
            aria-pressed="${lvl > 0}"
          >
            <span class="sym-icon">${s.icon}</span>
            <span class="sym-label">${s.label}</span>
            <span class="sym-level">${lvl ? LUNA_LEVEL_DOTS[lvl] + ' ' + LUNA_LEVELS[lvl] : '&nbsp;'}</span>
          </button>
        `;
      })
      .join('');
}

function renderSymSummary() {

  const box = document.getElementById('symSummary');

  if (box) box.textContent = lunaSymSummary().show;
}

function lunaSymRefreshAll() {
  renderSymCalendar();
  renderSymGrid();
  renderSymSummary();
}

/* ---- enregistrement : une entrée de journal par jour ---- */

function saveSymptoms() {

  const days = [...lunaSymDays].sort();
  const chosen = lunaSymChosen();

  if (!days.length) {
    showToast('Choisis au moins un jour.');
    lunaSpeak('Choisis d’abord au moins un jour.');
    return;
  }

  if (!chosen.length) {
    showToast('Choisis au moins un symptôme.');
    lunaSpeak('Choisis d’abord au moins un symptôme.');
    return;
  }

  const notes =
    chosen
      .map(s => `${s.label} (${LUNA_LEVELS[lunaSymLevels[s.id]]})`)
      .join(', ');

  const maxLevel =
    Math.max(...chosen.map(s => lunaSymLevels[s.id]));

  const symptoms =
    chosen.map(s => ({
      id: s.id,
      label: s.label,
      level: lunaSymLevels[s.id]
    }));

  days.forEach(date => {

    /* si ces symptômes avaient déjà été notés ce jour-là, on les remplace */
    LunaDB.getJournal()
      .filter(e =>
        e.date === date &&
        e.category === 'symptome' &&
        Array.isArray(e.symptoms)
      )
      .forEach(e => LunaDB.deleteJournalEntry(e.id));

    LunaDB.addJournalEntry({
      date,
      category: 'symptome',
      notes,
      intensity: String(LUNA_LEVEL_INTENSITY[maxLevel]),
      illnessType: null,
      fever: null,
      symptoms
    });
  });

  renderJournal();
  renderIllnessStats();
  renderCalendar(calYear, calMonth);

  const count = days.length;

  showToast(
    `✅ Symptômes enregistrés pour ${count} jour${count > 1 ? 's' : ''} !`
  );

  lunaSpeak(
    `C’est enregistré pour ${count} jour${count > 1 ? 's' : ''}.`
  );

  closeSymptomPanel();
}

function openSymptomPanel() {

  const now = new Date();

  lunaSymYear = now.getFullYear();
  lunaSymMonth = now.getMonth();
  lunaSymDays.clear();
  lunaSymLevels = {};

  const panel = document.getElementById('symPanel');

  panel.innerHTML = `
    <div class="sym-top">
      <h3 class="card-title">Symptômes sur plusieurs jours</h3>
      <button type="button" class="modal-close" id="symClose" aria-label="Fermer">✕</button>
    </div>

    <label class="sym-toggle">
      <input type="checkbox" id="symSpeakToggle">
      🔊 Parler quand je touche
    </label>

    <div class="sym-step">1️⃣ Touche les jours</div>
    <div id="symCal" class="sym-cal"></div>

    <div class="sym-step">2️⃣ Touche les symptômes</div>
    <p class="sym-legend">
      1 fois : un peu · 2 fois : moyennement · 3 fois : beaucoup · 4 fois : enlever
    </p>
    <div id="symGrid" class="sym-grid"></div>

    <div class="sym-step">3️⃣ Vérifie et enregistre</div>
    <div id="symSummary" class="sym-summary"></div>
    <div class="btn-row">
      <button type="button" class="btn-secondary" id="symReadBtn">🔊 Relire mon résumé</button>
      <button type="button" class="btn-primary" id="symSaveBtn">✅ Enregistrer</button>
    </div>
    <button type="button" class="btn-secondary mt-xs" id="symResetBtn">Tout effacer</button>
  `;

  document.getElementById('symSpeakToggle').checked =
    lunaStoreGet(LUNA_TAPSPEAK_KEY, '1') === '1';

  document.getElementById('symSpeakToggle')
    .addEventListener('change', (e) => {
      lunaStoreSet(LUNA_TAPSPEAK_KEY, e.target.checked ? '1' : '0');
      if (e.target.checked) lunaSpeak('D’accord, je parle quand tu touches.');
      else lunaStopSpeaking();
    });

  /* mini-calendrier : un seul écouteur pour tous les boutons */
  document.getElementById('symCal')
    .addEventListener('click', (e) => {

      const nav = e.target.closest('[data-nav]');

      if (nav) {
        lunaSymMonth += Number(nav.dataset.nav);
        if (lunaSymMonth < 0) { lunaSymMonth = 11; lunaSymYear--; }
        if (lunaSymMonth > 11) { lunaSymMonth = 0; lunaSymYear++; }
        renderSymCalendar();
        return;
      }

      const day = e.target.closest('.sym-day');

      if (!day || day.disabled) return;

      const iso = day.dataset.date;

      if (lunaSymDays.has(iso)) {
        lunaSymDays.delete(iso);
      } else {
        lunaSymDays.add(iso);
      }

      const p = lunaDayParts(iso);

      lunaSymSpeak(
        (lunaSymDays.has(iso) ? '' : 'Enlevé : ') +
        `${p.d === 1 ? '1er' : p.d} ${LUNA_MONTHS[p.m - 1]}`
      );

      renderSymCalendar();
      renderSymSummary();
    });

  /* symptômes : 1 fois, 2 fois, 3 fois, 4 fois = enlever */
  document.getElementById('symGrid')
    .addEventListener('click', (e) => {

      const btn = e.target.closest('.sym-btn');

      if (!btn) return;

      const id = btn.dataset.sym;
      const symptom = LUNA_SYMPTOMS.find(s => s.id === id);

      const next = ((lunaSymLevels[id] || 0) + 1) % 4;

      lunaSymLevels[id] = next;

      lunaSymSpeak(
        next
          ? `${symptom.label}, ${LUNA_LEVELS[next]}`
          : `${symptom.label}, enlevé`
      );

      renderSymGrid();
      renderSymSummary();
    });

  document.getElementById('symReadBtn')
    .addEventListener('click', () => {
      lunaSpeak(lunaSymSummary().speak);
    });

  document.getElementById('symSaveBtn')
    .addEventListener('click', saveSymptoms);

  document.getElementById('symResetBtn')
    .addEventListener('click', () => {
      lunaSymDays.clear();
      lunaSymLevels = {};
      lunaStopSpeaking();
      lunaSymRefreshAll();
    });

  document.getElementById('symClose')
    .addEventListener('click', closeSymptomPanel);

  lunaSymRefreshAll();

  panel.classList.remove('hidden');

  document.getElementById('symOpenBtn').classList.add('hidden');

  if (panel.scrollIntoView) {
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  lunaSymSpeak('Touche les jours, puis les symptômes.');
}

function closeSymptomPanel() {

  const panel = document.getElementById('symPanel');

  if (panel) panel.classList.add('hidden');

  const btn = document.getElementById('symOpenBtn');

  if (btn) btn.classList.remove('hidden');
}

function setupSymptomTracker() {

  const btn = document.getElementById('symOpenBtn');

  if (btn) btn.addEventListener('click', openSymptomPanel);
}

