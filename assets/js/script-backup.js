// DOM elements
var startBtn = document.querySelector(".start-btn");
var startSlide = document.getElementById("start-slide");
var quizSlide = document.getElementById("quiz-slide");
var viewScoresBtn = document.querySelector(".high-scores");
var highScoreContainer = document.querySelector(".high-scores-container");
var highScoreList = document.getElementById("high-score-list");
var navButtons = document.querySelector(".buttons");
var endGameSlide = document.getElementById("finish");
var answerEl = document.getElementById("answers");
var questionEl = document.getElementById("question");
var resultEl = document.getElementById("result");
var rightOrWrong = document.querySelector('#right-or-wrong');
var nameInput = document.querySelector('#name');

// ===== Timer & Score Variables =====
var timerInterval = null; // FIX: single global reference (was split between `time` global + `var time` inside startQuiz, making clearInterval unreliable)
var timeLeft = 120;
var score = 0;

// ===== Local Storage =====
var highScores = [];
if (localStorage.getItem('highScores') !== null) {
    highScores = JSON.parse(localStorage.getItem('highScores'));
}

// ===== Helpers =====
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// ===== Question Data =====
var questionIndex = 0;
var quizQuestions = [];

function fetchQuestions() {
    return fetch('./assets/data/questions.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            quizQuestions = data.questions;
            startQuiz();
        })
        .catch(error => console.error('Error fetching questions:', error));
}

// ===== Screens =====
function startScreen() {
    startSlide.style.display = "block";
    quizSlide.style.display = "none";
    endGameSlide.style.display = "none";
    navButtons.style.display = "none";
    highScoreContainer.style.display = "none";
}

// ===== Start Quiz =====
function startQuiz() {
    // FIX: reset score and index each time a new game starts
    score = 0;
    questionIndex = 0;
    timeLeft = 120;

    shuffle(quizQuestions);

    // FIX: clear any existing interval before starting a new one
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
        document.getElementById("timer").innerHTML = timeLeft;
        timeLeft--;

        if (timeLeft < 0) {
            clearInterval(timerInterval); // FIX: clears the correct variable
            endGame();
        }
    }, 1000);

    startSlide.style.display = "none";
    quizSlide.style.display = "block";
    endGameSlide.style.display = "none";
    navButtons.style.display = "none";

    loadQuestion();
}

// ===== Load Question =====
function loadQuestion() {
    questionEl.textContent = quizQuestions[questionIndex].question;
    answerEl.innerHTML = "";

    var questionChoices = [...quizQuestions[questionIndex].choices]; // FIX: copy array before shuffling so original data is preserved
    shuffle(questionChoices);

    for (var i = 0; i < questionChoices.length; i++) {
        var item = questionChoices[i];
        var answerBtn = document.createElement('button');
        answerBtn.textContent = item;
        answerBtn.classList.add("btn");
        answerBtn.addEventListener("click", function () {
            checkAnswer(this.textContent);
        });
        answerEl.appendChild(answerBtn);
    }
}

// ===== Check Answer =====
function checkAnswer(choice) {
    // FIX: disable all answer buttons immediately to prevent double-clicking during the 1s delay
    var allBtns = answerEl.querySelectorAll('.btn');
    allBtns.forEach(function (btn) { btn.disabled = true; });

    var correctAnswer = quizQuestions[questionIndex].correct;

    if (choice !== correctAnswer) {
        rightOrWrong.textContent = "Wrong! -10 seconds";
        timeLeft = Math.max(0, timeLeft - 10); // FIX: prevent timeLeft going deeply negative on wrong answer near end
    } else {
        score += 5;
        rightOrWrong.textContent = "Correct! +5 points";
    }

    resultEl.style.display = "block";

    setTimeout(function () {
        resultEl.style.display = "none";

        if (questionIndex === quizQuestions.length - 1) {
            endGame();
        } else {
            questionIndex++;
            loadQuestion();
        }
    }, 1000);
}

// ===== End Game =====
function endGame() {
    clearInterval(timerInterval); // FIX: now correctly clears the timer using the global reference

    startSlide.style.display = "none";
    quizSlide.style.display = "none";
    endGameSlide.style.display = "block";
    navButtons.style.display = "block";

    // FIX: show final score on end screen
    var finalScoreEl = document.getElementById("final-score");
    if (finalScoreEl) finalScoreEl.textContent = "Your score: " + score;

    // FIX: remove old listener before adding a new one to prevent stacking duplicate submissions
    var submitBtn = document.querySelector("#submit-high-score");
    var newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);

    newSubmitBtn.addEventListener("click", function () {
        var initials = document.querySelector("#initials").value.trim();
        if (!initials) {
            alert("Please enter your initials before submitting.");
            return;
        }
        submitHighScore(initials, score);
    });
}

// ===== Submit High Score =====
function submitHighScore(initials, score) {
    var highScore = {
        playerName: initials,
        score: score
    };

    highScores.push(highScore);
    highScores.sort(function (a, b) { return b.score - a.score; });
    highScores = highScores.slice(0, 10); // FIX: cap list at top 10 so it doesn't grow forever

    localStorage.setItem("highScores", JSON.stringify(highScores));
    document.querySelector("#initials").value = "";
    viewHighScores();
}

// ===== View High Scores =====
function viewHighScores() {
    quizSlide.style.display = "none";
    startSlide.style.display = "none";
    endGameSlide.style.display = "none";
    highScoreContainer.style.display = "block";

    // FIX: clear the list before re-rendering to prevent duplicate entries stacking up
    highScoreList.innerHTML = "";

    if (highScores.length === 0) {
        var empty = document.createElement("li");
        empty.textContent = "No scores yet. Play a game!";
        highScoreList.appendChild(empty);
        return;
    }

    for (var i = 0; i < highScores.length; i++) {
        var scoreElem = document.createElement("li");
        scoreElem.textContent = (i + 1) + ". " + highScores[i].playerName + " — " + highScores[i].score;
        highScoreList.appendChild(scoreElem);
    }
}

// ===== Reset / Go Back =====
function resetQuiz() {
    clearInterval(timerInterval); // FIX: stop timer before reloading
    timeLeft = 120;
    score = 0;
    questionIndex = 0;
    location.reload();
}

function goBack() {
    clearInterval(timerInterval); // FIX: stop timer when navigating back
    startScreen();
    resetQuiz();
}

// ===== Event Listeners =====
startBtn.addEventListener("click", fetchQuestions);
viewScoresBtn.addEventListener("click", viewHighScores);