from langgraph.graph import END, START, StateGraph

from match_resume import match_resume
from parse_jd import parse_jd
from state import CopilotState


def route_after_parse(state:CopilotState)-> str:
    if state['error'] is not None:
        return END
    return "match_resume"

def build_graph():
    builder = StateGraph(CopilotState)
    builder.add_node("parse_jd",parse_jd)
    builder.add_node("match_resume",match_resume)
    builder.add_edge(START,"parse_jd")
    builder.add_conditional_edges(
        "parse_jd",
        route_after_parse,
        {"match_resume":"match_resume", END: END}
    )
    builder.add_edge("match_resume", END)
    return builder.compile()