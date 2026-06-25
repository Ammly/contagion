import os
import sys
import asyncio

# Ensure backend directory is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if os.path.exists(os.path.join(parent_dir, "app")):
    sys.path.insert(0, parent_dir)
elif os.path.exists(os.path.join(parent_dir, "backend", "app")):
    sys.path.insert(0, os.path.join(parent_dir, "backend"))

# Load environment variable
# If GEMINI_API_KEY is not in env, try reading it from .env in the root
if "GEMINI_API_KEY" not in os.environ:
    env_path = os.path.join(current_dir, "..", ".env")
    if not os.path.exists(env_path):
        env_path = os.path.join(current_dir, "..", "..", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                if line.startswith("GEMINI_API_KEY="):
                    os.environ["GEMINI_API_KEY"] = line.strip().split("=", 1)[1].strip("\"'")

from google.adk.runners import Runner
from google.adk.artifacts.in_memory_artifact_service import InMemoryArtifactService
from google.adk.memory.in_memory_memory_service import InMemoryMemoryService
from google.adk.sessions.in_memory_session_service import InMemorySessionService
from google.genai import types

from app.agents.pipeline import email_agent

async def run_smoke_test(retries: int = 5, initial_delay: float = 2.0):
    print("Running Agent Smoke Test...")
    input_message = "Hi operations team, please approve the weekly timesheets by Friday."
    
    import re
    delay = initial_delay
    for attempt in range(retries):
        try:
            # Initialize the Runner for the email agent
            runner = Runner(
                app_name="contagion-test",
                agent=email_agent,
                artifact_service=InMemoryArtifactService(),
                session_service=InMemorySessionService(),
                memory_service=InMemoryMemoryService()
            )
            
            session = await runner.session_service.create_session(app_name="contagion-test", user_id="test-user")
            content = types.Content(
                role="user",
                parts=[types.Part.from_text(text=input_message)]
            )
            
            agent_output = ""
            async for event in runner.run_async(
                user_id=session.user_id,
                session_id=session.id,
                new_message=content,
            ):
                if event.author == email_agent.name and event.content and event.content.parts:
                    text = "".join(part.text for part in event.content.parts if part.text)
                    if text:
                        agent_output = text
                        
            await runner.close()
            
            # Asserts
            print(f"Input: {repr(input_message)}")
            print(f"Output: {repr(agent_output)}")
            
            assert agent_output, "Error: Agent output is empty!"
            assert agent_output.strip() != input_message.strip(), "Error: Agent output is byte-identical to the input (echoed input)!"
            
            print("Smoke Test Passed Successfully! Output is valid and not echoed.")
            return
        except Exception as e:
            err_str = str(e)
            if any(marker in err_str for marker in ["429", "RESOURCE_EXHAUSTED", "503", "UNAVAILABLE"]):
                match = re.search(r"retry in ([\d\.]+)s", err_str)
                sleep_time = float(match.group(1)) + 2.0 if match else delay
                print(f"[Smoke Test] Transient error or rate limited. Retrying in {sleep_time:.2f} seconds... (Attempt {attempt+1}/{retries})")
                await asyncio.sleep(sleep_time)
                delay *= 2.0
            else:
                raise e
    raise RuntimeError("Exceeded max retries executing smoke test due to transient errors")

if __name__ == "__main__":
    asyncio.run(run_smoke_test())
