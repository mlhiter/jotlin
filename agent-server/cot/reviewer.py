from base_agent import BaseAgent

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

# -----------------------------------------------------------------------------
# Prompt templates (use self._generate_response to fill the {{placeholders}})
# -----------------------------------------------------------------------------
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

RAISE_FINDINGS_PROMPT = """
Act as the SRS Reviewer.
Using the JSON `findings` array provided below, create a **Review Report** in Markdown with the following format:

# Review Report

## Summary
* Total issues: {{total}}
* Blocker: {{blocker}}, Major: {{major}}, Minor: {{minor}}, Info: {{info}}

## Detailed Findings
For each item list:
* **ID** – requirement or section reference
* **Type** – issue_type
* **Severity** – severity
* **Description** – description (one sentence)
* **Recommended Fix** – concrete, actionable change that would resolve the problem.

Render the report exactly in this structure and nothing else.
"""

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
*If all items are Resolved →* “All findings cleared – SRS approved.”
*Otherwise →* “Some findings remain – re-work required.”
"""


class Reviewer(BaseAgent):
    """Quality-assurance agent that audits, reports, and verifies an SRS."""

    def __init__(self):
        super().__init__(REVIEWER_PROFILE)

    def evaluate_srs(self) -> list:
        """Run the checklist on the current SRS and return JSON findings list."""
        srs_text = self.get_memory("srs_draft")
        if not srs_text:
            raise ValueError("No SRS draft found in memory under key 'srs_draft'.")
        findings_json = self._generate_response(EVALUATE_PROMPT.format(srs_text=srs_text))
        self.add_to_memory("findings_json", findings_json)
        return findings_json

    # def raise_findings(self) -> str:
    #     """Generate a human-readable review report based on JSON findings."""
    #     findings_json = self.get_memory("findings_json")
    #     if not findings_json:
    #         raise ValueError("No findings JSON available. Run evaluate_srs() first.")
    #     import json
    #     parsed = json.loads(findings_json)
    #     severities = {"Blocker": 0, "Major": 0, "Minor": 0, "Info": 0}
    #     for item in parsed:
    #         sev = item.get("severity", "Info")
    #         if sev in severities:
    #             severities[sev] += 1
    #     total = len(parsed)
    #     prompt_filled = (RAISE_FINDINGS_PROMPT
    #                      .replace("{{total}}", str(total))
    #                      .replace("{{blocker}}", str(severities["Blocker"]))
    #                      .replace("{{major}}", str(severities["Major"]))
    #                      .replace("{{minor}}", str(severities["Minor"]))
    #                      .replace("{{info}}", str(severities["Info"]))
    #                      + "\n```json\n" + findings_json + "\n```")

    #     report_md = self._generate_response(prompt_filled)
    #     self.add_to_memory("review_report", report_md)
    #     return report_md

    # def confirm_closure(self) -> str:
    #     """Re-audit revised SRS against previous findings, return closure status table."""
    #     revised_srs = self.get_memory("srs_revised")
    #     findings_json = self.get_memory("findings_json")
    #     if not revised_srs or not findings_json:
    #         raise ValueError("Need both 'srs_revised' and initial 'findings_json' in memory.")

    #     prompt_filled = (CONFIRM_CLOSURE_PROMPT
    #                      .replace("{{srs_text}}", revised_srs)
    #                      .replace("{{findings_json}}", findings_json))

    #     closure_table = self._generate_response(prompt_filled)
    #     return closure_table
