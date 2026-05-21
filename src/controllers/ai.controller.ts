import { Request, Response } from "express";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { AuthRequest } from "../middlewares/auth.middleware";
import prisma from "../config/prisma";
import { model, deterministicModel } from "../config/ai";
import { getCache, setCache, clearCacheByPrefix } from "../config/cache";

// In-memory chat sessions
const sessions = new Map<string, { role: string; content: string }[]>();

// ── Helper: parse AI JSON safely ─────────────────────────────────────────────
const parseAIJson = (text: string): any => {
  try {
    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

// ── Helper: handle Groq errors ───────────────────────────────────────────────
const handleGroqError = (error: any, res: Response): boolean => {
  if (error?.status === 429) {
    res.status(429).json({ message: "AI service is busy, please try again in a moment" });
    return true;
  }
  if (error?.status === 401) {
    res.status(500).json({ message: "AI service configuration error" });
    return true;
  }
  return false;
};

// ── Part 1 — Smart Listing Search ────────────────────────────────────────────
export const aiSearch = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    if (!query) {
      return res.status(400).json({ message: "query is required" });
    }

    // Use temperature: 0 for deterministic filter extraction
    const response = await deterministicModel.invoke([
      new SystemMessage(`You are a search filter extractor for a property listing platform.
Extract search filters from the user's query and return ONLY a JSON object with no explanation.
Fields: location (string or null), type (APARTMENT|HOUSE|VILLA|CABIN or null), maxPrice (number or null), guests (number or null).
If a field is not mentioned, set it to null.
Return ONLY valid JSON, nothing else.`),
      new HumanMessage(query)
    ]);

    const filters = parseAIJson(response.content as string);

    if (!filters) {
      return res.status(500).json({ message: "Failed to parse AI response" });
    }

    // If all filters are null, don't run an empty query
    if (!filters.location && !filters.type && !filters.maxPrice && !filters.guests) {
      return res.status(400).json({
        message: "Could not extract any filters from your query, please be more specific"
      });
    }

    const where: any = {};
    if (filters.location) where.location = { contains: filters.location, mode: "insensitive" };
    if (filters.type) where.type = filters.type;
    if (filters.maxPrice) where.pricePerNight = { lte: filters.maxPrice };
    if (filters.guests) where.guests = { gte: filters.guests };

    // Use Promise.all to fetch listings and count simultaneously
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: { host: { select: { id: true, name: true, email: true } }, photos: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" }
      }),
      prisma.listing.count({ where })
    ]);

    res.status(200).json({
      filters,
      data: listings,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error: any) {
    console.log(error);
    if (handleGroqError(error, res)) return;
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ── Part 2 — Description Generator ──────────────────────────────────────────
export const generateDescription = async (req: AuthRequest, res: Response) => {
  try {
    const listingId = req.params.id as string;
    const { tone = "professional" } = req.body;

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    if (listing.hostId !== req.userId) {
      return res.status(403).json({ message: "You can only generate descriptions for your own listings" });
    }

    const toneInstructions: Record<string, string> = {
      professional: "Write in a formal, clear, business-like tone. Focus on features and value.",
      casual: "Write in a friendly, relaxed, conversational tone. Make it feel approachable and warm.",
      luxury: "Write in an elegant, premium, aspirational tone. Use sophisticated language that evokes exclusivity."
    };

    const toneGuide = toneInstructions[tone] || toneInstructions.professional;

    const response = await model.invoke([
      new SystemMessage(`You are a professional copywriter for a property listing platform. ${toneGuide}`),
      new HumanMessage(`Write a compelling listing description for this property:
Title: ${listing.title}
Location: ${listing.location}
Type: ${listing.type}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Amenities: ${listing.amenities.join(", ")}

Write 2-3 paragraphs. Return only the description text, no extra commentary.`)
    ]);

    const description = (response.content as string).trim();

    // Save to database
    const updated = await prisma.listing.update({
      where: { id: listingId },
      data: { description }
    });

    res.status(200).json({ description, listing: updated });
  } catch (error: any) {
    console.log(error);
    if (handleGroqError(error, res)) return;
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ── Part 3 — Guest Support Chatbot ──────────────────────────────────────────
export const chat = async (req: Request, res: Response) => {
  try {
    const { sessionId, message, listingId } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ message: "sessionId and message are required" });
    }

    // Build system prompt
    let systemPrompt = "You are a helpful guest support assistant for an Airbnb-like platform.";

    if (listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (listing) {
        systemPrompt = `You are a helpful guest support assistant for an Airbnb-like platform.
You are currently helping a guest with questions about this specific listing:

Title: ${listing.title}
Location: ${listing.location}
Price per night: $${listing.pricePerNight}
Max guests: ${listing.guests}
Type: ${listing.type}
Amenities: ${listing.amenities.join(", ")}
Description: ${listing.description}

Answer questions about this listing accurately based on the details above.
If asked something not covered by the listing details, say you don't have that information.`;
      }
    }

    // Get or create session history
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, []);
    }

    const history = sessions.get(sessionId)!;

    // Add user message
    history.push({ role: "user", content: message });

    // Trim to last 10 exchanges (20 messages) to avoid token limits
    if (history.length > 20) {
      history.splice(0, history.length - 20);
    }

    // Build messages for AI
    const messages = [
      new SystemMessage(systemPrompt),
      ...history.map((m) =>
        m.role === "user" ? new HumanMessage(m.content) : new SystemMessage(m.content)
      )
    ];

    const response = await model.invoke(messages);
    const reply = (response.content as string).trim();

    // Add assistant reply to history
    history.push({ role: "assistant", content: reply });

    res.status(200).json({
      response: reply,
      sessionId,
      messageCount: history.length
    });
  } catch (error: any) {
    console.log(error);
    if (handleGroqError(error, res)) return;
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ── Part 4 — Booking Recommendations ────────────────────────────────────────
export const recommend = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get last 5 bookings with listing details
    const bookings = await prisma.booking.findMany({
      where: { guestId: userId },
      include: { listing: true },
      orderBy: { createdAt: "desc" },
      take: 5
    });

    if (bookings.length === 0) {
      return res.status(400).json({
        message: "No booking history found. Make some bookings first to get recommendations."
      });
    }

    // Build booking history summary
    const historySummary = bookings.map((b) =>
      `- ${b.listing.title} in ${b.listing.location}, type: ${b.listing.type}, price: $${b.listing.pricePerNight}/night, guests: ${b.listing.guests}`
    ).join("\n");

    const response = await deterministicModel.invoke([
      new SystemMessage(`You are a recommendation engine for a property listing platform.
Analyze the user's booking history and return ONLY a JSON object with no explanation.
Return ONLY valid JSON in this exact format:
{
  "preferences": "string describing what the user likes",
  "searchFilters": {
    "location": "string or null",
    "type": "APARTMENT|HOUSE|VILLA|CABIN or null",
    "maxPrice": number or null,
    "guests": number or null
  },
  "reason": "string explaining the recommendation"
}`),
      new HumanMessage(`Here is the user's booking history:\n${historySummary}\n\nAnalyze and recommend filters.`)
    ]);

    const aiResult = parseAIJson(response.content as string);

    if (!aiResult) {
      return res.status(500).json({ message: "Failed to parse AI response" });
    }

    // Get already booked listing IDs to exclude
    const bookedIds = bookings.map((b) => b.listingId);

    // Build filters from AI response
    const where: any = {
      id: { notIn: bookedIds }
    };
    if (aiResult.searchFilters?.location) where.location = { contains: aiResult.searchFilters.location, mode: "insensitive" };
    if (aiResult.searchFilters?.type) where.type = aiResult.searchFilters.type;
    if (aiResult.searchFilters?.maxPrice) where.pricePerNight = { lte: aiResult.searchFilters.maxPrice };
    if (aiResult.searchFilters?.guests) where.guests = { gte: aiResult.searchFilters.guests };

    const recommendations = await prisma.listing.findMany({
      where,
      include: { host: { select: { id: true, name: true } }, photos: true },
      take: 5
    });

    res.status(200).json({
      preferences: aiResult.preferences,
      reason: aiResult.reason,
      searchFilters: aiResult.searchFilters,
      recommendations
    });
  } catch (error: any) {
    console.log(error);
    if (handleGroqError(error, res)) return;
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ── Part 5 — Review Summarizer ───────────────────────────────────────────────
export const reviewSummary = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id as string;

    const cacheKey = `ai:review-summary:${listingId}`;
    const cached = getCache(cacheKey);
    if (cached) return res.status(200).json(cached);

    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: { user: { select: { name: true } } }
    });

    if (reviews.length < 3) {
      return res.status(400).json({
        message: "Not enough reviews to generate a summary (minimum 3 required)"
      });
    }

    // Calculate average rating in code — never ask the AI to calculate
    const averageRating = Math.round(
      (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
    ) / 10;

    const reviewsText = reviews.map((r) =>
      `- ${r.user.name} (${r.rating}/5): ${r.comment}`
    ).join("\n");

    const response = await model.invoke([
      new SystemMessage(`You are a review analyst for a property listing platform.
Analyze the reviews and return ONLY a JSON object with no explanation.
Return ONLY valid JSON in this exact format:
{
  "summary": "2-3 sentence overall summary",
  "positives": ["thing1", "thing2", "thing3"],
  "negatives": ["thing1"] or []
}`),
      new HumanMessage(`Here are the reviews for "${listing.title}":\n\n${reviewsText}\n\nGenerate a summary.`)
    ]);

    const aiResult = parseAIJson(response.content as string);

    if (!aiResult) {
      return res.status(500).json({ message: "Failed to parse AI response" });
    }

    const result = {
      summary: aiResult.summary,
      positives: aiResult.positives,
      negatives: aiResult.negatives || [],
      averageRating,
      totalReviews: reviews.length
    };

    // Cache for 10 minutes
    setCache(cacheKey, result, 10 * 60);

    res.status(200).json(result);
  } catch (error: any) {
    console.log(error);
    if (handleGroqError(error, res)) return;
    res.status(500).json({ message: "Something went wrong" });
  }
};
