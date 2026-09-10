import os
import re

from openai import OpenAI
from pydantic import BaseModel

from state import CopilotState


class JD(BaseModel):
    title: str
    company: str
    location: str
    remote: bool
    years_experience: int
    hard_skills: list[str]
    soft_skills: list[str]
    salary: str | None = None

client = OpenAI(
    base_url="https://ollama.com/v1",
    api_key=os.environ["OLLAMA_API_KEY"],
)


SYSTEM_PROMPT = (
    "You are a precise recruiter. Extract structured info from the job description. "
    "Respond with ONLY a valid JSON object — no markdown, no code fences, no commentary — "
    "with exactly these keys: "
    '{"title": str, "company": str, "location": str, "remote": bool, '
    '"years_experience": int, "hard_skills": [str], "soft_skills": [str], "salary": str | null}. '
    "If a field is not in the text, use null for salary and empty lists."
)
def parse_jd(state: CopilotState) -> dict: 
    try:
        completion = client.beta.chat.completions.parse(
            model='gpt-oss:20b',
            messages=[{'role': 'system', 'content':SYSTEM_PROMPT},
                      {'role': 'user', 'content': state['jd_text']}],
            response_format={"type": "json_object"},
            temperature=0,
        )

        raw = completion.choices[0].message.content

        match = re.search(r"\{.*\}", raw, re.DOTALL)

        jd = JD.model_validate_json(match.group(0))

        return {
            'jd': jd.model_dump(),
            'log': state['log'] + [f"parsed JD successfully: {jd.title}"],
        }
    
    except Exception as e:  # noqa: BLE001
            return {'error':str(e), 'log': state['log'] + [f"failed to parse JD: {e}"]}





