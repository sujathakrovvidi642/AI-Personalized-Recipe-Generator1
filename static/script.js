const form = document.getElementById("recipe-form");
const generateBtn = document.getElementById("generate-btn");
const errorBox = document.getElementById("error-box");

const emptyState = document.getElementById("empty-state");
const loadingState = document.getElementById("loading-state");
const loadingText = document.getElementById("loading-text");
const recipeCard = document.getElementById("recipe-card");

const LOADING_MESSAGES = [
  "Simmering your recipe...",
  "Checking the spice rack...",
  "Tasting for balance...",
  "Plating it up..."
];

let loadingInterval;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  errorBox.hidden = true;
  errorBox.textContent = "";

  const payload = {
    ingredients: document.getElementById("ingredients").value.trim(),
    diet: document.getElementById("diet").value,
    cuisine: document.getElementById("cuisine").value,
    cooking_time: document.getElementById("cooking_time").value,
    skill_level: document.getElementById("skill_level").value
  };

  if (!payload.ingredients) {
    showError("Please enter at least one ingredient.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch("/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    let data;

    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Server returned an invalid response.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate recipe.");
    }

    renderRecipe(data);

  } catch (err) {
    console.error(err);
    showError(err.message || "Something went wrong.");
    recipeCard.hidden = true;
    emptyState.hidden = false;
  } finally {
    setLoading(false);
  }
});

function setLoading(isLoading) {
  generateBtn.disabled = isLoading;

  if (isLoading) {
    emptyState.hidden = true;
    recipeCard.hidden = true;
    loadingState.hidden = false;

    let index = 0;
    loadingText.textContent = LOADING_MESSAGES[index];

    clearInterval(loadingInterval);

    loadingInterval = setInterval(() => {
      index = (index + 1) % LOADING_MESSAGES.length;
      loadingText.textContent = LOADING_MESSAGES[index];
    }, 1800);

  } else {
    clearInterval(loadingInterval);
    loadingState.hidden = true;
    generateBtn.disabled = false;
  }
}

function showError(message) {
  errorBox.hidden = false;
  errorBox.textContent = message;
}

function renderRecipe(recipe) {
  recipeCard.hidden = false;
  emptyState.hidden = true;

  document.getElementById("recipe-image").src = recipe.image_url || "";
  document.getElementById("recipe-image").alt = recipe.dish_name || "Recipe Image";

  document.getElementById("cuisine-tag").textContent =
    recipe.cuisine || "Fusion";

  document.getElementById("dish-name").textContent =
    recipe.dish_name || "Untitled Recipe";

  document.getElementById("dish-description").textContent =
    recipe.short_description || "";

  document.getElementById("prep-time").textContent =
    formatMinutes(recipe.prep_time_minutes);

  document.getElementById("cook-time").textContent =
    formatMinutes(recipe.cook_time_minutes);

  document.getElementById("servings").textContent =
    recipe.servings || "—";

  document.getElementById("difficulty").textContent =
    recipe.difficulty || "—";

  fillList("used-ingredients", recipe.ingredients_used);

  const needBlock = document.getElementById("need-block");

  if (
    recipe.additional_ingredients_needed &&
    recipe.additional_ingredients_needed.length > 0
  ) {
    needBlock.hidden = false;
    fillList(
      "needed-ingredients",
      recipe.additional_ingredients_needed
    );
  } else {
    needBlock.hidden = true;
  }

  const stepsList = document.getElementById("steps-list");
  stepsList.innerHTML = "";

  (recipe.steps || []).forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsList.appendChild(li);
  });

  const tipBox = document.getElementById("tip-box");

  if (recipe.tips && recipe.tips.trim() !== "") {
    tipBox.hidden = false;
    document.getElementById("tip-text").textContent = recipe.tips;
  } else {
    tipBox.hidden = true;
  }
}

function fillList(id, items) {
  const ul = document.getElementById(id);
  ul.innerHTML = "";

  (items || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    ul.appendChild(li);
  });
}

function formatMinutes(minutes) {
  if (minutes === null || minutes === undefined || minutes === "") {
    return "—";
  }
  return `${minutes} min`;
}