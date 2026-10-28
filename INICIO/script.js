const tela = document.querySelector(".tela");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let navegando = false;

function abrirTela(lado) {
    if (navegando) return;

    navegando = true;
    tela.classList.add(lado === "tcc" ? "abrir-tcc" : "abrir-jogar");

    const destino = lado === "tcc" ? "../TCC/tcc.html" : "../JOGAR/jogar.html";

    setTimeout(() => {
        window.location.href = destino;
    }, reduceMotion ? 80 : 820);
}

/* =========================================================
   ÚNICO EFEITO INTERATIVO DO TCC: BOTÃO MAGNÉTICO
========================================================= */

if (!reduceMotion && window.matchMedia("(pointer: fine)").matches) {
    document.querySelectorAll(".magnetic").forEach((botao) => {
        botao.addEventListener("pointermove", (event) => {
            const rect = botao.getBoundingClientRect();
            const x = event.clientX - rect.left - rect.width / 2;
            const y = event.clientY - rect.top - rect.height / 2;

            botao.style.transform = `translate3d(${x * 0.09}px, ${y * 0.11}px, 0)`;
        });

        botao.addEventListener("pointerleave", () => {
            botao.style.transform = "translate3d(0,0,0)";
        });
    });
}


/* =========================================================
   RESET AO VOLTAR PELO NAVEGADOR
   O back-forward cache pode restaurar a página ainda com
   .abrir-tcc ou .abrir-jogar. Limpamos esse estado sem animação.
========================================================= */

function restaurarTelaInicial() {
    navegando = false;

    tela.classList.add("restaurando");
    tela.classList.remove("abrir-tcc", "abrir-jogar");

    document.querySelectorAll(".magnetic").forEach((botao) => {
        botao.style.transform = "translate3d(0,0,0)";
    });

    // Força o navegador a aplicar o estado normal antes de reativar transições.
    void tela.offsetWidth;

    requestAnimationFrame(() => {
        tela.classList.remove("restaurando");
    });
}

window.addEventListener("pageshow", restaurarTelaInicial);
