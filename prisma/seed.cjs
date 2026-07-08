const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

const providers = [
  {
    id: 'prv_openai',
    name: 'OpenAI', slug: 'openai', description: 'GPT-4o, GPT-4.1, embeddings, vision, tools and structured output.',
    baseUrl: 'https://api.openai.com/v1', region: 'global', litellmId: 'openai', defaultModel: 'gpt-4o-mini',
    supportedFeatures: ['chat', 'vision', 'embeddings', 'tools', 'json-mode', 'streaming'],
    models: [
      { id: 'mdl_gpt4o_mini', name: 'gpt-4o-mini', slug: 'gpt-4o-mini', contextWindow: 128000, maxOutput: 16384, inputPricePer1k: 0.00015, outputPricePer1k: 0.0006, capabilities: ['chat','vision','tools','json'], modalities: ['text','image'] },
      { id: 'mdl_gpt4o', name: 'gpt-4o', slug: 'gpt-4o', contextWindow: 128000, maxOutput: 4096, inputPricePer1k: 0.005, outputPricePer1k: 0.015, capabilities: ['chat','vision','tools','json'], modalities: ['text','image'] },
      { id: 'mdl_text_embedding_3_small', name: 'text-embedding-3-small', slug: 'text-embedding-3-small', contextWindow: 8191, maxOutput: 0, inputPricePer1k: 0.00002, outputPricePer1k: 0, capabilities: ['embeddings'], modalities: ['text'] }
    ]
  },
  {
    id: 'prv_anthropic',
    name: 'Anthropic', slug: 'anthropic', description: 'Claude models with long context and strong reasoning.',
    baseUrl: 'https://api.anthropic.com/v1', region: 'global', litellmId: 'anthropic', defaultModel: 'claude-3-5-sonnet-latest',
    supportedFeatures: ['chat', 'vision', 'tools', 'streaming', 'long-context'],
    models: [
      { id: 'mdl_claude_sonnet', name: 'claude-3-5-sonnet-latest', slug: 'claude-3-5-sonnet-latest', contextWindow: 200000, maxOutput: 8192, inputPricePer1k: 0.003, outputPricePer1k: 0.015, capabilities: ['chat','vision','tools'], modalities: ['text','image'] },
      { id: 'mdl_claude_haiku', name: 'claude-3-5-haiku-latest', slug: 'claude-3-5-haiku-latest', contextWindow: 200000, maxOutput: 8192, inputPricePer1k: 0.0008, outputPricePer1k: 0.004, capabilities: ['chat','tools'], modalities: ['text'] }
    ]
  },
  {
    id: 'prv_gemini',
    name: 'Google Gemini', slug: 'google-gemini', description: 'Google AI Studio Gemini models.',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta', region: 'global', litellmId: 'gemini', defaultModel: 'gemini-1.5-flash',
    supportedFeatures: ['chat', 'vision', 'audio', 'long-context', 'streaming'],
    models: [
      { id: 'mdl_gemini_flash', name: 'gemini-1.5-flash', slug: 'gemini-1.5-flash', contextWindow: 1000000, maxOutput: 8192, inputPricePer1k: 0.000075, outputPricePer1k: 0.0003, capabilities: ['chat','vision','audio'], modalities: ['text','image','audio'] },
      { id: 'mdl_gemini_pro', name: 'gemini-1.5-pro', slug: 'gemini-1.5-pro', contextWindow: 2000000, maxOutput: 8192, inputPricePer1k: 0.00125, outputPricePer1k: 0.005, capabilities: ['chat','vision','audio'], modalities: ['text','image','audio'] }
    ]
  },
  {
    id: 'prv_openrouter',
    name: 'OpenRouter', slug: 'openrouter', description: 'OpenAI-compatible access to many model providers.',
    baseUrl: 'https://openrouter.ai/api/v1', region: 'global', litellmId: 'openrouter', defaultModel: 'openai/gpt-4o-mini',
    supportedFeatures: ['chat', 'vision', 'tools', 'streaming', 'routing'],
    models: [
      { id: 'mdl_openrouter_gpt4o_mini', name: 'openai/gpt-4o-mini', slug: 'openai-gpt-4o-mini', contextWindow: 128000, maxOutput: 16384, capabilities: ['chat','vision','tools'], modalities: ['text','image'] },
      { id: 'mdl_openrouter_claude', name: 'anthropic/claude-3.5-sonnet', slug: 'anthropic-claude-3-5-sonnet', contextWindow: 200000, maxOutput: 8192, capabilities: ['chat','vision','tools'], modalities: ['text','image'] }
    ]
  },
  {
    id: 'prv_groq',
    name: 'Groq', slug: 'groq', description: 'Ultra-fast OpenAI-compatible inference for open models.',
    baseUrl: 'https://api.groq.com/openai/v1', region: 'global', litellmId: 'groq', defaultModel: 'llama-3.1-70b-versatile',
    supportedFeatures: ['chat', 'streaming', 'tools'],
    models: [
      { id: 'mdl_groq_llama70b', name: 'llama-3.1-70b-versatile', slug: 'llama-3-1-70b-versatile', contextWindow: 131072, maxOutput: 8192, capabilities: ['chat','tools'], modalities: ['text'] },
      { id: 'mdl_groq_llama8b', name: 'llama-3.1-8b-instant', slug: 'llama-3-1-8b-instant', contextWindow: 131072, maxOutput: 8192, capabilities: ['chat'], modalities: ['text'] }
    ]
  },
  {
    id: 'prv_deepseek',
    name: 'DeepSeek', slug: 'deepseek', description: 'OpenAI-compatible DeepSeek reasoning and coding models.',
    baseUrl: 'https://api.deepseek.com/v1', region: 'global', litellmId: 'deepseek', defaultModel: 'deepseek-chat',
    supportedFeatures: ['chat', 'reasoning', 'coding', 'streaming'],
    models: [
      { id: 'mdl_deepseek_chat', name: 'deepseek-chat', slug: 'deepseek-chat', contextWindow: 64000, maxOutput: 8192, capabilities: ['chat','coding'], modalities: ['text'] },
      { id: 'mdl_deepseek_reasoner', name: 'deepseek-reasoner', slug: 'deepseek-reasoner', contextWindow: 64000, maxOutput: 8192, capabilities: ['chat','reasoning'], modalities: ['text'] }
    ]
  }
];

const permissions = [
  ['providers:read','View providers','Providers'], ['providers:write','Manage providers','Providers'],
  ['api-keys:read','View gateway API keys','API Keys'], ['api-keys:write','Manage gateway API keys','API Keys'],
  ['models:read','View models','Models'], ['usage:read','View usage analytics','Analytics'],
  ['playground:use','Use AI playground','Playground'], ['admin:all','Full admin access','Admin']
];

function hashKey(key){ return crypto.createHash('sha256').update(key).digest('hex'); }
function maskKey(key){ return key.length > 12 ? `${key.slice(0,4)}••••••••${key.slice(-4)}` : '••••••••'; }

async function main(){
  for (const p of providers) {
    const { models, ...provider } = p;
    await prisma.provider.upsert({ where: { id: provider.id }, update: provider, create: provider });
    for (const m of models) {
      await prisma.model.upsert({
        where: { id: m.id },
        update: { ...m, providerId: provider.id, providerName: provider.name, description: `${m.name} via ${provider.name}` },
        create: { ...m, providerId: provider.id, providerName: provider.name, description: `${m.name} via ${provider.name}` }
      });
    }
    await prisma.healthCheck.upsert({
      where: { id: `health_${provider.id}` },
      update: { providerId: provider.id, providerName: provider.name, status: 'healthy', latencyMs: provider.id === 'prv_groq' ? 80 : 180, region: provider.region, details: { connectivity: true, authentication: false, rateLimit: 0, quotaRemaining: 0 } },
      create: { id: `health_${provider.id}`, providerId: provider.id, providerName: provider.name, status: 'healthy', latencyMs: provider.id === 'prv_groq' ? 80 : 180, uptimePct: 99.99, incidents: 0, region: provider.region, details: { connectivity: true, authentication: false, rateLimit: 0, quotaRemaining: 0 } }
    });
  }

  const adminKey = process.env.MOATAZ_BOOTSTRAP_API_KEY || 'nx_demo_change_me';
  await prisma.apiKey.upsert({
    where: { keyHash: hashKey(adminKey) },
    update: {},
    create: { id: 'key_admin_demo', name: 'Default Admin Key', keyPrefix: 'nx_demo', keyHash: hashKey(adminKey), maskedKey: maskKey(adminKey), scopes: ['chat','completions','embeddings','vision','function-calling'], usageLimit: 1000000, createdBy: 'System' }
  });

  for (const [name, description, category] of permissions) {
    await prisma.permission.upsert({ where: { name }, update: { description, category }, create: { name, description, category } });
  }

  await prisma.role.upsert({ where: { name: 'Admin' }, update: { permissions: permissions.map(p => p[0]) }, create: { id: 'role_admin', name: 'Admin', description: 'Full system administrator', isSystem: true, permissions: permissions.map(p => p[0]) } });
  await prisma.role.upsert({ where: { name: 'Developer' }, update: {}, create: { id: 'role_developer', name: 'Developer', description: 'Can use playground and manage API keys', isSystem: true, permissions: ['providers:read','api-keys:read','api-keys:write','models:read','playground:use','usage:read'] } });

  await prisma.teamMember.upsert({ where: { email: 'admin@moataz.local' }, update: {}, create: { id: 'member_admin', userId: 'usr_admin', name: 'Admin User', email: 'admin@moataz.local', role: 'Admin', roleId: 'role_admin', status: 'active', lastActiveAt: new Date(), permissions: permissions.map(p => p[0]) } });

  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const req = Math.floor(50 + Math.random()*400);
    await prisma.usageDaily.upsert({
      where: { date_providerName_modelName: { date, providerName: 'OpenAI', modelName: 'gpt-4o-mini' } },
      update: { requestCount: req, tokenCount: req*700, inputTokens: req*450, outputTokens: req*250, cost: Number((req*0.0009).toFixed(4)), avgLatencyMs: 220, errorCount: Math.floor(req*0.01) },
      create: { date, providerId: 'prv_openai', providerName: 'OpenAI', modelId: 'mdl_gpt4o_mini', modelName: 'gpt-4o-mini', requestCount: req, tokenCount: req*700, inputTokens: req*450, outputTokens: req*250, cost: Number((req*0.0009).toFixed(4)), avgLatencyMs: 220, errorCount: Math.floor(req*0.01) }
    });
  }

  await prisma.auditLog.upsert({ where: { id: 'audit_bootstrap' }, update: {}, create: { id: 'audit_bootstrap', actorName: 'System', action: 'SYSTEM', target: 'Database', status: 'success', metadata: { message: 'Initial Railway bootstrap and seed completed' } } });
  await prisma.appNotification.upsert({ where: { id: 'notif_welcome' }, update: {}, create: { id: 'notif_welcome', title: 'Gateway is ready', message: 'Add provider API keys from Providers page, then test the Playground.', type: 'success' } });

  console.log('✅ Moataz AI Gateway database seeded successfully.');
}

main().catch((e)=>{ console.error(e); process.exit(1); }).finally(async()=>{ await prisma.$disconnect(); });
