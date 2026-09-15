from dotenv import load_dotenv

load_dotenv(override=True)  # Load environment variables from .env file

from graph import build_graph
from state import new_state

state = new_state()

app = build_graph()

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

result = app.invoke(state)

print("JD:", result["jd"])
print("LOG:", result["log"])
print("MATCH:", result["match"])
print("ERROR:", result["error"])



