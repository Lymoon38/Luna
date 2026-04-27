/* =============================================
   LUNA — data.js
   Stockage local & calculs du cycle
   ============================================= */

const LunaDB = (() => {

  /* ---- STORAGE ---- */
  const KEYS = {
    periods: 'luna_periods',
    journal: 'luna_journal',
    weights: 'luna_weights',
    rdv: 'luna_rdv',
    shopping: 'luna_shopping',
    settings: 'luna_settings',
    cycleLen: 'luna_cycle_length',
  };

  const load = (key, fallback = []) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };

  const save = (key, data) => {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) { console.warn('Storage full', e); }
  };

  /* ---- PERIODS ---- */
  const getPeriods = () => load(KEYS.periods, []);
  const savePeriods = (arr) => save(KEYS.periods, arr);

  const addPeriod = (start, end) => {
    const periods = getPeriods();
    const existing = periods.findIndex(p => p.start === start);
    if (existing >= 0) { periods[existing] = { start, end }; }
    else { periods.push({ start, end }); }
    periods.sort((a, b) => new Date(b.start) - new Date(a.start));
    savePeriods(periods);
  };

  const deletePeriod = (start) => {
    savePeriods(getPeriods().filter(p => p.start !== start));
  };

  /* ---- CYCLE LENGTH ---- */
  const getCycleLength = () => {
    const saved = parseInt(localStorage.getItem(KEYS.cycleLen)) || 28;
    // Auto-calculer si on a 2+ périodes
    const periods = getPeriods();
    if (periods.length >= 2) {
      const lengths = [];
      for (let i = 0; i < Math.min(periods.length - 1, 6); i++) {
        const d1 = new Date(periods[i].start);
        const d2 = new Date(periods[i + 1].start);
        const diff = Math.round((d1 - d2) / 86400000);
        if (diff >= 20 && diff <= 45) lengths.push(diff);
      }
      if (lengths.length >= 2) {
        const avg = Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
        localStorage.setItem(KEYS.cycleLen, avg);
        return avg;
      }
    }
    return saved;
  };

  const setCycleLength = (n) => localStorage.setItem(KEYS.cycleLen, n);

  /* ---- CYCLE CALCULATIONS ---- */
  const calcCycleData = () => {
    const periods = getPeriods();
    const cycleLen = getCycleLength();
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (!periods.length) return null;

    const lastPeriod = periods[0];
    const lastStart = new Date(lastPeriod.start);
    const lastEnd = lastPeriod.end ? new Date(lastPeriod.end) : new Date(lastStart.getTime() + 4 * 86400000);
    const periodDuration = Math.round((lastEnd - lastStart) / 86400000) + 1;

    // Prochaines règles prévues
    const nextPeriodStart = new Date(lastStart.getTime() + cycleLen * 86400000);
    const nextPeriodEnd = new Date(nextPeriodStart.getTime() + (periodDuration - 1) * 86400000);

    // Ovulation = cycle - 14 jours
    const ovulationDay = new Date(nextPeriodStart.getTime() - 14 * 86400000);
    const fertileStart = new Date(ovulationDay.getTime() - 5 * 86400000);
    const fertileEnd = new Date(ovulationDay.getTime() + 1 * 86400000);

    // Jour du cycle actuel
    const dayOfCycle = Math.round((today - lastStart) / 86400000) + 1;
    const daysToNextPeriod = Math.round((nextPeriodStart - today) / 86400000);

    // Phase actuelle
    let phase = 'folliculaire';
    let phaseLabel = 'Phase folliculaire';
    let phaseDesc = 'Énergie en hausse, bonne humeur';

    if (today >= lastStart && today <= lastEnd) {
      phase = 'menstruation'; phaseLabel = 'Menstruation'; phaseDesc = 'Prenez soin de vous ☕';
    } else if (today >= fertileStart && today <= ovulationDay) {
      phase = 'fertile'; phaseLabel = 'Fenêtre fertile'; phaseDesc = 'Période de fertilité maximale';
    } else if (today > ovulationDay && today <= new Date(ovulationDay.getTime() + 86400000)) {
      phase = 'ovulation'; phaseLabel = 'Ovulation'; phaseDesc = 'Pic de fertilité aujourd\'hui';
    } else if (today > ovulationDay && today < nextPeriodStart) {
      phase = 'luteale'; phaseLabel = 'Phase lutéale'; phaseDesc = 'Possible SPM en fin de phase';
    }

    // Générer les prédictions pour 3 cycles futurs
    const predictions = [];
    for (let i = 0; i < 3; i++) {
      const pStart = new Date(lastStart.getTime() + (i + 1) * cycleLen * 86400000);
      const pEnd = new Date(pStart.getTime() + (periodDuration - 1) * 86400000);
      const pOvul = new Date(pStart.getTime() + (cycleLen - 14 - 1) * 86400000);
      const pFertStart = new Date(pOvul.getTime() - 5 * 86400000);
      const pFertEnd = new Date(pOvul.getTime() + 86400000);
      predictions.push({ periodStart: pStart, periodEnd: pEnd, ovulation: pOvul, fertileStart: pFertStart, fertileEnd: pFertEnd });
    }

    return {
      lastStart, lastEnd, nextPeriodStart, nextPeriodEnd,
      ovulationDay, fertileStart, fertileEnd,
      phase, phaseLabel, phaseDesc,
      dayOfCycle, daysToNextPeriod, cycleLen, periodDuration,
      predictions, today,
    };
  };

  /* ---- JOURNAL ---- */
  const getJournal = () => load(KEYS.journal, []);
  const saveJournal = (arr) => save(KEYS.journal, arr);

  const addJournalEntry = (entry) => {
    const j = getJournal();
    entry.id = Date.now().toString();
    j.unshift(entry);
    saveJournal(j);
    return entry;
  };

  const deleteJournalEntry = (id) => {
    saveJournal(getJournal().filter(e => e.id !== id));
  };

  const getIllnessStats = () => {
    const j = getJournal().filter(e => e.category === 'maladie');
    const counts = {};
    j.forEach(e => {
      const type = e.illnessType || 'autre';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  /* ---- WEIGHTS ---- */
  const getWeights = () => load(KEYS.weights, []);
  const saveWeights = (arr) => save(KEYS.weights, arr);

  const addWeight = (date, value) => {
    const w = getWeights();
    const existing = w.findIndex(x => x.date === date);
    if (existing >= 0) w[existing].value = value;
    else w.push({ date, value });
    w.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveWeights(w);
  };

  const deleteWeight = (date) => {
    saveWeights(getWeights().filter(w => w.date !== date));
  };

  /* ---- RDV ---- */
  const getRdv = () => load(KEYS.rdv, []);
  const saveRdv = (arr) => save(KEYS.rdv, arr);

  const addRdv = (rdv) => {
    const list = getRdv();
    rdv.id = Date.now().toString();
    list.push(rdv);
    list.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveRdv(list);
    return rdv;
  };

  const deleteRdv = (id) => {
    saveRdv(getRdv().filter(r => r.id !== id));
  };

  /* ---- SHOPPING ---- */
  const getShopping = () => load(KEYS.shopping, []);
  const saveShopping = (arr) => save(KEYS.shopping, arr);

  const addShoppingItem = (text, category) => {
    const items = getShopping();
    const item = { id: Date.now().toString(), text, category, done: false };
    items.push(item);
    saveShopping(items);
    return item;
  };

  const toggleShoppingItem = (id) => {
    const items = getShopping();
    const item = items.find(x => x.id === id);
    if (item) { item.done = !item.done; saveShopping(items); }
    return item;
  };

  const deleteShoppingItem = (id) => {
    saveShopping(getShopping().filter(x => x.id !== id));
  };

  const clearDoneItems = () => {
    saveShopping(getShopping().filter(x => !x.done));
  };

  /* ---- ICS GENERATOR ---- */
  const generateICS = (rdv) => {
    const pad = (n) => String(n).padStart(2, '0');
    const d = new Date(`${rdv.date}T${rdv.time || '09:00'}`);
    const end = new Date(d.getTime() + 60 * 60 * 1000);

    const fmt = (dt) => {
      return `${dt.getFullYear()}${pad(dt.getMonth()+1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}00`;
    };

    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Luna Cycle App//FR',
      'BEGIN:VEVENT',
      `UID:${rdv.id}@luna-cycle`,
      `DTSTART:${fmt(d)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${rdv.title}`,
      rdv.place ? `LOCATION:${rdv.place}` : '',
      rdv.notes ? `DESCRIPTION:${rdv.notes.replace(/\n/g, '\\n')}` : '',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Rappel rendez-vous médical',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
  };

  /* ---- NUTRITION PAR PHASE ---- */
  const getNutritionByPhase = (phase) => {
    const data = {
      menstruation: {
        label: '🩸 Menstruation (j. 1-5)',
        color: '#e879a4',
        calories: '+0 à +100 kcal',
        foods: 'Privilégiez : **fer** (lentilles, épinards, viande rouge), **magnésium** (chocolat noir, banane), **oméga-3** (saumon, noix). Évitez : caféine excessive, alcool, aliments très sucrés.',
        tip: 'Optez pour des repas chauds et réconfortants. Hydratez-vous bien.'
      },
      folliculaire: {
        label: '🌱 Phase folliculaire (j. 6-13)',
        color: '#22c55e',
        calories: '+0 kcal (maintien)',
        foods: 'Privilégiez : **protéines légères** (poulet, poisson, œufs), **légumes crucifères** (brocoli, chou), **aliments fermentés** (yaourt, kéfir). Période idéale pour cuisiner léger.',
        tip: 'Énergie au maximum — profitez pour tester de nouvelles recettes !'
      },
      fertile: {
        label: '🌸 Ovulation (j. 14-16)',
        color: '#f59e0b',
        calories: '+100 à +150 kcal',
        foods: 'Privilégiez : **antioxydants** (fruits rouges, tomates), **zinc** (graines de courge, huîtres), **vitamine C** (poivrons, kiwi). Restez bien hydratée.',
        tip: 'Pic d\'énergie et de confiance — votre métabolisme tourne à plein régime.'
      },
      ovulation: {
        label: '🌸 Ovulation (j. 14-16)',
        color: '#f59e0b',
        calories: '+100 à +150 kcal',
        foods: 'Privilégiez : **antioxydants** (fruits rouges, tomates), **zinc** (graines de courge, huîtres), **vitamine C** (poivrons, kiwi). Restez bien hydratée.',
        tip: 'Pic d\'énergie et de confiance — votre métabolisme tourne à plein régime.'
      },
      luteale: {
        label: '🌙 Phase lutéale (j. 17-28)',
        color: '#9b7fe8',
        calories: '+200 à +300 kcal',
        foods: 'Privilégiez : **magnésium** (amandes, épinards), **vitamine B6** (banane, pomme de terre), **calcium** (produits laitiers, sardines). Réduisez : sel, sucre raffiné.',
        tip: 'Envies de sucré normales ! Optez pour du chocolat noir (70%+) ou des dattes.'
      },
    };
    return data[phase] || data.folliculaire;
  };

  /* ---- CALCUL IMC & CALORIES ---- */
  const calcHealth = (height, weight, age, activity, goal) => {
    const h = height / 100;
    const imc = parseFloat((weight / (h * h)).toFixed(1));
    let imcLabel = '';
    if (imc < 18.5) imcLabel = '⚠️ Insuffisance pondérale';
    else if (imc < 25) imcLabel = '✅ Poids normal';
    else if (imc < 30) imcLabel = '⚠️ Surpoids';
    else imcLabel = '🔴 Obésité';

    // Mifflin-St Jeor (femme)
    const bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    let tdee = Math.round(bmr * activity);

    if (goal === 'perte') tdee -= 300;
    else if (goal === 'prise') tdee += 300;

    // Poids idéal fourchette (IMC 18.5-24.9)
    const pMin = Math.round(18.5 * h * h * 10) / 10;
    const pMax = Math.round(24.9 * h * h * 10) / 10;

    return { imc, imcLabel, tdee, pMin, pMax };
  };

  /* ---- PRINT ---- */
  const generatePrintContent = (section) => {
    const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    let html = `<h1 style="font-family:serif;text-align:center;margin-bottom:1rem">Luna — Rapport de santé</h1>
      <p style="text-align:center;color:#666;margin-bottom:2rem">Généré le ${today}</p>`;

    if (section === 'historique' || section === 'complet') {
      const periods = getPeriods();
      html += `<h2 style="font-family:serif">Historique des cycles</h2><table style="width:100%;border-collapse:collapse;margin-bottom:2rem">
        <tr style="background:#f0f0f0"><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Début</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Fin</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Durée</th></tr>`;
      periods.forEach(p => {
        const d = p.end ? Math.round((new Date(p.end) - new Date(p.start)) / 86400000) + 1 : '—';
        html += `<tr><td style="padding:.5rem;border:1px solid #ccc">${new Date(p.start).toLocaleDateString('fr-FR')}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${p.end ? new Date(p.end).toLocaleDateString('fr-FR') : '—'}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${d} j.</td></tr>`;
      });
      html += '</table>';
    }

    if (section === 'journal' || section === 'complet') {
      const j = getJournal();
      html += `<h2 style="font-family:serif">Journal de santé</h2><table style="width:100%;border-collapse:collapse;margin-bottom:2rem">
        <tr style="background:#f0f0f0"><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Date</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Catégorie</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Notes</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Intensité</th></tr>`;
      j.forEach(e => {
        html += `<tr><td style="padding:.5rem;border:1px solid #ccc">${new Date(e.date).toLocaleDateString('fr-FR')}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${e.category}${e.illnessType ? ' — '+e.illnessType : ''}${e.fever ? ' ('+e.fever+'°C)' : ''}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${e.notes || '—'}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${e.intensity || '—'}/5</td></tr>`;
      });
      html += '</table>';
    }

    if (section === 'poids' || section === 'complet') {
      const w = getWeights();
      html += `<h2 style="font-family:serif">Suivi du poids</h2><table style="width:100%;border-collapse:collapse;margin-bottom:2rem">
        <tr style="background:#f0f0f0"><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Date</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Poids (kg)</th></tr>`;
      w.forEach(x => {
        html += `<tr><td style="padding:.5rem;border:1px solid #ccc">${new Date(x.date).toLocaleDateString('fr-FR')}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${x.value} kg</td></tr>`;
      });
      html += '</table>';
    }

    if (section === 'rdv' || section === 'complet') {
      const rdvs = getRdv();
      html += `<h2 style="font-family:serif">Rendez-vous médicaux</h2><table style="width:100%;border-collapse:collapse;margin-bottom:2rem">
        <tr style="background:#f0f0f0"><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Date</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Titre</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Lieu</th><th style="padding:.5rem;border:1px solid #ccc;text-align:left">Notes</th></tr>`;
      rdvs.forEach(r => {
        html += `<tr><td style="padding:.5rem;border:1px solid #ccc">${new Date(r.date).toLocaleDateString('fr-FR')} ${r.time || ''}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${r.title}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${r.place || '—'}</td>
          <td style="padding:.5rem;border:1px solid #ccc">${r.notes || '—'}</td></tr>`;
      });
      html += '</table>';
    }

    return html;
  };

  return {
    getPeriods, addPeriod, deletePeriod,
    getCycleLength, setCycleLength, calcCycleData,
    getJournal, addJournalEntry, deleteJournalEntry, getIllnessStats,
    getWeights, addWeight, deleteWeight,
    getRdv, addRdv, deleteRdv,
    getShopping, addShoppingItem, toggleShoppingItem, deleteShoppingItem, clearDoneItems,
    generateICS, getNutritionByPhase, calcHealth, generatePrintContent,
  };
})();