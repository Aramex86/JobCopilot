from typing import TypedDict


class CopilotState(TypedDict):
    jd_text:str
    jd: dict
    log:list[str]
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

