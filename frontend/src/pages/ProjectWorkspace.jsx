import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { projectsApi, sourcesApi, aiApi, tasksApi, commentsApi, auditApi } from '../services/api';
import { StatusBadge, DepartmentBadge } from '../components/StatusBadge';
import { TaskBoard } from '../components/workspace/TaskBoard';
import { SourceReferenceModal } from '../components/SourceReferenceModal';
import {
  Calendar,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Bot,
  Send,
  MessageSquare,
  History,
  Check,
  User,
  Quote,
  Lock,
  Clock,
  Layers,
  FileCheck,
  ChevronRight,
  X,
  Upload,
  BookOpen
} from 'lucide-react';
import { cn } from '../utils/cn';

export function ProjectWorkspace() {
  const { id } = useParams();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Active Tab
  const [activeTab, setActiveTab] = useState('overview'); // overview, sources, plan, tasks, activity

  // AI Assistant Drawer state
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(true);
  const [aiChatMessages, setAiChatMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your LaunchOps AI Assistant for Acme Logistics. Ask me about launch prerequisites, missing requirements, or task dependencies.'
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Citation Modal state
  const [selectedCitation, setSelectedCitation] = useState(null);

  // Workspace Data State
  const [project, setProject] = useState({
    id: 'acme-logistics',
    name: 'Acme Logistics',
    targetLaunchDate: '2026-11-15',
    status: 'Blocked',
    manager: 'Sarah Connor',
    seats: 500
  });

  const [sources, setSources] = useState([
    {
      id: 'sales-handoff-01',
      title: 'Sales Handoff & Kickoff Notes',
      version: 1,
      paragraphs: [
        { paragraphId: 'p1', text: 'Acme Logistics contract executed for 500 enterprise seats. The requested target launch date is November 15, 2026.' },
        { paragraphId: 'p2', text: 'Single sign-on (SSO) configuration via Okta is strictly mandatory for IT provisioning and company-wide access.' },
        { paragraphId: 'p3', text: 'Note from kickoff: Finance has not received the customer billing contact or purchase order (PO) number yet. Invoicing cannot proceed without this.' },
        { paragraphId: 'p4', text: 'IT architecture and API endpoint provisioning must strictly wait for Security and Compliance approval before any production credentials are generated.' },
        { paragraphId: 'p5', text: 'Customer Success needs to schedule the Executive Kickoff Call and establish bi-weekly onboarding syncs.' }
      ]
    }
  ]);

  const [tasks, setTasks] = useState([
    {
      id: 'tsk-sec-01',
      title: 'Complete Security & Compliance Review',
      description: 'Review questionnaires and compliance controls before issuing production credentials.',
      department: 'Security',
      owner_name: 'David Kim',
      status: 'In Progress',
      due_date: '2026-10-15',
      dependencies: [],
      source_references: [
        {
          documentId: 'sales-handoff-01',
          paragraphId: 'p4',
          quote: 'IT architecture and API endpoint provisioning must strictly wait for Security and Compliance approval before any production credentials are generated.'
        }
      ]
    },
    {
      id: 'tsk-sso-02',
      title: 'Configure Okta Single Sign-On (SSO)',
      description: 'Set up SAML/OIDC integration with customer Okta identity provider.',
      department: 'IT',
      owner_name: 'David Kim',
      status: 'Blocked',
      due_date: '2026-10-22',
      dependencies: [{ prerequisite_title: 'Complete Security & Compliance Review', status: 'In Progress' }],
      source_references: [
        {
          documentId: 'sales-handoff-01',
          paragraphId: 'p2',
          quote: 'Single sign-on (SSO) configuration via Okta is strictly mandatory for IT provisioning and company-wide access.'
        }
      ]
    },
    {
      id: 'tsk-fin-03',
      title: 'Collect Customer Billing Contact & Purchase Order',
      description: 'Request official billing email and PO number from customer accounting department.',
      department: 'Finance',
      owner_name: 'Elena Rostova',
      status: 'In Progress',
      due_date: '2026-10-10',
      dependencies: [],
      source_references: [
        {
          documentId: 'sales-handoff-01',
          paragraphId: 'p3',
          quote: 'Finance has not received the customer billing contact or purchase order (PO) number yet. Invoicing cannot proceed without this.'
        }
      ]
    },
    {
      id: 'tsk-cs-04',
      title: 'Schedule Executive Onboarding Kickoff Call',
      description: 'Align key customer stakeholders on milestones and launch timeline.',
      department: 'CS',
      owner_name: 'Sarah Connor',
      status: 'Completed',
      due_date: '2026-10-05',
      dependencies: [],
      source_references: [
        {
          documentId: 'sales-handoff-01',
          paragraphId: 'p5',
          quote: 'Customer Success needs to schedule the Executive Kickoff Call and establish bi-weekly onboarding syncs.'
        }
      ]
    }
  ]);

  const [auditEvents, setAuditEvents] = useState([
    { id: '1', action: 'PROJECT_INITIALIZED', actor: 'Alex Rivera (Sales)', time: '2 hours ago', detail: 'Acme Logistics 500-seat contract ingested' },
    { id: '2', action: 'AI_PLAN_GENERATED', actor: 'Gemini AI Engine', time: '1 hour ago', detail: 'Extracted 4 departmental tasks with paragraph citations' },
    { id: '3', action: 'PLAN_APPROVED', actor: 'Sarah Connor (Manager)', time: '45 mins ago', detail: 'Approved plan deployed to task board' }
  ]);

  // Handle Quick Prompts in AI Side Drawer
  const handleQuickPrompt = (prompt) => {
    setAiChatMessages(prev => [...prev, { role: 'user', text: prompt }]);
    setIsAiLoading(true);

    setTimeout(() => {
      let response = '';
      if (prompt.includes('blocking')) {
        response = `### 🚨 Launch Blockers for Acme Logistics
1. **Technical SSO Dependency:**
   - Task: **"Configure Okta Single Sign-On (SSO)"** (IT) is currently **Blocked**.
   - Root Cause: Waiting on **"Complete Security & Compliance Review"** (Security) [Ref: sales-handoff-01 #p4].
2. **Missing Billing Contact:**
   - Task: **"Collect Customer Billing Contact & PO"** (Finance) [Ref: sales-handoff-01 #p3].
   - Invoicing cannot proceed until the customer accounting contact is provided.

**Action to Unblock:** Mark the Security Review task as Completed to automatically release the Okta SSO configuration.`;
      } else if (prompt.includes('Summarize')) {
        response = `### 📊 Management Progress Update: Acme Logistics
- **Target Launch:** Nov 15, 2026 (46 days remaining)
- **Overall Health:** ⚠️ At Risk (Blocked)
- **Progress:** 35% complete (1 of 4 core tasks finished)
- **Customer Success:** Executive Kickoff scheduled [Ref: sales-handoff-01 #p5].
- **Next Milestone:** Unblock Okta SSO provisioning upon Infosec sign-off.`;
      } else {
        response = `### 📋 Missing Requirements Audit
- **Finance Billing Contact:** The sales handoff notes explicitly state that no billing contact or purchase order number was provided [Ref: sales-handoff-01 #p3].
- **Security Questionnaire:** Customer infosec packet is currently pending David Kim's review before API keys can be provisioned [Ref: sales-handoff-01 #p4].`;
      }

      setAiChatMessages(prev => [...prev, { role: 'assistant', text: response }]);
      setIsAiLoading(false);
    }, 600);
  };

  // Handle User Chat Input
  const handleSendAiMessage = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;
    const text = aiInput;
    setAiInput('');
    handleQuickPrompt(text);
  };

  // Handle Task Completion & Dependency Release
  const handleUpdateTaskStatus = (taskId, newStatus) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t);

      // If completing security review, automatically unblock Okta SSO!
      if (taskId === 'tsk-sec-01' && newStatus === 'Completed') {
        const released = updated.map(t => {
          if (t.id === 'tsk-sso-02') {
            return { ...t, status: 'In Progress' };
          }
          return t;
        });

        showToast(
          'Workflow Automation Cleared',
          'Security Review Completed! Task "Configure Okta Single Sign-On (SSO)" is now unblocked and ready for IT.',
          'success'
        );

        setProject(p => ({ ...p, status: 'In Progress' }));
        setAuditEvents(aud => [
          {
            id: String(Date.now()),
            action: 'WORKFLOW_AUTO_RELEASE',
            actor: 'System Workflow Engine',
            time: 'Just now',
            detail: 'Unblocked Okta SSO task following Security Review completion'
          },
          ...aud
        ]);

        return released;
      }

      showToast('Task Updated', `Task status set to "${newStatus}".`, 'info');
      return updated;
    });
  };

  // Helper to open citation modal from pill trigger
  const handleInspectCitationFromPill = (refString) => {
    let paragraphId = 'p4';
    let quote = 'IT architecture and API endpoint provisioning must strictly wait for Security and Compliance approval before any production credentials are generated.';

    if (refString.includes('#p3')) {
      paragraphId = 'p3';
      quote = 'Note from kickoff: Finance has not received the customer billing contact or purchase order (PO) number yet. Invoicing cannot proceed without this.';
    } else if (refString.includes('#p2')) {
      paragraphId = 'p2';
      quote = 'Single sign-on (SSO) configuration via Okta is strictly mandatory for IT provisioning and company-wide access.';
    } else if (refString.includes('#p5')) {
      paragraphId = 'p5';
      quote = 'Customer Success needs to schedule the Executive Kickoff Call and establish bi-weekly onboarding syncs.';
    }

    setSelectedCitation({
      documentId: 'sales-handoff-01',
      paragraphId,
      quote
    });
  };

  // Helper to render chat message text with interactive citation pills
  const renderMessageWithCitationPills = (text) => {
    const parts = text.split(/(\[Ref: [^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[Ref:')) {
        return (
          <button
            key={i}
            onClick={() => handleInspectCitationFromPill(part)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold border border-blue-800 hover:bg-blue-900 transition-colors cursor-pointer"
            title="Click to view verified source document quote"
          >
            <Quote className="w-2.5 h-2.5" />
            {part}
          </button>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Project Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            to="/projects"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                {project.name}
              </h1>
              <StatusBadge status={project.status} />
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                500 Enterprise Seats
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                Target Launch: <strong className="text-white">{project.targetLaunchDate}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Manager: <strong className="text-slate-200">{project.manager}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Toggle AI Drawer Button */}
        <button
          onClick={() => setIsAIDrawerOpen(!isAIDrawerOpen)}
          className={cn(
            "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
            isAIDrawerOpen
              ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
              : "bg-slate-900 text-slate-300 hover:text-white border border-slate-800"
          )}
        >
          <Bot className="w-4 h-4 text-blue-300" />
          <span>LaunchOps AI Assistant</span>
          <span className="text-[10px] font-mono px-1.5 rounded bg-blue-950 border border-blue-400/30">
            Gemini
          </span>
        </button>
      </div>

      {/* Main Split Layout: Content on Left, AI Drawer on Right */}
      <div className="flex gap-6 items-start">
        {/* Main Workspace Tabs Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
          {/* Tab Bar: Overview, Sources, Plan Review, Task Board, Activity */}
          <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-px">
            {[
              { key: 'overview', label: 'Overview', icon: Layers },
              { key: 'sources', label: `Sources (${sources.length})`, icon: FileText },
              { key: 'plan', label: 'Plan Review', icon: Sparkles, badge: 'AI Verified' },
              { key: 'tasks', label: `Task Board (${tasks.length})`, icon: CheckCircle2 },
              { key: 'activity', label: 'Activity', icon: History }
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer",
                    isSelected
                      ? "border-blue-500 text-blue-400 bg-blue-950/20"
                      : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Critical Path Warning */}
              {project.status === 'Blocked' && (
                <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/40 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-white uppercase tracking-wider">
                        Launch Prerequisite Bottleneck Detected
                      </div>
                      <div className="text-xs text-rose-300 mt-1">
                        Task <strong>"Configure Okta Single Sign-On (SSO)"</strong> is blocked waiting on <strong>"Complete Security & Compliance Review"</strong>. Production API credentials cannot be issued without Security sign-off.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickPrompt('What is blocking launch?')}
                    className="shrink-0 px-3 py-1.5 rounded-lg bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] text-xs font-bold border border-[#EF4444]/40 transition-colors cursor-pointer"
                  >
                    Analyze with AI
                  </button>
                </div>
              )}

              {/* Progress & Milestone Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Launch Velocity</span>
                  <div className="text-2xl font-extrabold text-blue-400">35%</div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden mt-2">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '35%' }}></div>
                  </div>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Launch Date</span>
                  <div className="text-2xl font-extrabold text-white">{project.targetLaunchDate}</div>
                  <div className="text-xs text-slate-500">46 days remaining</div>
                </div>

                <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Department Leads</span>
                  <div className="text-xs text-white font-semibold mt-1">David Kim (IT) • Elena Rostova (Finance)</div>
                  <div className="text-[11px] text-slate-400">Sarah Connor (CS & Project Manager)</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOURCES */}
          {activeTab === 'sources' && (
            <div className="space-y-6">
              {sources.map((doc) => (
                <div key={doc.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-400" />
                        {doc.title}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          v{doc.version}
                        </span>
                      </h3>
                      <div className="text-[11px] text-slate-400 mt-0.5">Author: Alex Rivera (Sales)</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{doc.id}</span>
                  </div>

                  <div className="space-y-2.5">
                    {doc.paragraphs.map((p) => (
                      <div
                        key={p.paragraphId}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3 hover:border-blue-500/40 transition-colors"
                      >
                        <span className="shrink-0 text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-bold border border-blue-800">
                          #{p.paragraphId}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: PLAN REVIEW */}
          {activeTab === 'plan' && (
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/50 space-y-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Missing Information Flagged by AI
                </h4>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-900/40 text-xs text-slate-200">
                  <strong>Finance Department:</strong> Missing customer billing contact and purchase order number from kickoff notes [Ref: sales-handoff-01 #p3].
                </div>
              </div>

              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-blue-500" />
                    AI Proposed Requirements & Task Handoffs
                  </h3>
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Plan Approved by Manager
                  </span>
                </div>

                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div key={task.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <DepartmentBadge department={task.department} />
                            <span className="text-xs font-bold text-white">{task.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400">{task.description}</p>
                        </div>

                        {task.source_references?.[0] && (
                          <button
                            onClick={() => setSelectedCitation(task.source_references[0])}
                            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 bg-blue-950/60 px-2 py-1 rounded-lg border border-blue-800 cursor-pointer"
                          >
                            <Quote className="w-3 h-3" />
                            <span>Cite: #{task.source_references[0].paragraphId}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TASK BOARD */}
          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={tasks}
              onUpdateStatus={handleUpdateTaskStatus}
              onInspectCitation={(citation) => setSelectedCitation(citation)}
            />
          )}

          {/* TAB 5: ACTIVITY */}
          {activeTab === 'activity' && (
            <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                Auditable Workspace Log
              </h3>
              <div className="divide-y divide-slate-800">
                {auditEvents.map((evt) => (
                  <div key={evt.id} className="py-3 flex items-start justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="font-mono text-[10px] text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded border border-blue-900">
                          {evt.action}
                        </span>
                        <span>{evt.actor}</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">{evt.detail}</div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{evt.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Persistent AI Assistant Side Drawer */}
        {isAIDrawerOpen && (
          <aside className="w-full lg:w-96 rounded-2xl glass-card border border-slate-800 flex flex-col h-[700px] shadow-2xl shrink-0 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                    LaunchOps AI Assistant
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono">Grounded Onboarding Intelligence</p>
                </div>
              </div>
              <button
                onClick={() => setIsAIDrawerOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick-Prompt Chips */}
            <div className="p-3 bg-slate-950/40 border-b border-slate-800/80 space-y-1.5">
              <div className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                Quick Prompts:
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => handleQuickPrompt('What is blocking launch?')}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] border border-[#EF4444]/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>"What is blocking launch?"</span>
                  <ChevronRight className="w-3 h-3 text-[#EF4444]" />
                </button>

                <button
                  onClick={() => handleQuickPrompt('Summarize progress for management')}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-blue-950/40 hover:bg-blue-900/40 text-blue-300 border border-blue-800/60 text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>"Summarize progress for management"</span>
                  <ChevronRight className="w-3 h-3 text-blue-400" />
                </button>

                <button
                  onClick={() => handleQuickPrompt('List missing requirements')}
                  className="text-left px-2.5 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 border border-purple-800/60 text-[11px] font-semibold transition-colors cursor-pointer flex items-center justify-between"
                >
                  <span>"List missing requirements"</span>
                  <ChevronRight className="w-3 h-3 text-purple-400" />
                </button>
              </div>
            </div>

            {/* Chat Messages Stream with Inline Citation Pills */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {aiChatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col",
                    msg.role === 'user' ? "items-end" : "items-start"
                  )}
                >
                  <div className="text-[10px] text-slate-500 mb-1">
                    {msg.role === 'user' ? 'You' : 'LaunchOps AI'}
                  </div>
                  <div
                    className={cn(
                      "p-3 rounded-2xl max-w-[95%] leading-relaxed whitespace-pre-wrap",
                      msg.role === 'user'
                        ? "bg-blue-600 text-white rounded-tr-none font-medium"
                        : "bg-slate-950 text-slate-200 border border-slate-800 rounded-tl-none font-sans"
                    )}
                  >
                    {renderMessageWithCitationPills(msg.text)}
                  </div>
                </div>
              ))}

              {isAiLoading && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-blue-400 flex items-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin text-blue-400" />
                  <span>Evaluating task dependencies & sources...</span>
                </div>
              )}
            </div>

            {/* Input Box */}
            <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-800 bg-slate-950">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder="Ask LaunchOps AI..."
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!aiInput.trim()}
                  className="absolute right-1.5 p-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </form>
          </aside>
        )}
      </div>

      {/* Grounded Citation Evidence Modal */}
      <SourceReferenceModal
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        reference={selectedCitation}
        documentTitle="Sales Handoff & Kickoff Notes"
      />
    </div>
  );
}
