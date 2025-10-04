#!/usr/bin/env node
/**
 * MCP server exposing Dashboard Platform Komunitas datasets and project files to ChatGPT Actions.
 */
const path = require('path');
const fs = require('fs/promises');
const { execFile } = require('child_process');
const { promisify } = require('util');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const execFileAsync = promisify(execFile);
const projectRoot = path.resolve(__dirname, '..');
const datasetDir = path.join(projectRoot, 'Master_json');
const allowedExtensions = new Set([
  '.md',
  '.markdown',
  '.json',
  '.html',
  '.txt',
  '.css',
  '.js'
]);

const SUPABASE_MCP_DEFAULT_URL =
  'https://mcp.supabase.com/mcp?project_ref=vyvcgejvmdejssaysiny&read_only=true';
const supabaseMcpUrlInput = process.env.SUPABASE_MCP_URL || SUPABASE_MCP_DEFAULT_URL;
let supabaseBaseUrl = null;

try {
  supabaseBaseUrl = new URL(supabaseMcpUrlInput);
} catch (error) {
  console.warn('Konfigurasi SUPABASE_MCP_URL tidak valid:', error.message);
}

const supabaseMcpKey =
  process.env.SUPABASE_MCP_ANON_KEY ||
  process.env.SUPABASE_MCP_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_MCP_API_KEY ||
  null;

const supabaseExtraHeaders = (() => {
  const raw = process.env.SUPABASE_MCP_HEADERS;
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.fromEntries(
        Object.entries(parsed).map(([key, value]) => [String(key).toLowerCase(), String(value)])
      );
    }
  } catch (error) {
    console.warn('Gagal mengurai SUPABASE_MCP_HEADERS:', error.message);
  }

  return {};
})();

const sensitiveHeaderNames = new Set(['authorization', 'apikey', 'api-key', 'supabase-key']);

const server = new McpServer(
  {
    name: 'komunitas-mcp-server',
    version: '0.1.0'
  },
  {
    instructions:
      'Gunakan tool untuk membaca dataset Master_json, menelusuri file proyek, dan melakukan pencarian cepat. ' +
      'Seluruh path harus relatif terhadap root repositori dan hanya tipe file teks yang diperbolehkan.'
  }
);

function sanitizeHeadersForOutput(record) {
  if (!record || typeof record !== 'object') {
    return {};
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (sensitiveHeaderNames.has(key.toLowerCase())) {
        return [key, '***'];
      }
      return [key, value];
    })
  );
}

function buildSupabaseHeaders(overrides = {}, accept) {
  const headers = {
    accept: accept || 'application/json',
    ...supabaseExtraHeaders
  };

  if (supabaseMcpKey) {
    headers.authorization = `Bearer ${supabaseMcpKey}`;
    headers.apikey = supabaseMcpKey;
  }

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === null) {
      continue;
    }
    headers[String(key).toLowerCase()] = String(value);
  }

  return headers;
}

function resolveSupabaseUrl(pathSegment = '', query = {}) {
  if (!supabaseBaseUrl) {
    throw new Error('SUPABASE_MCP_URL belum dikonfigurasi dengan benar.');
  }

  let targetUrl = new URL(supabaseBaseUrl.toString());

  if (pathSegment) {
    if (/^https?:\/\//i.test(pathSegment)) {
      targetUrl = new URL(pathSegment);
    } else if (pathSegment.startsWith('/')) {
      targetUrl.pathname = pathSegment;
    } else {
      const basePath = targetUrl.pathname.endsWith('/')
        ? targetUrl.pathname
        : `${targetUrl.pathname}/`;
      targetUrl.pathname = `${basePath}${pathSegment}`.replace(/\/{2,}/g, '/');
    }
  }

  for (const [key, value] of Object.entries(query || {})) {
    if (value === undefined || value === null) {
      continue;
    }
    targetUrl.searchParams.set(key, String(value));
  }

  return targetUrl;
}

async function requestSupabaseMcp(options = {}) {
  const {
    path: pathSegment = '',
    method = 'GET',
    query = {},
    body,
    headers = {},
    accept
  } = options;

  if (!globalThis.fetch) {
    throw new Error('Lingkungan Node.js tidak mendukung fetch. Gunakan Node.js 18+');
  }

  const normalizedMethod = String(method || 'GET').toUpperCase();
  if (['GET', 'HEAD'].includes(normalizedMethod) && body !== undefined && body !== null) {
    throw new Error('Permintaan GET/HEAD tidak boleh memiliki body.');
  }

  const url = resolveSupabaseUrl(pathSegment, query);
  const requestHeaders = buildSupabaseHeaders(headers, accept);

  let serializedBody;
  if (body !== undefined && body !== null) {
    if (typeof body === 'string') {
      serializedBody = body;
    } else {
      serializedBody = JSON.stringify(body);
      if (!requestHeaders['content-type']) {
        requestHeaders['content-type'] = 'application/json';
      }
    }
  }

  const response = await fetch(url, {
    method: normalizedMethod,
    headers: requestHeaders,
    body: serializedBody
  });

  const text = await response.text();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch (error) {
      json = null;
    }
  }

  const rawHeaders = Object.fromEntries(response.headers.entries());
  const maxPreviewLength = 20000;
  const preview =
    text.length > maxPreviewLength
      ? `${text.slice(0, maxPreviewLength)}\n...[dipotong setelah ${maxPreviewLength} karakter]`
      : text;

  return {
    url: url.toString(),
    status: response.status,
    ok: response.ok,
    headers: rawHeaders,
    bodyText: preview,
    json
  };
}

async function safeReadFile(relativePath) {
  const normalized = relativePath.replace(/^\/+/, '');
  if (!normalized) {
    throw new Error('Path tidak boleh kosong.');
  }

  const resolved = path.resolve(projectRoot, normalized);
  if (!resolved.startsWith(projectRoot)) {
    throw new Error('Path harus berada di dalam repositori.');
  }

  if (resolved.includes(`${path.sep}node_modules${path.sep}`) || resolved.includes(`${path.sep}.git${path.sep}`)) {
    throw new Error('Akses ke direktori terlarang.');
  }

  const ext = path.extname(resolved).toLowerCase();
  if (!allowedExtensions.has(ext)) {
    throw new Error('Ekstensi file tidak diizinkan untuk dibaca melalui server MCP.');
  }

  const stat = await fs.stat(resolved);
  if (!stat.isFile()) {
    throw new Error('Path harus mengarah ke file.');
  }

  const text = await fs.readFile(resolved, 'utf8');
  return { text, stat, resolved };
}

async function listDatasets() {
  let entries = [];
  try {
    entries = await fs.readdir(datasetDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw new Error(`Gagal membaca direktori dataset: ${error.message}`);
  }
  return entries
    .filter((entry) => entry.isFile() && path.extname(entry.name).toLowerCase() === '.json')
    .map((entry) => ({
      name: entry.name.replace(/\.json$/i, ''),
      fileName: entry.name,
      uri: `komunitas://dataset/${entry.name}`
    }));
}

async function runRipgrep(query, maxResults) {
  const limit = Number.isFinite(maxResults) ? maxResults : 5;
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const args = [
    '--json',
    '--max-filesize',
    '200K',
    '--max-count',
    String(safeLimit),
    '--glob',
    '!node_modules/**',
    '--glob',
    '!.git/**',
    query,
    projectRoot
  ];

  try {
    const { stdout } = await execFileAsync('rg', args, { cwd: projectRoot });
    const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
    const matches = [];

    for (const line of lines) {
      let event;
      try {
        event = JSON.parse(line);
      } catch (parseError) {
        continue;
      }

      if (event.type === 'match') {
        matches.push({
          file: path.relative(projectRoot, event.data.path.text),
          line: event.data.line_number,
          preview: event.data.lines.text.trim()
        });
        if (matches.length >= safeLimit) {
          break;
        }
      }
    }

    return matches;
  } catch (error) {
    // ripgrep returns code 1 when no matches are found; treat as empty result
    if (error.code === 1) {
      return [];
    }
    throw new Error(`Pencarian rg gagal: ${error.message}`);
  }
}

server.registerResource(
  'project-overview',
  'komunitas://docs/overview',
  {
    title: 'Ringkasan Platform Komunitas',
    description: 'Isi lengkap README.md sebagai konteks utama proyek',
    mimeType: 'text/markdown'
  },
  async () => {
    const text = await fs.readFile(path.join(projectRoot, 'README.md'), 'utf8');
    return {
      contents: [
        {
          uri: 'komunitas://docs/overview',
          mimeType: 'text/markdown',
          text
        }
      ]
    };
  }
);

server.registerResource(
  'datasets-catalog',
  'komunitas://datasets/index',
  {
    title: 'Katalog Dataset JSON',
    description: 'Daftar dataset strategis dari folder Master_json',
    mimeType: 'application/json'
  },
  async () => {
    const datasets = await listDatasets();
    return {
      contents: [
        {
          uri: 'komunitas://datasets/index',
          mimeType: 'application/json',
          text: JSON.stringify(datasets, null, 2)
        }
      ]
    };
  }
);

server.registerResource(
  'supabase-mcp-bridge',
  'komunitas://external/supabase-mcp',
  {
    title: 'Bridge Supabase MCP',
    description:
      'Ringkasan konfigurasi bridge ke MCP Supabase serta petunjuk penggunaan tool supabase-mcp-request.',
    mimeType: 'application/json'
  },
  async () => {
    const payload = {
      defaultUrl: SUPABASE_MCP_DEFAULT_URL,
      configuredUrl: supabaseBaseUrl ? supabaseBaseUrl.toString() : null,
      requiresApiKey: true,
      apiKeyConfigured: Boolean(supabaseMcpKey),
      extraHeadersConfigured: Object.keys(supabaseExtraHeaders),
      environmentVariables: {
        SUPABASE_MCP_URL: 'Opsional — ubah endpoint dasar Supabase MCP.',
        SUPABASE_MCP_ANON_KEY: 'Opsional — kunci publik (akan digunakan juga sebagai Authorization Bearer).',
        SUPABASE_MCP_SERVICE_ROLE_KEY: 'Alternatif untuk kunci layanan — gunakan dengan hati-hati.',
        SUPABASE_MCP_API_KEY: 'Alias lain untuk kunci Supabase.',
        SUPABASE_MCP_HEADERS:
          'JSON string opsional untuk menambah header kustom (contoh: {"x-client-info":"komunitas-mcp"}).'
      },
      usage: {
        tool: 'supabase-mcp-request',
        description:
          'Gunakan tool untuk meneruskan permintaan HTTP ke endpoint MCP Supabase, lengkap dengan query, header, dan body opsional.'
      }
    };

    return {
      contents: [
        {
          uri: 'komunitas://external/supabase-mcp',
          mimeType: 'application/json',
          text: JSON.stringify(payload, null, 2)
        }
      ]
    };
  }
);

server.registerTool(
  'list-datasets',
  {
    title: 'Daftar Dataset Master_json',
    description: 'Mengembalikan daftar dataset JSON yang tersedia beserta URI MCP',
    outputSchema: {
      datasets: z.array(
        z.object({
          name: z.string(),
          fileName: z.string(),
          uri: z.string()
        })
      )
    }
  },
  async () => {
    const datasets = await listDatasets();
    const summary = datasets
      .map((dataset, index) => `${index + 1}. ${dataset.name} → ${dataset.uri}`)
      .join('\n');

    return {
      structuredContent: { datasets },
      content: [
        {
          type: 'text',
          text: datasets.length
            ? `Dataset tersedia:\n${summary}`
            : 'Tidak ditemukan dataset di folder Master_json.'
        }
      ]
    };
  }
);

server.registerTool(
  'get-dataset',
  {
    title: 'Baca Dataset JSON',
    description: 'Mengambil isi dataset tertentu dari folder Master_json',
    inputSchema: {
      name: z.string().describe('Nama file dataset tanpa ekstensi .json')
    },
    outputSchema: {
      name: z.string(),
      uri: z.string(),
      data: z.any()
    }
  },
  async ({ name }) => {
    const safeName = name.trim();
    if (!safeName) {
      throw new Error('Nama dataset tidak boleh kosong.');
    }

    const fileName = `${safeName}.json`;
    const filePath = path.join(datasetDir, path.basename(fileName));
    const uri = `komunitas://dataset/${fileName}`;

    const text = await fs.readFile(filePath, 'utf8');
    let formatted = text;
    let jsonData = null;

    try {
      jsonData = JSON.parse(text);
      formatted = JSON.stringify(jsonData, null, 2);
    } catch (error) {
      // file berisi teks non-JSON yang valid; kembalikan apa adanya
      formatted = text;
      jsonData = null;
    }

    return {
      structuredContent: {
        name: safeName,
        uri,
        data: jsonData
      },
      content: [
        {
          type: 'text',
          text: `Konten ${safeName}.json:\n\n\`\`\`json\n${formatted}\n\`\`\``
        }
      ]
    };
  }
);

server.registerTool(
  'read-project-file',
  {
    title: 'Baca File Proyek',
    description: 'Membaca file teks dari repositori dengan pembatasan keamanan',
    inputSchema: {
      path: z.string().describe('Path relatif file, contoh: components/README.md')
    },
    outputSchema: {
      path: z.string(),
      size: z.number(),
      modified: z.string()
    }
  },
  async ({ path: relativePath }) => {
    const { text, stat, resolved } = await safeReadFile(relativePath);
    const relative = path.relative(projectRoot, resolved);

    return {
      structuredContent: {
        path: relative,
        size: stat.size,
        modified: stat.mtime.toISOString()
      },
      content: [
        {
          type: 'text',
          text: `Isi ${relative}:\n\n${text}`
        }
      ]
    };
  }
);

server.registerTool(
  'search-repo',
  {
    title: 'Cari Teks di Repositori',
    description: 'Melakukan pencarian teks menggunakan ripgrep dengan batasan hasil',
    inputSchema: {
      query: z.string().min(2).describe('Kata kunci pencarian (minimal 2 karakter)'),
      maxResults: z.number().int().positive().max(20).default(5).describe('Batas jumlah hasil (maksimal 20)')
    },
    outputSchema: {
      matches: z.array(
        z.object({
          file: z.string(),
          line: z.number(),
          preview: z.string()
        })
      )
    }
  },
  async ({ query, maxResults = 5 }) => {
    const matches = await runRipgrep(query, maxResults);
    const summary = matches.length
      ? matches
          .map((match) => `${match.file}:${match.line} → ${match.preview}`)
          .join('\n')
      : 'Tidak ada hasil yang ditemukan.';

    return {
      structuredContent: { matches },
      content: [
        {
          type: 'text',
          text: `Hasil pencarian untuk "${query}":\n${summary}`
        }
      ]
    };
  }
);

server.registerTool(
  'supabase-mcp-request',
  {
    title: 'Proxy Permintaan ke Supabase MCP',
    description:
      'Meneruskan permintaan HTTP ke endpoint MCP Supabase yang dikonfigurasi, lengkap dengan query, header, dan body opsional.',
    inputSchema: {
      path: z
        .string()
        .optional()
        .describe('Path relatif atau absolut untuk diteruskan (default mempertahankan endpoint dasar).'),
      method: z
        .enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'])
        .default('GET')
        .describe('Metode HTTP yang digunakan (default: GET).'),
      query: z
        .record(z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .describe('Parameter query opsional sebagai pasangan kunci → nilai.'),
      body: z
        .union([z.string(), z.record(z.any())])
        .optional()
        .describe('Isi permintaan untuk metode tulis. Terima string atau objek JSON.'),
      headers: z
        .record(z.string())
        .optional()
        .describe('Header tambahan (nilai string) yang akan digabungkan dengan konfigurasi default.'),
      accept: z.string().optional().describe('Header Accept kustom.'),
      parseJson: z
        .boolean()
        .default(true)
        .describe('Apakah mencoba mengurai respons sebagai JSON untuk structuredContent.')
    },
    outputSchema: {
      request: z.object({
        url: z.string(),
        method: z.string(),
        headers: z.record(z.string()),
        query: z.record(z.string()).optional(),
        bodyPreview: z.string().optional()
      }),
      response: z.object({
        status: z.number().int(),
        ok: z.boolean(),
        headers: z.record(z.string()),
        bodyText: z.string(),
        json: z.any().optional()
      })
    }
  },
  async ({
    path: pathSegment = '',
    method = 'GET',
    query = {},
    body,
    headers = {},
    accept,
    parseJson = true
  }) => {
    if (!supabaseBaseUrl) {
      throw new Error('Endpoint Supabase MCP belum dikonfigurasi dengan benar.');
    }

    const queryEntries = Object.entries(query || {});
    if (queryEntries.length > 25) {
      throw new Error('Jumlah parameter query melebihi batas aman (maksimal 25).');
    }

    const normalizedQuery = Object.fromEntries(
      queryEntries.map(([key, value]) => [key, typeof value === 'string' ? value : String(value)])
    );

    const requestPreviewLimit = 8000;
    let requestBodyPayload = body;
    let requestBodyPreview = '';

    if (body !== undefined && body !== null) {
      if (typeof body === 'string') {
        requestBodyPreview = body;
      } else {
        requestBodyPayload = body;
        requestBodyPreview = JSON.stringify(body, null, 2);
      }

      if (requestBodyPreview.length > requestPreviewLimit) {
        requestBodyPreview = `${requestBodyPreview.slice(0, requestPreviewLimit)}\n...[dipotong setelah ${requestPreviewLimit} karakter]`;
      }
    }

    let result;
    try {
      result = await requestSupabaseMcp({
        path: pathSegment,
        method,
        query: normalizedQuery,
        body: requestBodyPayload,
        headers,
        accept
      });
    } catch (error) {
      throw new Error(`Permintaan ke Supabase MCP gagal: ${error.message}`);
    }

    const sanitizedRequestHeaders = sanitizeHeadersForOutput(
      buildSupabaseHeaders(headers, accept)
    );
    const sanitizedResponseHeaders = sanitizeHeadersForOutput(result.headers);

    const summaryLines = [
      `URL: ${result.url}`,
      `Metode: ${String(method).toUpperCase()}`,
      `Status: ${result.status} (${result.ok ? 'berhasil' : 'gagal'})`,
      '--- Respons ---',
      result.bodyText || '(tanpa konten)'
    ];

    const structuredContent = {
      request: {
        url: result.url,
        method: String(method).toUpperCase(),
        headers: sanitizedRequestHeaders,
        query: queryEntries.length ? normalizedQuery : undefined,
        bodyPreview: requestBodyPreview ? requestBodyPreview : undefined
      },
      response: {
        status: result.status,
        ok: result.ok,
        headers: sanitizedResponseHeaders,
        bodyText: result.bodyText
      }
    };

    if (parseJson && result.json !== null) {
      structuredContent.response.json = result.json;
    }

    return {
      structuredContent,
      content: [
        {
          type: 'text',
          text: `Respons Supabase MCP:\n${summaryLines.join('\n')}`
        }
      ]
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Gagal menjalankan MCP server:', error);
  process.exit(1);
});
