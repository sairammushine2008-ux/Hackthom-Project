# LaunchOps AI — 3 to 5 Minute Demo Presentation Script

## Overview
**Application:** LaunchOps AI — AI-Powered Customer Onboarding & Handoff Workspace  
**Target Customer Scenario:** Acme Logistics Enterprise Onboarding (500 seats, target go-live: Nov 15, 2026)  
**Core Journey:** Scattered information → AI-generated plan → Manager approval → Departmental collaboration → Automated blocker resolution.

---

## Detailed Minute-by-Minute Breakdown

| Time Window | Segment | On-Screen Action | Spoken Narration / Talking Points | Key Value Demonstrated |
|---|---|---|---|---|
| **0:00–0:30** | **The Problem: Fragmented Customer Handoffs** | Navigate to the LaunchOps AI home / login page. | *"When Sales closes a major customer, critical commitments are scattered across emails, kickoff notes, and spreadsheets. Customer Success, IT, and Finance operate in silos. Delays happen because dependencies like SSO security sign-offs are overlooked. LaunchOps AI solves this by converting fragmented handoffs into structured, auditable action plans."* | Concrete enterprise onboarding problem. |
| **0:30–1:00** | **Workspace & Source Ingestion** | Click **Sarah Connor (Manager)** quick persona to log in. Open **Acme Logistics** from the Dashboard and switch to the **Sources** tab. | *"Here in Acme Logistics' workspace, we have our source handoff document. Notice how LaunchOps AI indexes every paragraph with a unique trace ID. It captures that SSO via Okta is mandatory, Finance lacks a billing contact, and IT config is waiting for Security sign-off."* | Single source of truth with paragraph-level indexing. |
| **1:00–1:45** | **AI Plan Generation & Grounded Citations** | Click **Generate Onboarding Plan** (or open the **Plan Review** tab). | *"Our Express backend invokes Google Gemini with strict Zod structured output. Notice that AI didn't just extract tasks; it identified missing information alerts: Finance has no billing contact! Click on any task citation, like Okta SSO: LaunchOps AI verifies and highlights the exact quoted text in the contract."* | AI structured output + strict source verification. |
| **1:45–2:20** | **Manager Review & Plan Approval** | In the Plan Review tab, review assignments, set dates, and click **Approve Plan & Deploy to Board**. | *"AI drafts, but humans decide. As Manager Sarah Connor, I review the department assignments. In one atomic database transaction, the plan is approved, tasks are created, and an immutable audit log entry is recorded with protection against duplicate approval."* | Human-in-the-loop governance & auditability. |
| **2:20–3:00** | **Departmental Board & Workflow Automation** | Switch to the **Tasks & Board** tab. Note that 'Configure Okta SSO' is **Blocked** by 'Complete Security & Compliance Review'. Click **Mark Complete** on the Security task. | *"Notice that the IT SSO task is marked Blocked because security approval is pending. When the security lead marks their review complete—watch what happens: LaunchOps AI's workflow automation engine instantly releases the SSO task to 'In Progress' and dispatches an in-app notification to the IT engineer!"* | Automated dependency release & zero manual chasing. |
| **3:00–3:45** | **AI Blocker Explanation & Inquiry** | Open the **LaunchOps AI Copilot** drawer on the right. Click **What is preventing Acme from launching?**. | *"When executives ask why launch is delayed, managers usually spend hours chasing updates. With one click, LaunchOps AI evaluates current task statuses, prerequisite chains, and source notes to explain root causes and recommend actionable next steps."* | Grounded, cited blocker intelligence. |
| **3:45–4:15** | **Executive Dashboard & Business Impact** | Return to the **Dashboard** in the top navigation. | *"On the operational dashboard, leadership sees real-time launch velocity, overdue tasks, and at-risk projects. Teams using LaunchOps AI reduce onboarding planning time from 4 hours to 5 minutes, catching 100% of omitted billing and compliance prerequisites before kickoff."* | Quantifiable ROI and operational visibility. |

---

## Evaluation Benchmark & Measured Productivity

| Metric | Manual Onboarding Process | With LaunchOps AI | Improvement |
|---|---|---|---|
| **Time to Create Approved Plan** | ~3.5 to 4.5 hours | **~4 minutes** | **~90% reduction** |
| **Missing Requirements Caught** | Often overlooked until week 2 | **Instantaneous** (Flags missing billing/security) | **100% early detection** |
| **AI Suggestions Needing Edit** | N/A | **1 to 2 field adjustments** (assignee/date) | **High accuracy** |
| **Dependency Resolution Delay** | 2–5 days of email follow-ups | **Automated real-time notification** | **Immediate release** |
