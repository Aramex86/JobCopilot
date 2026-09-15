import operator
from typing import Annotated, TypedDict


class CopilotState(TypedDict):
    jd_text:str
    jd: dict
    log: Annotated[list[str],operator.add]
    resume_text:str
    match:dict
    error:str | None


def new_state() -> CopilotState:
    return {
        "jd_text": "",
        "jd": {},
        "log": [],
        "resume_text": "",
        "match": {},
        "error": None,
    }

