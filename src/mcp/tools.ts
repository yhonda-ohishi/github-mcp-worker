import type { MCPTool } from "../types";

// GitHub API base URL
const GITHUB_API = "https://api.github.com";

// GitHub API request helper
async function githubFetch(endpoint: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${GITHUB_API}${endpoint}`, {
    ...options,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "GitHub-MCP-Server/1.0",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error: ${response.status} ${error}`);
  }

  return response.json();
}

// Tool definitions
export const tools: MCPTool[] = [
  {
    name: "list_repos",
    description: "List repositories for the authenticated user",
    inputSchema: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["all", "owner", "public", "private", "member"], description: "Type of repositories to list" },
        sort: { type: "string", enum: ["created", "updated", "pushed", "full_name"], description: "Sort field" },
        per_page: { type: "number", description: "Results per page (max 100)" },
        page: { type: "number", description: "Page number" },
      },
    },
  },
  {
    name: "get_repo",
    description: "Get a repository by owner and name",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "create_repo",
    description: "Create a new repository",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Repository name" },
        description: { type: "string", description: "Repository description" },
        private: { type: "boolean", description: "Whether the repository is private" },
        auto_init: { type: "boolean", description: "Initialize with README" },
      },
      required: ["name"],
    },
  },
  {
    name: "get_contents",
    description: "Get contents of a file or directory in a repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "Path to file or directory" },
        ref: { type: "string", description: "Branch, tag, or commit SHA" },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "get_file_content",
    description: "Get decoded content of a file in a repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "Path to file" },
        ref: { type: "string", description: "Branch, tag, or commit SHA" },
      },
      required: ["owner", "repo", "path"],
    },
  },
  {
    name: "create_or_update_file",
    description: "Create or update a file in a repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        path: { type: "string", description: "Path to file" },
        message: { type: "string", description: "Commit message" },
        content: { type: "string", description: "File content (will be base64 encoded)" },
        branch: { type: "string", description: "Branch name" },
        sha: { type: "string", description: "SHA of file being replaced (required for updates)" },
      },
      required: ["owner", "repo", "path", "message", "content"],
    },
  },
  {
    name: "list_issues",
    description: "List issues in a repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        state: { type: "string", enum: ["open", "closed", "all"], description: "Issue state" },
        labels: { type: "string", description: "Comma-separated list of labels" },
        per_page: { type: "number", description: "Results per page (max 100)" },
        page: { type: "number", description: "Page number" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "get_issue",
    description: "Get a specific issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number" },
      },
      required: ["owner", "repo", "issue_number"],
    },
  },
  {
    name: "create_issue",
    description: "Create a new issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        title: { type: "string", description: "Issue title" },
        body: { type: "string", description: "Issue body" },
        labels: { type: "array", items: { type: "string" }, description: "Labels to add" },
        assignees: { type: "array", items: { type: "string" }, description: "Assignees" },
      },
      required: ["owner", "repo", "title"],
    },
  },
  {
    name: "update_issue",
    description: "Update an existing issue",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        issue_number: { type: "number", description: "Issue number" },
        title: { type: "string", description: "Issue title" },
        body: { type: "string", description: "Issue body" },
        state: { type: "string", enum: ["open", "closed"], description: "Issue state" },
        labels: { type: "array", items: { type: "string" }, description: "Labels" },
      },
      required: ["owner", "repo", "issue_number"],
    },
  },
  {
    name: "list_branches",
    description: "List branches in a repository",
    inputSchema: {
      type: "object",
      properties: {
        owner: { type: "string", description: "Repository owner" },
        repo: { type: "string", description: "Repository name" },
        per_page: { type: "number", description: "Results per page (max 100)" },
        page: { type: "number", description: "Page number" },
      },
      required: ["owner", "repo"],
    },
  },
  {
    name: "search_repos",
    description: "Search for repositories",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query" },
        sort: { type: "string", enum: ["stars", "forks", "help-wanted-issues", "updated"], description: "Sort field" },
        order: { type: "string", enum: ["asc", "desc"], description: "Sort order" },
        per_page: { type: "number", description: "Results per page (max 100)" },
        page: { type: "number", description: "Page number" },
      },
      required: ["q"],
    },
  },
  {
    name: "search_code",
    description: "Search for code",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Search query" },
        sort: { type: "string", enum: ["indexed"], description: "Sort field" },
        order: { type: "string", enum: ["asc", "desc"], description: "Sort order" },
        per_page: { type: "number", description: "Results per page (max 100)" },
        page: { type: "number", description: "Page number" },
      },
      required: ["q"],
    },
  },
];

// Tool execution
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  token: string
): Promise<unknown> {
  switch (name) {
    case "list_repos": {
      const params = new URLSearchParams();
      if (args.type) params.set("type", args.type as string);
      if (args.sort) params.set("sort", args.sort as string);
      if (args.per_page) params.set("per_page", String(args.per_page));
      if (args.page) params.set("page", String(args.page));
      return githubFetch(`/user/repos?${params}`, token);
    }

    case "get_repo":
      return githubFetch(`/repos/${args.owner}/${args.repo}`, token);

    case "create_repo":
      return githubFetch("/user/repos", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: args.name,
          description: args.description,
          private: args.private,
          auto_init: args.auto_init,
        }),
      });

    case "get_contents": {
      const params = new URLSearchParams();
      if (args.ref) params.set("ref", args.ref as string);
      const query = params.toString() ? `?${params}` : "";
      return githubFetch(`/repos/${args.owner}/${args.repo}/contents/${args.path}${query}`, token);
    }

    case "get_file_content": {
      const params = new URLSearchParams();
      if (args.ref) params.set("ref", args.ref as string);
      const query = params.toString() ? `?${params}` : "";
      const content = await githubFetch(`/repos/${args.owner}/${args.repo}/contents/${args.path}${query}`, token) as { content?: string; encoding?: string };

      if (content.content && content.encoding === "base64") {
        return {
          ...content,
          decoded_content: atob(content.content.replace(/\n/g, "")),
        };
      }
      return content;
    }

    case "create_or_update_file":
      return githubFetch(`/repos/${args.owner}/${args.repo}/contents/${args.path}`, token, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: args.message,
          content: btoa(args.content as string),
          branch: args.branch,
          sha: args.sha,
        }),
      });

    case "list_issues": {
      const params = new URLSearchParams();
      if (args.state) params.set("state", args.state as string);
      if (args.labels) params.set("labels", args.labels as string);
      if (args.per_page) params.set("per_page", String(args.per_page));
      if (args.page) params.set("page", String(args.page));
      return githubFetch(`/repos/${args.owner}/${args.repo}/issues?${params}`, token);
    }

    case "get_issue":
      return githubFetch(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`, token);

    case "create_issue":
      return githubFetch(`/repos/${args.owner}/${args.repo}/issues`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: args.title,
          body: args.body,
          labels: args.labels,
          assignees: args.assignees,
        }),
      });

    case "update_issue":
      return githubFetch(`/repos/${args.owner}/${args.repo}/issues/${args.issue_number}`, token, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: args.title,
          body: args.body,
          state: args.state,
          labels: args.labels,
        }),
      });

    case "list_branches": {
      const params = new URLSearchParams();
      if (args.per_page) params.set("per_page", String(args.per_page));
      if (args.page) params.set("page", String(args.page));
      return githubFetch(`/repos/${args.owner}/${args.repo}/branches?${params}`, token);
    }

    case "search_repos": {
      const params = new URLSearchParams();
      params.set("q", args.q as string);
      if (args.sort) params.set("sort", args.sort as string);
      if (args.order) params.set("order", args.order as string);
      if (args.per_page) params.set("per_page", String(args.per_page));
      if (args.page) params.set("page", String(args.page));
      return githubFetch(`/search/repositories?${params}`, token);
    }

    case "search_code": {
      const params = new URLSearchParams();
      params.set("q", args.q as string);
      if (args.sort) params.set("sort", args.sort as string);
      if (args.order) params.set("order", args.order as string);
      if (args.per_page) params.set("per_page", String(args.per_page));
      if (args.page) params.set("page", String(args.page));
      return githubFetch(`/search/code?${params}`, token);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
