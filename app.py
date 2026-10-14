from flask import Flask, render_template, request, jsonify
import requests
import os
import json
import re
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)


OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "openai/gpt-oss-20b:free"
)


OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"


SYSTEM_PROMPT = """
You are an expert chef.

Generate exactly ONE recipe.

Return ONLY JSON.
No markdown.
No explanation.

JSON format:

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


def build_prompt(data):

    return f"""
Ingredients:
{data.get("ingredients")}

Diet:
{data.get("diet")}

Cuisine:
{data.get("cuisine")}

Cooking Time:
{data.get("cooking_time")}

Skill Level:
{data.get("skill_level")}
"""


def extract_json(text):

    text = text.strip()

    text = re.sub(
        r"```json|```",
        "",
        text
    ).strip()

    match = re.search(
        r"\{.*\}",
        text,
        re.DOTALL
    )

    if match:
        text = match.group()

    return json.loads(text)



@app.route("/")
def home():
    return render_template("index.html")



@app.route("/generate", methods=["POST"])
def generate():

    try:

        if not OPENROUTER_API_KEY:
            return jsonify({
                "error":"API key missing"
            }),500


        data = request.get_json()

        headers = {
            "Authorization":
            f"Bearer {OPENROUTER_API_KEY}",

            "Content-Type":
            "application/json"
        }


        payload = {

            "model": OPENROUTER_MODEL,

            "messages":[

                {
                    "role":"system",
                    "content":SYSTEM_PROMPT
                },

                {
                    "role":"user",
                    "content":build_prompt(data)
                }

            ],

            "temperature":0.8
        }


        response = requests.post(
            OPENROUTER_URL,
            headers=headers,
            json=payload,
            timeout=90
        )


        if response.status_code != 200:

            return jsonify({
                "error":response.text
            }),response.status_code



        result = response.json()


        content = (
            result["choices"][0]
            ["message"]
            ["content"]
        )


        recipe = extract_json(content)


        recipe["image_url"] = (
            "https://image.pollinations.ai/prompt/"
            + requests.utils.quote(
                recipe.get("dish_name","food")
                + " realistic food photography"
            )
            + "?width=800&height=600"
        )


        return jsonify(recipe)



    except Exception as e:

        print("ERROR:",e)

        return jsonify({
            "error":str(e)
        }),500




if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    app.run(
        host="0.0.0.0",
        port=port
    )
