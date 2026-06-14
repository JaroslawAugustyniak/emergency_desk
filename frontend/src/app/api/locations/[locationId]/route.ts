import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://api.starter.localhost';

export async function GET(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;

    const res = await fetch(`${API_URL}/api/locations/${locationId}`, {
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
        { error: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse response' },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;
    const body = await request.json();

    const res = await fetch(`${API_URL}/api/locations/${locationId}`, {
      method: 'PUT',
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
        { error: 'Backend returned invalid response' },
        { status: 500 }
      );
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json(
        { error: 'Failed to parse response' },
        { status: 500 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ locationId: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { locationId } = await params;

    const res = await fetch(`${API_URL}/api/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
        return NextResponse.json(data, { status: res.status });
      } catch (e) {
        return NextResponse.json(
          { error: 'Failed to delete location' },
          { status: res.status }
        );
      }
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
