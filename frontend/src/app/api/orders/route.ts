import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '10';
    const search = searchParams.get('search') || '';
    const client_id = searchParams.get('client_id') || '';
    const location_id = searchParams.get('location_id') || '';
    const status = searchParams.get('status') || '';
    const sort_by = searchParams.get('sort_by') || '';
    const sort_order = searchParams.get('sort_order') || '';

    const params = new URLSearchParams({
      page,
      per_page,
    });

    if (search) {
      params.append('search', search);
    }

    if (client_id) {
      params.append('client_id', client_id);
    }

    if (location_id) {
      params.append('location_id', location_id);
    }

    if (status) {
      params.append('status', status);
    }

    if (sort_by) {
      params.append('sort_by', sort_by);
    }

    if (sort_order) {
      params.append('sort_order', sort_order);
    }

    console.log('Fetching from:', `${API_URL}/api/orders?${params.toString()}`);
    const res = await fetch(`${API_URL}/api/orders?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const text = await res.text();

    console.log('GET /api/orders response:', {
      status: res.status,
      contentType,
      bodyLength: text.length,
      bodyPreview: text.substring(0, 500),
      authHeader: authHeader?.substring(0, 20) + '...',
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
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const res = await fetch(`${API_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const text = await res.text();

    console.log('POST /api/orders response:', {
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
          error: data.message || 'Failed to create order',
          details: data.errors || data.detail || null,
          message: data.message || 'Failed to create order',
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
