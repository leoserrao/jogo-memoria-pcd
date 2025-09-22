document.addEventListener('DOMContentLoaded', () => {
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const restartButton = document.getElementById('restart-button');
    const voiceToggleButton = document.getElementById('voice-toggle-button');
    const voiceStatusElement = document.getElementById('voice-status');

    const imageNames = Array.from({ length: 18 }, (_, i) => `${i + 1}.png`);
    let cardArray = [...imageNames, ...imageNames];

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
        recognition.continuous = true;
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

    function flipCard() {
        if (lockBoard) return;
        if (this.classList.contains('matched')) return;

        const cardId = this.getAttribute('data-id');

        if (cardsChosenIds.length === 1 && cardsChosenIds[0] === cardId) {
            this.classList.remove('flipped');
            cardsChosen = [];
            cardsChosenIds = [];
            return;
        }

        if (this.classList.contains('flipped')) {
            return;
        }

        this.classList.add('flipped');
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
            cardsWon.push(cardsChosen);
        } else {
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