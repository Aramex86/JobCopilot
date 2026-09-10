from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

from match_resume import match_resume
from parse_jd import parse_jd
from state import new_state

state = new_state()

state["jd_text"] = """
Senior React Developer — Acme Corp (Remote)

Requirements:
- 5+ years of experience with React and TypeScript
- Strong experience with Next.js, Redux/Zustand
- Design systems, component libraries
- REST/GraphQL integration, Jest, Playwright

Nice to have: team-lead experience, CI/CD, Docker.
We offer fully remote work, salary $90,000-$120,000.
"""

state["resume_text"] = """
Senior React developer with 6 years of experience.
React, TypeScript, Next.js, Redux and Zustand.
Built design systems and component libraries.
REST and GraphQL integration, Jest tests.
Team lead experience.
"""

updates = parse_jd(state)
state.update(updates)

if state['error'] is None:
    state.update(match_resume(state))

print("JD:", state["jd"])
print("LOG:", state["log"])
print("MATCH:", state["match"])
print("ERROR:", state["error"])



