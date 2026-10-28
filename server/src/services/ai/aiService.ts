import { config } from '../../config/env';
import { EXPENSE_CATEGORIES } from '../../config/constants';

export interface ExtractedNote {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface ExtractedTask {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string; // ISO date string
  dueTime?: string; // HH:mm
}

export interface ExtractedTransaction {
  amount: number;
  currency: string;
  type: 'expense' | 'income';
  category: string;
  merchant?: string;
  notes?: string;
  confirmationStatus: 'confirmed' | 'pending' | 'planned';
}

export interface ExtractionResult {
  intent: 'capture' | 'clarification' | 'conversation';
  language: string;
  summary: string;
  notes: ExtractedNote[];
  tasks: ExtractedTask[];
  transactions: ExtractedTransaction[];
  clarificationQuestions: string[];
  confidence: number;
}

export interface NoteSummaryResult {
  brief: string;
  standard: string;
  detailed: string;
  keyPoints: string[];
  actionItems: string[];
  suggestedTags: string[];
  suggestedCategory: string;
}

export interface MemoryAnswerResult {
  answer: string;
  confidence: number;
  sourceNotes: Array<{ id: string; title: string }>;
  sourceTasks: Array<{ id: string; title: string }>;
  sourceTransactions: Array<{ id: string; details: string }>;
}

export class AIService {
  /**
   * Main capture extraction entry point
   */
  static async extractStructuredData(
    text: string,
    userTimezone: string = 'Asia/Kolkata',
    userCurrency: string = 'INR'
  ): Promise<ExtractionResult> {
    // If external LLM is configured (e.g., OpenAI, Groq, Gemini), try calling it
    if (config.llm.apiKey && config.llm.provider !== 'local') {
      try {
        return await this.extractWithLLM(text, userTimezone, userCurrency);
      } catch (error) {
        console.warn('[AIService] External LLM failed, falling back to local extraction engine:', error);
      }
    }

    // Default intelligent local parsing engine (offline, instant, resilient)
    return this.extractLocally(text, userTimezone, userCurrency);
  }

  /**
   * Intelligent multilingual local extraction engine
   */
  static extractLocally(
    text: string,
    userTimezone: string = 'Asia/Kolkata',
    userCurrency: string = 'INR'
  ): ExtractionResult {
    const trimmed = text.trim();
    const lower = trimmed.toLowerCase();

    const transactions: ExtractedTransaction[] = [];
    const tasks: ExtractedTask[] = [];
    const notes: ExtractedNote[] = [];
    const clarificationQuestions: string[] = [];

    // Detect language script / markers
    let language = 'en';
    if (/[\u0900-\u097F]/.test(text)) {
      language = 'hi';
    } else if (/\b(aaj|kal|maine|kharche|rupaye|bheje|mila|hai|karna|hoga)\b/i.test(text)) {
      language = 'hi-Latn';
    }

    // 1. Transaction extraction (Expenses & Incomes)
    // Examples: "spent 180 rupees on lunch and 60 on the metro", "paid ₹250 for groceries", "received 5000 salary", "might spend 500 tomorrow"
    const plannedKeywords = /(might spend|may spend|plan to spend|thinking of spending|budgeted|shyd kharch|soch raha hu)/i;
    const isPlanned = plannedKeywords.test(lower);

    // Regular expressions matching amounts and associated labels
    // Match patterns like: "180 rupees on lunch", "₹60 for metro", "spent 200 on coffee", "60 on the metro", "income of 5000"
    const amountRegexes = [
      /(?:spent|paid|kharche|spend|diye)\s*(?:(?:rs\.?|inr|rupees?|₹)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|inr)?\s*(?:on|for|pe|par)?\s*([a-zA-Z\s]{2,20})/gi,
      /(?:(?:rs\.?|inr|rupees?|₹)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|inr)?\s*(?:on|for|pe|par)\s*(?:the\s+)?([a-zA-Z\s]{2,20})/gi,
      /(?:received|got|credited|salary|income of|kamaye)\s*(?:(?:rs\.?|inr|rupees?|₹)\s*)?(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|inr)?(?:\s*(?:from|for|ka)?\s*([a-zA-Z\s]{2,20}))?/gi,
    ];

    const detectedMatches: Array<{ amount: number; label: string; isIncome: boolean }> = [];

    // Parse incomes
    const incomeMatch = /(?:received|salary|income|credited|kamaye|mile)\s*(?:rs\.?|inr|₹)?\s*(\d+)/i.exec(lower);
    if (incomeMatch) {
      detectedMatches.push({
        amount: parseFloat(incomeMatch[1]),
        label: 'Salary / Income',
        isIncome: true,
      });
    }

    // Check specific known expense patterns
    const expenseTokens = [
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:lunch|dinner|breakfast|food|khana|chai|coffee|burger|pizza)/i, category: 'Food', label: 'Lunch / Food' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:the\s+)?(?:metro|bus|train|auto|cab|uber|ola|petrol|fuel|ticket)/i, category: 'Transport', label: 'Metro / Transport' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:groceries|vegetables|sabzi|fruits|milk|ration)/i, category: 'Food', label: 'Groceries' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:movie|cinema|netflix|games|concert)/i, category: 'Entertainment', label: 'Entertainment' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:electricity|wifi|internet|recharge|rent|bill)/i, category: 'Bills', label: 'Bills & Utilities' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:medicine|doctor|clinic|pharmacy|hospital)/i, category: 'Health', label: 'Health / Medicine' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:books|tuition|course|fees|class)/i, category: 'Education', label: 'Education' },
      { regex: /(?:spent|spend|paid|kharch)?\s*(?:rs\.?|inr|rupees?|₹)?\s*(\d+)\s*(?:rupees?|rs\.?)?\s*(?:on|for|pe|par)?\s*(?:clothes|shoes|amazon|flipkart|shopping)/i, category: 'Shopping', label: 'Shopping' },
    ];

    const matchedAmounts = new Set<number>();

    for (const pattern of expenseTokens) {
      const match = pattern.regex.exec(text);
      if (match) {
        const amount = parseFloat(match[1]);
        if (!matchedAmounts.has(amount)) {
          matchedAmounts.add(amount);
          transactions.push({
            amount,
            currency: userCurrency,
            type: 'expense',
            category: pattern.category,
            merchant: pattern.label,
            notes: `Extracted from conversation: "${match[0].trim()}"`,
            confirmationStatus: isPlanned ? 'planned' : 'confirmed',
          });
        }
      }
    }

    // Generic amount extraction if not matched above
    if (transactions.length === 0 && detectedMatches.length === 0) {
      const genericAmountRegex = /(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:rupees?|rs\.?|inr)?/gi;
      let m;
      while ((m = genericAmountRegex.exec(text)) !== null) {
        const amt = parseFloat(m[1]);
        if (amt > 0 && amt < 1000000 && !matchedAmounts.has(amt)) {
          matchedAmounts.add(amt);
          // Check context around amount
          const isContextExpense = /(spend|spent|bought|paid|cost|kharch)/i.test(text);
          if (isContextExpense) {
            transactions.push({
              amount: amt,
              currency: userCurrency,
              type: 'expense',
              category: 'Other',
              merchant: 'General Expense',
              confirmationStatus: isPlanned ? 'planned' : 'confirmed',
            });
          }
        }
      }
    }

    // 2. Task & Reminder extraction
    // Examples: "My DBMS assignment is due Friday", "Remind me to call my mother on Sunday", "Finish report by tomorrow"
    const sentenceSplit = text.split(/(?<=[.!?])\s+|(?<=\band\b)\s+|(?<=\baur\b)\s+/i);

    for (const s of sentenceSplit) {
      const sTrim = s.trim();
      const sLower = sTrim.toLowerCase();

      // Check if sentence refers to task / reminder / assignment
      const isTaskLike =
        /\b(due|deadline|assignment|project|submit|finish|complete|remind|call|meet|schedule|prepare|exam|test|presentation|bhejna|karna hai)\b/i.test(
          sLower
        );

      if (isTaskLike) {
        let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
        if (/\b(urgent|asap|important|immediately|aaj hi)\b/i.test(sLower)) priority = 'urgent';
        else if (/\b(high priority|crucial|essential)\b/i.test(sLower)) priority = 'high';

        // Extract due date relative to today
        let dueDate: string | undefined = undefined;
        const now = new Date();

        if (/\btomorrow|kal\b/i.test(sLower)) {
          const d = new Date(now);
          d.setDate(d.getDate() + 1);
          dueDate = d.toISOString();
        } else if (/\bfriday\b/i.test(sLower)) {
          const d = new Date(now);
          const currentDay = d.getDay(); // 0 is Sun, 5 is Fri
          const distance = (5 - currentDay + 7) % 7 || 7;
          d.setDate(d.getDate() + distance);
          dueDate = d.toISOString();
        } else if (/\bsunday\b/i.test(sLower)) {
          const d = new Date(now);
          const currentDay = d.getDay(); // 0 is Sun
          const distance = (0 - currentDay + 7) % 7 || 7;
          d.setDate(d.getDate() + distance);
          dueDate = d.toISOString();
        } else if (/\bmonday\b/i.test(sLower)) {
          const d = new Date(now);
          const currentDay = d.getDay(); // 1 is Mon
          const distance = (1 - currentDay + 7) % 7 || 7;
          d.setDate(d.getDate() + distance);
          dueDate = d.toISOString();
        }

        // Clean task title
        let title = sTrim
          .replace(/^(remind me to|remember to|need to|have to|please|kindly)\s+/i, '')
          .replace(/\s*(on sunday|on friday|by tomorrow|due friday|due tomorrow)\s*$/i, '')
          .trim();

        if (title.length > 3) {
          tasks.push({
            title: title.charAt(0).toUpperCase() + title.slice(1),
            description: sTrim,
            priority,
            dueDate,
          });
        }
      }
    }

    // 3. Note creation: always produce a comprehensive note capturing the entire context
    const cleanTitle = text.slice(0, 45).trim() + (text.length > 45 ? '...' : '');
    const detectedTags: string[] = [];
    if (transactions.length > 0) detectedTags.push('finance', 'expenses');
    if (tasks.length > 0) detectedTags.push('tasks', 'action-items');
    if (detectedTags.length === 0) detectedTags.push('general-memo');

    notes.push({
      title: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
      content: text,
      category: transactions.length > 0 && tasks.length === 0 ? 'Finances' : 'Daily Log',
      tags: detectedTags,
    });

    // 4. Clarification check
    if (isPlanned) {
      clarificationQuestions.push(
        'You mentioned a planned spending. Would you like to mark it as a budget plan or confirm it as an actual transaction?'
      );
    }

    return {
      intent: clarificationQuestions.length > 0 ? 'clarification' : 'capture',
      language,
      summary: `Organized ${transactions.length} transaction(s), ${tasks.length} task(s), and created a daily note record.`,
      notes,
      tasks,
      transactions,
      clarificationQuestions,
      confidence: 0.94,
    };
  }

  /**
   * External LLM extractor (OpenAI / Groq / Gemini compatible)
   */
  private static async extractWithLLM(
    text: string,
    userTimezone: string,
    userCurrency: string
  ): Promise<ExtractionResult> {
    const systemPrompt = `You are DayPilot AI, an intelligent personal memory & money assistant.
Extract structured items from the user's voice or text message.
Return strict JSON matching this schema:
{
  "intent": "capture" | "clarification" | "conversation",
  "language": "en" | "hi" | "hi-Latn" | string,
  "summary": string,
  "notes": [ { "title": string, "content": string, "category": string, "tags": string[] } ],
  "tasks": [ { "title": string, "description": string, "priority": "low" | "medium" | "high" | "urgent", "dueDate": "YYYY-MM-DD" } ],
  "transactions": [ { "amount": number, "currency": "${userCurrency}", "type": "expense" | "income", "category": string, "merchant": string, "confirmationStatus": "confirmed" | "planned" } ],
  "clarificationQuestions": [ string ],
  "confidence": number
}
Note: Do not mark planned future expenses (e.g., "might spend ₹500 tomorrow") as confirmed transactions. Keep monetary values accurate. User timezone: ${userTimezone}.`;

    const endpoint = config.llm.endpoint || 'https://api.openai.com/v1/chat/completions';

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.llm.apiKey}`,
      },
      body: JSON.stringify({
        model: config.llm.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      throw new Error(`LLM API returned error ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    const content = data.choices[0].message.content;
    return JSON.parse(content);
  }

  /**
   * Generate Note Summaries (Brief, Standard, Detailed)
   */
  static async summarizeNote(content: string, title?: string): Promise<NoteSummaryResult> {
    const sentences = content
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter(Boolean);

    // Brief summary: 1 crisp sentence
    const brief =
      sentences.length > 0
        ? sentences[0]
        : 'Note recorded on DayPilot.';

    // Standard summary: 2-3 sentences
    const standard =
      sentences.length > 1
        ? `${sentences.slice(0, 3).join(' ')}`
        : brief;

    // Detailed summary: Comprehensive overview
    const detailed = `Summary Overview:\n${content}\n\nKey takeaway: Preserved and indexed in DayPilot memory.`;

    // Extract key points
    const keyPoints = sentences.slice(0, 5).map((s) => s.replace(/^[•\-\*]\s*/, ''));

    // Extract action items
    const actionItems = sentences
      .filter((s) => /\b(need to|must|will|action|task|due|deadline|remind|follow up|submit)\b/i.test(s))
      .map((s) => s.trim());

    // Suggested tags
    const suggestedTags: string[] = ['memory'];
    if (/\b(project|code|dev|assignment|dbms)\b/i.test(content)) suggestedTags.push('work', 'study');
    if (/\b(meeting|discussion|decided)\b/i.test(content)) suggestedTags.push('meeting');
    if (/\b(money|spent|budget|expense|rupees|₹)\b/i.test(content)) suggestedTags.push('finance');

    return {
      brief,
      standard,
      detailed,
      keyPoints: keyPoints.length > 0 ? keyPoints : [brief],
      actionItems,
      suggestedTags,
      suggestedCategory: suggestedTags.includes('work') ? 'Work' : suggestedTags.includes('finance') ? 'Finance' : 'General',
    };
  }

  /**
   * Personal AI Memory Search: Answers user questions strictly grounded in their saved notes, tasks, transactions
   */
  static async answerMemoryQuery(
    query: string,
    notes: any[],
    tasks: any[],
    transactions: any[]
  ): Promise<MemoryAnswerResult> {
    const qLower = query.toLowerCase();

    // Match notes based on title, content, tags
    const matchedNotes = notes.filter((n) => {
      const text = `${n.title} ${n.originalContent} ${(n.tags || []).join(' ')}`.toLowerCase();
      return text.includes(qLower) || qLower.split(' ').some((word) => word.length > 3 && text.includes(word));
    });

    // Match tasks
    const matchedTasks = tasks.filter((t) => {
      const text = `${t.title} ${t.description || ''}`.toLowerCase();
      return text.includes(qLower) || qLower.split(' ').some((word) => word.length > 3 && text.includes(word));
    });

    // Match transactions
    const matchedTransactions = transactions.filter((tx) => {
      const text = `${tx.merchant || ''} ${tx.category} ${tx.notes || ''}`.toLowerCase();
      return text.includes(qLower) || qLower.split(' ').some((word) => word.length > 3 && text.includes(word));
    });

    // If no records found, return honest grounding response without fabrication
    if (matchedNotes.length === 0 && matchedTasks.length === 0 && matchedTransactions.length === 0) {
      return {
        answer: `I searched through your personal DayPilot library for "${query}", but I couldn't find any matching records or notes. Try asking with different keywords or create a new note with those details.`,
        confidence: 1.0,
        sourceNotes: [],
        sourceTasks: [],
        sourceTransactions: [],
      };
    }

    // Build grounded answer
    const answerParts: string[] = [];

    if (matchedNotes.length > 0) {
      answerParts.push(
        `Based on your notes:\n` +
          matchedNotes
            .slice(0, 3)
            .map((n) => `• In "${n.title}": ${n.originalContent.slice(0, 160)}${n.originalContent.length > 160 ? '...' : ''}`)
            .join('\n')
      );
    }

    if (matchedTasks.length > 0) {
      answerParts.push(
        `Related tasks found:\n` +
          matchedTasks
            .slice(0, 3)
            .map((t) => `• [${t.status.toUpperCase()}] ${t.title}${t.dueDate ? ` (Due: ${new Date(t.dueDate).toLocaleDateString()})` : ''}`)
            .join('\n')
      );
    }

    if (matchedTransactions.length > 0) {
      answerParts.push(
        `Related spending records:\n` +
          matchedTransactions
            .slice(0, 3)
            .map((tx) => `• ${tx.type === 'expense' ? 'Spent' : 'Received'} ${tx.currency} ${tx.amount} on ${tx.category}${tx.merchant ? ` (${tx.merchant})` : ''}`)
            .join('\n')
      );
    }

    return {
      answer: answerParts.join('\n\n'),
      confidence: 0.95,
      sourceNotes: matchedNotes.map((n) => ({ id: n._id.toString(), title: n.title })),
      sourceTasks: matchedTasks.map((t) => ({ id: t._id.toString(), title: t.title })),
      sourceTransactions: matchedTransactions.map((tx) => ({
        id: tx._id.toString(),
        details: `${tx.currency} ${tx.amount} - ${tx.category}`,
      })),
    };
  }
}
