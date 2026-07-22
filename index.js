const API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
const FAVORITES_KEY = "wordly-favorites";
const THEME_KEY = "wordly-theme";

const form = document.getElementById("search-form");
const wordInput = document.getElementById("word-input");
const searchBtn = document.getElementById("search-btn");
const statusEl = document.getElementById("status");
const errorEl = document.getElementById("error");
const resultsEl = document.getElementById("results");
const resultWord = document.getElementById("result-word");
const resultPhonetic = document.getElementById("result-phonetic");
const meaningsEl = document.getElementById("meanings");
const sourceEl = document.getElementById("source");
const audioBtn = document.getElementById("audio-btn");
const saveBtn = document.getElementById("save-btn");
const favoritesList = document.getElementById("favorites-list");
const favoritesEmpty = document.getElementById("favorites-empty");
const themeToggle = document.getElementById("theme-toggle");

let currentWord = "";
let currentAudioUrl = "";

function getFavorites() {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveFavorites(favorites) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
}

function sanitizeWord(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z\s'-]/gi, "");
}

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.hidden = !message;
}

function showError(message) {
  errorEl.textContent = message;
  errorEl.hidden = !message;
}

function clearFeedback() {
  showStatus("");
  showError("");
}

function setLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? "Searching..." : "Search";
}

async function fetchWord(word) {
  const response = await fetch(`${API_URL}${encodeURIComponent(word)}`);

  if (response.status === 404) {
    throw new Error(`No definition found for "${word}". Try another spelling.`);
  }

  if (!response.ok) {
    throw new Error("Something went wrong with the dictionary request. Please try again.");
  }

  const data = await response.json();

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("Unexpected response from the dictionary API.");
  }

  return data[0];
}

function getAudioUrl(entry) {
  if (!entry.phonetics) return "";

  const withAudio = entry.phonetics.find((item) => item.audio);
  return withAudio ? withAudio.audio : "";
}

function getPhoneticText(entry) {
  if (entry.phonetic) return entry.phonetic;

  if (entry.phonetics) {
    const withText = entry.phonetics.find((item) => item.text);
    if (withText) return withText.text;
  }

  return "";
}

function collectSynonyms(meaning) {
  const fromMeaning = meaning.synonyms || [];
  const fromDefs = (meaning.definitions || []).flatMap((def) => def.synonyms || []);
  return [...new Set([...fromMeaning, ...fromDefs])].slice(0, 8);
}

function renderMeanings(meanings) {
  meaningsEl.innerHTML = "";

  if (!meanings || meanings.length === 0) {
    meaningsEl.innerHTML = "<p class='hint'>No definitions available for this word.</p>";
    return;
  }

  meanings.forEach((meaning) => {
    const block = document.createElement("article");
    block.className = "meaning";

    const pos = document.createElement("h3");
    pos.className = "part-of-speech";
    pos.textContent = meaning.partOfSpeech || "unknown";
    block.appendChild(pos);

    const list = document.createElement("ol");
    list.className = "definition-list";

    (meaning.definitions || []).slice(0, 3).forEach((def) => {
      const item = document.createElement("li");
      item.textContent = def.definition || "No definition provided.";

      if (def.example) {
        const example = document.createElement("span");
        example.className = "example";
        example.textContent = `Example: "${def.example}"`;
        item.appendChild(example);
      }

      list.appendChild(item);
    });

    block.appendChild(list);

    const synonyms = collectSynonyms(meaning);
    if (synonyms.length > 0) {
      const syn = document.createElement("p");
      syn.className = "synonyms";
      syn.innerHTML = `<strong>Synonyms:</strong> ${synonyms.join(", ")}`;
      block.appendChild(syn);
    }

    meaningsEl.appendChild(block);
  });
}

function renderSource(entry) {
  const url = entry.sourceUrls && entry.sourceUrls[0];

  if (!url) {
    sourceEl.hidden = true;
    sourceEl.innerHTML = "";
    return;
  }

  sourceEl.hidden = false;
  sourceEl.innerHTML = `Source: <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
}

function updateSaveButton() {
  const favorites = getFavorites();
  const isSaved = favorites.includes(currentWord);

  saveBtn.textContent = isSaved ? "Saved" : "Save";
  saveBtn.classList.toggle("saved", isSaved);
  saveBtn.setAttribute("aria-label", isSaved ? "Remove word from favorites" : "Save word to favorites");
  resultsEl.classList.toggle("is-saved", isSaved);
}

function displayResults(entry) {
  currentWord = entry.word.toLowerCase();
  currentAudioUrl = getAudioUrl(entry);

  resultWord.textContent = entry.word;
  resultPhonetic.textContent = getPhoneticText(entry) || "Pronunciation unavailable";

  audioBtn.hidden = !currentAudioUrl;
  renderMeanings(entry.meanings);
  renderSource(entry);
  updateSaveButton();

  resultsEl.hidden = false;
}

function renderFavorites() {
  const favorites = getFavorites();
  favoritesList.innerHTML = "";
  favoritesEmpty.hidden = favorites.length > 0;

  favorites.forEach((word) => {
    const li = document.createElement("li");

    const chip = document.createElement("div");
    chip.className = "favorite-chip";

    const lookUpBtn = document.createElement("button");
    lookUpBtn.type = "button";
    lookUpBtn.className = "lookup";
    lookUpBtn.textContent = word;
    lookUpBtn.setAttribute("aria-label", `Look up ${word}`);
    lookUpBtn.addEventListener("click", () => {
      wordInput.value = word;
      lookupWord(word);
    });

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove";
    removeBtn.setAttribute("aria-label", `Remove ${word} from favorites`);
    removeBtn.textContent = "×";
    removeBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      removeFavorite(word);
    });

    chip.appendChild(lookUpBtn);
    chip.appendChild(removeBtn);
    li.appendChild(chip);
    favoritesList.appendChild(li);
  });
}

function toggleFavorite() {
  if (!currentWord) return;

  const favorites = getFavorites();
  const index = favorites.indexOf(currentWord);

  if (index === -1) {
    favorites.unshift(currentWord);
  } else {
    favorites.splice(index, 1);
  }

  saveFavorites(favorites);
  updateSaveButton();
  renderFavorites();
}

function removeFavorite(word) {
  const favorites = getFavorites().filter((item) => item !== word);
  saveFavorites(favorites);
  renderFavorites();

  if (currentWord === word) {
    updateSaveButton();
  }
}

function playAudio() {
  if (!currentAudioUrl) return;

  const audio = new Audio(currentAudioUrl);
  audio.play().catch(() => {
    showError("Audio could not be played in this browser.");
  });
}

async function lookupWord(rawWord) {
  clearFeedback();
  resultsEl.hidden = true;

  const word = sanitizeWord(rawWord);

  if (!word) {
    showError("Please enter a word to search.");
    wordInput.focus();
    return;
  }

  if (word.length > 45) {
    showError("That entry is too long. Try a single word or short phrase.");
    return;
  }

  setLoading(true);
  showStatus(`Looking up "${word}"...`);

  try {
    const entry = await fetchWord(word);
    clearFeedback();
    displayResults(entry);
  } catch (error) {
    resultsEl.hidden = true;
    showError(error.message || "Unable to look up that word right now.");
  } finally {
    setLoading(false);
  }
}

function handleSubmit(event) {
  event.preventDefault();
  lookupWord(wordInput.value);
}

function applyTheme(theme) {
  document.body.classList.toggle("dark", theme === "dark");
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
  localStorage.setItem(THEME_KEY, theme);
}

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));
}

function toggleTheme() {
  const next = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(next);
}

form.addEventListener("submit", handleSubmit);
audioBtn.addEventListener("click", playAudio);
saveBtn.addEventListener("click", toggleFavorite);
themeToggle.addEventListener("click", toggleTheme);

initTheme();
renderFavorites();
wordInput.focus();
