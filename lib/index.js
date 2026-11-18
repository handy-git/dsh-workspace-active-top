import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

/**
 * dsh-workspace-active-top: 发消息时自动将当前会话所属工作区移到 codex 侧边栏同分区（置顶/项目）的最顶部
 *
 * 监听 api-session/activity 事件（用户消息写入时触发），
 * 1. 找到会话所属工作区及其在 codex sections 中的分区
 * 2. 在 workspaceRegistry 里把工作区移到同分区第一个工作区的前面
 * 3. 同步修改 workspace-sections.json，把 workspaceId 移到同分区首位
 */
export const inject = ['workspaceRegistry'];

/** 解析 codex-ui 的 sections 文件路径，对齐 codex-ui 的 resolveCurrentProfile 逻辑 */
function resolveSectionsPath(ctx) {
  // 优先走官方 profileContext 服务
  try {
    const profileContext = ctx.get('profileContext');
    if (profileContext?.dir) {
      return join(profileContext.dir, 'plugin-data', 'michengai.dsh-codex-ui', 'workspace-sections.json');
    }
  } catch {}
  // 回退到环境变量
  const profileDir = process.env.DSH_PROFILE_DIR;
  const base = profileDir ?? join(homedir(), '.dsh', 'profiles', 'web');
  return join(base, 'plugin-data', 'michengai.dsh-codex-ui', 'workspace-sections.json');
}

/** 读 sections 文件，失败返回 null */
function readSections(path) {
  try {
    if (!existsSync(path)) return null;
    const doc = JSON.parse(readFileSync(path, 'utf8'));
    if (!Array.isArray(doc?.sections)) return null;
    return doc;
  } catch {
    return null;
  }
}

/** 原子写 sections 文件 */
function writeSections(path, doc) {
  const payload = JSON.stringify(doc, null, 2);
  mkdirSync(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.tmp`;
  try {
    writeFileSync(tmp, payload, 'utf8');
    renameSync(tmp, path);
  } catch (err) {
    try { if (existsSync(tmp)) unlinkSync(tmp); } catch {}
    throw err;
  }
}

export function apply(ctx) {
  ctx.on('api-session/activity', (sessionId) => {
    const registry = ctx.workspaceRegistry;
    if (!registry) return;

    const workspaces = registry.list();
    if (workspaces.length < 2) return;

    // 找到包含该 session 的工作区
    const workspace = workspaces.find(ws =>
      ws.sessionIds && ws.sessionIds.includes(sessionId)
    );
    if (!workspace) return;

    const sectionsPath = resolveSectionsPath(ctx);
    const doc = readSections(sectionsPath);

    if (doc) {
      // 找到 workspace 所在的 section
      const section = doc.sections.find(s => s.ids.includes(workspace.id));
      if (section) {
        if (section.ids.length <= 1 || section.ids[0] === workspace.id) return; // 已是首位

        // 在 sections 文件里把 workspaceId 移到分区首位
        section.ids = [workspace.id, ...section.ids.filter(id => id !== workspace.id)];
        try { writeSections(sectionsPath, doc); } catch {}

        // 在 workspaceRegistry 里把工作区移到同分区的第一个兄弟工作区前面
        // 避免跨分区乱序：只在同分区内 insertBefore
        const siblingIds = new Set(section.ids.slice(1));
        const firstSibling = workspaces.find(ws => siblingIds.has(ws.id));
        if (firstSibling) {
          registry.insertBefore(workspace.id, firstSibling.id).catch(() => {});
        }
      } else {
        // 不在任何分区（未分组），回退：移到所有工作区最前
        if (workspaces[0].id !== workspace.id) {
          registry.insertBefore(workspace.id, workspaces[0].id).catch(() => {});
        }
      }
    } else {
      // 没有 sections 文件（未使用 codex 侧边栏），回退：移到所有工作区最前
      if (workspaces[0].id !== workspace.id) {
        registry.insertBefore(workspace.id, workspaces[0].id).catch(() => {});
      }
    }
  });
}
