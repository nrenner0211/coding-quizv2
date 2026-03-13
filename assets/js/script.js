// =============================================
//  QUIZ APP - Full Rewrite
// =============================================

// ===== DOM Elements =====
var startSlide         = document.getElementById("start-slide");
var quizSlide          = document.getElementById("quiz-slide");
var endGameSlide       = document.getElementById("finish");
var highScoreContainer = document.querySelector(".high-scores-container");
var navButtons         = document.querySelector(".buttons");
var questionEl         = document.getElementById("question");
var answerEl           = document.getElementById("answers");
var resultEl           = document.getElementById("result");
var rightOrWrong       = document.getElementById("right-or-wrong");
var timerDisplay       = document.getElementById("timer");
var highScoreList      = document.getElementById("high-score-list");

// ===== Buttons =====
var startBtn        = document.querySelector("#begin");
var startBtnNoTimer = document.querySelector(".start-btn-no-timer");
var viewScoresBtn   = document.querySelector(".high-scores");

// ===== State =====
var quizQuestions = [];
var questionIndex = 0;
var score         = 0;
var timeLeft      = 120;
var timerInterval = null;
var practiceMode  = false; // true = no timer, false = timed

// ===== High Scores =====
var highScores = JSON.parse(localStorage.getItem("highScores") || "[]");

// =============================================
//  UTILITIES
// =============================================

function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
}

function hideAll() {
    startSlide.style.display         = "none";
    quizSlide.style.display          = "none";
    endGameSlide.style.display       = "none";
    highScoreContainer.style.display = "none";
    navButtons.style.display         = "none";
}

function stopTimer() {
    if (timerInterval !== null) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// =============================================
//  SCREENS
// =============================================

function showStartScreen() {
    stopTimer();
    hideAll();
    startSlide.style.display = "block";
}

function showHighScores() {
    hideAll();
    highScoreContainer.style.display = "block";
    navButtons.style.display = "block";

    highScoreList.innerHTML = "";

    if (highScores.length === 0) {
        var li = document.createElement("li");
        li.textContent = "No scores yet. Play a game!";
        highScoreList.appendChild(li);
        return;
    }

    for (var i = 0; i < highScores.length; i++) {
        var li = document.createElement("li");
        var tag = highScores[i].mode ? " [" + highScores[i].mode + "]" : "";
        li.textContent = (i + 1) + ". " + highScores[i].playerName + " - " + highScores[i].score + tag;
        highScoreList.appendChild(li);
    }
}

// =============================================
//  FETCH & START
// =============================================

function initQuiz(isPractice) {
    // Lock in the mode immediately and synchronously before anything async happens
    practiceMode = isPractice;

    fetch("./assets/data/questions.json")
        .then(function(response) {
            if (!response.ok) throw new Error("Failed to load questions");
            return response.json();
        })
        .then(function(data) {
            quizQuestions = shuffle(data.questions.slice()); // fresh shuffled copy every game
            startQuiz();
        })
        .catch(function(err) {
            console.error("Error loading questions:", err);
            alert("Could not load questions. Please check the file path.");
        });
}

function startQuiz() {
    // Reset state
    score         = 0;
    questionIndex = 0;
    timeLeft      = 120;
    stopTimer();

    hideAll();
    quizSlide.style.display = "block";

    // Timer setup - decided entirely by practiceMode
    if (practiceMode) {
        timerDisplay.style.display = "none";
    } else {
        timerDisplay.style.display = "block";
        timerDisplay.textContent   = timeLeft;

        timerInterval = setInterval(function() {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                stopTimer();
                endGame();
            }
        }, 1000);
    }

    loadQuestion();
}

// =============================================
//  QUESTION LOGIC
// =============================================

function loadQuestion() {
    var current = quizQuestions[questionIndex];
    questionEl.textContent = current.question;
    answerEl.innerHTML = "";
    resultEl.style.display = "none";

    var choices = shuffle(current.choices.slice());

    choices.forEach(function(choice) {
        var btn = document.createElement("button");
        btn.textContent = choice;
        btn.className = "btn";
        btn.addEventListener("click", function() {
            checkAnswer(choice);
        });
        answerEl.appendChild(btn);
    });
}

function checkAnswer(choice) {
    // Disable all buttons immediately
    Array.from(answerEl.querySelectorAll(".btn")).forEach(function(btn) {
        btn.disabled = true;
    });

    var correct = quizQuestions[questionIndex].correct;

    if (choice === correct) {
        score += 5;
        rightOrWrong.textContent = "Correct! +5 points";
    } else {
        rightOrWrong.textContent = practiceMode ? "Wrong!" : "Wrong! -10 seconds";

        if (!practiceMode) {
            timeLeft = Math.max(0, timeLeft - 10);
            timerDisplay.textContent = timeLeft;
        }
    }

    resultEl.style.display = "block";

    setTimeout(function() {
        resultEl.style.display = "none";
        questionIndex++;

        if (questionIndex >= quizQuestions.length) {
            endGame();
        } else {
            loadQuestion();
        }
    }, 1000);
}

// =============================================
//  END GAME
// =============================================

function endGame() {
    stopTimer();
    hideAll();
    endGameSlide.style.display = "block";
    navButtons.style.display   = "block";

    var finalScoreEl = document.getElementById("final-score");
    if (finalScoreEl) {
        finalScoreEl.textContent = "Your score: " + score;
    }

    // Clone submit button to cleanly remove any old listeners
    var oldSubmit = document.getElementById("submit-high-score");
    var newSubmit = oldSubmit.cloneNode(true);
    oldSubmit.parentNode.replaceChild(newSubmit, oldSubmit);

    newSubmit.addEventListener("click", function() {
        var initials = document.getElementById("initials").value.trim();
        if (!initials) {
            alert("Please enter your initials.");
            return;
        }
        saveHighScore(initials);
    });
}

function saveHighScore(initials) {
    highScores.push({
        playerName: initials,
        score:      score,
        mode:       practiceMode ? "Practice" : "Timed"
    });

    highScores.sort(function(a, b) { return b.score - a.score; });
    highScores = highScores.slice(0, 10);

    localStorage.setItem("highScores", JSON.stringify(highScores));
    document.getElementById("initials").value = "";
    showHighScores();
}

// =============================================
//  NAVIGATION
// =============================================

function resetQuiz() {
    stopTimer();
    location.reload();
}

function goBack() {
    stopTimer();
    showStartScreen();
}

// =============================================
//  EVENT LISTENERS
// =============================================

startBtn.addEventListener("click", function() {
    initQuiz(false); // timed mode
});

startBtnNoTimer.addEventListener("click", function() {
    initQuiz(true); // practice mode
});

viewScoresBtn.addEventListener("click", function() {
    showHighScores();
});

// =============================================
//  INIT
// =============================================

showStartScreen();