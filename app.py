from flask import Flask, render_template, request, jsonify
import requests
import os
import json
import re
from dotenv import load_dotenv

# ---------- Load environment variables ----------
load_dotenv()

app = Flask(__name__)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get(
    "OPENROUTER_MODEL",
    "meta-llama/llama-3.1-8b-instruct:free"
)
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

SYSTEM_PROMPT = """
You are an expert professional chef and recipe writer.

Generate ONE personalized recipe.

Return ONLY valid JSON.

{
  "dish_name":"",
  "short_description":"",
  "cuisine":"",
  "difficulty":"",
  "prep_time_minutes":0,
  "cook_time_minutes":0,
  "servings":0,
  "ingredients_used":[],
  "additional_ingredients_needed":[],
  "steps":[],
  "tips":""
}
"""


def build_user_prompt(ingredients, diet, cuisine, cooking_time, skill_level):
    return f"""
Available ingredients: {ingredients}

Dietary preference: {diet}

Cuisine: {cuisine}

Cooking Time: {cooking_time}

Skill Level: {skill_level}
"""


def extract_json(text):
    text = text.strip()

    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\n?", "", text)
        text = re.sub(r"```$", "", text).strip()

    match = re.search(r"\{.*\}", text, re.DOTALL)

    if match:
        text = match.group(0)

    return json.loads(text)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate():

    if not OPENROUTER_API_KEY:
        return jsonify({"error": "OPENROUTER_API_KEY not found"}), 500

    data = request.get_json()

    ingredients = data.get("ingredients", "")
    diet = data.get("diet", "Any")
    cuisine = data.get("cuisine", "Any")
    cooking_time = data.get("cooking_time", "30 Minutes")
    skill_level = data.get("skill_level", "Beginner")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": build_user_prompt(
                    ingredients,
                    diet,
                    cuisine,
                    cooking_time,
                    skill_level
                )
            }
        ],
        "temperature": 0.7
    }

    try:

        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=60
        )

        response.raise_for_status()

        result = response.json()

        recipe = extract_json(
            result["choices"][0]["message"]["content"]
        )

        image_prompt = requests.utils.quote(
            recipe["dish_name"] + " food photography"
        )

        recipe["image_url"] = (
            f"https://image.pollinations.ai/prompt/"
            f"{image_prompt}?width=800&height=600"
        )

        return jsonify(recipe)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)