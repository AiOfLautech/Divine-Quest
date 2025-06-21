// Quiz state
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let quizResults = null;
let userName = "";
let quizType = "";

// DOM elements
const homeScreen = document.getElementById('homeScreen');
const quizScreen = document.getElementById('quizScreen');
const quizTitle = document.getElementById('quizTitle');
const quizProgress = document.getElementById('quizProgress');
const quizProgressBar = document.getElementById('quizProgressBar');
const questionText = document.getElementById('questionText');
const optionsContainer = document.getElementById('optionsContainer');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
const userNameDisplay = document.getElementById('userNameDisplay');
const quizName = document.getElementById('quizName');
const finalScore = document.getElementById('finalScore');
const performanceComment = document.getElementById('performanceComment');
const homeButton = document.getElementById('homeButton');
const offlineBanner = document.getElementById('offlineBanner');
const userNameInput = document.getElementById('userNameInput');
const nameInputModal = new bootstrap.Modal(document.getElementById('nameInputModal'));
const startQuizBtn = document.getElementById('startQuizBtn');

// Initialize offline detection
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

function updateOnlineStatus() {
    offlineBanner.style.display = navigator.onLine ? 'none' : 'block';
}

// Show name input modal
function showNameInput(type) {
    quizType = type;
    nameInputModal.show();
}

// Set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    startQuizBtn.addEventListener('click', () => {
        userName = userNameInput.value.trim();
        if (!userName) {
            alert('Please enter your name to continue');
            return;
        }
        nameInputModal.hide();
        startQuiz(quizType);
    });
});

// Start quiz
function startQuiz(quizType) {
    currentQuiz = quizData[quizType];
    currentQuestionIndex = 0;
    userAnswers = Array(currentQuiz.questions.length).fill(null);
    
    // Load saved progress if exists
    const savedProgress = localStorage.getItem(`quizProgress_${quizType}`);
    if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        currentQuestionIndex = progress.index;
        userAnswers = progress.answers;
        userName = progress.userName || userName;
    }
    
    quizTitle.textContent = currentQuiz.title;
    homeScreen.style.display = 'none';
    quizScreen.style.display = 'block';
    homeButton.style.display = 'block';
    
    loadQuestion();
}

// Go back to home screen
function goHome() {
    homeScreen.style.display = 'block';
    quizScreen.style.display = 'none';
    homeButton.style.display = 'none';
    
    // Save progress when leaving
    if (currentQuiz) {
        localStorage.setItem(`quizProgress_${quizType}`, JSON.stringify({
            index: currentQuestionIndex,
            answers: userAnswers,
            userName: userName
        }));
    }
}

// Load current question
function loadQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const totalQuestions = currentQuiz.questions.length;
    const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;
    
    quizProgress.textContent = `Question ${currentQuestionIndex + 1} of ${totalQuestions}`;
    quizProgressBar.style.width = `${progressPercent}%`;
    questionText.textContent = question.question;
    
    // Clear previous options
    optionsContainer.innerHTML = '';
    
    // Update navigation buttons
    prevBtn.disabled = currentQuestionIndex === 0;
    nextBtn.textContent = currentQuestionIndex === totalQuestions - 1 ? 'Finish Quiz' : 'Next';
    
    // Render options based on question type
    if (question.type === 'multiple_choice') {
        question.options.forEach((option, index) => {
            const optionElement = document.createElement('div');
            optionElement.className = `option ${userAnswers[currentQuestionIndex] === index ? 'selected' : ''}`;
            optionElement.innerHTML = option;
            optionElement.onclick = () => selectOption(index);
            optionsContainer.appendChild(optionElement);
        });
    } else { // text_input
        const inputGroup = document.createElement('div');
        inputGroup.className = 'mt-3';
        inputGroup.innerHTML = `
            <input type="text" class="text-answer form-control" 
                   placeholder="Type your answer here..." 
                   value="${userAnswers[currentQuestionIndex] || ''}">
        `;
        optionsContainer.appendChild(inputGroup);
        
        const textInput = inputGroup.querySelector('input');
        textInput.addEventListener('input', () => {
            userAnswers[currentQuestionIndex] = textInput.value.trim();
        });
    }
}

// Select option for multiple choice
function selectOption(index) {
    userAnswers[currentQuestionIndex] = index;
    
    // Update UI
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach((opt, i) => {
        if (i === index) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

// Go to previous question
function prevQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        loadQuestion();
    }
}

// Go to next question
function nextQuestion() {
    if (userAnswers[currentQuestionIndex] === null || 
        (userAnswers[currentQuestionIndex] === "" && currentQuiz.questions[currentQuestionIndex].type === 'text_input')) {
        alert('Please answer this question before proceeding.');
        return;
    }
    
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        loadQuestion();
    } else {
        finishQuiz();
    }
}

// Finish quiz and show results
function finishQuiz() {
    // Calculate score
    let correctCount = 0;
    currentQuiz.questions.forEach((question, index) => {
        const userAnswer = userAnswers[index];
        if (question.type === 'multiple_choice') {
            if (userAnswer === question.answer) correctCount++;
        } else {
            if (userAnswer && userAnswer.toLowerCase() === question.answer.toLowerCase()) correctCount++;
        }
    });
    
    const score = Math.round((correctCount / currentQuiz.questions.length) * 100);
    
    // Set results for display
    quizResults = {
        quizName: currentQuiz.title,
        totalQuestions: currentQuiz.questions.length,
        correctAnswers: correctCount,
        score: score,
        questions: currentQuiz.questions.map((q, i) => ({
            question: q.question,
            userAnswer: userAnswers[i],
            correctAnswer: q.type === 'multiple_choice' ? q.options[q.answer] : q.answer,
            isCorrect: q.type === 'multiple_choice' ? 
                (userAnswers[i] === q.answer) : 
                (userAnswers[i] && userAnswers[i].toLowerCase() === q.answer.toLowerCase())
        }))
    };
    
    // Clear saved progress
    localStorage.removeItem(`quizProgress_${quizType}`);
    
    // Show results
    showResults();
}

// Display results in modal
function showResults() {
    quizName.textContent = quizResults.quizName;
    userNameDisplay.textContent = userName;
    finalScore.textContent = `${quizResults.score}%`;
    
    // Performance comment
    if (quizResults.score >= 90) {
        performanceComment.textContent = "Outstanding! Your knowledge of Scripture is exceptional.";
    } else if (quizResults.score >= 75) {
        performanceComment.textContent = "Excellent! You have strong biblical knowledge.";
    } else if (quizResults.score >= 60) {
        performanceComment.textContent = "Good job! You have a solid understanding.";
    } else if (quizResults.score >= 50) {
        performanceComment.textContent = "Keep studying! You have a basic understanding.";
    } else {
        performanceComment.textContent = "Continue your Bible study journey!";
    }
    
    // Set certificate date
    const now = new Date();
    document.getElementById('certDate').textContent = now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    resultsModal.show();
}

// Download certificate
function downloadCertificate() {
    alert('Certificate downloaded!');
    // In a real app, this would generate and download a PDF certificate
}

// Download questions
function downloadQuestions() {
    alert('Questions downloaded!');
    // In a real app, this would generate a PDF with all questions and answers
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(error => {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}