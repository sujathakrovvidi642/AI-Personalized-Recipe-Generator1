const form = document.getElementById("recipe-form");
const generateBtn = document.getElementById("generate-btn");
const errorBox = document.getElementById("error-box");

const emptyState = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const loadingText = document.getElementById("loading-text");
const recipeCard = document.getElementById("recipe-card");

const LOADING_MESSAGES = [
  "Simmering your recipe…",
  "Checking the spice rack…",
  "Tasting for balance…",
  "Plating it up…",
];

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.hidden = true;

  const payload = {
    ingredients: document.getElementById("ingredients").value.trim(),
    diet: document.getElementById("diet").value,
    cuisine: document.getElementById("cuisine").value,
    cooking_time: document.getElementById("cooking_time").value,
    skill_level: document.getElementById("skill_level").value,
  };

  if (!payload.ingredients) {
    showError("Please enter at least one ingredient.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Something went wrong generating the recipe.");
    }

    renderRecipe(data);
  } catch (err) {
    showError(err.message);
    emptyState.hidden = false;
  } finally {
    setLoading(false);
  }
});

let loadingInterval;

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;
  if (isLoading) {
    emptyState.hidden = true;
    recipeCard.hidden = true;
    loadingState.hidden = false;
    let i = 0;
    loadingText.textContent = LOADING_MESSAGES[0];
    loadingInterval = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      loadingText.textContent = LOADING_MESSAGES[i];
    }, 1800);
  } else {
    loadingState.hidden = true;
    clearInterval(loadingInterval);
  }
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function renderRecipe(recipe) {
  document.getElementById("recipe-image").src = recipe.image_url || "";
  document.getElementById("recipe-image").alt = recipe.dish_name || "Generated dish";
  document.getElementById("cuisine-tag").textContent = recipe.cuisine || "Fusion";

  document.getElementById("dish-name").textContent = recipe.dish_name || "Your recipe";
  document.getElementById("dish-description").textContent = recipe.short_description || "";

  document.getElementById("prep-time").textContent = formatMinutes(recipe.prep_time_minutes);
  document.getElementById("cook-time").textContent = formatMinutes(recipe.cook_time_minutes);
  document.getElementById("servings").textContent = recipe.servings ? recipe.servings : "—";
  document.getElementById("difficulty").textContent = recipe.difficulty || "—";

  fillList("used-ingredients", recipe.ingredients_used);

  const needBlock = document.getElementById("need-block");
  const needed = recipe.additional_ingredients_needed || [];
  if (needed.length === 0) {
    needBlock.hidden = true;
  } else {
    needBlock.hidden = false;
    fillList("needed-ingredients", needed);
  }

  const stepsList = document.getElementById("steps-list");
  stepsList.innerHTML = "";
  (recipe.steps || []).forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  const tipBox = document.getElementById("tip-box");
  if (recipe.tips) {
    tipBox.hidden = false;
    document.getElementById("tip-text").textContent = recipe.tips;
  } else {
    tipBox.hidden = true;
  }

  emptyState.hidden = true;
  recipeCard.hidden = false;
}

function fillList(elementId, items) {
  const el = document.getElementById(elementId);
  el.innerHTML = "";
  (items || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    el.appendChild(li);
  });
}

function formatMinutes(mins) {
  if (!mins && mins !== 0) return "—";
  return `${mins} min`;
}