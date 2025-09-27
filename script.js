document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const restartButton = document.getElementById('restart-button');
    const voiceToggleButton = document.getElementById('voice-toggle-button');
    const narrationToggleButton = document.getElementById('narration-toggle-button');
    const rulesNarrationButton = document.getElementById('rules-narration-button');
    const voiceStatusElement = document.getElementById('voice-status');
    const srAnnouncer = document.querySelector('.visually-hidden');

    const imageNames = Array.from({ length: 18 }, (_, i) => `${i + 1}.png`);
    let cardArray = [...imageNames, ...imageNames];

    let cardsChosen = [];
    let cardsChosenIds = [];
    let cardsWon = [];
    let lockBoard = false;
    let isNarrationEnabled = false;

    // Lógica da Narração
    function announce(message) {
        srAnnouncer.textContent = message;
        speak(message);
    }

    function speak(text) {
        if (!isNarrationEnabled) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        speechSynthesis.speak(utterance);
    }

    narrationToggleButton.addEventListener('click', () => {
        isNarrationEnabled = !isNarrationEnabled;
        if (isNarrationEnabled) {
            narrationToggleButton.textContent = 'Desativar Narração';
            narrationToggleButton.classList.add('active');
            announce('Narração ativada.');
        } else {
            narrationToggleButton.textContent = 'Ativar Narração';
            narrationToggleButton.classList.remove('active');
            announce('Narração desativada.');
        }
    });

    rulesNarrationButton.addEventListener('click', () => {
        isNarrationEnabled = !isNarrationEnabled;
        if (isNarrationEnabled) {
            rulesNarrationButton.textContent = 'Desativar Narração de Regras';
            rulesNarrationButton.classList.add('active');
            announce('Narração ativada. Bem-vindo ao Jogo da Memória Acessível. Jogue com o mouse ou ative o reconhecimento de voz. Para usar o comando de voz. Pressione a Barra de Espaço do teclado ou clique no botão do Controle de voz para ativar / desativar o microfone. Regras Jogo da Memória. 1. Preparação do jogo. As cartas devem ser embaralhadas e colocadas com a face voltada para baixo, formando uma grade. Esse jogo possui 18 pares de cartas, dispostos em uma grade com 6 linhas e 6 colunas. Para virar uma carta por comando de voz diga o número da linha e o número da coluna. Exemplo 1 e 3 para virar a carta da linha 1 coluna 3. Cada carta tem um par idêntico. 2. Ordem dos jogadores. O jogo pode ser jogado individualmente ou em grupo. Se houver mais de um jogador, define-se quem começa e a partida segue em turnos. 3. Como jogar. No seu turno, o jogador deve virar duas cartas. Se as duas cartas forem iguais, o jogador forma um par, as cartas saem do tabuleiro e o jogador ganha o direito de jogar novamente. Se as cartas forem diferentes, deve virá-las novamente para baixo, na mesma posição, e a vez passa para o próximo jogador. O jogador pode usar o mouse ou ativar o comando de voz para virar as cartas. 4. Memorização. Todos os jogadores podem observar as cartas viradas, devendo memorizar suas posições para futuras jogadas. 5. Objetivo do jogo. O objetivo é formar o maior número de pares possível. O jogo termina quando todas as cartas tiverem sido retiradas do tabuleiro. 6. Vencedor. Vence o jogador que tiver conseguido mais pares. Em caso de empate, pode ser declarado empate ou realizada uma nova rodada.');
        } else {
            rulesNarrationButton.textContent = 'Ativar Narração de Regras';
            rulesNarrationButton.classList.remove('active');
            announce('Narração desativada.');
        }
    });

    // Lógica do Reconhecimento de Voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true;
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            voiceStatusElement.textContent = 'Ouvindo...';
            voiceStatusElement.classList.add('listening');
            voiceToggleButton.textContent = '⏹️ Parar Reconhecimento de Voz';
            announce('Reconhecimento de voz iniciado.');
        };

        recognition.onend = () => {
            isListening = false;
            voiceStatusElement.textContent = 'Inativo. Clique no botão para começar.';
            voiceStatusElement.classList.remove('listening');
            voiceToggleButton.textContent = '▶️ Iniciar Reconhecimento de Voz';
            announce('Reconhecimento de voz parado.');
        };

        recognition.onerror = (event) => {
            voiceStatusElement.textContent = `Erro no reconhecimento: ${event.error}`;
            announce(`Erro no reconhecimento de voz: ${event.error}`);
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();
            voiceStatusElement.textContent = `Comando recebido: "${command}"`;
            const match = command.match(/(\d+) e (\d+)/);
            if (match) {
                const row = parseInt(match[1], 10);
                const col = parseInt(match[2], 10);
                if (row >= 1 && row <= 6 && col >= 1 && col <= 6) {
                    const cardIndex = (row - 1) * 6 + (col - 1);
                    const cardToFlip = document.querySelector(`.card[data-id='${cardIndex}']`);
                    if (cardToFlip) {
                        cardToFlip.click();
                    }
                } else {
                    voiceStatusElement.textContent = `Comando inválido. Linhas e colunas devem ser de 1 a 6.`;
                    announce('Comando inválido. Linhas e colunas devem ser de 1 a 6.');
                }
            }
        };

    } else {
        voiceToggleButton.style.display = 'none';
        voiceStatusElement.textContent = 'Seu navegador não suporta reconhecimento de voz.';
    }

    function shuffle(array) {
        array.sort(() => 0.5 - Math.random());
    }

    function createBoard() {
        shuffle(cardArray);
        gameBoard.innerHTML = '';
        cardsWon = [];
        scoreElement.textContent = '0';
        announce('Novo jogo iniciado. O tabuleiro foi embaralhado.');
        for (let i = 0; i < cardArray.length; i++) {
            const card = document.createElement('div');
            card.setAttribute('class', 'card');
            card.setAttribute('data-id', i);
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            const row = Math.floor(i / 6) + 1;
            const col = (i % 6) + 1;
            const cardName = cardArray[i].split('.')[0];
            card.setAttribute('aria-label', `Carta, linha ${row}, coluna ${col}`);

            const frontFace = document.createElement('div');
            frontFace.classList.add('front-face');
            const frontImage = document.createElement('img');
            frontImage.setAttribute('src', `images/${cardArray[i]}`);
            // O alt text ideal teria a descrição da imagem.
            frontImage.setAttribute('alt', `Figura ${cardName}`);
            frontFace.appendChild(frontImage);

            const backFace = document.createElement('div');
            backFace.classList.add('back-face');
            backFace.textContent = '?';

            card.appendChild(frontFace);
            card.appendChild(backFace);

            card.addEventListener('click', flipCard);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    flipCard.call(card);
                }
            });

            gameBoard.appendChild(card);
        }
    }

    function flipCard() {
        if (lockBoard) return;
        if (this.classList.contains('matched')) return;

        const cardId = this.getAttribute('data-id');

        if (cardsChosenIds.length === 1 && cardsChosenIds[0] === cardId) {
            this.classList.remove('flipped');
            const cardName = cardArray[cardId].split('.')[0];
            announce(`Carta duplicada, foi virada para baixo.`);
            cardsChosen = [];
            cardsChosenIds = [];
            return;
        }

        if (this.classList.contains('flipped')) {
            return;
        }

        this.classList.add('flipped');

        // Pegando o índice e o nome da carta (sem extensão)
        const cardIndex = cardId;
        const cardName = cardArray[cardId].split('.')[0];

        let cardDescription = ""; 

        // Condicional para descrição
        if (cardName === "1") {
            cardDescription = "duas bananas";
        } else if (cardName === "2") {
            cardDescription = "uma pêra e meia";
        } else if (cardName === "3") {
            cardDescription = "um abacaxi e uma banana";
        } else if (cardName === "4") {
            cardDescription = "um kiwi e meio";
        } else if (cardName === "5") {
            cardDescription = "um limão e meio";
        } else if (cardName === "6") {
            cardDescription = "uma maçã vermelha";
        } else if (cardName === "7") {
            cardDescription = "um mamão e meio";
        } else if (cardName === "8") {
            cardDescription = "um melão";
        } else if (cardName === "9") {
            cardDescription = "um mírtilo";
        } else if (cardName === "10") {
            cardDescription = "uma banana e meia maçã verde";
        } else if (cardName === "11") {
            cardDescription = "Uma jáca e meia";
        } else if (cardName === "12") {
            cardDescription = "uma laranja lima e meia";
        } else if (cardName === "13") {
            cardDescription = "uma laranja lima";
        } else if (cardName === "14") {
            cardDescription = "uma laranja";
        } else if (cardName === "15") {
            cardDescription = "uma maçã verde uma melancia e duas bananas";
        } else if (cardName === "16") {
            cardDescription = "uma melancia";
        } else if (cardName === "17") {
            cardDescription = "uma pêra";
        } else if (cardName === "18") {
            cardDescription = "uma tangerina e meia";
        } else {
            cardDescription = cardName; // fallback: mantém o próprio nome
        }

        // Mensagem com índice e descrição
        announce(`Você virou a carta: ${cardDescription}.`);

        // Guardando como objeto
        cardsChosen.push(cardArray[cardId]);
        cardsChosenIds.push(cardId);


        if (cardsChosen.length === 2) {
            lockBoard = true;
            setTimeout(checkForMatch, 500);
        }
    }

    function checkForMatch() {
        const cards = document.querySelectorAll('.card');
        const [optionOneId, optionTwoId] = cardsChosenIds;
        const cardOne = cards[optionOneId];
        const cardTwo = cards[optionTwoId];

        if (cardsChosen[0] === cardsChosen[1]) {
            cardOne.classList.add('matched');
            cardTwo.classList.add('matched');
            cardOne.removeEventListener('click', flipCard);
            cardTwo.removeEventListener('click', flipCard);
            cardOne.setAttribute('aria-disabled', 'true');
            cardTwo.setAttribute('aria-disabled', 'true');
            cardsWon.push(cardsChosen);
            announce('Par encontrado!');
        } else {
            cardOne.classList.remove('flipped');
            cardTwo.classList.remove('flipped');
            announce('Não é um par. Tente novamente.');
        }

        cardsChosen = [];
        cardsChosenIds = [];
        scoreElement.textContent = cardsWon.length;

        lockBoard = false;

        if (cardsWon.length === cardArray.length / 2) {
            const finalMessage = 'Parabéns! Você encontrou todos os pares!';
            voiceStatusElement.textContent = finalMessage;
            announce(`${finalMessage} Fim de jogo.`);
            if(isListening) recognition.stop();
            alert("Parabéns! Você encontrou todos os pares! Fim de jogo.");
        }
    }

    function restartGame() {
        if(isListening) recognition.stop();
        createBoard();
    }

    // --- NOVA FUNÇÃO ---
    // Centraliza a lógica para iniciar ou parar o reconhecimento de voz
    function toggleVoiceRecognition() {
        if (!SpeechRecognition) return;
        
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    }

    // --- EVENT LISTENERS ATUALIZADOS ---
    restartButton.addEventListener('click', restartGame);
    
    // O botão agora chama a função centralizada
    voiceToggleButton.addEventListener('click', toggleVoiceRecognition);
    
    // NOVO: Listener para a barra de espaço
    document.addEventListener('keydown', (event) => {
        // Verifica se a tecla pressionada é a barra de espaço
        if (event.key === ' ' || event.code === 'Space') {
            // Impede o comportamento padrão da barra de espaço (rolar a página)
            event.preventDefault(); 
            toggleVoiceRecognition();
        }
    });

    // Inicia o jogo pela primeira vez
    createBoard();
});