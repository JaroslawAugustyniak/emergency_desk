import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const client_id = searchParams.get('client_id');
    const page = searchParams.get('page') || '1';
    const per_page = searchParams.get('per_page') || '100';

    if (!client_id) {
      return NextResponse.json({ error: 'client_id is required' }, { status: 400 });
    }

    const params = new URLSearchParams({
      client_id,
      page,
      per_page,
    });

    const res = await fetch(`${API_URL}/api/service-categories?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const text = await res.text();

    if (!isJson) {
      return NextResponse.json(
        { error: `Backend error: ${res.status}`, message: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse response', message: 'Backend returned invalid JSON' },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch service categories' },
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

    const res = await fetch(`${API_URL}/api/service-categories`, {
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

    if (!isJson) {
      return NextResponse.json(
        { error: `Backend error: ${res.status}`, message: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse response', message: 'Backend returned invalid JSON' },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to create service category', details: data.errors || null },
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
