from .base_agent import BaseAgent
from typing import Dict, Any

PROFILE = """
You are an experienced requirements archivist.
Mission:
Generate, maintain, and baseline a chapter-by-chapter Software Requirements Specification (SRS) from the approved System Requirements List, guaranteeing completeness, traceability, and compliance with international standards.
Personality:
Methodical, detail-oriented, and documentation-driven; fluent in both business language and formal specification terminology; committed to precision and version control.
Workflow:
1. Confirm the latest System Requirements List (SRL), priorities, and change logs.
2. Instantiate an IEEE 29148-compatible template (chapters: Introduction, Overall Description, Functional Requirements, Non-functional Requirements, Constraints, Usage Scenarios, Glossary, Requirements Model).
3. Convert SRL items into atomic, verifiable "The system shall …" statements; at the end of each chapter, output a draft and request stakeholder review.
4. Run linting for SMART criteria, cross-references, duplication, and gaps; resolve issues collaboratively.
Experience & Preferred Practices:
1. Adhere to ISO/IEC/IEEE 29148 (SRS), ISO/IEC/IEEE 12207 (software life-cycle), and BABOK v3 analysis techniques.
2. Prioritize with MoSCoW or Kano methods; enforce a consistent requirement-ID scheme (〈Module〉-〈Function〉-〈Index〉).
3. Employ documentation automation (Markdown/LaTeX + ReqIF, PlantUML/SysML) for reuse and traceability.
4. Attach Rationale, Source, and Acceptance Criteria to every requirement; keep bidirectional links to test cases.
5. Use an audit checklist covering clarity, singularity, verifiability, necessity, and design independence.
Internal Chain of Thought — visible to the agent only:
1. Map each requirement to 〈ID | Chapter | Type | Statement | Source〉 tuples and insert into the trace matrix.
2. Run SMART/INVEST checks; flag non-conformant items for clarification before finalizing.
3. Tag every section as Draft → Reviewed → Final; store diff patches for roll-back.
4. Populate template placeholders (<<Purpose>>, <<Scope>>, <<Functional_Reqs_List>>, etc.), then remove placeholders in the finalized text.
5. After each chapter's draft, auto-generate a revision summary and request explicit stakeholder confirmation before locking the chapter.
"""

CATEGORY_SRS = [
    "1. Introduction", 
    "2. Overall Description", 
    "3. Functional Requirements", 
    "4. Non-functional Requirements", 
    "5. Constraints", 
    "6. Usage Scenarios", 
    "7. Glossary", 
    "8. Requirements Model"
]


class ArchivistAgent(BaseAgent):
    def __init__(self):
        super().__init__(PROFILE)
        self.category_srs = CATEGORY_SRS

    async def execute(self, state: Dict[str, Any]) -> Dict[str, Any]:
        """Execute archivist workflow to generate SRS document"""
        system_requirements = state.get("system_requirements", "")
        
        # Generate comprehensive SRS document
        srs_document = await self.write_srs(system_requirements)
        state["srs_document"] = srs_document
        
        return state

    async def write_srs(self, system_requirements: str) -> str:
        """Generate chapter-by-chapter SRS document"""
        WRITE_SRS_PROMPT = """
You are acting as the **Requirements Archivist** described in the system prompt.  
Your task now is to **draft the "{category}" chapter** of an IEEE 29148-compliant Software Requirements Specification (SRS) for the system whose approved System Requirements List (SRL) is reproduced below.

========================  APPROVED SRL  ========================
{system_requirements}
===============================================================

**General instructions (apply to every chapter):**
1. Begin with the Markdown heading matching the chapter number and title, e.g. "# 1 Introduction".
2. Follow the structure recommended by IEEE 29148 for that chapter; remove any empty sub-sections.
3. Whenever you list individual requirements, transform each SRL item into a **single atomic "The system shall …" statement**, assigning a unique ID in the format `<Module>-<Function>-NNN`, and include:
   • **Priority** (MoSCoW)  
   • **Rationale** (why it is needed)  
   • **Source** (original SRL ID or stakeholder)  
   • **Acceptance Criteria** (verifiable test or condition)
4. Ensure every statement is **SMART** (Specific, Measurable, Achievable, Relevant, Time-boxed) and design-independent.  
   Flag non-conforming items under *Open Issues* rather than deleting them.
5. Maintain a short **Traceability Table** at the end of the chapter mapping each new requirement ID to its Source and (later) Test Case ID.
6. Conclude the chapter with:  
   *"## Revision Summary"* – bullet list of major additions/changes, plus any lint warnings (duplicates, gaps, etc.).  
   *"## Open Issues for Stakeholder Review"* – numbered list of questions or clarifications required.

**Chapter-specific guidance:**

| Chapter | Mandatory sub-sections (IEEE 29148 distilled) |
|---------|-----------------------------------------------|
| 1. Introduction | Purpose • Scope • Definitions, Acronyms & Abbreviations • References • Overview |
| 2. Overall Description | Product Perspective • Product Functions • User Classes & Characteristics • Operating Environment • Assumptions & Dependencies |
| 3. Functional Requirements | Introduction • Functional Requirement List (tabular) • Traceability Notes |
| 4. Non-functional Requirements | Performance • Reliability • Security • Usability • Maintainability • Portability |
| 5. Constraints | Regulatory/Legal • Hardware • Interface • Design & Implementation • Other Constraints |
| 6. Usage Scenarios | Scenario Index • Detailed Scenarios (Name, Actors, Pre-conditions, Main Flow, Alternatives) |
| 7. Glossary | Alphabetical list: Term – Definition – Source |
| 8. Requirements Model | PlantUML/SysML diagram code only (will be generated later) |

**Output rules:**
- Deliver **only** the content of the requested chapter in valid Markdown.  
- Do **not** generate any chapters other than "{category}".  
- Do **not** wrap the answer in triple back-ticks—plain Markdown is fine.

When ready, produce the draft for **{category}** now.
"""
        
        srs_content = []
        for category in self.category_srs[:-1]:  # Exclude Requirements Model for now
            chapter_content = await self._generate_response(
                WRITE_SRS_PROMPT.format(
                    system_requirements=system_requirements, 
                    category=category
                )
            )
            srs_content.append(chapter_content)
        
        # Combine all chapters
        complete_srs = "\n\n".join(srs_content)
        self.add_to_memory("srs_document", complete_srs)
        return complete_srs

    async def update_srs(self, srs_draft: str, review_report: str) -> str:
        """Update SRS based on review feedback"""
        UPDATE_SRS_PROMPT = """
You are acting as the **Requirements Archivist** responsible for incorporating review feedback
and producing the next revision of the Software Requirements Specification (SRS).

======================  CURRENT SRS (vDraft)  ======================
{srs_draft}
===================================================================

=====================  REVIEW REPORT (Markdown)  ===================
{review_report}
===================================================================

**Your job:**
1. Parse every finding in the Review Report and update the SRS accordingly:
   • Fix ambiguities, inconsistencies, unverifiable statements, duplicates, missing items, and traceability gaps.  
   • Keep each original requirement **ID** stable whenever possible.  
     - If a requirement must be split, create new IDs by incrementing the index (e.g., `PAY-VALID-003` → `PAY-VALID-004`).  
     - When removing a requirement, tag it as *Deprecated* and record the rationale in the change log.  
   • Ensure all fixes comply with IEEE 29148 style and the SMART checklist.

2. **Revision Control**  
   At the very end of the document (right before any appendices), add a "## Change Log" section in reverse-chronological order:
   | Rev | Date | Section/ID | Change Summary | Author |
   |-----|------|------------|----------------|--------|
   | v1.1 | YYYY-MM-DD | e.g., 3.2.1 / PAY-VALID-003 | Clarified acceptance criteria per review | Archivist |
   (Today's date = current system date; Author = "Archivist")

3. After applying all corrections, run an internal lint pass (SMART, consistency, traceability) and fix any residual issues silently.

4. **Output Rules**
   • Return **the fully revised SRS** (Markdown) beginning with "# 1 Introduction" and ending with the new Change Log.  
   • Do **not** include the old review report or any explanatory prose.  
   • Do **not** wrap the answer in back-ticks.  
   • Mark unchanged sections exactly as they were; only edited parts should differ.  

When ready, deliver the updated SRS (version v1.1) now.
"""
        
        updated_srs = await self._generate_response(
            UPDATE_SRS_PROMPT.format(srs_draft=srs_draft, review_report=review_report)
        )
        
        self.add_to_memory("srs_revised", updated_srs)
        return updated_srs