const progressBar = document.querySelector(".progress-bar");
const revealElements = document.querySelectorAll(".reveal");
const counters = document.querySelectorAll(".counter");
const bars = document.querySelectorAll("[data-bar]");
const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
const observedSections = document.querySelectorAll("main section[id]");
const menuButton = document.querySelector(".menu-button");
const navMenu = document.querySelector(".nav-links");

function updateProgressBar() {
    if (!progressBar) return;

    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = documentHeight > 0 ? (window.scrollY / documentHeight) * 100 : 0;
    progressBar.style.width = `${Math.min(progress, 100)}%`;
}

function formatCounterValue(value, element) {
    const decimals = Number(element.dataset.decimals || 0);
    const prefix = element.dataset.prefix || "";
    const suffix = element.dataset.suffix || "";

    const formatted = new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);

    return `${prefix}${formatted}${suffix}`;
}

function animateCounter(element) {
    if (element.dataset.animated === "true") return;

    element.dataset.animated = "true";

    const target = Number(element.dataset.target || 0);
    const duration = 1350;
    const startTime = performance.now();

    function frame(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const currentValue = target * eased;

        element.textContent = formatCounterValue(currentValue, element);

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            element.textContent = formatCounterValue(target, element);
        }
    }

    requestAnimationFrame(frame);
}

function animateBar(element) {
    if (element.dataset.animated === "true") return;

    element.dataset.animated = "true";
    const value = Math.max(0, Math.min(Number(element.dataset.bar || 0), 100));
    element.style.width = `${value}%`;
}

const revealObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            entry.target.classList.add("active");
            revealObserver.unobserve(entry.target);
        });
    },
    { threshold: 0.12, rootMargin: "0px 0px -50px 0px" }
);

revealElements.forEach(element => revealObserver.observe(element));

const dataObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            if (entry.target.classList.contains("counter")) {
                animateCounter(entry.target);
            }

            if (entry.target.hasAttribute("data-bar")) {
                animateBar(entry.target);
            }

            dataObserver.unobserve(entry.target);
        });
    },
    { threshold: 0.35 }
);

counters.forEach(counter => dataObserver.observe(counter));
bars.forEach(bar => dataObserver.observe(bar));

const navObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            navLinks.forEach(link => {
                const isCurrent = link.getAttribute("href") === `#${entry.target.id}`;
                link.classList.toggle("active", isCurrent);
            });
        });
    },
    { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
);

observedSections.forEach(section => navObserver.observe(section));

function closeMenu() {
    if (!menuButton || !navMenu) return;

    menuButton.classList.remove("active");
    menuButton.setAttribute("aria-expanded", "false");
    navMenu.classList.remove("open");
}

if (menuButton && navMenu) {
    menuButton.addEventListener("click", () => {
        const isOpen = navMenu.classList.toggle("open");
        menuButton.classList.toggle("active", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
    });

    navMenu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") closeMenu();
    });
}

window.addEventListener("scroll", updateProgressBar, { passive: true });
window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeMenu();
});

updateProgressBar();

/* =========================================================
   COMPARAÇÃO — ESCALA DO DINHEIRO
========================================================= */

const comparisonTabs = document.querySelectorAll(".comparison-tab");
const comparisonRange = document.querySelector("#comparison-range");
const comparisonPercent = document.querySelector("#comparison-percent");
const comparisonTitle = document.querySelector("#comparison-title");
const comparisonMoney = document.querySelector("#comparison-money");
const comparisonDescription = document.querySelector("#comparison-description");
const comparisonPeriod = document.querySelector("#comparison-period");
const comparisonSource = document.querySelector("#comparison-source");
const comparisonSelectedValue = document.querySelector("#comparison-selected-value");
const compareSalaries = document.querySelector("#compare-salaries");
const compareCareers = document.querySelector("#compare-careers");
const compareCars = document.querySelector("#compare-cars");
const supercarTotal = document.querySelector("#supercar-total");
const compareBolsaPercent = document.querySelector("#compare-bolsa-percent");
const compareHealthPercent = document.querySelector("#compare-health-percent");
const compareBolsaBar = document.querySelector("#compare-bolsa-bar");
const compareHealthBar = document.querySelector("#compare-health-bar");
const comparisonPresets = document.querySelectorAll("[data-share]");

const comparisonReferences = {
    minimumWage2026: 1621,
    revueltoPrice: 8245000,
    careerMonths: 40 * 12,
    bolsaFamiliaBudget2026: 158630000000,
    healthBudget2026: 271300000000
};

const comparisonData = {
    pix: {
        value: 20800000000,
        period: "AGOSTO DE 2024",
        title: "Pix enviados para empresas de apostas",
        description: "Estimativa do Banco Central para transferências via Pix destinadas a empresas de apostas em agosto de 2024. O valor representa dinheiro enviado e não desconta eventuais prêmios recebidos.",
        source: "https://agenciabrasil.ebc.com.br/economia/noticia/2024-09/beneficiarios-do-bolsa-familia-gastaram-r-3-bi-em-bets-em-agosto"
    },
    ggr: {
        value: 36959783379.70,
        period: "2025",
        title: "Receita bruta do mercado regulado",
        description: "GGR informado pelas operadoras ao SIGAP: o valor das apostas recebido pelas empresas após a dedução dos prêmios pagos aos apostadores.",
        source: "https://www.gov.br/fazenda/pt-br/composicao/orgaos/secretaria-de-premios-e-apostas/apresentacoes/defeso-2deg-panorama-semestral-de-apostas-de-quota-fixa-jan-2026.pdf"
    },
    bolsa: {
        value: 3000000000,
        period: "AGOSTO DE 2024",
        title: "Pix enviados por beneficiários do Bolsa Família",
        description: "Levantamento do Banco Central identificou aproximadamente R$ 3 bilhões enviados via Pix a empresas de apostas por beneficiários do Bolsa Família naquele mês. O levantamento não comprova que todo o dinheiro transferido tenha origem diretamente no benefício.",
        source: "https://agenciabrasil.ebc.com.br/economia/noticia/2024-09/beneficiarios-do-bolsa-familia-gastaram-r-3-bi-em-bets-em-agosto"
    },
    varejo: {
        value: 143000000000,
        period: "JAN. 2023 → MAR. 2026",
        title: "Impacto estimado sobre o comércio varejista",
        description: "Estimativa apresentada pela CNC para recursos que deixaram de circular no comércio varejista em razão da inadimplência associada às apostas. Este valor não representa receita das operadoras.",
        source: "https://agenciabrasil.ebc.com.br/economia/noticia/2026-04/para-cnc-bets-agravam-endividamento-das-familias-brasileiras"
    }
};

let currentComparison = "ggr";

function formatLargeInteger(value) {
    return new Intl.NumberFormat("pt-BR", {
        maximumFractionDigits: 0
    }).format(Math.floor(value));
}

function formatMoney(value) {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        maximumFractionDigits: 0
    }).format(value);
}

function formatCompactMoney(value) {
    if (value >= 1000000000) {
        const billions = value / 1000000000;
        return `R$ ${billions.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} bilhões`;
    }

    if (value >= 1000000) {
        const millions = value / 1000000;
        return `R$ ${millions.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} milhões`;
    }

    return formatMoney(value);
}

function formatPercentage(value) {
    return `${value.toLocaleString("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1
    })}%`;
}

function updateComparison() {
    if (!comparisonRange) return;

    const data = comparisonData[currentComparison];
    const percentage = Number(comparisonRange.value);
    const selectedValue = data.value * (percentage / 100);

    const salaryCount = selectedValue / comparisonReferences.minimumWage2026;
    const careerValue = comparisonReferences.minimumWage2026 * comparisonReferences.careerMonths;
    const careerCount = selectedValue / careerValue;
    const carCount = selectedValue / comparisonReferences.revueltoPrice;
    const bolsaPercentage = (selectedValue / comparisonReferences.bolsaFamiliaBudget2026) * 100;
    const healthPercentage = (selectedValue / comparisonReferences.healthBudget2026) * 100;

    comparisonPercent.textContent = `${percentage}%`;
    comparisonSelectedValue.textContent = formatCompactMoney(selectedValue);
    compareSalaries.textContent = formatLargeInteger(salaryCount);
    compareCareers.textContent = formatLargeInteger(careerCount);
    compareCars.textContent = formatLargeInteger(carCount);
    supercarTotal.textContent = formatLargeInteger(carCount);
    compareBolsaPercent.textContent = formatPercentage(bolsaPercentage);
    compareHealthPercent.textContent = formatPercentage(healthPercentage);
    compareBolsaBar.style.width = `${Math.min(bolsaPercentage, 100)}%`;
    compareHealthBar.style.width = `${Math.min(healthPercentage, 100)}%`;

    comparisonPresets.forEach(button => {
        const value = Number(button.dataset.share);
        button.classList.toggle("active", value === percentage);
    });
}

function selectComparison(key) {
    if (!comparisonData[key] || !comparisonRange) return;

    currentComparison = key;
    const data = comparisonData[key];

    comparisonTabs.forEach(tab => {
        const active = tab.dataset.comparison === key;
        tab.classList.toggle("active", active);
        tab.setAttribute("aria-pressed", String(active));
    });

    comparisonTitle.textContent = data.title;
    comparisonMoney.textContent = formatCompactMoney(data.value);
    comparisonDescription.textContent = data.description;
    comparisonPeriod.textContent = data.period;
    comparisonSource.href = data.source;
    comparisonRange.value = 100;
    updateComparison();
}

comparisonTabs.forEach(tab => {
    tab.addEventListener("click", () => {
        selectComparison(tab.dataset.comparison);
    });
});

if (comparisonRange) {
    comparisonRange.addEventListener("input", updateComparison);
}

comparisonPresets.forEach(button => {
    button.addEventListener("click", () => {
        comparisonRange.value = button.dataset.share;
        updateComparison();
    });
});

if (comparisonRange) {
    selectComparison(currentComparison);
}
