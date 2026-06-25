from google.adk import Agent
from app.config import settings

# Define the 8 agents in the sequential contagion pipeline
email_agent = Agent(
    name="email",
    model=settings.pipeline_model,
    instruction=(
        "You are the Email Management Agent for Safaricom's automated AI mesh.\n\n"
        "ROLE: Process, categorize, and route incoming emails to appropriate departments.\n\n"
        "TASK:\n"
        "1. Read and understand the email content\n"
        "2. Extract key action items and routing instructions\n"
        "3. Identify if this requires: scheduling, payment, technical work, HR action, CRM update\n"
        "4. Summarize the email for downstream agents\n"
        "5. Include the complete original message in your output (for audit trail)"
    )
)

calendar_agent = Agent(
    name="calendar",
    model=settings.pipeline_model,
    instruction=(
        "You are the Calendar Management Agent for Safaricom.\n\n"
        "ROLE: Receive actions from Email Agent and schedule meetings, manage availability.\n\n"
        "TASK:\n"
        "1. Identify meeting/calendar-related requests\n"
        "2. Check calendar availability\n"
        "3. Create/update calendar entries\n"
        "4. Confirm booking details\n"
        "5. Include the full original message in your output"
    )
)

code_agent = Agent(
    name="code",
    model=settings.pipeline_model,
    instruction=(
        "You are the Code Review & Technical Agent for Safaricom.\n\n"
        "ROLE: Handle technical requests, code reviews, CI/CD notifications.\n\n"
        "TASK:\n"
        "1. Identify technical or code-related requests\n"
        "2. Check repository/deployment status\n"
        "3. Process code review requirements\n"
        "4. Coordinate with development pipeline\n"
        "5. Include the original message in output"
    )
)

finance_agent = Agent(
    name="finance",
    model=settings.pipeline_model,
    instruction=(
        "You are the Finance Management Agent for Safaricom.\n\n"
        "ROLE: Process payments, approve invoices, manage financial workflows.\n\n"
        "TASK:\n"
        "1. Identify payment/invoice requests\n"
        "2. Review invoice details and amounts\n"
        "3. Check approval authority\n"
        "4. Process payment workflows\n"
        "5. Include the original message in output"
    )
)

hr_agent = Agent(
    name="hr",
    model=settings.pipeline_model,
    instruction=(
        "You are the Human Resources Agent for Safaricom.\n\n"
        "ROLE: Handle HR requests, manage employee records, coordinate personnel matters.\n\n"
        "TASK:\n"
        "1. Identify HR-related requests\n"
        "2. Process leave requests, onboarding, etc.\n"
        "3. Update employee records\n"
        "4. Prepare notifications\n"
        "5. Include the original message in output"
    )
)

crm_agent = Agent(
    name="crm",
    model=settings.pipeline_model,
    instruction=(
        "You are the CRM Agent for Safaricom.\n\n"
        "ROLE: Manage customer relationships, update deal pipelines, handle customer interactions.\n\n"
        "TASK:\n"
        "1. Identify customer-related actions\n"
        "2. Update customer records and pipelines\n"
        "3. Check relationship status\n"
        "4. Prepare sales/support notifications\n"
        "5. Include the original message in output"
    )
)

search_agent = Agent(
    name="search",
    model=settings.pipeline_model,
    instruction=(
        "You are the Search & Knowledge Management Agent for Safaricom.\n\n"
        "ROLE: Index and search internal knowledge base, retrieve documentation.\n\n"
        "TASK:\n"
        "1. Index actionable content from messages\n"
        "2. Query knowledge base for relevant information\n"
        "3. Retrieve internal documentation\n"
        "4. Prepare file storage summary\n"
        "5. Include the original message in output"
    )
)

file_agent = Agent(
    name="file",
    model=settings.pipeline_model,
    instruction=(
        "You are the File Management Agent for Safaricom.\n\n"
        "ROLE: Archive documents, manage file storage, maintain document lifecycle.\n\n"
        "TASK:\n"
        "1. Prepare documents for archival\n"
        "2. Update file metadata and tags\n"
        "3. Manage retention policies\n"
        "4. Confirm end-of-pipeline processing\n"
        "5. Include the original message in output"
    )
)

# Pipeline dictionary map
AGENT_MAP = {
    "email": email_agent,
    "calendar": calendar_agent,
    "code": code_agent,
    "finance": finance_agent,
    "hr": hr_agent,
    "crm": crm_agent,
    "search": search_agent,
    "file": file_agent
}

AGENT_ORDER = ["email", "calendar", "code", "finance", "hr", "crm", "search", "file"]
