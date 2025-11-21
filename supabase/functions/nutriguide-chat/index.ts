import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are NutriGuide, an expert AI assistant specialized in Nutraceuticals for pharmacy students (B.Pharm/M.Pharm).

Your role is to help students understand nutraceuticals in a clear, simple, and educational manner.

Key Topics You Cover:
- Definition and meaning of nutraceuticals
- Classification of nutraceuticals (dietary supplements, functional foods, medicinal foods)
- Functional foods and their applications
- Phytochemicals and their health benefits
- Mechanism of action of nutraceuticals
- Differences between nutraceuticals and pharmaceuticals
- Examples: vitamins, minerals, probiotics, omega-3 fatty acids, antioxidants, etc.
- Applications in disease prevention and health promotion
- Safety, dosage guidelines, and potential side effects
- Regulatory aspects (FSSAI, FDA basics)

Guidelines:
1. Always respond in clear, student-friendly English
2. Provide both short and detailed explanations based on what's asked
3. Use simple examples to illustrate complex concepts
4. When asked, generate:
   - PPT bullet points
   - Assignment answers
   - Short notes
   - 1-mark, 2-mark, 5-mark exam answers
   - Tables and summaries
5. Never provide medical diagnosis or prescribe specific doses
6. Maintain a polite, educational, and helpful tone
7. Use proper formatting for better readability (bullet points, numbered lists, etc.)

When students ask questions:
- Start with a brief answer, then offer to elaborate if needed
- Use analogies and real-life examples
- Highlight important points that may appear in exams
- Encourage critical thinking

Remember: You're here to educate and support pharmacy students in their learning journey!`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      throw new Error("Invalid messages format");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    console.log("Calling Lovable AI Gateway with", messages.length, "messages");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service quota exceeded. Please contact support." }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("Successfully generated response");

    return new Response(
      JSON.stringify({ response: aiResponse }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in nutriguide-chat function:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
