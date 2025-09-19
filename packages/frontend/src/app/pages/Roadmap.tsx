/**
 * Roadmap Page
 *
 * Product roadmap and future features for Reporunner
 * Showing completed features, current development, and planned features
 */

import React, { useState } from "react";
import {
  CheckCircle,
  Clock,
  Lightbulb,
  Star,
  ArrowRight,
  Calendar,
  Users,
  Brain,
  Shield,
  Database,
  Cloud,
  Zap,
  Settings,
  Code,
  MessageSquare,
  TrendingUp,
  GitBranch,
  Smartphone,
  Globe,
  BarChart3,
  Lock,
  Webhook,
  FileText,
  Award,
  Eye,
  ThumbsUp,
  ExternalLink,
} from "lucide-react";
import { Header } from "../components/Landing/Header";
import { Footer } from "../components/Landing/Footer";

export const Roadmap: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [timeframe, setTimeframe] = useState("2025");

  const categories = [
    { id: "all", name: "All Features", icon: Globe },
    { id: "ai-ml", name: "AI & ML", icon: Brain },
    { id: "enterprise", name: "Enterprise", icon: Shield },
    { id: "developer", name: "Developer", icon: Code },
    { id: "integrations", name: "Integrations", icon: Webhook },
    { id: "platform", name: "Platform", icon: Settings },
  ];

  const roadmapItems = {
    "2024": [
      {
        id: "hybrid-db",
        title: "Hybrid Database Architecture",
        description: "MongoDB + PostgreSQL with pgvector for AI workloads",
        category: "platform",
        status: "completed",
        quarter: "Q4",
        votes: 234,
        priority: "high",
        impact: "High",
      },
      {
        id: "ai-agents",
        title: "AI Agent System",
        description:
          "Multi-LLM support with OpenAI, Anthropic, and local models",
        category: "ai-ml",
        status: "completed",
        quarter: "Q4",
        votes: 189,
        priority: "high",
        impact: "High",
      },
      {
        id: "enterprise-sso",
        title: "Enterprise SSO",
        description: "SAML, OIDC, and Active Directory integration",
        category: "enterprise",
        status: "completed",
        quarter: "Q3",
        votes: 156,
        priority: "high",
        impact: "Medium",
      },
    ],
    "2025": [
      {
        id: "visual-editor-v2",
        title: "Visual Editor 2.0",
        description:
          "Redesigned workflow editor with improved UX and performance",
        category: "platform",
        status: "in-progress",
        quarter: "Q1",
        votes: 412,
        priority: "high",
        impact: "High",
      },
      {
        id: "vector-search",
        title: "Advanced Vector Search",
        description:
          "Semantic search across workflows, data, and documentation",
        category: "ai-ml",
        status: "in-progress",
        quarter: "Q1",
        votes: 298,
        priority: "high",
        impact: "Medium",
      },
      {
        id: "mobile-app",
        title: "Mobile Application",
        description: "Native iOS and Android apps for workflow monitoring",
        category: "platform",
        status: "planned",
        quarter: "Q2",
        votes: 356,
        priority: "medium",
        impact: "Medium",
      },
      {
        id: "workflow-marketplace",
        title: "Workflow Marketplace",
        description: "Community-driven marketplace for workflow templates",
        category: "platform",
        status: "planned",
        quarter: "Q2",
        votes: 278,
        priority: "medium",
        impact: "High",
      },
      {
        id: "advanced-analytics",
        title: "Advanced Analytics",
        description:
          "Predictive analytics and performance optimization insights",
        category: "enterprise",
        status: "planned",
        quarter: "Q3",
        votes: 234,
        priority: "medium",
        impact: "Medium",
      },
      {
        id: "multimodal-ai",
        title: "Multimodal AI Support",
        description: "Vision, audio, and document processing with AI models",
        category: "ai-ml",
        status: "planned",
        quarter: "Q3",
        votes: 189,
        priority: "high",
        impact: "High",
      },
      {
        id: "workflow-version-control",
        title: "Workflow Version Control",
        description: "Git-like version control for workflows with branching",
        category: "developer",
        status: "planned",
        quarter: "Q4",
        votes: 167,
        priority: "medium",
        impact: "Medium",
      },
      {
        id: "kubernetes-operator",
        title: "Kubernetes Operator",
        description: "Native Kubernetes operator for advanced deployments",
        category: "enterprise",
        status: "planned",
        quarter: "Q4",
        votes: 143,
        priority: "low",
        impact: "Medium",
      },
    ],
    "2026": [
      {
        id: "ai-workflow-generation",
        title: "AI Workflow Generation",
        description:
          "Generate complete workflows from natural language descriptions",
        category: "ai-ml",
        status: "research",
        quarter: "Q1",
        votes: 445,
        priority: "high",
        impact: "High",
      },
      {
        id: "federated-learning",
        title: "Federated Learning Platform",
        description:
          "Distributed ML training across multiple Reporunner instances",
        category: "ai-ml",
        status: "research",
        quarter: "Q2",
        votes: 234,
        priority: "low",
        impact: "High",
      },
      {
        id: "quantum-computing",
        title: "Quantum Computing Integration",
        description:
          "Integration with quantum computing platforms for optimization",
        category: "integrations",
        status: "research",
        quarter: "Q3",
        votes: 189,
        priority: "low",
        impact: "Low",
      },
    ],
  };

  const statusConfig = {
    completed: {
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-100",
      label: "Completed",
    },
    "in-progress": {
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
      label: "In Progress",
    },
    planned: {
      icon: Calendar,
      color: "text-purple-600",
      bg: "bg-purple-100",
      label: "Planned",
    },
    research: {
      icon: Lightbulb,
      color: "text-orange-600",
      bg: "bg-orange-100",
      label: "Research",
    },
  };

  const priorityConfig = {
    high: { color: "text-red-600", bg: "bg-red-100" },
    medium: { color: "text-yellow-600", bg: "bg-yellow-100" },
    low: { color: "text-gray-600", bg: "bg-gray-100" },
  };

  const filteredItems =
    roadmapItems[timeframe as keyof typeof roadmapItems]?.filter(
      (item) =>
        selectedCategory === "all" || item.category === selectedCategory,
    ) || [];

  const stats = {
    completed: Object.values(roadmapItems)
      .flat()
      .filter((item) => item.status === "completed").length,
    inProgress: Object.values(roadmapItems)
      .flat()
      .filter((item) => item.status === "in-progress").length,
    planned: Object.values(roadmapItems)
      .flat()
      .filter((item) => item.status === "planned").length,
    totalVotes: Object.values(roadmapItems)
      .flat()
      .reduce((sum, item) => sum + item.votes, 0),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <Header />
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Product{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Roadmap
              </span>
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              See what's coming next for Reporunner. Vote on features, track
              progress, and help shape the future of workflow automation.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg text-lg hover:scale-105 transition-transform flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Request Feature
              </button>
              <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg text-lg border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2">
                <ExternalLink className="w-5 h-5" />
                GitHub Issues
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-300 mb-2">
                  {stats.completed}
                </div>
                <div className="text-sm text-slate-300">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-300 mb-2">
                  {stats.inProgress}
                </div>
                <div className="text-sm text-slate-300">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-300 mb-2">
                  {stats.planned}
                </div>
                <div className="text-sm text-slate-300">Planned</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-300 mb-2">
                  {stats.totalVotes}
                </div>
                <div className="text-sm text-slate-300">Total Votes</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>

            {/* Timeframe Filter */}
            <div className="flex items-center gap-2">
              <span className="text-gray-700 font-medium">Timeframe:</span>
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024">2024</option>
                <option value="2025">2025</option>
                <option value="2026">2026+</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Items */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            {filteredItems.length > 0 ? (
              <div className="space-y-6">
                {filteredItems.map((item, index) => {
                  const statusInfo =
                    statusConfig[item.status as keyof typeof statusConfig];
                  const priorityInfo =
                    priorityConfig[
                      item.priority as keyof typeof priorityConfig
                    ];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-1">
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`p-2 rounded-lg ${statusInfo.bg}`}>
                              <StatusIcon
                                className={`w-6 h-6 ${statusInfo.color}`}
                              />
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-gray-900">
                                  {item.title}
                                </h3>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${statusInfo.bg} ${statusInfo.color}`}
                                >
                                  {statusInfo.label}
                                </span>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${priorityInfo.bg} ${priorityInfo.color}`}
                                >
                                  {item.priority} priority
                                </span>
                              </div>

                              <p className="text-gray-600 mb-3">
                                {item.description}
                              </p>

                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {item.quarter} {timeframe}
                                </span>
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-4 h-4" />
                                  {item.impact} Impact
                                </span>
                                <span className="capitalize">
                                  {item.category.replace("-", " & ")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Voting */}
                          <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3">
                            <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors">
                              <ThumbsUp className="w-5 h-5" />
                              <span className="font-medium">{item.votes}</span>
                            </button>
                          </div>

                          {/* View Details */}
                          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            <Eye className="w-4 h-4" />
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No features found
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your category or timeframe filter.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Request Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Help Shape Our Roadmap
                </h2>
                <p className="text-xl text-gray-600">
                  Your feedback drives our development. Vote on existing
                  features or request new ones.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-blue-100 p-3 rounded-lg w-fit mx-auto mb-4">
                    <ThumbsUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Vote on Features
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Help us prioritize features by voting on what matters most
                    to you
                  </p>
                </div>

                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-green-100 p-3 rounded-lg w-fit mx-auto mb-4">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Request Features
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Submit new feature ideas and discuss them with the community
                  </p>
                </div>

                <div className="text-center p-6 border border-gray-200 rounded-xl">
                  <div className="bg-purple-100 p-3 rounded-lg w-fit mx-auto mb-4">
                    <Code className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Contribute
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Join our open-source community and contribute to development
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 justify-center">
                    <MessageSquare className="w-5 h-5" />
                    Request Feature
                  </button>
                  <button className="px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 justify-center">
                    <ExternalLink className="w-5 h-5" />
                    Join Discussion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quarterly Highlights */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Recent Highlights
            </h2>
            <p className="text-xl text-gray-600">
              Major features and improvements delivered in recent quarters
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmapItems["2024"]
              .filter((item) => item.status === "completed")
              .slice(0, 3)
              .map((item, index) => {
                const categoryIcon = {
                  "ai-ml": Brain,
                  enterprise: Shield,
                  platform: Settings,
                  developer: Code,
                  integrations: Webhook,
                };
                const Icon =
                  categoryIcon[item.category as keyof typeof categoryIcon] ||
                  Settings;

                return (
                  <div
                    key={item.id}
                    className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-green-100 p-2 rounded-lg">
                        <Icon className="w-6 h-6 text-green-600" />
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-600 font-medium text-sm">
                        Completed
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        {item.quarter} 2024
                      </span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium">
                          {item.votes} votes
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Be Part of Our Journey</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join our community of developers and enterprises shaping the future
            of workflow automation.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg text-lg hover:bg-gray-100 transition-colors flex items-center gap-2 justify-center">
              <MessageSquare className="w-5 h-5" />
              Join Community
            </button>
            <button className="px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-lg text-lg hover:bg-white/10 transition-colors flex items-center gap-2 justify-center">
              <ExternalLink className="w-5 h-5" />
              Follow on GitHub
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Roadmap;
