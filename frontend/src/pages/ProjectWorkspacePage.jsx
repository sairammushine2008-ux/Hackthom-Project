import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import {
  projectsApi,
  sourcesApi,
  aiApi,
  tasksApi,
  commentsApi,
  auditApi,
  authApi
} from '../services/api';
import { StatusBadge, DepartmentBadge } from '../components/StatusBadge';
import { AIAssistantDrawer } from '../components/AIAssistantDrawer';
import { SourceReferenceModal } from '../components/SourceReferenceModal';
import {
  Calendar,
  Sparkles,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  Bot,
  Upload,
  Plus,
  Send,
  MessageSquare,
  Shield,
  Layers,
  History,
  FileCheck,
  Check,
  User,
  Quote,
  ExternalLink
} from 'lucide-react';

export function ProjectWorkspacePage() {
  const { id: projectId } = useParams();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // State
  const [project, setProject] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, sources, plan, tasks, activity
  const [sources, setSources] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Plan Generation & Review State
  const [latestProposal, setLatestProposal] = useState(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [reviewedTasks, setReviewedTasks] = useState([]);
  const [isApproving, setIsApproving] = useState(false);

  // New Source Document State
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Comments State
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Task Filter
  const [taskDeptFilter, setTaskDeptFilter] = useState('All');

  // Modals & Drawers
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState(null);

  // Initial Data Fetching
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [projRes, sourcesRes, tasksRes, commentsRes, auditRes, propRes, usersRes] = await Promise.all([
        projectsApi.getById(projectId),
        sourcesApi.getSources(projectId),
        tasksApi.getProjectTasks(projectId),
        commentsApi.getComments(projectId),
        auditApi.getAuditEvents(projectId),
        aiApi.getLatestProposal(projectId).catch(() => ({ data: { proposal: null } })),
        authApi.getUsers().catch(() => ({ data: [] }))
      ]);

      setProject(projRes.data);
      setSources(sourcesRes.data);
      setTasks(tasksRes.data);
      setComments(commentsRes.data);
      setAuditEvents(auditRes.data);
      setUsersList(usersRes.data || []);

      if (propRes.data?.proposal) {
        setLatestProposal(propRes.data.proposal);
        const structured = propRes.data.proposal.structured_data;
        if (structured?.proposedTasks) {
          setReviewedTasks(structured.proposedTasks.map(t => ({
            ...t,
            ownerId: t.suggestedOwnerId || '',
            dueDate: t.dueDate || '',
            prerequisiteTitles: t.dependencies || []
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching workspace data:', err);
      showToast('Error', err.message || 'Failed to load project workspace', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [projectId]);

  // Handle Source Upload / Paste
  const handleAddSourceDoc = async (e) => {
    e.preventDefault();
    if (!newDocTitle.trim() || !newDocContent.trim()) return;

    setIsUploadingDoc(true);
    try {
      await sourcesApi.createSource(projectId, {
        title: newDocTitle,
        content: newDocContent
      });
      setNewDocTitle('');
      setNewDocContent('');
      showToast('Document Added', 'Handoff document successfully added to project sources.', 'success');
      await fetchAllData();
    } catch (err) {
      showToast('Upload Error', err.message, 'error');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  // Handle .txt file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!newDocTitle) {
      setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewDocContent(event.target.result);
    };
    reader.readAsText(file);
  };

  // Handle AI Plan Generation
  const handleGeneratePlan = async () => {
    if (sources.length === 0) {
      showToast('Notice', 'Please upload or paste sales handoff notes before generating a plan.', 'error');
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const res = await aiApi.generatePlan(projectId);
      const plan = res.data.plan;
      setLatestProposal({
        id: res.data.proposalId,
        status: 'Pending',
        structured_data: plan
      });

      setReviewedTasks(plan.proposedTasks.map(t => ({
        ...t,
        ownerId: t.suggestedOwnerId || '',
        dueDate: t.dueDate || '',
        prerequisiteTitles: t.dependencies || []
      })));

      setActiveTab('plan');
      showToast('AI Plan Generated', `Generated ${plan.proposedTasks.length} proposed tasks with source references.`, 'success');
      // Refresh audit logs
      const auditRes = await auditApi.getAuditEvents(projectId);
      setAuditEvents(auditRes.data);
    } catch (err) {
      showToast('AI Error', err.message, 'error');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Handle Plan Approval (Manager or Admin)
  const handleApprovePlan = async () => {
    if (user.role === 'Member') {
      showToast('Permission Denied', 'Only Managers or Administrators can approve and deploy onboarding plans.', 'error');
      return;
    }

    setIsApproving(true);
    try {
      const payload = {
        proposalId: latestProposal?.id,
        tasks: reviewedTasks.map(t => ({
          title: t.title,
          description: t.description || '',
          department: t.department,
          ownerId: t.ownerId || null,
          dueDate: t.dueDate || null,
          status: 'Not Started',
          sourceReferences: t.sourceReferences || [],
          prerequisiteTitles: t.prerequisiteTitles || []
        }))
      };

      await aiApi.approvePlan(projectId, payload);
      showToast('Plan Approved', 'Operational tasks created and deployed to the departmental task board!', 'success');
      await fetchAllData();
      setActiveTab('tasks');
    } catch (err) {
      showToast('Approval Error', err.message, 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Handle Task Status Toggle with Workflow Automation Trigger
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await tasksApi.updateTask(taskId, { status: newStatus });
      const { releasedTasks, notification } = res.data;

      if (notification) {
        showToast('Workflow Automation Cleared', notification, 'success');
      } else {
        showToast('Task Updated', `Task status set to "${newStatus}".`, 'info');
      }

      await fetchAllData();
    } catch (err) {
      showToast('Update Failed', err.message, 'error');
    }
  };

  // Handle Comment Submission
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await commentsApi.createComment(projectId, { content: commentText });
      setCommentText('');
      const commentsRes = await commentsApi.getComments(projectId);
      setComments(commentsRes.data);
      showToast('Comment Posted', 'Comment shared with workspace team.', 'info');
    } catch (err) {
      showToast('Error', err.message, 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (loading || !project) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 space-y-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <div className="text-sm font-semibold">Loading Customer Onboarding Workspace...</div>
      </div>
    );
  }

  const isManagerOrAdmin = user?.role === 'Manager' || user?.role === 'Administrator';
  const filteredTasks = taskDeptFilter === 'All' ? tasks : tasks.filter(t => t.department === taskDeptFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
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
              <h1 className="text-2xl font-extrabold tracking-tight text-white">
                {project.customer_name}
              </h1>
              <StatusBadge status={project.status} />
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Target Launch: <strong className="text-slate-200">{project.target_launch_date}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                Manager: <strong className="text-slate-200">{project.manager?.name || 'Unassigned'}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* AI Copilot Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAIDrawerOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>LaunchOps AI Copilot</span>
            <span className="px-1.5 py-0.2 rounded bg-indigo-900/60 text-[10px] font-mono border border-indigo-400/30">
              Gemini
            </span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 overflow-x-auto pb-px">
        {[
          { key: 'overview', label: 'Overview', icon: Layers },
          { key: 'sources', label: `Sources (${sources.length})`, icon: FileText },
          { key: 'plan', label: 'Plan Review', icon: Sparkles, badge: latestProposal?.status === 'Pending' ? 'Review Needed' : null },
          { key: 'tasks', label: `Tasks & Board (${tasks.length})`, icon: CheckCircle2 },
          { key: 'activity', label: 'Activity & Audit', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 text-indigo-400 bg-indigo-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 animate-pulse font-mono">
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
          {/* Health Alert if Blocked */}
          {project.status === 'Blocked' && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-white uppercase tracking-wider">
                    Critical Path Blocked
                  </div>
                  <div className="text-xs text-rose-300 mt-1">
                    Technical configuration is blocked pending security approval. Single sign-on and API provisioning cannot proceed without compliance sign-off.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsAIDrawerOpen(true)}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-900 text-white text-xs font-semibold border border-rose-700 transition-colors cursor-pointer"
              >
                Explain Blocker with AI
              </button>
            </div>
          )}

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Tasks</div>
              <div className="text-2xl font-extrabold text-white mt-2">{tasks.length}</div>
              <div className="text-xs text-slate-400 mt-1">
                {tasks.filter(t => t.status === 'Completed').length} completed • {tasks.filter(t => t.status === 'Blocked').length} blocked
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completion Velocity</div>
              <div className="text-2xl font-extrabold text-indigo-400 mt-2">
                {project.stats?.progressPercent || 0}%
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-800 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${project.stats?.progressPercent || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-slate-800">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Launch Schedule</div>
              <div className="text-2xl font-extrabold text-white mt-2">{project.target_launch_date}</div>
              <div className="text-xs text-emerald-400 mt-1">Onboarding milestones active</div>
            </div>
          </div>

          {/* User Journey Roadmap */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              Onboarding Workflow Journey
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Step 1: Ingestion</span>
                <div className="text-xs font-semibold text-white">Sales Handoff Added</div>
                <div className="text-[11px] text-slate-400">Sales notes and requirements stored in shared workspace.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-800/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Step 2: AI Plan</span>
                <div className="text-xs font-semibold text-white">Gemini Plan Generation</div>
                <div className="text-[11px] text-slate-400">AI extracts requirements and links citations to source paragraphs.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-800/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold">Step 3: Approval</span>
                <div className="text-xs font-semibold text-white">Manager Review</div>
                <div className="text-[11px] text-slate-400">Manager audits assignments, dates, and confirms deployment.</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Step 4: Automation</span>
                <div className="text-xs font-semibold text-white">Dependency Release</div>
                <div className="text-[11px] text-slate-400">Completing security approval auto-releases IT SSO configuration!</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SOURCES */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upload / Paste Form */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4 lg:col-span-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-indigo-400" />
              Add Handoff Document
            </h3>
            <p className="text-xs text-slate-400">
              Paste sales notes, meeting transcripts, or upload `.txt` files.
            </p>

            <form onSubmit={handleAddSourceDoc} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sales Kickoff Notes"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Upload .txt File (Optional)
                </label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/20 file:text-indigo-300 hover:file:bg-indigo-600/30 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Handoff Text Content
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste contractual notes, security requirements, and billing details..."
                  value={newDocContent}
                  onChange={(e) => setNewDocContent(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-sans leading-relaxed focus:outline-none focus:border-indigo-500"
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isUploadingDoc}
                className="w-full py-2 px-4 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUploadingDoc ? 'Saving Document...' : 'Save Source Document'}
              </button>
            </form>
          </div>

          {/* Stored Documents View with Paragraphs */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Stored Project Documents ({sources.length})
              </h3>

              {sources.length > 0 && (
                <button
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  {isGeneratingPlan ? 'Generating Plan with AI...' : 'Generate Onboarding Plan'}
                </button>
              )}
            </div>

            {sources.length === 0 ? (
              <div className="p-12 text-center glass-card rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No handoff documents added yet. Use the form on the left to paste Acme's kickoff notes.
              </div>
            ) : (
              sources.map((doc) => (
                <div key={doc.id} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {doc.title}
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          v{doc.version}
                        </span>
                      </h4>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Author: {doc.author_name || 'Sales Rep'} • Added: {new Date(doc.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{doc.id}</span>
                  </div>

                  {/* Paragraph-by-paragraph breakdown */}
                  <div className="space-y-2.5">
                    {doc.paragraphs?.map((p, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-200 flex items-start gap-3 hover:border-indigo-500/40 transition-colors"
                      >
                        <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                          {p.paragraphId}
                        </span>
                        <p className="leading-relaxed font-sans">{p.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PLAN REVIEW */}
      {activeTab === 'plan' && (
        <div className="space-y-6">
          {!latestProposal ? (
            <div className="py-16 text-center glass-card rounded-2xl border border-slate-800 p-8 space-y-4">
              <Sparkles className="w-10 h-10 text-indigo-400 mx-auto" />
              <div className="text-base font-bold text-white">No AI Plan Drafted Yet</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Generate an AI onboarding plan from your source notes. Gemini will extract requirements, propose departmental tasks, flag missing information, and ground each item in document quotes.
              </p>
              <button
                onClick={handleGeneratePlan}
                disabled={isGeneratingPlan || sources.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {isGeneratingPlan ? 'Generating Plan...' : 'Generate Onboarding Plan Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Bar with Approval Button */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Proposal Status:
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      latestProposal.status === 'Approved'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border-amber-800'
                    }`}>
                      {latestProposal.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    AI-Extracted Customer Onboarding Plan
                  </h3>
                  <div className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    {latestProposal.structured_data?.summary}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {latestProposal.status === 'Approved' ? (
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-4 py-2 rounded-xl">
                      <Check className="w-4 h-4" />
                      Plan Approved & Deployed to Board
                    </div>
                  ) : isManagerOrAdmin ? (
                    <button
                      onClick={handleApprovePlan}
                      disabled={isApproving}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {isApproving ? 'Approving & Deploying...' : 'Approve Plan & Deploy to Board'}
                    </button>
                  ) : (
                    <div className="text-xs text-slate-400 italic">
                      Review in progress. Awaiting Manager / Admin sign-off.
                    </div>
                  )}
                </div>
              </div>

              {/* Missing Information Alerts */}
              {latestProposal.structured_data?.missingInformationAlerts?.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-900/50 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Missing Information Detected by AI
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {latestProposal.structured_data.missingInformationAlerts.map((alert, aIdx) => (
                      <div key={aIdx} className="p-3 rounded-xl bg-slate-950/80 border border-amber-900/40 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <DepartmentBadge department={alert.department} />
                          <span className="text-[10px] text-amber-400/80 font-semibold">Action Required</span>
                        </div>
                        <div className="font-semibold text-white mt-1">{alert.issue}</div>
                        <div className="text-slate-400 text-[11px]">{alert.impact}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Proposed Tasks Editable Review Table */}
              <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-400" />
                    Proposed Departmental Tasks ({reviewedTasks.length})
                  </h4>
                  <span className="text-xs text-slate-400">
                    Managers can edit assignments and due dates before approving.
                  </span>
                </div>

                <div className="space-y-3">
                  {reviewedTasks.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <DepartmentBadge department={t.department} />
                            <span className="text-sm font-bold text-white">{t.title}</span>
                          </div>
                          <p className="text-xs text-slate-400">{t.description}</p>
                        </div>

                        {/* Citation Badge */}
                        {t.sourceReferences?.length > 0 && (
                          <button
                            onClick={() => setSelectedCitation(t.sourceReferences[0])}
                            className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 text-xs font-semibold border border-indigo-800/80 transition-colors cursor-pointer"
                          >
                            <Quote className="w-3.5 h-3.5" />
                            <span>Cite: {t.sourceReferences[0].paragraphId}</span>
                          </button>
                        )}
                      </div>

                      {/* Dependencies and Editing Controls */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">Prerequisites:</span>
                          {t.prerequisiteTitles?.length > 0 ? (
                            t.prerequisiteTitles.map((pTitle, pIdx) => (
                              <span key={pIdx} className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/60 text-[11px] font-medium">
                                Blocked by: {pTitle}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">None (Ready immediately)</span>
                          )}
                        </div>

                        {/* Manager Assignee & Date Selectors */}
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Owner:</span>
                            <select
                              value={t.ownerId}
                              disabled={latestProposal.status === 'Approved'}
                              onChange={(e) => {
                                const updated = [...reviewedTasks];
                                updated[idx].ownerId = e.target.value;
                                setReviewedTasks(updated);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            >
                              <option value="">Unassigned</option>
                              {usersList.map(u => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-400">Due:</span>
                            <input
                              type="date"
                              value={t.dueDate}
                              disabled={latestProposal.status === 'Approved'}
                              onChange={(e) => {
                                const updated = [...reviewedTasks];
                                updated[idx].dueDate = e.target.value;
                                setReviewedTasks(updated);
                              }}
                              className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: TASKS & BOARD */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">
          {/* Department Filter Pills */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {['All', 'IT', 'Finance', 'Customer Success', 'Security', 'Sales'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setTaskDeptFilter(dept)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    taskDeptFilter === dept
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            <div className="text-xs text-slate-400">
              Showing {filteredTasks.length} task(s)
            </div>
          </div>

          {/* Kanban / Categorized Task Columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['Not Started', 'In Progress', 'Blocked', 'Completed'].map((columnStatus) => {
              const colTasks = filteredTasks.filter(t => t.status === columnStatus);
              return (
                <div key={columnStatus} className="glass-card rounded-2xl p-4 border border-slate-800 flex flex-col space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        columnStatus === 'Completed' ? 'bg-emerald-400' :
                        columnStatus === 'Blocked' ? 'bg-rose-400 animate-pulse' :
                        columnStatus === 'In Progress' ? 'bg-indigo-400' : 'bg-slate-400'
                      }`}></span>
                      {columnStatus}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1">
                    {colTasks.length === 0 ? (
                      <div className="py-8 text-center text-slate-600 text-xs italic">
                        No tasks
                      </div>
                    ) : (
                      colTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`p-3.5 rounded-xl bg-slate-900/90 border transition-all space-y-2.5 ${
                            task.status === 'Blocked'
                              ? 'border-rose-900/70 hover:border-rose-700'
                              : 'border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <DepartmentBadge department={task.department} />
                            {task.source_references?.length > 0 && (
                              <button
                                onClick={() => setSelectedCitation(task.source_references[0])}
                                className="text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                                title="Inspect Source Citation"
                              >
                                <Quote className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="text-xs font-bold text-white leading-snug">
                            {task.title}
                          </div>

                          {task.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-2">
                              {task.description}
                            </div>
                          )}

                          {/* Blocked dependency pill */}
                          {task.dependencies?.length > 0 && task.status === 'Blocked' && (
                            <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-800/60 text-[10px] text-rose-300 space-y-0.5">
                              <div className="font-semibold flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                Blocked by prerequisite:
                              </div>
                              {task.dependencies.map(d => (
                                <div key={d.prerequisite_task_id} className="text-rose-200 truncate">
                                  • {d.prerequisite_title} ({d.prerequisite_status})
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                            <span>Owner: <strong className="text-slate-300">{task.owner_name || 'Unassigned'}</strong></span>
                            {task.due_date && <span>Due: {task.due_date}</span>}
                          </div>

                          {/* Action button to change status */}
                          <div className="pt-1 flex items-center gap-1.5 justify-end">
                            {task.status !== 'Completed' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'Completed')}
                                className="px-2.5 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                Mark Complete
                              </button>
                            )}

                            {task.status === 'Not Started' && (
                              <button
                                onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                                className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-[11px] font-semibold border border-indigo-500/30 transition-colors cursor-pointer"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cross-Department Discussion Comments */}
          <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Cross-Department Discussion & Blocker Resolutions ({comments.length})
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {comments.length === 0 ? (
                <div className="text-xs text-slate-500 italic">No comments posted yet.</div>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{c.author_name}</span>
                        <DepartmentBadge department={c.author_department || 'Operations'} />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-slate-300">{c.content}</div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Discuss missing information, compliance sign-offs, or updates..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isSubmittingComment || !commentText.trim()}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Post
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: ACTIVITY & AUDIT */}
      {activeTab === 'activity' && (
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Auditable Event Trail ({auditEvents.length})
            </h3>
            <span className="text-xs text-slate-400">Tamper-evident operational log</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {auditEvents.map((evt) => (
              <div key={evt.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold">
                      {evt.action}
                    </span>
                    <span className="font-bold text-white">{evt.actor_name || 'Workflow System'}</span>
                  </div>
                  <div className="text-slate-400 text-[11px]">
                    Target: {evt.target_type} ({evt.target_id})
                  </div>
                  {evt.details && (
                    <pre className="text-[10px] font-mono text-slate-500 bg-slate-950 p-2 rounded-lg max-w-xl overflow-x-auto">
                      {typeof evt.details === 'string' ? evt.details : JSON.stringify(evt.details, null, 2)}
                    </pre>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 shrink-0 font-mono">
                  {new Date(evt.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Assistant Drawer */}
      <AIAssistantDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        projectId={projectId}
        customerName={project.customer_name}
      />

      {/* Source Reference Evidence Modal */}
      <SourceReferenceModal
        isOpen={!!selectedCitation}
        onClose={() => setSelectedCitation(null)}
        reference={selectedCitation}
        documentTitle={sources.find(s => s.id === selectedCitation?.documentId)?.title}
      />
    </div>
  );
}
