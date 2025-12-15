export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
export class ConversationMemory implements DurableObject {
  private state: DurableObjectState;
  private sql: SqlStorage;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sql = state.storage.sql;

    this.sql.exec(`
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp INTEGER NOT NULL
            )
        `);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname === '/history' && request.method === 'GET') {
        const messages = this.getMessages();
        return new Response(
          JSON.stringify({
            success: true,
            data: {
              messages,
              sessionId: this.state.id.toString(),
              messageCount: messages.length,
            },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // add message
      if (url.pathname === '/message' && request.method === 'POST') {
        const { role, content } = (await request.json()) as {
          role: 'user' | 'assistant';
          content: string;
        };
        this.addMessage(role, content);
        return new Response(
          JSON.stringify({
            success: true,
            data: { message: 'Message added' },
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      // clear history
      if (url.pathname === '/clear' && request.method === 'DELETE') {
        this.clearHistory();
        return new Response(
          JSON.stringify({
            success: true,
            data: { message: 'History cleared' },
            timestamp: new Date().toISOString(),
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      return new Response('Not found', { status: 404 });
    } catch (error) {
      console.error('Durable Object error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.sql.exec(
      'INSERT INTO messages (role, content, timestamp) VALUES (?, ?, ?)',
      role,
      content,
      Date.now(),
    );
  }

  private getMessages(): Message[] {
    const rows = this.sql
      .exec('SELECT role, content, timestamp FROM messages ORDER BY id ASC')
      .toArray();

    return rows.map((row) => ({
      role: row.role as 'user' | 'assistant',
      content: row.content as string,
      timestamp: row.timestamp as number,
    }));
  }

  private clearHistory(): void {
    this.sql.exec('DELETE FROM messages');
  }
}
