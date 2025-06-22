document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const restartButton = document.getElementById('restart-button');
    const voiceToggleButton = document.getElementById('voice-toggle-button');
    const voiceStatusElement = document.getElementById('voice-status');

    // Crie 18 nomes de arquivos de imagem (ex: 1.png, 2.png, ..., 18.png)
    // e coloque-os na pasta 'images'.
    const imageNames = Array.from({ length: 18 }, (_, i) => `${i + 1}.png`);
    let cardArray = [...imageNames, ...imageNames]; // 18 pares

    let cardsChosen = [];
    let cardsChosenIds = [];
    let cardsWon = [];
    let lockBoard = false;

    // Lógica do Reconhecimento de Voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let isListening = false;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.lang = 'pt-BR';
        recognition.continuous = true; // Continua ouvindo
        recognition.interimResults = false;

        recognition.onstart = () => {
            isListening = true;
            voiceStatusElement.textContent = 'Ouvindo...';
            voiceStatusElement.classList.add('listening');
            voiceToggleButton.textContent = '⏹️ Parar Reconhecimento de Voz';
        };

        recognition.onend = () => {
            isListening = false;
            voiceStatusElement.textContent = 'Inativo. Clique no botão para começar.';
            voiceStatusElement.classList.remove('listening');
            voiceToggleButton.textContent = '▶️ Iniciar Reconhecimento de Voz';
        };

        recognition.onerror = (event) => {
            voiceStatusElement.textContent = `Erro no reconhecimento: ${event.error}`;
        };

        recognition.onresult = (event) => {
            const last = event.results.length - 1;
            const command = event.results[last][0].transcript.trim().toLowerCase();

            voiceStatusElement.textContent = `Comando recebido: "${command}"`;

            // Expressão regular para capturar "linha X coluna Y"
            const match = command.match(/virar carta linha (\d+) coluna (\d+)/);

            if (match) {
                const row = parseInt(match[1], 10);
                const col = parseInt(match[2], 10);

                if (row >= 1 && row <= 6 && col >= 1 && col <= 6) {
                    // Calcula o índice da carta no array (base 0)
                    const cardIndex = (row - 1) * 6 + (col - 1);
                    const cardToFlip = document.querySelector(`.card[data-id='${cardIndex}']`);
                    if (cardToFlip) {
                        // Simula um clique na carta
                        cardToFlip.click();
                    }
                } else {
                    voiceStatusElement.textContent = `Comando inválido. Linhas e colunas devem ser de 1 a 6.`;
                }
            }
        };

    } else {
        voiceToggleButton.style.display = 'none';
        voiceStatusElement.textContent = 'Seu navegador não suporta reconhecimento de voz.';
    }

    // Função para embaralhar as cartas
    function shuffle(array) {
        array.sort(() => 0.5 - Math.random());
    }

    // Função para criar o tabuleiro
    function createBoard() {
        shuffle(cardArray);
        gameBoard.innerHTML = '';
        cardsWon = [];
        scoreElement.textContent = '0';

        for (let i = 0; i < cardArray.length; i++) {
            const card = document.createElement('div');
            card.setAttribute('class', 'card');
            card.setAttribute('data-id', i);

            const frontFace = document.createElement('div');
            frontFace.classList.add('front-face');
            const frontImage = document.createElement('img');
            frontImage.setAttribute('src', `images/${cardArray[i]}`);
            frontImage.setAttribute('alt', 'Figura da carta');
            frontFace.appendChild(frontImage);

            const backFace = document.createElement('div');
            backFace.classList.add('back-face');
            backFace.textContent = '?';

            card.appendChild(frontFace);
            card.appendChild(backFace);
            
            card.addEventListener('click', flipCard);
            gameBoard.appendChild(card);
        }
    }

    // Função para virar a carta
    function flipCard() {
        if (lockBoard) return;
        if (this === cardsChosen[0]) return; // Impede duplo clique na mesma carta

        this.classList.add('flipped');

        const cardId = this.getAttribute('data-id');
        cardsChosen.push(cardArray[cardId]);
        cardsChosenIds.push(cardId);
        
        if (cardsChosen.length === 2) {
            lockBoard = true;
            setTimeout(checkForMatch, 500);
        }
    }

    // Função para checar se as cartas formam um par
    function checkForMatch() {
        const cards = document.querySelectorAll('.card');
        const [optionOneId, optionTwoId] = cardsChosenIds;
        const cardOne = cards[optionOneId];
        const cardTwo = cards[optionTwoId];

        if (cardsChosen[0] === cardsChosen[1]) {
            // É um par!
            cardOne.classList.add('matched');
            cardTwo.classList.add('matched');
            cardOne.removeEventListener('click', flipCard);
            cardTwo.removeEventListener('click', flipCard);
            cardsWon.push(cardsChosen);
        } else {
            // Não é um par
            cardOne.classList.remove('flipped');
            cardTwo.classList.remove('flipped');
        }

        cardsChosen = [];
        cardsChosenIds = [];
        scoreElement.textContent = cardsWon.length;
        lockBoard = false;

        if (cardsWon.length === cardArray.length / 2) {
            voiceStatusElement.textContent = 'Parabéns! Você encontrou todos os pares!';
            if(isListening) recognition.stop();
        }
    }

    // Função para reiniciar o jogo
    function restartGame() {
        if(isListening) recognition.stop();
        createBoard();
    }
    
    // Event Listeners dos botões
    restartButton.addEventListener('click', restartGame);
    
    voiceToggleButton.addEventListener('click', () => {
        if (!SpeechRecognition) return;
        
        if (isListening) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    // Inicia o jogo pela primeira vez
    createBoard();
});