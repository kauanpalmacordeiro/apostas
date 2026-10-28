const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
});

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const savedProgress = (() => {
    try { return JSON.parse(localStorage.getItem("bet-sim-progress") || "{}"); } catch { return {}; }
})();

const state = {
    balance: 100,
    betIndex: 1,
    spinning: false,
    music: savedProgress.music !== false,
    sfx: savedProgress.sfx !== false,
    started: false,
    millionTriggered: false,
    destroyed: false,
    points: Math.max(0, Number(savedProgress.points || 0)),
    upgrades: {
        chance: Math.max(0, Math.min(5, Number(savedProgress.chance || 0))),
        gain: Math.max(0, Math.min(5, Number(savedProgress.gain || 0))),
        jackpot: Math.max(0, Math.min(5, Number(savedProgress.jackpot || 0)))
    },
    customization: {
        symbols: savedProgress.symbols || "fruits",
        machine: savedProgress.machine || "classic",
        theme: savedProgress.theme || "purple"
    },
    ambientTrack: Math.max(0, Number(savedProgress.ambientTrack || 0))
};

const bets = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];

/*
   Ganhos ajustados para um meio-termo:
   - ~30% de chance de combinação normal
   - ~4% de vitória forte
   - ~0,15% de jackpot
   O evento de R$ 1 milhão continua difícil, mas o jogo não parece "travado".
*/
function emojiSymbol(id, emoji, weight, mult) {
    return { id, weight, mult, svg: `<span class="symbol-emoji" aria-hidden="true">${emoji}</span>` };
}
function glyphSymbol(id, glyph, color, weight, mult) {
    return {
        id,
        weight,
        mult,
        svg: `<svg class="symbol-glyph-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false"><text x="50" y="52" text-anchor="middle" dominant-baseline="middle" fill="${color}">${glyph}</text></svg>`
    };
}

function flagSymbol(id, kind, weight, mult) {
    const flags = {
        br: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><rect x="4" y="4" width="112" height="76" rx="13" fill="#179447"/><path d="M60 13 104 42 60 71 16 42Z" fill="#ffd54a"/><circle cx="60" cy="42" r="16" fill="#2454a5"/><path d="M45 39c12-4 25-1 31 5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/></svg>`,
        jp: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><rect x="4" y="4" width="112" height="76" rx="13" fill="#fff"/><circle cx="60" cy="42" r="20" fill="#d81f35"/></svg>`,
        us: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><defs><clipPath id="us-${id}"><rect x="4" y="4" width="112" height="76" rx="13"/></clipPath></defs><g clip-path="url(#us-${id})"><rect x="4" y="4" width="112" height="76" fill="#fff"/>${Array.from({length:7},(_,i)=>`<rect x="4" y="${4+i*11.7}" width="112" height="6" fill="#d9283d"/>`).join('')}<rect x="4" y="4" width="49" height="36" fill="#244a8f"/><g fill="#fff">${[[13,12],[24,12],[35,12],[46,12],[18,22],[29,22],[40,22],[13,32],[24,32],[35,32],[46,32]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.8"/>`).join('')}</g></g></svg>`,
        fr: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><defs><clipPath id="fr-${id}"><rect x="4" y="4" width="112" height="76" rx="13"/></clipPath></defs><g clip-path="url(#fr-${id})"><rect x="4" y="4" width="38" height="76" fill="#2450a4"/><rect x="42" y="4" width="37" height="76" fill="#fff"/><rect x="79" y="4" width="37" height="76" fill="#e33243"/></g></svg>`,
        it: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><defs><clipPath id="it-${id}"><rect x="4" y="4" width="112" height="76" rx="13"/></clipPath></defs><g clip-path="url(#it-${id})"><rect x="4" y="4" width="38" height="76" fill="#169b62"/><rect x="42" y="4" width="37" height="76" fill="#fff"/><rect x="79" y="4" width="37" height="76" fill="#ce2b37"/></g></svg>`,
        kr: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><rect x="4" y="4" width="112" height="76" rx="13" fill="#fff"/><path d="M60 26a16 16 0 1 1 0 32 8 8 0 1 0 0-16 8 8 0 1 1 0-16Z" fill="#d82b3f"/><path d="M60 58a16 16 0 0 1 0-32 8 8 0 1 0 0 16 8 8 0 1 1 0 16Z" fill="#2454a5"/><g stroke="#171717" stroke-width="3"><path d="m24 22 15 9M21 27l15 9M84 53l15 9M81 58l15 9M88 21l-15 10M92 26 77 36M32 53 18 63M36 58 22 68"/></g></svg>`,
        gb: `<svg class="flag-symbol" viewBox="0 0 120 84" aria-hidden="true"><defs><clipPath id="gb-${id}"><rect x="4" y="4" width="112" height="76" rx="13"/></clipPath></defs><g clip-path="url(#gb-${id})"><rect x="4" y="4" width="112" height="76" fill="#233b7b"/><path d="M4 4 116 80M116 4 4 80" stroke="#fff" stroke-width="16"/><path d="M4 4 116 80M116 4 4 80" stroke="#d52b42" stroke-width="7"/><path d="M60 4v76M4 42h112" stroke="#fff" stroke-width="22"/><path d="M60 4v76M4 42h112" stroke="#d52b42" stroke-width="11"/></g></svg>`
    };
    return { id, weight, mult, svg: flags[kind] || flags.br };
}

const symbolPacks = {
    fruits: [
        { id: "cherry", weight: 28, mult: 1.20, svg: cherrySVG() },
        { id: "lemon",  weight: 24, mult: 1.35, svg: lemonSVG() },
        { id: "clover", weight: 18, mult: 1.60, svg: cloverSVG() },
        { id: "bell",   weight: 13, mult: 2.00, svg: bellSVG() },
        { id: "crown",  weight: 9,  mult: 2.80, svg: crownSVG() },
        { id: "gem",    weight: 5,  mult: 4.00, svg: gemSVG() },
        { id: "star",   weight: 3,  mult: 6.00, svg: starSVG() }
    ],
    casino: [
        emojiSymbol("spade", "♠️", 28, 1.20), emojiSymbol("heart", "♥️", 24, 1.35),
        emojiSymbol("chip", "🎰", 18, 1.60), emojiSymbol("dice", "🎲", 13, 2.00),
        emojiSymbol("cards", "🃏", 9, 2.80), emojiSymbol("diamond", "💎", 5, 4.00),
        emojiSymbol("ticket", "🎟️", 3, 6.00)
    ],
    colors: [
        glyphSymbol("violet", "✦", "#a77bff", 28, 1.20), glyphSymbol("cyan", "❖", "#4ce7f0", 24, 1.35),
        glyphSymbol("amber", "⚡", "#ffd86b", 18, 1.60), glyphSymbol("red", "✹", "#ff6178", 13, 2.00),
        glyphSymbol("green", "♢", "#6dffc1", 9, 2.80), glyphSymbol("blue", "✧", "#72a8ff", 5, 4.00),
        glyphSymbol("white", "✺", "#ffffff", 3, 6.00)
    ],
    countries: [
        flagSymbol("br", "br", 28, 1.20), flagSymbol("jp", "jp", 24, 1.35),
        flagSymbol("us", "us", 18, 1.60), flagSymbol("fr", "fr", 13, 2.00),
        flagSymbol("it", "it", 9, 2.80), flagSymbol("kr", "kr", 5, 4.00),
        flagSymbol("gb", "gb", 3, 6.00)
    ]
};

let symbols = symbolPacks.fruits;

const upgradeConfig = {
    chance: {
        costs: [1000, 2500, 4000, 12000, 24000],
        values: [0, 0.08, 0.15, 0.23, 0.34, 0.48],
        labels: ["Chance base ativa", "+8% de chance", "+15% de chance", "+23% de chance", "+34% de chance", "+48% de chance"]
    },
    gain: {
        costs: [1200, 3000, 5000, 14000, 28000],
        values: [1, 1.22, 1.45, 1.75, 2.1, 2.55],
        labels: ["Ganhos em 100%", "Ganhos em 122%", "Ganhos em 145%", "Ganhos em 175%", "Ganhos em 210%", "Ganhos em 255%"]
    },
    jackpot: {
        costs: [1600, 3600, 6500, 17000, 34000],
        values: [200, 320, 450, 650, 900, 1200],
        labels: ["Jackpot em 200×", "Jackpot em 320×", "Jackpot em 450×", "Jackpot em 650×", "Jackpot em 900×", "Jackpot em 1200×"]
    }
};

/* 15 trilhas ambiente em clima de cassino eletrônico / neon. */
const ambientPlaylist = [
    { title: "Hypnotic Chill", src: "https://opengameart.org/sites/default/files/2010_June_HypnoticChill_17.mp3" },
    { title: "Calm Track", src: "https://opengameart.org/sites/default/files/calm_track-loop.ogg" },
    { title: "The Casino", src: "https://opengameart.org/sites/default/files/the_casino_120bpm.ogg" },
    { title: "Night Club Chill", src: "https://opengameart.org/sites/default/files/night_club_chill_100bpm.ogg" },
    { title: "Vintage Menu", src: "https://opengameart.org/sites/default/files/vintage_menu_0.mp3" },
    { title: "Starfishario", src: "https://opengameart.org/sites/default/files/starfish_0.mp3" },
    { title: "Out There", src: "https://opengameart.org/sites/default/files/OutThere_0.ogg" },
    { title: "Caves", src: "https://opengameart.org/sites/default/files/Caves.ogg" },
    { title: "Anti Matter Magic", src: "https://opengameart.org/sites/default/files/Anti%20Matter%20Magic.ogg" },
    { title: "Currents", src: "https://opengameart.org/sites/default/files/Currents.ogg" },
    { title: "Tribal Chaos", src: "https://opengameart.org/sites/default/files/Tribal%20Chaos.ogg" },
    { title: "Experiment G", src: "https://opengameart.org/sites/default/files/Experiment%20G.ogg" },
    { title: "Space Collisions", src: "https://opengameart.org/sites/default/files/Space%20Collisions_0.ogg" },
    { title: "Wicked Beast", src: "https://opengameart.org/sites/default/files/Wicked%20beast.ogg" },
    { title: "Test Subject", src: "https://opengameart.org/sites/default/files/Test%20Subject_0.ogg" }
];

const lines = [
    { cells: [[0,0],[0,1],[0,2]], path: "M0 50 L300 50" },
    { cells: [[1,0],[1,1],[1,2]], path: "M0 150 L300 150" },
    { cells: [[2,0],[2,1],[2,2]], path: "M0 250 L300 250" },
    { cells: [[0,0],[1,0],[2,0]], path: "M50 0 L50 300" },
    { cells: [[0,1],[1,1],[2,1]], path: "M150 0 L150 300" },
    { cells: [[0,2],[1,2],[2,2]], path: "M250 0 L250 300" },
    { cells: [[0,0],[1,1],[2,2]], path: "M0 0 L300 300" },
    { cells: [[0,2],[1,1],[2,0]], path: "M300 0 L0 300" }
];

const dossierData = {
    escala: {
        index: "01 / ESCALA ECONÔMICA",
        number: "R$ 36,96 bi",
        title: "Receita bruta dos jogos no mercado regulado em 2025.",
        text: "GGR é o valor que permanece com as operadoras depois do pagamento dos prêmios. Não é a mesma coisa que todo o dinheiro movimentado nas apostas.",
        source: "https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apresentacoes/defeso-2deg-panorama-semestral-de-apostas-de-quota-fixa-jan-2026.pdf",
        points: [
            ["R$ 20,8 bi", "Pix enviados a empresas de apostas em agosto de 2024."],
            ["≈ R$ 101,3 mi/dia", "Média aritmética do GGR de 2025."],
            ["25,2 milhões", "CPFs únicos que apostaram no mercado regulado em 2025."]
        ],
        statement: "Um número de bilhões cabe em uma linha de texto. O impacto desse fluxo financeiro não cabe."
    },
    publicidade: {
        index: "02 / PUBLICIDADE E NORMALIZAÇÃO",
        number: "412",
        title: "Processos de fiscalização contra influenciadores digitais em 2025.",
        text: "A presença das bets combina transmissões esportivas, patrocínios, publicidade em redes sociais, influenciadores e acesso permanente pelo celular.",
        source: "https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apresentacoes/defeso-2deg-panorama-semestral-de-apostas-de-quota-fixa-jan-2026.pdf",
        points: [
            ["324", "perfis removidos segundo o panorama oficial."],
            ["229", "conteúdos removidos no período."],
            ["24 horas", "cadastro, depósito e aposta cabem no mesmo dispositivo e podem ocorrer a qualquer momento."]
        ],
        statement: "Quando o anúncio aparece no jogo, na camisa, no intervalo e no celular, apostar deixa de parecer excepcional."
    },
    investigacoes: {
        index: "03 / INVESTIGAÇÕES",
        number: "R$ 1,6 bi",
        title: "Movimentação apontada pela PF na Operação Backyard.",
        text: "O TCC não atribui criminalidade ao mercado inteiro. Ele reúne operações oficiais que investigam plataformas ilegais, lavagem de dinheiro, empresas de fachada e fluxos suspeitos.",
        source: "https://www.gov.br/pf/pt-br/assuntos/noticias/2024/10/pf-desarticula-grupo-que-movimentou-r-1-6-bilhao-para-plataformas-estrangeiras-de-apostas/",
        points: [
            ["R$ 951,1 mi", "bloqueio autorizado na Operação Slots, segundo a PF."],
            ["87 empresas", "citadas como suspeitas na Operação Véu de Maia."],
            ["> R$ 300 mi", "transações suspeitas na Operação Apostas Encerradas."]
        ],
        statement: "Investigação não é condenação. Mas também não é ruído: são operações oficiais seguindo dinheiro, empresas e intermediários."
    },
    renda: {
        index: "04 / RENDA E PROTEÇÃO SOCIAL",
        number: "R$ 3 bi",
        title: "Pix enviados por beneficiários do Bolsa Família às bets em agosto de 2024.",
        text: "O levantamento identifica beneficiários que transferiram valores; não comprova que todo o dinheiro veio diretamente do benefício. A distinção importa para não transformar dado em slogan.",
        source: "https://agenciabrasil.ebc.com.br/economia/noticia/2024-09/beneficiarios-do-bolsa-familia-gastaram-r-3-bi-em-bets-em-agosto",
        points: [
            ["≈ 5 milhões", "beneficiários identificados no levantamento."],
            ["≈ 70%", "eram responsáveis familiares, segundo a divulgação."],
            ["R$ 143 bi", "estimativa da CNC para impacto acumulado no varejo por inadimplência associada às bets."]
        ],
        statement: "O problema não termina quando o dinheiro sai da conta: ele disputa espaço com consumo, contas e renda familiar."
    },
    casos: {
        index: "05 / CASOS DOCUMENTADOS",
        number: "R$ 1,5 mi",
        title: "Dívida estimada descoberta pela família após a morte de um homem de 46 anos.",
        text: "Casos individuais não dizem quantas pessoas passarão pelo mesmo. Eles mostram o que pode existir por trás das médias e percentuais.",
        source: "https://noticias.uol.com.br/cotidiano/ultimas-noticias/2026/06/23/nunca-contou-ele-escondia-vicio-em-apostas-e-divida-de-r-15-milhao.amp.htm",
        points: [
            ["2 imóveis", "perdidos em outro caso documentado, além de cerca de R$ 50 mil em dívidas."],
            ["R$ 400 mil", "perdas relatadas com empréstimos de bancos, familiares e agiotas."],
            ["patrimônio", "veículo usado para pagar agiotas e imóvel bloqueado em decisão judicial relatada pela imprensa."]
        ],
        statement: "A interface mede a rodada em segundos. Algumas famílias medem a consequência em anos."
    },
    saude: {
        index: "06 / SAÚDE PÚBLICA",
        number: "4 frentes",
        title: "Saúde mental, trabalho e estudo, relações e finanças/Justiça.",
        text: "Materiais da Fiocruz e do Ministério da Saúde tratam problemas com apostas como questão de saúde pública, não apenas como uma decisão financeira isolada.",
        source: "https://efg.brasilia.fiocruz.br/ava/external/NUSMAD/jogos-de-aposta/M1.html",
        points: [
            ["Saúde mental", "ansiedade, depressão, culpa, sofrimento psíquico e perda de controle."],
            ["Relações", "ocultação de perdas, conflitos, isolamento e ruptura de vínculos."],
            ["Finanças", "dívidas, inadimplência, venda de patrimônio e problemas judiciais."]
        ],
        statement: "O saldo é apenas uma das telas do problema. O restante aparece na saúde, no trabalho e dentro de casa."
    },
    pesquisa: {
        index: "07 / PESQUISA ESCOLAR",
        number: "234 alunos",
        title: "Dados primários coletados pelo grupo do TCC.",
        text: "Os resultados descrevem a amostra escolar consultada e não devem ser generalizados para todos os estudantes ou para a população brasileira.",
        source: "../TCC/tcc.html#pesquisa",
        points: [
            ["61 • 26,1%", "já utilizaram plataformas de apostas."],
            ["71 • 30,3%", "possuem familiar com dependência em apostas."],
            ["87 • 37,2%", "defendem maior controle governamental."]
        ],
        statement: "A pesquisa não está distante do tema: 71 respostas apontaram convivência com um familiar dependente em apostas."
    },
    comparacao: {
        index: "08 / COMPARAÇÃO DE ESCALA",
        number: "12,32×",
        title: "R$ 36,96 bilhões é 12,32 vezes o valor de R$ 3 bilhões observado entre beneficiários do Bolsa Família.",
        text: "A comparação serve para visualizar ordem de grandeza. Os números têm naturezas econômicas diferentes e não devem ser tratados como medidas equivalentes.",
        source: "../TCC/tcc.html#comparacao",
        points: [
            ["1,78×", "R$ 36,96 bi em relação aos R$ 20,8 bi de Pix para bets em agosto de 2024."],
            ["4,4%", "R$ 1,6 bi da Operação Backyard em relação ao GGR de R$ 36,96 bi."],
            ["visualizar", "a escala ajuda a entender valores que parecem abstratos quando escritos apenas como bilhões."]
        ],
        statement: "Bilhões são abstratos até serem colocados lado a lado. A diferença de escala começa a aparecer quando o número ganha referência."
    }
};

const els = {
    gate: $("#audio-gate"),
    start: $("#start-game"),
    balance: $("#balance"),
    bet: $("#bet-value"),
    lastWin: $("#last-win"),
    spin: $("#spin-button"),
    minus: $("#bet-minus"),
    plus: $("#bet-plus"),
    music: $("#music-toggle"),
    musicSelect: $("#music-select"),
    sfx: $("#sfx-toggle"),
    debug: $("#debug-million"),
    debugPoints: $("#debug-points"),
    slot: $("#slot-machine"),
    reels: $$(".reel"),
    payline: $("#payline-path"),
    millionModal: $("#million-modal"),
    millionValue: $("#million-value"),
    allIn: $("#all-in-button"),
    brokeModal: $("#broke-modal"),
    restart: $("#restart-button"),
    meltdown: $("#meltdown-layer"),
    negativeField: $("#negative-field"),
    glass: $("#glass-layer"),
    fragments: $("#glass-fragments"),
    game: $("#game-page"),
    topbar: $("#game-topbar"),
    aftermath: $("#aftermath"),
    backGame: $("#back-to-game"),
    backGameBottom: $("#back-to-game-bottom"),
    winParticles: $("#win-particles"),
    winBanner: $("#win-banner"),
    winBannerValue: $("#win-banner-value"),
    winBannerLabel: $("#win-banner-label"),
    dossierTabs: $$(".dossier-tab"),
    dossierIndex: $("#dossier-index"),
    dossierNumber: $("#dossier-number"),
    dossierTitle: $("#dossier-title"),
    dossierText: $("#dossier-text"),
    dossierSource: $("#dossier-source"),
    dossierPoints: $("#dossier-points"),
    impactStatement: $("#impact-statement"),
    pointsTop: $("#points-top"),
    customizer: $("#customizer-layer"),
    openCustomizer: $("#open-customizer"),
    closeCustomizer: $("#close-customizer"),
    applyCustomizer: $("#apply-customizer"),
    symbolChoices: $$("[data-symbol-pack]"),
    machineChoices: $$("[data-machine]"),
    themeChoices: $$("[data-theme-choice]"),
    upgradeToast: $("#upgrade-toast"),
    upgradeToastTitle: $("#upgrade-toast-title"),
    upgradeToastDetail: $("#upgrade-toast-detail"),
    upgrades: {
        chance: { card: $("#upgrade-chance-card"), level: $("#upgrade-chance-level"), pips: $("#upgrade-chance-pips"), effect: $("#upgrade-chance-effect"), button: $("#upgrade-chance-button"), cost: $("#upgrade-chance-cost") },
        gain: { card: $("#upgrade-gain-card"), level: $("#upgrade-gain-level"), pips: $("#upgrade-gain-pips"), effect: $("#upgrade-gain-effect"), button: $("#upgrade-gain-button"), cost: $("#upgrade-gain-cost") },
        jackpot: { card: $("#upgrade-jackpot-card"), level: $("#upgrade-jackpot-level"), pips: $("#upgrade-jackpot-pips"), effect: $("#upgrade-jackpot-effect"), button: $("#upgrade-jackpot-button"), cost: $("#upgrade-jackpot-cost") }
    }
};

const audio = {
    ambient: $("#audio-ambient"),
    spin: $("#audio-spin"),
    stop1: $("#audio-stop1"),
    stop2: $("#audio-stop2"),
    stop3: $("#audio-stop3"),
    click: $("#audio-click"),
    win: $("#audio-win"),
    bigWin: $("#audio-big-win"),
    circuit: $("#audio-circuit"),
    glass: $("#audio-glass"),
    upgrade: $("#audio-upgrade"),
    defeat: $("#audio-defeat")
};

audio.ambient.volume = 0.26;
audio.spin.volume = 0;
audio.spin.playbackRate = 0.92;
audio.stop1.volume = audio.stop2.volume = audio.stop3.volume = 0.30;
audio.click.volume = 0.30;
audio.win.volume = 0.62;
audio.bigWin.volume = 0.70;
audio.circuit.volume = 0.68;
audio.glass.volume = 0.82;
audio.upgrade.volume = 0.56;
audio.defeat.volume = 0.62;

function playSound(name, restart = true) {
    if (!state.sfx || !state.started) return;
    const el = audio[name];
    if (!el) return;
    if (restart) el.currentTime = 0;
    el.play().catch(() => {});
}

function fadeAmbient(target, duration = 450) {
    const start = audio.ambient.volume;
    const startTime = performance.now();
    function tick(now) {
        const p = Math.min((now - startTime) / duration, 1);
        audio.ambient.volume = start + (target - start) * p;
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

let sessionLeaving = false;

function clearStoredProgress() {
    try {
        localStorage.removeItem("bet-sim-progress");
    } catch (error) {
        console.warn("Não foi possível limpar o progresso local.", error);
    }
}

function saveProgress() {
    if (sessionLeaving) return;
    try {
        localStorage.setItem("bet-sim-progress", JSON.stringify({
            version: 2,
            points: Math.max(0, Math.floor(state.points)),
            ambientTrack: state.ambientTrack,
            music: state.music,
            sfx: state.sfx,
            chance: state.upgrades.chance,
            gain: state.upgrades.gain,
            jackpot: state.upgrades.jackpot,
            symbols: state.customization.symbols,
            machine: state.customization.machine,
            theme: state.customization.theme
        }));
    } catch (error) {
        console.warn("Não foi possível salvar o progresso local.", error);
    }
}

let ambientAdvanceTimer = null;
let ambientLoadToken = 0;
let ambientFailureCount = 0;

function clearAmbientAdvanceTimer() {
    if (ambientAdvanceTimer !== null) {
        window.clearTimeout(ambientAdvanceTimer);
        ambientAdvanceTimer = null;
    }
}

function scheduleAmbientAdvance(failed = false, token = ambientLoadToken) {
    if (!state.music || !state.started) return;
    clearAmbientAdvanceTimer();

    ambientAdvanceTimer = window.setTimeout(() => {
        ambientAdvanceTimer = null;
        if (!state.music || !state.started || token !== ambientLoadToken) return;

        if (failed) ambientFailureCount += 1;
        else ambientFailureCount = 0;

        if (ambientFailureCount >= ambientPlaylist.length) {
            ambientFailureCount = 0;
            const fallbackToken = ++ambientLoadToken;
            audio.ambient.pause();
            audio.ambient.src = "./assets/audio/ambient_long.ogg";
            audio.ambient.dataset.trackIndex = "fallback";
            audio.ambient.loop = true;
            audio.ambient.currentTime = 0;
            audio.ambient.volume = 0.20;
            audio.ambient.load();
            const fallbackPlay = audio.ambient.play();
            if (fallbackPlay?.catch) fallbackPlay.catch(() => {});
            return;
        }

        const nextIndex = (state.ambientTrack + 1) % ambientPlaylist.length;
        playAmbientIndex(nextIndex);
    }, failed ? 180 : 40);
}

function playAmbientIndex(index = state.ambientTrack) {
    if (!state.music || !state.started || ambientPlaylist.length === 0) return;

    const chosen = ((Number(index) || 0) % ambientPlaylist.length + ambientPlaylist.length) % ambientPlaylist.length;
    const track = ambientPlaylist[chosen];
    const token = ++ambientLoadToken;

    clearAmbientAdvanceTimer();
    state.ambientTrack = chosen;
    ambientFailureCount = 0;
    if (els.musicSelect) els.musicSelect.value = String(chosen);

    audio.ambient.pause();
    audio.ambient.loop = false;
    audio.ambient.currentTime = 0;
    audio.ambient.volume = 0;
    audio.ambient.dataset.trackIndex = String(chosen);
    audio.ambient.src = track.src;
    audio.ambient.load();

    const playPromise = audio.ambient.play();
    if (playPromise?.then) {
        playPromise.then(() => {
            if (token !== ambientLoadToken) return;
            fadeAmbient(0.26, 650);
            saveProgress();
        }).catch(() => {
            if (token !== ambientLoadToken) return;
            scheduleAmbientAdvance(true, token);
        });
    }
}

function nextAmbientTrack() {
    scheduleAmbientAdvance(false, ambientLoadToken);
}

audio.ambient.addEventListener("ended", () => {
    const currentIndex = audio.ambient.dataset.trackIndex;
    if (currentIndex === "fallback") return;
    if (Number(currentIndex) !== state.ambientTrack) return;
    nextAmbientTrack();
});

audio.ambient.addEventListener("error", () => {
    const currentIndex = audio.ambient.dataset.trackIndex;
    if (currentIndex === "fallback") return;
    if (Number(currentIndex) !== state.ambientTrack) return;
    scheduleAmbientAdvance(true, ambientLoadToken);
});

function populateMusicSelect() {
    if (!els.musicSelect) return;
    els.musicSelect.innerHTML = ambientPlaylist.map((track, index) =>
        `<option value="${index}">${String(index + 1).padStart(2, "0")} • ${track.title}</option>`
    ).join("");
    els.musicSelect.value = String(state.ambientTrack);
}

function playDefeatMusic() {
    if (!state.music || !state.started || !audio.defeat) return;
    try {
        audio.ambient.pause();
        audio.ambient.currentTime = 0;
        audio.defeat.currentTime = 0;
        audio.defeat.play().catch(() => {});
    } catch {}
}

function updateAudioButtons() {
    if (els.music) {
        els.music.classList.toggle("muted", !state.music);
        els.music.setAttribute("aria-pressed", String(state.music));
    }
    if (els.sfx) {
        els.sfx.classList.toggle("muted", !state.sfx);
        els.sfx.setAttribute("aria-pressed", String(state.sfx));
    }
}

function startAudio() {
    state.started = true;
    playSound("click");
    if (state.music) playAmbientIndex(state.ambientTrack);
    els.gate.classList.add("closed");
    requestAnimationFrame(fitGameToViewport);
}

function setMusic(enabled) {
    state.music = enabled;
    updateAudioButtons();
    saveProgress();
    if (!state.started) return;
    if (enabled) playAmbientIndex(state.ambientTrack);
    else audio.ambient.pause();
}

function setSfx(enabled) {
    state.sfx = enabled;
    updateAudioButtons();
    saveProgress();

    if (!enabled) {
        Object.entries(audio).forEach(([name, item]) => {
            if (name !== "ambient") item.pause();
        });
    }
}

function makeRandomPack() {
    const all = Object.entries(symbolPacks).flatMap(([key, pack]) => key === "random" ? [] : pack);
    const shuffled = [...all].sort(() => Math.random() - .5);
    return shuffled.slice(0, 7).map((item, index) => ({ ...item, id: `${item.id}-mix-${index}` }));
}

function refreshSymbolPack() {
    symbols = state.customization.symbols === "random"
        ? makeRandomPack()
        : (symbolPacks[state.customization.symbols] || symbolPacks.fruits);
}

function applyCustomization() {
    document.body.dataset.theme = state.customization.theme;
    els.slot.classList.remove("machine-classic", "machine-arcade", "machine-vault", "machine-orbit");
    els.slot.classList.add(`machine-${state.customization.machine}`);
    refreshSymbolPack();

    els.symbolChoices.forEach(button => button.classList.toggle("active", button.dataset.symbolPack === state.customization.symbols));
    els.machineChoices.forEach(button => button.classList.toggle("active", button.dataset.machine === state.customization.machine));
    els.themeChoices.forEach(button => button.classList.toggle("active", button.dataset.themeChoice === state.customization.theme));

    if (!state.spinning) seedInitialReels();
    saveProgress();
    requestAnimationFrame(fitGameToViewport);
}

function openCustomizer() {
    if (state.spinning || state.destroyed) return;
    playSound("click");
    els.customizer.classList.remove("hidden");
}

function closeCustomizer() {
    els.customizer.classList.add("hidden");
}

function upgradeValue(type) {
    return upgradeConfig[type].values[state.upgrades[type]];
}

function updateUpgradeUI() {
    ["chance", "gain", "jackpot"].forEach(type => {
        const level = state.upgrades[type];
        const cfg = upgradeConfig[type];
        const ui = els.upgrades[type];
        ui.card.className = `upgrade-card level-${level}`;
        ui.level.textContent = `NV. ${level}`;
        ui.effect.textContent = cfg.labels[level];
        ui.pips.innerHTML = Array.from({ length: 5 }, (_, index) => `<i class="${index < level ? "on" : ""}"></i>`).join("");

        if (level >= 5) {
            ui.cost.textContent = "MÁXIMO";
            ui.button.disabled = true;
            ui.button.querySelector("span").textContent = "COMPLETO";
        } else {
            const cost = cfg.costs[level];
            ui.cost.textContent = `${new Intl.NumberFormat("pt-BR").format(cost)} pts`;
            ui.button.disabled = state.points < cost || state.spinning || state.destroyed;
            ui.button.querySelector("span").textContent = "EVOLUIR";
        }
    });
}

function showUpgradeToast(type) {
    const names = { chance: "CHANCE DE GANHO", gain: "MULTIPLICADOR", jackpot: "PRÊMIO DE RISCO" };
    const level = state.upgrades[type];
    els.upgradeToastTitle.textContent = `${names[type]} • NÍVEL ${level}`;
    els.upgradeToastDetail.textContent = upgradeConfig[type].labels[level];
    els.upgradeToast.classList.add("show");
    clearTimeout(showUpgradeToast.timer);
    showUpgradeToast.timer = setTimeout(() => els.upgradeToast.classList.remove("show"), 2600);
}

function buyUpgrade(type) {
    if (state.spinning || state.destroyed) return;
    const level = state.upgrades[type];
    const cfg = upgradeConfig[type];
    if (level >= 5) return;
    const cost = cfg.costs[level];
    if (state.points < cost) {
        playSound("click");
        els.upgrades[type].card.animate(
            [{ transform: "translateX(0)" }, { transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }],
            { duration: 240 }
        );
        return;
    }

    state.points -= cost;
    state.upgrades[type] += 1;
    saveProgress();
    updateUI();
    playSound("upgrade");
    showUpgradeToast(type);
}

function gainPoints(amount) {
    state.points += Math.max(0, Math.floor(amount));
    saveProgress();
}

function keepProgressOnBankruptcy() {
    // Saldo pode zerar; pontos e upgrades fazem parte da progressão permanente.
    saveProgress();
    updateUI();
}

function weightedSymbol(pool = symbols) {
    const total = pool.reduce((sum, item) => sum + item.weight, 0);
    let r = Math.random() * total;
    for (const symbol of pool) {
        r -= symbol.weight;
        if (r <= 0) return symbol;
    }
    return pool[0];
}

function evaluate(matrix, bet, boost = 1, jackpotOverride = false) {
    const jackpot = jackpotOverride || matrix.flat().every(cell => cell.id === matrix[0][0].id);
    if (jackpot) {
        return {
            total: Math.round(bet * upgradeValue("jackpot")),
            jackpot: true,
            wins: lines.map((line, index) => ({ ...line, index }))
        };
    }

    const wins = [];
    let total = 0;
    const gainBoost = upgradeValue("gain");

    lines.forEach((line, index) => {
        const [a, b, c] = line.cells.map(([row, col]) => matrix[row][col]);
        if (a.id === b.id && b.id === c.id) {
            const amount = Math.max(bet, Math.round(bet * a.mult * boost * gainBoost));
            total += amount;
            wins.push({ ...line, index, symbol: a, amount });
        }
    });

    return { total, jackpot: false, wins };
}

function randomLosingMatrix() {
    for (let attempt = 0; attempt < 80; attempt++) {
        const matrix = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => weightedSymbol()));
        if (evaluate(matrix, 1).wins.length === 0) return matrix;
    }
    return [
        [symbols[0], symbols[1], symbols[2]],
        [symbols[3], symbols[4], symbols[5]],
        [symbols[1], symbols[6], symbols[0]]
    ];
}

function forcedWinMatrix(premium = false) {
    const matrix = randomLosingMatrix();
    const line = lines[Math.floor(Math.random() * lines.length)];
    const pool = premium ? symbols.slice(3) : symbols;
    const chosen = weightedSymbol(pool);
    line.cells.forEach(([row, col]) => { matrix[row][col] = chosen; });
    return matrix;
}

function jackpotMatrix() {
    const pool = symbols.slice(3);
    const chosen = weightedSymbol(pool);
    return Array.from({ length: 3 }, () => Array(3).fill(chosen));
}

function generateOutcome() {
    const roll = Math.random();
    const chanceBoost = upgradeValue("chance");
    const jackpotChance = Math.min(0.02, 0.0015 + chanceBoost * 0.010);
    const bigChance = Math.min(0.18, 0.04 + chanceBoost * 0.12);
    const normalChance = Math.min(0.72, 0.30 + chanceBoost);

    if (roll < jackpotChance) {
        return { matrix: jackpotMatrix(), boost: 1, jackpot: true, tier: "jackpot" };
    }

    if (roll < jackpotChance + bigChance) {
        return { matrix: forcedWinMatrix(true), boost: 1.75, jackpot: false, tier: "big" };
    }

    if (roll < jackpotChance + bigChance + normalChance) {
        return { matrix: forcedWinMatrix(false), boost: 1, jackpot: false, tier: "normal" };
    }

    return { matrix: randomLosingMatrix(), boost: 1, jackpot: false, tier: "loss" };
}

function forcedAllInLoss() {
    return [
        [symbols[0], symbols[1], symbols[2]],
        [symbols[3], symbols[4], symbols[5]],
        [symbols[1], symbols[6], symbols[0]]
    ];
}

function tileHTML(symbol, row, col) {
    return `<div class="symbol-tile" data-row="${row}" data-col="${col}" data-symbol="${symbol.id}"><div class="symbol-shell">${symbol.svg}</div></div>`;
}

function sizeReelTiles(reel) {
    const strip = $(".reel-strip", reel);
    if (!strip) return 0;

    // A janela do rolo é dividida matematicamente em EXATAMENTE 3 partes.
    // Cada símbolo recebe essa altura em linha, portanto uma quarta peça começa
    // exatamente depois do limite visível e nunca pode "vazar" durante a parada.
    const cell = reel.clientHeight / 3;
    strip.querySelectorAll(".symbol-tile").forEach(tile => {
        tile.style.height = `${cell}px`;
        tile.style.minHeight = `${cell}px`;
        tile.style.maxHeight = `${cell}px`;
    });
    return cell;
}

function syncAllReelGeometry() {
    els.reels.forEach(reel => sizeReelTiles(reel));
}

function seedInitialReels() {
    els.reels.forEach((reel, col) => {
        const strip = $(".reel-strip", reel);
        const initial = Array.from({ length: 3 }, () => weightedSymbol());
        strip.innerHTML = initial.map((symbol, row) => tileHTML(symbol, row, col)).join("");
        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";
        sizeReelTiles(reel);
    });
}

/*
   O strip começa deslocado para cima e percorre fisicamente as peças.
   As três colunas possuem durações diferentes para dar a sensação real de rolo.
*/
function spinReel(reel, col, finalColumn, duration) {
    return new Promise(resolve => {
        const strip = $(".reel-strip", reel);
        const fillerCount = 14;
        const fillers = Array.from({ length: fillerCount }, () => weightedSymbol());
        const list = [...finalColumn, ...fillers];
        strip.innerHTML = list.map((symbol, i) => tileHTML(symbol, i < 3 ? i : -1, col)).join("");

        // A altura é baseada na janela REAL do rolo, não em vw/max-height.
        const cell = sizeReelTiles(reel);
        const travel = fillerCount * cell;

        strip.style.transition = "none";
        strip.style.transform = `translateY(${-travel}px)`;
        reel.classList.add("spinning");
        strip.getBoundingClientRect();

        // Removemos a longa cauda de desaceleração: o fim visual da animação
        // é o mesmo instante em que as peças auxiliares são removidas.
        const visualDuration = reduceMotion ? duration : Math.max(260, duration - 180);
        let finalized = false;
        let fallbackTimer;

        const finalize = () => {
            if (finalized) return;
            finalized = true;
            clearTimeout(fallbackTimer);
            strip.removeEventListener("transitionend", onTransitionEnd);

            strip.style.transition = "none";
            strip.style.transform = "translateY(0)";
            strip.innerHTML = finalColumn
                .map((symbol, row) => tileHTML(symbol, row, col))
                .join("");
            sizeReelTiles(reel);

            reel.classList.remove("spinning");
            playSound(`stop${col + 1}`);
            resolve();
        };

        const onTransitionEnd = event => {
            if (event.propertyName === "transform") finalize();
        };

        strip.addEventListener("transitionend", onTransitionEnd, { once: true });
        strip.style.transition = `transform ${visualDuration}ms cubic-bezier(.14,.72,.22,.98)`;
        strip.style.transform = "translateY(0)";

        // Fallback apenas para navegadores que eventualmente não emitam transitionend.
        fallbackTimer = setTimeout(finalize, visualDuration + 45);
    });
}

async function runSpin(matrix, isAllIn = false) {
    const finalColumns = [0, 1, 2].map(col => [matrix[0][col], matrix[1][col], matrix[2][col]]);
    els.spin.classList.add("spinning");
    els.payline.classList.remove("show");
    clearWinners();

    const durations = reduceMotion
        ? [80, 100, 120]
        : isAllIn
            ? [1850, 2300, 2720]
            : [1180, 1480, 1800];

    await Promise.all(els.reels.map((reel, col) => spinReel(reel, col, finalColumns[col], durations[col])));
    els.spin.classList.remove("spinning");
}

function markWin(wins) {
    clearWinners();
    const unique = new Set();
    wins.forEach(win => win.cells.forEach(([row, col]) => unique.add(`${row}-${col}`)));

    unique.forEach(key => {
        const [row, col] = key.split("-");
        const tile = $(`.reel[data-reel="${col}"] .symbol-tile[data-row="${row}"]`);
        if (tile) tile.classList.add("winner");
    });

    if (wins[0]) {
        els.payline.setAttribute("d", wins[0].path);
        els.payline.classList.remove("show");
        void els.payline.getBoundingClientRect();
        els.payline.classList.add("show");
    }
}

function clearWinners() {
    $$(".symbol-tile.winner").forEach(tile => tile.classList.remove("winner"));
    els.payline.classList.remove("show");
}

function spawnWinSparks(big = false) {
    els.winParticles.innerHTML = "";
    const count = reduceMotion ? 7 : (big ? 42 : 22);

    for (let i = 0; i < count; i++) {
        const spark = document.createElement("i");
        spark.className = "win-spark";
        spark.style.setProperty("--x", `${Math.random() * 100}%`);
        spark.style.setProperty("--size", `${7 + Math.random() * 12}px`);
        spark.style.setProperty("--dur", `${1.3 + Math.random() * 1.3}s`);
        spark.style.setProperty("--delay", `${Math.random() * .55}s`);
        spark.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
        spark.style.setProperty("--rot", `${-360 + Math.random() * 720}deg`);
        els.winParticles.appendChild(spark);
    }
}

function flashWin(big = false, amount = 0, jackpot = false) {
    document.body.classList.remove("win-state");
    void document.body.offsetWidth;
    document.body.classList.add("win-state");

    fadeAmbient(big ? 0.035 : 0.055, 220);
    spawnWinSparks(big);

    els.winBannerLabel.textContent = jackpot ? "JACKPOT" : big ? "GRANDE GANHO" : "COMBINAÇÃO";
    els.winBannerValue.textContent = money.format(amount);
    els.winBanner.classList.remove("show");
    void els.winBanner.offsetWidth;
    els.winBanner.classList.add("show");

    playSound(big ? "bigWin" : "win");

    setTimeout(() => {
        document.body.classList.remove("win-state");
        if (state.music) fadeAmbient(0.26, 850);
    }, big ? 2500 : 1500);
}

function currentBet() {
    return Math.min(bets[state.betIndex], 100000, state.balance);
}

function updateUI() {
    const bet = currentBet();
    els.balance.textContent = money.format(state.balance);
    els.bet.textContent = money.format(bet);
    els.minus.disabled = state.spinning || state.betIndex <= 0;
    els.plus.disabled = state.spinning || bets[state.betIndex] >= Math.min(100000, state.balance);
    els.spin.disabled = state.spinning || state.balance <= 0 || state.destroyed;
    const pointsFormatted = new Intl.NumberFormat("pt-BR").format(Math.floor(state.points));
    if (els.pointsTop) els.pointsTop.textContent = pointsFormatted;
    updateUpgradeUI();
}

function adjustBet(dir) {
    if (state.spinning) return;
    playSound("click");
    let next = state.betIndex + dir;
    next = Math.max(0, Math.min(next, bets.length - 1));
    while (next > 0 && bets[next] > state.balance) next--;
    state.betIndex = next;
    updateUI();
}

async function spin() {
    if (state.spinning || state.destroyed) return;

    const bet = currentBet();
    if (bet <= 0 || state.balance < bet) return;

    /* Rodadas nunca alteram upgrades. Esta cópia também protege o estado
       contra qualquer regressão futura dentro da animação/resultado. */
    const upgradeSnapshot = { ...state.upgrades };
    let resultTotal = 0;
    let resultWasWin = false;

    state.spinning = true;
    playSound("click");
    state.balance -= bet;

    if (state.customization.symbols === "random") refreshSymbolPack();
    els.lastWin.textContent = money.format(0);
    updateUI();

    const outcome = generateOutcome();

    try {
        await runSpin(outcome.matrix);
        const result = evaluate(outcome.matrix, bet, outcome.boost, outcome.jackpot);
        resultTotal = result.total;
        resultWasWin = result.total > 0;

        if (resultWasWin) {
            gainPoints(result.total);
            state.balance += result.total;
            els.lastWin.textContent = money.format(result.total);
            markWin(result.wins);

            const big = result.jackpot || outcome.tier === "big" || result.total >= bet * 8;
            flashWin(big, result.total, result.jackpot);
        } else {
            gainPoints(bet);
        }
    } catch (error) {
        console.error("Erro durante a rodada. O jogo foi recuperado sem travar.", error);
        settleReelsImmediately(outcome.matrix);
        gainPoints(bet);
    } finally {
        state.upgrades.chance = upgradeSnapshot.chance;
        state.upgrades.gain = upgradeSnapshot.gain;
        state.upgrades.jackpot = upgradeSnapshot.jackpot;
        state.spinning = false;
        els.spin.classList.remove("spinning");
        saveProgress();
        updateUI();
    }

    if (state.balance >= 1000000 && !state.millionTriggered) {
        state.millionTriggered = true;
        window.setTimeout(showMillionModal, resultWasWin ? 1200 : 250);
    } else if (state.balance <= 0) {
        keepProgressOnBankruptcy();
        window.setTimeout(() => els.brokeModal.classList.remove("hidden"), 420);
    }
}

function showMillionModal() {
    els.millionValue.textContent = money.format(state.balance);
    els.millionModal.classList.remove("hidden");
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function settleReelsImmediately(matrix) {
    const finalColumns = [0, 1, 2].map(col => [matrix[0][col], matrix[1][col], matrix[2][col]]);

    els.reels.forEach((reel, col) => {
        const strip = $(".reel-strip", reel);
        if (!strip) return;

        strip.style.transition = "none";
        strip.style.transform = "translateY(0)";
        strip.innerHTML = finalColumns[col]
            .map((symbol, row) => tileHTML(symbol, row, col))
            .join("");

        sizeReelTiles(reel);
        reel.classList.remove("spinning");
    });

    els.spin.classList.remove("spinning");
}

async function allInLoss() {
    if (state.spinning || state.destroyed) return;

    els.millionModal.classList.add("hidden");
    state.spinning = true;

    const all = state.balance;
    const finalMatrix = forcedAllInLoss();

    state.balance = 0;
    els.bet.textContent = money.format(all);
    els.balance.textContent = money.format(0);
    playSound("click");

    try {
        await Promise.race([
            runSpin(finalMatrix, true),
            wait(reduceMotion ? 450 : 3400)
        ]);
    } catch (error) {
        console.error("Falha na animação da rodada final; usando encerramento seguro.", error);
    } finally {
        settleReelsImmediately(finalMatrix);
        els.lastWin.textContent = money.format(0);
        state.spinning = false;
        state.destroyed = true;
        saveProgress();
        updateUI();
    }

    await wait(reduceMotion ? 100 : 320);
    await beginMeltdown();
}

function showAftermath() {
    document.body.classList.remove("meltdown", "win-state");
    document.body.classList.add("aftermath-mode");
    document.documentElement.classList.add("aftermath-mode");

    els.millionModal.classList.add("hidden");
    els.brokeModal.classList.add("hidden");
    if (els.customizer) els.customizer.classList.add("hidden");

    els.meltdown.classList.remove("active");
    els.game.style.display = "none";
    els.game.setAttribute("aria-hidden", "true");
    els.topbar.style.display = "none";
    els.topbar.setAttribute("aria-hidden", "true");

    els.aftermath.classList.add("visible");
    els.aftermath.removeAttribute("hidden");
    els.aftermath.style.setProperty("display", "block", "important");
    els.aftermath.style.setProperty("visibility", "visible", "important");
    els.aftermath.style.setProperty("opacity", "1", "important");
    els.aftermath.style.setProperty("height", "auto", "important");
    els.aftermath.style.setProperty("overflow", "visible", "important");

    document.documentElement.style.setProperty("height", "auto", "important");
    document.documentElement.style.setProperty("overflow-y", "auto", "important");
    document.body.style.setProperty("height", "auto", "important");
    document.body.style.setProperty("overflow-y", "auto", "important");

    renderDossier("escala");
    void els.aftermath.offsetHeight;
    window.scrollTo(0, 0);
}

let meltdownSequence = 0;

async function beginMeltdown() {
    const sequence = ++meltdownSequence;

    els.glass.classList.remove("active", "cracking", "split");
    els.meltdown.classList.remove("active");
    els.aftermath.classList.remove("visible");

    if (state.music) {
        fadeAmbient(0, 320);
        window.setTimeout(() => {
            if (sequence === meltdownSequence) audio.ambient.pause();
        }, 340);
    }
    playSound("circuit");
    document.body.classList.add("meltdown");
    els.meltdown.classList.add("active");
    spawnNegativeNumbers();

    try {
        await wait(reduceMotion ? 180 : 2500);
        if (sequence !== meltdownSequence) return;

        document.body.classList.remove("meltdown");
        els.meltdown.classList.remove("active");
        els.glass.classList.add("active", "cracking");
        playSound("glass");
        createFragments();

        await wait(reduceMotion ? 220 : 2250);
        if (sequence !== meltdownSequence) return;

        /* A nova tela aparece NO MESMO INSTANTE em que o vidro se parte.
           Os cacos continuam animando por cima do dossiê até desaparecerem. */
        els.glass.classList.add("split");
        playDefeatMusic();
        showAftermath();
        initAftermathParallax();

        /* Mantém apenas a camada de vidro/cacos por tempo suficiente para
           a animação terminar, sem segurar a entrada do dossiê. */
        await wait(reduceMotion ? 260 : 2300);
        if (sequence !== meltdownSequence) return;

        els.glass.classList.remove("active", "cracking", "split");
    } catch (error) {
        console.error("Erro no efeito de colapso; exibindo o dossiê em modo seguro.", error);
    } finally {
        if (sequence === meltdownSequence && state.destroyed && !els.aftermath.classList.contains("visible")) {
            showAftermath();
        }
    }
}

function spawnNegativeNumbers() {
    els.negativeField.innerHTML = "";
    const values = [1200, 8600, 24500, 50000, 100000, 248000, 500000, 1000000, 1385000, 2200000];
    const count = reduceMotion ? 12 : 62;

    for (let i = 0; i < count; i++) {
        const item = document.createElement("span");
        item.className = "negative-number";
        const value = values[Math.floor(Math.random() * values.length)];
        item.textContent = `− ${money.format(value)}`;
        item.style.left = `${Math.random() * 92}%`;
        item.style.top = `${-10 - Math.random() * 40}%`;
        item.style.fontSize = `${0.64 + Math.random() * 1.12}rem`;
        item.style.setProperty("--dur", `${0.95 + Math.random() * 1.8}s`);
        item.style.setProperty("--rot", `${-18 + Math.random() * 36}deg`);
        item.style.animationDelay = `${Math.random() * 1.9}s`;
        els.negativeField.appendChild(item);
    }
}

function createFragments() {
    els.fragments.innerHTML = "";
    const count = reduceMotion ? 8 : 52;

    for (let i = 0; i < count; i++) {
        const shard = document.createElement("i");
        shard.className = "glass-fragment";
        const angle = Math.random() * Math.PI * 2;
        const distance = 250 + Math.random() * 780;

        shard.style.setProperty("--w", `${16 + Math.random() * 58}px`);
        shard.style.setProperty("--h", `${22 + Math.random() * 82}px`);
        shard.style.setProperty("--tx", `${Math.cos(angle) * distance}px`);
        shard.style.setProperty("--ty", `${Math.sin(angle) * distance + 130}px`);
        shard.style.setProperty("--rr", `${-260 + Math.random() * 520}deg`);
        shard.style.setProperty("--d", `${0.85 + Math.random() * 1.2}s`);
        shard.style.setProperty("--delay", `${Math.random() * .27}s`);
        els.fragments.appendChild(shard);
    }
}

function restart() {
    state.balance = 100;
    state.betIndex = 1;
    state.spinning = false;
    state.millionTriggered = false;
    state.destroyed = false;

    els.lastWin.textContent = money.format(0);
    els.brokeModal.classList.add("hidden");
    els.millionModal.classList.add("hidden");
    clearWinners();
    seedInitialReels();
    updateUI();
    saveProgress();
    requestAnimationFrame(fitGameToViewport);
}

function returnToGame() {
    // Cancela qualquer sequência visual ainda pendente antes de restaurar o jogo.
    meltdownSequence++;
    if (audio.defeat) {
        audio.defeat.pause();
        audio.defeat.currentTime = 0;
    }
    restart();
    document.body.classList.remove("aftermath-mode", "meltdown", "win-state");
    document.documentElement.classList.remove("aftermath-mode");
    els.meltdown.classList.remove("active");
    els.glass.classList.remove("active", "cracking", "split");

    els.aftermath.classList.remove("visible");
    els.aftermath.style.display = "";
    els.aftermath.style.visibility = "";
    els.aftermath.style.opacity = "";
    els.aftermath.style.overflow = "";

    document.documentElement.style.removeProperty("height");
    document.documentElement.style.removeProperty("min-height");
    document.documentElement.style.removeProperty("overflow-x");
    document.documentElement.style.removeProperty("overflow-y");
    document.body.style.removeProperty("height");
    document.body.style.removeProperty("min-height");
    document.body.style.removeProperty("overflow-x");
    document.body.style.removeProperty("overflow-y");

    els.game.removeAttribute("aria-hidden");
    els.topbar.removeAttribute("aria-hidden");
    els.game.style.display = "grid";
    els.topbar.style.display = "flex";
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    requestAnimationFrame(() => {
        fitGameToViewport();
        syncAllReelGeometry();
    });

    if (state.music && state.started) playAmbientIndex(state.ambientTrack);
}

function debugMillion() {
    if (state.destroyed || state.spinning) return;
    playSound("click");
    state.balance = 1000000;
    state.millionTriggered = true;
    updateUI();
    showMillionModal();
}

function debugPoints() {
    if (state.destroyed || state.spinning) return;
    playSound("upgrade");
    state.points += 25000;
    updateUI();
    saveProgress();
}


function renderDossier(key) {
    const data = dossierData[key];
    if (!data) return;

    els.dossierTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.dossier === key));
    els.dossierIndex.textContent = data.index;
    els.dossierNumber.textContent = data.number;
    els.dossierTitle.textContent = data.title;
    els.dossierText.textContent = data.text;
    els.dossierSource.href = data.source;
    els.impactStatement.textContent = data.statement;

    els.dossierPoints.innerHTML = data.points.map(([title, text]) => `
        <div class="dossier-point">
            <strong>${title}</strong>
            <span>${text}</span>
        </div>
    `).join("");
}

function initAftermathParallax() {
    if (reduceMotion || !window.matchMedia("(pointer:fine)").matches) return;
    const section = els.aftermath;
    if (!section.classList.contains("visible") || section.dataset.parallaxReady === "true") return;

    section.dataset.parallaxReady = "true";
    const cards = $$(".parallax-card", section);

    section.addEventListener("pointermove", event => {
        const rect = section.getBoundingClientRect();
        const nx = ((event.clientX - rect.left) / rect.width - .5) * 2;
        const ny = ((event.clientY - rect.top) / Math.max(innerHeight, 700) - .4) * 2;

        section.style.setProperty("--mx", nx.toFixed(3));
        section.style.setProperty("--my", ny.toFixed(3));

        cards.forEach(card => {
            const depth = Number(card.dataset.depth || .12);
            card.style.transform = `translate3d(${nx * depth * 20}px, ${ny * depth * 13}px, 0)`;
        });
    });

    section.addEventListener("pointerleave", () => {
        section.style.setProperty("--mx", 0);
        section.style.setProperty("--my", 0);
        cards.forEach(card => card.style.transform = "translate3d(0,0,0)");
    });
}

/* =========================================================
   ENCAIXE DO JOGO NA VIEWPORT — DESKTOP / NOTEBOOK
   Mantém máquina e upgrades inteiros na tela sem exigir scroll.
========================================================= */

function fitGameToViewport() {
    const stage = $(".game-stage");
    if (!stage) return;

    if (window.innerWidth <= 980) {
        stage.style.setProperty("--fit-scale", "1");
        return;
    }

    stage.style.setProperty("--fit-scale", "1");

    const sidebarWidth = 154;
    const horizontalMargin = 34;
    const verticalMargin = 24;
    const availableHeight = Math.max(560, window.innerHeight - verticalMargin * 2);
    const availableWidth = Math.max(900, window.innerWidth - sidebarWidth - horizontalMargin);

    const rawWidth = stage.scrollWidth;
    const rawHeight = stage.scrollHeight;
    const scale = Math.min(1, availableWidth / rawWidth, availableHeight / rawHeight);

    stage.style.setProperty("--fit-scale", scale.toFixed(4));
}

let fitTimer;
window.addEventListener("resize", () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(() => {
        fitGameToViewport();
        syncAllReelGeometry();
    }, 80);
});

function resetWholeExperienceForNewVisit() {
    sessionLeaving = false;
    clearStoredProgress();
    meltdownSequence++;

    state.balance = 100;
    state.betIndex = 1;
    state.spinning = false;
    state.music = true;
    state.sfx = true;
    state.started = false;
    state.millionTriggered = false;
    state.destroyed = false;
    state.points = 0;
    state.ambientTrack = 0;
    if (els.musicSelect) els.musicSelect.value = "0";
    state.upgrades.chance = 0;
    state.upgrades.gain = 0;
    state.upgrades.jackpot = 0;
    state.customization.symbols = "fruits";
    state.customization.machine = "classic";
    state.customization.theme = "purple";

    Object.values(audio).forEach(item => {
        try {
            item.pause();
            item.currentTime = 0;
        } catch {}
    });

    document.body.classList.remove("aftermath-mode", "meltdown", "win-state");
    document.documentElement.classList.remove("aftermath-mode");

    els.gate.classList.remove("closed");
    els.meltdown.classList.remove("active");
    els.glass.classList.remove("active", "cracking", "split");
    els.fragments.innerHTML = "";
    els.negativeField.innerHTML = "";
    els.millionModal.classList.add("hidden");
    els.brokeModal.classList.add("hidden");
    if (els.customizer) els.customizer.classList.add("hidden");

    els.aftermath.classList.remove("visible");
    els.aftermath.style.display = "";
    els.aftermath.style.visibility = "";
    els.aftermath.style.opacity = "";
    els.aftermath.style.overflow = "";

    document.documentElement.style.removeProperty("height");
    document.documentElement.style.removeProperty("min-height");
    document.documentElement.style.removeProperty("overflow-x");
    document.documentElement.style.removeProperty("overflow-y");
    document.body.style.removeProperty("height");
    document.body.style.removeProperty("min-height");
    document.body.style.removeProperty("overflow-x");
    document.body.style.removeProperty("overflow-y");

    els.game.removeAttribute("aria-hidden");
    els.topbar.removeAttribute("aria-hidden");
    els.game.style.display = "grid";
    els.topbar.style.display = "flex";

    applyCustomization();
    updateAudioButtons();
    updateUI();
    clearWinners();
    seedInitialReels();
    renderDossier("escala");
    window.scrollTo(0, 0);
    requestAnimationFrame(() => {
        fitGameToViewport();
        syncAllReelGeometry();
    });
}

/* O progresso desta experiência existe apenas enquanto o usuário permanece
   nesta página. Sair, recarregar ou voltar depois começa tudo do zero. */
window.addEventListener("pagehide", () => {
    sessionLeaving = true;
    clearStoredProgress();
});

window.addEventListener("beforeunload", () => {
    sessionLeaving = true;
    clearStoredProgress();
});

window.addEventListener("pageshow", event => {
    if (event.persisted) resetWholeExperienceForNewVisit();
});

els.start.addEventListener("click", startAudio);
els.music.addEventListener("click", () => setMusic(!state.music));
if (els.musicSelect) {
    els.musicSelect.addEventListener("change", event => {
        const selectedTrack = Number(event.target.value || 0);
        state.ambientTrack = selectedTrack;
        saveProgress();
        if (state.started) {
            if (!state.music) {
                state.music = true;
                updateAudioButtons();
            }
            playAmbientIndex(selectedTrack);
        }
    });
}
els.sfx.addEventListener("click", () => setSfx(!state.sfx));
els.debug.addEventListener("click", debugMillion);
els.debugPoints.addEventListener("click", debugPoints);
els.minus.addEventListener("click", () => adjustBet(-1));
els.plus.addEventListener("click", () => adjustBet(1));
els.spin.addEventListener("click", spin);
els.allIn.addEventListener("click", allInLoss);
els.restart.addEventListener("click", restart);
els.backGame.addEventListener("click", returnToGame);
els.backGameBottom.addEventListener("click", returnToGame);
els.dossierTabs.forEach(tab => tab.addEventListener("click", () => renderDossier(tab.dataset.dossier)));

els.openCustomizer.addEventListener("click", openCustomizer);
els.closeCustomizer.addEventListener("click", closeCustomizer);
els.applyCustomizer.addEventListener("click", () => { playSound("click"); closeCustomizer(); });
els.customizer.querySelectorAll("[data-close-customizer]").forEach(item => item.addEventListener("click", closeCustomizer));

els.symbolChoices.forEach(button => button.addEventListener("click", () => {
    state.customization.symbols = button.dataset.symbolPack;
    playSound("click");
    applyCustomization();
}));
els.machineChoices.forEach(button => button.addEventListener("click", () => {
    state.customization.machine = button.dataset.machine;
    playSound("click");
    applyCustomization();
}));
els.themeChoices.forEach(button => button.addEventListener("click", () => {
    state.customization.theme = button.dataset.themeChoice;
    playSound("click");
    applyCustomization();
}));

Object.entries(els.upgrades).forEach(([type, ui]) => {
    ui.button.addEventListener("click", () => buyUpgrade(type));
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !els.customizer.classList.contains("hidden")) {
        closeCustomizer();
        return;
    }
    if (
        event.code === "Space" &&
        state.started &&
        !state.spinning &&
        els.customizer.classList.contains("hidden") &&
        els.millionModal.classList.contains("hidden") &&
        els.brokeModal.classList.contains("hidden") &&
        !state.destroyed &&
        !els.aftermath.classList.contains("visible")
    ) {
        event.preventDefault();
        spin();
    }
});

applyCustomization();
populateMusicSelect();
updateAudioButtons();
updateUI();
renderDossier("escala");
requestAnimationFrame(() => {
    fitGameToViewport();
    syncAllReelGeometry();
});

/* =========================================================
   SVGs simples — fáceis de manter, sem personagens complexos
========================================================= */
function cherrySVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="chG" x1="0" x2="1"><stop stop-color="#c698ff"/><stop offset="1" stop-color="#6b28dc"/></linearGradient></defs><path d="M49 48C53 30 66 18 82 17" fill="none" stroke="#85e7bb" stroke-width="7" stroke-linecap="round"/><path d="M56 45C49 28 37 20 24 19" fill="none" stroke="#69cfa3" stroke-width="7" stroke-linecap="round"/><path d="M65 20c8-10 18-8 24-2-7 8-15 10-24 2Z" fill="#73d9ad"/><circle cx="31" cy="67" r="19" fill="url(#chG)"/><circle cx="68" cy="66" r="19" fill="url(#chG)"/><circle cx="24" cy="59" r="5" fill="#efe4ff" opacity=".8"/><circle cx="61" cy="58" r="5" fill="#efe4ff" opacity=".8"/></svg>`}
function lemonSVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="leG" x1="0" x2="1"><stop stop-color="#ffe18a"/><stop offset="1" stop-color="#ffad45"/></linearGradient></defs><path d="M29 52C29 28 45 16 68 25c13 5 18 22 10 38-8 17-28 24-43 12-8-6-10-15-6-23Z" fill="url(#leG)"/><path d="M65 25c2-11 11-16 22-15-1 10-8 17-22 15Z" fill="#80ddb2"/><path d="M41 36c8-7 17-8 24-5" fill="none" stroke="#fff4bc" stroke-width="6" stroke-linecap="round" opacity=".75"/></svg>`}
function cloverSVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="clG" x1="0" x2="1"><stop stop-color="#68e8c3"/><stop offset="1" stop-color="#6563df"/></linearGradient></defs><path d="M51 84V51" stroke="#80e6c4" stroke-width="8" stroke-linecap="round"/><path d="M50 49C28 53 18 41 23 28c5-13 22-13 29 1 7-15 24-14 29-1 5 14-7 25-29 21-4 21-18 28-29 20-11-9-5-26 12-28" fill="url(#clG)" stroke="#c6f5e7" stroke-width="2"/></svg>`}
function bellSVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="beG" x1="0" x2="1"><stop stop-color="#ffe07c"/><stop offset=".62" stop-color="#f1ad45"/><stop offset="1" stop-color="#7f3fe0"/></linearGradient></defs><path d="M25 68h50l-8-11V42c0-14-8-24-17-24S33 28 33 42v15L25 68Z" fill="url(#beG)" stroke="#ffeab1" stroke-width="2"/><path d="M42 73c1 9 15 9 16 0" fill="none" stroke="#ffd56d" stroke-width="7" stroke-linecap="round"/><path d="M38 38c2-8 7-12 13-13" fill="none" stroke="#fff0c8" stroke-width="5" stroke-linecap="round" opacity=".75"/></svg>`}
function crownSVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="crG" x1="0" x2="1"><stop stop-color="#ffdf79"/><stop offset=".46" stop-color="#a97bff"/><stop offset="1" stop-color="#6030c7"/></linearGradient></defs><path d="M18 32 36 49 50 23 64 49 83 31 75 72H26L18 32Z" fill="url(#crG)" stroke="#ffe7a7" stroke-width="2"/><rect x="27" y="69" width="48" height="10" rx="5" fill="#ffcf6d"/><circle cx="18" cy="31" r="5" fill="#fff0ba"/><circle cx="50" cy="22" r="5" fill="#fff0ba"/><circle cx="83" cy="31" r="5" fill="#fff0ba"/></svg>`}
function gemSVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="geG" x1="0" x2="1"><stop stop-color="#a58bff"/><stop offset=".5" stop-color="#6c32da"/><stop offset="1" stop-color="#67e0bd"/></linearGradient></defs><path d="M21 39 35 21h31l14 18-30 43-29-43Z" fill="url(#geG)" stroke="#f0e6ff" stroke-width="2"/><path d="M21 39h59M35 21l15 18 16-18M50 39v43M21 39l29 43 30-43" fill="none" stroke="#fff" stroke-width="2" opacity=".55"/></svg>`}
function starSVG(){return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="stG" x1="0" x2="1"><stop stop-color="#fff0a1"/><stop offset=".48" stop-color="#a475ff"/><stop offset="1" stop-color="#5723bb"/></linearGradient></defs><path d="m50 13 10 23 25 2-19 17 6 25-22-13-22 13 6-25-19-17 25-2 10-23Z" fill="url(#stG)" stroke="#fff1cb" stroke-width="2"/><path d="m50 25 5 12" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".65"/></svg>`}