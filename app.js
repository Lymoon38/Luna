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
  renderShoppingList();
  renderRdvList();
  setupForms();
  setupVoiceMode();
  setTodayDefaults();
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
  const today = new Date().toISOString().split('T')[0];

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

  const ds =
    d.toISOString().split('T')[0];

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

  // Shopping
  document
    .getElementById('addShoppingItem')
    .addEventListener(
      'click',
      addShoppingItem
    );

  document
    .getElementById('newItemInput')
    .addEventListener(
      'keypress',
      (e) => {

        if (e.key === 'Enter')
          addShoppingItem();
      }
    );

  document
    .getElementById('clearDoneItems')
    .addEventListener('click', () => {

      LunaDB.clearDoneItems();
      renderShoppingList();
    });

  document
    .getElementById('exportShoppingBtn')
    .addEventListener(
      'click',
      exportShoppingList
    );

  // File import
  document
    .getElementById('shoppingFile')
    .addEventListener(
      'change',
      (e) =>
        importShoppingFile(
          e.target.files[0]
        )
    );

  document
    .getElementById('fileDropZone')
    .addEventListener(
      'click',
      () =>
        document
          .getElementById('shoppingFile')
          .click()
    );

  setupFileDrop();

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

function renderHealthNutrition() {

  const data =
    LunaDB.calcCycleData();

  const phase =
    data
      ? data.phase
      : 'folliculaire';

  const allPhases = [
    'menstruation',
    'folliculaire',
    'fertile',
    'luteale'
  ];

  const container =
    document.getElementById(
      'cycleNutrition'
    );

  container.innerHTML =
    allPhases
      .map(p => {

        const info =
          LunaDB.getNutritionByPhase(
            p
          );

        const isActive =
          p === phase;

        return `
          <div
            class="
              cn-phase
              ${
                isActive
                  ? 'active-phase'
                  : ''
              }
            "
          >

            ${
              isActive
                ? `
                  <span class="cn-badge">
                    Phase actuelle
                  </span>
                `
                : ''
            }

            <div
              class="cn-title"
              style="
                color:${info.color}
              "
            >
              ${info.label}
            </div>

            <div
              class="cn-foods"
              style="
                margin-bottom:.3rem
              "
            >
              ${
                info.foods.replace(
                  /\*\*(.*?)\*\*/g,
                  '<strong>$1</strong>'
                )
              }
            </div>

            <div
              style="
                font-size:.78rem;
                color:var(--text-hint)
              "
            >
              💡 ${info.tip}
            </div>

            <div
              style="
                font-size:.78rem;
                color:var(--text-muted);
                margin-top:.2rem
              "
            >
              ⚡ Calories :
              ${info.calories}
            </div>

          </div>
        `;
      })
      .join('');
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

/* ---- SHOPPING ---- */

function addShoppingItem() {

  const text =
    document
      .getElementById(
        'newItemInput'
      )
      .value
      .trim();

  const cat =
    document
      .getElementById(
        'newItemCat'
      )
      .value;

  if (!text) return;

  LunaDB.addShoppingItem(
    text,
    cat
  );

  document.getElementById(
    'newItemInput'
  ).value = '';

  renderShoppingList();
}

function renderShoppingList() {

  const items =
    LunaDB.getShopping();

  const list =
    document.getElementById(
      'shoppingList'
    );

  const actions =
    document.getElementById(
      'shoppingActions'
    );

  if (!items.length) {

    list.innerHTML = `
      <p
        style="
          color:var(--text-hint);
          font-size:.85rem;
          text-align:center;
          padding:1rem
        "
      >
        Liste vide.
      </p>
    `;

    actions.style.display =
      'none';

    return;
  }

  actions.style.display =
    'flex';

  const catIcons = {
    legumes: '🥦',
    fruits: '🍎',
    viandes: '🥩',
    laitiers: '🧀',
    feculents: '🍞',
    boissons: '🧃',
    autre: '📦'
  };

  const catLabels = {
    legumes: 'Légumes',
    fruits: 'Fruits',
    viandes: 'Viandes & Protéines',
    laitiers: 'Laitiers',
    feculents: 'Féculents',
    boissons: 'Boissons',
    autre: 'Autre'
  };

  // Group by category
  const grouped = {};

  items.forEach(item => {

    if (!grouped[item.category])
      grouped[item.category] = [];

    grouped[item.category]
      .push(item);
  });

  let html = '';

  Object.entries(grouped)
    .forEach(
      ([cat, catItems]) => {

        html += `
          <div
            class="shop-cat-header"
          >
            ${
              catIcons[cat] ||
              '📦'
            }
            ${
              catLabels[cat] ||
              cat
            }
          </div>
        `;

        catItems.forEach(
          item => {

            html += `
              <div
                class="
                  shop-item
                  ${
                    item.done
                      ? 'done'
                      : ''
                  }
                "
                id="si-${item.id}"
              >

                <button
                  class="
                    shop-check
                    ${
                      item.done
                        ? 'checked'
                        : ''
                    }
                  "
                  onclick="
                    toggleItem(
                      '${item.id}'
                    )
                  "
                ></button>

                <span class="si-cat">
                  ${
                    catIcons[
                      item.category
                    ] || '📦'
                  }
                </span>

                <span class="si-text">
                  ${
                    escHtml(
                      item.text
                    )
                  }
                </span>

                <button
                  class="si-del"
                  onclick="
                    deleteItem(
                      '${item.id}'
                    )
                  "
                >
                  ✕
                </button>

              </div>
            `;
          }
        );
      }
    );

  list.innerHTML =
    html;
}

function toggleItem(id) {

  LunaDB.toggleShoppingItem(id);

  renderShoppingList();
}

function deleteItem(id) {

  LunaDB.deleteShoppingItem(id);

  renderShoppingList();
}

function importShoppingFile(file) {

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload =
    (e) => {

      const content =
        e.target.result;

      let items = [];

      if (
        file.name.endsWith(
          '.json'
        )
      ) {

        try {

          const data =
            JSON.parse(
              content
            );

          if (
            Array.isArray(data)
          ) {

            items =
              data.map(
                x =>
                  typeof x === 'string'
                    ? x
                    : x.name ||
                      x.title ||
                      x.content ||
                      JSON.stringify(x)
              );

          } else if (
            data.items
          ) {

            items =
              data.items.map(
                x =>
                  typeof x === 'string'
                    ? x
                    : x.name ||
                      x.content ||
                      ''
              );

          } else if (
            data.tasks
          ) {

            items =
              data.tasks.map(
                x =>
                  x.content ||
                  x.title ||
                  x.name ||
                  ''
              );
          }

        } catch {

          showToast(
            '❌ JSON invalide.'
          );

          return;
        }

      } else {

        // txt / csv
        items =
          content
            .split(/[\n\r]+/)
            .map(
              l =>
                l
                  .replace(
                    /^[\-\*\•\[\]✓☐☑\d\.]+\s*/,
                    ''
                  )
                  .replace(
                    /,.*$/,
                    ''
                  )
                  .trim()
            )
            .filter(Boolean);
      }

      items.forEach(text => {

        if (text.trim()) {

          LunaDB.addShoppingItem(
            text.trim(),
            'autre'
          );
        }
      });

      renderShoppingList();

      showToast(
        `✅ ${items.length} article(s) importé(s) !`
      );
    };

  reader.readAsText(file);
}

function setupFileDrop() {

  const zone =
    document.getElementById(
      'fileDropZone'
    );

  zone.addEventListener(
    'dragover',
    (e) => {

      e.preventDefault();

      zone.style.borderColor =
        'var(--accent)';
    }
  );

  zone.addEventListener(
    'dragleave',
    () => {

      zone.style.borderColor =
        '';
    }
  );

  zone.addEventListener(
    'drop',
    (e) => {

      e.preventDefault();

      zone.style.borderColor =
        '';

      const file =
        e.dataTransfer.files[0];

      if (file)
        importShoppingFile(
          file
        );
    }
  );
}

function exportShoppingList() {

  const items =
    LunaDB
      .getShopping()
      .filter(
        x => !x.done
      );

  const text =
    items
      .map(
        i => `[ ] ${i.text}`
      )
      .join('\n');

  downloadFile(
    'liste-courses-luna.txt',
    text,
    'text/plain'
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

  const today =
    new Date()
      .toISOString()
      .split('T')[0];

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


/* ---------------------------------------------------------
   INITIALISATION DU MODE VOCAL
   --------------------------------------------------------- */

function setupVoiceMode() {

  // Évite de créer deux fois le module vocal
  if (document.getElementById('lunaVoiceCard')) return;

  // Le calendrier existe dans index.html sous cet identifiant
  const calendarTab = document.getElementById('tab-calendrier');

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
          Tu peux simplement me parler.
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
      Appuie sur le bouton et parle.
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
    .addEventListener('click', askLunaPeriodConfirmation);


  /* -------------------------------------------------------
     TEST DE COMPATIBILITÉ
     ------------------------------------------------------- */

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!Recognition) {

    setLunaVoiceStatus(
      'La reconnaissance vocale n’est pas disponible ici. Tu peux utiliser le bouton sous le microphone.'
    );
  }
}


/* ---------------------------------------------------------
   DATE LOCALE DU TÉLÉPHONE
   --------------------------------------------------------- */

function lunaGetLocalDateISO() {

  const now = new Date();

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


/* ---------------------------------------------------------
   VOIX DE LUNA
   --------------------------------------------------------- */

function lunaSpeak(text, onEnd) {

  if (!('speechSynthesis' in window)) {

    if (typeof onEnd === 'function') {
      onEnd();
    }

    return;
  }

  /*
   * Stoppe une éventuelle lecture précédente.
   */
  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  utterance.lang = 'fr-FR';

  /*
   * Petite vitesse volontairement lente
   * pour faciliter la compréhension.
   */
  utterance.rate = 0.9;

  utterance.pitch = 1;

  utterance.volume = 1;

  utterance.onend = () => {

    if (typeof onEnd === 'function') {
      onEnd();
    }

  };

  window.speechSynthesis.speak(utterance);
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
   --------------------------------------------------------- */

function lunaNormalizeVoiceText(text) {

  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}


/* ---------------------------------------------------------
   DÉMARRER L'ÉCOUTE
   --------------------------------------------------------- */

function startLunaVoice() {

  const Recognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  /*
   * Si le navigateur ne possède pas
   * la reconnaissance vocale.
   */
  if (!Recognition) {

    setLunaVoiceStatus(
      'La reconnaissance vocale n’est pas disponible. Utilise le bouton « J’ai mes règles aujourd’hui ».'
    );

    lunaSpeak(
      'La reconnaissance vocale n’est pas disponible. Tu peux utiliser le bouton J’ai mes règles aujourd’hui.'
    );

    return;
  }


  /*
   * On arrête une éventuelle reconnaissance précédente.
   */
  if (lunaVoiceRecognition) {

    try {
      lunaVoiceRecognition.stop();
    } catch (e) {}

  }


  lunaVoiceRecognition =
    new Recognition();


  lunaVoiceRecognition.lang = 'fr-FR';

  lunaVoiceRecognition.continuous = false;

  lunaVoiceRecognition.interimResults = false;

  lunaVoiceRecognition.maxAlternatives = 3;


  lunaVoiceState = 'listening';


  setLunaVoiceStatus(
    '🎧 Je t’écoute…'
  );


  /*
   * Résultat reconnu.
   */
  lunaVoiceRecognition.onresult = (event) => {

    let transcript = '';

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      transcript +=
        event.results[i][0].transcript + ' ';

    }

    transcript = transcript.trim();

    setLunaVoiceStatus(
      'Tu as dit : « ' + transcript + ' »'
    );

    handleLunaVoiceCommand(transcript);
  };


  /*
   * Fin de l'écoute.
   */
  lunaVoiceRecognition.onend = () => {

    if (lunaVoiceState === 'listening') {

      lunaVoiceState = 'idle';

      setLunaVoiceStatus(
        'Je n’ai pas entendu de réponse. Tu peux réessayer.'
      );

    }

  };


  /*
   * Erreur.
   */
  lunaVoiceRecognition.onerror = (event) => {

    lunaVoiceState = 'idle';

    let message =
      'Je n’ai pas réussi à t’entendre.';

    if (event.error === 'not-allowed') {

      message =
        'Le microphone n’est pas autorisé. Autorise le microphone dans ton navigateur.';

    } else if (event.error === 'no-speech') {

      message =
        'Je n’ai rien entendu. Parle un peu plus fort puis réessaie.';

    } else if (event.error === 'audio-capture') {

      message =
        'Le microphone semble indisponible.';

    }

    setLunaVoiceStatus(message);

  };


  /*
   * Lance réellement l'écoute.
   */
  try {

    lunaVoiceRecognition.start();

  } catch (error) {

    console.warn(
      'Luna voice start error:',
      error
    );

    setLunaVoiceStatus(
      'Impossible de démarrer le microphone. Réessaie.'
    );

  }
}


/* ---------------------------------------------------------
   INTERPRÉTATION DE LA PHRASE
   --------------------------------------------------------- */

function handleLunaVoiceCommand(text) {

  const normalized =
    lunaNormalizeVoiceText(text);


  /*
   * Exemples acceptés :
   *
   * "j'ai mes règles"
   * "j ai mes regles"
   * "mes règles"
   * "j'ai mes règles aujourd'hui"
   * "j'ai mes règles ce matin"
   */

  const hasPeriodWord =
    normalized.includes('regle') ||
    normalized.includes('regles');


  if (hasPeriodWord) {

    askLunaPeriodConfirmation();

    return;
  }


  /*
   * Si la personne dit simplement oui
   * ou confirme, on peut proposer
   * l'enregistrement.
   */

  if (
    normalized === 'oui' ||
    normalized.includes('oui')
  ) {

    if (
      lunaVoiceState === 'waiting-confirmation' &&
      lunaVoicePendingDate
    ) {

      confirmLunaVoice(true);

      return;
    }

  }


  setLunaVoiceStatus(
    'Je n’ai pas compris. Tu peux dire : « j’ai mes règles ».'
  );

  lunaSpeak(
    'Je n’ai pas compris. Tu peux dire : j’ai mes règles.'
  );
}


/* ---------------------------------------------------------
   DEMANDE DE CONFIRMATION
   --------------------------------------------------------- */

function askLunaPeriodConfirmation() {

  /*
   * Date capturée immédiatement.
   *
   * C'est important :
   * on garde la date au moment où la personne
   * demande l'enregistrement.
   */
  lunaVoicePendingDate =
    lunaGetLocalDateISO();


  lunaVoiceState =
    'waiting-confirmation';


  const readableDate =
    lunaGetReadableDate(
      lunaVoicePendingDate
    );


  const confirmation =
    document.getElementById(
      'lunaVoiceConfirmation'
    );

  const confirmationText =
    document.getElementById(
      'lunaVoiceConfirmationText'
    );


  if (confirmation) {
    confirmation.classList.remove('hidden');
  }


  if (confirmationText) {

    confirmationText.textContent =
      `Nous sommes le ${readableDate}. Confirmes-tu que tu as tes règles aujourd’hui ?`;

  }


  setLunaVoiceStatus(
    'En attente de ta confirmation…'
  );


  /*
   * Luna parle.
   *
   * La reconnaissance vocale n'est volontairement
   * pas démarrée pendant que Luna parle afin d'éviter
   * que le téléphone reconnaisse sa propre voix.
   */
  lunaSpeak(
    `Nous sommes le ${readableDate}. Confirmes-tu que tu as tes règles aujourd’hui ?`
  );
}


/* ---------------------------------------------------------
   CONFIRMATION OUI / NON
   --------------------------------------------------------- */

function confirmLunaVoice(isYes) {

  if (
    lunaVoiceState !== 'waiting-confirmation' &&
    !lunaVoicePendingDate
  ) {

    /*
     * Si l'utilisateur appuie directement sur OUI
     * sans passer par la question, on utilise aujourd'hui.
     */
    lunaVoicePendingDate =
      lunaGetLocalDateISO();

  }


  if (isYes) {

    saveLunaVoicePeriod();

    return;
  }


  /*
   * NON
   */
  lunaVoiceState =
    'idle';

  lunaVoicePendingDate =
    null;


  const confirmation =
    document.getElementById(
      'lunaVoiceConfirmation'
    );

  if (confirmation) {
    confirmation.classList.add('hidden');
  }


  setLunaVoiceStatus(
    'D’accord, rien n’a été enregistré.'
  );


  lunaSpeak(
    'D’accord. Je n’enregistre rien.'
  );
}


/* ---------------------------------------------------------
   ENREGISTREMENT DES RÈGLES
   --------------------------------------------------------- */

function saveLunaVoicePeriod() {

  const date =
    lunaVoicePendingDate ||
    lunaGetLocalDateISO();


  /*
   * Enregistrement local.
   *
   * LunaDB utilise localStorage :
   * aucune donnée n'est envoyée sur un serveur
   * par cette fonction.
   */
  LunaDB.addPeriod(
    date,
    null
  );


  /*
   * Mise à jour immédiate de l'application.
   */
  renderCalendar();

  renderPhaseCard();

  checkAlerts();

  renderHealthNutrition();


  /*
   * Ferme la confirmation.
   */
  const confirmation =
    document.getElementById(
      'lunaVoiceConfirmation'
    );

  if (confirmation) {
    confirmation.classList.add('hidden');
  }


  lunaVoiceState =
    'saved';


  const readableDate =
    lunaGetReadableDate(date);


  setLunaVoiceStatus(
    `✅ Règles enregistrées pour le ${readableDate}.`
  );


  /*
   * Toast classique de Luna.
   */
  showToast(
    '🩸 Règles enregistrées pour aujourd’hui !'
  );


  /*
   * Réponse vocale.
   */
  lunaSpeak(
    `C’est enregistré. J’ai noté que tu as tes règles aujourd’hui.`
  );


  /*
   * Nettoyage.
   */
  lunaVoicePendingDate =
    null;
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