import os
import re

from openai import OpenAI
from pydantic import BaseModel


class Match(BaseModel):
    match_score:int
    verdict:str
    gaps:list[str]
    strengths:list[str]


client = OpenAI(
    base_url="https://ollama.com/v1",
    api_key=os.environ["OLLAMA_API_KEY"],
)


SYSTEM_PROMPT = """You are a skeptical tech recruiter.
Compare the candidate's resume against the job description.
Be strict: missing information counts as a gap, never guess in the candidate's favor.
Return ONLY a JSON object, no markdown, no commentary:
{
  "match_score": <int 0-100>,
  "verdict": "<strong|moderate|weak>",
  "gaps": ["<JD requirement the resume lacks>", ...],
  "strengths": ["<requirement the resume clearly covers>", ...]
}
"""

def match_resume(state:dict)->dict:
  log = list(state.get("log",[]))
  resume_text = state.get("resume_text","")
  jd = state.get("jd",{})

  if not resume_text:
    return {"error": "resume_text is empty",
                "log": log + ["match_resume: blocked, empty resume_text"]}
  try:
    completion = client.beta.chat.completions.parse(
        model='gpt-oss:20b',
        messages=[{'role': 'system', 'content':SYSTEM_PROMPT},
                  {'role': 'user', 'content':  f"""Job description:{jd}
                  
                  Resume:{resume_text}"""}],
        response_format={"type": "json_object"},
        temperature=0,
    )

    raw = completion.choices[0].message.content

    raw_json = re.search(r"\{.*\}", raw, re.DOTALL).group(0)

    parsed = Match.model_validate_json(raw_json)

    return {
        'match': parsed.model_dump(),"error": None,
        'log': log + [f"match_resume: ok, {parsed.match_score}"],
    }
  except Exception as e:  # noqa: BLE001
      return {'error':str(e), 'log': log + ["match_resume: failed"]}