BET — CAÇA-NÍQUEL / CORREÇÃO DE ESTABILIDADE

ARQUIVOS
- jogar.html
- jogar.css
- jogar.js
- assets/audio/*
- assets/img/*
- CREDITOS-AUDIO.txt

CAMINHOS PREPARADOS PARA O PROJETO FINAL
- Voltar ao início: ../INICIO/index.html
- TCC: ../TCC/tcc.html
- Quem: ../QUEM/quem.html

CORREÇÕES DESTA VERSÃO
- Restaurada a função saveProgress(), que havia sido removida e interrompia o JavaScript durante a primeira rodada.
- O botão GIRAR é sempre destravado ao final da rodada, mesmo se ocorrer erro em uma animação secundária.
- Girar não altera níveis de upgrades.
- O evento de R$ 1 milhão possui encerramento seguro: sobrecarga, rachadura, quebra e mini-dossiê continuam mesmo se uma animação falhar.
- Playlist local toca automaticamente em sequência e possui proteção contra loop infinito de erros.
- Som de giro foi suavizado.
- Bandeiras agora são SVGs visuais, evitando que o Windows mostre apenas letras de país.

PONTOS
- Os pontos são permanentes entre reinícios de saldo.
- Pontos diminuem apenas ao comprar um upgrade.
- Saldo zerado volta a R$ 100 ao recomeçar; pontos e upgrades permanecem.

UPGRADES ATUAIS
1) Chance de ganho
N0 base | N1 +8% | N2 +15% | N3 +23% | N4 +34% | N5 +48%
Custos: 1.000 / 2.500 / 4.000 / 12.000 / 24.000 pts

2) Multiplicador de ganho
100% / 122% / 145% / 175% / 210% / 255%
Custos: 1.200 / 3.000 / 5.000 / 14.000 / 28.000 pts

3) Prêmio de risco (jackpot de 9 iguais)
200x / 320x / 450x / 650x / 900x / 1200x
Custos: 1.600 / 3.600 / 6.500 / 17.000 / 34.000 pts

PERSONALIZAÇÃO
- Figuras: frutas, cassino, cores, bandeiras e aleatório.
- Máquina: Clássica, Sleek, Cofre e Elite.
- Página: Roxo + preto, Vermelho + preto, Amarelo + preto e Ciano + preto.

TESTES
- TESTE R$ 1M: aciona rapidamente o evento final.
- TESTE PTS: adiciona pontos para testar upgrades.

ÁUDIO
- MÚSICA: controla somente a playlist ambiente.
- EFEITOS: controla clique, giro, paradas, vitória, upgrade, circuito e vidro.
- As 15 músicas estão em assets/audio/music/ e são reproduzidas automaticamente em sequência.
- ambient_long.ogg é usado como fallback caso todas as faixas falhem.
- Para liberar áudio no navegador, clique em ENTRAR NO JOGO primeiro.

AJUSTES — CORRIGIDO 02
- O dossiê aparece no mesmo instante em que a tela se parte; os cacos continuam caindo por cima dele.
- Todo o progresso é apagado ao sair/recarregar a página. Ao voltar, saldo, pontos, upgrades, personalização e evento final começam do zero.
- A introdução foi redesenhada mantendo o arquivo assets/img/bet-mark.svg original.
- A nova intro usa principalmente transform e opacity, sem canvas/parallax pesado.
