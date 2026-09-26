import React, { useState, useEffect, useRef } from "react";
import { Helmet } from "react-helmet-async";
import {
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  TriangleAlert,
  Download,
  RotateCcw,
  ArrowDown,
  FileText,
  Calculator,
  Scale,
  Calendar,
  Layers,
  StopCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { createGroqClient, GROQ_MODEL, mockTaxPlainStream, getGroqApiKey } from "@/src/lib/groq";
import { MODULE_E_SYSTEM_PROMPT, buildModuleEPrompt } from "@/src/lib/taxPrompts";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface PromptCategory {
  id: string;
  label: string;
  icon: React.ElementType;
  prompts: string[];
}

const CATEGORIZED_PROMPTS: PromptCategory[] = [
  {
    id: "gst",
    label: "GST & Circulars",
    icon: Scale,
    prompts: [
      "What is Rule 88C in GST for GSTR-1 vs 3B liability mismatch?",
      "How to claim ITC on capital goods under Rule 43?",
      "Can a composition tax dealer issue a tax invoice or claim ITC?",
      "What is the Rule 86B 1% mandatory cash payment rule?",
    ],
  },
  {
    id: "itr",
    label: "Income Tax & ITR",
    icon: Calculator,
    prompts: [
      "Explain Section 115BAC new tax regime slabs for AY 2025–26",
      "How does 50% presumptive profit compute under Section 44ADA?",
      "What are Section 80D health insurance limits for senior citizen parents?",
      "Section 24(b) home loan interest deduction limits for self-occupied property",
    ],
  },
  {
    id: "tds",
    label: "TDS & TCS Rules",
    icon: Layers,
    prompts: [
      "TDS rate on sale of immovable property under Section 194-IA",
      "Difference between Section 194C contractor and Section 194J professional TDS",
      "Section 194Q TDS on purchase of goods exceeding ₹50 Lakhs",
      "TCS applicability under Section 206C(1H) on sale of goods",
    ],
  },
  {
    id: "notices",
    label: "Notices & Compliance",
    icon: FileText,
    prompts: [
      "How to respond to DRC-01B intimation for output tax variance?",
      "What is the penalty for late filing GSTR-3B under Section 50?",
      "Differences between Section 73 (no fraud) and Section 74 (fraud) notices",
      "How to file Letter of Undertaking (LUT) for zero-rated export of services?",
    ],
  },
];

const MAX_CHARS = 1000;

/** Three animated dots while AI is thinking */
function TypingDots() {
  return (
    <span className="inline-flex items-center gap-[3px] h-4">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block w-1.5 h-1.5 rounded-full bg-gray-600"
          style={{ animation: `tp-bounce 1.1s ease-in-out ${i * 0.18}s infinite` }}
        />
      ))}
      <style>{`
        @keyframes tp-bounce {
          0%,80%,100% { transform:translateY(0);   opacity:.35; }
          40%          { transform:translateY(-4px); opacity:1;  }
        }
      `}</style>
    </span>
  );
}

export default function TaxChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("gst");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<boolean>(false);

  // Restore history
  useEffect(() => {
    try {
      const stored = localStorage.getItem("taxplain_chat_history");
      if (stored) setMessages(JSON.parse(stored));
    } catch {}
  }, []);

  // Auto-scroll to bottom on message updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Track scroll position to show "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isFarFromBottom = scrollHeight - scrollTop - clientHeight > 150;
    setShowScrollBottom(isFarFromBottom);
  };

  // Persist messages
  const saveMessages = (msgs: ChatMessage[]) => {
    setMessages(msgs);
    try {
      localStorage.setItem("taxplain_chat_history", JSON.stringify(msgs.slice(-30)));
    } catch {}
  };

  const handleClearChat = () => {
    saveMessages([]);
    localStorage.removeItem("taxplain_chat_history");
    toast.success("Chat history cleared");
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    let exportText = `TAXPLAIN AI ADVISORY SESSION CHAT LOG\nGenerated: ${new Date().toLocaleString("en-IN")}\n=======================================================\n\n`;
    
    messages.forEach((msg) => {
      const sender = msg.role === "user" ? "YOU" : "TAXPLAIN AI ASSISTANT";
      exportText += `[${msg.timestamp}] ${sender}:\n${msg.content}\n\n-------------------------------------------------------\n\n`;
    });

    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TaxPlain_Chat_Session_${new Date().toISOString().split("T")[0]}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Chat history exported to text file");
  };

  // Send message
  const sendMessage = async (userText: string) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    abortControllerRef.current = false;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const withUser = [...messages, userMsg];
    saveMessages(withUser);
    setInput("");
    setIsLoading(true);
    setTimeout(() => inputRef.current?.focus(), 60);

    const botId = crypto.randomUUID();
    const botPlaceholder: ChatMessage = {
      id: botId,
      role: "assistant",
      content: "",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...withUser, botPlaceholder]);

    const history = messages.slice(-6).map((m) => ({ role: m.role, content: m.content }));
    const prompt = buildModuleEPrompt(history, trimmed);

    try {
      const apiKey = getGroqApiKey();
      if (!apiKey) {
        const gen = mockTaxPlainStream(trimmed, "chat");
        let acc = "";
        for await (const chunk of gen) {
          if (abortControllerRef.current) break;
          acc += chunk;
          setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, content: acc } : m)));
        }
        setIsLoading(false);
        saveMessages(withUser.concat({ ...botPlaceholder, content: acc }));
        return;
      }

      const groq = createGroqClient();
      const stream = await groq.chat.completions.create({
        model: GROQ_MODEL,
        promptType: "chat",
        messages: [
          { role: "system", content: MODULE_E_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        stream: true,
        temperature: 0.3,
      });
      let acc = "";
      for await (const chunk of stream) {
        if (abortControllerRef.current) break;
        acc += chunk.choices[0]?.delta?.content || "";
        setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, content: acc } : m)));
      }
      setIsLoading(false);
      saveMessages(withUser.concat({ ...botPlaceholder, content: acc }));
    } catch (err: any) {
      setIsLoading(false);
      if (err?.status === 429) {
        toast.error("Rate limit reached. Please wait 30 seconds.");
      } else {
        toast.error("AI service error. Loading fallback response.");
        try {
          const gen = mockTaxPlainStream(trimmed, "chat");
          let acc = "";
          for await (const chunk of gen) {
            if (abortControllerRef.current) break;
            acc += chunk;
            setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, content: acc } : m)));
          }
          saveMessages(withUser.concat({ ...botPlaceholder, content: acc }));
        } catch {}
      }
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      // Remove last assistant message
      const pruned = messages.filter((m, i) => i < messages.length - 1 || m.role !== "assistant");
      saveMessages(pruned);
      sendMessage(lastUserMsg.content);
    }
  };

  const handleStopGenerating = () => {
    abortControllerRef.current = true;
    setIsLoading(false);
    toast.info("Stopped generating response");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length > MAX_CHARS) return;
    setInput(val);
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 140) + "px";
  };

  const isEmpty = messages.length === 0;
  const activePromptGroup = CATEGORIZED_PROMPTS.find((c) => c.id === activeCategory) || CATEGORIZED_PROMPTS[0];

  return (
    <>
      <Helmet>
        <title>Indian Tax AI Assistant — TaxPlain</title>
        <meta name="description" content="Ask any Indian tax or GST question and get instant answers from our AI trained on Indian tax law." />
        <link rel="canonical" href="https://taxplain.in/app/chat" />
        <meta property="og:title" content="Indian Tax AI Assistant — TaxPlain" />
        <meta property="og:description" content="Ask any Indian tax or GST question and get instant answers from our AI trained on Indian tax law." />
        <meta property="og:image" content="https://taxplain.in/og-image.jpg" />
        <meta property="og:image:alt" content="TaxPlain — GST Plain English. Finally." />
        <meta property="og:url" content="https://taxplain.in/app/chat" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@taxplain_in" />
        <meta name="twitter:title" content="Indian Tax AI Assistant — TaxPlain" />
        <meta name="twitter:description" content="Ask any Indian tax or GST question and get instant answers from our AI trained on Indian tax law." />
        <meta name="twitter:image" content="https://taxplain.in/og-image.jpg" />
        <meta name="twitter:image:alt" content="TaxPlain — GST Plain English. Finally." />
      </Helmet>

      <div className="flex flex-col h-full min-h-0 bg-white overflow-hidden relative flex-1">

        {/* ── HEADER ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200 bg-white/90 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="h-9 w-9 rounded-md bg-[#111111] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Bot className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-[#111111] tracking-tight">Tax Q&amp;A Assistant</h1>
                {/* Live status pill */}
                <span className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-mono bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Online
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">CGST · SGST · IGST · Income Tax · TDS</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model badge */}
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 font-mono bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              NVIDIA DeepSeek V4
            </span>

            {/* Export log */}
            {messages.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportChat}
                className="h-8 text-xs text-gray-700 border-gray-200 hover:bg-gray-50 cursor-pointer hidden sm:flex items-center gap-1"
                title="Export conversation log"
              >
                <Download className="h-3.5 w-3.5 text-gray-500" />
                <span>Export</span>
              </Button>
            )}

            {/* Clear */}
            {messages.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-rose-600 transition-colors px-2.5 py-1.5 rounded-md hover:bg-rose-50 cursor-pointer border border-transparent hover:border-rose-200">
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Clear</span>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear conversation history?</AlertDialogTitle>
                    <AlertDialogDescription>This removes all messages from your browser's local storage.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearChat} className="bg-red-600 hover:bg-red-700 text-white">Clear</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* ── SCROLL AREA ───────────────────────────────────────────────────── */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#e5e7eb transparent" }}
        >
          <div className="flex flex-col min-h-full px-4 sm:px-6">

            {isEmpty ? (
              /* ── EMPTY STATE (centred) ── */
              <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 py-8">
                {/* Bot icon */}
                <div className="relative">
                  <div className="h-14 w-14 rounded-xl bg-[#111111] text-white flex items-center justify-center shadow-md">
                    <Bot className="h-7 w-7" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                </div>
                <div className="max-w-md space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#111111] tracking-tight">
                    How can I assist your practice today?
                  </h2>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Ask any question about GST statutory clauses, ITR schedules, ITC reversals, or TDS rates in plain English.
                  </p>
                </div>

                {/* Categorized Suggestion Tabs */}
                <div className="w-full max-w-2xl space-y-3 pt-2">
                  <div className="flex items-center justify-center gap-1.5 overflow-x-auto pb-1">
                    {CATEGORIZED_PROMPTS.map((cat) => {
                      const CatIcon = cat.icon;
                      const isActive = activeCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setActiveCategory(cat.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                            isActive
                              ? "bg-[#111111] text-white shadow-sm"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          <CatIcon className="h-3.5 w-3.5" />
                          <span>{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left pt-1">
                    {activePromptGroup.prompts.map((p, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => sendMessage(p)}
                        className="flex items-start gap-3 p-3.5 rounded-md border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 text-left transition-all duration-150 cursor-pointer group shadow-sm"
                      >
                        <span className="h-5 w-5 rounded bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5 group-hover:border-gray-400">
                          {i + 1}
                        </span>
                        <span className="text-xs sm:text-[13px] text-gray-700 group-hover:text-gray-900 leading-snug transition-colors">
                          {p}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* ── SPACER — pushes messages to the bottom when few exist ── */}
                <div className="flex-1 min-h-6" />

                {/* ── MESSAGES ── */}
                <div className="space-y-6 py-6">
                  {messages.map((msg, index) => {
                    const isUser = msg.role === "user";
                    const isLastAssistant = !isUser && index === messages.length - 1;
                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {/* Avatar */}
                        <div className={`h-8 w-8 rounded-md flex items-center justify-center shrink-0 mb-1 border ${
                          isUser
                            ? "bg-[#111111] border-[#111111] text-white"
                            : "bg-gray-100 border-gray-200 text-gray-900"
                        }`}>
                          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>

                        {/* Bubble column */}
                        <div className={`flex flex-col gap-1.5 max-w-[85%] sm:max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
                          {/* Name + time */}
                          <div className={`flex items-center gap-2 px-1 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                            <span className="text-xs font-semibold text-gray-700 dark:text-[#e5e7eb]">
                              {isUser ? "You" : "TaxPlain AI"}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-[#9ca3af] font-mono">{msg.timestamp}</span>
                          </div>

                          {/* Bubble */}
                          <div className={`px-4 sm:px-5 py-3.5 text-[14.5px] leading-[1.7] shadow-sm ${
                            isUser
                              ? "bg-[#111111] dark:bg-[#262626] text-white dark:text-[#f2f2f2] rounded-2xl rounded-tr-md font-normal"
                              : "bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] text-gray-900 dark:text-[#f2f2f2] rounded-2xl rounded-tl-md font-normal"
                          }`}>
                            {isUser ? (
                              <p className="whitespace-pre-wrap">{msg.content}</p>
                            ) : msg.content ? (
                              <div className="prose dark:prose-invert max-w-none
                                prose-headings:text-[#111111] dark:prose-headings:text-[#f2f2f2] prose-headings:font-semibold prose-headings:tracking-tight prose-headings:text-base prose-headings:mt-3.5 prose-headings:mb-2
                                prose-p:text-gray-800 dark:prose-p:text-[#e5e7eb] prose-p:leading-[1.7] prose-p:my-2
                                prose-li:text-gray-800 dark:prose-li:text-[#e5e7eb] prose-li:my-1 prose-ul:my-2 prose-ol:my-2
                                prose-strong:text-gray-900 dark:prose-strong:text-[#f2f2f2] prose-strong:font-semibold
                                prose-code:text-gray-900 dark:prose-code:text-[#f2f2f2] prose-code:bg-gray-100 dark:prose-code:bg-[#242424] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[12.5px] prose-code:font-mono prose-code:border prose-code:border-gray-200 dark:prose-code:border-[#2a2a2a]
                                prose-pre:bg-gray-900 dark:prose-pre:bg-[#111111] prose-pre:border prose-pre:border-gray-800 dark:prose-pre:border-[#2a2a2a] prose-pre:rounded-md prose-pre:text-xs prose-pre:text-gray-100
                                prose-blockquote:border-l-2 prose-blockquote:border-gray-400 dark:prose-blockquote:border-[#404040] prose-blockquote:bg-gray-100/60 dark:prose-blockquote:bg-[#242424] prose-blockquote:text-gray-700 dark:prose-blockquote:text-[#d1d5db] prose-blockquote:pl-3 prose-blockquote:py-1 prose-blockquote:rounded-r
                                prose-hr:border-gray-200 dark:prose-hr:border-[#2a2a2a]
                              ">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                            ) : (
                              /* Typing indicator while streaming */
                              <div className="flex items-center gap-2.5 py-1">
                                <TypingDots />
                                <span className="text-xs sm:text-sm text-gray-500 dark:text-[#9ca3af]">Consulting statutory tax provisions…</span>
                              </div>
                            )}
                          </div>

                          {/* AI message footer actions */}
                          {!isUser && msg.content && (
                            <div className="flex items-center gap-3 px-1 mt-0.5 flex-wrap">
                              <span className="flex items-center gap-1.5 text-xs text-gray-500">
                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                                Educational AI disclaimer applies
                              </span>

                              <div className="flex items-center gap-1 ml-auto">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(msg.id, msg.content)}
                                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 py-0.5 rounded transition-colors cursor-pointer border border-transparent"
                                  title="Copy response"
                                >
                                  {copiedId === msg.id ? (
                                    <><Check className="h-3 w-3 text-emerald-600" /><span className="text-emerald-600 font-medium">Copied</span></>
                                  ) : (
                                    <><Copy className="h-3 w-3" /><span>Copy</span></>
                                  )}
                                </button>

                                {isLastAssistant && !isLoading && (
                                  <button
                                    type="button"
                                    onClick={handleRegenerate}
                                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-100 px-2 py-0.5 rounded transition-colors cursor-pointer border border-transparent"
                                    title="Regenerate AI response"
                                  >
                                    <RotateCcw className="h-3 w-3 text-gray-500" />
                                    <span>Regenerate</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={bottomRef} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Scroll to Bottom Button */}
        {showScrollBottom && (
          <button
            onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
            className="absolute bottom-24 right-6 z-20 h-8 w-8 rounded-full bg-gray-900 text-white shadow-md flex items-center justify-center hover:bg-black transition-all"
            title="Scroll to bottom"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}

        {/* ── QUICK PROMPT CHIPS (after first message) ─────────────────────── */}
        {!isEmpty && (
          <div className="px-4 sm:px-6 py-2 border-t border-gray-200 overflow-x-auto shrink-0 bg-white">
            <div className="flex items-center gap-2 w-max">
              <span className="text-xs text-gray-500 font-medium mr-1 flex items-center gap-1 shrink-0">
                <Sparkles className="h-3 w-3 text-gray-700" />
                Suggestions:
              </span>
              {activePromptGroup.prompts.slice(0, 3).map((p, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => sendMessage(p)}
                  disabled={isLoading}
                  className="whitespace-nowrap text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1 rounded-full transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── INPUT BAR (FIXED FOOTER) ───────────────────────────────────────── */}
        <div className="px-4 sm:px-6 pt-3 pb-3 md:pb-4 border-t border-gray-200 bg-white shrink-0 z-10 sticky bottom-0">
          <form onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}>
            {/* Input row */}
            <div className="flex items-end gap-2.5">
              <div className="relative flex-1">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask any question on GST, Income Tax, or TDS (Enter to send, Shift+Enter for newline)..."
                  rows={1}
                  disabled={isLoading}
                  className="w-full min-h-[46px] max-h-[140px] resize-none rounded-xl border border-gray-200 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 bg-white text-gray-900 placeholder-gray-400 text-sm sm:text-[14.5px] px-4 py-3 pr-16 leading-relaxed outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed font-sans shadow-sm"
                  style={{ scrollbarWidth: "thin" }}
                />
                {/* Character counter */}
                <span className={`absolute right-3.5 bottom-3 text-[11px] font-mono pointer-events-none select-none ${
                  input.length > MAX_CHARS * 0.9 ? "text-amber-600 font-semibold" : "text-gray-400"
                }`}>
                  {input.length}/{MAX_CHARS}
                </span>
              </div>

              {/* Send / Stop button */}
              {isLoading ? (
                <Button
                  type="button"
                  onClick={handleStopGenerating}
                  className="h-[46px] px-4 rounded-xl bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-800 shrink-0 font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Stop generating AI response"
                >
                  <StopCircle className="h-4 w-4 text-rose-600" />
                  <span className="hidden sm:inline">Stop</span>
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={!input.trim()}
                  className="h-[46px] w-[46px] p-0 rounded-xl bg-[#111111] hover:bg-black disabled:bg-gray-100 disabled:text-gray-400 text-white shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Footer strip */}
            <div className="flex flex-wrap items-center justify-between gap-y-1 mt-2.5 px-1 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                Secured Server Vault · NVIDIA DeepSeek V4 Engine
              </span>
              <span className="flex items-center gap-1.5">
                <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
                Educational tool · Always consult a certified CA for official advisory
              </span>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
