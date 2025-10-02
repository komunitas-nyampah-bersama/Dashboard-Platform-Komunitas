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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Gagal menjalankan MCP server:', error);
  process.exit(1);
});
