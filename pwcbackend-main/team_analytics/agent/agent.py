"""
TactiqAI — LangChain React agent for Jordan national football team analytics.

Usage:
    from team_analytics.agent.agent import run_agent
    result = run_agent("Who should replace Yazan Al Naimat at striker?")
"""

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage
from langgraph.prebuilt import create_react_agent

from .tools import ALL_TOOLS

GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE"

# ── System prompt ─────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are **TactiqAI** — the elite football analytics intelligence
embedded in the Jordan National Football Team's coaching staff system for the
FIFA World Cup 2026 qualification campaign.

## Your Identity
You think like a blend of a top-tier data analyst and an experienced football
coach.  You speak confidently but always anchor your insights in evidence from
the squad database you have real-time access to.

## Your Responsibilities
1. **Injury & Availability Management** — assess the impact of every injury on
   formation depth and suggest data-backed replacements.
2. **Fitness & Readiness Scoring** — continuously monitor player fitness trends
   and flag players who are approaching a risk zone before they break down.
3. **Tactical Intelligence** — merge opponent scouting profiles with Jordan's
   available assets to propose exploitation strategies.
4. **Squad Selection Advice** — recommend lineups and substitution plans for
   specific matches, considering fitness, form, and tactical matchup.
5. **Position Depth Awareness** — instantly recall who is available at every
   position and surface the depth gaps that need attention.

## How You Reason
- **Always call a tool first** before stating any statistics, player names, or
  recommendations.  Never invent data.
- When recommending a player, cite their suitability score, fitness tier, and
  any risk flags.
- If the data reveals a coverage gap or a readiness concern, proactively mention
  it even if it was not asked.
- Use the tactical insights tool when answering questions about upcoming matches
  or opponent preparation.
- Keep answers structured: a short **headline insight**, then bullet-point
  **evidence**, then a **recommended action**.

## Constraints
- You only advise for the Jordan national team.
- Never recommend an INJ or SUS player as a starter.
- Raise a flag when the squad readiness score drops below 60.
- Always convert raw numbers into coaching language (e.g., "fitness score 88"
  → "peak physical condition").

Today's squad data is live.  Let's win.
"""


def build_agent():
    """
    Construct and return the compiled LangGraph React agent.

    The agent is stateless per invocation — pass full context in each call.
    """
    llm = ChatOpenAI(
        model="llama-3.3-70b-versatile",
        api_key=GROQ_API_KEY,
        base_url="https://api.groq.com/openai/v1",
        temperature=0.2,
        max_tokens=2048,
    )

    agent = create_react_agent(
        model=llm,
        tools=ALL_TOOLS,
        prompt=SystemMessage(content=SYSTEM_PROMPT),
    )
    return agent


# Module-level singleton — built once per process, reused across requests.
_agent = None


def get_agent():
    global _agent
    if _agent is None:
        _agent = build_agent()
    return _agent


def run_agent(user_query: str, session_history: list | None = None) -> dict:
    """
    Run TactiqAI against a user query and return a structured response.

    Args:
        user_query:      The coaching staff's natural-language question.
        session_history: Optional list of prior messages in LangChain format
                         for multi-turn conversations.

    Returns:
        dict with keys:
          - answer  (str)  : The agent's final answer.
          - steps   (list) : Tool calls made during reasoning (for audit trail).
          - error   (str|None): Error message if the agent failed.
    """
    agent = get_agent()

    messages = list(session_history or [])
    messages.append({"role": "user", "content": user_query})

    try:
        result = agent.invoke({"messages": messages})
    except Exception as exc:  # noqa: BLE001
        return {"answer": None, "steps": [], "error": str(exc)}

    all_messages = result.get("messages", [])

    # Extract final AI answer
    final_answer = ""
    for msg in reversed(all_messages):
        if hasattr(msg, "content") and getattr(msg, "type", "") == "ai":
            if isinstance(msg.content, str) and msg.content.strip():
                final_answer = msg.content
                break
            if isinstance(msg.content, list):
                text_parts = [
                    block.get("text", "")
                    for block in msg.content
                    if isinstance(block, dict) and block.get("type") == "text"
                ]
                combined = " ".join(text_parts).strip()
                if combined:
                    final_answer = combined
                    break

    # Collect tool invocation audit trail
    steps = []
    for msg in all_messages:
        if getattr(msg, "type", "") == "tool":
            steps.append(
                {
                    "tool": getattr(msg, "name", "unknown"),
                    "output_preview": (
                        str(msg.content)[:200] if msg.content else ""
                    ),
                }
            )

    return {"answer": final_answer, "steps": steps, "error": None}
