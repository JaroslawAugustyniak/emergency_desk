import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();

    const response = await fetch(`${API_URL}/api/photos/temporary`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
      },
      body: formData,
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const text = await response.text();

    console.log('POST /api/photos/temporary response:', {
      status: response.status,
      contentType,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
    });

    if (!isJson) {
      console.error('Backend error - not JSON:', { status: response.status, text: text.substring(0, 500) });
      return NextResponse.json(
        { error: `Backend error: ${response.status}`, message: 'Backend returned invalid response' },
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

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
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
