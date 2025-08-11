from .base_agent import BaseAgent
from typing import Dict, Any, List
import json

REVIEWER_PROFILE = """
You are a senior **SRS Reviewer** specialising in software-requirements quality assurance.
Mission:
Close the quality-control loop by auditing, reporting and verifying an IEEE 29148-compliant Software Requirements Specification (SRS).
Personality:
Thorough, analytical, and constructive; speaks the language of both engineers and auditors; uncompromising on standards compliance.
Workflow:
1. **Evaluate** – apply the checklist and quality criteria to every SRS section, logging concrete findings.
2. **Raise Findings** – compile a structured review report, classify each issue, set severity, and propose actionable fixes.
3. **Confirm Closure** – after re-work, re-examine the SRS, verify resolution, and either sign-off or re-open items.
Experience & Preferred Practices:
• Follows ISO/IEC/IEEE 29148, ISO/IEC/IEEE 12207, and BABOK v3.
• Uses SMART/INVEST rules, ambiguity keywords, and traceability matrices.
• Severity scale: Blocker ▸ Major ▸ Minor ▸ Info.
• Issue taxonomy: Ambiguity, Inconsistency, Unverifiable, Duplicate, Missing, Traceability-Gap.
• Keeps bidirectional links to change-requests and test-cases.
"""


class ReviewerAgent(BaseAgent):
    """Quality-assurance agent that audits, reports, and verifies an SRS."""

    def __init__(self):
        super().__init__(REVIEWER_PROFILE)

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute reviewer workflow"""
        srs_document = state.get("srs_document", "")
        
        if not srs_document:
            return state
            
        # Evaluate SRS and generate findings
        findings_json = await self.evaluate_srs(srs_document)
        state["review_findings"] = findings_json
        
        # Generate review report
        review_report = await self.generate_review_report(findings_json)
        state["review_report"] = review_report
        
        return state

    async def evaluate_srs(self, srs_text: str) -> str:
        """Run the checklist on the current SRS and return JSON findings list."""
        EVALUATE_PROMPT = """
You are the SRS Reviewer.
Audit the Software Requirements Specification reproduced below.

====================  SRS DRAFT  ====================
{srs_text}
=====================================================

Apply the following **Quality Checklist** to every numbered clause:
1. Clarity – free of ambiguity keywords (e.g., "fast", "user-friendly").
2. Singularity – one requirement per statement.
3. Verifiability – objectively testable acceptance criteria present.
4. Necessity – requirement is essential and not design-specific.
5. Consistency – no conflicts with other statements.
6. Traceability – has unique ID and source reference.
7. Completeness – all mandatory sub-sections populated.

**Output** a JSON array called `findings` where each element has:
• `id` (string) – SRS clause or requirement ID.
• `issue_type` (one of Ambiguity, Inconsistency, Unverifiable, Duplicate, Missing, Traceability-Gap).
• `severity` (Blocker, Major, Minor, Info).
• `description` – concise problem explanation quoting the offending text.
Store the JSON only – no extra prose.
"""
        
        findings_json = await self._generate_response(EVALUATE_PROMPT.format(srs_text=srs_text))
        self.add_to_memory("findings_json", findings_json)
        return findings_json

    async def generate_review_report(self, findings_json: str) -> str:
        """Generate a human-readable review report based on JSON findings."""
        try:
            parsed_findings = json.loads(findings_json)
        except:
            parsed_findings = []
            
        severities = {"Blocker": 0, "Major": 0, "Minor": 0, "Info": 0}
        for item in parsed_findings:
            sev = item.get("severity", "Info")
            if sev in severities:
                severities[sev] += 1
        
        total = len(parsed_findings)
        
        RAISE_FINDINGS_PROMPT = f"""
Act as the SRS Reviewer.
Using the JSON `findings` array provided below, create a **Review Report** in Markdown with the following format:

# Review Report

## Summary
* Total issues: {total}
* Blocker: {severities["Blocker"]}, Major: {severities["Major"]}, Minor: {severities["Minor"]}, Info: {severities["Info"]}

## Detailed Findings
For each item list:
* **ID** – requirement or section reference
* **Type** – issue_type
* **Severity** – severity
* **Description** – description (one sentence)
* **Recommended Fix** – concrete, actionable change that would resolve the problem.

Render the report exactly in this structure and nothing else.

```json
{findings_json}
```
"""

        report_md = await self._generate_response(RAISE_FINDINGS_PROMPT)
        self.add_to_memory("review_report", report_md)
        return report_md

    async def confirm_closure(self, srs_text: str, findings_json: str) -> str:
        """Re-audit revised SRS against previous findings, return closure status table."""
        CONFIRM_CLOSURE_PROMPT = """
You are the SRS Reviewer performing closure verification.

### Inputs
1. **Revised SRS** (current version):
{srs_text}
2. **Previous Findings** (JSON):
{findings_json}

For each finding, check whether it is resolved in the revised SRS.
Return a Markdown table with columns:
| ID | Previously Reported Issue | Status | Evidence |
Where **Status** is one of *Resolved*, *Partially Resolved*, *Unresolved*.
Follow the table with a one-line verdict:
*If all items are Resolved →* "All findings cleared – SRS approved."
*Otherwise →* "Some findings remain – re-work required."
"""
        
        closure_table = await self._generate_response(
            CONFIRM_CLOSURE_PROMPT.format(srs_text=srs_text, findings_json=findings_json)
        )
        return closure_table