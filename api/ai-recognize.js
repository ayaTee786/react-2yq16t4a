export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Use POST" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY environment variable." });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { kind, image, context = {} } = body || {};

    if (!image) {
      return res.status(400).json({ error: "Missing image." });
    }

    const commonRules = `
Return ONLY valid JSON.
Do not add markdown.
Do not guess confidently if the image is unclear.
Use the allowed dropdown values exactly when possible.
`;

    const laserPrompt = `
You are helping classify a leather emboss / laser pattern for Handsole workshop inventory.

Analyze the uploaded pattern image visually. Fill these fields:
{
  "pattern_name": "",
  "pattern_type": "",
  "best_use": "",
  "avoid_use": "",
  "design_notes": "",
  "ai_search_summary": "",
  "laser_pattern_status": "Ready for AI"
}

Important pattern naming:
- Crocodile/alligator belly scale is NOT hexagonal.
- Crocodile/alligator texture should be named "Crocodile Belly Scale Emboss".
- If it is a clean repeated square/box grid, use "Micro Box Grid" or "Box Grid".
- If it is diamond/rhombus, use "Diamond Grid".
- If it is perforated holes, use "Micro Perforated Look".
- If unsure, set pattern_name to "Needs Review" and explain uncertainty in ai_search_summary.

Allowed pattern_name examples:
Crocodile Belly Scale Emboss, Crocodile / Alligator Texture, Snake Scale Emboss, Lizard Scale Emboss, Ostrich Leather Emboss, Pebble Grain Emboss, Micro Box Grid, Diamond Grid, Micro Diamond Grid, Wave Emboss, Micro Perforated Look, Rectangular Cell Pattern, Square Frame Emboss, Micro Cross Weave, 3D Hexagonal Weave, Plain Texture, Custom, Needs Review.

${commonRules}
`;

    const inspirationPrompt = `
You are helping classify a men's leather footwear inspiration image for Handsole workshop design RAG.

Analyze the uploaded shoe/design image visually. Fill these fields:
{
  "type_of_inspiration": "",
  "design_type": "",
  "toe_shape": "",
  "closure_type": "",
  "tags": "",
  "design_elements": "",
  "construction_notes": "",
  "ai_search_summary": "",
  "inspiration_status": "Ready for AI"
}

Important:
- Do NOT label something Monk Strap unless you clearly see a strap/buckle across the vamp.
- If you see laces, closure_type must be "Lace Up", not Monk Strap.
- If it is lace-up but open/closed lacing is unclear, choose "Oxford" only when it looks closed-lacing/formal; otherwise choose "Derby" or "Needs Review".
- For two-tone lace-up with saddle-like panel, mention two-tone/saddle style in tags and ai_search_summary.
- If unsure, set design_type to "Needs Review" and explain why.

Allowed design_type examples:
Oxford, Wholecut Oxford, Cap Toe Oxford, Plain Toe Oxford, Wingtip Oxford, Semi Brogue Oxford, Full Brogue Oxford, Derby, Plain Toe Derby, Cap Toe Derby, Wingtip Derby, Longwing Brogue, Loafer, Penny Loafer, Tassel Loafer, Horsebit Loafer, Apron Toe Loafer, Belgian Loafer, Slip-On, Monk Strap, Single Monk Strap, Double Monk Strap, Boot, Chelsea Boot, Chukka Boot, Jodhpur Boot, Dress Boot, Balmoral Boot, Ankle Boot, Mule / Backless Loafer, Sandal, Slipper, Belt, Needs Review, Other.

Allowed closure_type examples:
Lace Up, Slip On, Monk Strap, Buckle, Horsebit, Tassel, Zipper, Elastic, Backless, Other.

Allowed toe_shape examples:
Pointed, Almond, Round, Square, Cap Toe, Apron Toe, Wingtip, Plain Toe, Other.

${commonRules}
`;

    const prompt = kind === "laser_pattern" ? laserPrompt : inspirationPrompt;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "user",
            content: [
              { type: "input_text", text: prompt },
              { type: "input_image", image_url: image }
            ]
          }
        ],
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: result?.error?.message || "OpenAI vision request failed."
      });
    }

    const raw =
      result.output_text ||
      result.output?.[0]?.content?.[0]?.text ||
      result.output?.flatMap(o => o.content || []).find(c => c.text)?.text ||
      "";

    let fields;
    try {
      fields = JSON.parse(raw);
    } catch (e) {
      return res.status(500).json({
        error: "Vision model did not return valid JSON.",
        raw
      });
    }

    return res.status(200).json({ fields });
  } catch (err) {
    return res.status(500).json({ error: err?.message || "AI recognition failed." });
  }
}
