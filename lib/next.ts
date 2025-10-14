export interface NextRequest {
  readonly url: string;
}

export class NextResponse {
  private readonly headers: Record<string, string> = {};

  static next(): NextResponse {
    return new NextResponse();
  }

  setHeader(name: string, value: string): void {
    this.headers[name.toLowerCase()] = value;
  }

  getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()];
  }
}
