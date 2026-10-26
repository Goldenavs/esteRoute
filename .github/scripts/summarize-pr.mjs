import { execSync } from 'node:child_process';

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  let prNumber = process.env.PR_NUMBER;
  if (!prNumber) {
    try {
      prNumber = execSync(`gh pr view --json number -q .number`, { encoding: 'utf-8' }).trim();
    } catch {
      // ignore
    }
  }

  const baseRef = process.env.BASE_REF || 'develop';

  if (!apiKey) {
    console.warn('⚠️ GEMINI_API_KEY is not set in GitHub repository secrets. Skipping automated summary generation.');
    process.exit(0);
  }

  if (!prNumber) {
    console.error('❌ PR_NUMBER environment variable is missing and could not be detected from branch.');
    process.exit(1);
  }

  console.log(`🔍 Inspecting PR #${prNumber} diff against base branch: origin/${baseRef}...`);

  // 1. Get current PR title and existing body
  let existingBody = '';
  let prTitle = '';
  try {
    const prJson = execSync(`gh pr view ${prNumber} --json title,body`, { encoding: 'utf-8' });
    const prData = JSON.parse(prJson);
    prTitle = prData.title || '';
    existingBody = (prData.body || '').trim();
  } catch (err) {
    console.warn('Could not read existing PR details via gh CLI, proceeding with empty body.', err.message);
  }

  // 2. Extract git diff excluding lockfiles and build artifacts
  let diff = '';
  try {
    diff = execSync(
      `git diff --stat origin/${baseRef}...HEAD && echo "---" && git diff origin/${baseRef}...HEAD -- . ':!package-lock.json' ':!*.lock' ':!dist' ':!build'`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }
    );
  } catch (err) {
    console.error('Failed to extract git diff:', err.message);
    process.exit(1);
  }

  // Cap diff length to prevent token limits on large PRs
  const maxDiffLength = 30000;
  if (diff.length > maxDiffLength) {
    diff = diff.slice(0, maxDiffLength) + '\n\n[... diff truncated for AI summarization ...]';
  }

  if (!diff.trim()) {
    console.log('No meaningful code changes detected in diff. Skipping summary.');
    process.exit(0);
  }

  // 3. Prepare AI prompt
  const systemPrompt = `You are an automated pull request summarizer for the esteRoute repository.
Given the PR Title and Git Diff, generate a clear, professional, and well-structured Markdown summary.

Guidelines:
- Start with a concise **Overview** (2-3 sentences explaining the core feature or fix).
- Provide **Key Changes** categorized by area (e.g., Frontend / UI, Backend / API, Configuration / Styles), highlighting what changed.
- Provide a brief **Verification & Testing** checklist for reviewers.
- Keep the tone professional, direct, and readable.
- Do NOT include conversational filler like "Here is your summary". Output only the Markdown content.

PR Title: ${prTitle}

Git Diff & Stats:
${diff}
`;

  // 4. Call Gemini API
  console.log('🤖 Requesting PR summary from Gemini API...');
  let aiSummary = '';

  // Dynamically discover supported models for the account, with fallback to gemini-3.8-flash
  let modelsToTry = ['gemini-3.8-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  try {
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (listRes.ok) {
      const listData = await listRes.json();
      const activeModels = (listData.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''));

      // Prioritize flash models, then pro models
      const prioritized = [
        ...activeModels.filter(m => m.includes('flash')),
        ...activeModels.filter(m => m.includes('pro')),
        ...activeModels
      ];

      if (prioritized.length > 0) {
        // Deduplicate
        modelsToTry = Array.from(new Set(prioritized));
        console.log(`Discovered available Gemini models: ${modelsToTry.slice(0, 5).join(', ')}...`);
      }
    }
  } catch (err) {
    console.warn('Could not query model list dynamically, using defaults:', err.message);
  }

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Model ${model} returned error status ${response.status}:`, errorText);
        continue;
      }

      const data = await response.json();
      aiSummary = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiSummary) {
        console.log(`✅ Successfully generated summary using ${model}.`);
        break;
      }
    } catch (apiErr) {
      console.warn(`Request failed for ${model}:`, apiErr.message);
    }
  }

  if (!aiSummary) {
    console.error('❌ Failed to generate summary from Gemini API with available models.');
    process.exit(1);
  }

  // 5. Assemble final PR body
  // If user already wrote custom notes, preserve them at the top
  let finalBody = '';
  const aiHeader = '## 🤖 Automated AI Summary';

  if (existingBody && !existingBody.includes(aiHeader)) {
    finalBody = `${existingBody}\n\n---\n\n${aiHeader}\n\n${aiSummary.trim()}`;
  } else {
    finalBody = `${aiHeader}\n\n${aiSummary.trim()}`;
  }

  // 6. Update PR via gh CLI
  console.log('📝 Updating PR description...');
  try {
    // Write body to temporary file to safely handle quotes and multiline formatting
    const fs = await import('node:fs');
    const path = await import('node:path');
    const tempFile = path.resolve('.pr_body_temp.md');
    fs.writeFileSync(tempFile, finalBody, 'utf-8');

    execSync(`gh pr edit ${prNumber} --body-file "${tempFile}"`, { encoding: 'utf-8' });
    fs.unlinkSync(tempFile);

    console.log(`🎉 Pull Request #${prNumber} description updated successfully!`);
  } catch (updateErr) {
    console.error('Failed to update PR description via gh CLI:', updateErr.message);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error in PR summary script:', err);
  process.exit(1);
});
