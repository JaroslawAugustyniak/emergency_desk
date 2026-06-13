import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clientId } = await params;

    const res = await fetch(`${API_URL}/api/clients/${clientId}/regenerate-hash`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const text = await res.text();

    console.log(`POST /api/clients/${clientId}/regenerate-hash response:`, {
      status: res.status,
      contentType,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
    });

    if (!isJson) {
      console.error('Backend error - not JSON:', { status: res.status, text: text.substring(0, 500) });
      return NextResponse.json(
        { error: `Backend error: ${res.status}`, message: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON:', { error: String(e), text: text.substring(0, 500) });
      return NextResponse.json(
        { error: 'Failed to parse response', message: 'Backend returned invalid JSON' },
        { status: 500 }
      );
    }

    if (!res.ok) {
      console.error('API error:', {
        status: res.status,
        message: data.message,
        errors: data.errors,
      });

      return NextResponse.json(
        {
          error: data.message || 'Failed to regenerate hash',
          details: data.errors || data.detail || null,
          message: data.message || 'Failed to regenerate hash',
        },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
